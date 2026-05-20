"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  getDisplayTypeName,
  getElementDisplayName,
  type CanvasElementRow,
  type DocumentNodeRow,
  type DocumentTypeRow,
  type NodeRelationRow,
  type SystemMap,
} from "./canvasShared";
import { formatShortAuDateTime } from "./dateFormatters";
import type { MapCategoryId } from "./mapCategories";

export type MapSuggestionItem = {
  id: string;
  title: string;
  question: string;
  rationale: string;
  priority: "low" | "medium" | "high";
  category:
    | "chronology"
    | "evidence"
    | "people"
    | "factors"
    | "controls"
    | "outcomes"
    | "response"
    | "recommendations"
    | "relationships"
    | "scope"
    | "quality"
    | "other";
};

type MapSuggestionApiResponse = {
  overview: string;
  suggestions: MapSuggestionItem[];
  generatedAt?: string;
};

type PersistedMapSuggestionRunRow = {
  id: string;
  overview: string;
  created_at: string;
};

type PersistedMapSuggestionRow = {
  id: string;
  title: string;
  question: string;
  rationale: string;
  priority: "low" | "medium" | "high";
  category: MapSuggestionItem["category"];
};

type UseMapSuggestionsParams = {
  canUseSuggestionCheck: boolean;
  map: SystemMap | null;
  mapId: string;
  mapCategoryId: MapCategoryId;
  types: DocumentTypeRow[];
  nodes: DocumentNodeRow[];
  elements: CanvasElementRow[];
  relations: NodeRelationRow[];
  userId: string | null;
};

