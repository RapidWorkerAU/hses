"use client";

import { useCallback, useMemo, useState, type RefObject } from "react";
import {
  getDisplayTypeName,
  getElementRelationshipTypeLabel,
  getNormalizedDocumentSize,
  getTypeBannerStyle,
  isLandscapeTypeName,
  type CanvasElementRow,
  type DocumentNodeRow,
  type DocumentTypeRow,
  type OutlineItemRow,
} from "./canvasShared";

type ReactFlowViewportController = {
  setViewport: (v: { x: number; y: number; zoom: number }, opts?: { duration?: number }) => void;
};

type SearchCatalogEntry = {
  id: string;
  label: string;
  documentNumber: string | null;
  kind: string;
  description: string;
  kindColor: string | null;
  kindTextColor: string | null;
  kindBorderColor: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
};

type UseCanvasSearchParams = {
  rf: ReactFlowViewportController | null;
  canvasRef: RefObject<HTMLDivElement | null>;
  types: DocumentTypeRow[];
  nodes: DocumentNodeRow[];
  elements: CanvasElementRow[];
  outlineItems: OutlineItemRow[];
};

const formatIncidentOptionLabel = (value: string) =>
  value
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");

const getSearchElementTypeLabel = (element: CanvasElementRow) => {
  if (element.element_type !== "incident_outcome") {
    return getElementRelationshipTypeLabel(element.element_type);
  }
  const cfg = (element.element_config as Record<string, unknown> | null) ?? {};
  const consequenceCategory = String(cfg.consequence_category ?? "actual").trim().toLowerCase() || "actual";
  const reportingConsequence = String(cfg.reporting_consequence ?? "").trim().toLowerCase();
  if (consequenceCategory === "maximum_reasonable") return "Potential Outcome";
  if (consequenceCategory === "actual") return "Actual Outcome";
  if (consequenceCategory === "reporting") {
    if (reportingConsequence === "externally_reported") return "External Report";
    if (reportingConsequence === "internally_reported") return "Internal Report";
    if (reportingConsequence === "reported_to_regulator") return "Regulator Report";
    if (reportingConsequence === "reported_elsewhere") return "Report Elsewhere";
    return "Reporting Outcome";
  }
  return formatIncidentOptionLabel(consequenceCategory) || "Outcome";
};

const getSearchElementTypeStyle = (element: CanvasElementRow) => {
  if (element.element_type === "grouping_container") {
    return {
      kindColor: null,
      kindTextColor: "#475569",
      kindBorderColor: "#94a3b8",
    };
  }
  if (element.color_hex) {
    return {
      kindColor: element.color_hex,
      kindTextColor: null,
      kindBorderColor: null,
    };
  }
  if (element.element_type === "incident_sequence_step") {
    return {
      kindColor: "#bfdbfe",
      kindTextColor: "#111827",
      kindBorderColor: null,
    };
  }
  if (element.element_type === "incident_task_condition") {
    return {
      kindColor: "#fb923c",
      kindTextColor: "#111827",
      kindBorderColor: null,
    };
  }
  return {
    kindColor: null,
    kindTextColor: null,
    kindBorderColor: null,
  };
};

export function useCanvasSearch({ rf, canvasRef, types, nodes, elements, outlineItems }: UseCanvasSearchParams) {
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const typesById = useMemo(() => new Map(types.map((type) => [type.id, type])), [types]);

  const searchCatalog = useMemo(() => {
    const collectConfigText = (value: unknown): string[] => {
      if (typeof value === "string") return [value];
      if (Array.isArray(value)) return value.flatMap(collectConfigText);
      if (value && typeof value === "object") return Object.values(value).flatMap(collectConfigText);
      return [];
    };
    const outlineTextByNodeId = new Map<string, string>();
    outlineItems.forEach((item) => {
      const segments = [item.title ?? "", item.content_text ?? ""].filter(Boolean);
      if (!segments.length) return;
      const current = outlineTextByNodeId.get(item.node_id) ?? "";
      outlineTextByNodeId.set(item.node_id, current ? `${current} ${segments.join(" ")}` : segments.join(" "));
    });
    const nodeEntries = nodes.map((node) => {
      const t = typesById.get(node.type_id);
      const displayTypeName = getDisplayTypeName(t?.name || "Document");
      const isLandscape = isLandscapeTypeName(t?.name || "");
      const size = getNormalizedDocumentSize(isLandscape, node.width, node.height);
      const typeBanner = getTypeBannerStyle(displayTypeName);
      return {
        id: node.id,
        label: node.title,
        documentNumber: node.document_number ?? null,
        kind: displayTypeName,
        description: outlineTextByNodeId.get(node.id) ?? "",
        kindColor: typeBanner.bg,
        kindTextColor: typeBanner.text,
        kindBorderColor: null,
        x: node.pos_x,
        y: node.pos_y,
        width: size.width,
        height: size.height,
      };
    });
    const elementEntries = elements.map((el) => {
      const kind = getSearchElementTypeLabel(el);
      const configText = collectConfigText(el.element_config).join(" ");
      const kindStyle = getSearchElementTypeStyle(el);
      return {
        id: `process:${el.id}`,
        label: el.heading || kind,
        documentNumber: null,
        kind,
        description: configText,
        kindColor: kindStyle.kindColor,
        kindTextColor: kindStyle.kindTextColor,
        kindBorderColor: kindStyle.kindBorderColor,
        x: el.pos_x,
        y: el.pos_y,
        width: el.width,
        height: el.height,
      };
    });
    return [...nodeEntries, ...elementEntries];
  }, [nodes, elements, typesById, outlineItems]);

  const searchResults = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return [];
    return searchCatalog
      .filter(
        (item) =>
          item.label.toLowerCase().includes(term) ||
          (item.documentNumber ?? "").toLowerCase().includes(term) ||
          item.kind.toLowerCase().includes(term) ||
          (item.description ?? "").toLowerCase().includes(term)
      )
      .slice(0, 100)
      .map((item) => ({
        id: item.id,
        label: item.label,
        documentNumber: item.documentNumber,
        kind: item.kind,
        description: item.description,
        kindColor: item.kindColor,
        kindTextColor: item.kindTextColor,
        kindBorderColor: item.kindBorderColor,
      }));
  }, [searchCatalog, searchQuery]);

  const handleSelectSearchResult = useCallback(
    (id: string) => {
      if (!rf) return;
      const match = searchCatalog.find((entry) => entry.id === id);
      if (!match) return;
      const centerX = match.x + match.width / 2;
      const centerY = match.y + match.height / 2;
      const viewportWidth = canvasRef.current?.clientWidth ?? window.innerWidth;
      const viewportHeight = canvasRef.current?.clientHeight ?? window.innerHeight;
      const zoom = 1.6;
      rf.setViewport(
        {
          x: viewportWidth / 2 - centerX * zoom,
          y: viewportHeight / 2 - centerY * zoom,
          zoom,
        },
        { duration: 320 }
      );
      setShowSearchMenu(false);
      setSearchQuery("");
    },
    [canvasRef, rf, searchCatalog]
  );

  return {
    showSearchMenu,
    setShowSearchMenu,
    searchQuery,
    setSearchQuery,
    searchCatalog: searchCatalog as SearchCatalogEntry[],
    searchResults,
    handleSelectSearchResult,
  };
}
