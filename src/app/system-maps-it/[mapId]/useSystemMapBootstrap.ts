"use client";

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { accessBlocksInvestigationEntry, accessRequiresSelection, fetchAccessState, type BillingAccessState } from "@/lib/access";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import {
  fallbackHierarchy,
  getCanonicalTypeName,
  isAbortLikeError,
  normalizeTypeRanks,
  type CanvasElementRow,
  type AnchorLinkRow,
  type DocumentNodeRow,
  type DocumentTypeRow,
  type NodeRelationRow,
  type SystemMap,
  type SystemMapCanvasSnapshot,
  type MapMemberProfileRow,
} from "./canvasShared";
import { defaultMapCategoryId, type MapCategoryId } from "./mapCategories";

type MapRole = "read" | "partial_write" | "full_write";
type ViewportState = { x: number; y: number; zoom: number };

type UseSystemMapBootstrapParams = {
  initialSnapshot?: SystemMapCanvasSnapshot | null;
  isGuestViewer: boolean;
  mapId: string;
  canvasElementSelectColumns: string;
  loadMapMembers: (ownerId?: string | null) => Promise<void>;
  savedPos: MutableRefObject<Record<string, { x: number; y: number }>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setLoadingProgress: Dispatch<SetStateAction<number>>;
  setLoadingMessage: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setUserId: Dispatch<SetStateAction<string | null>>;
  setMapRole: Dispatch<SetStateAction<MapRole | null>>;
  setAccessState: Dispatch<SetStateAction<BillingAccessState | null>>;
  setHasCurrentPassAssignment: Dispatch<SetStateAction<boolean>>;
  setMapMembers: Dispatch<SetStateAction<MapMemberProfileRow[]>>;
  setMap: Dispatch<SetStateAction<SystemMap | null>>;
  setMapTitleDraft: Dispatch<SetStateAction<string>>;
  setMapInfoNameDraft: Dispatch<SetStateAction<string>>;
  setMapInfoDescriptionDraft: Dispatch<SetStateAction<string>>;
  setMapCodeDraft: Dispatch<SetStateAction<string>>;
  setMapCategoryId: Dispatch<SetStateAction<MapCategoryId>>;
  setTypes: Dispatch<SetStateAction<DocumentTypeRow[]>>;
  setNodes: Dispatch<SetStateAction<DocumentNodeRow[]>>;
  setElements: Dispatch<SetStateAction<CanvasElementRow[]>>;
  setRelations: Dispatch<SetStateAction<NodeRelationRow[]>>;
  setAnchorLinks: Dispatch<SetStateAction<AnchorLinkRow[]>>;
  setImageUrlsByElementId: Dispatch<SetStateAction<Record<string, string>>>;
  setHasStoredViewport: Dispatch<SetStateAction<boolean>>;
  setPendingViewport: Dispatch<SetStateAction<ViewportState | null>>;
};

