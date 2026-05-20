"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";
import DashboardTableFooter from "@/components/dashboard/DashboardTableFooter";
import LinkMapCodeControl from "@/components/dashboard/LinkMapCodeControl";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { reportUserActivity } from "@/lib/userActivityClient";

type SystemMapRow = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  map_code: string | null;
  map_category?: "document_map" | "bow_tie" | "incident_investigation" | "org_chart" | "process_flow" | null;
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
  id: "document_map" | "bow_tie" | "incident_investigation" | "org_chart" | "process_flow";
  label: string;
  description: string;
};

const mapCategoryOptions: MapCategoryOption[] = [
  { id: "document_map", label: "Document Map", description: "Document-centric compliance and management maps." },
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
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
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
    void reportUserActivity({
      action,
      status,
      summary,
      metadata,
    });
  };

  const loadMaps = async () => {
    const user = await ensurePortalSupabaseUser();
    if (!user) {
      window.location.assign(redirectToLogin);
      return;
    }
    setCurrentUserId(user.id);
    setCurrentUserEmail(user.email ?? null);

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
      } catch (loadError) {
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
        // Some RLS setups allow INSERT but block RETURNING payloads.
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
        recordMapActivity("map_creation", "failed", "Map id could not be resolved.", {
          mapCategory,
        });
        setError("Map created, but the new map id could not be resolved.");
        return;
      }

      const { error: memberInsertError } = await supabaseBrowser
        .schema("ms")
        .from("map_members")
        .upsert(
          {
            map_id: createdMapId,
            user_id: user.id,
            role: "full_write",
          },
          { onConflict: "map_id,user_id" }
        );

      if (memberInsertError) {
        recordMapActivity("map_creation", "failed", "Map permissions failed.", {
          mapId: createdMapId,
          mapCategory,
          error: memberInsertError.message,
        });
        setError(memberInsertError.message || "Map created, but owner permissions could not be assigned.");
        return;
      }

      recordMapActivity("map_creation", "success", "Map created.", {
        mapId: createdMapId,
        mapCategory,
      });
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
    if (role === "full_write") return row.owner_id ? "Full write" : "Full write";
    if (role === "partial_write") return "Partial write";
    if (role === "read") return "Read access";
    return row.role;
  };

  const getCategoryLabel = (row: SystemMapRow) => {
    if (!row.map_category) return "Document Type";
    if (row.map_category === "document_map") return "Document Type";
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
        .rpc("link_map_to_profile_by_code", {
          p_map_code: code,
        });

      if (linkError) {
        setError(linkError.message || "Unable to link map to your profile with this code.");
        return;
      }

      setMapCodeInput("");
      setShowLinkForm(false);
      await loadMaps();
    } catch (linkErr) {
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
          mapId: row.id,
          mapTitle: row.title,
          error: deleteError.message,
        });
        setError(deleteError.message || "Unable to delete system map.");
        return;
      }

      recordMapActivity("map_deletion", "success", "Map deleted.", {
        mapId: row.id,
        mapTitle: row.title,
      });
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      setPendingDeleteRow(null);
    } catch (deleteError) {
      recordMapActivity("map_deletion", "failed", "Map deletion failed.", {
        mapId: row.id,
        mapTitle: row.title,
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
        sourceMapId: row.id,
        sourceMapTitle: row.title,
        duplicatedMapId: createdMapId,
        ...metadata,
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

      const totalRemaining =
        Number(mapsCheck.count ?? 0) +
        Number(nodesCheck.count ?? 0) +
        Number(elementsCheck.count ?? 0) +
        Number(relationsCheck.count ?? 0) +
        Number(outlineCheck.count ?? 0);
      return totalRemaining;
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
        recordDuplicateActivity("failed", "Map duplication denied.", {
          reason: "insufficient_access",
        });
        setError("You do not have access to duplicate this map.");
        return;
      }

      throwIfCancelled();
      const duplicateTitle = `${row.title} (Copy)`;
      setProgress(10, "Creating duplicate map...");
      const { data: createdMap, error: createMapError } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .insert({
          owner_id: user.id,
          title: duplicateTitle,
          description: row.description,
          map_category: row.map_category ?? "document_map",
        })
        .select("id")
        .single();

      if (!createMapError && createdMap?.id) {
        createdMapId = createdMap.id;
      } else {
        const fallbackInsert = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .insert({
            owner_id: user.id,
            title: duplicateTitle,
            description: row.description,
            map_category: row.map_category ?? "document_map",
        });
        if (fallbackInsert.error) {
          recordDuplicateActivity("failed", "Map duplication failed.", {
            stage: "create_map",
            error: createMapError?.message || fallbackInsert.error.message,
          });
          setError(createMapError?.message || fallbackInsert.error.message || "Unable to duplicate map.");
          return;
        }
        const latestMap = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .select("id")
          .eq("owner_id", user.id)
          .eq("title", duplicateTitle)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestMap.error || !latestMap.data?.id) {
          recordDuplicateActivity("failed", "Duplicate id could not be resolved.", {
            stage: "resolve_map_id",
            error: latestMap.error?.message ?? null,
          });
          setError(latestMap.error?.message || "Map duplicated, but new map id could not be resolved.");
          return;
        }
        createdMapId = latestMap.data.id;
      }

      throwIfCancelled();
      const { error: memberInsertError } = await supabaseBrowser
        .schema("ms")
        .from("map_members")
        .upsert(
          {
            map_id: createdMapId,
            user_id: user.id,
            role: "full_write",
          },
          { onConflict: "map_id,user_id" }
        );
      if (memberInsertError) {
        recordDuplicateActivity("failed", "Duplicate permissions failed.", {
          stage: "assign_permissions",
          error: memberInsertError.message,
        });
        setError(memberInsertError.message || "Map duplicated, but owner permissions could not be assigned.");
        setProgress(100, "Failed to assign owner access.", "error");
        return;
      }

      setProgress(16, "Loading source map data...");
      const [typesRes, nodesRes, elementsRes, relationsRes, outlineRes] = await Promise.all([
        supabaseBrowser
          .schema("ms")
          .from("document_types")
          .select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active")
          .eq("map_id", row.id),
        supabaseBrowser
          .schema("ms")
          .from("document_nodes")
          .select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived")
          .eq("map_id", row.id),
        supabaseBrowser
          .schema("ms")
          .from("canvas_elements")
          .select("id,map_id,element_type,heading,color_hex,created_by_user_id,element_config,pos_x,pos_y,width,height")
          .eq("map_id", row.id),
        supabaseBrowser
          .schema("ms")
          .from("node_relations")
          .select(
            "id,map_id,from_node_id,to_node_id,source_grouping_element_id,target_grouping_element_id,source_system_element_id,target_system_element_id,relation_type,relationship_description,relationship_disciplines,relationship_category,relationship_custom_type"
          )
          .eq("map_id", row.id),
        supabaseBrowser
          .schema("ms")
          .from("document_outline_items")
          .select("id,map_id,node_id,kind,heading_level,parent_heading_id,heading_id,title,content_text,sort_order")
          .eq("map_id", row.id),
      ]);

      if (typesRes.error || nodesRes.error || elementsRes.error || relationsRes.error || outlineRes.error) {
        recordDuplicateActivity("failed", "Duplicate source load failed.", {
          stage: "load_source_data",
          error:
            typesRes.error?.message ||
            nodesRes.error?.message ||
            elementsRes.error?.message ||
            relationsRes.error?.message ||
            outlineRes.error?.message ||
            null,
        });
        setError(
          typesRes.error?.message ||
            nodesRes.error?.message ||
            elementsRes.error?.message ||
            relationsRes.error?.message ||
            outlineRes.error?.message ||
            "Unable to load source map data for duplication."
        );
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
        const { data: insertedType, error: insertTypeError } = await supabaseBrowser
          .schema("ms")
          .from("document_types")
          .insert({
            map_id: createdMapId,
            name: sourceType.name,
            level_rank: sourceType.level_rank,
            band_y_min: sourceType.band_y_min,
            band_y_max: sourceType.band_y_max,
            is_active: sourceType.is_active,
          })
          .select("id")
          .single();
        if (insertTypeError || !insertedType?.id) {
          recordDuplicateActivity("failed", "Duplicate document types failed.", {
            stage: "document_types",
            error: insertTypeError?.message ?? null,
          });
          setError(insertTypeError?.message || "Unable to duplicate document hierarchy.");
          setProgress(100, "Failed while duplicating document types.", "error");
          return;
        }
        typeIdMap.set(sourceType.id, insertedType.id);
      }

      setProgress(42, "Cloning document nodes...");
      for (const sourceNode of sourceNodes) {
        throwIfCancelled();
        const { data: insertedNode, error: insertNodeError } = await supabaseBrowser
          .schema("ms")
          .from("document_nodes")
          .insert({
            map_id: createdMapId,
            type_id: typeIdMap.get(sourceNode.type_id) ?? sourceNode.type_id,
            title: sourceNode.title,
            document_number: sourceNode.document_number,
            discipline: sourceNode.discipline,
            owner_user_id: sourceNode.owner_user_id,
            owner_name: sourceNode.owner_name,
            user_group: sourceNode.user_group,
            pos_x: sourceNode.pos_x,
            pos_y: sourceNode.pos_y,
            width: sourceNode.width,
            height: sourceNode.height,
            is_archived: sourceNode.is_archived,
          })
          .select("id")
          .single();
        if (insertNodeError || !insertedNode?.id) {
          recordDuplicateActivity("failed", "Duplicate document nodes failed.", {
            stage: "document_nodes",
            error: insertNodeError?.message ?? null,
          });
          setError(insertNodeError?.message || "Unable to duplicate document nodes.");
          setProgress(100, "Failed while duplicating document nodes.", "error");
          return;
        }
        nodeIdMap.set(sourceNode.id, insertedNode.id);
      }

      setProgress(62, "Cloning canvas components...");
      for (const sourceElement of sourceElements) {
        throwIfCancelled();
        const { data: insertedElement, error: insertElementError } = await supabaseBrowser
          .schema("ms")
          .from("canvas_elements")
          .insert({
            map_id: createdMapId,
            element_type: sourceElement.element_type,
            heading: sourceElement.heading,
            color_hex: sourceElement.color_hex,
            created_by_user_id: sourceElement.created_by_user_id,
            element_config: sourceElement.element_config,
            pos_x: sourceElement.pos_x,
            pos_y: sourceElement.pos_y,
            width: sourceElement.width,
            height: sourceElement.height,
          })
          .select("id")
          .single();
        if (insertElementError || !insertedElement?.id) {
          recordDuplicateActivity("failed", "Duplicate canvas items failed.", {
            stage: "canvas_elements",
            error: insertElementError?.message ?? null,
          });
          setError(insertElementError?.message || "Unable to duplicate canvas elements.");
          setProgress(100, "Failed while duplicating canvas components.", "error");
          return;
        }
        elementIdMap.set(sourceElement.id, insertedElement.id);
      }

      setProgress(78, "Cloning relationships...");
      for (const sourceRelation of sourceRelations) {
        throwIfCancelled();
        const { error: insertRelationError } = await supabaseBrowser
          .schema("ms")
          .from("node_relations")
          .insert({
            map_id: createdMapId,
            from_node_id: sourceRelation.from_node_id ? nodeIdMap.get(sourceRelation.from_node_id) ?? null : null,
            to_node_id: sourceRelation.to_node_id ? nodeIdMap.get(sourceRelation.to_node_id) ?? null : null,
            source_grouping_element_id: sourceRelation.source_grouping_element_id
              ? elementIdMap.get(sourceRelation.source_grouping_element_id) ?? null
              : null,
            target_grouping_element_id: sourceRelation.target_grouping_element_id
              ? elementIdMap.get(sourceRelation.target_grouping_element_id) ?? null
              : null,
            source_system_element_id: sourceRelation.source_system_element_id
              ? elementIdMap.get(sourceRelation.source_system_element_id) ?? null
              : null,
            target_system_element_id: sourceRelation.target_system_element_id
              ? elementIdMap.get(sourceRelation.target_system_element_id) ?? null
              : null,
            relation_type: sourceRelation.relation_type,
            relationship_description: sourceRelation.relationship_description,
            relationship_disciplines: sourceRelation.relationship_disciplines,
            relationship_category: sourceRelation.relationship_category,
            relationship_custom_type: sourceRelation.relationship_custom_type,
          });
        if (insertRelationError) {
          recordDuplicateActivity("failed", "Duplicate relationships failed.", {
            stage: "node_relations",
            error: insertRelationError.message,
          });
          setError(insertRelationError.message || "Unable to duplicate relationships.");
          setProgress(100, "Failed while duplicating relationships.", "error");
          return;
        }
      }

      setProgress(88, "Cloning structure content...");
      for (const sourceHeading of sourceOutlineItems.filter((item) => item.kind === "heading")) {
        throwIfCancelled();
        const { data: insertedHeading, error: insertHeadingError } = await supabaseBrowser
          .schema("ms")
          .from("document_outline_items")
          .insert({
            map_id: createdMapId,
            node_id: nodeIdMap.get(sourceHeading.node_id) ?? sourceHeading.node_id,
            kind: sourceHeading.kind,
            heading_level: sourceHeading.heading_level,
            parent_heading_id: sourceHeading.parent_heading_id
              ? outlineHeadingIdMap.get(sourceHeading.parent_heading_id) ?? null
              : null,
            heading_id: null,
            title: sourceHeading.title,
            content_text: sourceHeading.content_text,
            sort_order: sourceHeading.sort_order,
          })
          .select("id")
          .single();
        if (insertHeadingError || !insertedHeading?.id) {
          recordDuplicateActivity("failed", "Duplicate headings failed.", {
            stage: "outline_headings",
            error: insertHeadingError?.message ?? null,
          });
          setError(insertHeadingError?.message || "Unable to duplicate map structure headings.");
          setProgress(100, "Failed while duplicating structure headings.", "error");
          return;
        }
        outlineHeadingIdMap.set(sourceHeading.id, insertedHeading.id);
      }

      for (const sourceContent of sourceOutlineItems.filter((item) => item.kind === "content")) {
        throwIfCancelled();
        const { error: insertContentError } = await supabaseBrowser
          .schema("ms")
          .from("document_outline_items")
          .insert({
            map_id: createdMapId,
            node_id: nodeIdMap.get(sourceContent.node_id) ?? sourceContent.node_id,
            kind: sourceContent.kind,
            heading_level: sourceContent.heading_level,
            parent_heading_id: sourceContent.parent_heading_id
              ? outlineHeadingIdMap.get(sourceContent.parent_heading_id) ?? null
              : null,
            heading_id: sourceContent.heading_id ? outlineHeadingIdMap.get(sourceContent.heading_id) ?? null : null,
            title: sourceContent.title,
            content_text: sourceContent.content_text,
            sort_order: sourceContent.sort_order,
          });
        if (insertContentError) {
          recordDuplicateActivity("failed", "Duplicate content failed.", {
            stage: "outline_content",
            error: insertContentError.message,
          });
          setError(insertContentError.message || "Unable to duplicate map structure content.");
          setProgress(100, "Failed while duplicating structure content.", "error");
          return;
        }
      }

      setProgress(100, "Duplicate complete. Opening map...", "success");
      recordDuplicateActivity("success", "Map duplicated.", {
        duplicatedMapId: createdMapId,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPendingDuplicateRow(null);
      router.push(`/system-maps/${createdMapId}`);
    } catch (e) {
      if (e === cancellationError) {
        setProgress(92, "Cancellation requested. Cleaning up...");
        if (createdMapId) {
          const remaining = await cleanupDuplicatedMap(createdMapId);
          if (remaining === 0) {
            setDuplicateProgress({
              percent: 100,
              message: "Duplication cancelled. No duplicated items remain.",
              status: "aborted",
            });
          } else {
            setDuplicateProgress({
              percent: 100,
              message: `Duplication cancelled, but ${remaining} item(s) remain. Please retry cleanup.`,
              status: "error",
            });
          }
        } else {
          setDuplicateProgress({
            percent: 100,
            message: "Duplication cancelled before any map was created.",
            status: "aborted",
          });
        }
        if (!duplicateActivityLogged) {
          recordDuplicateActivity("info", "Map duplication cancelled.", {
            reason: "user_cancelled",
          });
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
      recordMapActivity("sharing_code", "success", "Map code copied.", {
        mapId: row.id,
        mapTitle: row.title,
      });
      setCopiedMessage(`Map code copied for "${row.title}"`);
      window.setTimeout(() => {
        setCopiedMessage((prev) => (prev ? null : prev));
      }, 1400);
    } catch (copyError) {
      recordMapActivity("sharing_code", "failed", "Map code copy failed.", {
        mapId: row.id,
        mapTitle: row.title,
        error: copyError instanceof Error ? copyError.message : String(copyError),
      });
      setError("Unable to copy map code.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (isLoading) {
    return (
      <DashboardPageSkeleton
        activeNav="dashboard"
        eyebrow="Management System Maps"
        title="Management System Maps"
        subtitle="Create and manage management system design maps you own or that are shared with you."
        rows={pageSize}
        columns="22% 18% 14% 10% 12% 12% 12%"
      />
    );
  }

  return (
    <DashboardShell
      activeNav="dashboard"
      eyebrow="Management System Maps"
      title="Management System Maps"
      subtitle="Create and manage management system design maps you own or that are shared with you."
      headerRight={
        <div className={shellStyles.accountSummary}>
          <div className={shellStyles.accountSummaryText}>
            <div className={shellStyles.accountSummaryPrimary}>
              <span className={shellStyles.accountSummaryLabel}>My account</span>
              <strong>{currentUserEmail ?? "Signed in"}</strong>
            </div>
          </div>
        </div>
      }
    >
      <section className={shellStyles.accountCard}>
        <div className={shellStyles.tableToolbar}>
          <div className={shellStyles.toolbarControls}>
            <div className={shellStyles.headerButtons}>
              <LinkMapCodeControl
                open={showLinkForm}
                onOpenChange={setShowLinkForm}
                value={mapCodeInput}
                onValueChange={setMapCodeInput}
                onSubmit={() => void handleLinkMapToProfile()}
                busy={isLinking}
                label="Link Map Code"
              />
              <div className={shellStyles.tableFilter}>
                <button
                  type="button"
                  className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                  onClick={() => setShowCreateMenu((prev) => !prev)}
                  disabled={isCreating}
                >
                  <Image src="/icons/addcomponent.svg" alt="" width={16} height={16} className={shellStyles.buttonIcon} />
                  {isCreating ? "Creating..." : "Create New"}
                </button>
                {showCreateMenu ? (
                  <div className={shellStyles.tableFilterMenu}>
                    <div className={shellStyles.tableFilterMenuHeader}>
                      <strong>Map Category</strong>
                    </div>
                    <div className={shellStyles.tableFilterOptions}>
                      {mapCategoryOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={shellStyles.templatePickerOption}
                          onClick={() => void handleCreateMap(option.id)}
                          disabled={isCreating}
                        >
                          <strong>{option.label}</strong>
                          <span>{option.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {error ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error}</p> : null}
        {copiedMessage ? <p className={`${shellStyles.message} ${shellStyles.messageSuccess}`}>{copiedMessage}</p> : null}

        <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
          <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
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
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Category</th>
                <th>Access</th>
                <th>Map code</th>
                <th>Updated</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className={shellStyles.tableStateCell}>
                    <div className={shellStyles.tableEmptyState}>No maps have been added. Create a new map or link one to your profile.</div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const canCopy = row.owner_id === currentUserId && !!row.map_code;
                  const canDuplicate = !!row.role || row.owner_id === currentUserId;
                  const canDelete = row.owner_id === currentUserId;
                  const copyTitle = canCopy
                    ? "Copy map code"
                    : row.owner_id !== currentUserId
                      ? "Map code is only visible to the map owner"
                      : "No map code available to copy";
                  const duplicateTitle = canDuplicate ? "Duplicate map" : "You do not have permission to duplicate this map";
                  const deleteTitle = canDelete ? "Delete map" : "Only the map creator can delete this map";

                  return (
                    <tr
                      key={row.id}
                      className={shellStyles.clickableRow}
                      onClick={() => router.push(`/system-maps/${row.id}`)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/system-maps/${row.id}`);
                        }
                      }}
                    >
                      <td>
                        <div className={shellStyles.mapCell}>
                          <div className={shellStyles.mapCellText}>
                            <strong className={shellStyles.tableClamp}>{row.title}</strong>
                          </div>
                        </div>
                      </td>
                      <td><span className={shellStyles.tableClamp} title={row.description || "-"}>{row.description || "-"}</span></td>
                      <td><span className={shellStyles.tableClamp} title={getCategoryLabel(row)}>{getCategoryLabel(row)}</span></td>
                      <td><span className={shellStyles.tableClamp}>{getAccessLabel(row)}</span></td>
                      <td><span className={shellStyles.tableClamp}>{row.owner_id === currentUserId ? row.map_code || "-" : "-"}</span></td>
                      <td><span className={shellStyles.tableDate}>{formatDateTime(row.updated_at)}</span></td>
                      <td><span className={shellStyles.tableDate}>{formatDateTime(row.created_at)}</span></td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <div className={shellStyles.actionButtons}>
                          <button type="button" title={copyTitle} aria-label={copyTitle} className={shellStyles.actionButton} disabled={!canCopy} onClick={() => void handleCopyCode(row)}>
                            <Image src="/icons/structure.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                          </button>
                          <button
                            type="button"
                            title={duplicateTitle}
                            aria-label={duplicateTitle}
                            className={shellStyles.actionButton}
                            disabled={!canDuplicate || duplicatingMapId === row.id}
                            onClick={() => {
                              setPendingDuplicateRow(row);
                              setDuplicateCancelRequested(false);
                              duplicateAbortRef.current = false;
                              setDuplicateProgress({ percent: 0, message: "", status: "idle" });
                            }}
                          >
                            <Image src="/icons/addcomponent.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                          </button>
                          <button type="button" title={deleteTitle} aria-label={deleteTitle} className={`${shellStyles.actionButton} ${shellStyles.actionButtonDanger}`} disabled={!canDelete || deletingMapId === row.id} onClick={() => setPendingDeleteRow(row)}>
                            <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
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

        <div className={shellStyles.dashboardMobileList}>
          {rows.length === 0 ? (
            <div className={shellStyles.dashboardMobileState}>No maps have been added. Create a new map or link one to your profile.</div>
          ) : (
            paginatedRows.map((row) => {
              const canCopy = row.owner_id === currentUserId && !!row.map_code;
              const canDuplicate = !!row.role || row.owner_id === currentUserId;
              const canDelete = row.owner_id === currentUserId;

              return (
                <article key={`mobile-${row.id}`} className={shellStyles.dashboardMobileCard}>
                  <button type="button" className={shellStyles.dashboardMobileCardToggle} onClick={() => router.push(`/system-maps/${row.id}`)}>
                    <div className={shellStyles.dashboardMobileCardHeader}>
                      <div className={shellStyles.dashboardMobileCardTitleBlock}>
                        <strong>{row.title}</strong>
                        <span>{row.description || "No description"}</span>
                      </div>
                    </div>
                  </button>

                  <dl className={shellStyles.dashboardMobileMeta}>
                    <div>
                      <dt>Category</dt>
                      <dd>{getCategoryLabel(row)}</dd>
                    </div>
                    <div>
                      <dt>Access</dt>
                      <dd>{getAccessLabel(row)}</dd>
                    </div>
                    <div className={shellStyles.dashboardMobileMetaDate}>
                      <dt>Updated</dt>
                      <dd>{formatDateTime(row.updated_at)}</dd>
                    </div>
                    <div className={shellStyles.dashboardMobileMetaDate}>
                      <dt>Created</dt>
                      <dd>{formatDateTime(row.created_at)}</dd>
                    </div>
                  </dl>

                  <div className={shellStyles.dashboardMobileActions}>
                    <button type="button" className={`${shellStyles.button} ${shellStyles.buttonSecondary} ${shellStyles.dashboardMobileActionButton}`} disabled={!canCopy} onClick={() => void handleCopyCode(row)}>
                      <Image src="/icons/structure.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                      Copy Code
                    </button>
                    <button
                      type="button"
                      className={`${shellStyles.button} ${shellStyles.buttonSecondary} ${shellStyles.dashboardMobileActionButton}`}
                      disabled={!canDuplicate || duplicatingMapId === row.id}
                      onClick={() => {
                        setPendingDuplicateRow(row);
                        setDuplicateCancelRequested(false);
                        duplicateAbortRef.current = false;
                        setDuplicateProgress({ percent: 0, message: "", status: "idle" });
                      }}
                    >
                      <Image src="/icons/addcomponent.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                      {duplicatingMapId === row.id ? "Duplicating..." : "Duplicate"}
                    </button>
                    <button type="button" className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.dashboardMobileActionButton}`} disabled={!canDelete || deletingMapId === row.id} onClick={() => setPendingDeleteRow(row)}>
                      <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                      {deletingMapId === row.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <DashboardTableFooter total={rows.length} page={safePage} pageSize={pageSize} onPageChange={setPage} label="maps" />
      </section>

      {pendingDuplicateRow ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            <h3 className={shellStyles.modalTitle}>Duplicate map?</h3>
            <p className={shellStyles.modalText}>You are about to duplicate <strong>{pendingDuplicateRow.title}</strong>.</p>
            <p className={shellStyles.modalText}>The duplicate will include document nodes, canvas components, relationships, and structure content. You will be set as the owner of the new map.</p>
            {duplicateProgress.status !== "idle" ? (
              <div className={shellStyles.progressBlock}>
                <div className={shellStyles.progressHeader}>
                  <span>{duplicateProgress.message}</span>
                  <span>{duplicateProgress.percent}%</span>
                </div>
                <div className={shellStyles.progressTrack}>
                  <div
                    className={`${shellStyles.progressFill} ${
                      duplicateProgress.status === "error"
                        ? shellStyles.progressError
                        : duplicateProgress.status === "success"
                          ? shellStyles.progressSuccess
                          : duplicateProgress.status === "aborted"
                            ? shellStyles.progressAborted
                            : ""
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, duplicateProgress.percent))}%` }}
                  />
                </div>
              </div>
            ) : null}
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
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
              </button>
              <button type="button" className={`${shellStyles.button} ${shellStyles.buttonAccent}`} onClick={() => void handleDuplicateMap(pendingDuplicateRow)} disabled={duplicatingMapId === pendingDuplicateRow.id}>
                {duplicatingMapId === pendingDuplicateRow.id ? "Duplicating..." : "Duplicate map"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteRow ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            <h3 className={shellStyles.modalTitle}>Delete map?</h3>
            <p className={shellStyles.modalText}>You are about to permanently delete <strong>{pendingDeleteRow.title}</strong>.</p>
            <div className={shellStyles.modalListWrap}>
              <ul className={shellStyles.modalList}>
                <li>The system map</li>
                <li>All document nodes</li>
                <li>All canvas components</li>
                <li>All relationships</li>
                <li>All document structure content</li>
                <li>All linked map member access for this map</li>
              </ul>
            </div>
            <p className={shellStyles.modalWarning}>This cannot be undone.</p>
            <div className={shellStyles.modalActions}>
              <button type="button" className={`${shellStyles.button} ${shellStyles.buttonSecondary}`} onClick={() => setPendingDeleteRow(null)} disabled={deletingMapId === pendingDeleteRow.id}>
                Cancel
              </button>
              <button type="button" className={`${shellStyles.button} ${shellStyles.buttonDanger}`} onClick={() => void handleDeleteMap(pendingDeleteRow)} disabled={deletingMapId === pendingDeleteRow.id}>
                {deletingMapId === pendingDeleteRow.id ? "Deleting..." : "Delete map"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
