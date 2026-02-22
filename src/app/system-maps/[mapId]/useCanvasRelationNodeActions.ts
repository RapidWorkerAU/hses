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
  incidentRelationshipCategoryOptions,
  orgChartRelationshipCategoryOptions,
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
      if (mapCategoryId !== "incident_investigation") {
        if (mapCategoryId !== "org_chart") {
          return {
            relationship_category: category,
            relationship_custom_type: category === "other" ? customType.trim() || null : null,
          };
        }
        if (category === "other") {
          return {
            relationship_category: "other" as const,
            relationship_custom_type: customType.trim() || null,
          };
        }
        const mappedLabel = orgChartRelationshipCategoryOptions.find((option) => option.value === category)?.label ?? category;
        return {
          relationship_category: "other" as const,
          relationship_custom_type: mappedLabel,
        };
      }

      if (category === "other") {
        return {
          relationship_category: "other" as const,
          relationship_custom_type: customType.trim() || null,
        };
      }

      const mappedLabel =
        incidentRelationshipCategoryOptions.find((option) => option.value === category)?.label ?? category;

      return {
        relationship_category: "other" as const,
        relationship_custom_type: mappedLabel,
      };
    },
    [mapCategoryId]
  );

  const getRelationTypeByKinds = useCallback((sourceKind: string, targetKind: string) => {
    const key = `${sourceKind}->${targetKind}`;
    const table: Record<string, string> = {
      "bowtie_hazard->bowtie_top_event": "contains",
      "bowtie_threat->bowtie_top_event": "leads_to",
      "bowtie_threat->bowtie_control": "controlled_by",
      "bowtie_top_event->bowtie_consequence": "results_in",
      "bowtie_consequence->bowtie_control": "mitigated_by",
      "bowtie_control->bowtie_escalation_factor": "degraded_by",
      "bowtie_escalation_factor->bowtie_control": "managed_by",
      "bowtie_control->bowtie_degradation_indicator": "indicated_by",
      "bowtie_control->person": "owned_by",
    };
    return table[key] || null;
  }, []);

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
    if (hasGroupingSource) {
      if (!hasGroupingTarget) return;
    } else if (hasSystemSource) {
      if (!hasDocumentTarget && !hasSystemTarget) return;
    } else if (!hasDocumentTarget && !hasSystemTarget) {
      return;
    }
    const exists = hasGroupingSource
      ? relations.some(
          (r) =>
            (r.source_grouping_element_id === relationshipSourceGroupingId && r.target_grouping_element_id === relationshipTargetGroupingId) ||
            (r.source_grouping_element_id === relationshipTargetGroupingId && r.target_grouping_element_id === relationshipSourceGroupingId)
        )
      : hasNodeSource
        ? hasDocumentTarget
        ? relations.some(
            (r) =>
              (r.from_node_id === relationshipSourceNodeId && r.to_node_id === relationshipTargetDocumentId) ||
              (r.from_node_id === relationshipTargetDocumentId && r.to_node_id === relationshipSourceNodeId)
          )
        : relations.some(
            (r) =>
              r.from_node_id === relationshipSourceNodeId &&
              r.target_system_element_id === relationshipTargetSystemId
          )
        : hasDocumentTarget
          ? relations.some(
              (r) =>
                (r.source_system_element_id === relationshipSourceSystemId && r.to_node_id === relationshipTargetDocumentId) ||
                (r.from_node_id === relationshipTargetDocumentId && r.target_system_element_id === relationshipSourceSystemId)
            )
          : relations.some(
              (r) =>
                (r.source_system_element_id === relationshipSourceSystemId && r.target_system_element_id === relationshipTargetSystemId) ||
                (r.source_system_element_id === relationshipTargetSystemId && r.target_system_element_id === relationshipSourceSystemId)
            );
    if (exists) {
      setError("Relationship already exists for this target.");
      return;
    }
    const sourceElement = hasSystemSource ? elements.find((el) => el.id === relationshipSourceSystemId) : null;
    const targetElement = hasSystemTarget ? elements.find((el) => el.id === relationshipTargetSystemId) : null;
    const sourceKind = hasNodeSource ? "document" : sourceElement?.element_type || (hasGroupingSource ? "grouping_container" : "");
    const targetKind = hasDocumentTarget ? "document" : targetElement?.element_type || (hasGroupingTarget ? "grouping_container" : "");
    const bowTieRelationType = getRelationTypeByKinds(sourceKind, targetKind);
    const isImageRelation = sourceKind === "image_asset" || targetKind === "image_asset";
    if (mapCategoryId === "bow_tie") {
      if (!bowTieRelationType && !isImageRelation) {
        setError("This relationship is not allowed in Bow Tie maps.");
        return;
      }
    }
    if (mapCategoryId === "org_chart") {
      if (hasNodeSource || hasGroupingSource || hasDocumentTarget || !hasSystemSource || !hasSystemTarget) {
        setError("Org Chart relationships must be person-to-person.");
        return;
      }
      if (sourceElement?.element_type !== "person" || targetElement?.element_type !== "person") {
        setError("Only person nodes can be linked in Org Chart maps.");
        return;
      }
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
        target_grouping_element_id: hasGroupingSource && hasGroupingTarget ? relationshipTargetGroupingId : null,
        target_system_element_id: hasSystemTarget ? relationshipTargetSystemId : null,
        relation_type: mapCategoryId === "bow_tie" ? (bowTieRelationType || "related") : mapCategoryId === "org_chart" ? "reports_to" : "related",
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
    getRelationTypeByKinds,
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
    if (mapCategoryId === "org_chart") {
      const current = relations.find((r) => r.id === id);
      if (!current || !current.source_system_element_id || !current.target_system_element_id) {
        setError("Org Chart relationships must be person-to-person.");
        return;
      }
      const sourcePerson = elements.find((el) => el.id === current.source_system_element_id)?.element_type === "person";
      const targetPerson = elements.find((el) => el.id === current.target_system_element_id)?.element_type === "person";
      if (!sourcePerson || !targetPerson) {
        setError("Only person nodes can be linked in Org Chart maps.");
        return;
      }
    }
    const persistedRelationship = getRelationshipPersistenceFields(editingRelationCategory, editingRelationCustomType);
    const updatePayload: Record<string, unknown> = {
      relationship_description: editingRelationDescription.trim() || null,
      relationship_category: persistedRelationship.relationship_category,
      relationship_custom_type: persistedRelationship.relationship_custom_type,
      relationship_disciplines: editingRelationDisciplines.length ? editingRelationDisciplines : null,
    };
    if (mapCategoryId === "org_chart") updatePayload.relation_type = "reports_to";
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
    elements,
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

  const handleSaveNode = useCallback(async () => {
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
    setSelectedNodeId(null);
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
