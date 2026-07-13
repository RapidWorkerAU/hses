"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  IconTrash,
  IconPlus,
  IconLink,
  IconX,
  IconCheck,
  IconCopy,
  IconLayoutGrid,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import {
  MAP_BUILDER_CATEGORIES,
  MAP_BUILDER_CATEGORY_BY_ID,
  MAP_BUILDER_CATEGORY_OPTIONS,
  type MapBuilderCategory,
} from "./mapBuilderCategories";
import { hasMapCategoryAccess } from "./dashboardPortals";

type SystemMapRow = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  map_code: string | null;
  map_category: MapBuilderCategory["mapCategory"] | null;
  role: string;
  updated_at: string;
  created_at: string;
};

type SmsMapApiRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  canvas_generated: boolean;
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

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDateParts = (value: string) => {
  const formatted = formatDateTime(value);
  const [datePart, timePart] = formatted.split(", ");
  return {
    date: datePart ?? formatted,
    time: timePart ?? "",
  };
};

const truncateValue = (value: string) => {
  if (value.length <= 24) return value;
  return `${value.slice(0, 21)}...`;
};

const DEFAULT_MAP_CATEGORY = MAP_BUILDER_CATEGORIES[0]?.mapCategory ?? "document_map";

const getStoredUserEmail = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("hses_user_email") ?? "";
};

const getCategoryForMap = (mapCategory: MapBuilderCategory["mapCategory"] | null | undefined) =>
  (mapCategory ? MAP_BUILDER_CATEGORY_BY_ID.get(mapCategory) : null) ?? MAP_BUILDER_CATEGORY_BY_ID.get(DEFAULT_MAP_CATEGORY)!;

const getResponseErrorMessage = (...messages: Array<string | null | undefined>) =>
  messages.find((message) => typeof message === "string" && message.trim().length > 0) ?? null;

const getPortalAuthorizationHeader = async () => {
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token ?? (typeof window !== "undefined" ? window.localStorage.getItem("hses_access_token") : null);
  return token ? { Authorization: `Bearer ${token}` } : null;
};