export function useSystemMapBootstrap({
  initialSnapshot,
  isGuestViewer,
  mapId,
  canvasElementSelectColumns,
  loadMapMembers,
  savedPos,
  setLoading,
  setLoadingProgress,
  setLoadingMessage,
  setError,
  setUserId,
  setMapRole,
  setAccessState,
  setHasCurrentPassAssignment,
  setMapMembers,
  setMap,
  setMapTitleDraft,
  setMapInfoNameDraft,
  setMapInfoDescriptionDraft,
  setMapCodeDraft,
  setMapCategoryId,
  setTypes,
  setNodes,
  setElements,
  setRelations,
  setAnchorLinks,
  setImageUrlsByElementId,
  setHasStoredViewport,
  setPendingViewport,
}: UseSystemMapBootstrapParams) {
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const run = async (attempt: number) => {
      const setLoadingStage = (progress: number, message: string) => {
        if (cancelled) return;
        setLoadingProgress((current) => {
          const next = Math.max(current, progress);
          if (next > current) {
            setLoadingMessage(message);
          }
          return next;
        });
      };
      let shouldRetry = false;

      if (cancelled) return;
      if (attempt === 0) {
        setLoading(true);
        setError(null);
        setLoadingStage(25, "Checking workspace access...");
      }
      try {
        if (isGuestViewer) {
          if (!initialSnapshot) {
            setError("Unable to load this map.");
            return;
          }
          setLoadingStage(40, "Loading read-only map...");
          setUserId(null);
          setMapRole("read");
          setAccessState(null);
          setHasCurrentPassAssignment(false);
          setMapMembers([]);
          setMap(initialSnapshot.map);
          setMapTitleDraft(initialSnapshot.map.title);
          setMapInfoNameDraft(initialSnapshot.map.title);
          setMapInfoDescriptionDraft(initialSnapshot.map.description ?? "");
          setMapCodeDraft(initialSnapshot.map.map_code ?? "");
          const nextCategory = (initialSnapshot.map.map_category || defaultMapCategoryId) as MapCategoryId;
          setMapCategoryId(nextCategory);
          setTypes(normalizeTypeRanks(initialSnapshot.types));
          setNodes(initialSnapshot.nodes);
          setElements(initialSnapshot.elements);
          setRelations(initialSnapshot.relations);
          setAnchorLinks(initialSnapshot.anchorLinks ?? []);
          setImageUrlsByElementId(initialSnapshot.imageUrlsByElementId ?? {});
          const nextSaved: Record<string, { x: number; y: number }> = {};
          initialSnapshot.nodes.forEach((node) => {
            nextSaved[node.id] = { x: node.pos_x, y: node.pos_y };
          });
          savedPos.current = nextSaved;
          setHasStoredViewport(false);
          setPendingViewport(null);
          setLoadingStage(100, "Canvas ready.");
          return;
        }
        const user = await ensurePortalSupabaseUser();
        if (cancelled) return;
        if (!user) {
          window.location.assign(`/login?returnTo=${encodeURIComponent(`/system-maps/${mapId}`)}`);
          return;
        }
        setUserId(user.id);
        setLoadingStage(25, "Confirming your account session...");

        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session?.access_token) {
          window.location.assign(`/login?returnTo=${encodeURIComponent(`/system-maps/${mapId}`)}`);
          return;
        }

        setLoadingStage(25, "Checking billing and map permissions...");
        const nextAccessState = await fetchAccessState(session.access_token);
        if (cancelled) return;
        setAccessState(nextAccessState);

        if (accessRequiresSelection(nextAccessState)) {
          window.location.assign("/subscribe");
          return;
        }

        if (accessBlocksInvestigationEntry(nextAccessState)) {
          window.location.assign("/dashboard?mapAccess=blocked");
          return;
        }

        setLoadingStage(50, "Loading map shell, nodes, and canvas data...");
        const [memberRes, mapRes, typeRes, nodeRes, elementRes, relRes, anchorLinkRes, viewRes] = await Promise.all([
          supabaseBrowser.schema("ms").from("map_members").select("role").eq("map_id", mapId).eq("user_id", user.id).maybeSingle(),
          supabaseBrowser.schema("ms").from("system_maps").select("id,title,description,owner_id,updated_by_user_id,map_code,map_category,updated_at,created_at").eq("id", mapId).maybeSingle(),
          supabaseBrowser.schema("ms").from("document_types").select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active").eq("is_active", true).or(`map_id.eq.${mapId},map_id.is.null`).order("level_rank", { ascending: true }),
          supabaseBrowser.schema("ms").from("document_nodes").select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived").eq("map_id", mapId).eq("is_archived", false),
          supabaseBrowser.schema("ms").from("canvas_elements").select(canvasElementSelectColumns).eq("map_id", mapId).order("created_at", { ascending: true }),
          supabaseBrowser
            .schema("ms")
            .from("node_relations")
            .select("*")
            .eq("map_id", mapId),
          supabaseBrowser
            .schema("ms")
            .from("canvas_anchor_links")
            .select("*")
            .eq("map_id", mapId)
            .order("sort_order", { ascending: true }),
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
        if (anchorLinkRes.error) {
          setError(anchorLinkRes.error.message || "Unable to load anchor navigation links.");
          return;
        }

        const loadedMap = mapRes.data as SystemMap;
        const resolvedMapRole =
          loadedMap.owner_id === user.id
            ? "full_write"
            : ((memberRes.data?.role as MapRole | undefined) ?? "read");
        setMapRole(resolvedMapRole);
        setMap(loadedMap);
        const nextCategory = (loadedMap.map_category || defaultMapCategoryId) as MapCategoryId;
        setMapCategoryId(nextCategory);
        setLoadingStage(75, "Loading collaborators and investigation structure...");
        await loadMapMembers(loadedMap.owner_id);
        if (
          nextAccessState.currentAccessStatus === "active" &&
          nextAccessState.currentAccessType === "pass_30d" &&
          nextAccessState.currentAccessPeriodId
        ) {
          const { data: assignment, error: assignmentError } = await supabaseBrowser
            .from("map_access_assignments")
            .select("id")
            .eq("access_period_id", nextAccessState.currentAccessPeriodId)
            .eq("map_id", mapId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (assignmentError) {
            setError(assignmentError.message || "Unable to confirm this map's current access period.");
            return;
          }

          setHasCurrentPassAssignment(Boolean(assignment?.id));
        } else {
          setHasCurrentPassAssignment(true);
        }
        let loadedTypes = (typeRes.data ?? []) as DocumentTypeRow[];
        if (!loadedTypes.length) {
          setLoadingStage(75, "Rebuilding the default investigation structure...");
          const { data: createdTypes, error: createTypesError } = await supabaseBrowser
            .schema("ms")
            .from("document_types")
            .upsert(
              fallbackHierarchy.map((item) => ({
                map_id: mapId,
                name: item.name,
                level_rank: item.level_rank,
                band_y_min: null,
                band_y_max: null,
                is_active: true,
              })),
              {
                onConflict: "map_id,name",
                ignoreDuplicates: true,
              }
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
          setLoadingStage(75, "Filling in any missing structure labels...");
          const { data: insertedMissing, error: insertMissingError } = await supabaseBrowser
            .schema("ms")
            .from("document_types")
            .upsert(
              missingFallback.map((item) => ({
                map_id: mapId,
                name: item.name,
                level_rank: item.level_rank,
                band_y_min: null,
                band_y_max: null,
                is_active: true,
              })),
              {
                onConflict: "map_id,name",
                ignoreDuplicates: true,
              }
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
        setElements((elementRes.data ?? []) as unknown as CanvasElementRow[]);
        setRelations((relRes.data ?? []) as unknown as NodeRelationRow[]);
        setAnchorLinks((anchorLinkRes.data ?? []) as unknown as AnchorLinkRow[]);
        const nextSaved: Record<string, { x: number; y: number }> = {};
        loadedNodes.forEach((n) => (nextSaved[n.id] = { x: n.pos_x, y: n.pos_y }));
        savedPos.current = nextSaved;

        setLoadingStage(75, "Restoring your saved viewport...");
        if (viewRes.data) {
          const viewData = viewRes.data;
          setHasStoredViewport(true);
          setPendingViewport({ x: viewData.pan_x, y: viewData.pan_y, zoom: viewData.zoom });
        } else {
          setHasStoredViewport(false);
        }
        setLoadingStage(100, "Straightening lines and sharpening pencils...");
      } catch (err) {
        if (cancelled) return;
        if (isAbortLikeError(err) && attempt < 3) {
          shouldRetry = true;
          retryTimer = setTimeout(() => {
            void run(attempt + 1);
          }, 250);
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Unable to load map.");
      } finally {
        if (!cancelled && !shouldRetry) {
          setLoadingProgress(100);
          setLoadingMessage("Canvas ready.");
          setLoading(false);
        }
      }
    };

    void run(0);
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [
    canvasElementSelectColumns,
    initialSnapshot,
    isGuestViewer,
    loadMapMembers,
    mapId,
    savedPos,
    setAccessState,
    setElements,
    setError,
    setAnchorLinks,
    setHasCurrentPassAssignment,
    setHasStoredViewport,
    setImageUrlsByElementId,
    setLoading,
    setLoadingMessage,
    setLoadingProgress,
    setMap,
    setMapCategoryId,
    setMapCodeDraft,
    setMapInfoDescriptionDraft,
    setMapInfoNameDraft,
    setMapMembers,
    setMapRole,
    setMapTitleDraft,
    setNodes,
    setPendingViewport,
    setRelations,
    setTypes,
    setUserId,
  ]);
}
