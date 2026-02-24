import { useCallback, useMemo } from "react";
import type { CanvasElementRow, DisciplineKey, DocumentNodeRow, NodeRelationRow } from "./canvasShared";
import type { MapCategoryId } from "./mapCategories";
import {
  disciplineSummary,
  getElementDisplayName,
  getElementRelationshipDisplayLabel,
  getElementRelationshipTypeLabel,
} from "./canvasShared";

type Params = {
  relations: NodeRelationRow[];
  selectedNodeId: string | null;
  selectedGroupingId: string | null;
  selectedSystemId: string | null;
  selectedProcessComponentId: string | null;
  selectedPersonId: string | null;
  relationshipSourceNodeId: string | null;
  relationshipSourceSystemId: string | null;
  relationshipSourceGroupingId: string | null;
  relationshipDocumentQuery: string;
  relationshipSystemQuery: string;
  relationshipGroupingQuery: string;
  nodes: DocumentNodeRow[];
  elements: CanvasElementRow[];
  mapCategoryId: MapCategoryId;
};

export function useCanvasRelationshipDerived({
  relations,
  selectedNodeId,
  selectedGroupingId,
  selectedSystemId,
  selectedProcessComponentId,
  selectedPersonId,
  relationshipSourceNodeId,
  relationshipSourceSystemId,
  relationshipSourceGroupingId,
  relationshipDocumentQuery,
  relationshipSystemQuery,
  relationshipGroupingQuery,
  nodes,
  elements,
  mapCategoryId,
}: Params) {
  const relationshipSourceKind = useMemo(() => {
    if (relationshipSourceNodeId) return "document";
    if (relationshipSourceGroupingId) return "grouping_container";
    if (relationshipSourceSystemId) {
      return elements.find((el) => el.id === relationshipSourceSystemId)?.element_type || "";
    }
    return "";
  }, [relationshipSourceNodeId, relationshipSourceGroupingId, relationshipSourceSystemId, elements]);

  const bowtieAllowedTargetsBySource = useMemo(() => {
    const bySource: Record<string, string[]> = {
      bowtie_hazard: ["bowtie_top_event"],
      bowtie_threat: ["bowtie_top_event", "bowtie_control"],
      bowtie_top_event: ["bowtie_consequence"],
      bowtie_consequence: ["bowtie_control"],
      bowtie_control: ["bowtie_escalation_factor", "bowtie_degradation_indicator", "person"],
      bowtie_escalation_factor: ["bowtie_control"],
    };
    return bySource;
  }, []);

  const allowDocumentTargets = useMemo(() => {
    if (relationshipSourceGroupingId) return false;
    if (mapCategoryId === "org_chart") return false;
    if (mapCategoryId !== "bow_tie") return true;
    if (relationshipSourceKind === "image_asset") return true;
    return (bowtieAllowedTargetsBySource[relationshipSourceKind] ?? []).includes("document");
  }, [mapCategoryId, relationshipSourceGroupingId, bowtieAllowedTargetsBySource, relationshipSourceKind]);

  const allowSystemTargets = useMemo(() => {
    if (relationshipSourceGroupingId) return false;
    if (mapCategoryId === "org_chart") return relationshipSourceKind === "person";
    if (mapCategoryId !== "bow_tie") return true;
    if (relationshipSourceKind === "image_asset") return true;
    return (bowtieAllowedTargetsBySource[relationshipSourceKind] ?? []).length > 0;
  }, [mapCategoryId, relationshipSourceGroupingId, bowtieAllowedTargetsBySource, relationshipSourceKind]);

  const relatedRows = useMemo(() => {
    if (!selectedNodeId) return [];
    return relations.filter((r) => r.from_node_id === selectedNodeId || r.to_node_id === selectedNodeId);
  }, [relations, selectedNodeId]);

  const relatedGroupingRows = useMemo(() => {
    if (!selectedGroupingId) return [];
    return relations.filter(
      (r) => r.source_grouping_element_id === selectedGroupingId || r.target_grouping_element_id === selectedGroupingId
    );
  }, [relations, selectedGroupingId]);

  const relatedPersonRows = useMemo(() => {
    if (!selectedPersonId) return [];
    return relations.filter((r) => {
      const isLinked = r.target_system_element_id === selectedPersonId || r.source_system_element_id === selectedPersonId;
      if (!isLinked) return false;
      if (mapCategoryId !== "org_chart") return true;
      return String(r.relation_type ?? "").trim().toLowerCase() === "reports_to";
    });
  }, [relations, selectedPersonId, mapCategoryId]);

  const relatedSystemRows = useMemo(() => {
    if (!selectedSystemId) return [];
    return relations.filter((r) => r.target_system_element_id === selectedSystemId || r.source_system_element_id === selectedSystemId);
  }, [relations, selectedSystemId]);

  const relatedProcessComponentRows = useMemo(() => {
    if (!selectedProcessComponentId) return [];
    return relations.filter((r) => r.target_system_element_id === selectedProcessComponentId || r.source_system_element_id === selectedProcessComponentId);
  }, [relations, selectedProcessComponentId]);

  const resolvePersonRelationLabels = useCallback(
    (r: NodeRelationRow) => {
      const fromNode = nodes.find((n) => n.id === r.from_node_id) ?? null;
      const fromSystem = r.source_system_element_id
        ? elements.find((el) => el.id === r.source_system_element_id && el.element_type !== "grouping_container") ?? null
        : null;
      const toNode = r.to_node_id ? nodes.find((n) => n.id === r.to_node_id) ?? null : null;
      const toSystem = r.target_system_element_id
        ? elements.find((el) => el.id === r.target_system_element_id && el.element_type !== "grouping_container") ?? null
        : null;
      return {
        sourceLabel: fromNode?.title || (fromSystem ? getElementDisplayName(fromSystem) : null) || "Unknown source",
        targetLabel: toNode?.title || (toSystem ? getElementDisplayName(toSystem) : null) || "Unknown destination",
        targetType: toNode ? "Document" : toSystem ? getElementRelationshipTypeLabel(toSystem.element_type) : "Component",
      };
    },
    [nodes, elements]
  );

  const resolveGroupingRelationLabels = useCallback(
    (r: NodeRelationRow) => {
      const sourceGrouping = r.source_grouping_element_id
        ? elements.find((el) => el.id === r.source_grouping_element_id && el.element_type === "grouping_container")
        : null;
      const targetGrouping = r.target_grouping_element_id
        ? elements.find((el) => el.id === r.target_grouping_element_id && el.element_type === "grouping_container")
        : null;
      return {
        sourceLabel: sourceGrouping?.heading || "Unknown grouping container",
        targetLabel: targetGrouping?.heading || "Unknown grouping container",
        targetType: "Grouping Container",
      };
    },
    [elements]
  );

  const resolveDocumentRelationLabels = useCallback(
    (r: NodeRelationRow) => {
      const fromNode = nodes.find((n) => n.id === r.from_node_id) ?? null;
      const fromSystem = r.source_system_element_id
        ? elements.find((el) => el.id === r.source_system_element_id && el.element_type !== "grouping_container") ?? null
        : null;
      const toNode = r.to_node_id ? nodes.find((n) => n.id === r.to_node_id) ?? null : null;
      const toSystem = r.target_system_element_id
        ? elements.find((el) => el.id === r.target_system_element_id && el.element_type !== "grouping_container") ?? null
        : null;
      return {
        sourceLabel: fromNode?.title || (fromSystem ? getElementDisplayName(fromSystem) : null) || "Unknown document",
        targetLabel: toNode?.title || (toSystem ? getElementDisplayName(toSystem) : null) || "Unknown destination",
        targetType: toNode ? "Document" : toSystem ? getElementRelationshipTypeLabel(toSystem.element_type) : "Component",
      };
    },
    [nodes, elements]
  );

  const mobileRelatedItems = useMemo(() => {
    if (!selectedNodeId) return [];
    return relatedRows.map((r) => {
      const labels = resolveDocumentRelationLabels(r);
      const isSource = r.from_node_id === selectedNodeId;
      return {
        id: r.id,
        label: isSource ? labels.targetLabel : labels.sourceLabel,
        type: isSource ? labels.targetType : "Document",
      };
    });
  }, [relatedRows, resolveDocumentRelationLabels, selectedNodeId]);

  const relationshipSourceNode = useMemo(
    () => (relationshipSourceNodeId ? nodes.find((n) => n.id === relationshipSourceNodeId) ?? null : null),
    [nodes, relationshipSourceNodeId]
  );
  const relationshipSourceSystem = useMemo(
    () =>
      relationshipSourceSystemId
        ? elements.find((el) => el.id === relationshipSourceSystemId && el.element_type !== "grouping_container") ?? null
        : null,
    [elements, relationshipSourceSystemId]
  );
  const relationshipSourceGrouping = useMemo(
    () =>
      relationshipSourceGroupingId
        ? elements.find((el) => el.id === relationshipSourceGroupingId && el.element_type === "grouping_container") ?? null
        : null,
    [elements, relationshipSourceGroupingId]
  );
  const relationshipModeGrouping = !!relationshipSourceGroupingId;

  const documentRelationCandidates = useMemo(() => {
    if (!relationshipSourceNodeId && !relationshipSourceSystemId) return [];
    if (!allowDocumentTargets) return [];
    const term = relationshipDocumentQuery.trim().toLowerCase();
    return nodes
      .filter((n) => n.id !== relationshipSourceNodeId)
      .filter((n) => n.title.toLowerCase().includes(term));
  }, [nodes, relationshipSourceNodeId, relationshipSourceSystemId, relationshipDocumentQuery, allowDocumentTargets]);

  const documentRelationCandidateLabelById = useMemo(() => {
    const m = new Map<string, string>();
    documentRelationCandidates.forEach((n) => m.set(n.id, `${n.title} (${disciplineSummary(n.discipline)})`));
    return m;
  }, [documentRelationCandidates]);

  const documentRelationCandidateIdByLabel = useMemo(() => {
    const m = new Map<string, string>();
    documentRelationCandidates.forEach((n) => m.set(`${n.title} (${disciplineSummary(n.discipline)})`, n.id));
    return m;
  }, [documentRelationCandidates]);

  const systemRelationCandidates = useMemo(() => {
    if (!relationshipSourceNodeId && !relationshipSourceSystemId) return [];
    if (!allowSystemTargets) return [];
    const term = relationshipSystemQuery.trim().toLowerCase();
    const allowedKinds =
      mapCategoryId === "bow_tie"
        ? relationshipSourceKind === "image_asset"
          ? null
          : new Set(bowtieAllowedTargetsBySource[relationshipSourceKind] ?? [])
        : null;
    return elements
      .filter((el) => el.element_type !== "grouping_container" && el.element_type !== "sticky_note" && el.element_type !== "text_box")
      .filter((el) => el.id !== relationshipSourceSystemId)
      .filter((el) => {
        if (mapCategoryId === "org_chart") {
          return el.element_type === "person";
        }
        if (mapCategoryId !== "bow_tie") return true;
        if (relationshipSourceKind === "image_asset") return true;
        return allowedKinds?.has(el.element_type) ?? false;
      })
      .filter((el) => (el.heading || "").toLowerCase().includes(term));
  }, [elements, relationshipSourceNodeId, relationshipSourceSystemId, relationshipSystemQuery, allowSystemTargets, mapCategoryId, bowtieAllowedTargetsBySource, relationshipSourceKind]);

  const systemRelationCandidateLabelById = useMemo(() => {
    const m = new Map<string, string>();
    systemRelationCandidates.forEach((el) => m.set(el.id, getElementRelationshipDisplayLabel(el)));
    return m;
  }, [systemRelationCandidates]);

  const systemRelationCandidateIdByLabel = useMemo(() => {
    const m = new Map<string, string>();
    systemRelationCandidates.forEach((el) => m.set(getElementRelationshipDisplayLabel(el), el.id));
    return m;
  }, [systemRelationCandidates]);

  const groupingRelationCandidates = useMemo(() => {
    if (!relationshipSourceGroupingId) return [];
    const term = relationshipGroupingQuery.trim().toLowerCase();
    return elements
      .filter((el) => el.element_type === "grouping_container" && el.id !== relationshipSourceGroupingId)
      .filter((el) => (el.heading || "").toLowerCase().includes(term));
  }, [elements, relationshipSourceGroupingId, relationshipGroupingQuery]);

  const groupingRelationCandidateLabelById = useMemo(() => {
    const m = new Map<string, string>();
    groupingRelationCandidates.forEach((el) => m.set(el.id, el.heading || "Group label"));
    return m;
  }, [groupingRelationCandidates]);

  const groupingRelationCandidateIdByLabel = useMemo(() => {
    const m = new Map<string, string>();
    groupingRelationCandidates.forEach((el) => m.set(el.heading || "Group label", el.id));
    return m;
  }, [groupingRelationCandidates]);

  const alreadyRelatedDocumentTargetIds = useMemo(() => {
    const ids = new Set<string>();
    if (!relationshipSourceNodeId && !relationshipSourceSystemId) return ids;
    relations.forEach((r) => {
      if (relationshipSourceNodeId) {
        if (r.from_node_id === relationshipSourceNodeId && r.to_node_id) ids.add(r.to_node_id);
        if (r.to_node_id === relationshipSourceNodeId && r.from_node_id) ids.add(r.from_node_id);
      }
      if (relationshipSourceSystemId) {
        if (r.source_system_element_id === relationshipSourceSystemId && r.to_node_id) ids.add(r.to_node_id);
        if (r.target_system_element_id === relationshipSourceSystemId && r.from_node_id) ids.add(r.from_node_id);
      }
    });
    return ids;
  }, [relations, relationshipSourceNodeId, relationshipSourceSystemId]);

  const alreadyRelatedSystemTargetIds = useMemo(() => {
    const ids = new Set<string>();
    if (!relationshipSourceNodeId && !relationshipSourceSystemId) return ids;
    relations.forEach((r) => {
      if (relationshipSourceNodeId && r.from_node_id === relationshipSourceNodeId && r.target_system_element_id) {
        ids.add(r.target_system_element_id);
      }
      if (relationshipSourceSystemId) {
        if (r.source_system_element_id === relationshipSourceSystemId && r.target_system_element_id) {
          ids.add(r.target_system_element_id);
        }
        if (r.target_system_element_id === relationshipSourceSystemId && r.source_system_element_id) {
          ids.add(r.source_system_element_id);
        }
      }
    });
    return ids;
  }, [relations, relationshipSourceNodeId, relationshipSourceSystemId]);

  const alreadyRelatedGroupingTargetIds = useMemo(() => {
    const ids = new Set<string>();
    if (!relationshipSourceGroupingId) return ids;
    relations.forEach((r) => {
      if (r.source_grouping_element_id === relationshipSourceGroupingId && r.target_grouping_element_id) {
        ids.add(r.target_grouping_element_id);
      }
      if (r.target_grouping_element_id === relationshipSourceGroupingId && r.source_grouping_element_id) {
        ids.add(r.source_grouping_element_id);
      }
    });
    return ids;
  }, [relations, relationshipSourceGroupingId]);

  return {
    relatedRows,
    relatedGroupingRows,
    relatedSystemRows,
    relatedProcessComponentRows,
    relatedPersonRows,
    resolvePersonRelationLabels,
    resolveGroupingRelationLabels,
    resolveDocumentRelationLabels,
    mobileRelatedItems,
    relationshipSourceNode,
    relationshipSourceSystem,
    relationshipSourceGrouping,
    relationshipModeGrouping,
    allowDocumentTargets,
    allowSystemTargets,
    documentRelationCandidates,
    documentRelationCandidateLabelById,
    documentRelationCandidateIdByLabel,
    systemRelationCandidates,
    systemRelationCandidateLabelById,
    systemRelationCandidateIdByLabel,
    groupingRelationCandidates,
    groupingRelationCandidateLabelById,
    groupingRelationCandidateIdByLabel,
    alreadyRelatedDocumentTargetIds,
    alreadyRelatedSystemTargetIds,
    alreadyRelatedGroupingTargetIds,
  };
}