const cloneMapContent = async (sourceMapId: string, targetMapId: string) => {
  const [typesRes, nodesRes, elementsRes, relationsRes, outlineRes] = await Promise.all([
    supabaseBrowser
      .schema("ms")
      .from("document_types")
      .select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active")
      .eq("map_id", sourceMapId),
    supabaseBrowser
      .schema("ms")
      .from("document_nodes")
      .select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived")
      .eq("map_id", sourceMapId),
    supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .select("id,map_id,element_type,heading,color_hex,created_by_user_id,element_config,pos_x,pos_y,width,height")
      .eq("map_id", sourceMapId),
    supabaseBrowser
      .schema("ms")
      .from("node_relations")
      .select(
        "id,map_id,from_node_id,to_node_id,source_grouping_element_id,target_grouping_element_id,source_system_element_id,target_system_element_id,relation_type,relationship_description,relationship_disciplines,relationship_category,relationship_custom_type"
      )
      .eq("map_id", sourceMapId),
    supabaseBrowser
      .schema("ms")
      .from("document_outline_items")
      .select("id,map_id,node_id,kind,heading_level,parent_heading_id,heading_id,title,content_text,sort_order")
      .eq("map_id", sourceMapId),
  ]);

  const sourceLoadError = getResponseErrorMessage(
    typesRes.error?.message,
    nodesRes.error?.message,
    elementsRes.error?.message,
    relationsRes.error?.message,
    outlineRes.error?.message
  );
  if (sourceLoadError) {
    throw new Error(sourceLoadError);
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

  for (const sourceType of sourceTypes) {
    const { data: insertedType, error } = await supabaseBrowser
      .schema("ms")
      .from("document_types")
      .insert({
        map_id: targetMapId,
        name: sourceType.name,
        level_rank: sourceType.level_rank,
        band_y_min: sourceType.band_y_min,
        band_y_max: sourceType.band_y_max,
        is_active: sourceType.is_active,
      })
      .select("id")
      .single();

    if (error || !insertedType?.id) {
      throw new Error(error?.message || "Unable to duplicate document hierarchy.");
    }

    typeIdMap.set(sourceType.id, insertedType.id);
  }

  for (const sourceNode of sourceNodes) {
    const { data: insertedNode, error } = await supabaseBrowser
      .schema("ms")
      .from("document_nodes")
      .insert({
        map_id: targetMapId,
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

    if (error || !insertedNode?.id) {
      throw new Error(error?.message || "Unable to duplicate document nodes.");
    }

    nodeIdMap.set(sourceNode.id, insertedNode.id);
  }

  for (const sourceElement of sourceElements) {
    const { data: insertedElement, error } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .insert({
        map_id: targetMapId,
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

    if (error || !insertedElement?.id) {
      throw new Error(error?.message || "Unable to duplicate canvas components.");
    }

    elementIdMap.set(sourceElement.id, insertedElement.id);
  }

  for (const sourceRelation of sourceRelations) {
    const { error } = await supabaseBrowser
      .schema("ms")
      .from("node_relations")
      .insert({
        map_id: targetMapId,
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

    if (error) {
      throw new Error(error.message || "Unable to duplicate relationships.");
    }
  }

  const sourceHeadings = sourceOutlineItems
    .filter((item) => item.kind === "heading")
    .sort((a, b) => (a.heading_level ?? 0) - (b.heading_level ?? 0) || a.sort_order - b.sort_order);

  for (const sourceHeading of sourceHeadings) {
    const { data: insertedHeading, error } = await supabaseBrowser
      .schema("ms")
      .from("document_outline_items")
      .insert({
        map_id: targetMapId,
        node_id: nodeIdMap.get(sourceHeading.node_id) ?? sourceHeading.node_id,
        kind: sourceHeading.kind,
        heading_level: sourceHeading.heading_level,
        parent_heading_id: sourceHeading.parent_heading_id ? outlineHeadingIdMap.get(sourceHeading.parent_heading_id) ?? null : null,
        heading_id: null,
        title: sourceHeading.title,
        content_text: sourceHeading.content_text,
        sort_order: sourceHeading.sort_order,
      })
      .select("id")
      .single();

    if (error || !insertedHeading?.id) {
      throw new Error(error?.message || "Unable to duplicate map structure headings.");
    }

    outlineHeadingIdMap.set(sourceHeading.id, insertedHeading.id);
  }

  for (const sourceContent of sourceOutlineItems.filter((item) => item.kind === "content")) {
    const { error } = await supabaseBrowser
      .schema("ms")
      .from("document_outline_items")
      .insert({
        map_id: targetMapId,
        node_id: nodeIdMap.get(sourceContent.node_id) ?? sourceContent.node_id,
        kind: sourceContent.kind,
        heading_level: sourceContent.heading_level,
        parent_heading_id: sourceContent.parent_heading_id ? outlineHeadingIdMap.get(sourceContent.parent_heading_id) ?? null : null,
        heading_id: sourceContent.heading_id ? outlineHeadingIdMap.get(sourceContent.heading_id) ?? null : null,
        title: sourceContent.title,
        content_text: sourceContent.content_text,
        sort_order: sourceContent.sort_order,
      });

    if (error) {
      throw new Error(error.message || "Unable to duplicate map structure content.");
    }
  }
};

const cleanupDuplicatedMap = async (mapId: string, ownerId: string) => {
  await supabaseBrowser.schema("ms").from("document_outline_items").delete().eq("map_id", mapId);
  await supabaseBrowser.schema("ms").from("node_relations").delete().eq("map_id", mapId);
  await supabaseBrowser.schema("ms").from("canvas_elements").delete().eq("map_id", mapId);
  await supabaseBrowser.schema("ms").from("document_nodes").delete().eq("map_id", mapId);
  await supabaseBrowser.schema("ms").from("document_types").delete().eq("map_id", mapId);
  await supabaseBrowser.schema("ms").from("map_members").delete().eq("map_id", mapId);
  await supabaseBrowser.schema("ms").from("system_maps").delete().eq("id", mapId).eq("owner_id", ownerId);
};

const getTitlePlaceholder = (category: MapBuilderCategory) => {
  switch (category.mapCategory) {
    case "incident_investigation":
      return "Example: Forklift collision in warehouse";
    case "document_map":
      return "Example: Contractor onboarding document map";
    case "system_map":
      return "Example: Contractor management system map";
    case "bow_tie":
      return "Example: Working at heights bow tie";
    case "org_chart":
      return "Example: Operations team structure";
    case "process_flow":
      return "Example: Incident notification workflow";
    default:
      return "Enter a clear working title";
  }
};

const getDescriptionPlaceholder = (category: MapBuilderCategory) => {
  switch (category.mapCategory) {
    case "incident_investigation":
      return "Summarise what happened, who is involved, and what the investigation needs to establish.";
    case "document_map":
      return "Outline the documents, relationships, and structure this map needs to capture.";
    case "system_map":
      return "Describe the management system structure, components, and relationships this map should represent.";
    case "bow_tie":
      return "Summarise the hazard, key controls, escalation factors, and consequences this bow tie will cover.";
    case "org_chart":
      return "Describe the team, reporting lines, and organisational structure this chart should present.";
    case "process_flow":
      return "Describe the process, steps, decision points, and outputs this flow should represent.";
    default:
      return "Add context to help identify the purpose of this map.";
  }
};

type MapBuilderLandingClientProps = {
  category?: MapBuilderCategory;
  returnToPath?: string;
};

export default function MapBuilderLandingClient({ category, returnToPath = "/dashboard/map-builders" }: MapBuilderLandingClientProps) {
  const pageSize = 7;
  const router = useRouter();
  const linkPanelRef = useRef<HTMLDivElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [rows, setRows] = useState<SystemMapRow[]>([]);
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deletingMapId, setDeletingMapId] = useState<string | null>(null);
  const [duplicatingMapId, setDuplicatingMapId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [mapCodeInput, setMapCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedMapCategory, setSelectedMapCategory] = useState<MapBuilderCategory["mapCategory"]>(
    category?.mapCategory ?? DEFAULT_MAP_CATEGORY
  );
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [pendingDuplicateRow, setPendingDuplicateRow] = useState<SystemMapRow | null>(null);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<SystemMapRow | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ percent: number; message: string } | null>(null);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ percent: number; message: string } | null>(null);
  const [page, setPage] = useState(1);

  const redirectToLogin = useMemo(() => `/login?returnTo=${encodeURIComponent(returnToPath)}`, [returnToPath]);

  const resolvedCreateCategory = getCategoryForMap(selectedMapCategory);
  const filterMapCategory = category?.mapCategory ?? null;
  const isSystemArchitectMode = filterMapCategory === "system_map";

  const getRecordHref = (row: SystemMapRow) =>
    row.map_category === "system_map"
      ? `/dashboard/system-architect/${row.id}/intake`
      : row.map_category === "incident_investigation"
      ? `/dashboard/map-builders/investigation-maps/${row.id}`
      : `/system-maps/${row.id}`;

  const loadMaps = useCallback(async (): Promise<SystemMapRow[]> => {
    const user = await ensurePortalSupabaseUser();
    if (!user) {
      window.location.assign(redirectToLogin);
      return [];
    }

    setCurrentUserId(user.id);
    setCurrentUserEmail(user.email ?? getStoredUserEmail());

    if (filterMapCategory === "system_map") {
      const authHeader = await getPortalAuthorizationHeader();
      if (!authHeader) {
        window.location.assign(redirectToLogin);
        return [];
      }

      const response = await fetch("/api/sms/maps", { headers: authHeader });
      const payload = (await response.json()) as { maps?: SmsMapApiRow[]; error?: string };
      if (!response.ok) {
        setError(payload.error || "Unable to load system maps.");
        return [];
      }

      const smsRows: SystemMapRow[] = (payload.maps ?? []).map((row) => ({
        id: row.id,
        title: row.name,
        description: row.description,
        owner_id: row.user_id,
        map_code: null,
        map_category: "system_map",
        role: "full_write",
        updated_at: row.updated_at,
        created_at: row.created_at,
      }));

      setRows(smsRows);
      setSelectedMapIds((current) => current.filter((id) => smsRows.some((row) => row.id === id)));
      return smsRows;
    }

    const { data: memberRows, error: memberError } = await supabaseBrowser
      .schema("ms")
      .from("map_members")
      .select("map_id,user_id,role")
      .eq("user_id", user.id);

    if (memberError) {
      setError(memberError.message || "Unable to load map memberships.");
      return [];
    }

    const memberByMapId = new Map<string, MapMemberRow>();
    (memberRows ?? []).forEach((row) => memberByMapId.set(row.map_id, row as MapMemberRow));
    const mapIds = [...memberByMapId.keys()];

    if (!mapIds.length) {
      setRows([]);
      setSelectedMapIds([]);
      return [];
    }

    const { data, error: mapsError } = await supabaseBrowser
      .schema("ms")
      .from("system_maps")
      .select("id,title,description,owner_id,map_code,map_category,updated_at,created_at")
      .in("id", mapIds)
      .order("updated_at", { ascending: false });

    if (mapsError) {
      setError(mapsError.message || "Unable to load maps.");
      return [];
    }

    const mergedRows = ((data ?? []) as Omit<SystemMapRow, "role">[])
      .map((row) => ({
        ...row,
        role: memberByMapId.get(row.id)?.role ?? "read",
      }))
      .filter((row) => hasMapCategoryAccess(user.email ?? getStoredUserEmail(), row.map_category))
      .filter((row) => !filterMapCategory || getCategoryForMap(row.map_category).mapCategory === filterMapCategory);

    setRows(mergedRows);
    setSelectedMapIds((current) => current.filter((id) => mergedRows.some((row) => row.id === id)));
    return mergedRows;
  }, [filterMapCategory, redirectToLogin]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadMaps();
      } catch {
        setError("Unable to load maps.");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [loadMaps]);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    setPage((current) => Math.min(current, totalPages));
  }, [rows.length]);

  useEffect(() => {
    if (!showLinkForm) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (linkPanelRef.current?.contains(target)) return;
      setShowLinkForm(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showLinkForm]);

  useEffect(() => {
    if (!showLinkForm) return;
    const timeoutId = window.setTimeout(() => linkInputRef.current?.focus(), 140);
    return () => window.clearTimeout(timeoutId);
  }, [showLinkForm]);

  const selectedOwnedMapIds = selectedMapIds.filter((mapId) => rows.some((row) => row.id === mapId && row.owner_id === currentUserId));
  const ownRows = rows.filter((row) => row.owner_id === currentUserId);
  const allOwnedSelected = ownRows.length > 0 && ownRows.every((row) => selectedMapIds.includes(row.id));
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSelectAllOwned = () => {
    if (allOwnedSelected) {
      setSelectedMapIds((current) => current.filter((id) => !ownRows.some((row) => row.id === id)));
      return;
    }

    setSelectedMapIds((current) => {
      const next = new Set(current);
      ownRows.forEach((row) => next.add(row.id));
      return [...next];
    });
  };

  const toggleRowSelection = (mapId: string) => {
    setSelectedMapIds((current) => (current.includes(mapId) ? current.filter((id) => id !== mapId) : [...current, mapId]));
  };

  const openCreateModal = () => {
    setError(null);
    setSelectedMapCategory(category?.mapCategory ?? DEFAULT_MAP_CATEGORY);
    setNewTitle("");
    setNewDescription("");
    setIsCreateModalOpen(true);
  };

  const createMap = async () => {
    if (!selectedMapCategory) {
      setError("Map category is required.");
      return;
    }

    if (!newTitle.trim()) {
      setError("Map title is required.");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(redirectToLogin);
        return;
      }

      if (selectedMapCategory === "system_map") {
        const authHeader = await getPortalAuthorizationHeader();
        if (!authHeader) {
          window.location.assign(redirectToLogin);
          return;
        }

        const response = await fetch("/api/sms/maps", {
          method: "POST",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newTitle.trim(),
            description: newDescription.trim() || null,
          }),
        });
        const payload = (await response.json()) as { href?: string; error?: string };

        if (!response.ok || !payload.href) {
          setError(payload.error || "Unable to create system map intake.");
          return;
        }

        router.push(payload.href);
        return;
      }

      let createdMapId: string | null = null;
      const { data, error: createErrorResponse } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .insert({
          owner_id: user.id,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          map_category: selectedMapCategory,
        })
        .select("id")
        .single();

      if (!createErrorResponse && data?.id) {
        createdMapId = data.id;
      } else {
        const fallbackInsert = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .insert({
            owner_id: user.id,
            title: newTitle.trim(),
            description: newDescription.trim() || null,
            map_category: selectedMapCategory,
          });

        if (fallbackInsert.error) {
          setError(createErrorResponse?.message || fallbackInsert.error.message || "Unable to create map.");
          return;
        }

        const latestMap = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .select("id")
          .eq("owner_id", user.id)
          .eq("map_category", selectedMapCategory)
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

      const newMapId = createdMapId;

      const { error: memberInsertError } = await supabaseBrowser
        .schema("ms")
        .from("map_members")
        .upsert(
          {
            map_id: newMapId,
            user_id: user.id,
            role: "full_write",
          },
          { onConflict: "map_id,user_id" }
        );

      if (memberInsertError) {
        setError(memberInsertError.message || "Map created, but owner permissions could not be assigned.");
        return;
      }

      if (selectedMapCategory === "incident_investigation") {
        router.push(`/dashboard/map-builders/investigation-maps/${newMapId}`);
        return;
      }

      router.push(`/system-maps/${newMapId}`);
    } catch {
      setError("Unable to create map.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLinkMapToProfile = async () => {
    if (isSystemArchitectMode) {
      setError("System Architect maps do not use map codes yet.");
      return;
    }

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

      const { error: linkError } = await supabaseBrowser.schema("ms").rpc("link_map_to_profile_by_code", {
        p_map_code: code,
      });

      if (linkError) {
        setError(linkError.message || "Unable to link map to your profile with this code.");
        return;
      }

      setMapCodeInput("");
      setShowLinkForm(false);
      const loadedRows = await loadMaps();
      const linkedRowVisible = loadedRows.some((row) => (row.map_code ?? "").toUpperCase() === code);

      if (category && !linkedRowVisible) {
        setError(`This page only shows ${category.title.toLowerCase()}. The linked map will stay available from Canvas Creator if you have access.`);
        return;
      }

      setSuccessMessage("Map linked.");
    } catch {
      setError("Unable to link map to your profile.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeleteMap = async (row: SystemMapRow) => {
    if (row.owner_id !== currentUserId) return;

    try {
      setDeletingMapId(row.id);
      setError(null);
      setDeleteProgress({ percent: 20, message: "Preparing delete..." });

      window.setTimeout(() => {
        setDeleteProgress((current) => (current ? { percent: 68, message: "Deleting map content..." } : current));
      }, 180);

      if (row.map_category === "system_map") {
        const authHeader = await getPortalAuthorizationHeader();
        if (!authHeader) {
          window.location.assign(redirectToLogin);
          return;
        }

        const response = await fetch("/api/sms/maps", {
          method: "DELETE",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: [row.id] }),
        });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(payload.error || "Unable to delete system map.");
          return;
        }

        setDeleteProgress({ percent: 100, message: "Finalising..." });
        setRows((current) => current.filter((item) => item.id !== row.id));
        setSelectedMapIds((current) => current.filter((id) => id !== row.id));
        window.setTimeout(() => {
          setPendingDeleteRow(null);
          setDeleteProgress(null);
        }, 180);
        setSuccessMessage("System map deleted.");
        return;
      }

      const { error: deleteError } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .delete()
        .eq("id", row.id)
        .eq("owner_id", currentUserId as string);

      if (deleteError) {
        setError(deleteError.message || "Unable to delete map.");
        return;
      }

      setDeleteProgress({ percent: 100, message: "Finalising..." });
      setRows((current) => current.filter((item) => item.id !== row.id));
      setSelectedMapIds((current) => current.filter((id) => id !== row.id));
      window.setTimeout(() => {
        setPendingDeleteRow(null);
        setDeleteProgress(null);
      }, 180);
      setSuccessMessage("Map deleted.");
    } catch {
      setError("Unable to delete map.");
    } finally {
      setDeletingMapId(null);
      window.setTimeout(() => setDeleteProgress(null), 220);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedOwnedMapIds.length || !currentUserId) return;

    try {
      setIsBulkDeleting(true);
      setError(null);
      setBulkDeleteProgress({ percent: 18, message: "Preparing bulk delete..." });

      window.setTimeout(() => {
        setBulkDeleteProgress((current) => (current ? { percent: 72, message: "Deleting selected maps..." } : current));
      }, 180);

      if (isSystemArchitectMode) {
        const authHeader = await getPortalAuthorizationHeader();
        if (!authHeader) {
          window.location.assign(redirectToLogin);
          return;
        }

        const response = await fetch("/api/sms/maps", {
          method: "DELETE",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: selectedOwnedMapIds }),
        });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(payload.error || "Unable to bulk delete system maps.");
          return;
        }

        setBulkDeleteProgress({ percent: 100, message: "Finalising..." });
        setRows((current) => current.filter((row) => !selectedOwnedMapIds.includes(row.id)));
        setSelectedMapIds((current) => current.filter((id) => !selectedOwnedMapIds.includes(id)));
        window.setTimeout(() => {
          setShowBulkDeleteConfirm(false);
          setBulkDeleteProgress(null);
        }, 180);
        setSuccessMessage(`${selectedOwnedMapIds.length} system map${selectedOwnedMapIds.length === 1 ? "" : "s"} deleted.`);
        return;
      }

      const { error: deleteError } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .delete()
        .eq("owner_id", currentUserId)
        .in("id", selectedOwnedMapIds);

      if (deleteError) {
        setError(deleteError.message || "Unable to bulk delete maps.");
        return;
      }

      setBulkDeleteProgress({ percent: 100, message: "Finalising..." });
      setRows((current) => current.filter((row) => !selectedOwnedMapIds.includes(row.id)));
      setSelectedMapIds((current) => current.filter((id) => !selectedOwnedMapIds.includes(id)));
      window.setTimeout(() => {
        setShowBulkDeleteConfirm(false);
        setBulkDeleteProgress(null);
      }, 180);
      setSuccessMessage(`${selectedOwnedMapIds.length} map${selectedOwnedMapIds.length === 1 ? "" : "s"} deleted.`);
    } catch {
      setError("Unable to bulk delete maps.");
    } finally {
      setIsBulkDeleting(false);
      window.setTimeout(() => setBulkDeleteProgress(null), 220);
    }
  };

  const handleDuplicateMap = async (row: SystemMapRow) => {
    let createdMapId: string | null = null;
    let duplicateOwnerId: string | null = null;

    try {
      setDuplicatingMapId(row.id);
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

      duplicateOwnerId = user.id;
      const duplicateTitle = `${row.title} (Copy)`;

      if (row.map_category === "system_map") {
        const authHeader = await getPortalAuthorizationHeader();
        if (!authHeader) {
          window.location.assign(redirectToLogin);
          return;
        }

        const response = await fetch("/api/sms/maps", {
          method: "POST",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: duplicateTitle,
            description: row.description,
          }),
        });
        const payload = (await response.json()) as { href?: string; error?: string };
        if (!response.ok || !payload.href) {
          setError(payload.error || "Unable to duplicate system map.");
          return;
        }

        setPendingDuplicateRow(null);
        router.push(payload.href);
        return;
      }

      const { data, error: createErrorResponse } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .insert({
          owner_id: user.id,
          title: duplicateTitle,
          description: row.description,
          map_category: row.map_category ?? DEFAULT_MAP_CATEGORY,
        })
        .select("id")
        .single();

      if (!createErrorResponse && data?.id) {
        createdMapId = data.id;
      } else {
        const fallbackInsert = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .insert({
            owner_id: user.id,
            title: duplicateTitle,
            description: row.description,
            map_category: row.map_category ?? DEFAULT_MAP_CATEGORY,
          });

        if (fallbackInsert.error) {
          setError(createErrorResponse?.message || fallbackInsert.error.message || "Unable to duplicate map.");
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
          setError(latestMap.error?.message || "Map duplicated, but the new map id could not be resolved.");
          return;
        }

        createdMapId = latestMap.data.id;
      }

      if (!createdMapId) {
        setError("Map duplicated, but the new map id could not be resolved.");
        return;
      }

      const newMapId = createdMapId;

      const { error: memberInsertError } = await supabaseBrowser
        .schema("ms")
        .from("map_members")
        .upsert(
          {
            map_id: newMapId,
            user_id: user.id,
            role: "full_write",
          },
          { onConflict: "map_id,user_id" }
        );

      if (memberInsertError) {
        try {
          await cleanupDuplicatedMap(newMapId, user.id);
        } catch {
          // Preserve the permission error for the user.
        }
        setError(memberInsertError.message || "Map duplicated, but owner permissions could not be assigned.");
        return;
      }

      await cloneMapContent(row.id, newMapId);
      setPendingDuplicateRow(null);

      if (row.map_category === "incident_investigation") {
        router.push(`/dashboard/map-builders/investigation-maps/${newMapId}`);
        return;
      }

      router.push(`/system-maps/${newMapId}`);
    } catch (duplicateError) {
      if (createdMapId && duplicateOwnerId) {
        try {
          await cleanupDuplicatedMap(createdMapId, duplicateOwnerId);
        } catch {
          // Preserve the original duplication error for the user.
        }
      }
      setError(duplicateError instanceof Error ? duplicateError.message : "Unable to duplicate map.");
    } finally {
      setDuplicatingMapId(null);
    }
  };

  const handleCopyCode = async (row: SystemMapRow) => {
    const canCopy = row.owner_id === currentUserId && !!row.map_code;
    if (!canCopy) return;

    try {
      await navigator.clipboard.writeText(row.map_code as string);
      setSuccessMessage(`Map code copied for "${row.title}"`);
    } catch {
      setError("Unable to copy map code.");
    }
  };

  const getOwnerLabel = (row: SystemMapRow) => {
    if (row.owner_id === currentUserId) {
      return currentUserEmail || "You";
    }
    return truncateValue(row.owner_id);
  };

  const accessibleCategoryOptions = MAP_BUILDER_CATEGORY_OPTIONS.filter((option) =>
    hasMapCategoryAccess(currentUserEmail || getStoredUserEmail(), option.value)
  );
  const deleteItemLabel = "map";
  const isSingleCategoryView = Boolean(category);
  const emptyLabel = category?.emptyLabel ?? "No canvas maps have been added yet.";
  const createButtonLabel = category?.createButtonLabel ?? "Create New Canvas Map";
  const footerLabel = category?.title.toLowerCase() ?? "canvas maps";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-44" />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="danger"
          size="sm"
          iconLeft={<IconTrash size={14} />}
          onClick={() => setShowBulkDeleteConfirm(true)}
          disabled={!selectedOwnedMapIds.length || isBulkDeleting}
        >
          {isBulkDeleting ? "Deleting..." : "Bulk Delete"}
        </Button>

        <div className="flex items-center gap-2">
          <div ref={linkPanelRef} className="relative flex items-center">
            {showLinkForm ? (
              <div className="flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 h-8">
                <input
                  ref={linkInputRef}
                  type="text"
                  className="text-[13px] outline-none w-[140px] placeholder:text-neutral-400 text-neutral-900"
                  placeholder="Enter code here"
                  value={mapCodeInput}
                  onChange={(event) => setMapCodeInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleLinkMapToProfile();
                    }
                    if (event.key === "Escape") {
                      setShowLinkForm(false);
                    }
                  }}
                />
                <button
                  type="button"
                  title={isLinking ? "Linking" : "Link map code"}
                  aria-label={isLinking ? "Linking" : "Link map code"}
                  onClick={() => void handleLinkMapToProfile()}
                  disabled={isLinking}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-40"
                >
                  <IconCheck size={14} />
                </button>
                <button
                  type="button"
                  title="Close"
                  aria-label="Close link map code"
                  onClick={() => setShowLinkForm(false)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  <IconX size={14} />
                </button>
              </div>
            ) : (
              <Button
                variant="neutral"
                size="sm"
                iconLeft={<IconLink size={14} />}
                onClick={() => setShowLinkForm(true)}
                aria-expanded={showLinkForm}
              >
                Link Map Code
              </Button>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            iconLeft={<IconPlus size={14} />}
            onClick={openCreateModal}
          >
            {createButtonLabel}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
      ) : null}
      {successMessage ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-[13px] text-teal-700">{successMessage}</div>
      ) : null}

      {!isSingleCategoryView ? (
        <div className="flex flex-col gap-3 md:hidden">
          {rows.length === 0 ? (
            <p className="text-[13px] text-neutral-500 py-6 text-center">{emptyLabel}</p>
          ) : (
            paginatedRows.map((row) => {
              const rowCategory = getCategoryForMap(row.map_category);
              const updatedParts = formatDateParts(row.updated_at);
              const ownerLabel = getOwnerLabel(row);

              return (
                <button
                  key={row.id}
                  type="button"
                  className="rounded-xl border border-neutral-200 bg-white p-4 text-left hover:shadow-sm hover:border-neutral-300 transition-all"
                  onClick={() => router.push(getRecordHref(row))}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-neutral-400 bg-neutral-100 rounded px-2 py-0.5">{row.map_code || "No code"}</span>
                  </div>
                  <div className="mb-3">
                    <p className="text-[14px] font-semibold text-neutral-900">{row.title}</p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">{row.description || "No description added for this canvas map yet."}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-[11px] text-neutral-500"><span className="font-medium">Category</span> · {rowCategory.title}</span>
                    <span className="text-[11px] text-neutral-500"><span className="font-medium">Owner</span> · {ownerLabel}</span>
                    <span className="text-[11px] text-neutral-500"><span className="font-medium">Updated</span> · {updatedParts.date}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : null}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-neutral-700">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="w-10 px-4 py-3 text-left font-medium text-neutral-500">
                  <input type="checkbox" checked={allOwnedSelected} onChange={toggleSelectAllOwned} aria-label="Select all owned maps" className="rounded border-neutral-300" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Map name</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Category</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Owner</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Code</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Last updated by</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Updated</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Created</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[13px] text-neutral-400">
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const canDelete = row.owner_id === currentUserId;
                  const rowCategory = getCategoryForMap(row.map_category);
                  const ownerLabel = getOwnerLabel(row);
                  const updatedParts = formatDateParts(row.updated_at);
                  const createdParts = formatDateParts(row.created_at);

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => router.push(getRecordHref(row))}
                    >
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedMapIds.includes(row.id)}
                          disabled={!canDelete}
                          onChange={() => toggleRowSelection(row.id)}
                          aria-label={`Select ${row.title}`}
                          className="rounded border-neutral-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{row.title}</p>
                        {row.description && <p className="text-[12px] text-neutral-400 mt-0.5">{row.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{rowCategory.title}</td>
                      <td className="px-4 py-3 text-neutral-600" title={ownerLabel}>{ownerLabel}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.map_code || "-"}</td>
                      <td className="px-4 py-3 text-neutral-600" title={ownerLabel}>{ownerLabel}</td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-700">{updatedParts.date}</p>
                        <p className="text-[11px] text-neutral-400">{updatedParts.time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-700">{createdParts.date}</p>
                        <p className="text-[11px] text-neutral-400">{createdParts.time}</p>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {(() => {
                            const canCopy = row.owner_id === currentUserId && !!row.map_code;
                            const copyTitle = canCopy
                              ? "Copy map code"
                              : row.owner_id !== currentUserId
                                ? "Map code is only visible to the map owner"
                                : "No map code available to copy";

                            return (
                              <Button
                                variant="neutral"
                                size="sm"
                                iconOnly
                                title={copyTitle}
                                aria-label={copyTitle}
                                onClick={() => void handleCopyCode(row)}
                                disabled={!canCopy}
                              >
                                <IconCopy size={15} />
                              </Button>
                            );
                          })()}
                          <Button
                            variant="neutral"
                            size="sm"
                            iconOnly
                            title="Duplicate map"
                            aria-label="Duplicate map"
                            onClick={() => setPendingDuplicateRow(row)}
                            disabled={duplicatingMapId === row.id}
                          >
                            <IconLayoutGrid size={15} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            iconOnly
                            title={canDelete ? "Delete map" : "Only the map creator can delete this map"}
                            aria-label={canDelete ? "Delete map" : "Only the map creator can delete this map"}
                            onClick={() => setPendingDeleteRow(row)}
                            disabled={!canDelete || deletingMapId === row.id}
                          >
                            <IconTrash size={15} />
                          </Button>
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

      {rows.length > pageSize && (
        <div className="flex items-center justify-between text-[13px] text-neutral-500">
          <span>
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, rows.length)} of {rows.length} {footerLabel}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="neutral"
              size="sm"
              iconOnly
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
            >
              <IconChevronLeft size={14} />
            </Button>
            <Button
              variant="neutral"
              size="sm"
              iconOnly
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
            >
              <IconChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create canvas map"
        subtitle="Set up a new canvas map."
        size="md"
        footer={
          <>
            <Button variant="neutral" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void createMap()} loading={isCreating} loadingText="Creating...">
              {resolvedCreateCategory.mapCategory === "incident_investigation" ? "Create investigation" : "Create new"}
            </Button>
          </>
        }
      >
        {!category ? (
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-neutral-700">Map category</label>
            <select
              className="rounded-md border border-neutral-200 bg-white px-3 h-9 text-[13px] text-neutral-900 outline-none focus:ring-2 focus:ring-[#2d9692]/20 focus:border-[#2d9692]"
              value={selectedMapCategory}
              onChange={(event) => setSelectedMapCategory(event.target.value as MapBuilderCategory["mapCategory"])}
            >
              {accessibleCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="flex flex-col gap-1">
          <Input
            label={resolvedCreateCategory.mapCategory === "incident_investigation" ? "Investigation title" : "Title"}
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder={getTitlePlaceholder(resolvedCreateCategory)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-neutral-700">Description</label>
          <textarea
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-900 outline-none focus:ring-2 focus:ring-[#2d9692]/20 focus:border-[#2d9692] resize-none"
            value={newDescription}
            onChange={(event) => setNewDescription(event.target.value)}
            placeholder={getDescriptionPlaceholder(resolvedCreateCategory)}
            rows={5}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={!!pendingDuplicateRow}
        onClose={() => setPendingDuplicateRow(null)}
        title="Duplicate map?"
        description={`You are about to duplicate "${pendingDuplicateRow?.title ?? ""}". The duplicate will include nodes, components, relationships, and outline content. You will become the owner of the new map.`}
        confirmLabel="Duplicate map"
        variant="default"
        onConfirm={() => { if (pendingDuplicateRow) void handleDuplicateMap(pendingDuplicateRow); }}
        loading={duplicatingMapId === pendingDuplicateRow?.id}
      />

      <Modal
        open={!!pendingDeleteRow}
        onClose={() => setPendingDeleteRow(null)}
        title="Delete map?"
        size="sm"
        contentFit
        footer={
          <>
            <Button variant="neutral" onClick={() => setPendingDeleteRow(null)} disabled={deletingMapId === pendingDeleteRow?.id}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => { if (pendingDeleteRow) void handleDeleteMap(pendingDeleteRow); }}
              loading={deletingMapId === pendingDeleteRow?.id}
              loadingText="Deleting..."
            >
              Delete map
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-neutral-700">
          You are about to permanently delete <strong>{pendingDeleteRow?.title}</strong>.
        </p>
        <ul className="text-[13px] text-neutral-500 list-disc pl-5 mt-2 space-y-1">
          <li>The {deleteItemLabel}</li>
          <li>All nodes and canvas components</li>
          <li>All relationships and outline content</li>
          <li>All linked map member access for this map</li>
        </ul>
        <p className="text-[12px] font-medium text-red-600 mt-2">This cannot be undone.</p>
        {deleteProgress ? (
          <div className="mt-3 rounded-md border border-neutral-200 p-3">
            <div className="flex justify-between text-[12px] text-neutral-600 mb-1.5">
              <span>{deleteProgress.message}</span>
              <span>{deleteProgress.percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
              <div className="h-full bg-[#2d9692] rounded-full transition-all" style={{ width: `${deleteProgress.percent}%` }} />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        title="Bulk delete maps?"
        size="sm"
        contentFit
        footer={
          <>
            <Button variant="neutral" onClick={() => setShowBulkDeleteConfirm(false)} disabled={isBulkDeleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleBulkDelete()}
              loading={isBulkDeleting}
              loadingText="Deleting..."
            >
              Delete selected
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-neutral-700">
          You are about to delete <strong>{selectedOwnedMapIds.length}</strong> selected map{selectedOwnedMapIds.length === 1 ? "" : "s"}.
        </p>
        <ul className="text-[13px] text-neutral-500 list-disc pl-5 mt-2 space-y-1">
          <li>The selected maps</li>
          <li>All nodes and canvas components linked to those maps</li>
          <li>All relationships and outline content for those maps</li>
          <li>All linked map member access for those maps</li>
        </ul>
        <p className="text-[12px] font-medium text-red-600 mt-2">This cannot be undone.</p>
        {bulkDeleteProgress ? (
          <div className="mt-3 rounded-md border border-neutral-200 p-3">
            <div className="flex justify-between text-[12px] text-neutral-600 mb-1.5">
              <span>{bulkDeleteProgress.message}</span>
              <span>{bulkDeleteProgress.percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
              <div className="h-full bg-[#2d9692] rounded-full transition-all" style={{ width: `${bulkDeleteProgress.percent}%` }} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
