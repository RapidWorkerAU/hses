import { useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { SystemMap } from "./canvasShared";

type MapRole = "read" | "partial_write" | "full_write";

type Params = {
  canManageMapMetadata: boolean;
  map: SystemMap | null;
  mapTitleDraft: string;
  mapInfoNameDraft: string;
  mapInfoDescriptionDraft: string;
  mapCodeDraft: string;
  loadMapMembers: (ownerId?: string | null) => Promise<void>;
  setError: (value: string | null) => void;
  setSavingMapTitle: (value: boolean) => void;
  setSavingMapInfo: (value: boolean) => void;
  setSavingMemberRoleUserId: (value: string | null) => void;
  setMap: (value: SystemMap | null) => void;
  setMapTitleDraft: (value: string) => void;
  setIsEditingMapTitle: (value: boolean) => void;
  setMapTitleSavedFlash: (value: boolean) => void;
  setShowMapInfoAside: (value: boolean) => void;
  setIsEditingMapInfo: (value: boolean) => void;
  setMapInfoNameDraft: (value: string) => void;
  setMapInfoDescriptionDraft: (value: string) => void;
  setMapCodeDraft: (value: string) => void;
};

export function useCanvasMapInfoActions({
  canManageMapMetadata,
  map,
  mapTitleDraft,
  mapInfoNameDraft,
  mapInfoDescriptionDraft,
  mapCodeDraft,
  loadMapMembers,
  setError,
  setSavingMapTitle,
  setSavingMapInfo,
  setSavingMemberRoleUserId,
  setMap,
  setMapTitleDraft,
  setIsEditingMapTitle,
  setMapTitleSavedFlash,
  setShowMapInfoAside,
  setIsEditingMapInfo,
  setMapInfoNameDraft,
  setMapInfoDescriptionDraft,
  setMapCodeDraft,
}: Params) {
  const flashSavedTitle = useCallback(() => {
    setMapTitleSavedFlash(true);
    setTimeout(() => setMapTitleSavedFlash(false), 1200);
  }, [setMapTitleSavedFlash]);

  const handleSaveMapTitle = useCallback(async () => {
    if (!canManageMapMetadata) {
      setError("Only the map owner can rename this map.");
      return;
    }
    const nextTitle = mapTitleDraft.trim();
    if (!map || !nextTitle) return;
    setSavingMapTitle(true);
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("system_maps")
      .update({ title: nextTitle })
      .eq("id", map.id)
      .select("id,title,description,owner_id,map_code,updated_at,created_at")
      .maybeSingle();
    setSavingMapTitle(false);
    if (e || !data) {
      setError(e?.message || "Unable to save map title.");
      return;
    }
    setMap(data as SystemMap);
    setIsEditingMapTitle(false);
    flashSavedTitle();
  }, [
    canManageMapMetadata,
    mapTitleDraft,
    map,
    setSavingMapTitle,
    setError,
    setMap,
    setIsEditingMapTitle,
    flashSavedTitle,
  ]);

  const handleCloseMapInfoAside = useCallback(() => {
    setShowMapInfoAside(false);
    setIsEditingMapInfo(false);
    if (map) {
      setMapInfoNameDraft(map.title);
      setMapInfoDescriptionDraft(map.description ?? "");
      setMapCodeDraft(map.map_code ?? "");
    }
  }, [
    setShowMapInfoAside,
    setIsEditingMapInfo,
    map,
    setMapInfoNameDraft,
    setMapInfoDescriptionDraft,
    setMapCodeDraft,
  ]);

  const handleSaveMapInfo = useCallback(async () => {
    if (!canManageMapMetadata) {
      setError("Only the map owner can edit map details.");
      return;
    }
    if (!map) return;
    const nextTitle = mapInfoNameDraft.trim();
    const nextMapCode = mapCodeDraft.trim().toUpperCase();
    if (!nextTitle) return;
    if (!nextMapCode) {
      setError("Map code cannot be blank.");
      return;
    }
    setSavingMapInfo(true);
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("system_maps")
      .update({ title: nextTitle, description: mapInfoDescriptionDraft.trim() || null, map_code: nextMapCode })
      .eq("id", map.id)
      .select("id,title,description,owner_id,map_code,updated_at,created_at")
      .maybeSingle();
    if (e || !data) {
      setSavingMapInfo(false);
      setError(e?.message || "Unable to save map information.");
      return;
    }
    const mapCodeChanged = (map.map_code ?? "").trim().toUpperCase() !== nextMapCode;
    if (mapCodeChanged) {
      const { error: revokeError } = await supabaseBrowser
        .schema("ms")
        .from("map_members")
        .delete()
        .eq("map_id", map.id)
        .neq("user_id", map.owner_id);
      if (revokeError) {
        setSavingMapInfo(false);
        setError(revokeError.message || "Map saved, but member access could not be reset.");
        return;
      }
      const { error: ownerUpsertError } = await supabaseBrowser
        .schema("ms")
        .from("map_members")
        .upsert(
          { map_id: map.id, user_id: map.owner_id, role: "full_write" },
          { onConflict: "map_id,user_id" }
        );
      if (ownerUpsertError) {
        setSavingMapInfo(false);
        setError(ownerUpsertError.message || "Map saved, but owner access could not be confirmed.");
        return;
      }
    }
    setSavingMapInfo(false);
    setMap(data as SystemMap);
    setMapTitleDraft((data as SystemMap).title);
    flashSavedTitle();
    setIsEditingMapInfo(false);
    await loadMapMembers((data as SystemMap).owner_id);
  }, [
    canManageMapMetadata,
    setError,
    map,
    mapInfoNameDraft,
    mapCodeDraft,
    setSavingMapInfo,
    mapInfoDescriptionDraft,
    setMap,
    setMapTitleDraft,
    flashSavedTitle,
    setIsEditingMapInfo,
    loadMapMembers,
  ]);

  const handleUpdateMapMemberRole = useCallback(
    async (targetUserId: string, nextRole: MapRole) => {
      if (!canManageMapMetadata || !map) {
        setError("Only the map owner can change access.");
        return;
      }
      if (targetUserId === map.owner_id) return;
      setSavingMemberRoleUserId(targetUserId);
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("map_members")
        .update({ role: nextRole })
        .eq("map_id", map.id)
        .eq("user_id", targetUserId);
      setSavingMemberRoleUserId(null);
      if (e) {
        setError(e.message || "Unable to update member access.");
        return;
      }
      await loadMapMembers(map.owner_id);
    },
    [canManageMapMetadata, map, setError, setSavingMemberRoleUserId, loadMapMembers]
  );

  return {
    handleSaveMapTitle,
    handleCloseMapInfoAside,
    handleSaveMapInfo,
    handleUpdateMapMemberRole,
  };
}
