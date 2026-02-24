"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";

type SystemMapRow = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  map_code: string | null;
  map_category?: "document_map" | "bow_tie" | "incident_investigation" | "org_chart" | null;
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
  id: "document_map" | "bow_tie" | "incident_investigation" | "org_chart";
  label: string;
  description: string;
};

const mapCategoryOptions: MapCategoryOption[] = [
  { id: "document_map", label: "Document Map", description: "Document-centric compliance and management maps." },
  { id: "bow_tie", label: "Bow Tie", description: "Hazard, controls, escalation and consequence mapping." },
  { id: "incident_investigation", label: "Incident Investigation", description: "Investigation workflows and evidence maps." },
  { id: "org_chart", label: "Org Chart", description: "People and team structure mapping." },
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

  const redirectToLogin = useMemo(
    () => `/login?returnTo=${encodeURIComponent("/system-maps")}`,
    []
  );

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
    const mapIds = [...memberByMapId.keys()];

    if (!mapIds.length) {
      setRows([]);
      return;
    }

    const { data, error: mapsError } = await supabaseBrowser
      .schema("ms")
      .from("system_maps")
      .select("id,title,description,owner_id,map_code,map_category,updated_at,created_at")
      .in("id", mapIds)
      .order("updated_at", { ascending: false });

    if (mapsError) {
      setError(mapsError.message || "Unable to load system maps.");
      return;
    }

    const mergedRows = ((data ?? []) as Omit<SystemMapRow, "role">[]).map((row) => ({
      ...row,
      role: memberByMapId.get(row.id)?.role ?? "read",
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
          title: mapCategory === "bow_tie" ? "Untitled Bow Tie Map" : "Untitled System Map",
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
            title: mapCategory === "bow_tie" ? "Untitled Bow Tie Map" : "Untitled System Map",
            map_category: mapCategory,
          });

        if (insertWithoutReturning.error) {
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
          setError(latestMap.error?.message || "Map created, but the new map id could not be resolved.");
          return;
        }
        createdMapId = latestMap.data.id;
      }

      if (!createdMapId) {
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
        setError(memberInsertError.message || "Map created, but owner permissions could not be assigned.");
        return;
      }

      router.push(`/system-maps/${createdMapId}`);
    } catch (createError) {
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
        setError(deleteError.message || "Unable to delete system map.");
        return;
      }

      setRows((prev) => prev.filter((item) => item.id !== row.id));
      setPendingDeleteRow(null);
    } catch {
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
          setError(insertContentError.message || "Unable to duplicate map structure content.");
          setProgress(100, "Failed while duplicating structure content.", "error");
          return;
        }
      }

      setProgress(100, "Duplicate complete. Opening map...", "success");
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
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setPendingDuplicateRow(null);
      } else {
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
      setCopiedMessage(`Map code copied for "${row.title}"`);
      window.setTimeout(() => {
        setCopiedMessage((prev) => (prev ? null : prev));
      }, 1400);
    } catch {
      setError("Unable to copy map code.");
    }
  };

  if (isLoading) {
    return <div className="dashboard-empty">Loading system maps...</div>;
  }

  return (
    <>
      <div className="dashboard-panel">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Your maps</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowLinkForm((prev) => !prev)}
            >
              Link Map to Profile
            </button>
            <div className="relative">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCreateMenu((prev) => !prev)}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create New"}
              </button>
              {showCreateMenu ? (
                <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-none border border-slate-300 bg-white p-2 shadow-lg">
                  <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Map Category</div>
                  <div className="space-y-1">
                    {mapCategoryOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => void handleCreateMap(option.id)}
                        disabled={isCreating}
                      >
                        <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                        <div className="text-xs text-slate-600">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {showLinkForm && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input
              type="text"
              className="min-w-[260px] flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              placeholder="Enter map code"
              value={mapCodeInput}
              onChange={(e) => setMapCodeInput(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleLinkMapToProfile}
              disabled={isLinking}
            >
              {isLinking ? "Linking..." : "Link"}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {copiedMessage && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {copiedMessage}
          </p>
        )}
      </div>

      <div className="dashboard-panel mt-4" style={{ overflowX: "auto" }}>
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Description</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Access</th>
              <th className="px-3 py-3">Map Code</th>
              <th className="px-3 py-3">Updated</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-5 text-slate-600" colSpan={8}>
                  No maps have been added. Create a new map or link one to your profile.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                  onClick={() => router.push(`/system-maps/${row.id}`)}
                >
                  <td className="px-3 py-3 font-semibold text-slate-900">{row.title}</td>
                  <td className="max-w-[260px] truncate px-3 py-3 text-slate-600" title={row.description || "-"}>
                    {row.description || "-"}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-3 text-slate-600" title={getCategoryLabel(row)}>
                    {getCategoryLabel(row)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{getAccessLabel(row)}</td>
                  <td className="px-3 py-3 text-slate-600">{row.owner_id === currentUserId ? row.map_code || "-" : "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(row.updated_at)}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(row.created_at)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {(() => {
                        const canCopy = row.owner_id === currentUserId && !!row.map_code;
                        const copyTitle = canCopy
                          ? "Copy map code"
                          : row.owner_id !== currentUserId
                            ? "Map code is only visible to the map owner"
                            : "No map code available to copy";
                        return (
                          <button
                            type="button"
                            title={copyTitle}
                            aria-label={copyTitle}
                            className={`flex h-9 w-9 items-center justify-center rounded-none border border-black bg-white ${
                              canCopy ? "text-black hover:bg-slate-100" : "cursor-not-allowed text-slate-400 opacity-60"
                            }`}
                            disabled={!canCopy}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleCopyCode(row);
                            }}
                          >
                            <img src="/icons/structure.svg" alt="" className="h-4 w-4" />
                          </button>
                        );
                      })()}
                      {(() => {
                        const canDuplicate = !!row.role || row.owner_id === currentUserId;
                        const duplicateTitle = canDuplicate ? "Duplicate map" : "You do not have permission to duplicate this map";
                        return (
                          <button
                            type="button"
                            title={duplicateTitle}
                            aria-label={duplicateTitle}
                            className={`flex h-9 w-9 items-center justify-center rounded-none border border-black bg-white ${
                              canDuplicate ? "text-black hover:bg-slate-100" : "cursor-not-allowed text-slate-400 opacity-60"
                            }`}
                            disabled={!canDuplicate || duplicatingMapId === row.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              setPendingDuplicateRow(row);
                              setDuplicateCancelRequested(false);
                              duplicateAbortRef.current = false;
                              setDuplicateProgress({ percent: 0, message: "", status: "idle" });
                            }}
                          >
                            <img src="/icons/addcomponent.svg" alt="" className="h-4 w-4" />
                          </button>
                        );
                      })()}
                      {(() => {
                        const canDelete = row.owner_id === currentUserId;
                        const deleteTitle = canDelete ? "Delete map" : "Only the map creator can delete this map";
                        return (
                          <button
                            type="button"
                            title={deleteTitle}
                            aria-label={deleteTitle}
                            className={`flex h-9 w-9 items-center justify-center rounded-none border border-black bg-white ${
                              canDelete ? "text-rose-700 hover:bg-slate-100" : "cursor-not-allowed text-slate-400 opacity-60"
                            }`}
                            disabled={!canDelete || deletingMapId === row.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              setPendingDeleteRow(row);
                            }}
                          >
                            <img src="/icons/delete.svg" alt="" className="h-4 w-4" />
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pendingDuplicateRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-none border border-slate-300 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Duplicate map?</h2>
            <p className="mt-2 text-sm text-slate-700">
              You are about to duplicate <span className="font-semibold">"{pendingDuplicateRow.title}"</span>.
            </p>
            <div className="mt-3 text-sm text-slate-700">
              The duplicate will include document nodes, canvas components, relationships, and structure content.
            </div>
            <p className="mt-2 text-sm text-slate-700">
              You will be set as the owner of the new map.
            </p>
            {duplicateProgress.status !== "idle" ? (
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{duplicateProgress.message}</span>
                  <span>{duplicateProgress.percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded bg-slate-200">
                  <div
                    className={`h-full transition-all ${
                      duplicateProgress.status === "error"
                        ? "bg-rose-600"
                        : duplicateProgress.status === "success"
                        ? "bg-emerald-600"
                        : duplicateProgress.status === "aborted"
                        ? "bg-amber-600"
                        : "bg-slate-900"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, duplicateProgress.percent))}%` }}
                  />
                </div>
              </div>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={() => {
                  if (duplicatingMapId === pendingDuplicateRow.id) {
                    duplicateAbortRef.current = true;
                    setDuplicateCancelRequested(true);
                    setDuplicateProgress((prev) => ({
                      percent: prev.percent,
                      message: "Cancellation requested...",
                      status: "running",
                    }));
                    return;
                  }
                  setPendingDuplicateRow(null);
                }}
                disabled={duplicatingMapId === pendingDuplicateRow.id && duplicateCancelRequested}
              >
                {duplicatingMapId === pendingDuplicateRow.id ? (duplicateCancelRequested ? "Stopping..." : "Cancel duplication") : "Cancel"}
              </button>
              <button
                type="button"
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  void handleDuplicateMap(pendingDuplicateRow);
                }}
                disabled={duplicatingMapId === pendingDuplicateRow.id}
              >
                {duplicatingMapId === pendingDuplicateRow.id ? "Duplicating..." : "Duplicate map"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-none border border-slate-300 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete map?</h2>
            <p className="mt-2 text-sm text-slate-700">
              You are about to permanently delete <span className="font-semibold">"{pendingDeleteRow.title}"</span>.
            </p>
            <div className="mt-3 text-sm text-slate-700">
              <div>This will delete:</div>
              <ul className="mt-1 list-disc pl-5">
                <li>The system map</li>
                <li>All document nodes</li>
                <li>All canvas components</li>
                <li>All relationships</li>
                <li>All document structure content</li>
                <li>All linked map member access for this map</li>
              </ul>
            </div>
            <p className="mt-3 text-sm font-semibold text-rose-700">This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={() => setPendingDeleteRow(null)}
                disabled={deletingMapId === pendingDeleteRow.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void handleDeleteMap(pendingDeleteRow)}
                disabled={deletingMapId === pendingDeleteRow.id}
              >
                {deletingMapId === pendingDeleteRow.id ? "Deleting..." : "Delete map"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
