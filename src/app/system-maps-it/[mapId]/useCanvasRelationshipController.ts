"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDefaultRelationshipCategoryForMap,
  normalizeRelationshipCategoryForMap,
  type DisciplineKey,
  type RelationshipCategory,
} from "./canvasShared";
import { defaultMapCategoryId, type MapCategoryId } from "./mapCategories";

type RelationshipSource = {
  nodeId?: string | null;
  systemId?: string | null;
  groupingId?: string | null;
};

type UseCanvasRelationshipControllerParams = {
  mapCategoryId: MapCategoryId;
};

export const useCanvasRelationshipController = ({
  mapCategoryId,
}: UseCanvasRelationshipControllerParams) => {
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [relationshipSourceNodeId, setRelationshipSourceNodeId] = useState<string | null>(null);
  const [relationshipSourceSystemId, setRelationshipSourceSystemId] = useState<string | null>(null);
  const [relationshipSourceGroupingId, setRelationshipSourceGroupingId] = useState<string | null>(null);
  const [relationshipDocumentQuery, setRelationshipDocumentQuery] = useState("");
  const [relationshipSystemQuery, setRelationshipSystemQuery] = useState("");
  const [relationshipGroupingQuery, setRelationshipGroupingQuery] = useState("");
  const [relationshipTargetDocumentId, setRelationshipTargetDocumentId] = useState("");
  const [relationshipTargetSystemId, setRelationshipTargetSystemId] = useState("");
  const [relationshipTargetGroupingId, setRelationshipTargetGroupingId] = useState("");
  const [showRelationshipDocumentOptions, setShowRelationshipDocumentOptions] = useState(false);
  const [showRelationshipSystemOptions, setShowRelationshipSystemOptions] = useState(false);
  const [showRelationshipGroupingOptions, setShowRelationshipGroupingOptions] = useState(false);
  const [relationshipDescription, setRelationshipDescription] = useState("");
  const [relationshipDisciplineSelection, setRelationshipDisciplineSelection] = useState<DisciplineKey[]>([]);
  const [showRelationshipDisciplineMenu, setShowRelationshipDisciplineMenu] = useState(false);
  const [relationshipCategory, setRelationshipCategory] = useState<RelationshipCategory>(
    getDefaultRelationshipCategoryForMap(defaultMapCategoryId)
  );
  const [relationshipCustomType, setRelationshipCustomType] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRelationshipCategory((prev) => normalizeRelationshipCategoryForMap(prev, mapCategoryId));
  }, [mapCategoryId]);

  const resetRelationshipDraft = useCallback(() => {
    setRelationshipTargetDocumentId("");
    setRelationshipTargetSystemId("");
    setRelationshipTargetGroupingId("");
    setRelationshipDocumentQuery("");
    setRelationshipSystemQuery("");
    setRelationshipGroupingQuery("");
    setShowRelationshipDocumentOptions(false);
    setShowRelationshipSystemOptions(false);
    setShowRelationshipGroupingOptions(false);
    setRelationshipDescription("");
    setRelationshipDisciplineSelection([]);
    setShowRelationshipDisciplineMenu(false);
    setRelationshipCategory(getDefaultRelationshipCategoryForMap(mapCategoryId));
    setRelationshipCustomType("");
  }, [mapCategoryId]);

  const closeAddRelationshipModal = useCallback(() => {
    setShowAddRelationship(false);
    setRelationshipSourceNodeId(null);
    setRelationshipSourceSystemId(null);
    setRelationshipSourceGroupingId(null);
    resetRelationshipDraft();
  }, [resetRelationshipDraft]);

  const openAddRelationshipFromSource = useCallback(
    (source: RelationshipSource, openAddForm = true) => {
      setRelationshipSourceNodeId(source.nodeId ?? null);
      setRelationshipSourceSystemId(source.systemId ?? null);
      setRelationshipSourceGroupingId(source.groupingId ?? null);
      resetRelationshipDraft();
      setShowAddRelationship(openAddForm);
    },
    [resetRelationshipDraft]
  );

  const openRelationshipListFromSource = useCallback(
    (source: RelationshipSource) => {
      openAddRelationshipFromSource(source, false);
    },
    [openAddRelationshipFromSource]
  );

  return {
    showAddRelationship,
    setShowAddRelationship,
    relationshipSourceNodeId,
    relationshipSourceSystemId,
    relationshipSourceGroupingId,
    relationshipDocumentQuery,
    setRelationshipDocumentQuery,
    relationshipSystemQuery,
    setRelationshipSystemQuery,
    relationshipGroupingQuery,
    setRelationshipGroupingQuery,
    relationshipTargetDocumentId,
    setRelationshipTargetDocumentId,
    relationshipTargetSystemId,
    setRelationshipTargetSystemId,
    relationshipTargetGroupingId,
    setRelationshipTargetGroupingId,
    showRelationshipDocumentOptions,
    setShowRelationshipDocumentOptions,
    showRelationshipSystemOptions,
    setShowRelationshipSystemOptions,
    showRelationshipGroupingOptions,
    setShowRelationshipGroupingOptions,
    relationshipDescription,
    setRelationshipDescription,
    relationshipDisciplineSelection,
    setRelationshipDisciplineSelection,
    showRelationshipDisciplineMenu,
    setShowRelationshipDisciplineMenu,
    relationshipCategory,
    setRelationshipCategory,
    relationshipCustomType,
    setRelationshipCustomType,
    closeAddRelationshipModal,
    openAddRelationshipFromSource,
    openRelationshipListFromSource,
  };
};
