"use client";

import { useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { CanvasElementRow, NodeRelationRow } from "./canvasShared";

type UseCanvasDeleteSelectionActionsParams = {
  canWriteMap: boolean;
  canEditElement: (el: CanvasElementRow) => boolean;
  mapId: string;
  elements: CanvasElementRow[];
  setError: (value: string | null) => void;
  setElements: React.Dispatch<React.SetStateAction<CanvasElementRow[]>>;
  setRelations: React.Dispatch<React.SetStateAction<NodeRelationRow[]>>;
  setSelectedFlowIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  processFlowId: (id: string) => string;
  parseProcessFlowId: (id: string) => string;
  selectedProcessId: string | null;
  setSelectedProcessId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedSystemId: string | null;
  setSelectedSystemId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedProcessComponentId: string | null;
  setSelectedProcessComponentId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedPersonId: string | null;
  setSelectedPersonId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedGroupingId: string | null;
  setSelectedGroupingId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedStickyId: string | null;
  setSelectedStickyId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedFlowIds: Set<string>;
  handleDeleteNode: (id: string) => Promise<void>;
  setShowDeleteSelectionConfirm: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useCanvasDeleteSelectionActions({
  canWriteMap,
  canEditElement,
  mapId,
  elements,
  setError,
  setElements,
  setRelations,
  setSelectedFlowIds,
  processFlowId,
  parseProcessFlowId,
  selectedProcessId,
  setSelectedProcessId,
  selectedSystemId,
  setSelectedSystemId,
  selectedProcessComponentId,
  setSelectedProcessComponentId,
  selectedPersonId,
  setSelectedPersonId,
  selectedGroupingId,
  setSelectedGroupingId,
  selectedStickyId,
  setSelectedStickyId,
  selectedFlowIds,
  handleDeleteNode,
  setShowDeleteSelectionConfirm,
}: UseCanvasDeleteSelectionActionsParams) {
  const handleDeleteProcessElement = useCallback(async (id: string) => {
    const target = elements.find((el) => el.id === id);
    if (!target || !canEditElement(target)) {
      setError("You do not have permission to delete this component.");
      return;
    }
    const relationDeleteAttempt = await supabaseBrowser
      .schema("ms")
      .from("node_relations")
      .delete()
      .eq("map_id", mapId)
      .or(`source_system_element_id.eq.${id},target_system_element_id.eq.${id},source_grouping_element_id.eq.${id},target_grouping_element_id.eq.${id}`);
    if (relationDeleteAttempt.error) {
      await supabaseBrowser
        .schema("ms")
        .from("node_relations")
        .delete()
        .eq("map_id", mapId)
        .or(`target_system_element_id.eq.${id},source_grouping_element_id.eq.${id},target_grouping_element_id.eq.${id}`);
    }
    const { error: e } = await supabaseBrowser.schema("ms").from("canvas_elements").delete().eq("id", id).eq("map_id", mapId);
    if (e) {
      setError(e.message || "Unable to delete canvas element.");
      return;
    }
    setElements((prev) => prev.filter((el) => el.id !== id));
    setRelations((prev) =>
      prev.filter(
        (r) =>
          r.source_system_element_id !== id &&
          r.target_system_element_id !== id &&
          r.source_grouping_element_id !== id &&
          r.target_grouping_element_id !== id
      )
    );
    setSelectedFlowIds((prev) => {
      const next = new Set(prev);
      next.delete(processFlowId(id));
      return next;
    });
    if (selectedProcessId === id) setSelectedProcessId(null);
    if (selectedSystemId === id) setSelectedSystemId(null);
    if (selectedProcessComponentId === id) setSelectedProcessComponentId(null);
    if (selectedPersonId === id) setSelectedPersonId(null);
    if (selectedGroupingId === id) setSelectedGroupingId(null);
    if (selectedStickyId === id) setSelectedStickyId(null);
  }, [
    canEditElement,
    elements,
    mapId,
    processFlowId,
    selectedGroupingId,
    selectedPersonId,
    selectedProcessComponentId,
    selectedProcessId,
    selectedStickyId,
    selectedSystemId,
    setElements,
    setError,
    setRelations,
    setSelectedFlowIds,
    setSelectedGroupingId,
    setSelectedPersonId,
    setSelectedProcessComponentId,
    setSelectedProcessId,
    setSelectedStickyId,
    setSelectedSystemId,
  ]);

  const handleDeleteSelectedComponents = useCallback(async () => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    if (!selectedFlowIds.size) return;
    const selectedIds = [...selectedFlowIds];
    const docIds = selectedIds.filter((id) => !id.startsWith("process:"));
    const elementIds = selectedIds.filter((id) => id.startsWith("process:")).map(parseProcessFlowId);
    for (const docId of docIds) {
      await handleDeleteNode(docId);
    }
    for (const elementId of elementIds) {
      await handleDeleteProcessElement(elementId);
    }
    setSelectedFlowIds(new Set());
    setShowDeleteSelectionConfirm(false);
  }, [canWriteMap, selectedFlowIds, parseProcessFlowId, handleDeleteNode, handleDeleteProcessElement, setSelectedFlowIds, setShowDeleteSelectionConfirm, setError]);

  return { handleDeleteProcessElement, handleDeleteSelectedComponents };
}