function trimSuggestionText(value: unknown, maxLength = 220) {
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}...` : text;
}

function summarizeConfigForSuggestions(config: Record<string, unknown> | null | undefined) {
  if (!config) return {};
  const summaryEntries: Array<[string, string | number | boolean | string[]]> = [];
  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === "string") {
      const normalized = trimSuggestionText(value, 180);
      if (normalized) summaryEntries.push([key, normalized]);
      return;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      summaryEntries.push([key, value]);
      return;
    }
    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => trimSuggestionText(item, 80))
        .filter(Boolean)
        .slice(0, 8);
      if (normalized.length) summaryEntries.push([key, normalized]);
    }
  });

  return Object.fromEntries(summaryEntries.slice(0, 16));
}

export function useMapSuggestions({
  canUseSuggestionCheck,
  map,
  mapId,
  mapCategoryId,
  types,
  nodes,
  elements,
  relations,
  userId,
}: UseMapSuggestionsParams) {
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionProgress, setSuggestionProgress] = useState(0);
  const [, setSuggestionOverview] = useState("");
  const [mapSuggestions, setMapSuggestions] = useState<MapSuggestionItem[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestionsLastUpdatedAt, setSuggestionsLastUpdatedAt] = useState<string | null>(null);

  const buildSuggestionSnapshot = useCallback(() => {
    const typeNameById = new Map(types.map((type) => [type.id, type.name]));
    const nodeLabelById = new Map(
      nodes.map((node) => [
        node.id,
        trimSuggestionText(node.title || getDisplayTypeName(typeNameById.get(node.type_id) || "Document"), 120) || "Document",
      ])
    );
    const elementLabelById = new Map(
      elements.map((element) => [
        element.id,
        trimSuggestionText(element.heading || getElementDisplayName(element), 120) || getElementDisplayName(element),
      ])
    );
    const countsByElementType = elements.reduce<Record<string, number>>((acc, element) => {
      acc[element.element_type] = (acc[element.element_type] ?? 0) + 1;
      return acc;
    }, {});
    const relationCountByTargetId = new Map<string, number>();
    relations.forEach((relation) => {
      [
        relation.from_node_id,
        relation.to_node_id,
        relation.source_grouping_element_id,
        relation.target_grouping_element_id,
        relation.source_system_element_id,
        relation.target_system_element_id,
      ]
        .filter(Boolean)
        .forEach((id) => relationCountByTargetId.set(id as string, (relationCountByTargetId.get(id as string) ?? 0) + 1));
    });

    return {
      map: {
        id: map?.id ?? mapId,
        title: trimSuggestionText(map?.title ?? "Untitled map", 140),
        description: trimSuggestionText(map?.description ?? "", 220),
        category: mapCategoryId,
      },
      summary: {
        document_count: nodes.length,
        element_count: elements.length,
        relation_count: relations.length,
        element_type_counts: countsByElementType,
      },
      documents: nodes.map((node) => ({
        id: node.id,
        title: trimSuggestionText(node.title, 140) || "Untitled document",
        type: trimSuggestionText(typeNameById.get(node.type_id) || "Document", 80),
        document_number: trimSuggestionText(node.document_number, 60),
        discipline: trimSuggestionText(node.discipline, 80),
        user_group: trimSuggestionText(node.user_group, 80),
        relation_count: relationCountByTargetId.get(node.id) ?? 0,
      })),
      elements: elements.map((element) => ({
        id: element.id,
        type: element.element_type,
        label: trimSuggestionText(element.heading || getElementDisplayName(element), 140) || getElementDisplayName(element),
        config: summarizeConfigForSuggestions((element.element_config as Record<string, unknown> | null) ?? null),
        relation_count: relationCountByTargetId.get(element.id) ?? 0,
      })),
      relations: relations.map((relation) => ({
        id: relation.id,
        source:
          nodeLabelById.get(relation.from_node_id || "") ||
          elementLabelById.get(relation.source_system_element_id || relation.source_grouping_element_id || "") ||
          "Unknown source",
        target:
          nodeLabelById.get(relation.to_node_id || "") ||
          elementLabelById.get(relation.target_system_element_id || relation.target_grouping_element_id || "") ||
          "Unknown target",
        relation_type: trimSuggestionText(relation.relation_type, 80),
        relationship_category: trimSuggestionText(relation.relationship_category, 80),
        custom_type: trimSuggestionText(relation.relationship_custom_type, 80),
        description: trimSuggestionText(relation.relationship_description, 180),
        disciplines: trimSuggestionText(relation.relationship_disciplines, 80),
      })),
    };
  }, [elements, map, mapCategoryId, mapId, nodes, relations, types]);

  const loadPersistedMapSuggestions = useCallback(async () => {
    if (!canUseSuggestionCheck || !mapId) {
      setSuggestionOverview("");
      setMapSuggestions([]);
      setSuggestionsLastUpdatedAt(null);
      return;
    }

    try {
      setSuggestionError(null);
      const { data: runRow, error: runError } = await supabaseBrowser
        .schema("ms")
        .from("map_suggestion_runs")
        .select("id,overview,created_at")
        .eq("map_id", mapId)
        .eq("is_current", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .returns<PersistedMapSuggestionRunRow[]>()
        .maybeSingle();

      if (runError) throw runError;

      if (!runRow?.id) {
        setSuggestionOverview("");
        setMapSuggestions([]);
        setSuggestionsLastUpdatedAt(null);
        return;
      }

      const { data: suggestionRows, error: suggestionLoadError } = await supabaseBrowser
        .schema("ms")
        .from("map_suggestions")
        .select("id,title,question,rationale,priority,category")
        .eq("map_id", mapId)
        .eq("run_id", runRow.id)
        .is("dismissed_at", null)
        .order("created_at", { ascending: true })
        .returns<PersistedMapSuggestionRow[]>();

      if (suggestionLoadError) throw suggestionLoadError;

      setSuggestionOverview(runRow.overview || "");
      setMapSuggestions((suggestionRows ?? []).map((row) => ({ ...row })));
      setSuggestionsLastUpdatedAt(formatShortAuDateTime(runRow.created_at));
    } catch (loadError) {
      setSuggestionError(loadError instanceof Error ? loadError.message : "Unable to load saved suggestions.");
    }
  }, [canUseSuggestionCheck, mapId]);

  const handleDismissMapSuggestion = useCallback(
    (suggestionId: string) => {
      void (async () => {
        try {
          setSuggestionError(null);
          const dismissedAt = new Date().toISOString();
          const { error: dismissError } = await supabaseBrowser
            .schema("ms")
            .from("map_suggestions")
            .update({
              dismissed_at: dismissedAt,
              dismissed_by_user_id: userId,
            })
            .eq("id", suggestionId)
            .eq("map_id", mapId)
            .is("dismissed_at", null);

          if (dismissError) throw dismissError;
          setMapSuggestions((prev) => prev.filter((item) => item.id !== suggestionId));
        } catch (dismissSuggestionError) {
          setSuggestionError(
            dismissSuggestionError instanceof Error
              ? dismissSuggestionError.message
              : "Unable to dismiss suggestion."
          );
        }
      })();
    },
    [mapId, userId]
  );

  const handleRunSuggestionCheck = useCallback(async () => {
    if (!canUseSuggestionCheck || !map) return;

    try {
      setIsLoadingSuggestions(true);
      setSuggestionError(null);
      setSuggestionProgress(8);
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();
      setSuggestionProgress(14);

      if (!session?.access_token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      setSuggestionProgress(22);
      const response = await fetch("/api/map-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mapId,
          mapSnapshot: buildSuggestionSnapshot(),
        }),
      });
      setSuggestionProgress(88);

      const payload = (await response.json().catch(() => null)) as
        | (MapSuggestionApiResponse & { error?: string })
        | { error?: string }
        | null;
      setSuggestionProgress(94);

      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Unable to generate suggestions."
        );
      }

      const nextSuggestions = Array.isArray((payload as MapSuggestionApiResponse | null)?.suggestions)
        ? (payload as MapSuggestionApiResponse).suggestions
        : [];

      setSuggestionOverview(
        typeof (payload as MapSuggestionApiResponse | null)?.overview === "string"
          ? (payload as MapSuggestionApiResponse).overview
          : ""
      );
      setMapSuggestions(nextSuggestions);
      setSuggestionsLastUpdatedAt(
        formatShortAuDateTime(
          typeof (payload as MapSuggestionApiResponse | null)?.generatedAt === "string"
            ? (payload as MapSuggestionApiResponse).generatedAt
            : new Date().toISOString()
        )
      );
      setSuggestionProgress(100);
    } catch (suggestionRunError) {
      setSuggestionError(
        suggestionRunError instanceof Error ? suggestionRunError.message : "Unable to generate suggestions."
      );
      setSuggestionProgress(0);
    } finally {
      window.setTimeout(() => {
        setIsLoadingSuggestions(false);
      }, 180);
    }
  }, [buildSuggestionSnapshot, canUseSuggestionCheck, map, mapId]);

  useEffect(() => {
    if (!isLoadingSuggestions) {
      if (suggestionProgress !== 100) setSuggestionProgress(0);
      return;
    }
    const timer = window.setInterval(() => {
      setSuggestionProgress((current) => {
        if (current >= 86) return current;
        if (current < 35) return Math.min(35, current + 5);
        if (current < 60) return Math.min(60, current + 2);
        if (current < 76) return Math.min(76, current + 1);
        return Math.min(86, current + 0.5);
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [isLoadingSuggestions, suggestionProgress]);

  return {
    isLoadingSuggestions,
    suggestionProgress,
    mapSuggestions,
    suggestionError,
    suggestionsLastUpdatedAt,
    loadPersistedMapSuggestions,
    handleDismissMapSuggestion,
    handleRunSuggestionCheck,
  };
}
