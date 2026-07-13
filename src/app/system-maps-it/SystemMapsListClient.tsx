"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconLink,
  IconX,
  IconCopy,
  IconFiles,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { reportUserActivity } from "@/lib/userActivityClient";
import { cn } from "@/lib/utils";

type SystemMapRow = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  map_code: string | null;
  map_category?: "document_map" | "system_map" | "bow_tie" | "incident_investigation" | "org_chart" | "process_flow" | null;
  role: string;
  updated_at: string;
  created_at: string;
};

type MapMemberRow = {
  map_id: string;
  user_id: string;
  role: string;
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
  document_number: string | null;
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
type CanvasElementRow = {
  id: string;
  map_id: string;
  element_type: string;
  heading: string;
  color_hex: string | null;
  created_by_user_id: string | null;
  element_config: Record<string, unknown> | null;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
};
type NodeRelationRow = {
  id: string;
  map_id: string;
  from_node_id: string | null;
  to_node_id: string | null;
  source_grouping_element_id: string | null;
  target_grouping_element_id: string | null;
  source_system_element_id: string | null;
  target_system_element_id: string | null;
  relation_type: string;
  relationship_description: string | null;
  relationship_disciplines: string[] | null;
  relationship_category: string | null;
  relationship_custom_type: string | null;
};
type DocumentOutlineItemRow = {
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
};

type MapCategoryOption = {
  id: "document_map" | "system_map" | "bow_tie" | "incident_investigation" | "org_chart" | "process_flow";
  label: string;
  description: string;
};

const mapCategoryOptions: MapCategoryOption[] = [
  { id: "document_map", label: "Document Map", description: "Document-centric compliance and management maps." },
  { id: "system_map", label: "System Map", description: "Management system architecture and relationship maps." },
  { id: "bow_tie", label: "Bow Tie", description: "Hazard, controls, escalation and consequence mapping." },
  { id: "incident_investigation", label: "Incident Investigation", description: "Investigation workflows and evidence maps." },
  { id: "org_chart", label: "Org Chart", description: "People and team structure mapping." },
  { id: "process_flow", label: "Process Flow", description: "Process-oriented maps for flow, systems, and related content." },
];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SystemMapsListClient() {
  const router = useRouter();
  const pageSize = 7;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [deletingMapId, setDeletingMapId] = useState<string | null>(null);
  const [duplicatingMapId, setDuplicatingMapId] = useState<string | null>(null);
  const [duplicateProgress, setDuplicateProgress] = useState<{ percent: number; message: string; status: "idle" | "running" | "success" | "error" | "aborted" }>({
    percent: 0,
    message: "",
    status: "idle",
  });
  const [duplicateCancelRequested, setDuplicateCancelRequested] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [pendingDuplicateRow, setPendingDuplicateRow] = useState<SystemMapRow | null>(null);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<SystemMapRow | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [mapCodeInput, setMapCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SystemMapRow[]>([]);
  const duplicateAbortRef = useRef(false);
  const [page, setPage] = useState(1);
  const createMenuRef = useRef<HTMLDivElement>(null);

  const redirectToLogin = useMemo(
    () => `/login?returnTo=${encodeURIComponent("/system-maps")}`,
    []
  );

  const recordMapActivity = (
    action: string,
    status: "success" | "failed" | "info",
    summary: string,
    metadata: Record<string, unknown> = {}
  ) => {
    void reportUserActivity({ action, status, summary, metadata });
  };

  const loadMaps = async () => {
    const user = await ensurePortalSupabaseUser();
    if (!user) {
      window.location.assign(redirectToLogin);
      return;
    }
    setCurrentUserId(user.id);

    const { data: memberRows, error: memberError } = await supabaseBrowser
      .schema("ms")
      .from("map_members")
      .select("map_id,user_id,role")
      .eq("user_id", user.id);

    if (memberError) {
      setError(memberError.message || "Unable to load map memberships.");
      return;
    }

    const memberByMapId = new Map<string, MapMemberRow>();
    (memberRows ?? []).forEach((row) => memberByMapId.set(row.map_id, row as MapMemberRow));

    const { data, error: mapsError } = await supabaseBrowser
      .schema("ms")
      .from("system_maps")
      .select("id,title,description,owner_id,map_code,map_category,updated_at,created_at")
      .eq("is_template_editor", false)
      .order("updated_at", { ascending: false });

    if (mapsError) {
      setError(mapsError.message || "Unable to load system maps.");
      return;
    }

    const mergedRows = ((data ?? []) as Omit<SystemMapRow, "role">[]).map((row) => ({
      ...row,
      role: row.owner_id === user.id ? "full_write" : memberByMapId.get(row.id)?.role ?? "read",
    }));
    setRows(mergedRows);
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadMaps();
      } catch {
        setError("Unable to load system maps.");
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    setPage((current) => Math.min(current, totalPages));
  }, [pageSize, rows.length]);

  useEffect(() => {
    if (!showCreateMenu) return;
    const handleClick = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setShowCreateMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCreateMenu]);

  const handleCreateMap = async (mapCategory: MapCategoryOption["id"]) => {
    try {
      setIsCreating(true);
      setError(null);

      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(redirectToLogin);
        return;
      }

      let createdMapId: string | null = null;
      const { data, error: createError } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .insert({
          owner_id: user.id,
          title: mapCategory === "bow_tie" ? "Untitled Bow Tie Map" : mapCategory === "process_flow" ? "Untitled Process Flow Map" : "Untitled System Map",
          map_category: mapCategory,
        })
        .select("id")
        .single();

      if (!createError && data?.id) {
        createdMapId = data.id;
      } else {
        const insertWithoutReturning = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .insert({
            owner_id: user.id,
            title: mapCategory === "bow_tie" ? "Untitled Bow Tie Map" : mapCategory === "process_flow" ? "Untitled Process Flow Map" : "Untitled System Map",
            map_category: mapCategory,
          });

        if (insertWithoutReturning.error) {
          recordMapActivity("map_creation", "failed", "Map creation failed.", {
            mapCategory,
            error: createError?.message || insertWithoutReturning.error.message,
          });
          setError(createError?.message || insertWithoutReturning.error.message || "Unable to create a new system map.");
          return;
        }

        const latestMap = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .select("id")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestMap.error || !latestMap.data?.id) {
          recordMapActivity("map_creation", "failed", "Map id could not be resolved.", {
            mapCategory,
            error: latestMap.error?.message ?? null,
          });
          setError(latestMap.error?.message || "Map created, but the new map id could not be resolved.");
          return;
        }
        createdMapId = latestMap.data.id;
      }

      if (!createdMapId) {
        recordMapActivity("map_creation", "failed", "Map id could not be resolved.", { mapCategory });
        setError("Map created, but the new map id could not be resolved.");
        return;
      }

      const { error: memberInsertError } = await supabaseBrowser
        .schema("ms")
        .from("map_members")
        .upsert({ map_id: createdMapId, user_id: user.id, role: "full_write" }, { onConflict: "map_id,user_id" });

      if (memberInsertError) {
        recordMapActivity("map_creation", "failed", "Map permissions failed.", {
          mapId: createdMapId, mapCategory, error: memberInsertError.message,
        });
        setError(memberInsertError.message || "Map created, but owner permissions could not be assigned.");
        return;
      }

      recordMapActivity("map_creation", "success", "Map created.", { mapId: createdMapId, mapCategory });
      router.push(`/system-maps/${createdMapId}`);
    } catch (createError) {
      recordMapActivity("map_creation", "failed", "Map creation failed.", {
        mapCategory,
        error: createError instanceof Error ? createError.message : String(createError),
      });
      setError("Unable to create a new system map.");
    } finally {
      setIsCreating(false);
      setShowCreateMenu(false);
    }
  };

  const getAccessLabel = (row: SystemMapRow) => {
    if (!row.role) return "Read access";
    const role = row.role.toLowerCase();
    if (role === "full_write") return "Full write";
    if (role === "partial_write") return "Partial write";
    if (role === "read") return "Read access";
    return row.role;
  };

  const getCategoryLabel = (row: SystemMapRow) => {
    if (!row.map_category) return "Document Type";
    if (row.map_category === "document_map") return "Document Type";
    if (row.map_category === "system_map") return "System Map";
    if (row.map_category === "bow_tie") return "Bow Tie";
    if (row.map_category === "incident_investigation") return "Incident Investigation";
    if (row.map_category === "org_chart") return "Org Chart";
    if (row.map_category === "process_flow") return "Process Flow";
    return row.map_category;
  };

  const handleLinkMapToProfile = async () => {
    try {
      setIsLinking(true);
      setError(null);

      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(redirectToLogin);
        return;
      }

      const code = mapCodeInput.trim().toUpperCase();
      if (!code) {
        setError("Enter a valid map code.");
        return;
      }

      const { error: linkError } = await supabaseBrowser
        .schema("ms")
        .rpc("link_map_to_profile_by_code", { p_map_code: code });

      if (linkError) {
        setError(linkError.message || "Unable to link map to your profile with this code.");
        return;
      }

      setMapCodeInput("");
      setShowLinkForm(false);
      await loadMaps();
    } catch {
      setError("Unable to link map to your profile.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeleteMap = async (row: SystemMapRow) => {
    const canDelete = row.owner_id === currentUserId;
    if (!canDelete) return;

    try {
      setDeletingMapId(row.id);
      setError(null);
      const { error: deleteError } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .delete()
        .eq("id", row.id)
        .eq("owner_id", currentUserId as string);

      if (deleteError) {
        recordMapActivity("map_deletion", "failed", "Map deletion failed.", {
          mapId: row.id, mapTitle: row.title, error: deleteError.message,
        });
        setError(deleteError.message || "Unable to delete system map.");
        return;
      }

      recordMapActivity("map_deletion", "success", "Map deleted.", { mapId: row.id, mapTitle: row.title });
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      setPendingDeleteRow(null);
    } catch (deleteError) {
      recordMapActivity("map_deletion", "failed", "Map deletion failed.", {
        mapId: row.id, mapTitle: row.title,
        error: deleteError instanceof Error ? deleteError.message : String(deleteError),
      });
      setError("Unable to delete system map.");
    } finally {
      setDeletingMapId(null);
    }
  };

  const handleDuplicateMap = async (row: SystemMapRow) => {
    if (!currentUserId) return;
    const setProgress = (percent: number, message: string, status: "running" | "success" | "error" = "running") => {
      setDuplicateProgress({ percent, message, status });
    };
    const cancellationError = new Error("DUPLICATION_CANCELLED");
    let createdMapId: string | null = null;
    let duplicateActivityLogged = false;
    const recordDuplicateActivity = (status: "success" | "failed" | "info", summary: string, metadata: Record<string, unknown> = {}) => {
      duplicateActivityLogged = true;
      recordMapActivity("map_duplication", status, summary, {
        sourceMapId: row.id, sourceMapTitle: row.title, duplicatedMapId: createdMapId, ...metadata,
      });
    };
    const throwIfCancelled = () => {
      if (duplicateAbortRef.current) throw cancellationError;
    };
    const cleanupDuplicatedMap = async (mapId: string) => {
      setProgress(90, "Stopping and removing duplicated items...");
      await supabaseBrowser.schema("ms").from("document_outline_items").delete().eq("map_id", mapId);
      await supabaseBrowser.schema("ms").from("node_relations").delete().eq("map_id", mapId);
      await supabaseBrowser.schema("ms").from("canvas_elements").delete().eq("map_id", mapId);
      await supabaseBrowser.schema("ms").from("document_nodes").delete().eq("map_id", mapId);
      await supabaseBrowser.schema("ms").from("document_types").delete().eq("map_id", mapId);
      await supabaseBrowser.schema("ms").from("map_members").delete().eq("map_id", mapId);
      await supabaseBrowser.schema("ms").from("map_view_state").delete().eq("map_id", mapId);
      await supabaseBrowser.schema("ms").from("system_maps").delete().eq("id", mapId);
      setProgress(96, "Verifying no duplicated items remain...");

      const [mapsCheck, nodesCheck, elementsCheck, relationsCheck, outlineCheck] = await Promise.all([
        supabaseBrowser.schema("ms").from("system_maps").select("*", { count: "exact", head: true }).eq("id", mapId),
        supabaseBrowser.schema("ms").from("document_nodes").select("*", { count: "exact", head: true }).eq("map_id", mapId),
        supabaseBrowser.schema("ms").from("canvas_elements").select("*", { count: "exact", head: true }).eq("map_id", mapId),
        supabaseBrowser.schema("ms").from("node_relations").select("*", { count: "exact", head: true }).eq("map_id", mapId),
        supabaseBrowser.schema("ms").from("document_outline_items").select("*", { count: "exact", head: true }).eq("map_id", mapId),
      ]);

      return (
        Number(mapsCheck.count ?? 0) + Number(nodesCheck.count ?? 0) +
        Number(elementsCheck.count ?? 0) + Number(relationsCheck.count ?? 0) +
        Number(outlineCheck.count ?? 0)
      );
    };

    try {
      setDuplicatingMapId(row.id);
      duplicateAbortRef.current = false;
      setDuplicateCancelRequested(false);
      setProgress(4, "Checking access...");
      setError(null);
      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(redirectToLogin);
        return;
      }

      const canDuplicate = row.owner_id === user.id || !!row.role;
      if (!canDuplicate) {
        recordDuplicateActivity("failed", "Map duplication denied.", { reason: "insufficient_access" });
        setError("You do not have access to duplicate this map.");
        return;
      }

      throwIfCancelled();
      const duplicateTitle = `${row.title} (Copy)`;
      setProgress(10, "Creating duplicate map...");
      const { data: createdMap, error: createMapError } = await supabaseBrowser
        .schema("ms").from("system_maps")
        .insert({ owner_id: user.id, title: duplicateTitle, description: row.description, map_category: row.map_category ?? "document_map" })
        .select("id").single();

      if (!createMapError && createdMap?.id) {
        createdMapId = createdMap.id;
      } else {
        const fallbackInsert = await supabaseBrowser.schema("ms").from("system_maps")
          .insert({ owner_id: user.id, title: duplicateTitle, description: row.description, map_category: row.map_category ?? "document_map" });
        if (fallbackInsert.error) {
          recordDuplicateActivity("failed", "Map duplication failed.", { stage: "create_map", error: createMapError?.message || fallbackInsert.error.message });
          setError(createMapError?.message || fallbackInsert.error.message || "Unable to duplicate map.");
          return;
        }
        const latestMap = await supabaseBrowser.schema("ms").from("system_maps").select("id")
          .eq("owner_id", user.id).eq("title", duplicateTitle).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (latestMap.error || !latestMap.data?.id) {
          recordDuplicateActivity("failed", "Duplicate id could not be resolved.", { stage: "resolve_map_id", error: latestMap.error?.message ?? null });
          setError(latestMap.error?.message || "Map duplicated, but new map id could not be resolved.");
          return;
        }
        createdMapId = latestMap.data.id;
      }

      throwIfCancelled();
      const { error: memberInsertError } = await supabaseBrowser.schema("ms").from("map_members")
        .upsert({ map_id: createdMapId, user_id: user.id, role: "full_write" }, { onConflict: "map_id,user_id" });
      if (memberInsertError) {
        recordDuplicateActivity("failed", "Duplicate permissions failed.", { stage: "assign_permissions", error: memberInsertError.message });
        setError(memberInsertError.message || "Map duplicated, but owner permissions could not be assigned.");
        setProgress(100, "Failed to assign owner access.", "error");
        return;
      }

      setProgress(16, "Loading source map data...");
      const [typesRes, nodesRes, elementsRes, relationsRes, outlineRes] = await Promise.all([
        supabaseBrowser.schema("ms").from("document_types").select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active").eq("map_id", row.id),
        supabaseBrowser.schema("ms").from("document_nodes").select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived").eq("map_id", row.id),
        supabaseBrowser.schema("ms").from("canvas_elements").select("id,map_id,element_type,heading,color_hex,created_by_user_id,element_config,pos_x,pos_y,width,height").eq("map_id", row.id),
        supabaseBrowser.schema("ms").from("node_relations").select("id,map_id,from_node_id,to_node_id,source_grouping_element_id,target_grouping_element_id,source_system_element_id,target_system_element_id,relation_type,relationship_description,relationship_disciplines,relationship_category,relationship_custom_type").eq("map_id", row.id),
        supabaseBrowser.schema("ms").from("document_outline_items").select("id,map_id,node_id,kind,heading_level,parent_heading_id,heading_id,title,content_text,sort_order").eq("map_id", row.id),
      ]);

      if (typesRes.error || nodesRes.error || elementsRes.error || relationsRes.error || outlineRes.error) {
        recordDuplicateActivity("failed", "Duplicate source load failed.", {
          stage: "load_source_data",
          error: typesRes.error?.message || nodesRes.error?.message || elementsRes.error?.message || relationsRes.error?.message || outlineRes.error?.message || null,
        });
        setError(typesRes.error?.message || nodesRes.error?.message || elementsRes.error?.message || relationsRes.error?.message || outlineRes.error?.message || "Unable to load source map data for duplication.");
        setProgress(100, "Failed while loading source data.", "error");
        return;
      }

      const sourceTypes = (typesRes.data ?? []) as DocumentTypeRow[];
      const sourceNodes = (nodesRes.data ?? []) as DocumentNodeRow[];
      const sourceElements = (elementsRes.data ?? []) as CanvasElementRow[];
      const sourceRelations = (relationsRes.data ?? []) as NodeRelationRow[];
      const sourceOutlineItems = (outlineRes.data ?? []) as DocumentOutlineItemRow[];

      const typeIdMap = new Map<string, string>();
      const nodeIdMap = new Map<string, string>();
      const elementIdMap = new Map<string, string>();
      const outlineHeadingIdMap = new Map<string, string>();

      setProgress(24, "Cloning document types...");
      for (const sourceType of sourceTypes) {
        throwIfCancelled();
        const { data: insertedType, error: insertTypeError } = await supabaseBrowser.schema("ms").from("document_types")
          .insert({ map_id: createdMapId, name: sourceType.name, level_rank: sourceType.level_rank, band_y_min: sourceType.band_y_min, band_y_max: sourceType.band_y_max, is_active: sourceType.is_active })
          .select("id").single();
        if (insertTypeError || !insertedType?.id) {
          recordDuplicateActivity("failed", "Duplicate document types failed.", { stage: "document_types", error: insertTypeError?.message ?? null });
          setError(insertTypeError?.message || "Unable to duplicate document hierarchy.");
          setProgress(100, "Failed while duplicating document types.", "error");
          return;
        }
        typeIdMap.set(sourceType.id, insertedType.id);
      }

      setProgress(42, "Cloning document nodes...");
      for (const sourceNode of sourceNodes) {
        throwIfCancelled();
        const { data: insertedNode, error: insertNodeError } = await supabaseBrowser.schema("ms").from("document_nodes")
          .insert({ map_id: createdMapId, type_id: typeIdMap.get(sourceNode.type_id) ?? sourceNode.type_id, title: sourceNode.title, document_number: sourceNode.document_number, discipline: sourceNode.discipline, owner_user_id: sourceNode.owner_user_id, owner_name: sourceNode.owner_name, user_group: sourceNode.user_group, pos_x: sourceNode.pos_x, pos_y: sourceNode.pos_y, width: sourceNode.width, height: sourceNode.height, is_archived: sourceNode.is_archived })
          .select("id").single();
        if (insertNodeError || !insertedNode?.id) {
          recordDuplicateActivity("failed", "Duplicate document nodes failed.", { stage: "document_nodes", error: insertNodeError?.message ?? null });
          setError(insertNodeError?.message || "Unable to duplicate document nodes.");
          setProgress(100, "Failed while duplicating document nodes.", "error");
          return;
        }
        nodeIdMap.set(sourceNode.id, insertedNode.id);
      }

      setProgress(62, "Cloning canvas components...");
      for (const sourceElement of sourceElements) {
        throwIfCancelled();
        const { data: insertedElement, error: insertElementError } = await supabaseBrowser.schema("ms").from("canvas_elements")
          .insert({ map_id: createdMapId, element_type: sourceElement.element_type, heading: sourceElement.heading, color_hex: sourceElement.color_hex, created_by_user_id: sourceElement.created_by_user_id, element_config: sourceElement.element_config, pos_x: sourceElement.pos_x, pos_y: sourceElement.pos_y, width: sourceElement.width, height: sourceElement.height })
          .select("id").single();
        if (insertElementError || !insertedElement?.id) {
          recordDuplicateActivity("failed", "Duplicate canvas items failed.", { stage: "canvas_elements", error: insertElementError?.message ?? null });
          setError(insertElementError?.message || "Unable to duplicate canvas elements.");
          setProgress(100, "Failed while duplicating canvas components.", "error");
          return;
        }
        elementIdMap.set(sourceElement.id, insertedElement.id);
      }

      setProgress(78, "Cloning relationships...");
      for (const sourceRelation of sourceRelations) {
        throwIfCancelled();
        const { error: insertRelationError } = await supabaseBrowser.schema("ms").from("node_relations")
          .insert({
            map_id: createdMapId,
            from_node_id: sourceRelation.from_node_id ? nodeIdMap.get(sourceRelation.from_node_id) ?? null : null,
            to_node_id: sourceRelation.to_node_id ? nodeIdMap.get(sourceRelation.to_node_id) ?? null : null,
            source_grouping_element_id: sourceRelation.source_grouping_element_id ? elementIdMap.get(sourceRelation.source_grouping_element_id) ?? null : null,
            target_grouping_element_id: sourceRelation.target_grouping_element_id ? elementIdMap.get(sourceRelation.target_grouping_element_id) ?? null : null,
            source_system_element_id: sourceRelation.source_system_element_id ? elementIdMap.get(sourceRelation.source_system_element_id) ?? null : null,
            target_system_element_id: sourceRelation.target_system_element_id ? elementIdMap.get(sourceRelation.target_system_element_id) ?? null : null,
            relation_type: sourceRelation.relation_type,
            relationship_description: sourceRelation.relationship_description,
            relationship_disciplines: sourceRelation.relationship_disciplines,
            relationship_category: sourceRelation.relationship_category,
            relationship_custom_type: sourceRelation.relationship_custom_type,
          });
        if (insertRelationError) {
          recordDuplicateActivity("failed", "Duplicate relationships failed.", { stage: "node_relations", error: insertRelationError.message });
          setError(insertRelationError.message || "Unable to duplicate relationships.");
          setProgress(100, "Failed while duplicating relationships.", "error");
          return;
        }
      }

      setProgress(88, "Cloning structure content...");
      for (const sourceHeading of sourceOutlineItems.filter((item) => item.kind === "heading")) {
        throwIfCancelled();
        const { data: insertedHeading, error: insertHeadingError } = await supabaseBrowser.schema("ms").from("document_outline_items")
          .insert({ map_id: createdMapId, node_id: nodeIdMap.get(sourceHeading.node_id) ?? sourceHeading.node_id, kind: sourceHeading.kind, heading_level: sourceHeading.heading_level, parent_heading_id: sourceHeading.parent_heading_id ? outlineHeadingIdMap.get(sourceHeading.parent_heading_id) ?? null : null, heading_id: null, title: sourceHeading.title, content_text: sourceHeading.content_text, sort_order: sourceHeading.sort_order })
          .select("id").single();
        if (insertHeadingError || !insertedHeading?.id) {
          recordDuplicateActivity("failed", "Duplicate headings failed.", { stage: "outline_headings", error: insertHeadingError?.message ?? null });
          setError(insertHeadingError?.message || "Unable to duplicate map structure headings.");
          setProgress(100, "Failed while duplicating structure headings.", "error");
          return;
        }
        outlineHeadingIdMap.set(sourceHeading.id, insertedHeading.id);
      }

      for (const sourceContent of sourceOutlineItems.filter((item) => item.kind === "content")) {
        throwIfCancelled();
        const { error: insertContentError } = await supabaseBrowser.schema("ms").from("document_outline_items")
          .insert({ map_id: createdMapId, node_id: nodeIdMap.get(sourceContent.node_id) ?? sourceContent.node_id, kind: sourceContent.kind, heading_level: sourceContent.heading_level, parent_heading_id: sourceContent.parent_heading_id ? outlineHeadingIdMap.get(sourceContent.parent_heading_id) ?? null : null, heading_id: sourceContent.heading_id ? outlineHeadingIdMap.get(sourceContent.heading_id) ?? null : null, title: sourceContent.title, content_text: sourceContent.content_text, sort_order: sourceContent.sort_order });
        if (insertContentError) {
          recordDuplicateActivity("failed", "Duplicate content failed.", { stage: "outline_content", error: insertContentError.message });
          setError(insertContentError.message || "Unable to duplicate map structure content.");
          setProgress(100, "Failed while duplicating structure content.", "error");
          return;
        }
      }

      setProgress(100, "Duplicate complete. Opening map...", "success");
      recordDuplicateActivity("success", "Map duplicated.", { duplicatedMapId: createdMapId });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPendingDuplicateRow(null);
      router.push(`/system-maps/${createdMapId}`);
    } catch (e) {
      if (e === cancellationError) {
        setProgress(92, "Cancellation requested. Cleaning up...");
        if (createdMapId) {
          const remaining = await cleanupDuplicatedMap(createdMapId);
          if (remaining === 0) {
            setDuplicateProgress({ percent: 100, message: "Duplication cancelled. No duplicated items remain.", status: "aborted" });
          } else {
            setDuplicateProgress({ percent: 100, message: `Duplication cancelled, but ${remaining} item(s) remain. Please retry cleanup.`, status: "error" });
          }
        } else {
          setDuplicateProgress({ percent: 100, message: "Duplication cancelled before any map was created.", status: "aborted" });
        }
        if (!duplicateActivityLogged) {
          recordDuplicateActivity("info", "Map duplication cancelled.", { reason: "user_cancelled" });
        }
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setPendingDuplicateRow(null);
      } else {
        if (!duplicateActivityLogged) {
          recordDuplicateActivity("failed", "Map duplication failed.", {
            error: e instanceof Error ? e.message : String(e),
          });
        }
        setError("Unable to duplicate system map.");
        setProgress(100, "Duplicate failed.", "error");
      }
    } finally {
      duplicateAbortRef.current = false;
      setDuplicateCancelRequested(false);
      setDuplicatingMapId(null);
    }
  };

  const handleCopyCode = async (row: SystemMapRow) => {
    const codeVisible = row.owner_id === currentUserId && !!row.map_code;
    if (!codeVisible) return;
    try {
      await navigator.clipboard.writeText(row.map_code as string);
      recordMapActivity("sharing_code", "success", "Map code copied.", { mapId: row.id, mapTitle: row.title });
      setCopiedMessage(`Map code copied for "${row.title}"`);
      window.setTimeout(() => {
        setCopiedMessage((prev) => (prev ? null : prev));
      }, 1400);
    } catch (copyError) {
      recordMapActivity("sharing_code", "failed", "Map code copy failed.", {
        mapId: row.id, mapTitle: row.title,
        error: copyError instanceof Error ? copyError.message : String(copyError),
      });
      setError("Unable to copy map code.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const pageContent = (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-5 pb-4 border-b border-neutral-100 bg-white flex-shrink-0">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Management System Maps</p>
        <h1 className="text-[20px] font-semibold text-neutral-900">Management System Maps</h1>
        <p className="text-[13px] text-neutral-500 mt-[2px]">Create and manage management system design maps you own or that are shared with you.</p>
      </div>

      <div className="flex-1 p-6 bg-[#f7f8fa] flex flex-col gap-4">
        {isLoading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="flex justify-between">
              <div className="h-8 w-36 rounded-lg bg-neutral-200" />
              <div className="h-8 w-28 rounded-lg bg-neutral-200" />
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <div className="h-10 bg-neutral-50 border-b border-neutral-200" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 border-b border-neutral-100 px-4 flex items-center gap-4">
                  <div className="h-4 w-1/5 rounded bg-neutral-100" />
                  <div className="h-4 w-1/4 rounded bg-neutral-100" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition",
                      showLinkForm
                        ? "border-[#2d9692] bg-[#2d9692]/5 text-[#2d9692]"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    )}
                    onClick={() => setShowLinkForm((prev) => !prev)}
                  >
                    {showLinkForm ? <IconX size={14} /> : <IconLink size={14} />}
                    Link Map Code
                  </button>
                  {showLinkForm ? (
                    <form
                      className="absolute left-0 top-full mt-1.5 z-10 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleLinkMapToProfile();
                      }}
                    >
                      <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5" htmlFor="it-map-code">
                        Map code
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="it-map-code"
                          value={mapCodeInput}
                          onChange={(event) => setMapCodeInput(event.target.value)}
                          className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2d9692]/20 focus:border-[#2d9692]"
                          placeholder="Enter shared map code"
                          autoComplete="off"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-[#2d9692] px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-[#236e6b] disabled:opacity-50"
                          disabled={isLinking}
                        >
                          {isLinking ? "Linking..." : "Link"}
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative" ref={createMenuRef}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2d9692] px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-[#236e6b] disabled:opacity-50"
                    onClick={() => setShowCreateMenu((prev) => !prev)}
                    disabled={isCreating}
                  >
                    <IconPlus size={14} />
                    {isCreating ? "Creating..." : "Create New"}
                  </button>
                  {showCreateMenu ? (
                    <div className="absolute right-0 top-full mt-1.5 z-10 w-72 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
                      <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Map Category</p>
                      <div className="flex flex-col gap-0.5">
                        {mapCategoryOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className="flex flex-col rounded-lg px-3 py-2 text-left text-[13px] transition hover:bg-neutral-50 disabled:opacity-50"
                            onClick={() => void handleCreateMap(option.id)}
                            disabled={isCreating}
                          >
                            <strong className="font-medium text-neutral-900">{option.label}</strong>
                            <span className="text-[12px] text-neutral-500">{option.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
            ) : null}
            {copiedMessage ? (
              <div className="rounded-lg border border-[#2d9692]/20 bg-[#2d9692]/5 px-4 py-3 text-[13px] text-[#2d9692]">{copiedMessage}</div>
            ) : null}

            <div className="hidden md:block rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <colgroup>
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      {["Title", "Description", "Category", "Access", "Map code", "Updated", "Created", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-neutral-500">
                          No maps have been added. Create a new map or link one to your profile.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => {
                        const canCopy = row.owner_id === currentUserId && !!row.map_code;
                        const canDuplicate = !!row.role || row.owner_id === currentUserId;
                        const canDelete = row.owner_id === currentUserId;

                        return (
                          <tr
                            key={row.id}
                            className="hover:bg-neutral-50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/system-maps/${row.id}`)}
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                router.push(`/system-maps/${row.id}`);
                              }
                            }}
                          >
                            <td className="px-4 py-3">
                              <strong className="block max-w-[160px] truncate font-medium text-neutral-900">{row.title}</strong>
                            </td>
                            <td className="px-4 py-3">
                              <span className="block max-w-[200px] truncate text-neutral-600" title={row.description || "-"}>{row.description || "-"}</span>
                            </td>
                            <td className="px-4 py-3 text-neutral-600">{getCategoryLabel(row)}</td>
                            <td className="px-4 py-3 text-neutral-600">{getAccessLabel(row)}</td>
                            <td className="px-4 py-3 text-neutral-600">{row.owner_id === currentUserId ? row.map_code || "-" : "-"}</td>
                            <td className="px-4 py-3 text-neutral-500 text-[12px]">{formatDateTime(row.updated_at)}</td>
                            <td className="px-4 py-3 text-neutral-500 text-[12px]">{formatDateTime(row.created_at)}</td>
                            <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title={canCopy ? "Copy map code" : "Not available"}
                                  className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40"
                                  disabled={!canCopy}
                                  onClick={() => void handleCopyCode(row)}
                                >
                                  <IconCopy size={14} />
                                </button>
                                <button
                                  type="button"
                                  title={canDuplicate ? "Duplicate map" : "No permission"}
                                  className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40"
                                  disabled={!canDuplicate || duplicatingMapId === row.id}
                                  onClick={() => {
                                    setPendingDuplicateRow(row);
                                    setDuplicateCancelRequested(false);
                                    duplicateAbortRef.current = false;
                                    setDuplicateProgress({ percent: 0, message: "", status: "idle" });
                                  }}
                                >
                                  <IconFiles size={14} />
                                </button>
                                <button
                                  type="button"
                                  title={canDelete ? "Delete map" : "Only the map creator can delete"}
                                  className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                  disabled={!canDelete || deletingMapId === row.id}
                                  onClick={() => setPendingDeleteRow(row)}
                                >
                                  <IconTrash size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {rows.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-[13px] text-neutral-500">
                  No maps have been added. Create a new map or link one to your profile.
                </div>
              ) : (
                paginatedRows.map((row) => {
                  const canCopy = row.owner_id === currentUserId && !!row.map_code;
                  const canDuplicate = !!row.role || row.owner_id === currentUserId;
                  const canDelete = row.owner_id === currentUserId;

                  return (
                    <div key={`mobile-${row.id}`} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                      <button type="button" className="w-full p-4 text-left" onClick={() => router.push(`/system-maps/${row.id}`)}>
                        <strong className="block text-[14px] font-semibold text-neutral-900">{row.title}</strong>
                        <p className="mt-0.5 text-[12px] text-neutral-500">{row.description || "No description"}</p>
                      </button>
                      <div className="grid grid-cols-2 gap-3 px-4 pb-3 text-[12px]">
                        <div><span className="text-neutral-400">Category</span><p className="font-medium text-neutral-700 mt-0.5">{getCategoryLabel(row)}</p></div>
                        <div><span className="text-neutral-400">Access</span><p className="font-medium text-neutral-700 mt-0.5">{getAccessLabel(row)}</p></div>
                        <div><span className="text-neutral-400">Updated</span><p className="font-medium text-neutral-700 mt-0.5">{formatDateTime(row.updated_at)}</p></div>
                        <div><span className="text-neutral-400">Created</span><p className="font-medium text-neutral-700 mt-0.5">{formatDateTime(row.created_at)}</p></div>
                      </div>
                      <div className="flex gap-2 px-4 pb-4">
                        <button type="button" className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[12px] text-neutral-600 hover:bg-neutral-50 disabled:opacity-40" disabled={!canCopy} onClick={() => void handleCopyCode(row)}>
                          <IconCopy size={12} />Copy Code
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[12px] text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                          disabled={!canDuplicate || duplicatingMapId === row.id}
                          onClick={() => { setPendingDuplicateRow(row); setDuplicateCancelRequested(false); duplicateAbortRef.current = false; setDuplicateProgress({ percent: 0, message: "", status: "idle" }); }}
                        >
                          <IconFiles size={12} />{duplicatingMapId === row.id ? "Duplicating..." : "Duplicate"}
                        </button>
                        <button type="button" className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] text-red-600 hover:bg-red-100 disabled:opacity-40" disabled={!canDelete || deletingMapId === row.id} onClick={() => setPendingDeleteRow(row)}>
                          <IconTrash size={12} />{deletingMapId === row.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {rows.length > 0 && (
              <div className="flex items-center justify-between text-[13px] text-neutral-500">
                <span>{rows.length} map{rows.length !== 1 ? "s" : ""} — page {safePage} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-md flex items-center justify-center border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <IconChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-md flex items-center justify-center border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <IconChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {pendingDuplicateRow && (
        <Modal
          open={true}
          onClose={() => {
            if (duplicatingMapId === pendingDuplicateRow.id) return;
            setPendingDuplicateRow(null);
          }}
          title="Duplicate map?"
          footer={
            <>
              <Button
                variant="neutral"
                onClick={() => {
                  if (duplicatingMapId === pendingDuplicateRow.id) {
                    duplicateAbortRef.current = true;
                    setDuplicateCancelRequested(true);
                    setDuplicateProgress((prev) => ({ ...prev, message: "Cancellation requested...", status: "running" }));
                    return;
                  }
                  setPendingDuplicateRow(null);
                }}
                disabled={duplicatingMapId === pendingDuplicateRow.id && duplicateCancelRequested}
              >
                {duplicatingMapId === pendingDuplicateRow.id ? (duplicateCancelRequested ? "Stopping..." : "Cancel duplication") : "Cancel"}
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleDuplicateMap(pendingDuplicateRow)}
                disabled={duplicatingMapId === pendingDuplicateRow.id}
                loading={duplicatingMapId === pendingDuplicateRow.id && duplicateProgress.status === "running"}
                loadingText="Duplicating..."
              >
                Duplicate map
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-neutral-700">You are about to duplicate <strong>{pendingDuplicateRow.title}</strong>.</p>
          <p className="text-[13px] text-neutral-700">The duplicate will include document nodes, canvas components, relationships, and structure content.</p>
          {duplicateProgress.status !== "idle" ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[12px] text-neutral-600">
                <span>{duplicateProgress.message}</span>
                <span>{duplicateProgress.percent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    duplicateProgress.status === "error" ? "bg-red-500" :
                    duplicateProgress.status === "success" ? "bg-green-500" :
                    duplicateProgress.status === "aborted" ? "bg-neutral-400" :
                    "bg-[#2d9692]"
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, duplicateProgress.percent))}%` }}
                />
              </div>
            </div>
          ) : null}
        </Modal>
      )}

      {pendingDeleteRow && (
        <Modal
          open={true}
          onClose={() => setPendingDeleteRow(null)}
          title="Delete map?"
          contentFit
          footer={
            <>
              <Button variant="neutral" onClick={() => setPendingDeleteRow(null)} disabled={deletingMapId === pendingDeleteRow.id}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => void handleDeleteMap(pendingDeleteRow)}
                disabled={deletingMapId === pendingDeleteRow.id}
                loading={deletingMapId === pendingDeleteRow.id}
                loadingText="Deleting..."
              >
                Delete map
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-neutral-700">Permanently delete <strong>{pendingDeleteRow.title}</strong>? This will remove:</p>
          <ul className="mt-2 flex flex-col gap-1 text-[13px] text-neutral-600 list-disc list-inside">
            <li>The system map</li>
            <li>All document nodes</li>
            <li>All canvas components</li>
            <li>All relationships</li>
            <li>All document structure content</li>
            <li>All linked map member access</li>
          </ul>
          <p className="mt-2 text-[13px] font-medium text-red-600">This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );

  return <DashboardShell>{pageContent}</DashboardShell>;
}
