"use client";

import { useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type {
  DisciplineKey,
  DocumentNodeRow,
  NodeRelationRow,
  RelationshipCategory,
  DocumentTypeRow,
  CanvasElementRow,
} from "./canvasShared";
import {
  getDefaultRelationshipCategoryForMap,
  getRelationshipCategoryLabel,
} from "./canvasShared";
import type { MapCategoryId } from "./mapCategories";

type UseCanvasRelationNodeActionsParams = {
  canWriteMap: boolean;
  mapCategoryId: MapCategoryId;
  mapId: string;
  setError: (value: string | null) => void;
  relations: NodeRelationRow[];
  elements: CanvasElementRow[];
  relationshipSourceNodeId: string | null;
  relationshipSourceSystemId: string | null;
  relationshipSourceGroupingId: string | null;
  relationshipTargetGroupingId: string;
  relationshipTargetDocumentId: string;
  relationshipTargetSystemId: string;
  relationshipDescription: string;
  relationshipDisciplineSelection: DisciplineKey[];
  relationshipCategory: RelationshipCategory;
  relationshipCustomType: string;
  closeAddRelationshipModal: () => void;
  setRelations: React.Dispatch<React.SetStateAction<NodeRelationRow[]>>;
  editingRelationCategory: RelationshipCategory;
  editingRelationCustomType: string;
  editingRelationDescription: string;
  editingRelationDisciplines: DisciplineKey[];
  setEditingRelationId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingRelationDescription: React.Dispatch<React.SetStateAction<string>>;
  setEditingRelationCategory: React.Dispatch<React.SetStateAction<RelationshipCategory>>;
  setEditingRelationCustomType: React.Dispatch<React.SetStateAction<string>>;
  setEditingRelationDisciplines: React.Dispatch<React.SetStateAction<DisciplineKey[]>>;
  setShowEditingRelationDisciplineMenu: React.Dispatch<React.SetStateAction<boolean>>;
  selectedNodeId: string | null;
  nodes: DocumentNodeRow[];
  selectedTypeId: string;
  typesById: Map<string, DocumentTypeRow>;
  title: string;
  documentNumber: string;
  disciplineSelection: DisciplineKey[];
  userGroup: string;
  ownerName: string;
  isLandscapeTypeName: (name: string) => boolean;
  getNodeSize: (row: DocumentNodeRow) => { width: number; height: number };
  getNormalizedDocumentSize: (isLandscape: boolean, width: number, height: number) => { width: number; height: number };
  serializeDisciplines: (keys: DisciplineKey[]) => string | null;
  setNodes: React.Dispatch<React.SetStateAction<DocumentNodeRow[]>>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedFlowIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  outlineNodeId: string | null;
  setOutlineNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setOutlineItems: React.Dispatch<React.SetStateAction<any[]>>;
};

export function useCanvasRelationNodeActions({
  canWriteMap,
  mapCategoryId,
  mapId,
  setError,
  relations,
  elements,
  relationshipSourceNodeId,
  relationshipSourceSystemId,
  relationshipSourceGroupingId,
  relationshipTargetGroupingId,
  relationshipTargetDocumentId,
  relationshipTargetSystemId,
  relationshipDescription,
  relationshipDisciplineSelection,
  relationshipCategory,
  relationshipCustomType,
  closeAddRelationshipModal,
  setRelations,
  editingRelationCategory,
  editingRelationCustomType,
  editingRelationDescription,
  editingRelationDisciplines,
  setEditingRelationId,
  setEditingRelationDescription,
  setEditingRelationCategory,
  setEditingRelationCustomType,
  setEditingRelationDisciplines,
  setShowEditingRelationDisciplineMenu,
  selectedNodeId,
  nodes,
  selectedTypeId,
  typesById,
  title,
  documentNumber,
  disciplineSelection,
  userGroup,
  ownerName,
  isLandscapeTypeName,
  getNodeSize,
  getNormalizedDocumentSize,
  serializeDisciplines,
  setNodes,
  setSelectedNodeId,
  setSelectedFlowIds,
  outlineNodeId,
  setOutlineNodeId,
  setOutlineItems,
}: UseCanvasRelationNodeActionsParams) {
  const getRelationshipPersistenceFields = useCallback(
    (category: RelationshipCategory, customType: string) => {
      const directCategories = new Set<RelationshipCategory>([
        "information",
        "systems",
        "process",
        "data",
        "leads_to",
        "contributes_to",
        "evidence_for",
        "barrier_for",
        "recommends",
        "reports_to",
        "other",
      ]);
      if (category === "other") {
        return {
          relationship_category: "other" as const,
          relationship_custom_type: customType.trim() || null,
        };
      }
      if (directCategories.has(category)) {
        return {
          relationship_category: category,
          relationship_custom_type: null,
        };
      }
      return {
        relationship_category: "other" as const,
        relationship_custom_type: getRelationshipCategoryLabel(category, null),
      };
    },
    []
  );

  const handleAddRelation = useCallback(async () => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    const hasNodeSource = !!relationshipSourceNodeId;
    const hasSystemSource = !!relationshipSourceSystemId;
    const hasGroupingSource = !!relationshipSourceGroupingId;
    if (!hasNodeSource && !hasSystemSource && !hasGroupingSource) return;
    const hasGroupingTarget = !!relationshipTargetGroupingId;
    const hasDocumentTarget = !!relationshipTargetDocumentId;
    const hasSystemTarget = !!relationshipTargetSystemId;
    if (!hasGroupingTarget && !hasDocumentTarget && !hasSystemTarget) {
      return;
    }
    const sourceEndpoint = hasNodeSource
      ? { kind: "document" as const, id: relationshipSourceNodeId }
      : hasSystemSource
      ? { kind: "system" as const, id: relationshipSourceSystemId }
      : { kind: "grouping" as const, id: relationshipSourceGroupingId };
    const targetEndpoint = hasDocumentTarget
      ? { kind: "document" as const, id: relationshipTargetDocumentId }
      : hasSystemTarget
      ? { kind: "system" as const, id: relationshipTargetSystemId }
      : { kind: "grouping" as const, id: relationshipTargetGroupingId };
    const rowHasEndpoint = (
      row: NodeRelationRow,
      endpoint: { kind: "document" | "system" | "grouping"; id: string | null }
    ) => {
      if (!endpoint.id) return false;
      if (endpoint.kind === "document") return row.from_node_id === endpoint.id || row.to_node_id === endpoint.id;
      if (endpoint.kind === "system") return row.source_system_element_id === endpoint.id || row.target_system_element_id === endpoint.id;
      return row.source_grouping_element_id === endpoint.id || row.target_grouping_element_id === endpoint.id;
    };
    const exists = relations.some((row) => rowHasEndpoint(row, sourceEndpoint) && rowHasEndpoint(row, targetEndpoint));
    if (exists) {
      setError("Relationship already exists for this target.");
      return;
    }
    const persistedRelationship = getRelationshipPersistenceFields(relationshipCategory, relationshipCustomType);
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("node_relations")
      .insert({
        map_id: mapId,
        from_node_id: hasNodeSource ? relationshipSourceNodeId : null,
        source_system_element_id: hasSystemSource ? relationshipSourceSystemId : null,
        to_node_id: hasDocumentTarget ? relationshipTargetDocumentId : null,
        source_grouping_element_id: hasGroupingSource ? relationshipSourceGroupingId : null,
        target_grouping_element_id: hasGroupingTarget ? relationshipTargetGroupingId : null,
        target_system_element_id: hasSystemTarget ? relationshipTargetSystemId : null,
        relation_type: "related",
        relationship_description: relationshipDescription.trim() || null,
        relationship_disciplines: relationshipDisciplineSelection.length ? relationshipDisciplineSelection : null,
        relationship_category: persistedRelationship.relationship_category,
        relationship_custom_type: persistedRelationship.relationship_custom_type,
      })
      .select("*")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to add relation.");
      return;
    }
    setRelations((prev) => [...prev, data as NodeRelationRow]);
    closeAddRelationshipModal();
  }, [
    canWriteMap,
    closeAddRelationshipModal,
    mapId,
    mapCategoryId,
    relations,
    elements,
    relationshipCategory,
    relationshipCustomType,
    relationshipDescription,
    relationshipDisciplineSelection,
    relationshipSourceGroupingId,
    relationshipSourceNodeId,
    relationshipSourceSystemId,
    relationshipTargetDocumentId,
    relationshipTargetGroupingId,
    relationshipTargetSystemId,
    getRelationshipPersistenceFields,
    setError,
    setRelations,
  ]);

  const handleDeleteRelation = useCallback(async (id: string) => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    const { error: e } = await supabaseBrowser.schema("ms").from("node_relations").delete().eq("id", id).eq("map_id", mapId);
    if (e) {
      setError(e.message || "Unable to delete relation.");
      return;
    }
    setRelations((prev) => prev.filter((r) => r.id !== id));
  }, [canWriteMap, mapId, setError, setRelations]);

  const handleUpdateRelation = useCallback(async (id: string) => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    if (editingRelationCategory === "other" && !editingRelationCustomType.trim()) {
      setError("Please enter a custom relationship type.");
      return;
    }
    const persistedRelationship = getRelationshipPersistenceFields(editingRelationCategory, editingRelationCustomType);
    const updatePayload: Record<string, unknown> = {
      relationship_description: editingRelationDescription.trim() || null,
      relationship_category: persistedRelationship.relationship_category,
      relationship_custom_type: persistedRelationship.relationship_custom_type,
      relationship_disciplines: editingRelationDisciplines.length ? editingRelationDisciplines : null,
    };
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("node_relations")
      .update(updatePayload)
      .eq("id", id)
      .eq("map_id", mapId)
      .select("*")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to update relationship definition.");
      return;
    }
    setRelations((prev) => prev.map((r) => (r.id === id ? (data as NodeRelationRow) : r)));
    setEditingRelationId(null);
    setEditingRelationDescription("");
    setEditingRelationCategory(getDefaultRelationshipCategoryForMap(mapCategoryId));
    setEditingRelationCustomType("");
    setEditingRelationDisciplines([]);
    setShowEditingRelationDisciplineMenu(false);
  }, [
    canWriteMap,
    editingRelationCategory,
    editingRelationCustomType,
    editingRelationDescription,
    editingRelationDisciplines,
    mapId,
    mapCategoryId,
    relations,
    getRelationshipPersistenceFields,
    setEditingRelationCategory,
    setEditingRelationCustomType,
    setEditingRelationDescription,
    setEditingRelationDisciplines,
    setEditingRelationId,
    setError,
    setRelations,
    setShowEditingRelationDisciplineMenu,
  ]);

  const handleDeleteNode = useCallback(async (id: string) => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    const { error: e } = await supabaseBrowser.schema("ms").from("document_nodes").delete().eq("id", id).eq("map_id", mapId);
    if (e) {
      setError(e.message || "Unable to delete document.");
      return;
    }
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setRelations((prev) => prev.filter((r) => r.from_node_id !== id && r.to_node_id !== id));
    setSelectedFlowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
    if (outlineNodeId === id) {
      setOutlineNodeId(null);
      setOutlineItems([]);
    }
  }, [
    canWriteMap,
    mapId,
    outlineNodeId,
    selectedNodeId,
    setError,
    setNodes,
    setOutlineItems,
    setOutlineNodeId,
    setRelations,
    setSelectedFlowIds,
    setSelectedNodeId,
  ]);

  const handleSaveNode = useCallback(async (options?: { closeAfterSave?: boolean }) => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
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
      document_number: documentNumber.trim() || null,
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
      .select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to save node properties.");
      return;
    }
    const updated = data as DocumentNodeRow;
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    if (options?.closeAfterSave !== false) setSelectedNodeId(null);
  }, [
    canWriteMap,
    disciplineSelection,
    documentNumber,
    getNodeSize,
    getNormalizedDocumentSize,
    isLandscapeTypeName,
    mapId,
    nodes,
    ownerName,
    selectedNodeId,
    selectedTypeId,
    serializeDisciplines,
    setError,
    setNodes,
    setSelectedNodeId,
    title,
    typesById,
    userGroup,
  ]);

  return {
    handleAddRelation,
    handleDeleteRelation,
    handleUpdateRelation,
    handleDeleteNode,
    handleSaveNode,
  };
}
