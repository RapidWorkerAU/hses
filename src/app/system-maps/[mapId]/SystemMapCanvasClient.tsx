"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  type Edge,
  Handle,
  type NodeChange,
  type Node,
  type NodeProps,
  NodeResizeControl,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";

type SystemMap = {
  id: string;
  title: string;
  description: string | null;
  updated_at: string;
  created_at: string;
};

type DocumentTypeRow = {
  id: string;
  map_id: string | null;
  name: string;
  level_rank: number;
  band_y_min: number | null;
  band_y_max: number | null;
  is_active: boolean;
};

type DocumentNodeRow = {
  id: string;
  map_id: string;
  type_id: string;
  title: string;
  discipline: string | null;
  owner_user_id: string | null;
  owner_name: string | null;
  user_group: string | null;
  pos_x: number;
  pos_y: number;
  width: number | null;
  height: number | null;
  is_archived: boolean;
};

type NodeRelationRow = {
  id: string;
  map_id: string;
  from_node_id: string;
  to_node_id: string | null;
  relation_type: string;
  relationship_description: string | null;
  target_system_element_id: string | null;
  relationship_disciplines: string[] | null;
  relationship_category: string | null;
  relationship_custom_type: string | null;
};
type CanvasElementRow = {
  id: string;
  map_id: string;
  element_type: "category" | "system_circle" | "grouping_container" | "process_component";
  heading: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
};

type OutlineItemRow = {
  id: string;
  map_id: string;
  node_id: string;
  kind: "heading" | "content";
  heading_level: 1 | 2 | 3 | null;
  parent_heading_id: string | null;
  heading_id: string | null;
  title: string | null;
  content_text: string | null;
  sort_order: number;
  created_at: string;
};

type FlowData = {
  entityKind: "document" | "category" | "system_circle" | "grouping_container" | "process_component";
  typeName: string;
  title: string;
  userGroup: string;
  disciplineKeys: string[];
  bannerBg: string;
  bannerText: string;
  isLandscape: boolean;
  isUnconfigured: boolean;
};
type DisciplineKey = "health" | "safety" | "environment" | "security" | "communities" | "training";
type RelationshipCategory = "information" | "systems" | "process" | "data" | "other";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const A4_RATIO = 1.414;
const minorGridSize = 24;
const majorGridSize = minorGridSize * 5;
const tileGridSpan = 5;
const defaultWidth = minorGridSize * tileGridSpan;
const defaultHeight = Math.round(defaultWidth * A4_RATIO);
const landscapeDefaultWidth = defaultHeight;
const landscapeDefaultHeight = defaultWidth;
const processHeadingWidth = minorGridSize * 18;
const processHeadingHeight = minorGridSize * 3;
const processMinWidth = minorGridSize * 10;
const processMinHeight = minorGridSize * 3;
const processComponentWidth = minorGridSize * 7;
const processComponentBodyHeight = minorGridSize * 3;
const processComponentLabelHeight = minorGridSize;
const processComponentElementHeight = processComponentBodyHeight + processComponentLabelHeight;
const systemCircleDiameter = minorGridSize * 5;
const systemCircleLabelHeight = minorGridSize;
const systemCircleElementHeight = systemCircleDiameter + systemCircleLabelHeight;
const groupingDefaultWidth = minorGridSize * 22;
const groupingDefaultHeight = minorGridSize * 12;
const groupingMinWidth = minorGridSize * 8;
const groupingMinHeight = minorGridSize * 6;
const unconfiguredDocumentTitle = "Click to configure";
const laneHeight = 260;
const fallbackHierarchy = [
  { name: "System Manual", level_rank: 1 },
  { name: "Policy", level_rank: 2 },
  { name: "Risk Document", level_rank: 3 },
  { name: "Management Plan", level_rank: 4 },
  { name: "Procedure", level_rank: 5 },
  { name: "Guidance Note", level_rank: 6 },
  { name: "Work Instruction", level_rank: 7 },
  { name: "Form / Template", level_rank: 8 },
  { name: "Record", level_rank: 9 },
] as const;
const fallbackRankByName = new Map(fallbackHierarchy.map((item) => [item.name.trim().toLowerCase(), item.level_rank]));
const normalizeTypeRanks = (items: DocumentTypeRow[]) =>
  items
    .map((item) => {
      const normalizedRank = fallbackRankByName.get(item.name.trim().toLowerCase());
      return normalizedRank ? { ...item, level_rank: normalizedRank } : item;
    })
    .sort((a, b) => a.level_rank - b.level_rank);

const getDisplayTypeName = (typeName: string) =>
  typeName.trim().toLowerCase() === "management system manual" ? "System Manual" : typeName;
const isLandscapeTypeName = (typeName: string) => typeName.trim().toLowerCase() === "risk document";
const getCanonicalTypeName = (typeName: string) => getDisplayTypeName(typeName).trim().toLowerCase();
const processFlowId = (id: string) => `process:${id}`;
const parseProcessFlowId = (id: string) => (id.startsWith("process:") ? id.slice(8) : id);
const isAbortLikeError = (error: unknown) => {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return normalized.includes("aborterror") || normalized.includes("signal is aborted") || normalized.includes("aborted");
};
const userGroupOptions = [
  "Group/ Corporate",
  "Business Unit/ Division",
  "Site/ Project/ Client",
  "Team/ Contractor",
  "Not Applicable",
] as const;
const disciplineOptions: Array<{ key: DisciplineKey; label: string; letter: string }> = [
  { key: "health", label: "Health", letter: "H" },
  { key: "safety", label: "Safety", letter: "S" },
  { key: "environment", label: "Environment", letter: "E" },
  { key: "security", label: "Security", letter: "S" },
  { key: "communities", label: "Communities", letter: "C" },
  { key: "training", label: "Training", letter: "T" },
];
const disciplineKeySet = new Set<DisciplineKey>(disciplineOptions.map((option) => option.key));
const disciplineLabelByKey = new Map(disciplineOptions.map((option) => [option.key, option.label]));
const disciplineLetterByKey = new Map(disciplineOptions.map((option) => [option.key, option.letter]));
const parseDisciplines = (value: string | null | undefined): DisciplineKey[] => {
  if (!value) return [];
  const normalized = value.trim().toLowerCase();
  if (!normalized) return [];
  const selected = new Set<DisciplineKey>();
  const addMatch = (token: string) => {
    const t = token.trim().toLowerCase();
    if (!t) return;
    if (t === "hset") {
      selected.add("health");
      selected.add("safety");
      selected.add("environment");
      selected.add("training");
      return;
    }
    if (t === "hse") {
      selected.add("health");
      selected.add("safety");
      selected.add("environment");
      return;
    }
    disciplineOptions.forEach((option) => {
      if (option.key === t || option.label.toLowerCase() === t) selected.add(option.key);
    });
  };
  normalized
    .split(/[;,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach(addMatch);
  if (!selected.size) addMatch(normalized);
  return disciplineOptions.filter((option) => selected.has(option.key)).map((option) => option.key);
};
const serializeDisciplines = (keys: DisciplineKey[]) => {
  if (!keys.length) return null;
  const labels = keys.map((key) => disciplineLabelByKey.get(key)).filter(Boolean) as string[];
  return labels.join(", ");
};
const disciplineSummary = (value: string | null | undefined) => {
  const keys = parseDisciplines(value);
  if (!keys.length) return "No discipline";
  return keys.map((key) => disciplineLabelByKey.get(key)).filter(Boolean).join(", ");
};
const getNormalizedDocumentSize = (
  isLandscape: boolean,
  width: number | null,
  height: number | null
) => {
  let nextWidth = width ?? (isLandscape ? landscapeDefaultWidth : defaultWidth);
  let nextHeight = height ?? Math.round(isLandscape ? nextWidth / A4_RATIO : nextWidth * A4_RATIO);
  if (isLandscape && nextHeight > nextWidth) {
    [nextWidth, nextHeight] = [nextHeight, nextWidth];
  }
  if (!isLandscape && nextWidth > nextHeight) {
    [nextWidth, nextHeight] = [nextHeight, nextWidth];
  }
  return { width: nextWidth, height: nextHeight };
};
const getDisplayRelationType = (relationType: string) => {
  if (!relationType) return "Related";
  const trimmed = relationType.trim();
  if (!trimmed) return "Related";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};
const getRelationshipCategoryLabel = (category: string | null | undefined, customType: string | null | undefined) => {
  const normalized = (category || "").trim().toLowerCase();
  if (normalized === "other") {
    const custom = (customType || "").trim();
    return custom || "Other";
  }
  if (!normalized) return "Information";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};
const getRelationshipDisciplineLetters = (disciplines: string[] | null | undefined) => {
  if (!disciplines?.length) return "";
  return disciplines
    .map((key) => disciplineLetterByKey.get(key as DisciplineKey) || "")
    .filter(Boolean)
    .join("");
};

const getTypeBannerStyle = (typeName: string) => {
  const key = typeName.toLowerCase();
  if (key.includes("manual")) return { bg: "#b91c1c", text: "#ffffff" };
  if (key.includes("policy")) return { bg: "#7e22ce", text: "#ffffff" };
  if (key.includes("management plan")) return { bg: "#1d4ed8", text: "#ffffff" };
  if (key.includes("procedure")) return { bg: "#c2410c", text: "#ffffff" };
  if (key.includes("guidance")) return { bg: "#8b5a2b", text: "#ffffff" };
  if (key.includes("work instruction")) return { bg: "#facc15", text: "#1f2937" };
  if (key.includes("form")) return { bg: "#15803d", text: "#ffffff" };
  if (key.includes("record")) return { bg: "#475569", text: "#ffffff" };
  if (key.includes("risk")) return { bg: "#0ea5a4", text: "#ffffff" };
  return { bg: "#64748b", text: "#ffffff" };
};
const boxesOverlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  gap = 0
) =>
  a.x < b.x + b.width + gap &&
  a.x + a.width + gap > b.x &&
  a.y < b.y + b.height + gap &&
  a.y + a.height + gap > b.y;
const pointInRect = (p: { x: number; y: number }, r: { x: number; y: number; width: number; height: number }) =>
  p.x > r.x && p.x < r.x + r.width && p.y > r.y && p.y < r.y + r.height;
const ccw = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) =>
  (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
const segmentsIntersect = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }) =>
  ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
const lineIntersectsRect = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
) => {
  if (pointInRect(p1, rect) || pointInRect(p2, rect)) return true;
  const tl = { x: rect.x, y: rect.y };
  const tr = { x: rect.x + rect.width, y: rect.y };
  const br = { x: rect.x + rect.width, y: rect.y + rect.height };
  const bl = { x: rect.x, y: rect.y + rect.height };
  return (
    segmentsIntersect(p1, p2, tl, tr) ||
    segmentsIntersect(p1, p2, tr, br) ||
    segmentsIntersect(p1, p2, br, bl) ||
    segmentsIntersect(p1, p2, bl, tl)
  );
};

