"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
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
  to_node_id: string;
  relation_type: string;
  relationship_description: string | null;
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
  typeName: string;
  title: string;
  userGroup: string;
  discipline: string;
  bannerBg: string;
  bannerText: string;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const A4_RATIO = 1.414;
const minorGridSize = 24;
const majorGridSize = minorGridSize * 5;
const tileGridSpan = 5;
const defaultWidth = minorGridSize * tileGridSpan;
const defaultHeight = Math.round(defaultWidth * A4_RATIO);
const laneHeight = 260;
const fallbackHierarchy = [
  { name: "System Manual", level_rank: 1 },
  { name: "Policy", level_rank: 2 },
  { name: "Management Plan", level_rank: 3 },
  { name: "Procedure", level_rank: 4 },
  { name: "Work Instruction", level_rank: 5 },
  { name: "Form / Template", level_rank: 6 },
  { name: "Record", level_rank: 7 },
] as const;

const getDisplayTypeName = (typeName: string) =>
  typeName.trim().toLowerCase() === "management system manual" ? "System Manual" : typeName;
const getDisplayRelationType = (relationType: string) => {
  if (!relationType) return "Related";
  const trimmed = relationType.trim();
  if (!trimmed) return "Related";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const getTypeBannerStyle = (typeName: string) => {
  const key = typeName.toLowerCase();
  if (key.includes("manual")) return { bg: "#b91c1c", text: "#ffffff" };
  if (key.includes("policy")) return { bg: "#7e22ce", text: "#ffffff" };
  if (key.includes("management plan")) return { bg: "#1d4ed8", text: "#ffffff" };
  if (key.includes("procedure")) return { bg: "#c2410c", text: "#ffffff" };
  if (key.includes("work instruction")) return { bg: "#facc15", text: "#1f2937" };
  if (key.includes("form")) return { bg: "#15803d", text: "#ffffff" };
  if (key.includes("record")) return { bg: "#475569", text: "#ffffff" };
  return { bg: "#64748b", text: "#ffffff" };
};

function DocumentTileNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full flex-col border border-slate-300 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
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
        <div className="overflow-hidden text-center text-[10px] font-semibold leading-tight text-slate-900">
          {data.title || "Untitled Document"}
        </div>
        <div className="mt-auto space-y-1 text-[8px] leading-tight">
          <div className="space-y-[1px] border border-slate-300 px-1 py-[2px]">
            <div className="text-center font-semibold text-slate-700">User Group</div>
            <div className="truncate text-center text-slate-500">{data.userGroup || "Unassigned"}</div>
          </div>
          <div className="space-y-[1px] border border-slate-300 px-1 py-[2px]">
            <div className="text-center font-semibold text-slate-700">Discipline</div>
            <div className="truncate text-center text-slate-500">{data.discipline || "No discipline"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemMapCanvasInner({ mapId }: { mapId: string }) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const saveViewportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedPos = useRef<Record<string, { x: number; y: number }>>({});
  const lastMobileTapRef = useRef<{ id: string; ts: number } | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [map, setMap] = useState<SystemMap | null>(null);
  const [types, setTypes] = useState<DocumentTypeRow[]>([]);
  const [nodes, setNodes] = useState<DocumentNodeRow[]>([]);
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

  const [addTypeId, setAddTypeId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const snapToMinorGrid = useCallback((v: number) => Math.round(v / minorGridSize) * minorGridSize, []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [userGroup, setUserGroup] = useState("");
  const [ownerName, setOwnerName] = useState("");

  const [contextNode, setContextNode] = useState<{ id: string; x: number; y: number } | null>(null);
  const [mobileNodeMenuId, setMobileNodeMenuId] = useState<string | null>(null);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [relationshipSourceNodeId, setRelationshipSourceNodeId] = useState<string | null>(null);
  const [relationshipTargetQuery, setRelationshipTargetQuery] = useState("");
  const [relationshipTargetId, setRelationshipTargetId] = useState("");
  const [showRelationshipOptions, setShowRelationshipOptions] = useState(false);
  const [relationshipDescription, setRelationshipDescription] = useState("");
  const [confirmDeleteNodeId, setConfirmDeleteNodeId] = useState<string | null>(null);
  const [outlineNodeId, setOutlineNodeId] = useState<string | null>(null);
  const [outlineItems, setOutlineItems] = useState<OutlineItemRow[]>([]);
  const [outlineCreateMode, setOutlineCreateMode] = useState<"heading" | "content" | null>(null);
  const [outlineEditItemId, setOutlineEditItemId] = useState<string | null>(null);
  const [confirmDeleteOutlineItemId, setConfirmDeleteOutlineItemId] = useState<string | null>(null);
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

  const [flowNodes, setFlowNodes, onFlowNodesChange] = useNodesState<Node<FlowData>>([]);
  const nodeTypes = useMemo(() => ({ documentTile: DocumentTileNode }), []);

  useEffect(() => {
    setFlowNodes(
      nodes.map((n) => {
        const width = n.width ?? defaultWidth;
        const height = Math.round(width * A4_RATIO);
        const rawTypeName = typesById.get(n.type_id)?.name ?? "Document";
        const typeName = getDisplayTypeName(rawTypeName);
        const banner = getTypeBannerStyle(typeName);
        return {
          id: n.id,
          type: "documentTile",
          position: { x: n.pos_x, y: n.pos_y },
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
            typeName,
            title: n.title ?? "",
            userGroup: n.user_group ?? "",
            discipline: n.discipline ?? "",
            bannerBg: banner.bg,
            bannerText: banner.text,
          },
        };
      })
    );
  }, [nodes, typesById, setFlowNodes]);

  const flowEdges = useMemo<Edge[]>(
    () => {
      const nodesById = new Map(nodes.map((n) => [n.id, n]));
      const hasHoveredRelations = !!hoveredNodeId && relations.some((rel) => rel.from_node_id === hoveredNodeId || rel.to_node_id === hoveredNodeId);
      return relations.map((r) => {
        const from = nodesById.get(r.from_node_id);
        const to = nodesById.get(r.to_node_id);
        const fromRank = from ? (typesById.get(from.type_id)?.level_rank ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
        const toRank = to ? (typesById.get(to.type_id)?.level_rank ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;

        let source = r.from_node_id;
        let target = r.to_node_id;
        let sourceHandle = "bottom";
        let targetHandle = "top";

        if (from && to) {
          if (fromRank < toRank) {
            source = from.id;
            target = to.id;
            sourceHandle = "bottom";
            targetHandle = "top";
          } else if (toRank < fromRank) {
            source = to.id;
            target = from.id;
            sourceHandle = "bottom";
            targetHandle = "top";
          } else if (from.pos_x <= to.pos_x) {
            source = from.id;
            target = to.id;
            sourceHandle = "right";
            targetHandle = "left-target";
          } else {
            source = to.id;
            target = from.id;
            sourceHandle = "right";
            targetHandle = "left-target";
          }
        }

        const isConnectedToHovered = hoveredNodeId ? (r.from_node_id === hoveredNodeId || r.to_node_id === hoveredNodeId) : false;
        const edgeStroke = hasHoveredRelations ? (isConnectedToHovered ? "#0f766e" : "#cbd5e1") : "#0f766e";
        const edgeWidth = hasHoveredRelations ? (isConnectedToHovered ? 1.8 : 1.1) : 1.25;
        const edgeLabelColor = hasHoveredRelations ? (isConnectedToHovered ? "#334155" : "#94a3b8") : "#334155";

        return {
          id: r.id,
          source,
          target,
          sourceHandle,
          targetHandle,
          type: "smoothstep",
          label: r.relationship_description?.trim() || getDisplayRelationType(r.relation_type),
          style: { stroke: edgeStroke, strokeWidth: edgeWidth },
          labelStyle: { fill: edgeLabelColor, fontSize: 11 },
        };
      });
    },
    [relations, nodes, typesById, hoveredNodeId]
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [selectedNodeId, nodes]
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
    const run = async () => {
      setLoading(true);
      setError(null);
      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(`/login?returnTo=${encodeURIComponent(`/system-maps/${mapId}`)}`);
        return;
      }
      setUserId(user.id);

      const [mapRes, typeRes, nodeRes, relRes, viewRes] = await Promise.all([
        supabaseBrowser.schema("ms").from("system_maps").select("id,title,description,updated_at,created_at").eq("id", mapId).maybeSingle(),
        supabaseBrowser.schema("ms").from("document_types").select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active").eq("is_active", true).or(`map_id.eq.${mapId},map_id.is.null`).order("level_rank", { ascending: true }),
        supabaseBrowser.schema("ms").from("document_nodes").select("id,map_id,type_id,title,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived").eq("map_id", mapId).eq("is_archived", false),
        supabaseBrowser.schema("ms").from("node_relations").select("id,map_id,from_node_id,to_node_id,relation_type,relationship_description").eq("map_id", mapId),
        supabaseBrowser.schema("ms").from("map_view_state").select("pan_x,pan_y,zoom").eq("map_id", mapId).eq("user_id", user.id).maybeSingle(),
      ]);

      if (mapRes.error || !mapRes.data) {
        setError("Unable to load this map. You may not have access.");
        setLoading(false);
        return;
      }
      if (typeRes.error || nodeRes.error || relRes.error) {
        setError("Unable to load map data.");
        setLoading(false);
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
      setTypes(loadedTypes);
      const loadedNodes = (nodeRes.data ?? []) as DocumentNodeRow[];
      setNodes(loadedNodes);
      setRelations((relRes.data ?? []) as NodeRelationRow[]);
      const nextSaved: Record<string, { x: number; y: number }> = {};
      loadedNodes.forEach((n) => (nextSaved[n.id] = { x: n.pos_x, y: n.pos_y }));
      savedPos.current = nextSaved;

      if (viewRes.data) {
        setPendingViewport({ x: viewRes.data.pan_x, y: viewRes.data.pan_y, zoom: viewRes.data.zoom });
      }
      setLoading(false);
    };

    run();
  }, [mapId]);

  useEffect(() => {
    if (!rf || !pendingViewport) return;
    rf.setViewport(pendingViewport, { duration: 250 });
    setPendingViewport(null);
  }, [rf, pendingViewport]);

  useEffect(() => {
    if (!selectedNode) return;
    setTitle(selectedNode.title ?? "");
    setDiscipline(selectedNode.discipline ?? "");
    setUserGroup(selectedNode.user_group ?? "");
    setOwnerName(selectedNode.owner_name ?? "");
  }, [selectedNode]);

  useEffect(() => {
    if (!map) return;
    setMapTitleDraft(map.title);
  }, [map]);

  useEffect(() => {
    if (!showAdd) return;
    if (!addTypeId && types.length) {
      setAddTypeId(types[0].id);
    }
  }, [showAdd, addTypeId, types]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const apply = () => {
      const touchCapable = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
      setIsMobile(mq.matches || touchCapable || window.innerWidth <= 900);
    };
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
    const source = nodes.find((n) => n.id === node.id);
    if (!source) return;
    const x = snapToMinorGrid(node.position.x);
    const y = snapToMinorGrid(node.position.y);
    const old = savedPos.current[node.id] ?? { x: source.pos_x, y: source.pos_y };
    setFlowNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, position: { x, y } } : n)));
    setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, pos_x: x, pos_y: y } : n)));

    const { error: e } = await supabaseBrowser.schema("ms").from("document_nodes").update({ pos_x: x, pos_y: y }).eq("id", node.id).eq("map_id", mapId);
    if (e) {
      setError(e.message || "Unable to save position. Reverting.");
      setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, pos_x: old.x, pos_y: old.y } : n)));
      return;
    }
    savedPos.current[node.id] = { x, y };
  }, [nodes, mapId, snapToMinorGrid]);

  const handleAddDocument = async () => {
    if (!addTypeId || !rf || !canvasRef.current) return;
    const t = types.find((item) => item.id === addTypeId);
    if (!t) return;
    const box = canvasRef.current.getBoundingClientRect();
    const center = rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    const x = snapToMinorGrid(center.x);
    const y = snapToMinorGrid(center.y);

    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("document_nodes")
      .insert({ map_id: mapId, type_id: addTypeId, title: "Untitled Document", pos_x: x, pos_y: y, width: defaultWidth, height: defaultHeight })
      .select("id,map_id,type_id,title,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to create document.");
      return;
    }
    const inserted = data as DocumentNodeRow;
    setNodes((prev) => [...prev, inserted]);
    savedPos.current[inserted.id] = { x: inserted.pos_x, y: inserted.pos_y };
    setAddTypeId("");
    setShowAdd(false);
  };

  const handleSaveNode = async () => {
    if (!selectedNodeId) return;
    const payload = {
      title: title.trim() || "Untitled Document",
      discipline: discipline.trim() || null,
      user_group: userGroup.trim() || null,
      owner_name: ownerName.trim() || null,
      owner_user_id: null,
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

  const relationCandidates = useMemo(() => {
    if (!relationshipSourceNodeId) return [];
    const term = relationshipTargetQuery.trim().toLowerCase();
    return nodes
      .filter((n) => n.id !== relationshipSourceNodeId)
      .filter((n) => n.title.toLowerCase().includes(term));
  }, [nodes, relationshipSourceNodeId, relationshipTargetQuery]);

  const relationCandidateLabelById = useMemo(() => {
    const m = new Map<string, string>();
    relationCandidates.forEach((n) => m.set(n.id, `${n.title} (${n.discipline || "No discipline"})`));
    return m;
  }, [relationCandidates]);

  const relationCandidateIdByLabel = useMemo(() => {
    const m = new Map<string, string>();
    relationCandidates.forEach((n) => m.set(`${n.title} (${n.discipline || "No discipline"})`, n.id));
    return m;
  }, [relationCandidates]);
  const alreadyRelatedTargetIds = useMemo(() => {
    const ids = new Set<string>();
    if (!relationshipSourceNodeId) return ids;
    relations.forEach((r) => {
      if (r.from_node_id === relationshipSourceNodeId) ids.add(r.to_node_id);
      if (r.to_node_id === relationshipSourceNodeId) ids.add(r.from_node_id);
    });
    return ids;
  }, [relations, relationshipSourceNodeId]);
  const relationshipQueryLength = relationshipTargetQuery.trim().length;
  const showRelationshipDropdown = showRelationshipOptions && relationshipQueryLength >= 3;

  const handleAddRelation = async () => {
    if (!relationshipSourceNodeId || !relationshipTargetId) return;
    const exists = relations.some(
      (r) =>
        (r.from_node_id === relationshipSourceNodeId && r.to_node_id === relationshipTargetId) ||
        (r.from_node_id === relationshipTargetId && r.to_node_id === relationshipSourceNodeId)
    );
    if (exists) {
      setError("Relationship already exists between these documents.");
      return;
    }
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("node_relations")
      .insert({
        map_id: mapId,
        from_node_id: relationshipSourceNodeId,
        to_node_id: relationshipTargetId,
        relation_type: "Related",
        relationship_description: relationshipDescription.trim() || null,
      })
      .select("id,map_id,from_node_id,to_node_id,relation_type,relationship_description")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to add relation.");
      return;
    }
    setRelations((prev) => [...prev, data as NodeRelationRow]);
    setShowAddRelationship(false);
    setRelationshipSourceNodeId(null);
    setRelationshipTargetId("");
    setRelationshipTargetQuery("");
    setShowRelationshipOptions(false);
    setRelationshipDescription("");
  };

  const handleDeleteRelation = async (id: string) => {
    const { error: e } = await supabaseBrowser.schema("ms").from("node_relations").delete().eq("id", id).eq("map_id", mapId);
    if (e) {
      setError(e.message || "Unable to delete relation.");
      return;
    }
    setRelations((prev) => prev.filter((r) => r.id !== id));
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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading map...</div>;
  }

  if (!map) {
    return <div className="flex min-h-screen items-center justify-center text-rose-700">{error || "Map not found."}</div>;
  }

  return (
    <div className="flex min-h-screen h-dvh flex-col bg-slate-100">
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <a href="/"><img src="/images/logo-black.png" alt="HSES" className="header-logo" /></a>
          </div>
          <div className="header-actions !flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-end">
            <a
              className="btn btn-outline h-10 w-10 px-0 text-sm sm:h-10 sm:w-auto sm:px-3 sm:text-sm"
              href="/system-maps"
              aria-label="Back to all system maps"
              title="All system maps"
            >
              <span className="sm:hidden">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </span>
              <span className="hidden sm:inline">All system maps</span>
            </a>
            <button
              type="button"
              className="btn btn-outline h-10 w-10 px-0 text-sm sm:h-10 sm:w-auto sm:px-3 sm:text-sm"
              onClick={() => rf?.fitView({ duration: 300, padding: 0.2 })}
              aria-label="Zoom to fit"
              title="Zoom to fit"
            >
              <span className="sm:hidden">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </span>
              <span className="hidden sm:inline">Zoom to fit</span>
            </button>
            <button
              type="button"
              className="btn btn-outline h-10 w-10 px-0 text-sm sm:h-10 sm:w-auto sm:px-3 sm:text-sm"
              onClick={() => rf?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })}
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              <span className="sm:hidden">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 2.64-6.36" />
                  <path d="M3 4v5h5" />
                </svg>
              </span>
              <span className="hidden sm:inline">Reset zoom</span>
            </button>
            <button
              type="button"
              className="btn btn-primary h-10 w-10 px-0 text-sm sm:h-10 sm:w-auto sm:px-3 sm:text-sm"
              onClick={() => setShowAdd(true)}
              aria-label="Add document"
              title="Add document"
            >
              <span className="sm:hidden">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </span>
              <span className="hidden sm:inline">Add Document</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute left-4 top-4 z-20 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow">
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
            setContextNode(null);
            setMobileNodeMenuId(null);
          }}
        >
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onInit={(instance) => setRf({ fitView: instance.fitView, screenToFlowPosition: instance.screenToFlowPosition, setViewport: instance.setViewport })}
            onNodesChange={onFlowNodesChange}
            onNodeClick={(_, n) => {
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
              setSelectedNodeId(n.id);
            }}
            onNodeContextMenu={(e, n) => {
              e.preventDefault();
              if (isMobile) {
                setMobileNodeMenuId(n.id);
                return;
              }
              setContextNode({ id: n.id, x: e.clientX, y: e.clientY });
            }}
            onNodeMouseEnter={(_, n) => setHoveredNodeId(n.id)}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            onNodeDragStop={onNodeDragStop}
            onMoveEnd={onMoveEnd}
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

        {contextNode && (
          <div className="fixed z-50 min-w-[200px] rounded-lg border border-slate-200 bg-white p-1 shadow-xl" style={{ left: contextNode.x, top: contextNode.y }}>
            <button className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={() => {
              setRelationshipSourceNodeId(contextNode.id);
              setRelationshipTargetQuery("");
              setRelationshipTargetId("");
              setShowRelationshipOptions(false);
              setRelationshipDescription("");
              setShowAddRelationship(true);
              setContextNode(null);
            }}>Add Relationship</button>
            <button className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={async () => {
              setOutlineCreateMode(null);
              closeOutlineEditor();
              setConfirmDeleteOutlineItemId(null);
              setCollapsedHeadingIds(new Set());
              setOutlineNodeId(contextNode.id);
              setContextNode(null);
              await loadOutline(contextNode.id);
            }}>Open Document Structure</button>
            <button className="block w-full rounded px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50" onClick={() => {
              const id = contextNode.id;
              setContextNode(null);
              setConfirmDeleteNodeId(id);
            }}>Delete Document</button>
          </div>
        )}

        {mobileNodeMenuId && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:p-4">
            <div className="w-full rounded-t-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200/70 sm:max-w-md sm:rounded-xl">
              <div className="mb-2 text-sm font-semibold text-slate-900">
                {nodes.find((n) => n.id === mobileNodeMenuId)?.title || "Document"}
              </div>
              <div className="grid gap-2">
                <button className="btn btn-outline justify-start" onClick={() => {
                  setSelectedNodeId(mobileNodeMenuId);
                  setMobileNodeMenuId(null);
                }}>Edit Properties</button>
                <button className="btn btn-outline justify-start" onClick={() => {
                  setRelationshipSourceNodeId(mobileNodeMenuId);
                  setRelationshipTargetQuery("");
                  setRelationshipTargetId("");
                  setShowRelationshipOptions(false);
                  setRelationshipDescription("");
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

        {showAddRelationship && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70">
              <h2 className="text-lg font-semibold">Add Relationship</h2>
              <p className="mt-1 text-sm text-slate-600">From: {relationshipSourceNode?.title || "Unknown document"}</p>
              <div className="mt-4 grid gap-3">
                <div className="relative">
                  <input
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 pr-9"
                    placeholder="Select related document..."
                    value={relationshipTargetQuery}
                    onBlur={() => {
                      setTimeout(() => setShowRelationshipOptions(false), 120);
                    }}
                    onChange={(e) => {
                      const query = e.target.value;
                      setRelationshipTargetQuery(query);
                      const candidateId = relationCandidateIdByLabel.get(query) ?? "";
                      setRelationshipTargetId(candidateId && !alreadyRelatedTargetIds.has(candidateId) ? candidateId : "");
                      setShowRelationshipOptions(query.trim().length >= 3);
                    }}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">▼</span>
                  {showRelationshipDropdown && (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                      {relationCandidates.length > 0 ? relationCandidates.map((n) => {
                        const optionLabel = relationCandidateLabelById.get(n.id) ?? n.title;
                        const isDisabled = alreadyRelatedTargetIds.has(n.id);
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
                              setRelationshipTargetId(n.id);
                              setRelationshipTargetQuery(optionLabel);
                              setShowRelationshipOptions(false);
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
                <textarea
                  className="rounded border border-slate-300 px-3 py-2"
                  rows={3}
                  placeholder="Relationship description (optional)"
                  value={relationshipDescription}
                  onChange={(e) => setRelationshipDescription(e.target.value)}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="btn btn-outline" onClick={() => {
                  setShowAddRelationship(false);
                  setRelationshipSourceNodeId(null);
                  setRelationshipTargetId("");
                  setRelationshipTargetQuery("");
                  setShowRelationshipOptions(false);
                  setRelationshipDescription("");
                }}>Cancel</button>
                <button className="btn btn-primary" disabled={!relationshipTargetId} onClick={handleAddRelation}>Add relationship</button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteNodeId && (
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

        {showAdd && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70">
              <h2 className="text-lg font-semibold">Add Document</h2>
              <select className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2" value={addTypeId} onChange={(e) => setAddTypeId(e.target.value)}>
                <option value="">Select type...</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name} (rank {t.level_rank})</option>)}
              </select>
              {!types.length && <p className="mt-2 text-sm text-rose-700">No document types are available for this map.</p>}
              <div className="mt-4 flex justify-end gap-2">
                <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={!addTypeId} onClick={handleAddDocument}>Create</button>
              </div>
            </div>
          </div>
        )}

        {selectedNode && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Document Properties</h2>
                <button className="text-sm text-slate-500" onClick={() => setSelectedNodeId(null)}>Close</button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm">Name<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
                <label className="text-sm">Discipline<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={discipline} onChange={(e) => setDiscipline(e.target.value)} /></label>
                <label className="text-sm">User Group<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={userGroup} onChange={(e) => setUserGroup(e.target.value)} /></label>
                <label className="text-sm">Owner<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Enter owner name" /></label>
              </div>

              <div className="mt-4 flex justify-end"><button className="btn btn-primary" onClick={handleSaveNode}>Save properties</button></div>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <h3 className="font-semibold">Relationships</h3>
                <div className="mt-3 space-y-2">
                  {relatedRows.map((r) => {
                    const otherId = r.from_node_id === selectedNode.id ? r.to_node_id : r.from_node_id;
                    const other = nodes.find((n) => n.id === otherId);
                    const relText = r.relationship_description?.trim() || getDisplayRelationType(r.relation_type);
                    return <div key={r.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm"><span>{relText} {"->"} {other?.title || otherId}</span><button className="text-rose-700" onClick={() => handleDeleteRelation(r.id)}>Remove</button></div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <aside className="fixed inset-0 z-[70] w-full max-w-full border-r border-slate-200 bg-white shadow-xl transition-transform md:inset-y-0 md:left-0 md:max-w-[420px]" style={{ transform: outlineNodeId ? "translateX(0)" : "translateX(-100%)" }}>
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Open Document Structure</h2><button className="btn btn-outline px-2 py-1 text-xs" onClick={() => { setOutlineNodeId(null); setOutlineCreateMode(null); closeOutlineEditor(); setConfirmDeleteOutlineItemId(null); }}>Close</button></div>
            </div>
            <div className="space-y-3 overflow-auto px-4 py-4">
              <div className="mt-2 rounded border border-slate-200 p-3">
                <div className="text-sm font-semibold">Actions</div>
                <div className="mt-2 flex gap-2">
                  <button className="btn btn-outline" onClick={() => {
                    closeOutlineEditor();
                    setOutlineCreateMode("heading");
                    setNewHeadingTitle("");
                    setNewHeadingLevel(1);
                    setNewHeadingParentId("");
                  }}>Add Heading</button>
                  <button className="btn btn-outline" onClick={() => {
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
                    <button className="btn btn-outline" onClick={() => setOutlineCreateMode(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCreateHeading}>Add Heading</button>
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
                    <button className="btn btn-outline" onClick={() => setOutlineCreateMode(null)}>Cancel</button>
                    <button className="btn btn-primary" disabled={!headingItems.length} onClick={handleCreateContent}>Add Content</button>
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
                    <button className="btn btn-outline" onClick={closeOutlineEditor}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSaveOutlineEdit}>Save</button>
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