function DocumentTileNode({ data }: NodeProps<Node<FlowData>>) {
  if (data.isUnconfigured) {
    return (
      <div className="relative flex h-full w-full items-center justify-center border border-slate-300 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
        <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <div className="text-center text-[12px] font-semibold text-slate-600">{unconfiguredDocumentTitle}</div>
      </div>
    );
  }
  return (
    <div className="relative flex h-full w-full flex-col border border-slate-300 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <div
        className="flex h-6 items-center justify-center px-1 text-center text-[7px] font-semibold uppercase tracking-[0.04em] leading-tight"
        style={{ backgroundColor: data.bannerBg, color: data.bannerText }}
      >
        <span className="block w-full truncate">{data.typeName}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-2 pt-1 pb-2">
        <div className={`overflow-hidden text-center font-semibold leading-tight text-slate-900 ${data.isLandscape ? "text-[9px]" : "text-[10px]"}`}>
          {data.title || "Untitled Document"}
        </div>
        <div className="mt-auto space-y-1 text-[8px] leading-tight">
          <div className="space-y-[1px] border border-slate-300 px-1 py-[2px]">
            <div className="text-center font-semibold text-slate-700">User Group</div>
            <div className={`${data.isLandscape ? "text-[7px]" : ""} truncate text-center text-slate-500`}>{data.userGroup || "Unassigned"}</div>
          </div>
          <div className="space-y-[1px] px-1 py-[2px]">
            <div className="text-center font-semibold text-slate-700">Discipline</div>
            <div className="mt-0.5 grid grid-cols-6 gap-[2px]">
              {disciplineOptions.map((option) => {
                const active = data.disciplineKeys.includes(option.key);
                return (
                  <div
                    key={option.key}
                    title={option.label}
                    className={`flex h-4 w-full items-center justify-center border border-slate-300 text-[8px] leading-none ${active ? "bg-emerald-200 font-bold text-emerald-900" : "bg-white font-medium text-slate-500"}`}
                  >
                    {option.letter}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function ProcessHeadingNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return (
    <div className="flex h-full w-full flex-col border border-black bg-black px-2 py-1 text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      {selected ? (
        <>
          <NodeResizeControl
            position={Position.Left}
            minWidth={processMinWidth}
            minHeight={processMinHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Right}
            minWidth={processMinWidth}
            minHeight={processMinHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={processMinWidth}
            minHeight={processMinHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div className="text-center text-[9px] font-semibold uppercase tracking-[0.18em]">Category</div>
      <div className="flex flex-1 items-center justify-center overflow-hidden text-center text-[12px] font-semibold leading-tight">
        <span className="line-clamp-3 break-words whitespace-normal">{data.title || "New Category"}</span>
      </div>
    </div>
  );
}
function SystemCircleNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start overflow-hidden">
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <div
        className="flex w-full items-center justify-center rounded-full bg-[#1e3a8a] px-2 text-center text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(30,58,138,0.35)]"
        style={{ height: systemCircleDiameter }}
      >
        <span className="line-clamp-3">{data.title || "System Name"}</span>
      </div>
      <div
        className="flex w-full items-center justify-center text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700"
        style={{ height: systemCircleLabelHeight }}
      >
        System
      </div>
    </div>
  );
}
function ProcessComponentNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start overflow-hidden">
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <div className="relative w-full" style={{ height: processComponentBodyHeight }}>
        <svg viewBox="0 0 700 500" preserveAspectRatio="none" className="h-full w-full drop-shadow-[0_6px_16px_rgba(15,23,42,0.18)]">
          <path
            d="M0 0H700V500C640 458 560 450 486 485C435 510 389 509 338 484C260 447 186 446 112 479C74 496 37 503 0 500V0Z"
            fill="#ff751f"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-center text-[11px] font-semibold text-white">
          {data.title || "Process"}
        </div>
      </div>
      <div
        className="flex w-full items-center justify-center text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700"
        style={{ height: processComponentLabelHeight }}
      >
        Process
      </div>
    </div>
  );
}
function GroupingContainerNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return (
    <div
      className="relative h-full w-full rounded-[10px] border bg-transparent"
      style={{
        borderColor: "#000000",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.12)",
      }}
    >
      {selected ? (
        <>
          <NodeResizeControl
            position={Position.Right}
            minWidth={groupingMinWidth}
            minHeight={groupingMinHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={groupingMinWidth}
            minHeight={groupingMinHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div
        className="absolute left-5 top-0 -translate-y-1/2 rounded-[999px] border bg-white px-3 py-0.5 text-center text-[11px] font-normal text-slate-800 whitespace-nowrap"
        style={{
          borderColor: "#000000",
          boxShadow: "0 3px 8px rgba(15, 23, 42, 0.12)",
        }}
      >
        {data.title || "Group label"}
      </div>
    </div>
  );
}
const flowNodeTypes = {
  documentTile: DocumentTileNode,
  processHeading: ProcessHeadingNode,
  systemCircle: SystemCircleNode,
  processComponent: ProcessComponentNode,
  groupingContainer: GroupingContainerNode,
} as const;

function SystemMapCanvasInner({ mapId }: { mapId: string }) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const relationshipPopupRef = useRef<HTMLDivElement | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const disciplineMenuRef = useRef<HTMLDivElement | null>(null);
  const saveViewportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizePersistTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const resizePersistValuesRef = useRef<Map<string, { width: number; height: number }>>(new Map());
  const savedPos = useRef<Record<string, { x: number; y: number }>>({});
  const lastMobileTapRef = useRef<{ id: string; ts: number } | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [map, setMap] = useState<SystemMap | null>(null);
  const [types, setTypes] = useState<DocumentTypeRow[]>([]);
  const [nodes, setNodes] = useState<DocumentNodeRow[]>([]);
  const [elements, setElements] = useState<CanvasElementRow[]>([]);
  const [relations, setRelations] = useState<NodeRelationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isEditingMapTitle, setIsEditingMapTitle] = useState(false);
  const [mapTitleDraft, setMapTitleDraft] = useState("");
  const [savingMapTitle, setSavingMapTitle] = useState(false);

  const [rf, setRf] = useState<{
    fitView: (opts?: { duration?: number; padding?: number }) => void;
    screenToFlowPosition: (pt: { x: number; y: number }) => { x: number; y: number };
    setViewport: (v: Viewport, opts?: { duration?: number }) => void;
  } | null>(null);
  const [pendingViewport, setPendingViewport] = useState<Viewport | null>(null);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const snapToMinorGrid = useCallback((v: number) => Math.round(v / minorGridSize) * minorGridSize, []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedProcessComponentId, setSelectedProcessComponentId] = useState<string | null>(null);
  const [selectedGroupingId, setSelectedGroupingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [disciplineSelection, setDisciplineSelection] = useState<DisciplineKey[]>([]);
  const [showDisciplineMenu, setShowDisciplineMenu] = useState(false);
  const [showTypeSelectArrowUp, setShowTypeSelectArrowUp] = useState(false);
  const [showUserGroupSelectArrowUp, setShowUserGroupSelectArrowUp] = useState(false);
  const [userGroup, setUserGroup] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [processHeadingDraft, setProcessHeadingDraft] = useState("");
  const [processWidthDraft, setProcessWidthDraft] = useState<number>(Math.round(processHeadingWidth / minorGridSize));
  const [processHeightDraft, setProcessHeightDraft] = useState<number>(Math.round(processHeadingHeight / minorGridSize));
  const [processComponentLabelDraft, setProcessComponentLabelDraft] = useState("");
  const [systemNameDraft, setSystemNameDraft] = useState("");
  const [groupingLabelDraft, setGroupingLabelDraft] = useState("");
  const [groupingWidthDraft, setGroupingWidthDraft] = useState<number>(Math.round(groupingDefaultWidth / minorGridSize));
  const [groupingHeightDraft, setGroupingHeightDraft] = useState<number>(Math.round(groupingDefaultHeight / minorGridSize));

  const [desktopNodeAction, setDesktopNodeAction] = useState<"relationship" | "structure" | "delete" | null>(null);
  const [mobileNodeMenuId, setMobileNodeMenuId] = useState<string | null>(null);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [relationshipSourceNodeId, setRelationshipSourceNodeId] = useState<string | null>(null);
  const [relationshipDocumentQuery, setRelationshipDocumentQuery] = useState("");
  const [relationshipSystemQuery, setRelationshipSystemQuery] = useState("");
  const [relationshipTargetDocumentId, setRelationshipTargetDocumentId] = useState("");
  const [relationshipTargetSystemId, setRelationshipTargetSystemId] = useState("");
  const [showRelationshipDocumentOptions, setShowRelationshipDocumentOptions] = useState(false);
  const [showRelationshipSystemOptions, setShowRelationshipSystemOptions] = useState(false);
  const [relationshipDescription, setRelationshipDescription] = useState("");
  const [relationshipDisciplineSelection, setRelationshipDisciplineSelection] = useState<DisciplineKey[]>([]);
  const [showRelationshipDisciplineMenu, setShowRelationshipDisciplineMenu] = useState(false);
  const [relationshipCategory, setRelationshipCategory] = useState<RelationshipCategory>("information");
  const [relationshipCustomType, setRelationshipCustomType] = useState("");
  const [editingRelationId, setEditingRelationId] = useState<string | null>(null);
  const [editingRelationDescription, setEditingRelationDescription] = useState("");
  const [editingRelationCategory, setEditingRelationCategory] = useState<RelationshipCategory>("information");
  const [editingRelationCustomType, setEditingRelationCustomType] = useState("");
  const [editingRelationDisciplines, setEditingRelationDisciplines] = useState<DisciplineKey[]>([]);
  const [showEditingRelationDisciplineMenu, setShowEditingRelationDisciplineMenu] = useState(false);
  const [confirmDeleteNodeId, setConfirmDeleteNodeId] = useState<string | null>(null);
  const [outlineNodeId, setOutlineNodeId] = useState<string | null>(null);
  const [outlineItems, setOutlineItems] = useState<OutlineItemRow[]>([]);
  const [outlineCreateMode, setOutlineCreateMode] = useState<"heading" | "content" | null>(null);
  const [outlineEditItemId, setOutlineEditItemId] = useState<string | null>(null);
  const [confirmDeleteOutlineItemId, setConfirmDeleteOutlineItemId] = useState<string | null>(null);
  const [relationshipPopup, setRelationshipPopup] = useState<{
    x: number;
    y: number;
    fromLabel: string;
    toLabel: string;
    relationLabel: string;
    relationshipType: string;
    disciplines: string;
    description: string;
  } | null>(null);
  const [collapsedHeadingIds, setCollapsedHeadingIds] = useState<Set<string>>(new Set());
  const [newHeadingTitle, setNewHeadingTitle] = useState("");
  const [newHeadingLevel, setNewHeadingLevel] = useState<1 | 2 | 3>(1);
  const [newHeadingParentId, setNewHeadingParentId] = useState("");
  const [newContentHeadingId, setNewContentHeadingId] = useState("");
  const [newContentText, setNewContentText] = useState("");
  const [editHeadingTitle, setEditHeadingTitle] = useState("");
  const [editHeadingLevel, setEditHeadingLevel] = useState<1 | 2 | 3>(1);
  const [editHeadingParentId, setEditHeadingParentId] = useState("");
  const [editContentHeadingId, setEditContentHeadingId] = useState("");
  const [editContentText, setEditContentText] = useState("");

  const typesById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);
  const addDocumentTypes = useMemo(() => {
    const grouped = new Map<string, DocumentTypeRow[]>();
    types.forEach((t) => {
      const key = `${getCanonicalTypeName(t.name)}::${t.level_rank}`;
      const bucket = grouped.get(key);
      if (bucket) bucket.push(t);
      else grouped.set(key, [t]);
    });
    return [...grouped.values()]
      .map((bucket) => {
        bucket.sort((a, b) => {
          const aCanonical = getCanonicalTypeName(a.name) === a.name.trim().toLowerCase() ? 1 : 0;
          const bCanonical = getCanonicalTypeName(b.name) === b.name.trim().toLowerCase() ? 1 : 0;
          if (aCanonical !== bCanonical) return bCanonical - aCanonical;
          const aMapSpecific = a.map_id === mapId ? 1 : 0;
          const bMapSpecific = b.map_id === mapId ? 1 : 0;
          if (aMapSpecific !== bMapSpecific) return bMapSpecific - aMapSpecific;
          return a.name.localeCompare(b.name);
        });
        return bucket[0];
      })
      .sort((a, b) => a.level_rank - b.level_rank || getDisplayTypeName(a.name).localeCompare(getDisplayTypeName(b.name)));
  }, [types, mapId]);

  const ranks = useMemo(() => {
    const values = new Set<number>();
    nodes.forEach((n) => {
      const t = typesById.get(n.type_id);
      if (t) values.add(t.level_rank);
    });
    if (!values.size) types.forEach((t) => values.add(t.level_rank));
    return [...values].sort((a, b) => a - b);
  }, [nodes, types, typesById]);

  const rankLane = useMemo(() => {
    const m = new Map<number, { min: number; max: number }>();
    ranks.forEach((rank, i) => {
      m.set(rank, { min: i * laneHeight + 20, max: i * laneHeight + laneHeight - 20 });
    });
    return m;
  }, [ranks]);

  const getClampRange = useCallback((typeId: string) => {
    const t = typesById.get(typeId);
    if (!t) return { min: 0, max: 3000 };
    if (t.band_y_min !== null || t.band_y_max !== null) {
      return { min: t.band_y_min ?? 0, max: t.band_y_max ?? 3000 };
    }
    return rankLane.get(t.level_rank) ?? { min: 0, max: 3000 };
  }, [typesById, rankLane]);
  const getNodeSize = useCallback((node: DocumentNodeRow) => {
    const rawTypeName = typesById.get(node.type_id)?.name ?? "Document";
    const isLandscape = isLandscapeTypeName(rawTypeName);
    return getNormalizedDocumentSize(isLandscape, node.width, node.height);
  }, [typesById]);
  const findNearestFreePosition = useCallback((nodeId: string, startX: number, startY: number) => {
    const movingNode = nodes.find((n) => n.id === nodeId);
    if (!movingNode) return null;
    const movingSize = getNodeSize(movingNode);
    const occupied = nodes
      .filter((n) => n.id !== nodeId)
      .map((n) => {
        const size = getNodeSize(n);
        return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
      });

    const isFree = (x: number, y: number) =>
      !occupied.some((box) =>
        boxesOverlap(
          { x, y, width: movingSize.width, height: movingSize.height },
          box,
          4
        )
      );

    if (isFree(startX, startY)) return { x: startX, y: startY };

    const step = minorGridSize;
    const maxRing = 120;
    for (let ring = 1; ring <= maxRing; ring += 1) {
      for (let dx = -ring; dx <= ring; dx += 1) {
        for (let dy = -ring; dy <= ring; dy += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const x = snapToMinorGrid(startX + dx * step);
          const y = snapToMinorGrid(startY + dy * step);
          if (isFree(x, y)) return { x, y };
        }
      }
    }
    return null;
  }, [nodes, getNodeSize, snapToMinorGrid]);

  const [flowNodes, setFlowNodes, onFlowNodesChange] = useNodesState<Node<FlowData>>([]);
  const handleFlowNodesChange = useCallback((changes: NodeChange<Node<FlowData>>[]) => {
    onFlowNodesChange(changes);
    const dimensionChanges = changes.filter((c) => {
      const change = c as { type?: string; id?: string; dimensions?: { width: number; height: number } };
      return change.type === "dimensions" && typeof change.id === "string" && change.id.startsWith("process:") && !!change.dimensions;
    }) as Array<{ id: string; dimensions: { width: number; height: number } }>;
    if (!dimensionChanges.length) return;

    const nextSizes = new Map<string, { width: number; height: number }>();
    dimensionChanges.forEach((change) => {
      const elementId = parseProcessFlowId(change.id);
      const current = elements.find((el) => el.id === elementId);
      if (!current) return;
      if (current.element_type === "category") {
        const width = Math.max(processMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(processMinHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(processMinWidth, snapToMinorGrid(current.width || processHeadingWidth));
        const currentHeight = Math.max(processMinHeight, snapToMinorGrid(current.height || processHeadingHeight));
        if (width !== currentWidth || height !== currentHeight) nextSizes.set(elementId, { width, height });
        return;
      }
      if (current.element_type === "grouping_container") {
        const width = Math.max(groupingMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(groupingMinHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(groupingMinWidth, snapToMinorGrid(current.width || groupingDefaultWidth));
        const currentHeight = Math.max(groupingMinHeight, snapToMinorGrid(current.height || groupingDefaultHeight));
        if (width !== currentWidth || height !== currentHeight) nextSizes.set(elementId, { width, height });
      }
    });
    if (!nextSizes.size) return;

    setElements((prev) =>
      prev.map((el) =>
        nextSizes.has(el.id)
          ? {
              ...el,
              width: nextSizes.get(el.id)!.width,
              height: nextSizes.get(el.id)!.height,
            }
          : el
      )
    );

    nextSizes.forEach((size, elementId) => {
      resizePersistValuesRef.current.set(elementId, size);
      const existing = resizePersistTimersRef.current.get(elementId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        const queued = resizePersistValuesRef.current.get(elementId);
        if (!queued) return;
        const { error: e } = await supabaseBrowser
          .schema("ms")
          .from("canvas_elements")
          .update({ width: queued.width, height: queued.height })
          .eq("id", elementId)
          .eq("map_id", mapId);
        if (e && !isAbortLikeError(e)) setError(e.message || "Unable to save component size.");
        resizePersistTimersRef.current.delete(elementId);
      }, 220);
      resizePersistTimersRef.current.set(elementId, timer);
    });
  }, [onFlowNodesChange, elements, mapId, snapToMinorGrid]);

  useEffect(() => {
    return () => {
      resizePersistTimersRef.current.forEach((timer) => clearTimeout(timer));
      resizePersistTimersRef.current.clear();
      resizePersistValuesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    setFlowNodes(
      [
        ...elements
          .filter((el) => el.element_type === "grouping_container")
          .map((el) => ({
            id: processFlowId(el.id),
            type: "groupingContainer",
            position: { x: el.pos_x, y: el.pos_y },
            zIndex: 1,
            style: {
              width: Math.max(groupingMinWidth, el.width || groupingDefaultWidth),
              height: Math.max(groupingMinHeight, el.height || groupingDefaultHeight),
              borderRadius: 0,
              border: "none",
              background: "transparent",
              boxShadow: "none",
              padding: 0,
              overflow: "visible",
            },
            data: {
              entityKind: "grouping_container" as const,
              typeName: "Grouping Container",
              title: el.heading ?? "Group label",
              userGroup: "",
              disciplineKeys: [],
              bannerBg: "#ffffff",
              bannerText: "#111827",
              isLandscape: true,
              isUnconfigured: false,
            },
          })),
        ...nodes.map((n) => {
          const rawTypeName = typesById.get(n.type_id)?.name ?? "Document";
          const isLandscape = isLandscapeTypeName(rawTypeName);
          const { width, height } = getNodeSize(n);
          const typeName = getDisplayTypeName(rawTypeName);
          const banner = getTypeBannerStyle(typeName);
          return {
            id: n.id,
            type: "documentTile",
            position: { x: n.pos_x, y: n.pos_y },
            zIndex: 20,
            style: {
              width,
              height,
              borderRadius: 0,
              border: "none",
              background: "transparent",
              boxShadow: "none",
              padding: 0,
              overflow: "hidden",
            },
            data: {
              entityKind: "document" as const,
              typeName,
              title: n.title ?? "",
              userGroup: n.user_group ?? "",
              disciplineKeys: parseDisciplines(n.discipline),
              bannerBg: banner.bg,
              bannerText: banner.text,
              isLandscape,
              isUnconfigured: (n.title ?? "").trim().toLowerCase() === unconfiguredDocumentTitle.toLowerCase(),
            },
          };
        }),
        ...elements.map((el) =>
          el.element_type === "grouping_container"
            ? null
            : el.element_type === "process_component"
            ? {
                id: processFlowId(el.id),
                type: "processComponent",
                position: { x: el.pos_x, y: el.pos_y },
                zIndex: 30,
                style: {
                  width: processComponentWidth,
                  height: processComponentElementHeight,
                  borderRadius: 0,
                  border: "none",
                  background: "transparent",
                  boxShadow: "none",
                  padding: 0,
                  overflow: "visible",
                },
                data: {
                  entityKind: "process_component" as const,
                  typeName: "Process",
                  title: el.heading ?? "Process",
                  userGroup: "",
                  disciplineKeys: [],
                  bannerBg: "#8ca8d6",
                  bannerText: "#ffffff",
                  isLandscape: true,
                  isUnconfigured: false,
                },
              }
            : el.element_type === "system_circle"
            ? {
                id: processFlowId(el.id),
                type: "systemCircle",
                position: { x: el.pos_x, y: el.pos_y },
                zIndex: 30,
                style: {
                  width: systemCircleDiameter,
                  height: systemCircleElementHeight,
                  borderRadius: 0,
                  border: "none",
                  background: "transparent",
                  boxShadow: "none",
                  padding: 0,
                  overflow: "visible",
                },
                data: {
                  entityKind: "system_circle" as const,
                  typeName: "System",
                  title: el.heading ?? "System Name",
                  userGroup: "",
                  disciplineKeys: [],
                  bannerBg: "#1e3a8a",
                  bannerText: "#ffffff",
                  isLandscape: true,
                  isUnconfigured: false,
                },
              }
            : {
                id: processFlowId(el.id),
                type: "processHeading",
                position: { x: el.pos_x, y: el.pos_y },
                zIndex: 30,
                style: {
                  width: Math.max(processMinWidth, el.width || processHeadingWidth),
                  height: el.height || processHeadingHeight,
                  borderRadius: 0,
                  border: "none",
                  background: "transparent",
                  boxShadow: "none",
                  padding: 0,
                  overflow: "hidden",
                },
                data: {
                  entityKind: "category" as const,
                  typeName: "Category",
                  title: el.heading ?? "New Category",
                  userGroup: "",
                  disciplineKeys: [],
                  bannerBg: "#000000",
                  bannerText: "#ffffff",
                  isLandscape: true,
                  isUnconfigured: false,
                },
              }
        ).filter(Boolean) as Node<FlowData>[],
      ]
    );
  }, [nodes, elements, typesById, setFlowNodes, getNodeSize]);

  const flowEdges = useMemo<Edge[]>(
    () => {
      const nodesById = new Map(nodes.map((n) => [n.id, n]));
      const systemElementsById = new Map(elements.filter((el) => el.element_type === "system_circle").map((el) => [el.id, el]));
      const hasHoveredRelations = !!hoveredNodeId && relations.some((rel) => rel.from_node_id === hoveredNodeId || rel.to_node_id === hoveredNodeId);
      return relations.map((r) => {
        const sourceDoc = nodesById.get(r.from_node_id);
        const targetDoc = r.to_node_id ? nodesById.get(r.to_node_id) : undefined;
        const targetSystem = r.target_system_element_id ? systemElementsById.get(r.target_system_element_id) : undefined;
        if (!sourceDoc || (!targetDoc && !targetSystem)) return null;
        const from = nodesById.get(r.from_node_id);
        const to = r.to_node_id ? nodesById.get(r.to_node_id) : undefined;
        let source = r.from_node_id;
        let target = r.to_node_id ?? "";
        let sourceHandle = "bottom";
        let targetHandle = "top";

        if (from && to) {
          const getAnchors = (node: DocumentNodeRow) => {
            const { width, height } = getNodeSize(node);
            const left = node.pos_x;
            const top = node.pos_y;
            return {
              top: { x: left + width / 2, y: top },
              bottom: { x: left + width / 2, y: top + height },
              left: { x: left, y: top + height / 2 },
              right: { x: left + width, y: top + height / 2 },
            };
          };
          const sourceSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
            top: "top-source",
            bottom: "bottom",
            left: "left",
            right: "right",
          };
          const targetSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
            top: "top",
            bottom: "bottom-target",
            left: "left-target",
            right: "right-target",
          };
          const blockingRects = nodes
            .filter((n) => n.id !== from.id && n.id !== to.id)
            .map((n) => {
              const size = getNodeSize(n);
              return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
            });
          const pickClosest = (srcNode: DocumentNodeRow, dstNode: DocumentNodeRow) => {
            const srcAnchors = getAnchors(srcNode);
            const dstAnchors = getAnchors(dstNode);
            const sides: Array<"top" | "bottom" | "left" | "right"> = ["top", "bottom", "left", "right"];
            let best: { sourceHandle: string; targetHandle: string; score: number; dist2: number } | null = null;
            for (const srcSide of sides) {
              for (const dstSide of sides) {
                const srcAnchor = srcAnchors[srcSide];
                const dstAnchor = dstAnchors[dstSide];
                const dx = srcAnchor.x - dstAnchor.x;
                const dy = srcAnchor.y - dstAnchor.y;
                const dist2 = dx * dx + dy * dy;
                const crossesOtherNode = blockingRects.some((rect) => lineIntersectsRect(srcAnchor, dstAnchor, rect));
                const score = dist2 + (crossesOtherNode ? 1_000_000_000 : 0);
                if (!best || score < best.score) {
                  best = {
                    sourceHandle: sourceSideToHandle[srcSide],
                    targetHandle: targetSideToHandle[dstSide],
                    score,
                    dist2,
                  };
                }
              }
            }
            return best!;
          };

          const forward = pickClosest(from, to);
          const reverse = pickClosest(to, from);
          if (reverse.dist2 < forward.dist2) {
            source = to.id;
            target = from.id;
            sourceHandle = reverse.sourceHandle;
            targetHandle = reverse.targetHandle;
          } else {
            source = from.id;
            target = to.id;
            sourceHandle = forward.sourceHandle;
            targetHandle = forward.targetHandle;
          }
        }
        if (from && targetSystem) {
          target = processFlowId(targetSystem.id);
          const fromSize = getNodeSize(from);
          const fromCenterX = from.pos_x + fromSize.width / 2;
          const fromCenterY = from.pos_y + fromSize.height / 2;
          const toCenterX = targetSystem.pos_x + systemCircleDiameter / 2;
          const toCenterY = targetSystem.pos_y + systemCircleDiameter / 2;
          const dx = toCenterX - fromCenterX;
          const dy = toCenterY - fromCenterY;
          if (Math.abs(dx) > Math.abs(dy)) {
            sourceHandle = dx > 0 ? "right" : "left";
            targetHandle = dx > 0 ? "left-target" : "right-target";
          } else {
            sourceHandle = dy > 0 ? "bottom" : "top-source";
            targetHandle = dy > 0 ? "top" : "bottom-target";
          }
        }

        const isConnectedToHovered = hoveredNodeId ? (r.from_node_id === hoveredNodeId || r.to_node_id === hoveredNodeId) : false;
        const edgeStroke = hasHoveredRelations ? (isConnectedToHovered ? "#0f766e" : "#cbd5e1") : "#0f766e";
        const edgeWidth = hasHoveredRelations ? (isConnectedToHovered ? 1.8 : 1.1) : 1.25;
        const edgeLabelColor = hasHoveredRelations ? (isConnectedToHovered ? "#334155" : "#94a3b8") : "#334155";
        const relationLabel = getDisplayRelationType(r.relation_type);
        const relationshipTypeLabel = getRelationshipCategoryLabel(r.relationship_category, r.relationship_custom_type);
        const disciplinesLabel = getRelationshipDisciplineLetters(r.relationship_disciplines);
        const edgeLabel = `${relationLabel} - [${relationshipTypeLabel}${disciplinesLabel ? ` - ${disciplinesLabel}` : ""}]`;

        return {
          id: r.id,
          source,
          target,
          sourceHandle,
          targetHandle,
          type: "smoothstep",
          label: edgeLabel,
          style: { stroke: edgeStroke, strokeWidth: edgeWidth },
          labelStyle: { fill: edgeLabelColor, fontSize: 11 },
        };
      }).filter(Boolean) as Edge[];
    },
    [relations, nodes, elements, hoveredNodeId, getNodeSize]
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [selectedNodeId, nodes]
  );
  const selectedProcess = useMemo(
    () => (selectedProcessId ? elements.find((el) => el.id === selectedProcessId && el.element_type === "category") ?? null : null),
    [selectedProcessId, elements]
  );
  const selectedSystem = useMemo(
    () => (selectedSystemId ? elements.find((el) => el.id === selectedSystemId && el.element_type === "system_circle") ?? null : null),
    [selectedSystemId, elements]
  );
  const selectedProcessComponent = useMemo(
    () => (selectedProcessComponentId ? elements.find((el) => el.id === selectedProcessComponentId && el.element_type === "process_component") ?? null : null),
    [selectedProcessComponentId, elements]
  );
  const selectedGrouping = useMemo(
    () => (selectedGroupingId ? elements.find((el) => el.id === selectedGroupingId && el.element_type === "grouping_container") ?? null : null),
    [selectedGroupingId, elements]
  );

  const headingItems = useMemo(
    () => outlineItems.filter((i) => i.kind === "heading"),
    [outlineItems]
  );
  const level1Headings = useMemo(
    () => headingItems.filter((h) => h.heading_level === 1),
    [headingItems]
  );
  const level2Headings = useMemo(
    () => headingItems.filter((h) => h.heading_level === 2),
    [headingItems]
  );
  const headingById = useMemo(
    () => new Map(headingItems.map((h) => [h.id, h])),
    [headingItems]
  );
  const outlineEditItem = useMemo(
    () => (outlineEditItemId ? outlineItems.find((i) => i.id === outlineEditItemId) ?? null : null),
    [outlineEditItemId, outlineItems]
  );

  const hasCollapsedAncestor = useCallback((headingId: string | null) => {
    let current = headingId;
    while (current) {
      if (collapsedHeadingIds.has(current)) return true;
      current = headingById.get(current)?.parent_heading_id ?? null;
    }
    return false;
  }, [collapsedHeadingIds, headingById]);

  const visibleOutlineItems = useMemo(() => {
    return outlineItems.filter((item) => {
      if (item.kind === "heading") {
        if (item.heading_level === 1) return true;
        return !hasCollapsedAncestor(item.parent_heading_id);
      }
      return !hasCollapsedAncestor(item.heading_id);
    });
  }, [outlineItems, hasCollapsedAncestor]);
  const shouldShowDesktopStructurePanel =
    !isMobile && !!selectedNodeId && desktopNodeAction === "structure" && !!outlineNodeId && outlineNodeId === selectedNodeId;

  const loadOutline = useCallback(async (nodeId: string) => {
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("document_outline_items")
      .select("id,map_id,node_id,kind,heading_level,parent_heading_id,heading_id,title,content_text,sort_order,created_at")
      .eq("node_id", nodeId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (e) {
      setError(e.message || "Unable to load outline.");
      return;
    }
    setOutlineItems((data ?? []) as OutlineItemRow[]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const run = async (attempt: number) => {
      if (cancelled) return;
      if (attempt === 0) {
        setLoading(true);
        setError(null);
      }
      try {
        const user = await ensurePortalSupabaseUser();
        if (cancelled) return;
        if (!user) {
          window.location.assign(`/login?returnTo=${encodeURIComponent(`/system-maps/${mapId}`)}`);
          return;
        }
        setUserId(user.id);

        const [mapRes, typeRes, nodeRes, elementRes, relRes, viewRes] = await Promise.all([
          supabaseBrowser.schema("ms").from("system_maps").select("id,title,description,updated_at,created_at").eq("id", mapId).maybeSingle(),
          supabaseBrowser.schema("ms").from("document_types").select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active").eq("is_active", true).or(`map_id.eq.${mapId},map_id.is.null`).order("level_rank", { ascending: true }),
          supabaseBrowser.schema("ms").from("document_nodes").select("id,map_id,type_id,title,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived").eq("map_id", mapId).eq("is_archived", false),
          supabaseBrowser.schema("ms").from("canvas_elements").select("id,map_id,element_type,heading,pos_x,pos_y,width,height,created_at,updated_at").eq("map_id", mapId).order("created_at", { ascending: true }),
          supabaseBrowser
            .schema("ms")
            .from("node_relations")
            .select("id,map_id,from_node_id,to_node_id,relation_type,relationship_description,target_system_element_id,relationship_disciplines,relationship_category,relationship_custom_type")
            .eq("map_id", mapId),
          supabaseBrowser.schema("ms").from("map_view_state").select("pan_x,pan_y,zoom").eq("map_id", mapId).eq("user_id", user.id).maybeSingle(),
        ]);
        if (cancelled) return;

        if (mapRes.error || !mapRes.data) {
          setError("Unable to load this map. You may not have access.");
          return;
        }
        if (nodeRes.error) {
          setError("Unable to load map documents.");
          return;
        }

        setMap(mapRes.data as SystemMap);
        let loadedTypes = (typeRes.data ?? []) as DocumentTypeRow[];
        if (!loadedTypes.length) {
          const { data: createdTypes, error: createTypesError } = await supabaseBrowser
            .schema("ms")
            .from("document_types")
            .insert(
              fallbackHierarchy.map((item) => ({
                map_id: mapId,
                name: item.name,
                level_rank: item.level_rank,
                band_y_min: null,
                band_y_max: null,
                is_active: true,
              }))
            )
            .select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active")
            .order("level_rank", { ascending: true });
          if (createTypesError) {
            setError(createTypesError.message || "No document types were found for this map.");
          } else {
            loadedTypes = (createdTypes ?? []) as DocumentTypeRow[];
          }
        }
        const existingCanonicalTypeNames = new Set(loadedTypes.map((t) => getCanonicalTypeName(t.name)));
        const missingFallback = fallbackHierarchy.filter((item) => !existingCanonicalTypeNames.has(getCanonicalTypeName(item.name)));
        if (missingFallback.length) {
          const { data: insertedMissing, error: insertMissingError } = await supabaseBrowser
            .schema("ms")
            .from("document_types")
            .insert(
              missingFallback.map((item) => ({
                map_id: mapId,
                name: item.name,
                level_rank: item.level_rank,
                band_y_min: null,
                band_y_max: null,
                is_active: true,
              }))
            )
            .select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active");
          if (insertMissingError) {
            setError(insertMissingError.message || "Unable to add missing document types.");
          } else if (insertedMissing?.length) {
            loadedTypes = [...loadedTypes, ...(insertedMissing as DocumentTypeRow[])].sort((a, b) => a.level_rank - b.level_rank);
          }
        }
        loadedTypes = normalizeTypeRanks(loadedTypes);
        setTypes(loadedTypes);
        const loadedNodes = (nodeRes.data ?? []) as DocumentNodeRow[];
        setNodes(loadedNodes);
        setElements((elementRes.data ?? []) as CanvasElementRow[]);
        setRelations((relRes.data ?? []) as NodeRelationRow[]);
        const nextSaved: Record<string, { x: number; y: number }> = {};
        loadedNodes.forEach((n) => (nextSaved[n.id] = { x: n.pos_x, y: n.pos_y }));
        savedPos.current = nextSaved;

        if (viewRes.data) {
          const viewData = viewRes.data;
          setPendingViewport({ x: viewData.pan_x, y: viewData.pan_y, zoom: viewData.zoom });
        }
      } catch (err) {
        if (cancelled) return;
        if (isAbortLikeError(err) && attempt < 3) {
          retryTimer = setTimeout(() => {
            void run(attempt + 1);
          }, 250);
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Unable to load map.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run(0);
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [mapId]);

  useEffect(() => {
    if (!rf || !pendingViewport) return;
    rf.setViewport(pendingViewport, { duration: 250 });
    setPendingViewport(null);
  }, [rf, pendingViewport]);

  useEffect(() => {
    if (!selectedNode) return;
    setTitle(selectedNode.title ?? "");
    setSelectedTypeId(selectedNode.type_id ?? "");
    setDisciplineSelection(parseDisciplines(selectedNode.discipline));
    setUserGroup(selectedNode.user_group ?? "");
    setOwnerName(selectedNode.owner_name ?? "");
  }, [selectedNode]);
  useEffect(() => {
    if (!selectedNodeId) setShowDisciplineMenu(false);
    if (!selectedNodeId) setDesktopNodeAction(null);
  }, [selectedNodeId]);
  useEffect(() => {
    if (!selectedProcess) return;
    setProcessHeadingDraft(selectedProcess.heading ?? "");
    setProcessWidthDraft(Math.max(10, Math.round((selectedProcess.width || processHeadingWidth) / minorGridSize)));
    setProcessHeightDraft(Math.max(3, Math.round((selectedProcess.height || processHeadingHeight) / minorGridSize)));
  }, [selectedProcess]);
  useEffect(() => {
    if (!selectedSystem) return;
    setSystemNameDraft(selectedSystem.heading ?? "");
  }, [selectedSystem]);
  useEffect(() => {
    if (!selectedProcessComponent) return;
    setProcessComponentLabelDraft(selectedProcessComponent.heading ?? "");
  }, [selectedProcessComponent]);
  useEffect(() => {
    if (!selectedGrouping) return;
    setGroupingLabelDraft(selectedGrouping.heading ?? "");
    setGroupingWidthDraft(Math.max(1, Math.round((selectedGrouping.width || groupingDefaultWidth) / minorGridSize)));
    setGroupingHeightDraft(Math.max(1, Math.round((selectedGrouping.height || groupingDefaultHeight) / minorGridSize)));
  }, [selectedGrouping]);

  useEffect(() => {
    if (!map) return;
    setMapTitleDraft(map.title);
  }, [map]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as globalThis.Node | null;
      if (addMenuRef.current && target && addMenuRef.current.contains(target)) return;
      setShowAddMenu(false);
      if (disciplineMenuRef.current && target && disciplineMenuRef.current.contains(target)) return;
      setShowDisciplineMenu(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const apply = () => setIsMobile(mq.matches || window.innerWidth <= 768);
    apply();
    const handleResize = () => apply();
    window.addEventListener("resize", handleResize);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => {
        mq.removeEventListener("change", apply);
        window.removeEventListener("resize", handleResize);
      };
    }
    mq.addListener(apply);
    return () => {
      mq.removeListener(apply);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (outlineNodeId) return;
    setOutlineCreateMode(null);
    setOutlineEditItemId(null);
    setEditHeadingTitle("");
    setEditHeadingLevel(1);
    setEditHeadingParentId("");
    setEditContentHeadingId("");
    setEditContentText("");
    setConfirmDeleteOutlineItemId(null);
    setCollapsedHeadingIds(new Set());
  }, [outlineNodeId]);

  useEffect(() => {
    if (outlineCreateMode !== "content") return;
    if (!newContentHeadingId && headingItems.length) {
      setNewContentHeadingId(headingItems[0].id);
    }
  }, [outlineCreateMode, newContentHeadingId, headingItems]);

  useEffect(() => {
    if (!relationshipPopup) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as globalThis.Node | null;
      if (relationshipPopupRef.current && target && relationshipPopupRef.current.contains(target)) return;
      setRelationshipPopup(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [relationshipPopup]);

  const onMoveEnd = useCallback((_event: unknown, viewport: Viewport) => {
    if (!userId) return;
    if (saveViewportTimer.current) clearTimeout(saveViewportTimer.current);
    saveViewportTimer.current = setTimeout(async () => {
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("map_view_state")
        .upsert({ map_id: mapId, user_id: userId, pan_x: viewport.x, pan_y: viewport.y, zoom: viewport.zoom }, { onConflict: "map_id,user_id" });
      if (e) setError(e.message || "Unable to save viewport state.");
    }, 500);
  }, [mapId, userId]);

  const handleSaveMapTitle = useCallback(async () => {
    const nextTitle = mapTitleDraft.trim();
    if (!map || !nextTitle) return;
    setSavingMapTitle(true);
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("system_maps")
      .update({ title: nextTitle })
      .eq("id", map.id)
      .select("id,title,description,updated_at,created_at")
      .maybeSingle();
    setSavingMapTitle(false);
    if (e || !data) {
      setError(e?.message || "Unable to save map title.");
      return;
    }
    setMap(data as SystemMap);
    setIsEditingMapTitle(false);
  }, [map, mapTitleDraft]);

  const onNodeDragStop = useCallback(async (_event: unknown, node: Node<FlowData>) => {
    if (node.data.entityKind === "category" || node.data.entityKind === "system_circle" || node.data.entityKind === "grouping_container" || node.data.entityKind === "process_component") {
      const elementId = parseProcessFlowId(node.id);
      const sourceElement = elements.find((el) => el.id === elementId);
      if (!sourceElement) return;
      const finalX = snapToMinorGrid(node.position.x);
      const finalY = snapToMinorGrid(node.position.y);
      setElements((prev) => prev.map((el) => (el.id === elementId ? { ...el, pos_x: finalX, pos_y: finalY } : el)));
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("canvas_elements")
        .update({ pos_x: finalX, pos_y: finalY })
        .eq("id", elementId)
        .eq("map_id", mapId);
      if (e) {
        setError(e.message || "Unable to save element position.");
        setElements((prev) => prev.map((el) => (el.id === elementId ? sourceElement : el)));
      }
      return;
    }
    const source = nodes.find((n) => n.id === node.id);
    if (!source) return;
    const x = snapToMinorGrid(node.position.x);
    const y = snapToMinorGrid(node.position.y);
    const old = savedPos.current[node.id] ?? { x: source.pos_x, y: source.pos_y };
    const freePosition = findNearestFreePosition(node.id, x, y) ?? old;
    const finalX = freePosition.x;
    const finalY = freePosition.y;
    setFlowNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, position: { x: finalX, y: finalY } } : n)));
    setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, pos_x: finalX, pos_y: finalY } : n)));

    const { error: e } = await supabaseBrowser.schema("ms").from("document_nodes").update({ pos_x: finalX, pos_y: finalY }).eq("id", node.id).eq("map_id", mapId);
    if (e) {
      setError(e.message || "Unable to save position. Reverting.");
      setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, pos_x: old.x, pos_y: old.y } : n)));
      return;
    }
    savedPos.current[node.id] = { x: finalX, y: finalY };
  }, [nodes, elements, mapId, snapToMinorGrid, findNearestFreePosition]);

  const handleAddBlankDocument = async () => {
    if (!rf || !canvasRef.current) return;
    const t = addDocumentTypes[0];
    if (!t) return;
    const box = canvasRef.current.getBoundingClientRect();
    const center = rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    const x = snapToMinorGrid(center.x);
    const y = snapToMinorGrid(center.y);

    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("document_nodes")
      .insert({
        map_id: mapId,
        type_id: t.id,
        title: unconfiguredDocumentTitle,
        pos_x: x,
        pos_y: y,
        width: isLandscapeTypeName(t.name) ? landscapeDefaultWidth : defaultWidth,
        height: isLandscapeTypeName(t.name) ? landscapeDefaultHeight : defaultHeight,
      })
      .select("id,map_id,type_id,title,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to create document.");
      return;
    }
    const inserted = data as DocumentNodeRow;
    setNodes((prev) => [...prev, inserted]);
    savedPos.current[inserted.id] = { x: inserted.pos_x, y: inserted.pos_y };
    setShowAddMenu(false);
  };
  const handleAddProcessHeading = async () => {
    if (!rf || !canvasRef.current) return;
    const box = canvasRef.current.getBoundingClientRect();
    const center = rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    const x = snapToMinorGrid(center.x);
    const y = snapToMinorGrid(center.y);
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .insert({
        map_id: mapId,
        element_type: "category",
        heading: "New Category",
        pos_x: x,
        pos_y: y,
        width: processHeadingWidth,
        height: processHeadingHeight,
      })
      .select("id,map_id,element_type,heading,pos_x,pos_y,width,height,created_at,updated_at")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to create process heading.");
      return;
    }
    setElements((prev) => [...prev, data as CanvasElementRow]);
    setShowAddMenu(false);
  };
  const handleAddSystemCircle = async () => {
    if (!rf || !canvasRef.current) return;
    const box = canvasRef.current.getBoundingClientRect();
    const center = rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    const x = snapToMinorGrid(center.x);
    const y = snapToMinorGrid(center.y);
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .insert({
        map_id: mapId,
        element_type: "system_circle",
        heading: "System Name",
        pos_x: x,
        pos_y: y,
        width: systemCircleDiameter,
        height: systemCircleElementHeight,
      })
      .select("id,map_id,element_type,heading,pos_x,pos_y,width,height,created_at,updated_at")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to create system element.");
      return;
    }
    setElements((prev) => [...prev, data as CanvasElementRow]);
    setShowAddMenu(false);
  };
  const handleAddProcessComponent = async () => {
    if (!rf || !canvasRef.current) return;
    const box = canvasRef.current.getBoundingClientRect();
    const center = rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    const x = snapToMinorGrid(center.x);
    const y = snapToMinorGrid(center.y);
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .insert({
        map_id: mapId,
        element_type: "process_component",
        heading: "Process",
        pos_x: x,
        pos_y: y,
        width: processComponentWidth,
        height: processComponentElementHeight,
      })
      .select("id,map_id,element_type,heading,pos_x,pos_y,width,height,created_at,updated_at")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to create process component.");
      return;
    }
    setElements((prev) => [...prev, data as CanvasElementRow]);
    setShowAddMenu(false);
  };
  const handleAddGroupingContainer = async () => {
    if (!rf || !canvasRef.current) return;
    const box = canvasRef.current.getBoundingClientRect();
    const center = rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    const x = snapToMinorGrid(center.x);
    const y = snapToMinorGrid(center.y);
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .insert({
        map_id: mapId,
        element_type: "grouping_container",
        heading: "Group label",
        pos_x: x,
        pos_y: y,
        width: groupingDefaultWidth,
        height: groupingDefaultHeight,
      })
      .select("id,map_id,element_type,heading,pos_x,pos_y,width,height,created_at,updated_at")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to create grouping container.");
      return;
    }
    setElements((prev) => [...prev, data as CanvasElementRow]);
    setShowAddMenu(false);
  };
  const handleSaveProcessHeading = async () => {
    if (!selectedProcessId) return;
    const heading = processHeadingDraft.trim() || "New Category";
    const widthSquares = Number.isFinite(processWidthDraft) ? processWidthDraft : 10;
    const heightSquares = Number.isFinite(processHeightDraft) ? processHeightDraft : 3;
    const width = Math.max(processMinWidth, snapToMinorGrid(widthSquares * minorGridSize));
    const height = Math.max(processMinHeight, snapToMinorGrid(heightSquares * minorGridSize));
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update({ heading, width, height })
      .eq("id", selectedProcessId)
      .eq("map_id", mapId)
      .select("id,map_id,element_type,heading,pos_x,pos_y,width,height,created_at,updated_at")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to save process heading.");
      return;
    }
    const updated = data as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedProcessId(null);
  };
  const handleSaveSystemName = async () => {
    if (!selectedSystemId) return;
    const heading = systemNameDraft.trim() || "System Name";
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update({ heading })
      .eq("id", selectedSystemId)
      .eq("map_id", mapId)
      .select("id,map_id,element_type,heading,pos_x,pos_y,width,height,created_at,updated_at")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to save system name.");
      return;
    }
    const updated = data as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedSystemId(null);
  };
  const handleSaveProcessComponent = async () => {
    if (!selectedProcessComponentId) return;
    const heading = processComponentLabelDraft.trim() || "Process";
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update({ heading })
      .eq("id", selectedProcessComponentId)
      .eq("map_id", mapId)
      .select("id,map_id,element_type,heading,pos_x,pos_y,width,height,created_at,updated_at")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to save process.");
      return;
    }
    const updated = data as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedProcessComponentId(null);
  };
  const handleSaveGroupingContainer = async () => {
    if (!selectedGroupingId) return;
    const heading = groupingLabelDraft.trim() || "Group label";
    const widthSquares = Number.isFinite(groupingWidthDraft) ? groupingWidthDraft : Math.round(groupingDefaultWidth / minorGridSize);
    const heightSquares = Number.isFinite(groupingHeightDraft) ? groupingHeightDraft : Math.round(groupingDefaultHeight / minorGridSize);
    const width = Math.max(groupingMinWidth, snapToMinorGrid(widthSquares * minorGridSize));
    const height = Math.max(groupingMinHeight, snapToMinorGrid(heightSquares * minorGridSize));
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update({ heading, width, height })
      .eq("id", selectedGroupingId)
      .eq("map_id", mapId)
      .select("id,map_id,element_type,heading,pos_x,pos_y,width,height,created_at,updated_at")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to save grouping container.");
      return;
    }
    const updated = data as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedGroupingId(null);
  };

  const handleSaveNode = async () => {
    if (!selectedNodeId) return;
    const current = nodes.find((n) => n.id === selectedNodeId);
    if (!current) return;
    const nextTypeId = selectedTypeId || current.type_id;
    const nextTypeName = typesById.get(nextTypeId)?.name ?? "";
    const nextIsLandscape = isLandscapeTypeName(nextTypeName);
    const currentSize = getNodeSize(current);
    const nextSize = getNormalizedDocumentSize(nextIsLandscape, currentSize.width, currentSize.height);
    const payload = {
      type_id: nextTypeId,
      title: title.trim() || "Untitled Document",
      discipline: serializeDisciplines(disciplineSelection),
      user_group: userGroup.trim() || null,
      owner_name: ownerName.trim() || null,
      owner_user_id: null,
      width: nextSize.width,
      height: nextSize.height,
    };
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("document_nodes")
      .update(payload)
      .eq("id", selectedNodeId)
      .eq("map_id", mapId)
      .select("id,map_id,type_id,title,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to save node properties.");
      return;
    }
    const updated = data as DocumentNodeRow;
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedNodeId(null);
  };

  const relatedRows = useMemo(() => {
    if (!selectedNodeId) return [];
    return relations.filter((r) => r.from_node_id === selectedNodeId || r.to_node_id === selectedNodeId);
  }, [relations, selectedNodeId]);

  const relationshipSourceNode = useMemo(
    () => (relationshipSourceNodeId ? nodes.find((n) => n.id === relationshipSourceNodeId) ?? null : null),
    [nodes, relationshipSourceNodeId]
  );

  const documentRelationCandidates = useMemo(() => {
    if (!relationshipSourceNodeId) return [];
    const term = relationshipDocumentQuery.trim().toLowerCase();
    return nodes
      .filter((n) => n.id !== relationshipSourceNodeId)
      .filter((n) => n.title.toLowerCase().includes(term));
  }, [nodes, relationshipSourceNodeId, relationshipDocumentQuery]);

  const documentRelationCandidateLabelById = useMemo(() => {
    const m = new Map<string, string>();
    documentRelationCandidates.forEach((n) => m.set(n.id, `${n.title} (${disciplineSummary(n.discipline)})`));
    return m;
  }, [documentRelationCandidates]);

  const documentRelationCandidateIdByLabel = useMemo(() => {
    const m = new Map<string, string>();
    documentRelationCandidates.forEach((n) => m.set(`${n.title} (${disciplineSummary(n.discipline)})`, n.id));
    return m;
  }, [documentRelationCandidates]);
  const systemRelationCandidates = useMemo(() => {
    const term = relationshipSystemQuery.trim().toLowerCase();
    return elements
      .filter((el) => el.element_type === "system_circle")
      .filter((el) => (el.heading || "").toLowerCase().includes(term));
  }, [elements, relationshipSystemQuery]);
  const systemRelationCandidateLabelById = useMemo(() => {
    const m = new Map<string, string>();
    systemRelationCandidates.forEach((el) => m.set(el.id, el.heading || "System"));
    return m;
  }, [systemRelationCandidates]);
  const systemRelationCandidateIdByLabel = useMemo(() => {
    const m = new Map<string, string>();
    systemRelationCandidates.forEach((el) => m.set(el.heading || "System", el.id));
    return m;
  }, [systemRelationCandidates]);
  const alreadyRelatedDocumentTargetIds = useMemo(() => {
    const ids = new Set<string>();
    if (!relationshipSourceNodeId) return ids;
    relations.forEach((r) => {
      if (r.from_node_id === relationshipSourceNodeId && r.to_node_id) ids.add(r.to_node_id);
      if (r.to_node_id === relationshipSourceNodeId) ids.add(r.from_node_id);
    });
    return ids;
  }, [relations, relationshipSourceNodeId]);
  const alreadyRelatedSystemTargetIds = useMemo(() => {
    const ids = new Set<string>();
    if (!relationshipSourceNodeId) return ids;
    relations.forEach((r) => {
      if (r.from_node_id === relationshipSourceNodeId && r.target_system_element_id) ids.add(r.target_system_element_id);
    });
    return ids;
  }, [relations, relationshipSourceNodeId]);
  const closeAddRelationshipModal = useCallback(() => {
    setShowAddRelationship(false);
    setRelationshipSourceNodeId(null);
    setRelationshipTargetDocumentId("");
    setRelationshipTargetSystemId("");
    setRelationshipDocumentQuery("");
    setRelationshipSystemQuery("");
    setShowRelationshipDocumentOptions(false);
    setShowRelationshipSystemOptions(false);
    setRelationshipDescription("");
    setRelationshipDisciplineSelection([]);
    setShowRelationshipDisciplineMenu(false);
    setRelationshipCategory("information");
    setRelationshipCustomType("");
  }, []);
  const closeDesktopDrilldownPanels = useCallback(() => {
    setDesktopNodeAction(null);
    closeAddRelationshipModal();
    setOutlineNodeId(null);
    setConfirmDeleteNodeId(null);
    setConfirmDeleteOutlineItemId(null);
    setOutlineCreateMode(null);
    setOutlineEditItemId(null);
    setEditHeadingTitle("");
    setEditHeadingLevel(1);
    setEditHeadingParentId("");
    setEditContentHeadingId("");
    setEditContentText("");
  }, [closeAddRelationshipModal]);
  const handleCloseDocumentPropertiesPanel = useCallback(() => {
    setSelectedNodeId(null);
    closeDesktopDrilldownPanels();
  }, [closeDesktopDrilldownPanels]);

  const handleAddRelation = async () => {
    if (!relationshipSourceNodeId) return;
    const hasDocumentTarget = !!relationshipTargetDocumentId;
    const hasSystemTarget = !!relationshipTargetSystemId;
    if (!hasDocumentTarget && !hasSystemTarget) return;
    const exists = hasDocumentTarget
      ? relations.some(
          (r) =>
            (r.from_node_id === relationshipSourceNodeId && r.to_node_id === relationshipTargetDocumentId) ||
            (r.from_node_id === relationshipTargetDocumentId && r.to_node_id === relationshipSourceNodeId)
        )
      : relations.some(
          (r) =>
            r.from_node_id === relationshipSourceNodeId &&
            r.target_system_element_id === relationshipTargetSystemId
        );
    if (exists) {
      setError("Relationship already exists for this target.");
      return;
    }
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("node_relations")
      .insert({
        map_id: mapId,
        from_node_id: relationshipSourceNodeId,
        to_node_id: hasDocumentTarget ? relationshipTargetDocumentId : null,
        target_system_element_id: hasSystemTarget ? relationshipTargetSystemId : null,
        relation_type: "related",
        relationship_description: relationshipDescription.trim() || null,
        relationship_disciplines: relationshipDisciplineSelection.length ? relationshipDisciplineSelection : null,
        relationship_category: relationshipCategory,
        relationship_custom_type: relationshipCategory === "other" ? relationshipCustomType.trim() || null : null,
      })
      .select("id,map_id,from_node_id,to_node_id,relation_type,relationship_description,target_system_element_id,relationship_disciplines,relationship_category,relationship_custom_type")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to add relation.");
      return;
    }
    setRelations((prev) => [...prev, data as NodeRelationRow]);
    closeAddRelationshipModal();
  };

  const handleDeleteRelation = async (id: string) => {
    const { error: e } = await supabaseBrowser.schema("ms").from("node_relations").delete().eq("id", id).eq("map_id", mapId);
    if (e) {
      setError(e.message || "Unable to delete relation.");
      return;
    }
    setRelations((prev) => prev.filter((r) => r.id !== id));
  };
  const handleUpdateRelation = async (id: string) => {
    if (editingRelationCategory === "other" && !editingRelationCustomType.trim()) {
      setError("Please enter a custom relationship type.");
      return;
    }
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("node_relations")
      .update({
        relationship_description: editingRelationDescription.trim() || null,
        relationship_category: editingRelationCategory,
        relationship_custom_type: editingRelationCategory === "other" ? editingRelationCustomType.trim() || null : null,
        relationship_disciplines: editingRelationDisciplines.length ? editingRelationDisciplines : null,
      })
      .eq("id", id)
      .eq("map_id", mapId)
      .select("id,map_id,from_node_id,to_node_id,relation_type,relationship_description,target_system_element_id,relationship_disciplines,relationship_category,relationship_custom_type")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to update relationship definition.");
      return;
    }
    setRelations((prev) => prev.map((r) => (r.id === id ? (data as NodeRelationRow) : r)));
    setEditingRelationId(null);
    setEditingRelationDescription("");
    setEditingRelationCategory("information");
    setEditingRelationCustomType("");
    setEditingRelationDisciplines([]);
    setShowEditingRelationDisciplineMenu(false);
  };

  const handleDeleteNode = async (id: string) => {
    const { error: e } = await supabaseBrowser.schema("ms").from("document_nodes").delete().eq("id", id).eq("map_id", mapId);
    if (e) {
      setError(e.message || "Unable to delete document.");
      return;
    }
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setRelations((prev) => prev.filter((r) => r.from_node_id !== id && r.to_node_id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    if (outlineNodeId === id) {
      setOutlineNodeId(null);
      setOutlineItems([]);
    }
  };
  const handleDeleteProcessElement = async (id: string) => {
    const { error: e } = await supabaseBrowser.schema("ms").from("canvas_elements").delete().eq("id", id).eq("map_id", mapId);
    if (e) {
      setError(e.message || "Unable to delete canvas element.");
      return;
    }
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedProcessId === id) setSelectedProcessId(null);
    if (selectedSystemId === id) setSelectedSystemId(null);
    if (selectedProcessComponentId === id) setSelectedProcessComponentId(null);
    if (selectedGroupingId === id) setSelectedGroupingId(null);
  };

  const handleCreateHeading = async () => {
    if (!outlineNodeId) return;
    const titleInput = newHeadingTitle.trim();
    if (!titleInput) return;
    const levelInput = newHeadingLevel;
    let parentHeadingId: string | null = null;
    if (levelInput === 2) {
      if (!newHeadingParentId) return;
      parentHeadingId = newHeadingParentId;
    }
    if (levelInput === 3) {
      if (!newHeadingParentId) return;
      parentHeadingId = newHeadingParentId;
    }

    const maxSort = outlineItems.reduce((m, i) => Math.max(m, i.sort_order), 0);
    const { error: e } = await supabaseBrowser.schema("ms").from("document_outline_items").insert({
      map_id: mapId,
      node_id: outlineNodeId,
      kind: "heading",
      heading_level: levelInput,
      parent_heading_id: parentHeadingId,
      title: titleInput,
      sort_order: maxSort + 10,
    });
    if (e) {
      setError(e.message || "Unable to add heading.");
      return;
    }
    setOutlineCreateMode(null);
    setNewHeadingTitle("");
    setNewHeadingLevel(1);
    setNewHeadingParentId("");
    await loadOutline(outlineNodeId);
  };

  const handleCreateContent = async () => {
    if (!outlineNodeId) return;
    if (!headingItems.length) return;
    const headingId = newContentHeadingId;
    if (!headingId) return;
    const text = newContentText.trim();
    if (!text) return;

    const ordered = [...outlineItems].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
    const headingIndex = ordered.findIndex((i) => i.id === headingId);
    const insertIndex = headingIndex < 0 ? ordered.length : headingIndex + 1;

    let cursor = 10;
    for (let i = 0; i <= ordered.length; i += 1) {
      if (i === insertIndex) {
        cursor += 10;
        continue;
      }
      const item = ordered[i > insertIndex ? i - 1 : i];
      if (!item) continue;
      if (item.sort_order !== cursor) {
        await supabaseBrowser.schema("ms").from("document_outline_items").update({ sort_order: cursor }).eq("id", item.id);
      }
      cursor += 10;
    }

    const insertSort = (insertIndex + 1) * 10;
    const { error: e } = await supabaseBrowser.schema("ms").from("document_outline_items").insert({
      map_id: mapId,
      node_id: outlineNodeId,
      kind: "content",
      content_text: text,
      heading_id: headingId,
      sort_order: insertSort,
    });
    if (e) {
      setError(e.message || "Unable to add content.");
      return;
    }
    setOutlineCreateMode(null);
    setNewContentHeadingId("");
    setNewContentText("");
    await loadOutline(outlineNodeId);
  };

  const openOutlineEditor = useCallback((item: OutlineItemRow) => {
    setOutlineCreateMode(null);
    setOutlineEditItemId(item.id);
    if (item.kind === "heading") {
      setEditHeadingTitle(item.title ?? "");
      const level = item.heading_level ?? 1;
      setEditHeadingLevel(level);
      setEditHeadingParentId(item.parent_heading_id ?? "");
    } else {
      setEditContentHeadingId(item.heading_id ?? "");
      setEditContentText(item.content_text ?? "");
    }
  }, []);

  const closeOutlineEditor = useCallback(() => {
    setOutlineEditItemId(null);
    setEditHeadingTitle("");
    setEditHeadingLevel(1);
    setEditHeadingParentId("");
    setEditContentHeadingId("");
    setEditContentText("");
  }, []);

  const handleSaveOutlineEdit = useCallback(async () => {
    if (!outlineNodeId || !outlineEditItem) return;
    if (outlineEditItem.kind === "heading") {
      const title = editHeadingTitle.trim();
      if (!title) return;
      const parentId = editHeadingLevel === 1 ? null : editHeadingParentId || null;
      if (editHeadingLevel !== 1 && !parentId) return;
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("document_outline_items")
        .update({ title, heading_level: editHeadingLevel, parent_heading_id: parentId })
        .eq("id", outlineEditItem.id);
      if (e) {
        setError(e.message || "Unable to update heading.");
        return;
      }
    } else {
      const text = editContentText.trim();
      if (!text || !editContentHeadingId) return;
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("document_outline_items")
        .update({ content_text: text, heading_id: editContentHeadingId })
        .eq("id", outlineEditItem.id);
      if (e) {
        setError(e.message || "Unable to update content.");
        return;
      }
    }
    closeOutlineEditor();
    await loadOutline(outlineNodeId);
  }, [
    outlineNodeId,
    outlineEditItem,
    editHeadingTitle,
    editHeadingLevel,
    editHeadingParentId,
    editContentText,
    editContentHeadingId,
    closeOutlineEditor,
    loadOutline,
  ]);

  const handleDeleteOutlineItem = useCallback(async () => {
    if (!outlineNodeId || !confirmDeleteOutlineItemId) return;
    const { error: e } = await supabaseBrowser
      .schema("ms")
      .from("document_outline_items")
      .delete()
      .eq("id", confirmDeleteOutlineItemId);
    if (e) {
      setError(e.message || "Unable to delete outline item.");
      return;
    }
    setCollapsedHeadingIds((prev) => {
      const next = new Set(prev);
      next.delete(confirmDeleteOutlineItemId);
      return next;
    });
    setConfirmDeleteOutlineItemId(null);
    if (outlineEditItemId === confirmDeleteOutlineItemId) {
      closeOutlineEditor();
    }
    await loadOutline(outlineNodeId);
  }, [outlineNodeId, confirmDeleteOutlineItemId, outlineEditItemId, closeOutlineEditor, loadOutline]);
  useEffect(() => {
    if (isMobile) return;
    if (selectedNodeId) return;
    closeDesktopDrilldownPanels();
  }, [selectedNodeId, isMobile, closeDesktopDrilldownPanels]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading map...</div>;
  }

  if (!map) {
    return <div className="flex min-h-screen items-center justify-center text-rose-700">{error || "Map not found."}</div>;
  }

  return (
    <div className="flex h-svh min-h-svh flex-col bg-stone-50 md:min-h-screen md:h-dvh">
      <header className="site-header fixed inset-x-0 top-0 z-[90] md:sticky" style={{ backgroundColor: "#000000", borderBottomColor: "#0f172a" }}>
        <div className="header-inner" style={{ paddingLeft: "12px", paddingRight: "20px", backgroundColor: "#000000" }}>
          <div className="header-left">
            <a href="/"><img src="/images/logo-white.png" alt="HSES" className="header-logo" /></a>
          </div>
          <div className="header-actions" />
        </div>
      </header>

      <div className="fixed right-5 top-[82px] z-[88]">
        <div className="relative flex items-center gap-3">
          <a
            href="/system-maps"
            aria-label="Back to all system maps"
            title="All system maps"
            className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 bg-current"
              style={{ WebkitMaskImage: "url('/icons/back.svg')", maskImage: "url('/icons/back.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
            />
          </a>
          <button
            type="button"
            aria-label="Zoom to fit"
            title="Zoom to fit"
            onClick={() => rf?.fitView({ duration: 300, padding: 0.2 })}
            className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 bg-current"
              style={{ WebkitMaskImage: "url('/icons/zoomfit.svg')", maskImage: "url('/icons/zoomfit.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
            />
          </button>
          <button
            type="button"
            aria-label="Reset zoom"
            title="Reset zoom"
            onClick={() => rf?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })}
            className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 bg-current"
              style={{ WebkitMaskImage: "url('/icons/resetzoom.svg')", maskImage: "url('/icons/resetzoom.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
            />
          </button>
          <button
            type="button"
            aria-label="Add component"
            title="Add component"
            onClick={() => setShowAddMenu((prev) => !prev)}
            className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 bg-current"
              style={{ WebkitMaskImage: "url('/icons/addcomponent.svg')", maskImage: "url('/icons/addcomponent.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
            />
          </button>
          {showAddMenu && (
            <div ref={addMenuRef} className="absolute right-0 top-full z-[70] mt-2 min-w-[180px] rounded-none border border-slate-300 bg-white p-1 text-sm shadow-xl">
              <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddBlankDocument}>Document</button>
              <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddSystemCircle}>System</button>
              <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddProcessComponent}>Process</button>
              <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddProcessHeading}>Category</button>
              <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddGroupingContainer}>Grouping Container</button>
            </div>
          )}
        </div>
      </div>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute left-4 top-[11.5rem] z-20 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow md:top-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">System Map</div>
          {isEditingMapTitle ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                className="w-56 rounded border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-900"
                value={mapTitleDraft}
                onChange={(e) => setMapTitleDraft(e.target.value)}
              />
              <button className="btn btn-outline px-2 py-1 text-xs" disabled={savingMapTitle} onClick={handleSaveMapTitle}>Save</button>
              <button className="btn btn-outline px-2 py-1 text-xs" onClick={() => { setMapTitleDraft(map.title); setIsEditingMapTitle(false); }}>Cancel</button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-900">{map.title}</h1>
              <button className="btn btn-outline px-2 py-1 text-xs" onClick={() => setIsEditingMapTitle(true)}>Edit</button>
            </div>
          )}
          {error && <div className="mt-1 text-xs text-rose-700">{error}</div>}
        </div>

        <div
          ref={canvasRef}
          className="h-full w-full bg-stone-50"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            setMobileNodeMenuId(null);
            setShowAddMenu(false);
          }}
        >
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={flowNodeTypes}
            onInit={(instance) => setRf({ fitView: instance.fitView, screenToFlowPosition: instance.screenToFlowPosition, setViewport: instance.setViewport })}
            onNodesChange={handleFlowNodesChange}
            onNodeClick={(_, n) => {
              if (n.data.entityKind === "category") {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedSystemId(null);
                setSelectedProcessComponentId(null);
                setSelectedGroupingId(null);
                setSelectedProcessId(parseProcessFlowId(n.id));
                return;
              }
              if (n.data.entityKind === "process_component") {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedSystemId(null);
                    setSelectedGroupingId(null);
                    setSelectedProcessComponentId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedSystemId(null);
                setSelectedGroupingId(null);
                setSelectedProcessComponentId(parseProcessFlowId(n.id));
                return;
              }
              if (n.data.entityKind === "system_circle") {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedSystemId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedProcessComponentId(null);
                setSelectedGroupingId(null);
                setSelectedSystemId(parseProcessFlowId(n.id));
                return;
              }
              if (n.data.entityKind === "grouping_container") {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedSystemId(null);
                    setSelectedGroupingId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedSystemId(null);
                setSelectedProcessComponentId(null);
                setSelectedGroupingId(parseProcessFlowId(n.id));
                return;
              }
              if (isMobile) {
                const now = Date.now();
                const lastTap = lastMobileTapRef.current;
                const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                if (isDoubleTap) {
                  setMobileNodeMenuId(n.id);
                  lastMobileTapRef.current = null;
                } else {
                  lastMobileTapRef.current = { id: n.id, ts: now };
                }
                return;
              }
              setSelectedProcessId(null);
              setSelectedSystemId(null);
              setSelectedProcessComponentId(null);
              setSelectedGroupingId(null);
              setSelectedNodeId(n.id);
            }}
            onNodeContextMenu={(e, n) => {
              e.preventDefault();
              if (isMobile) {
                setMobileNodeMenuId(n.id);
                return;
              }
            }}
            onNodeMouseEnter={(_, n) => setHoveredNodeId(n.id)}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            onNodeDragStop={onNodeDragStop}
            onMoveEnd={onMoveEnd}
            onEdgeClick={(event, edge) => {
              event.preventDefault();
              event.stopPropagation();
              const rel = relations.find((r) => r.id === edge.id);
              if (!rel) return;
              const fromNode = nodes.find((n) => n.id === rel.from_node_id);
              const toNode = rel.to_node_id ? nodes.find((n) => n.id === rel.to_node_id) : null;
              const toSystem = rel.target_system_element_id
                ? elements.find((el) => el.id === rel.target_system_element_id && el.element_type === "system_circle")
                : null;
              const fromLabel = fromNode?.title || "Unknown document";
              const toLabel = toNode?.title || toSystem?.heading || "Unknown destination";
              const relationLabel = getDisplayRelationType(rel.relation_type);
              const relationshipType = getRelationshipCategoryLabel(rel.relationship_category, rel.relationship_custom_type);
              const disciplines = getRelationshipDisciplineLetters(rel.relationship_disciplines);
              const description = rel.relationship_description?.trim() || "No relationship context added by user";
              setRelationshipPopup({
                x: event.clientX,
                y: event.clientY,
                fromLabel,
                toLabel,
                relationLabel,
                relationshipType,
                disciplines: disciplines || "None",
                description,
              });
            }}
            panOnDrag
            zoomOnScroll
            snapToGrid
            snapGrid={[minorGridSize, minorGridSize]}
            minZoom={0.2}
            maxZoom={2}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ backgroundColor: "#fafaf9" }}
          >
            <Background id="minor" variant={BackgroundVariant.Lines} gap={minorGridSize} size={1} color="#e7e5e4" />
            <Background id="major" variant={BackgroundVariant.Lines} gap={majorGridSize} size={1.2} color="#d6d3d1" />
          </ReactFlow>
        </div>


        {isMobile && mobileNodeMenuId && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:p-4">
            <div className="w-full rounded-t-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200/70 sm:max-w-md sm:rounded-xl">
              <div className="mb-2 text-sm font-semibold text-slate-900">
                {nodes.find((n) => n.id === mobileNodeMenuId)?.title || "Document"}
              </div>
              <div className="grid gap-2">
                <button className="btn btn-outline justify-start" onClick={() => {
                  setSelectedProcessId(null);
                  setSelectedNodeId(mobileNodeMenuId);
                  setMobileNodeMenuId(null);
                }}>Edit Properties</button>
                <button className="btn btn-outline justify-start" onClick={() => {
                  setRelationshipSourceNodeId(mobileNodeMenuId);
                  setRelationshipDocumentQuery("");
                  setRelationshipSystemQuery("");
                  setRelationshipTargetDocumentId("");
                  setRelationshipTargetSystemId("");
                  setShowRelationshipDocumentOptions(false);
                  setShowRelationshipSystemOptions(false);
                  setRelationshipDescription("");
                  setRelationshipDisciplineSelection([]);
                  setShowRelationshipDisciplineMenu(false);
                  setRelationshipCategory("information");
                  setRelationshipCustomType("");
                  setShowAddRelationship(true);
                  setMobileNodeMenuId(null);
                }}>Add Relationship</button>
                <button className="btn btn-outline justify-start" onClick={async () => {
                  setOutlineCreateMode(null);
                  closeOutlineEditor();
                  setConfirmDeleteOutlineItemId(null);
                  setCollapsedHeadingIds(new Set());
                  setOutlineNodeId(mobileNodeMenuId);
                  setMobileNodeMenuId(null);
                  await loadOutline(mobileNodeMenuId);
                }}>Open Document Structure</button>
                <button className="btn btn-outline justify-start text-rose-700" onClick={() => {
                  setConfirmDeleteNodeId(mobileNodeMenuId);
                  setMobileNodeMenuId(null);
                }}>Delete Document</button>
                <button className="btn btn-outline" onClick={() => setMobileNodeMenuId(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {relationshipPopup && (
          <div
            ref={relationshipPopupRef}
            className="fixed z-[65] w-[320px] max-w-[90vw] rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg"
            style={{ left: relationshipPopup.x, top: relationshipPopup.y + 14, transform: "translateX(-50%)" }}
          >
            <div className="space-y-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">From</div>
                <div className="text-xs text-slate-800">{relationshipPopup.fromLabel}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">To</div>
                <div className="text-xs text-slate-800">{relationshipPopup.toLabel}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relation Label</div>
                <div className="text-xs text-slate-800">{relationshipPopup.relationLabel}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Type</div>
                <div className="text-xs text-slate-800">{relationshipPopup.relationshipType}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Disciplines</div>
                <div className="text-xs text-slate-800">{relationshipPopup.disciplines}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Definition</div>
                <div className="text-xs text-slate-800">{relationshipPopup.description}</div>
              </div>
            </div>
          </div>
        )}

        {showAddRelationship && isMobile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70">
              <h2 className="text-lg font-semibold">Add Relationship</h2>
              <p className="mt-1 text-sm text-slate-600">From: {relationshipSourceNode?.title || "Unknown document"}</p>
              <div className="mt-4 grid gap-3">
                <div className="relative">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Documents</div>
                  <div className="relative flex">
                    <input
                      className="w-full rounded-l border border-slate-300 bg-white px-3 py-2"
                      placeholder="Search documents..."
                      value={relationshipDocumentQuery}
                      onChange={(e) => {
                        const query = e.target.value;
                        setRelationshipDocumentQuery(query);
                        const candidateId = documentRelationCandidateIdByLabel.get(query) ?? "";
                        setRelationshipTargetDocumentId(candidateId && !alreadyRelatedDocumentTargetIds.has(candidateId) ? candidateId : "");
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-r border border-l-0 border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setShowRelationshipDocumentOptions((prev) => !prev);
                        setShowRelationshipSystemOptions(false);
                      }}
                    >
                      {showRelationshipDocumentOptions ? "▲" : "▼"}
                    </button>
                  </div>
                  {showRelationshipDocumentOptions && (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                      {documentRelationCandidates.length > 0 ? documentRelationCandidates.map((n) => {
                        const optionLabel = documentRelationCandidateLabelById.get(n.id) ?? n.title;
                        const isDisabled = alreadyRelatedDocumentTargetIds.has(n.id);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                              isDisabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-800 hover:bg-slate-50"
                            }`}
                            disabled={isDisabled}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (isDisabled) return;
                              setRelationshipTargetDocumentId(n.id);
                              setRelationshipTargetSystemId("");
                              setRelationshipDocumentQuery(optionLabel);
                              setShowRelationshipDocumentOptions(false);
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{optionLabel}</span>
                              {isDisabled && <span className="text-[10px] uppercase tracking-[0.06em]">Relationship already exists</span>}
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="px-3 py-2 text-sm text-slate-500">No search results found</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Systems</div>
                  <div className="relative flex">
                    <input
                      className="w-full rounded-l border border-slate-300 bg-white px-3 py-2"
                      placeholder="Search systems..."
                      value={relationshipSystemQuery}
                      onChange={(e) => {
                        const query = e.target.value;
                        setRelationshipSystemQuery(query);
                        const candidateId = systemRelationCandidateIdByLabel.get(query) ?? "";
                        setRelationshipTargetSystemId(candidateId && !alreadyRelatedSystemTargetIds.has(candidateId) ? candidateId : "");
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-r border border-l-0 border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setShowRelationshipSystemOptions((prev) => !prev);
                        setShowRelationshipDocumentOptions(false);
                      }}
                    >
                      {showRelationshipSystemOptions ? "▲" : "▼"}
                    </button>
                  </div>
                  {showRelationshipSystemOptions && (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                      {systemRelationCandidates.length > 0 ? systemRelationCandidates.map((el) => {
                        const optionLabel = systemRelationCandidateLabelById.get(el.id) ?? (el.heading || "System");
                        const isDisabled = alreadyRelatedSystemTargetIds.has(el.id);
                        return (
                          <button
                            key={el.id}
                            type="button"
                            className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                              isDisabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-800 hover:bg-slate-50"
                            }`}
                            disabled={isDisabled}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (isDisabled) return;
                              setRelationshipTargetSystemId(el.id);
                              setRelationshipTargetDocumentId("");
                              setRelationshipSystemQuery(optionLabel);
                              setShowRelationshipSystemOptions(false);
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{optionLabel}</span>
                              {isDisabled && <span className="text-[10px] uppercase tracking-[0.06em]">Relationship already exists</span>}
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="px-3 py-2 text-sm text-slate-500">No search results found</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Disciplines</div>
                  <div className="relative">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left text-slate-700"
                      onClick={() => setShowRelationshipDisciplineMenu((prev) => !prev)}
                    >
                      <span className="truncate text-sm">
                        {relationshipDisciplineSelection.length
                          ? relationshipDisciplineSelection.map((key) => disciplineLabelByKey.get(key)).filter(Boolean).join(", ")
                          : "Select disciplines"}
                      </span>
                      <span className="text-xs text-slate-500">{showRelationshipDisciplineMenu ? "▲" : "▼"}</span>
                    </button>
                    {showRelationshipDisciplineMenu && (
                      <div className="absolute z-20 mt-1 w-full rounded border border-slate-300 bg-white p-2 shadow-lg">
                        {disciplineOptions.map((option) => {
                          const checked = relationshipDisciplineSelection.includes(option.key);
                          return (
                            <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-black hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setRelationshipDisciplineSelection((prev) =>
                                    prev.includes(option.key)
                                      ? prev.filter((key) => key !== option.key)
                                      : [...prev, option.key]
                                  )
                                }
                              />
                              <span className="text-black">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <label className="text-sm">Relationship Type
                  <div className="relative mt-1">
                    <select
                      className="w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-black"
                      value={relationshipCategory}
                      onChange={(e) => setRelationshipCategory(e.target.value as RelationshipCategory)}
                    >
                      <option value="information">Information</option>
                      <option value="systems">Systems</option>
                      <option value="process">Process</option>
                      <option value="data">Data</option>
                      <option value="other">Other</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black">▼</span>
                  </div>
                </label>
                {relationshipCategory === "other" && (
                  <label className="text-sm">Custom Relationship Type
                    <input
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                      placeholder="Enter relationship type for this link only"
                      value={relationshipCustomType}
                      onChange={(e) => setRelationshipCustomType(e.target.value)}
                    />
                  </label>
                )}
                <textarea
                  className="rounded border border-slate-300 px-3 py-2"
                  rows={3}
                  placeholder="Relationship description (optional)"
                  value={relationshipDescription}
                  onChange={(e) => setRelationshipDescription(e.target.value)}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="btn btn-outline" onClick={closeAddRelationshipModal}>Cancel</button>
                <button
                  className="btn btn-primary"
                  disabled={(!relationshipTargetDocumentId && !relationshipTargetSystemId) || (relationshipCategory === "other" && !relationshipCustomType.trim())}
                  onClick={handleAddRelation}
                >
                  Add relationship
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteNodeId && isMobile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70">
              <h2 className="text-lg font-semibold">Delete document?</h2>
              <p className="mt-2 text-sm text-slate-600">This will permanently remove the document from the map.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button className="btn btn-outline" onClick={() => setConfirmDeleteNodeId(null)}>Cancel</button>
                <button className="btn btn-primary bg-rose-700 hover:bg-rose-800" onClick={async () => {
                  const id = confirmDeleteNodeId;
                  setConfirmDeleteNodeId(null);
                  if (!id) return;
                  await handleDeleteNode(id);
                }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteOutlineItemId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70">
              <h2 className="text-lg font-semibold">Delete outline item?</h2>
              <p className="mt-2 text-sm text-slate-600">This removes the selected heading/content and any dependent children defined by your data rules.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button className="btn btn-outline" onClick={() => setConfirmDeleteOutlineItemId(null)}>Cancel</button>
                <button className="btn btn-primary bg-rose-700 hover:bg-rose-800" onClick={handleDeleteOutlineItem}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {selectedProcess && (
          <aside
            className={`fixed z-[75] border-r border-[#0b1f33] bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)] ${
              isMobile ? "inset-0 w-full max-w-full" : "bottom-0 left-0 top-[70px] w-full max-w-[420px]"
            }`}
          >
            <div className="flex h-full flex-col overflow-auto p-4">
              <div className="flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
                <h2 className="text-lg font-semibold text-white">Category Properties</h2>
                <button className="w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={() => setSelectedProcessId(null)}>Close</button>
              </div>
              <div className="mt-4 space-y-3">
                <label className="text-sm text-white">Category Label
                  <input
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={processHeadingDraft}
                    onChange={(e) => setProcessHeadingDraft(e.target.value)}
                    placeholder="Enter category label"
                  />
                </label>
                <label className="text-sm text-white">Width (small squares, min 10)
                  <input
                    type="number"
                    min={10}
                    step={1}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={processWidthDraft}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next)) return;
                      setProcessWidthDraft(Math.max(10, Math.round(next)));
                    }}
                  />
                </label>
                <label className="text-sm text-white">Height (small squares, min 3)
                  <input
                    type="number"
                    min={3}
                    step={1}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={processHeightDraft}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next)) return;
                      setProcessHeightDraft(Math.max(3, Math.round(next)));
                    }}
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
                  onClick={async () => {
                    await handleDeleteProcessElement(selectedProcess.id);
                  }}
                >
                  Delete category
                </button>
                <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={handleSaveProcessHeading}>Save category</button>
              </div>
            </div>
          </aside>
        )}
        {selectedSystem && (
          <aside
            className={`fixed z-[75] border-r border-[#0b1f33] bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)] ${
              isMobile ? "inset-0 w-full max-w-full" : "bottom-0 left-0 top-[70px] w-full max-w-[420px]"
            }`}
          >
            <div className="flex h-full flex-col overflow-auto p-4">
              <div className="flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
                <h2 className="text-lg font-semibold text-white">System Properties</h2>
                <button className="w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={() => setSelectedSystemId(null)}>Close</button>
              </div>
              <div className="mt-4 space-y-3">
                <label className="text-sm text-white">System Name
                  <input
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={systemNameDraft}
                    onChange={(e) => setSystemNameDraft(e.target.value)}
                    placeholder="Enter system name"
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
                  onClick={async () => {
                    await handleDeleteProcessElement(selectedSystem.id);
                  }}
                >
                  Delete system
                </button>
                <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={handleSaveSystemName}>Save name</button>
              </div>
            </div>
          </aside>
        )}
        {selectedProcessComponent && (
          <aside
            className={`fixed z-[75] border-r border-[#0b1f33] bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)] ${
              isMobile ? "inset-0 w-full max-w-full" : "bottom-0 left-0 top-[70px] w-full max-w-[420px]"
            }`}
          >
            <div className="flex h-full flex-col overflow-auto p-4">
              <div className="flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
                <h2 className="text-lg font-semibold text-white">Process Properties</h2>
                <button className="w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={() => setSelectedProcessComponentId(null)}>Close</button>
              </div>
              <div className="mt-4 space-y-3">
                <label className="text-sm text-white">Process Label
                  <input
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={processComponentLabelDraft}
                    onChange={(e) => setProcessComponentLabelDraft(e.target.value)}
                    placeholder="Enter process label"
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
                  onClick={async () => {
                    await handleDeleteProcessElement(selectedProcessComponent.id);
                  }}
                >
                  Delete process
                </button>
                <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={handleSaveProcessComponent}>Save label</button>
              </div>
            </div>
          </aside>
        )}
        {selectedGrouping && (
          <aside
            className={`fixed z-[75] border-r border-[#0b1f33] bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)] ${
              isMobile ? "inset-0 w-full max-w-full" : "bottom-0 left-0 top-[70px] w-full max-w-[420px]"
            }`}
          >
            <div className="flex h-full flex-col overflow-auto p-4">
              <div className="flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
                <h2 className="text-lg font-semibold text-white">Grouping Container</h2>
                <button className="w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={() => setSelectedGroupingId(null)}>Close</button>
              </div>
              <div className="mt-4 space-y-3">
                <label className="text-sm text-white">Group Label
                  <input
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={groupingLabelDraft}
                    onChange={(e) => setGroupingLabelDraft(e.target.value)}
                    placeholder="Enter group label"
                  />
                </label>
                <label className="text-sm text-white">Width (small squares)
                  <input
                    type="number"
                    min={Math.round(groupingMinWidth / minorGridSize)}
                    step={1}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={groupingWidthDraft}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next)) return;
                      setGroupingWidthDraft(Math.max(Math.round(groupingMinWidth / minorGridSize), Math.round(next)));
                    }}
                  />
                </label>
                <label className="text-sm text-white">Height (small squares)
                  <input
                    type="number"
                    min={Math.round(groupingMinHeight / minorGridSize)}
                    step={1}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={groupingHeightDraft}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next)) return;
                      setGroupingHeightDraft(Math.max(Math.round(groupingMinHeight / minorGridSize), Math.round(next)));
                    }}
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
                  onClick={async () => {
                    await handleDeleteProcessElement(selectedGrouping.id);
                  }}
                >
                  Delete container
                </button>
                <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={handleSaveGroupingContainer}>Save container</button>
              </div>
            </div>
          </aside>
        )}
        {selectedNode && !isMobile && (
          <aside className="fixed bottom-0 left-0 top-[70px] z-[75] w-full max-w-[420px] border-r border-[#0b1f33] bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)]">
            <div className="flex h-full flex-col overflow-auto p-4">
              <div className="flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
                <h2 className="text-lg font-semibold text-white">Document Properties</h2>
                <button className="w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={handleCloseDocumentPropertiesPanel}>Close</button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  title="Add Relationship"
                  aria-label="Add Relationship"
                  className="flex h-11 items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
                  onClick={() => {
                    setRelationshipSourceNodeId(selectedNode.id);
                    setRelationshipDocumentQuery("");
                    setRelationshipSystemQuery("");
                    setRelationshipTargetDocumentId("");
                    setRelationshipTargetSystemId("");
                    setShowRelationshipDocumentOptions(false);
                    setShowRelationshipSystemOptions(false);
                    setRelationshipDescription("");
                    setRelationshipDisciplineSelection([]);
                    setShowRelationshipDisciplineMenu(false);
                    setRelationshipCategory("information");
                    setRelationshipCustomType("");
                    setShowAddRelationship(true);
                    setDesktopNodeAction("relationship");
                  }}
                >
                  <img src="/icons/relationship.svg" alt="" className="h-4 w-4" />
                  <span className="truncate">Relationship</span>
                </button>
                <button
                  title="Document Structure"
                  aria-label="Document Structure"
                  className="flex h-11 items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
                  onClick={async () => {
                    setOutlineCreateMode(null);
                    closeOutlineEditor();
                    setConfirmDeleteOutlineItemId(null);
                    setCollapsedHeadingIds(new Set());
                    setOutlineNodeId(selectedNode.id);
                    await loadOutline(selectedNode.id);
                    setDesktopNodeAction("structure");
                  }}
                >
                  <img src="/icons/structure.svg" alt="" className="h-4 w-4" />
                  <span className="truncate">Structure</span>
                </button>
                <button
                  title="Delete Document"
                  aria-label="Delete Document"
                  className="flex h-11 items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
                  onClick={() => {
                    setConfirmDeleteNodeId(selectedNode.id);
                    setDesktopNodeAction("delete");
                  }}
                >
                  <img src="/icons/deletecomponent.svg" alt="" className="h-4 w-4" />
                  <span className="truncate">Delete</span>
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="text-sm text-white">Document Type
                  <div className="relative mt-1">
                    <select
                      className="w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-black"
                      value={selectedTypeId}
                      onChange={(e) => {
                        setSelectedTypeId(e.target.value);
                        setShowTypeSelectArrowUp(false);
                      }}
                      onFocus={() => setShowTypeSelectArrowUp(true)}
                      onBlur={() => setShowTypeSelectArrowUp(false)}
                      onMouseDown={() => setShowTypeSelectArrowUp(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape" || e.key === "Tab") setShowTypeSelectArrowUp(false);
                      }}
                    >
                      {addDocumentTypes.map((t) => <option key={t.id} value={t.id}>{getDisplayTypeName(t.name)}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black">
                      {showTypeSelectArrowUp ? "▲" : "▼"}
                    </span>
                  </div>
                </label>
                <label className="text-sm text-white">Name<input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
                <div className="text-sm text-white">
                  <div className="text-white">Discipline</div>
                  <div ref={disciplineMenuRef} className="relative mt-1">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left text-black"
                      onClick={() => setShowDisciplineMenu((prev) => !prev)}
                    >
                      <span className="truncate text-sm text-black">
                        {disciplineSelection.length
                          ? disciplineSelection.map((key) => disciplineLabelByKey.get(key)).filter(Boolean).join(", ")
                          : "Select disciplines"}
                      </span>
                      <span className="text-xs text-black">{showDisciplineMenu ? "▲" : "▼"}</span>
                    </button>
                    {showDisciplineMenu && (
                      <div className="absolute z-30 mt-1 w-full rounded border border-slate-300 bg-white p-2 shadow-lg">
                        {disciplineOptions.map((option) => {
                          const checked = disciplineSelection.includes(option.key);
                          return (
                            <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-black hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setDisciplineSelection((prev) =>
                                    prev.includes(option.key)
                                      ? prev.filter((key) => key !== option.key)
                                      : [...prev, option.key]
                                  )
                                }
                              />
                              <span className="text-black">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <label className="text-sm text-white">User Group
                  <div className="relative mt-1">
                    <select
                      className="w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-black"
                      value={userGroup}
                      onChange={(e) => {
                        setUserGroup(e.target.value);
                        setShowUserGroupSelectArrowUp(false);
                      }}
                      onFocus={() => setShowUserGroupSelectArrowUp(true)}
                      onBlur={() => setShowUserGroupSelectArrowUp(false)}
                      onMouseDown={() => setShowUserGroupSelectArrowUp(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape" || e.key === "Tab") setShowUserGroupSelectArrowUp(false);
                      }}
                    >
                      <option value="">Select user group</option>
                      {userGroup && !userGroupOptions.includes(userGroup as (typeof userGroupOptions)[number]) ? (
                        <option value={userGroup}>{userGroup}</option>
                      ) : null}
                      {userGroupOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black">
                      {showUserGroupSelectArrowUp ? "▲" : "▼"}
                    </span>
                  </div>
                </label>
                <label className="text-sm text-white">Owner<input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Enter owner name" /></label>
              </div>

              <div className="mt-4">
                <button className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={handleSaveNode}>Save properties</button>
              </div>

              <div className="mt-6 border-t border-[#5f7894]/70 pt-4">
                <h3 className="font-semibold text-white">Relationships</h3>
                <div className="mt-3 space-y-2">
                  {relatedRows.map((r) => {
                    const fromNode = nodes.find((n) => n.id === r.from_node_id) ?? null;
                    const toNode = r.to_node_id ? nodes.find((n) => n.id === r.to_node_id) ?? null : null;
                    const toSystem = r.target_system_element_id
                      ? elements.find((el) => el.id === r.target_system_element_id && el.element_type === "system_circle") ?? null
                      : null;
                    const fromLabel = fromNode?.title || "Unknown document";
                    const toLabel = toNode?.title || toSystem?.heading || "Unknown destination";
                    const toType = toNode ? "Document" : toSystem ? "System" : "Component";
                    const isEditing = editingRelationId === r.id;
                    return (
                      <div key={r.id} className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium">
                            {fromLabel} {"->"} {toLabel} <span className="font-normal text-slate-500">({toType})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              title="Edit relationship definition"
                              aria-label="Edit relationship definition"
                              className="rounded-none border border-slate-300 bg-white p-1 hover:bg-slate-100"
                              onClick={() => {
                                setEditingRelationId(r.id);
                                setEditingRelationDescription(r.relationship_description ?? "");
                                const nextCategory = (r.relationship_category || "information").toLowerCase();
                                setEditingRelationCategory(
                                  nextCategory === "information" || nextCategory === "systems" || nextCategory === "process" || nextCategory === "data" || nextCategory === "other"
                                    ? (nextCategory as RelationshipCategory)
                                    : "information"
                                );
                                setEditingRelationCustomType(r.relationship_custom_type ?? "");
                                setEditingRelationDisciplines(
                                  (r.relationship_disciplines ?? []).filter(
                                    (key): key is DisciplineKey => disciplineKeySet.has(key as DisciplineKey)
                                  )
                                );
                                setShowEditingRelationDisciplineMenu(false);
                              }}
                            >
                              <img src="/icons/edit.svg" alt="" className="h-4 w-4" />
                            </button>
                            <button
                              title="Delete relationship"
                              aria-label="Delete relationship"
                              className="rounded-none border border-slate-300 bg-white p-1 hover:bg-slate-100"
                              onClick={() => handleDeleteRelation(r.id)}
                            >
                              <img src="/icons/delete.svg" alt="" className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <div className="text-[11px]">
                              <div className="font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Type</div>
                              <div className="relative mt-1">
                                <select
                                  className="w-full appearance-none rounded-none border border-slate-300 bg-white px-2 py-1 text-xs text-black"
                                  value={editingRelationCategory}
                                  onChange={(e) => setEditingRelationCategory(e.target.value as RelationshipCategory)}
                                >
                                  <option value="information">Information</option>
                                  <option value="systems">Systems</option>
                                  <option value="process">Process</option>
                                  <option value="data">Data</option>
                                  <option value="other">Other</option>
                                </select>
                                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-black">▼</span>
                              </div>
                            </div>
                            {editingRelationCategory === "other" && (
                              <div className="text-[11px]">
                                <div className="font-semibold uppercase tracking-[0.05em] text-slate-500">Custom Type</div>
                                <input
                                  className="mt-1 w-full rounded-none border border-slate-300 px-2 py-1 text-xs text-black"
                                  value={editingRelationCustomType}
                                  onChange={(e) => setEditingRelationCustomType(e.target.value)}
                                  placeholder="Enter custom relationship type"
                                />
                              </div>
                            )}
                            <div className="text-[11px]">
                              <div className="font-semibold uppercase tracking-[0.05em] text-slate-500">Disciplines</div>
                              <div className="relative mt-1">
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between rounded-none border border-slate-300 bg-white px-2 py-1 text-left text-xs text-black"
                                  onClick={() => setShowEditingRelationDisciplineMenu((prev) => !prev)}
                                >
                                  <span className="truncate">
                                    {editingRelationDisciplines.length
                                      ? editingRelationDisciplines.map((key) => disciplineLabelByKey.get(key)).filter(Boolean).join(", ")
                                      : "Select disciplines"}
                                  </span>
                                  <span className="text-[10px] text-black">{showEditingRelationDisciplineMenu ? "▲" : "▼"}</span>
                                </button>
                                {showEditingRelationDisciplineMenu && (
                                  <div className="absolute z-30 mt-1 w-full rounded-none border border-slate-300 bg-white p-2 shadow-lg">
                                    {disciplineOptions.map((option) => {
                                      const checked = editingRelationDisciplines.includes(option.key);
                                      return (
                                        <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs text-black hover:bg-slate-50">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              setEditingRelationDisciplines((prev) =>
                                                prev.includes(option.key)
                                                  ? prev.filter((key) => key !== option.key)
                                                  : [...prev, option.key]
                                              )
                                            }
                                          />
                                          <span>{option.label}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Definition</div>
                            <textarea
                              className="w-full rounded-none border border-slate-300 px-2 py-1 text-xs"
                              rows={3}
                              value={editingRelationDescription}
                              onChange={(e) => setEditingRelationDescription(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                className="rounded-none border border-black bg-white px-2 py-1 text-xs font-semibold text-black hover:bg-slate-100"
                                onClick={() => void handleUpdateRelation(r.id)}
                              >
                                Save
                              </button>
                              <button
                                className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100"
                                onClick={() => {
                                  setEditingRelationId(null);
                                  setEditingRelationDescription("");
                                  setEditingRelationCategory("information");
                                  setEditingRelationCustomType("");
                                  setEditingRelationDisciplines([]);
                                  setShowEditingRelationDisciplineMenu(false);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Definition</div>
                            <div className="mt-1 text-xs text-slate-600">{r.relationship_description?.trim() || "No relationship context added by user"}</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        )}
        {selectedNode && !isMobile && desktopNodeAction === "relationship" && showAddRelationship && (
          <aside
            className="fixed bottom-0 left-[420px] top-[70px] z-[74] w-full max-w-[420px] border-l border-r border-slate-300 bg-white shadow-[-14px_0_28px_rgba(15,23,42,0.24),0_8px_22px_rgba(15,23,42,0.12)] transition-transform"
          >
            <div className="flex h-full flex-col overflow-auto p-4">
              <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                <h2 className="text-base font-semibold">Add Relationship</h2>
                <button className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={() => { closeAddRelationshipModal(); setDesktopNodeAction(null); }}>Close</button>
              </div>
              <p className="mt-3 text-sm text-slate-600">From: {relationshipSourceNode?.title || "Unknown document"}</p>
              <div className="mt-3 grid gap-3">
                <div className="relative">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Documents</div>
                  <div className="relative flex">
                    <input
                      className="w-full rounded-l border border-slate-300 bg-white px-3 py-2"
                      placeholder="Search documents..."
                      value={relationshipDocumentQuery}
                      onChange={(e) => {
                        const query = e.target.value;
                        setRelationshipDocumentQuery(query);
                        const candidateId = documentRelationCandidateIdByLabel.get(query) ?? "";
                        setRelationshipTargetDocumentId(candidateId && !alreadyRelatedDocumentTargetIds.has(candidateId) ? candidateId : "");
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-r border border-l-0 border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setShowRelationshipDocumentOptions((prev) => !prev);
                        setShowRelationshipSystemOptions(false);
                      }}
                    >
                      {showRelationshipDocumentOptions ? "▲" : "▼"}
                    </button>
                  </div>
                  {showRelationshipDocumentOptions && (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                      {documentRelationCandidates.length > 0 ? documentRelationCandidates.map((n) => {
                        const optionLabel = documentRelationCandidateLabelById.get(n.id) ?? n.title;
                        const isDisabled = alreadyRelatedDocumentTargetIds.has(n.id);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                              isDisabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-800 hover:bg-slate-50"
                            }`}
                            disabled={isDisabled}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (isDisabled) return;
                              setRelationshipTargetDocumentId(n.id);
                              setRelationshipTargetSystemId("");
                              setRelationshipDocumentQuery(optionLabel);
                              setShowRelationshipDocumentOptions(false);
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{optionLabel}</span>
                              {isDisabled && <span className="text-[10px] uppercase tracking-[0.06em]">Relationship already exists</span>}
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="px-3 py-2 text-sm text-slate-500">No search results found</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Systems</div>
                  <div className="relative flex">
                    <input
                      className="w-full rounded-l border border-slate-300 bg-white px-3 py-2"
                      placeholder="Search systems..."
                      value={relationshipSystemQuery}
                      onChange={(e) => {
                        const query = e.target.value;
                        setRelationshipSystemQuery(query);
                        const candidateId = systemRelationCandidateIdByLabel.get(query) ?? "";
                        setRelationshipTargetSystemId(candidateId && !alreadyRelatedSystemTargetIds.has(candidateId) ? candidateId : "");
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-r border border-l-0 border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setShowRelationshipSystemOptions((prev) => !prev);
                        setShowRelationshipDocumentOptions(false);
                      }}
                    >
                      {showRelationshipSystemOptions ? "▲" : "▼"}
                    </button>
                  </div>
                  {showRelationshipSystemOptions && (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                      {systemRelationCandidates.length > 0 ? systemRelationCandidates.map((el) => {
                        const optionLabel = systemRelationCandidateLabelById.get(el.id) ?? (el.heading || "System");
                        const isDisabled = alreadyRelatedSystemTargetIds.has(el.id);
                        return (
                          <button
                            key={el.id}
                            type="button"
                            className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                              isDisabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-800 hover:bg-slate-50"
                            }`}
                            disabled={isDisabled}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (isDisabled) return;
                              setRelationshipTargetSystemId(el.id);
                              setRelationshipTargetDocumentId("");
                              setRelationshipSystemQuery(optionLabel);
                              setShowRelationshipSystemOptions(false);
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{optionLabel}</span>
                              {isDisabled && <span className="text-[10px] uppercase tracking-[0.06em]">Relationship already exists</span>}
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="px-3 py-2 text-sm text-slate-500">No search results found</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Disciplines</div>
                  <div className="relative">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left text-slate-700"
                      onClick={() => setShowRelationshipDisciplineMenu((prev) => !prev)}
                    >
                      <span className="truncate text-sm">
                        {relationshipDisciplineSelection.length
                          ? relationshipDisciplineSelection.map((key) => disciplineLabelByKey.get(key)).filter(Boolean).join(", ")
                          : "Select disciplines"}
                      </span>
                      <span className="text-xs text-slate-500">{showRelationshipDisciplineMenu ? "▲" : "▼"}</span>
                    </button>
                    {showRelationshipDisciplineMenu && (
                      <div className="absolute z-20 mt-1 w-full rounded border border-slate-300 bg-white p-2 shadow-lg">
                        {disciplineOptions.map((option) => {
                          const checked = relationshipDisciplineSelection.includes(option.key);
                          return (
                            <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-black hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setRelationshipDisciplineSelection((prev) =>
                                    prev.includes(option.key)
                                      ? prev.filter((key) => key !== option.key)
                                      : [...prev, option.key]
                                  )
                                }
                              />
                              <span className="text-black">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <label className="text-sm">Relationship Type
                  <div className="relative mt-1">
                    <select
                      className="w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-black"
                      value={relationshipCategory}
                      onChange={(e) => setRelationshipCategory(e.target.value as RelationshipCategory)}
                    >
                      <option value="information">Information</option>
                      <option value="systems">Systems</option>
                      <option value="process">Process</option>
                      <option value="data">Data</option>
                      <option value="other">Other</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black">▼</span>
                  </div>
                </label>
                {relationshipCategory === "other" && (
                  <label className="text-sm">Custom Relationship Type
                    <input
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                      placeholder="Enter relationship type for this link only"
                      value={relationshipCustomType}
                      onChange={(e) => setRelationshipCustomType(e.target.value)}
                    />
                  </label>
                )}
                <textarea
                  className="rounded border border-slate-300 px-3 py-2"
                  rows={3}
                  placeholder="Relationship description (optional)"
                  value={relationshipDescription}
                  onChange={(e) => setRelationshipDescription(e.target.value)}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={(!relationshipTargetDocumentId && !relationshipTargetSystemId) || (relationshipCategory === "other" && !relationshipCustomType.trim())}
                  onClick={async () => { await handleAddRelation(); setDesktopNodeAction(null); }}
                >
                  Add relationship
                </button>
                <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={() => { closeAddRelationshipModal(); setDesktopNodeAction(null); }}>Cancel</button>
              </div>
            </div>
          </aside>
        )}
        {selectedNode && !isMobile && desktopNodeAction === "delete" && confirmDeleteNodeId && (
          <aside
            className="fixed bottom-0 left-[420px] top-[70px] z-[74] w-full max-w-[420px] border-l border-r border-slate-300 bg-white shadow-[-14px_0_28px_rgba(15,23,42,0.24),0_8px_22px_rgba(15,23,42,0.12)] transition-transform"
          >
            <div className="flex h-full flex-col overflow-auto p-4">
              <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                <h2 className="text-base font-semibold">Delete Document</h2>
                <button className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={() => { setConfirmDeleteNodeId(null); setDesktopNodeAction(null); }}>Close</button>
              </div>
              <p className="mt-3 text-sm text-slate-700">This will permanently remove the document from the map.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100" onClick={async () => {
                  const id = confirmDeleteNodeId;
                  setConfirmDeleteNodeId(null);
                  setDesktopNodeAction(null);
                  if (!id) return;
                  await handleDeleteNode(id);
                }}>Delete</button>
                <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={() => { setConfirmDeleteNodeId(null); setDesktopNodeAction(null); }}>Cancel</button>
              </div>
            </div>
          </aside>
        )}
        {selectedNode && isMobile && (
          <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/45 p-4 pt-16 md:items-center md:pt-4">
            <div className="max-h-[calc(100svh-2rem)] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70 md:max-h-[90vh]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Document Properties</h2>
                <button className="text-sm text-slate-500" onClick={() => setSelectedNodeId(null)}>Close</button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm">Document Type
                  <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)}>
                    {addDocumentTypes.map((t) => <option key={t.id} value={t.id}>{getDisplayTypeName(t.name)}</option>)}
                  </select>
                </label>
                <label className="text-sm">Name<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
                <div className="text-sm">
                  <div>Discipline</div>
                  <div ref={disciplineMenuRef} className="relative mt-1">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left"
                      onClick={() => setShowDisciplineMenu((prev) => !prev)}
                    >
                      <span className="truncate text-sm text-slate-700">
                        {disciplineSelection.length
                          ? disciplineSelection.map((key) => disciplineLabelByKey.get(key)).filter(Boolean).join(", ")
                          : "Select disciplines"}
                      </span>
                      <span className="text-xs text-slate-500">{showDisciplineMenu ? "▲" : "▼"}</span>
                    </button>
                    {showDisciplineMenu && (
                      <div className="absolute z-30 mt-1 w-full rounded border border-slate-300 bg-white p-2 shadow-lg">
                        {disciplineOptions.map((option) => {
                          const checked = disciplineSelection.includes(option.key);
                          return (
                            <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setDisciplineSelection((prev) =>
                                    prev.includes(option.key)
                                      ? prev.filter((key) => key !== option.key)
                                      : [...prev, option.key]
                                  )
                                }
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <label className="text-sm">User Group
                  <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={userGroup} onChange={(e) => setUserGroup(e.target.value)}>
                    <option value="">Select user group</option>
                    {userGroup && !userGroupOptions.includes(userGroup as (typeof userGroupOptions)[number]) ? (
                      <option value={userGroup}>{userGroup}</option>
                    ) : null}
                    {userGroupOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="text-sm">Owner<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Enter owner name" /></label>
              </div>

              <div className="mt-4 flex justify-end"><button className="btn btn-primary" onClick={handleSaveNode}>Save properties</button></div>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <h3 className="font-semibold">Relationships</h3>
                <div className="mt-3 space-y-2">
                  {relatedRows.map((r) => {
                    const otherId = r.from_node_id === selectedNode.id ? r.to_node_id : r.from_node_id;
                    const otherNode = otherId ? nodes.find((n) => n.id === otherId) : null;
                    const otherElement =
                      r.from_node_id === selectedNode.id && r.target_system_element_id
                        ? elements.find((el) => el.id === r.target_system_element_id)
                        : otherId
                          ? elements.find((el) => el.id === otherId)
                          : null;
                    const otherLabel = otherNode?.title || otherElement?.heading || otherId || "Linked Item";
                    const otherType = otherNode ? "Document" : otherElement?.element_type === "system_circle" ? "System" : "Component";
                    return <div key={r.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm"><span>{otherLabel} ({otherType})</span><button className="text-rose-700" onClick={() => handleDeleteRelation(r.id)}>Remove</button></div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {(isMobile || shouldShowDesktopStructurePanel) && (
        <aside
          className={`fixed z-[74] border-l border-r border-slate-300 shadow-[-14px_0_28px_rgba(15,23,42,0.24),0_8px_22px_rgba(15,23,42,0.12)] transition-transform ${
            isMobile
              ? "inset-0 w-full max-w-full bg-white md:inset-y-0 md:left-0 md:max-w-[420px]"
              : "bottom-0 left-[420px] top-[70px] w-full max-w-[420px] bg-white"
          }`}
          style={{
            transform: isMobile ? (outlineNodeId ? "translateX(0)" : "translateX(-100%)") : (shouldShowDesktopStructurePanel ? "translateX(0)" : "translateX(-100%)"),
          }}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Open Document Structure</h2><button className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={() => { setOutlineNodeId(null); setOutlineCreateMode(null); closeOutlineEditor(); setConfirmDeleteOutlineItemId(null); setDesktopNodeAction(null); }}>Close</button></div>
            </div>
            <div className="space-y-3 overflow-auto px-4 py-4">
              <div className="mt-2 rounded border border-slate-200 p-3">
                <div className="text-sm font-semibold">Actions</div>
                <div className="mt-2 flex gap-2">
                  <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={() => {
                    closeOutlineEditor();
                    setOutlineCreateMode("heading");
                    setNewHeadingTitle("");
                    setNewHeadingLevel(1);
                    setNewHeadingParentId("");
                  }}>Add Heading</button>
                  <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={() => {
                    closeOutlineEditor();
                    setOutlineCreateMode("content");
                    setNewContentText("");
                    setNewContentHeadingId(headingItems[0]?.id ?? "");
                  }}>Add Content</button>
                </div>
              </div>

              {outlineCreateMode === "heading" && (
                <div className="rounded border border-slate-200 p-3">
                  <div className="text-sm font-semibold">New Heading</div>
                  <label className="mt-2 block text-xs text-slate-600">Title</label>
                  <input
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={newHeadingTitle}
                    onChange={(e) => setNewHeadingTitle(e.target.value)}
                    placeholder="Enter heading title"
                  />
                  <label className="mt-2 block text-xs text-slate-600">Level</label>
                  <select
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={newHeadingLevel}
                    onChange={(e) => {
                      const next = Number(e.target.value) as 1 | 2 | 3;
                      setNewHeadingLevel(next);
                      setNewHeadingParentId("");
                    }}
                  >
                    <option value={1}>Level 1</option>
                    <option value={2}>Level 2</option>
                    <option value={3}>Level 3</option>
                  </select>
                  {newHeadingLevel === 2 && (
                    <>
                      <label className="mt-2 block text-xs text-slate-600">Parent L1 Heading</label>
                      <select
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        value={newHeadingParentId}
                        onChange={(e) => setNewHeadingParentId(e.target.value)}
                      >
                        <option value="">Select parent...</option>
                        {level1Headings.map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                      </select>
                    </>
                  )}
                  {newHeadingLevel === 3 && (
                    <>
                      <label className="mt-2 block text-xs text-slate-600">Parent L2 Heading</label>
                      <select
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        value={newHeadingParentId}
                        onChange={(e) => setNewHeadingParentId(e.target.value)}
                      >
                        <option value="">Select parent...</option>
                        {level2Headings.map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                      </select>
                    </>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <button className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={handleCreateHeading}>Add Heading</button>
                    <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={() => setOutlineCreateMode(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {outlineCreateMode === "content" && (
                <div className="rounded border border-slate-200 p-3">
                  <div className="text-sm font-semibold">New Content</div>
                  <label className="mt-2 block text-xs text-slate-600">Heading</label>
                  <select
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={newContentHeadingId}
                    onChange={(e) => setNewContentHeadingId(e.target.value)}
                  >
                    <option value="">Select heading...</option>
                    {headingItems.map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                  </select>
                  <label className="mt-2 block text-xs text-slate-600">Content</label>
                  <textarea
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    rows={4}
                    value={newContentText}
                    onChange={(e) => setNewContentText(e.target.value)}
                    placeholder="Enter content text"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={!headingItems.length} onClick={handleCreateContent}>Add Content</button>
                    <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={() => setOutlineCreateMode(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {outlineCreateMode === "content" && !headingItems.length && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Add a heading first before adding content.
                </div>
              )}

              {outlineEditItem && (
                <div className="rounded border border-slate-200 p-3">
                  <div className="text-sm font-semibold">Edit {outlineEditItem.kind === "heading" ? "Heading" : "Content"}</div>
                  {outlineEditItem.kind === "heading" ? (
                    <>
                      <label className="mt-2 block text-xs text-slate-600">Title</label>
                      <input
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editHeadingTitle}
                        onChange={(e) => setEditHeadingTitle(e.target.value)}
                        placeholder="Heading title"
                      />
                      <label className="mt-2 block text-xs text-slate-600">Level</label>
                      <select
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editHeadingLevel}
                        onChange={(e) => {
                          const next = Number(e.target.value) as 1 | 2 | 3;
                          setEditHeadingLevel(next);
                          setEditHeadingParentId("");
                        }}
                      >
                        <option value={1}>Level 1</option>
                        <option value={2}>Level 2</option>
                        <option value={3}>Level 3</option>
                      </select>
                      {editHeadingLevel === 2 && (
                        <>
                          <label className="mt-2 block text-xs text-slate-600">Parent L1 Heading</label>
                          <select
                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                            value={editHeadingParentId}
                            onChange={(e) => setEditHeadingParentId(e.target.value)}
                          >
                            <option value="">Select parent...</option>
                            {level1Headings.filter((h) => h.id !== outlineEditItem.id).map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                          </select>
                        </>
                      )}
                      {editHeadingLevel === 3 && (
                        <>
                          <label className="mt-2 block text-xs text-slate-600">Parent L2 Heading</label>
                          <select
                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                            value={editHeadingParentId}
                            onChange={(e) => setEditHeadingParentId(e.target.value)}
                          >
                            <option value="">Select parent...</option>
                            {level2Headings.filter((h) => h.id !== outlineEditItem.id).map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                          </select>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="mt-2 block text-xs text-slate-600">Heading</label>
                      <select
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        value={editContentHeadingId}
                        onChange={(e) => setEditContentHeadingId(e.target.value)}
                      >
                        <option value="">Select heading...</option>
                        {headingItems.map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                      </select>
                      <label className="mt-2 block text-xs text-slate-600">Content</label>
                      <textarea
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        rows={4}
                        value={editContentText}
                        onChange={(e) => setEditContentText(e.target.value)}
                        placeholder="Content text"
                      />
                    </>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <button className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={handleSaveOutlineEdit}>Save</button>
                    <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={closeOutlineEditor}>Cancel</button>
                  </div>
                </div>
              )}

              <div className="rounded border border-slate-200 p-3">
                <div className="text-sm font-semibold">Outline</div>
                <div className="mt-2 space-y-2">
                  {visibleOutlineItems.map((item) => {
                    const indent = item.kind === "heading" ? item.heading_level === 2 ? 16 : item.heading_level === 3 ? 32 : 0 : (() => {
                      const heading = outlineItems.find((h) => h.id === item.heading_id);
                      return heading?.heading_level === 2 ? 16 : heading?.heading_level === 3 ? 32 : 0;
                    })();
                    const isHeading = item.kind === "heading";
                    const isCollapsed = isHeading && collapsedHeadingIds.has(item.id);
                    return (
                      <div key={item.id} className="rounded border border-slate-200 px-3 py-2" style={{ marginLeft: indent }}>
                        <div className="flex items-start justify-between gap-2 text-sm">
                          <div className="flex items-start gap-2">
                            {isHeading ? (
                              <button
                                className="mt-[1px] h-4 w-4 rounded border border-slate-300 text-[10px] leading-none text-slate-600"
                                onClick={() => {
                                  setCollapsedHeadingIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(item.id)) next.delete(item.id);
                                    else next.add(item.id);
                                    return next;
                                  });
                                }}
                                aria-label={isCollapsed ? "Expand heading" : "Collapse heading"}
                              >
                                {isCollapsed ? "+" : "-"}
                              </button>
                            ) : <span className="inline-block h-4 w-4" />}
                            <div>{isHeading ? <strong>H{item.heading_level}: {item.title || "(Untitled heading)"}</strong> : <span>{item.content_text || "(Empty content)"}</span>}</div>
                          </div>
                          <div className="flex gap-2">
                            <button className="text-xs" onClick={() => openOutlineEditor(item)}>Edit</button>
                            <button className="text-xs text-rose-700" onClick={() => setConfirmDeleteOutlineItemId(item.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>
        )}
      </main>
    </div>
  );
}

export default function SystemMapCanvasClient({ mapId }: { mapId: string }) {
  return (
    <ReactFlowProvider>
      <SystemMapCanvasInner mapId={mapId} />
    </ReactFlowProvider>
  );
}
