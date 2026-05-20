"use client";

import type { Node } from "@xyflow/react";
import type { CanvasElementRow, NodeRelationRow } from "./canvasShared";
import {
  anchorNodeHeight,
  anchorNodeMinHeight,
  anchorNodeMinWidth,
  anchorNodeWidth,
  bowtieControlHeight,
  bowtieDefaultWidth,
  bowtieHazardHeight,
  bowtieRiskRatingHeight,
  bowtieSquareHeight,
  buildEquipmentHeading,
  buildEnvironmentHeading,
  buildPersonHeading,
  defaultCategoryColor,
  type DocumentNodeRow,
  type DocumentTypeRow,
  type FlowData,
  getDisplayTypeName,
  getTypeBannerStyle,
  groupingDefaultHeight,
  groupingDefaultWidth,
  groupingMinHeight,
  groupingMinWidth,
  incidentDefaultWidth,
  incidentCardHeight,
  incidentCardWidth,
  incidentFourThreeHeight,
  imageDefaultWidth,
  imageMinHeight,
  imageMinWidth,
  isLandscapeTypeName,
  minorGridSize,
  orgChartPersonHeight,
  orgChartPersonWidth,
  parseOrgChartPersonConfig,
  parseDisciplines,
  personElementHeight,
  personElementWidth,
  parseProcessFlowId,
  processComponentElementHeight,
  processComponentWidth,
  processHeadingHeight,
  processHeadingWidth,
  processMinHeight,
  processMinWidth,
  shapeArrowDefaultHeight,
  shapeArrowDefaultWidth,
  shapeArrowMinHeight,
  shapeArrowMinWidth,
  shapeCircleDefaultSize,
  shapeDefaultFillColor,
  shapeMinHeight,
  shapeMinWidth,
  shapePentagonDefaultHeight,
  shapePentagonDefaultWidth,
  shapePillDefaultHeight,
  shapePillDefaultWidth,
  shapeRectangleDefaultHeight,
  shapeRectangleDefaultWidth,
  processFlowId,
  stickyDefaultSize,
  stickyMinSize,
  systemCircleDiameter,
  systemCircleElementHeight,
  tableCellDefaultHeightSquares,
  tableCellDefaultWidthSquares,
  tableDefaultColumns,
  tableDefaultHeight,
  tableDefaultRows,
  tableDefaultWidth,
  tableMinColumns,
  tableMinHeight,
  tableMinRows,
  tableMinWidth,
  textBoxDefaultHeight,
  textBoxDefaultWidth,
  textBoxMinHeight,
  textBoxMinWidth,
} from "./canvasShared";
import type { MapCategoryId } from "./mapCategories";

export const normalizeElementRef = (value: string | null | undefined) => {
  if (!value) return "";
  const trimmed = value.replace(/^process:/i, "").trim().toLowerCase();
  const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  return uuidMatch ? uuidMatch[0].toLowerCase() : trimmed;
};

const formatBowtieConfigLabel = (value: string) =>
  value
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");

const formatIncidentOptionLabel = (value: string) => formatBowtieConfigLabel(value.trim());

const incidentResponseRecoveryPaletteByCategory = (categoryRaw: string) => {
  const normalized = categoryRaw.trim().toLowerCase();
  switch (normalized) {
    case "emergency_response":
      return {
        background: "#FEF3C7",
        text: "#92400E",
        border: "#FCD34D",
      };
    case "make_area_safe":
      return {
        background: "#F3E8FF",
        text: "#6B21A8",
        border: "#D8B4FE",
      };
    case "medical_treatment":
      return {
        background: "#DCFCE7",
        text: "#166534",
        border: "#86EFAC",
      };
    case "scene_preservation":
      return {
        background: "#E0E7FF",
        text: "#3730A3",
        border: "#A5B4FC",
      };
    default:
      return {
        background: "#FCE7F3",
        text: "#9D174D",
        border: "#F9A8D4",
      };
  }
};

const calculateIncidentRiskLevel = (likelihoodRaw: string, consequenceRaw: string) => {
  const likelihoodScoreByKey: Record<string, number> = {
    rare: 1,
    unlikely: 2,
    possible: 3,
    likely: 4,
    almost_certain: 5,
  };
  const consequenceScoreByKey: Record<string, number> = {
    insignificant: 1,
    minor: 2,
    moderate: 3,
    major: 4,
    severe: 5,
  };
  const likelihood = likelihoodScoreByKey[likelihoodRaw] ?? 3;
  const consequence = consequenceScoreByKey[consequenceRaw] ?? 3;
  const score = likelihood * consequence;
  if (score <= 4) return "low";
  if (score <= 9) return "medium";
  if (score <= 16) return "high";
  return "extreme";
};

const incidentRiskBgByLevel = (riskLevel: string) => {
  const normalized = riskLevel.trim().toLowerCase();
  if (normalized === "low") return "#86efac";
  if (normalized === "medium") return "#fde68a";
  if (normalized === "high") return "#fdba74";
  if (normalized === "extreme") return "#fca5a5";
  return "#e5e7eb";
};

const methodologyDefaultLabelByType: Partial<Record<CanvasElementRow["element_type"], string>> = {
  bowtie_hazard: "Hazard",
  bowtie_top_event: "Top Event",
  bowtie_threat: "Threat",
  bowtie_consequence: "Consequence",
  bowtie_control: "Control",
  bowtie_escalation_factor: "Escalation Factor",
  bowtie_recovery_measure: "Recovery Measure",
  bowtie_degradation_indicator: "Degradation Indicator",
  incident_sequence_step: "Sequence Step",
  incident_outcome: "Outcome",
  incident_task_condition: "Task / Condition",
  incident_factor: "Factor",
  incident_system_factor: "System Factor",
  incident_control_barrier: "Control / Barrier",
  incident_evidence: "Evidence",
  incident_response_recovery: "Response / Recovery",
  incident_finding: "Finding",
  incident_recommendation: "Recommendation",
};

const getMethodologyCustomLabel = (
  elementType: CanvasElementRow["element_type"],
  headingRaw: string | null | undefined
) => {
  const defaultLabel = methodologyDefaultLabelByType[elementType] ?? "Node";
  const legacyDefaultLabel = elementType === "incident_outcome" ? "Outcome" : defaultLabel;
  const heading = String(headingRaw ?? "").trim();
  if (!heading || heading === defaultLabel || heading === legacyDefaultLabel) return "";
  return heading;
};

const getMethodologyBodyDisplayMode = (
  labelRaw: string | null | undefined,
  descriptionRaw: string | null | undefined,
  modeRaw: unknown
) => {
  if (modeRaw === "label" || modeRaw === "description") return modeRaw;
  const label = String(labelRaw ?? "").trim();
  const description = String(descriptionRaw ?? "").trim();
  if (description) return "description";
  if (label) return "label";
  return "description";
};

const getMethodologyNodeText = (element: CanvasElementRow) => {
  const config = (element.element_config as Record<string, unknown> | null) ?? {};
  const label = getMethodologyCustomLabel(element.element_type, element.heading);
  const description = String(config.description ?? "").trim();
  const bodyDisplayMode = getMethodologyBodyDisplayMode(label, description, config.body_display_mode);
  if (bodyDisplayMode === "label") return label || description;
  return description || label;
};

const buildIncidentTag = (
  key: string,
  rawValue: string | null | undefined,
  options?: {
    iconSrc?: string;
    pillBg?: string;
    pillText?: string;
    label?: string;
  }
) => {
  const normalized = String(rawValue ?? "").trim().toLowerCase();
  if (!normalized) return null;
  return {
    key,
    label: options?.label || formatIncidentOptionLabel(normalized),
    iconSrc: options?.iconSrc || "/icons/other.svg",
    pillBg: options?.pillBg || "#e2e8f0",
    pillText: options?.pillText || "#111827",
  };
};

const compactIncidentTags = (
  tags: Array<ReturnType<typeof buildIncidentTag>>
): NonNullable<ReturnType<typeof buildIncidentTag>>[] => tags.filter((tag): tag is NonNullable<ReturnType<typeof buildIncidentTag>> => tag !== null);
const incidentExpandedHeight = incidentCardHeight;
const incidentOpenDetailZIndex = 120;

const incidentIconByValue = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const directMap: Record<string, string> = {
    present: "/icons/present.svg",
    absent: "/icons/absent.svg",
    normal: "/icons/present.svg",
    abnormal: "/icons/absent.svg",
    essential: "/icons/essential.svg",
    contributing: "/icons/contributing.svg",
    predisposing: "/icons/predisposing.svg",
    neutral: "/icons/neutral.svg",
    human: "/icons/human.svg",
    equipment: "/icons/equipment.svg",
    process: "/icons/process.svg",
    environment: "/icons/environment.svg",
    organisation: "/icons/business.svg",
    organization: "/icons/business.svg",
    business: "/icons/business.svg",
    training: "/icons/training.svg",
    supervision: "/icons/supervision.svg",
    planning: "/icons/planning.svg",
    design: "/icons/design.svg",
    culture: "/icons/culture.svg",
    other: "/icons/other.svg",
    injury: "/icons/injury.svg",
    damage: "/icons/damage.svg",
    loss: "/icons/loss.svg",
    environmental_impact: "/icons/environmentloss.svg",
    environmental_loss: "/icons/environmentloss.svg",
    photo: "/icons/evidencephoto.svg",
    statement: "/icons/evidencestatement.svg",
    record: "/icons/evidencerecord.svg",
    failed: "/icons/failed.svg",
    missing: "/icons/absent.svg",
    effective: "/icons/present.svg",
    preventive: "/icons/control.svg",
    mitigative: "/icons/control.svg",
    recovery: "/icons/control.svg",
    engineering: "/icons/control.svg",
    substitution: "/icons/control.svg",
    elimination: "/icons/control.svg",
    administrative: "/icons/control.svg",
    ppe: "/icons/control.svg",
    location: "/icons/locationicon.svg",
    timestamp: "/icons/datestamp.svg",
  };
  return directMap[normalized] || "/icons/other.svg";
};

const incidentPillBgByValue = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const directMap: Record<string, string> = {
    present: "#a7f3a1",
    effective: "#a7f3a1",
    normal: "#a7f3a1",
    absent: "#fecaca",
    abnormal: "#fecaca",
    missing: "#e5e7eb",
    failed: "#fecaca",
    essential: "#fde68a",
    contributing: "#fed7aa",
    predisposing: "#d8b4fe",
    neutral: "#dbeafe",
    human: "#c4b5fd",
    equipment: "#c7d2fe",
    process: "#fdba74",
    environment: "#bae6fd",
    organisation: "#bfdbfe",
    organization: "#bfdbfe",
    business: "#bfdbfe",
    training: "#bfdbfe",
    supervision: "#ddd6fe",
    planning: "#bfdbfe",
    design: "#fecdd3",
    culture: "#fde68a",
    other: "#e5e7eb",
    injury: "#fecaca",
    damage: "#fdba74",
    loss: "#fcd34d",
    environmental_impact: "#a7f3d0",
    environmental_loss: "#a7f3d0",
    photo: "#bfdbfe",
    statement: "#ddd6fe",
    record: "#cbd5e1",
    preventive: "#bbf7d0",
    mitigative: "#bfdbfe",
    recovery: "#ddd6fe",
    engineering: "#bbf7d0",
    substitution: "#fde68a",
    elimination: "#fecaca",
    administrative: "#bfdbfe",
    ppe: "#fed7aa",
    location: "#dbeafe",
    timestamp: "#cbd5e1",
  };
  return directMap[normalized] || "#e2e8f0";
};

const normalizeFlowRef = (value: string | null | undefined) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^process:/i.test(trimmed)) {
    return `process:${normalizeElementRef(trimmed)}`;
  }
  const uuid = normalizeElementRef(trimmed);
  return uuid ? `process:${uuid}` : "";
};

export const buildOrgDirectReportCountByPersonNormalizedId = (params: {
  elements: CanvasElementRow[];
  relations: NodeRelationRow[];
  mapCategoryId: MapCategoryId;
}) => {
  const { elements, relations, mapCategoryId } = params;
  const personElements = elements.filter((el) => el.element_type === "person");
  const personElementIdByNormalizedId = new Map(personElements.map((el) => [normalizeElementRef(el.id), el.id] as const));
  const personElementByNormalizedId = new Map(personElements.map((el) => [normalizeElementRef(el.id), el] as const));
  const personElementIdByNormalizedFlowId = new Map(
    personElements.map((el) => [normalizeFlowRef(processFlowId(el.id)), el.id] as const)
  );
  const directReportIdsByLeaderNormalizedId = new Map<string, Set<string>>();

  relations.forEach((rel) => {
    const relationType = String(rel.relation_type || "").trim().toLowerCase();
    const relationCategory = String(rel.relationship_category || "").trim().toLowerCase();
    if (mapCategoryId !== "org_chart" && relationType !== "reports_to" && relationCategory !== "reports_to") return;

    const sourceCandidates = [
      rel.source_system_element_id,
      rel.source_system_element_id ? parseProcessFlowId(rel.source_system_element_id) : null,
      rel.source_system_element_id ? processFlowId(parseProcessFlowId(rel.source_system_element_id)) : null,
      rel.from_node_id ? parseProcessFlowId(rel.from_node_id) : null,
      rel.from_node_id || null,
    ].filter((id): id is string => Boolean(id));
    const targetCandidates = [
      rel.target_system_element_id,
      rel.target_system_element_id ? parseProcessFlowId(rel.target_system_element_id) : null,
      rel.target_system_element_id ? processFlowId(parseProcessFlowId(rel.target_system_element_id)) : null,
      rel.to_node_id ? parseProcessFlowId(rel.to_node_id) : null,
      rel.to_node_id || null,
    ].filter((id): id is string => Boolean(id));

    const sourcePersonNormalizedId =
      sourceCandidates.map((id) => normalizeElementRef(id)).find((id) => personElementIdByNormalizedId.has(id)) ?? "";
    const targetPersonNormalizedId =
      targetCandidates.map((id) => normalizeElementRef(id)).find((id) => personElementIdByNormalizedId.has(id)) ?? "";
    const sourcePersonIdFromFlow =
      sourceCandidates
        .map((id) => normalizeFlowRef(id))
        .map((id) => personElementIdByNormalizedFlowId.get(id) ?? null)
        .find((id): id is string => Boolean(id)) ?? null;
    const targetPersonIdFromFlow =
      targetCandidates
        .map((id) => normalizeFlowRef(id))
        .map((id) => personElementIdByNormalizedFlowId.get(id) ?? null)
        .find((id): id is string => Boolean(id)) ?? null;
    const resolvedSourcePersonNormalizedId = sourcePersonNormalizedId || (sourcePersonIdFromFlow ? normalizeElementRef(sourcePersonIdFromFlow) : "");
    const resolvedTargetPersonNormalizedId = targetPersonNormalizedId || (targetPersonIdFromFlow ? normalizeElementRef(targetPersonIdFromFlow) : "");

    let managerNormalizedId = "";
    let reportNormalizedId = "";
    if (resolvedSourcePersonNormalizedId && resolvedTargetPersonNormalizedId) {
      const sourcePerson = personElementByNormalizedId.get(resolvedSourcePersonNormalizedId);
      const targetPerson = personElementByNormalizedId.get(resolvedTargetPersonNormalizedId);
      if (sourcePerson && targetPerson) {
        if (sourcePerson.pos_y <= targetPerson.pos_y) {
          managerNormalizedId = resolvedSourcePersonNormalizedId;
          reportNormalizedId = resolvedTargetPersonNormalizedId;
        } else {
          managerNormalizedId = resolvedTargetPersonNormalizedId;
          reportNormalizedId = resolvedSourcePersonNormalizedId;
        }
      }
    }

    if (!managerNormalizedId || !reportNormalizedId) {
      const allRelationRefs = [
        rel.source_system_element_id,
        rel.target_system_element_id,
        rel.from_node_id,
        rel.to_node_id,
        rel.source_grouping_element_id,
        rel.target_grouping_element_id,
      ]
        .map((id) => normalizeElementRef(id ? String(id) : ""))
        .filter(Boolean);
      const uniquePersonNormalizedIds = Array.from(new Set(allRelationRefs.filter((id) => personElementIdByNormalizedId.has(id))));
      if (uniquePersonNormalizedIds.length >= 2) {
        const ranked = uniquePersonNormalizedIds
          .map((id) => ({ id, person: personElementByNormalizedId.get(id) }))
          .filter((entry): entry is { id: string; person: CanvasElementRow } => Boolean(entry.person))
          .sort((a, b) => a.person.pos_y - b.person.pos_y);
        if (ranked.length >= 2) {
          managerNormalizedId = ranked[0].id;
          reportNormalizedId = ranked[ranked.length - 1].id;
        }
      }
    }

    if (!managerNormalizedId || !reportNormalizedId || managerNormalizedId === reportNormalizedId) return;
    const existing = directReportIdsByLeaderNormalizedId.get(managerNormalizedId) ?? new Set<string>();
    existing.add(reportNormalizedId);
    directReportIdsByLeaderNormalizedId.set(managerNormalizedId, existing);
  });

  const directReportCountByPersonNormalizedId = new Map<string, number>();
  directReportIdsByLeaderNormalizedId.forEach((reportIds, leaderNormalizedId) => {
    directReportCountByPersonNormalizedId.set(leaderNormalizedId, reportIds.size);
  });
  return directReportCountByPersonNormalizedId;
};

export const sortGroupingElementsForRender = (params: {
  elements: CanvasElementRow[];
  minWidth: number;
  minHeight: number;
  defaultWidth: number;
  defaultHeight: number;
}) => {
  const { elements, minWidth, minHeight, defaultWidth, defaultHeight } = params;
  return elements
    .filter((el) => el.element_type === "grouping_container")
    .sort((a, b) => {
      const areaA = Math.max(minWidth, a.width || defaultWidth) * Math.max(minHeight, a.height || defaultHeight);
      const areaB = Math.max(minWidth, b.width || defaultWidth) * Math.max(minHeight, b.height || defaultHeight);
      if (areaA !== areaB) return areaB - areaA;
      const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createdA - createdB;
    });
};

export const buildGroupingFlowNodes = (params: {
  groupingElements: CanvasElementRow[];
  selectedFlowIds: Set<string>;
  canWriteMap: boolean;
  canEditElement: (element: CanvasElementRow) => boolean;
}) => {
  const { groupingElements, selectedFlowIds, canWriteMap, canEditElement } = params;
  const getContrastText = (hex: string) => {
    const normalized = hex.replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "#111827";
    const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
    const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
    const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
    const toLinear = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance > 0.42 ? "#111827" : "#FFFFFF";
  };
  return groupingElements.map((el): Node<FlowData> => {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const bannerBg = typeof cfg.header_bg_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.header_bg_color) ? cfg.header_bg_color.toUpperCase() : "#FFFFFF";
    const outlineWidthRaw = Number(cfg.outline_width ?? 1);
    const outlineWidth = Number.isFinite(outlineWidthRaw) ? Math.max(1, Math.min(12, Math.round(outlineWidthRaw))) : 1;
    const headerFontSizeRaw = Number(cfg.header_font_size ?? 11);
    const headerFontSize = Number.isFinite(headerFontSizeRaw) ? Math.max(10, Math.min(48, Math.round(headerFontSizeRaw))) : 11;
    return {
      id: flowId,
      type: "groupingContainer",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 0,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      className: "pointer-events-none",
      style: {
        width: Math.max(groupingMinWidth, el.width || groupingDefaultWidth),
        height: Math.max(groupingMinHeight, el.height || groupingDefaultHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      dragHandle: ".grouping-drag-handle",
      data: {
        entityKind: "grouping_container",
        typeName: "Grouping Container",
        title: el.heading ?? "Group label",
        userGroup: "",
        disciplineKeys: [],
        bannerBg,
        bannerText: getContrastText(bannerBg),
        groupingOutlineWidth: outlineWidth,
        groupingHeaderFontSize: headerFontSize,
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  });
};

export const buildDocumentFlowNodes = (params: {
  nodes: DocumentNodeRow[];
  typesById: Map<string, DocumentTypeRow>;
  selectedFlowIds: Set<string>;
  canWriteMap: boolean;
  getNodeSize: (node: DocumentNodeRow) => { width: number; height: number };
  unconfiguredDocumentTitle: string;
}) => {
  const { nodes, typesById, selectedFlowIds, canWriteMap, getNodeSize, unconfiguredDocumentTitle } = params;
  return nodes.map((n): Node<FlowData> => {
    const rawTypeName = typesById.get(n.type_id)?.name ?? "Document";
    const isLandscape = isLandscapeTypeName(rawTypeName);
    const { width, height } = getNodeSize(n);
    const typeName = getDisplayTypeName(rawTypeName);
    const banner = getTypeBannerStyle(typeName);
    const isMarked = selectedFlowIds.has(n.id);
    return {
      id: n.id,
      type: "documentTile",
      position: { x: n.pos_x, y: n.pos_y },
      zIndex: 20,
      selected: isMarked,
      draggable: canWriteMap,
      selectable: canWriteMap,
      style: {
        width,
        height,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "hidden",
      },
      data: {
        entityKind: "document",
        typeName,
        title: n.title ?? "",
        documentNumber: n.document_number ?? "",
        userGroup: n.user_group ?? "",
        disciplineKeys: parseDisciplines(n.discipline),
        bannerBg: banner.bg,
        bannerText: banner.text,
        isLandscape,
        isUnconfigured: (n.title ?? "").trim().toLowerCase() === unconfiguredDocumentTitle.toLowerCase(),
      },
    };
  });
};

export const buildPrimaryElementFlowNode = (params: {
  element: CanvasElementRow;
  selectedFlowIds: Set<string>;
  selectedTableId: string | null;
  canEditElement: (element: CanvasElementRow) => boolean;
  canWriteMap: boolean;
  selectedFlowShapeId: string | null;
  hasUnsavedFlowShapeDraftChanges: boolean;
  mapCategoryId: MapCategoryId;
  userId: string | null;
  userEmail: string;
  memberDisplayNameByUserId: Map<string, string>;
  formatStickyDate: (value: string | null | undefined) => string;
  imageUrlsByElementId: Record<string, string | undefined>;
  directReportCountByPersonNormalizedId: Map<string, number>;
  orgDirectReportCountByPersonId: Map<string, number>;
  anchorSequenceNumberById?: Map<string, number>;
  anchorGroupColorById?: Map<string, string>;
  onNavigateAnchor?: (anchorId: string, direction: "previous" | "next") => void;
  onTableCellCommit?: (elementId: string, rowIndex: number, columnIndex: number, value: string) => void;
  onTableCellStyleCommit?: (
    elementId: string,
    rowIndex: number,
    columnIndex: number,
    style: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      align?: "left" | "center" | "right";
      vAlign?: "top" | "middle" | "bottom";
      fontSize?: number;
      backgroundColor?: string | null;
    }
  ) => void;
  onToggleIncidentDetail?: (elementId: string, nextOpen: boolean) => void;
}): Node<FlowData> | null | undefined => {
  const {
    element: el,
    selectedFlowIds,
    selectedTableId,
    canEditElement,
    canWriteMap,
    selectedFlowShapeId,
    hasUnsavedFlowShapeDraftChanges,
    mapCategoryId,
    userId,
    userEmail,
    memberDisplayNameByUserId,
    formatStickyDate,
    imageUrlsByElementId,
    directReportCountByPersonNormalizedId,
    orgDirectReportCountByPersonId,
    anchorSequenceNumberById,
    anchorGroupColorById,
    onNavigateAnchor,
    onTableCellCommit,
    onTableCellStyleCommit,
    onToggleIncidentDetail,
  } = params;

  if (el.element_type === "grouping_container") return null;

  if (el.element_type === "anchor") {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    const creatorName =
      (el.created_by_user_id ? memberDisplayNameByUserId.get(el.created_by_user_id) : null) ||
      (el.created_by_user_id === userId ? userEmail : null) ||
      "Unknown user";
    const anchorWidth = Math.max(anchorNodeMinWidth, el.width || anchorNodeWidth);
    const anchorHeight = Math.max(anchorNodeMinHeight, Math.round((anchorWidth / anchorNodeWidth) * anchorNodeHeight));
    return {
      id: flowId,
      type: "anchorNode",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 50,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: anchorWidth,
        height: anchorHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "anchor",
        typeName: "Anchor",
        title: el.heading ?? "Anchor",
        creatorName,
        anchorId: el.id,
        anchorSequenceNumber: anchorSequenceNumberById?.get(el.id) ?? 1,
        anchorGroupColor: anchorGroupColorById?.get(el.id) ?? el.color_hex ?? "#0F766E",
        onNavigateAnchor,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#0f766e",
        bannerText: "#ffffff",
        isLandscape: false,
        isUnconfigured: false,
      },
    };
  }

  if (el.element_type === "sticky_note") {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const backgroundColor = typeof cfg.background_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.background_color) ? cfg.background_color.toUpperCase() : "#FEF08A";
    const outlineColor = typeof cfg.outline_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.outline_color) ? cfg.outline_color.toUpperCase() : "#F59E0B";
    const fillMode = String(cfg.fill_mode ?? "fill") === "outline" ? "outline" : "fill";
    const outlineWidthRaw = Number(cfg.outline_width ?? 1);
    const outlineWidth = Number.isFinite(outlineWidthRaw) ? Math.max(1, Math.min(12, Math.round(outlineWidthRaw))) : 1;
    return {
      id: flowId,
      type: "stickyNote",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 60,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canEditThis,
      style: {
        width: Math.max(stickyMinSize, el.width || stickyDefaultSize),
        height: Math.max(stickyMinSize, el.height || stickyDefaultSize),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "sticky_note",
        typeName: "Sticky Note",
        title: el.heading ?? "Enter Text",
        canEdit: canEditThis,
        creatorName:
          (el.created_by_user_id ? memberDisplayNameByUserId.get(el.created_by_user_id) : null) ||
          (el.created_by_user_id === userId ? userEmail : null) ||
          "User",
        createdAtLabel: formatStickyDate(el.created_at),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: backgroundColor,
        bannerText: "#000000",
        textStyle: {
          backgroundColor,
          outline: true,
          outlineColor,
          outlineWidth,
          align: "left",
        },
        shapeStyle: {
          fillMode,
          outlineColor,
          outlineWidth,
        },
        isLandscape: false,
        isUnconfigured: false,
      },
    };
  }

  if (el.element_type === "image_asset") {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    return {
      id: flowId,
      type: "imageAsset",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 45,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(imageMinWidth, el.width || imageDefaultWidth),
        height: Math.max(imageMinHeight, el.height || imageDefaultWidth),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "image_asset",
        typeName: "Image",
        title: String(cfg.description ?? el.heading ?? "Image"),
        imageUrl: imageUrlsByElementId[el.id],
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#ffffff",
        bannerText: "#111827",
        isLandscape: false,
        isUnconfigured: false,
      },
    };
  }

  if (el.element_type === "text_box") {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const alignRaw = String(cfg.align ?? "left");
    return {
      id: flowId,
      type: "textBox",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 55,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(textBoxMinWidth, el.width || textBoxDefaultWidth),
        height: Math.max(textBoxMinHeight, el.height || textBoxDefaultHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "text_box",
        typeName: "Text",
        title: el.heading ?? "Click to edit text box",
        textStyle: {
          bold: Boolean(cfg.bold),
          italic: Boolean(cfg.italic),
          underline: Boolean(cfg.underline),
          align: alignRaw === "center" || alignRaw === "right" ? alignRaw : "left",
          fontSize: Math.max(16, Math.min(168, Number(cfg.font_size ?? 16))),
          backgroundColor: typeof cfg.background_color === "string" ? cfg.background_color : "#FFFFFF",
          outline: Boolean(cfg.outline),
          outlineColor: typeof cfg.outline_color === "string" ? cfg.outline_color : "#111827",
          outlineWidth: (() => {
            const raw = Number(cfg.outline_width ?? 2);
            return Number.isFinite(raw) ? Math.max(1, Math.min(12, Math.round(raw))) : 2;
          })(),
        },
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#ffffff",
        bannerText: "#111827",
        isLandscape: false,
        isUnconfigured: false,
      },
    };
  }

  if (el.element_type === "table") {
    const flowId = processFlowId(el.id);
    const isContextMarked = selectedFlowIds.has(flowId);
    const isPrimarySelected = selectedTableId === el.id;
    const isMarked = isContextMarked || isPrimarySelected;
    const canEditThis = canEditElement(el);
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const parsedRows = Number(cfg.rows ?? tableDefaultRows);
    const parsedColumns = Number(cfg.columns ?? tableDefaultColumns);
    const rows = Number.isFinite(parsedRows) ? Math.max(tableMinRows, Math.floor(parsedRows)) : tableDefaultRows;
    const columns = Number.isFinite(parsedColumns) ? Math.max(tableMinColumns, Math.floor(parsedColumns)) : tableDefaultColumns;
    const headerRowBg = typeof cfg.header_bg_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.header_bg_color)
      ? cfg.header_bg_color.toUpperCase()
      : null;
    const gridLineColor = typeof cfg.grid_line_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.grid_line_color)
      ? cfg.grid_line_color.toUpperCase()
      : null;
    const gridLineWeightRaw = Number(cfg.grid_line_weight ?? 0.5);
    const gridLineWeight = Number.isFinite(gridLineWeightRaw) ? Math.max(0.5, Math.min(6, Math.round(gridLineWeightRaw * 2) / 2)) : 0.5;
    const alignRaw = String(cfg.align ?? "center");
    const fontSizeRaw = Number(cfg.font_size ?? 10);
    const fontSize = Number.isFinite(fontSizeRaw) ? Math.max(10, Math.min(72, Math.round(fontSizeRaw))) : 10;
    const cellTexts = Array.isArray(cfg.cell_texts)
      ? (cfg.cell_texts as unknown[])
          .map((row) => (Array.isArray(row) ? row.map((cell) => (cell == null ? "" : String(cell))) : []))
      : [];
    const cellStyles = Array.isArray(cfg.cell_styles)
      ? (cfg.cell_styles as unknown[]).map((row) =>
          Array.isArray(row)
            ? row.map((cellStyle) => {
                const styleObj = (cellStyle as Record<string, unknown> | null) ?? {};
                const cellAlignRaw = String(styleObj.align ?? "center");
                const cellVAlignRaw = String(styleObj.v_align ?? styleObj.vAlign ?? "middle");
                const cellFontSizeRaw = Number(styleObj.font_size ?? styleObj.fontSize ?? 10);
                const cellBackgroundColorRaw =
                  typeof styleObj.background_color === "string"
                    ? styleObj.background_color
                    : typeof styleObj.backgroundColor === "string"
                    ? styleObj.backgroundColor
                    : null;
                const cellAlign: "left" | "center" | "right" =
                  cellAlignRaw === "left" || cellAlignRaw === "right" ? cellAlignRaw : "center";
                const cellVAlign: "top" | "middle" | "bottom" =
                  cellVAlignRaw === "top" || cellVAlignRaw === "bottom" ? cellVAlignRaw : "middle";
                return {
                  bold: Boolean(styleObj.bold),
                  italic: Boolean(styleObj.italic),
                  underline: Boolean(styleObj.underline),
                  align: cellAlign,
                  vAlign: cellVAlign,
                  fontSize: Number.isFinite(cellFontSizeRaw) ? Math.max(10, Math.min(72, Math.round(cellFontSizeRaw))) : 10,
                  backgroundColor:
                    cellBackgroundColorRaw && /^#[0-9a-fA-F]{6}$/.test(cellBackgroundColorRaw) ? cellBackgroundColorRaw.toUpperCase() : null,
                };
              })
            : []
        )
      : [];
    const computedWidth = columns * tableCellDefaultWidthSquares * minorGridSize;
    const computedHeight = rows * tableCellDefaultHeightSquares * minorGridSize;
    return {
      id: flowId,
      type: "flowTable",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 40,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(tableMinWidth, el.width || computedWidth || tableDefaultWidth),
        height: Math.max(tableMinHeight, el.height || computedHeight || tableDefaultHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isContextMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "table",
        typeName: "Table",
        title: el.heading ?? "Table",
        tableConfig: {
          rows,
          columns,
          headerRowBg,
          gridLineColor,
          gridLineWeight,
          cellTexts,
          cellStyles,
        },
        textStyle: {
          bold: Boolean(cfg.bold),
          italic: Boolean(cfg.italic),
          underline: Boolean(cfg.underline),
          align: alignRaw === "left" || alignRaw === "right" ? alignRaw : "center",
          fontSize,
        },
        onTableCellCommit: onTableCellCommit ? (rowIndex, columnIndex, value) => onTableCellCommit(el.id, rowIndex, columnIndex, value) : undefined,
        onTableCellStyleCommit: onTableCellStyleCommit
          ? (rowIndex, columnIndex, style) => onTableCellStyleCommit(el.id, rowIndex, columnIndex, style)
          : undefined,
        canEdit: canEditThis,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#ffffff",
        bannerText: "#111827",
        isLandscape: false,
        isUnconfigured: false,
      },
    };
  }

  if (
    el.element_type === "shape_rectangle" ||
    el.element_type === "shape_circle" ||
    el.element_type === "shape_pill" ||
    el.element_type === "shape_pentagon" ||
    el.element_type === "shape_chevron_left" ||
    el.element_type === "shape_arrow"
  ) {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const alignRaw = String(cfg.align ?? "center");
    const directionRaw = String(cfg.direction ?? "right");
    const fillModeRaw = String(cfg.fill_mode ?? "fill");
    const defaultWidth =
      el.element_type === "shape_circle"
        ? shapeCircleDefaultSize
        : el.element_type === "shape_pill"
        ? shapePillDefaultWidth
        : el.element_type === "shape_arrow"
        ? shapeArrowDefaultWidth
        : el.element_type === "shape_pentagon" || el.element_type === "shape_chevron_left"
        ? shapePentagonDefaultWidth
        : shapeRectangleDefaultWidth;
    const defaultHeight =
      el.element_type === "shape_circle"
        ? shapeCircleDefaultSize
        : el.element_type === "shape_pill"
        ? shapePillDefaultHeight
        : el.element_type === "shape_arrow"
        ? shapeArrowDefaultHeight
        : el.element_type === "shape_pentagon" || el.element_type === "shape_chevron_left"
        ? shapePentagonDefaultHeight
        : shapeRectangleDefaultHeight;
    return {
      id: flowId,
      type:
        el.element_type === "shape_circle"
          ? "flowShapeCircle"
          : el.element_type === "shape_pill"
          ? "flowShapePill"
          : el.element_type === "shape_pentagon"
          ? "flowShapePentagon"
          : el.element_type === "shape_chevron_left"
          ? "flowShapeChevronLeft"
          : el.element_type === "shape_arrow"
          ? "flowShapeArrow"
          : "flowShapeRectangle",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 1,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(el.element_type === "shape_arrow" ? shapeArrowMinWidth : shapeMinWidth, el.width || defaultWidth),
        height: Math.max(el.element_type === "shape_arrow" ? shapeArrowMinHeight : shapeMinHeight, el.height || defaultHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
        zIndex: 1,
      },
      data: {
        entityKind: el.element_type,
        typeName:
          el.element_type === "shape_circle"
            ? "Circle"
            : el.element_type === "shape_pill"
            ? "Pill"
            : el.element_type === "shape_pentagon"
            ? "Pentagon"
            : el.element_type === "shape_chevron_left"
            ? "Chevron"
            : el.element_type === "shape_arrow"
            ? "Arrow"
            : "Rectangle",
        title: el.heading ?? "Shape text",
        categoryColor: el.color_hex ?? shapeDefaultFillColor,
        canResize: !(el.id === selectedFlowShapeId && hasUnsavedFlowShapeDraftChanges),
        textStyle: {
          bold: Boolean(cfg.bold),
          italic: Boolean(cfg.italic),
          underline: Boolean(cfg.underline),
          align: alignRaw === "left" || alignRaw === "right" ? alignRaw : "center",
          fontSize: Math.max(12, Math.min(168, Number(cfg.font_size ?? 24))),
        },
        shapeStyle: {
          direction: directionRaw === "left" ? "left" : "right",
          fillMode: fillModeRaw === "outline" ? "outline" : "fill",
          rotationDeg: [0, 90, 180, 270].includes(Number(cfg.rotation_deg))
            ? (Number(cfg.rotation_deg) as 0 | 90 | 180 | 270)
            : 0,
          outlineColor: typeof cfg.outline_color === "string" ? cfg.outline_color : el.color_hex ?? shapeDefaultFillColor,
          outlineWidth: (() => {
            const raw = Number(cfg.outline_width ?? 3);
            return Number.isFinite(raw) ? Math.max(1, Math.min(12, Math.round(raw))) : 3;
          })(),
        },
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#ffffff",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }

  if (el.element_type === "process_component") {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    return {
      id: flowId,
      type: "processComponent",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: processComponentWidth,
        height: processComponentElementHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "process_component",
        typeName: "Process",
        title: el.heading ?? "Process",
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#8ca8d6",
        bannerText: "#ffffff",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }

  if (el.element_type === "person") {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    const personWidth = mapCategoryId === "org_chart" ? orgChartPersonWidth : personElementWidth;
    const personHeight = mapCategoryId === "org_chart" ? orgChartPersonHeight : personElementHeight;
    const orgConfig = mapCategoryId === "org_chart" ? parseOrgChartPersonConfig(el.element_config) : null;
    const personConfig = !orgConfig ? (((el.element_config as Record<string, unknown> | null) ?? {})) : null;
    const personTypeLabel = !orgConfig && typeof personConfig?.person_type === "string" ? personConfig.person_type.trim() : "";
    const personBadge = (() => {
      switch (personTypeLabel) {
        case "Injured Person":
          return { label: personTypeLabel, bg: "#b42318", text: "#ffffff" };
        case "Witness":
          return { label: personTypeLabel, bg: "#2563eb", text: "#ffffff" };
        case "Reported Incident":
          return { label: personTypeLabel, bg: "#7c3aed", text: "#ffffff" };
        case "Involved - Direct":
          return { label: personTypeLabel, bg: "#0f766e", text: "#ffffff" };
        case "Involved - Indirect":
          return { label: personTypeLabel, bg: "#0ea5a4", text: "#ffffff" };
        case "Responder":
          return { label: personTypeLabel, bg: "#f59e0b", text: "#111827" };
        case "Responsible Leader":
          return { label: personTypeLabel, bg: "#1d4ed8", text: "#ffffff" };
        case "Other":
          return { label: personTypeLabel, bg: "#64748b", text: "#ffffff" };
        default:
          return null;
      }
    })();
    const actingName = orgConfig?.acting_name || "";
    const occupantName = orgConfig?.occupant_name || "";
    const hasActing = actingName.length > 0;
    const displayName = hasActing ? `${actingName} (A)` : occupantName || "VACANT";
    const positionTitle = orgConfig?.position_title || "Position Title";
    const positionId = orgConfig?.role_id ? ` (${orgConfig.role_id})` : "";
    const positionLine = `${positionTitle}${positionId}`;
    const roleTypeLabel = orgConfig?.employment_type === "contractor" ? "Contractor" : "Employee";
    const resolvedDirectReportCount = (() => {
      const candidates = [
        directReportCountByPersonNormalizedId.get(normalizeElementRef(el.id)),
        orgDirectReportCountByPersonId.get(el.id),
        orgConfig?.direct_report_count,
      ];
      const valid = candidates
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .map((value) => Math.max(0, Math.floor(value)));
      return valid.length ? Math.max(...valid) : 0;
    })();
    const status = orgConfig?.proposed_role
      ? { label: "Proposed", bg: "#7c3aed", text: "#ffffff" }
      : hasActing
      ? { label: "Acting", bg: "#f59e0b", text: "#111827" }
      : orgConfig?.recruiting
      ? { label: "Hiring", bg: "#2563eb", text: "#ffffff" }
      : null;
    return {
      id: flowId,
      type: "personNode",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: personWidth,
        height: personHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "person",
        typeName: "Person",
        title: orgConfig ? displayName : el.heading ?? buildPersonHeading("Role Name", "Department"),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#ffffff",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
        orgChartPerson: orgConfig
          ? {
              displayName,
              positionLine,
              avatarSrc: "/icons/account.svg",
              roleTypeLabel,
              statusLabel: status?.label ?? null,
              statusBg: status?.bg ?? null,
              statusText: status?.text ?? null,
              directReportCount: resolvedDirectReportCount,
            }
          : undefined,
        personBadge: !orgConfig && personBadge ? personBadge : undefined,
      },
    };
  }

  if (el.element_type === "equipment") {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    return {
      id: flowId,
      type: "equipmentNode",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: personElementWidth,
        height: personElementHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "equipment",
        typeName: "Equipment",
        title: el.heading ?? buildEquipmentHeading("Equipment Type", "Brand / type / asset ID"),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#ffffff",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }

  if (el.element_type === "environment") {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    return {
      id: flowId,
      type: "environmentNode",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: personElementWidth,
        height: personElementHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "environment",
        typeName: "Environment",
        title: el.heading ?? buildEnvironmentHeading("Environment detail", "Weather"),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#ffffff",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }

  if (el.element_type === "system_circle") {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    return {
      id: flowId,
      type: "systemCircle",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: systemCircleDiameter,
        height: systemCircleElementHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "system_circle",
        typeName: "System",
        title: el.heading ?? "System Name",
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#1e3a8a",
        bannerText: "#ffffff",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }

  return undefined;
};

export const buildSecondaryElementFlowNode = (params: {
  element: CanvasElementRow;
  selectedFlowIds: Set<string>;
  canEditElement: (element: CanvasElementRow) => boolean;
  canWriteMap: boolean;
  imageUrlsByElementId: Record<string, string | undefined>;
  onOpenEvidenceMedia?: (elementId: string) => void;
  onToggleIncidentDetail?: (elementId: string, nextOpen: boolean) => void;
}): Node<FlowData> => {
  const { element: el, selectedFlowIds, canEditElement, canWriteMap, imageUrlsByElementId, onOpenEvidenceMedia, onToggleIncidentDetail } = params;
  const flowId = processFlowId(el.id);
  const isMarked = selectedFlowIds.has(flowId);
  const canEditThis = canEditElement(el);

  if (el.element_type === "bowtie_hazard") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const energySourceTypeRaw = String(cfg.energy_source_type ?? "").trim();
    const energySourceType = energySourceTypeRaw ? `(${formatBowtieConfigLabel(energySourceTypeRaw)})` : "";
    return {
      id: flowId,
      type: "bowtieHazard",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: bowtieDefaultWidth,
        height: bowtieHazardHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "bowtie_hazard",
        typeName: "Hazard",
        title: getMethodologyNodeText(el),
        description: energySourceType,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#374151",
        bannerText: "#ffffff",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "bowtie_top_event") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const lossOfControlTypeRaw = String(cfg.loss_of_control_type ?? "").trim();
    const lossOfControlType = lossOfControlTypeRaw ? `Loss of ${formatBowtieConfigLabel(lossOfControlTypeRaw)}` : "";
    return {
      id: flowId,
      type: "bowtieTopEvent",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: bowtieDefaultWidth,
        height: bowtieSquareHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "bowtie_top_event",
        typeName: "Top Event",
        title: getMethodologyNodeText(el),
        description: lossOfControlType,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#dc2626",
        bannerText: "#ffffff",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "bowtie_threat") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const threatCategoryRaw = String(cfg.threat_category ?? "").trim();
    const threatCategory = threatCategoryRaw ? `(${formatBowtieConfigLabel(threatCategoryRaw)})` : "";
    return {
      id: flowId,
      type: "bowtieThreat",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: bowtieDefaultWidth,
        height: bowtieSquareHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "bowtie_threat",
        typeName: "Threat",
        title: getMethodologyNodeText(el),
        description: threatCategory,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#f59e0b",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "bowtie_consequence") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const impactCategoryRaw = String(cfg.impact_category ?? "").trim();
    const impactCategory = impactCategoryRaw ? `Impact to ${formatBowtieConfigLabel(impactCategoryRaw)}` : "";
    return {
      id: flowId,
      type: "bowtieConsequence",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: bowtieDefaultWidth,
        height: bowtieSquareHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "bowtie_consequence",
        typeName: "Consequence",
        title: getMethodologyNodeText(el),
        metaSubLabel: impactCategory,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#0ea5e9",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "bowtie_control") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const controlCategory = String(cfg.control_category ?? "preventive").trim().toLowerCase();
    const controlTypeKey = String(cfg.control_type ?? "").trim().toLowerCase();
    const isCriticalControl = Boolean(cfg.is_critical_control);
    const controlCategoryLabel = controlCategory
      ? `${controlCategory.charAt(0).toUpperCase()}${controlCategory.slice(1)} Control`
      : "Control";
    const controlBannerColor =
      controlCategory === "mitigative"
        ? "#0f766e"
        : controlCategory === "escalation"
        ? "#0284c7"
        : controlCategory === "recovery"
        ? "#0f766e"
        : "#2563eb";
    return {
      id: flowId,
      type: "bowtieControl",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "bowtie_control",
        typeName: controlCategoryLabel,
        title: getMethodologyNodeText(el),
        metaSubLabel: controlTypeKey,
        isCritical: isCriticalControl,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: controlBannerColor,
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "bowtie_escalation_factor") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const factorTypeRaw = String(cfg.factor_type ?? cfg.factorType ?? cfg.description ?? "").trim();
    const formattedFactorType = factorTypeRaw ? formatBowtieConfigLabel(factorTypeRaw.replace(/^\((.*)\)$/, "$1")) : "";
    const factorType = formattedFactorType ? `(${formattedFactorType})` : "";
    return {
      id: flowId,
      type: "bowtieEscalationFactor",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "bowtie_escalation_factor",
        typeName: "Escalation Factor",
        title: getMethodologyNodeText(el),
        description: factorType,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#a78bfa",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "bowtie_recovery_measure") {
    return {
      id: flowId,
      type: "bowtieRecoveryMeasure",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "bowtie_recovery_measure",
        typeName: "Recovery Measure",
        title: getMethodologyNodeText(el),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#22d3ee",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "bowtie_degradation_indicator") {
    return {
      id: flowId,
      type: "bowtieDegradationIndicator",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "bowtie_degradation_indicator",
        typeName: "Degradation Indicator",
        title: getMethodologyNodeText(el),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#fda4af",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "bowtie_risk_rating") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const riskLevelRaw = String(cfg.risk_level ?? "").trim().toLowerCase();
    const riskLevelLabel = formatBowtieConfigLabel(riskLevelRaw || "medium");
    return {
      id: flowId,
      type: "bowtieRiskRating",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: bowtieDefaultWidth,
        height: bowtieRiskRatingHeight,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "bowtie_risk_rating",
        typeName: "Risk Rating",
        title: riskLevelLabel,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#111827",
        bannerText: "#ffffff",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_sequence_step") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const timestampRaw = String(cfg.timestamp ?? "").trim();
    let timestampLabel = "";
    let timestampSecondary = "";
    if (timestampRaw) {
      const parsed = new Date(timestampRaw);
      if (!Number.isNaN(parsed.getTime())) {
        const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = String(parsed.getDate()).padStart(2, "0");
        const month = monthLabels[parsed.getMonth()] || "Jan";
        const year = parsed.getFullYear();
        timestampLabel = `${day}-${month}-${year}`;
        timestampSecondary = parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      } else {
        const [datePart, timePart] = timestampRaw.split("T");
        if (datePart) {
          const [year, month, day] = datePart.split("-");
          const monthIndex = Number(month) - 1;
          const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const monthLabel = monthIndex >= 0 && monthIndex < monthLabels.length ? monthLabels[monthIndex] : month;
          timestampLabel = day && monthLabel && year ? `${day}-${monthLabel}-${year}` : datePart;
        }
        timestampSecondary = (timePart || "").slice(0, 5);
      }
    }
    const locationLabel = String(cfg.location ?? "").trim();
    const incidentTags = compactIncidentTags([
      locationLabel
        ? buildIncidentTag("location", "location", {
            iconSrc: incidentIconByValue("location"),
            label: locationLabel,
            pillBg: incidentPillBgByValue("location"),
          })
        : null,
      timestampLabel
        ? buildIncidentTag("timestamp", "timestamp", {
            iconSrc: incidentIconByValue("timestamp"),
            label: timestampSecondary ? `${timestampLabel} | ${timestampSecondary}` : timestampLabel,
            pillBg: incidentPillBgByValue("timestamp"),
          })
        : null,
    ]);
    const detailOpen = Boolean(cfg.incident_detail_open);
    return {
      id: flowId,
      type: "incidentSequenceStep",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: detailOpen ? incidentOpenDetailZIndex : 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(incidentCardWidth, el.width || incidentCardWidth),
        height:
          el.height === incidentDefaultWidth
            ? incidentExpandedHeight
            : Math.max(incidentExpandedHeight, el.height || incidentExpandedHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_sequence_step",
        typeName: "Sequence Step",
        title: "Sequence Step",
        description: getMethodologyNodeText(el),
        metaLabel: timestampLabel || undefined,
        metaSubLabel: locationLabel || undefined,
        metaLabelSecondary: timestampSecondary || undefined,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#bfdbfe",
        bannerText: "#111827",
        incidentTags,
        incidentDetailOpen: detailOpen,
        onToggleIncidentDetail: onToggleIncidentDetail ? (nextOpen) => onToggleIncidentDetail(el.id, nextOpen) : undefined,
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_outcome") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const consequenceCategory = String(cfg.consequence_category ?? "actual").trim().toLowerCase() || "actual";
    const likelihood = String(cfg.likelihood ?? "possible").trim().toLowerCase();
    const consequence = String(cfg.consequence ?? "moderate").trim().toLowerCase();
    const reportingConsequence = String(cfg.reporting_consequence ?? "").trim().toLowerCase();
    const outcomeHeaderLabel =
      consequenceCategory === "maximum_reasonable"
        ? "Potential Outcome"
        : consequenceCategory === "actual"
        ? "Actual Outcome"
        : consequenceCategory === "reporting"
        ? reportingConsequence === "externally_reported"
          ? "External Report"
          : reportingConsequence === "internally_reported"
          ? "Internal Report"
          : reportingConsequence === "reported_to_regulator"
          ? "Regulator Report"
          : reportingConsequence === "reported_elsewhere"
          ? "Report Elsewhere"
          : "Incident Outcome"
        : "Incident Outcome";
    const riskLevel =
      consequenceCategory === "reporting"
        ? ""
        : String(cfg.risk_level ?? calculateIncidentRiskLevel(likelihood, consequence)).trim().toLowerCase();
    const riskLevelLabel = riskLevel ? formatIncidentOptionLabel(riskLevel) : "";
    const reportingLabel = reportingConsequence ? formatIncidentOptionLabel(reportingConsequence) : "";
    const incidentTags =
      consequenceCategory === "reporting"
        ? compactIncidentTags([
            reportingConsequence
              ? buildIncidentTag("reporting_consequence", "other", {
                  iconSrc: "/icons/comments.svg",
                  label: reportingLabel,
                  pillBg: "#dbeafe",
                  pillText: "#111827",
                })
              : null,
          ])
        : compactIncidentTags([
            buildIncidentTag("likelihood", "timestamp", {
              iconSrc: "/icons/time.svg",
              label: `Likelihood: ${formatIncidentOptionLabel(likelihood)}`,
              pillBg: "#dbeafe",
              pillText: "#111827",
            }),
            buildIncidentTag("consequence", "damage", {
              iconSrc: "/icons/damage.svg",
              label: `Consequence: ${formatIncidentOptionLabel(consequence)}`,
              pillBg: "#fecdd3",
              pillText: "#111827",
            }),
            riskLevel
              ? buildIncidentTag("risk_level", "other", {
                  iconSrc: "/icons/other.svg",
                  label: `Risk Rating: ${riskLevelLabel}`,
                  pillBg: incidentRiskBgByLevel(riskLevel),
                  pillText: "#111827",
                })
              : null,
          ]);
    const detailOpen = Boolean(cfg.incident_detail_open);
    return {
      id: flowId,
      type: "incidentOutcome",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: detailOpen ? incidentOpenDetailZIndex : 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(incidentCardWidth, el.width || incidentCardWidth),
        height:
          el.height === incidentDefaultWidth
            ? incidentExpandedHeight
            : Math.max(incidentExpandedHeight, el.height || incidentExpandedHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_outcome",
        typeName: outcomeHeaderLabel,
        title: "Outcome",
        description: getMethodologyNodeText(el),
        metaLabel: consequenceCategory === "reporting" ? undefined : riskLevelLabel || undefined,
        metaLabelBg: consequenceCategory === "reporting" ? "#dbeafe" : incidentRiskBgByLevel(riskLevel),
        metaLabelText: "#111827",
        metaLabelBorder: "transparent",
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#ef4444",
        bannerText: "#ffffff",
        incidentTags,
        incidentDetailOpen: detailOpen,
        onToggleIncidentDetail: onToggleIncidentDetail ? (nextOpen) => onToggleIncidentDetail(el.id, nextOpen) : undefined,
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_task_condition") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const state = String(cfg.state ?? "normal").trim().toLowerCase();
    const stateLabel = state ? `${state.charAt(0).toUpperCase()}${state.slice(1)}` : "";
    const environmentalContext = String(cfg.environmental_context ?? "").trim();
    const incidentTags = compactIncidentTags([
      buildIncidentTag("state", state, {
        iconSrc: incidentIconByValue(state),
        label: stateLabel,
        pillBg: incidentPillBgByValue(state),
      }),
      environmentalContext
        ? buildIncidentTag("environmental_context", "other", {
            iconSrc: incidentIconByValue("other"),
            label: environmentalContext,
            pillBg: incidentPillBgByValue("other"),
          })
        : null,
    ]);
    const detailOpen = Boolean(cfg.incident_detail_open);
    return {
      id: flowId,
      type: "incidentTaskCondition",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: detailOpen ? incidentOpenDetailZIndex : 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(incidentCardWidth, el.width || incidentCardWidth),
        height:
          el.height === incidentFourThreeHeight
            ? incidentExpandedHeight
            : Math.max(incidentExpandedHeight, el.height || incidentExpandedHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_task_condition",
        typeName: "Task / Condition",
        title: "Task / Condition",
        description: getMethodologyNodeText(el),
        metaLabel: stateLabel || undefined,
        metaLabelBg: state === "abnormal" ? "#fecaca" : "#dcfce7",
        metaLabelText: "#111827",
        metaLabelBorder: "transparent",
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#fb923c",
        bannerText: "#111827",
        incidentTags,
        incidentDetailOpen: detailOpen,
        onToggleIncidentDetail: onToggleIncidentDetail ? (nextOpen) => onToggleIncidentDetail(el.id, nextOpen) : undefined,
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_factor") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const factorPresence = String(cfg.factor_presence ?? "present").trim().toLowerCase();
    const factorPresenceLabel = factorPresence ? `${factorPresence.charAt(0).toUpperCase()}${factorPresence.slice(1)}` : "";
    const factorPresenceBg = factorPresence === "absent" ? "#fecaca" : "#dcfce7";
    const factorClassification = String(cfg.factor_classification ?? "contributing").trim().toLowerCase();
    const factorClassificationLabel = factorClassification ? `${factorClassification.charAt(0).toUpperCase()}${factorClassification.slice(1)}` : "";
    const influenceTypeRaw = String(cfg.influence_type ?? "human").trim();
    const influenceTypeLabel = influenceTypeRaw
      ? `(${influenceTypeRaw
          .split("_")
          .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
          .join(" ")})`
      : "";
    const peopleInvolvedCount = Array.isArray(cfg.people_involved)
      ? cfg.people_involved.filter((value): value is string => typeof value === "string" && value.trim().length > 0).length
      : 0;
    const incidentTags = compactIncidentTags([
      peopleInvolvedCount > 0
        ? buildIncidentTag("people_involved", "people", {
            iconSrc: "/icons/account.svg",
            label: `${peopleInvolvedCount} ${peopleInvolvedCount === 1 ? "Person" : "People"} Involved`,
            pillBg: "#bfdbfe",
            pillText: "#111827",
          })
        : null,
      buildIncidentTag("influence_type", influenceTypeRaw, {
        iconSrc: incidentIconByValue(influenceTypeRaw),
        label: formatIncidentOptionLabel(influenceTypeRaw),
        pillBg: incidentPillBgByValue(influenceTypeRaw),
      }),
      buildIncidentTag("factor_classification", factorClassification, {
        iconSrc: incidentIconByValue(factorClassification),
        label: factorClassificationLabel,
        pillBg: incidentPillBgByValue(factorClassification),
      }),
      buildIncidentTag("factor_presence", factorPresence, {
        iconSrc: incidentIconByValue(factorPresence),
        label: factorPresenceLabel,
        pillBg: incidentPillBgByValue(factorPresence),
      }),
    ]);
    const detailOpen = Boolean(cfg.incident_detail_open);
    return {
      id: flowId,
      type: "incidentFactor",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: detailOpen ? incidentOpenDetailZIndex : 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(incidentCardWidth, el.width || incidentCardWidth),
        height: Math.max(incidentExpandedHeight, el.height || incidentExpandedHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_factor",
        typeName: "Factor",
        title: "Factor",
        description: getMethodologyNodeText(el),
        metaSubLabel: influenceTypeLabel || undefined,
        metaLabel: factorPresenceLabel || undefined,
        metaLabelSecondary: factorClassificationLabel || undefined,
        metaLabelBg: factorPresenceBg,
        metaLabelText: "#111827",
        metaLabelBorder: "transparent",
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#fde047",
        bannerText: "#111827",
        incidentTags,
        incidentDetailOpen: detailOpen,
        onToggleIncidentDetail: onToggleIncidentDetail ? (nextOpen) => onToggleIncidentDetail(el.id, nextOpen) : undefined,
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_system_factor") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const factorPresence = String(cfg.factor_presence ?? "present").trim().toLowerCase();
    const factorPresenceLabel = factorPresence ? `${factorPresence.charAt(0).toUpperCase()}${factorPresence.slice(1)}` : "";
    const factorPresenceBg = factorPresence === "absent" ? "#fecaca" : "#dcfce7";
    const factorClassification = String(cfg.factor_classification ?? "contributing").trim().toLowerCase();
    const factorClassificationLabel = factorClassification ? `${factorClassification.charAt(0).toUpperCase()}${factorClassification.slice(1)}` : "";
    const categoryRaw = String(cfg.category ?? "").trim();
    const categoryLabel = categoryRaw
      ? `(${categoryRaw
          .split("_")
          .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
          .join(" ")})`
      : "";
    const incidentTags = compactIncidentTags([
      categoryRaw
        ? buildIncidentTag("category", categoryRaw, {
            iconSrc: incidentIconByValue(categoryRaw),
            label: formatIncidentOptionLabel(categoryRaw),
            pillBg: incidentPillBgByValue(categoryRaw),
          })
        : null,
      buildIncidentTag("factor_classification", factorClassification, {
        iconSrc: incidentIconByValue(factorClassification),
        label: factorClassificationLabel,
        pillBg: incidentPillBgByValue(factorClassification),
      }),
      buildIncidentTag("factor_presence", factorPresence, {
        iconSrc: incidentIconByValue(factorPresence),
        label: factorPresenceLabel,
        pillBg: incidentPillBgByValue(factorPresence),
      }),
    ]);
    const detailOpen = Boolean(cfg.incident_detail_open);
    return {
      id: flowId,
      type: "incidentSystemFactor",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: detailOpen ? incidentOpenDetailZIndex : 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(incidentCardWidth, el.width || incidentCardWidth),
        height: Math.max(incidentExpandedHeight, el.height || incidentExpandedHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_system_factor",
        typeName: "System Factor",
        title: "System Factor",
        description: getMethodologyNodeText(el),
        metaSubLabel: categoryLabel || undefined,
        metaLabel: factorPresenceLabel || undefined,
        metaLabelSecondary: factorClassificationLabel || undefined,
        metaLabelBg: factorPresenceBg,
        metaLabelText: "#111827",
        metaLabelBorder: "transparent",
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#a78bfa",
        bannerText: "#111827",
        incidentTags,
        incidentDetailOpen: detailOpen,
        onToggleIncidentDetail: onToggleIncidentDetail ? (nextOpen) => onToggleIncidentDetail(el.id, nextOpen) : undefined,
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_control_barrier") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const barrierState = String(cfg.barrier_state ?? "effective").trim().toLowerCase();
    const barrierStateLabel = barrierState ? `${barrierState.charAt(0).toUpperCase()}${barrierState.slice(1)}` : "";
    const barrierRole = String(cfg.barrier_role ?? "preventive").trim().toLowerCase();
    const barrierRoleLabel = barrierRole ? `${barrierRole.charAt(0).toUpperCase()}${barrierRole.slice(1)}` : "";
    const controlTypeRaw = String(cfg.control_type ?? "").trim();
    const controlTypeLabel = controlTypeRaw
      ? `(${controlTypeRaw
          .split("_")
          .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
          .join(" ")})`
      : "";
    const incidentTags = compactIncidentTags([
      buildIncidentTag("barrier_role", barrierRole, {
        iconSrc: incidentIconByValue(barrierRole),
        label: barrierRoleLabel,
        pillBg: incidentPillBgByValue(barrierRole),
      }),
      buildIncidentTag("barrier_state", barrierState, {
        iconSrc: incidentIconByValue(barrierState),
        label: barrierStateLabel,
        pillBg: incidentPillBgByValue(barrierState),
      }),
      controlTypeRaw
        ? buildIncidentTag("control_type", controlTypeRaw, {
            iconSrc: incidentIconByValue(controlTypeRaw),
            label: formatIncidentOptionLabel(controlTypeRaw),
            pillBg: incidentPillBgByValue(controlTypeRaw),
          })
        : null,
    ]);
    const detailOpen = Boolean(cfg.incident_detail_open);
    return {
      id: flowId,
      type: "incidentControlBarrier",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: detailOpen ? incidentOpenDetailZIndex : 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(incidentCardWidth, el.width || incidentCardWidth),
        height: Math.max(incidentExpandedHeight, el.height || incidentExpandedHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_control_barrier",
        typeName: "Control / Barrier",
        title: "Control / Barrier",
        description: getMethodologyNodeText(el),
        metaSubLabel: controlTypeLabel || undefined,
        metaLabel: barrierStateLabel ? `${barrierRoleLabel} -> ${barrierStateLabel}` : undefined,
        metaLabelBg: barrierState === "failed" ? "#fee2e2" : barrierState === "missing" ? "#f3f4f6" : "#dcfce7",
        metaLabelText: "#111827",
        metaLabelBorder: "transparent",
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#4ade80",
        bannerText: "#111827",
        incidentTags,
        incidentDetailOpen: detailOpen,
        onToggleIncidentDetail: onToggleIncidentDetail ? (nextOpen) => onToggleIncidentDetail(el.id, nextOpen) : undefined,
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_evidence") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const evidenceTypeRaw = String(cfg.evidence_type ?? "").trim();
    const evidenceTypeLabel = evidenceTypeRaw
      ? `(${evidenceTypeRaw
          .split("_")
          .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
          .join(" ")})`
      : "";
    const mediaMime = String(cfg.media_mime ?? "").trim();
    const mediaName = String(cfg.media_name ?? "").trim();
    const showCanvasPreview = Boolean(cfg.show_canvas_preview);
    const mediaRotationRaw = Number(cfg.media_rotation_deg ?? 0);
    const mediaRotationDeg: 0 | 90 | 180 | 270 =
      mediaRotationRaw === 90 || mediaRotationRaw === 180 || mediaRotationRaw === 270 ? mediaRotationRaw : 0;
    const sourceText = String(cfg.source ?? "").trim();
    const incidentTags = compactIncidentTags([
      evidenceTypeRaw
        ? buildIncidentTag("evidence_type", evidenceTypeRaw, {
            iconSrc: incidentIconByValue(evidenceTypeRaw),
            label: formatIncidentOptionLabel(evidenceTypeRaw),
            pillBg: incidentPillBgByValue(evidenceTypeRaw),
          })
        : null,
      sourceText
        ? buildIncidentTag("source", "other", {
            iconSrc: incidentIconByValue("other"),
            label: sourceText,
            pillBg: incidentPillBgByValue("other"),
          })
        : null,
    ]);
    const detailOpen = Boolean(cfg.incident_detail_open);
    return {
      id: flowId,
      type: "incidentEvidence",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: detailOpen ? incidentOpenDetailZIndex : 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(incidentCardWidth, el.width || incidentCardWidth),
        height: Math.max(incidentExpandedHeight, el.height || incidentExpandedHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_evidence",
        typeName: "Evidence",
        title: "Evidence",
        description: getMethodologyNodeText(el),
        metaSubLabel: evidenceTypeLabel || undefined,
        evidenceMediaUrl: imageUrlsByElementId[el.id],
        evidenceMediaMime: mediaMime || undefined,
        evidenceMediaName: mediaName || undefined,
        evidenceShowPreview: showCanvasPreview,
        evidenceMediaRotationDeg: mediaRotationDeg,
        onOpenEvidenceMedia: onOpenEvidenceMedia ? () => onOpenEvidenceMedia(el.id) : undefined,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#cbd5e1",
        bannerText: "#111827",
        incidentTags,
        incidentDetailOpen: detailOpen,
        onToggleIncidentDetail: onToggleIncidentDetail ? (nextOpen) => onToggleIncidentDetail(el.id, nextOpen) : undefined,
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_response_recovery") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const categoryRaw = String(cfg.category ?? "").trim();
    const categoryPalette = incidentResponseRecoveryPaletteByCategory(categoryRaw);
    return {
      id: flowId,
      type: "incidentResponseRecovery",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(incidentCardWidth, el.width || incidentCardWidth),
        height: Math.max(incidentExpandedHeight, el.height || incidentExpandedHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_response_recovery",
        typeName: "Response / Recovery",
        title: "Response / Recovery",
        description: getMethodologyNodeText(el),
        metaLabel: categoryRaw ? formatIncidentOptionLabel(categoryRaw) : undefined,
        metaLabelBg: categoryPalette.background,
        metaLabelText: categoryPalette.text,
        metaLabelBorder: categoryPalette.border,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#ec4899",
        bannerText: "#ffffff",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_finding") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const description = getMethodologyNodeText(el);
    const minimumFindingHeight = minorGridSize * 6;
    return {
      id: flowId,
      type: "incidentFinding",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(incidentCardWidth, el.width || incidentCardWidth),
        height: Math.max(minimumFindingHeight, el.height || minimumFindingHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_finding",
        typeName: "Finding",
        title: "Finding",
        description,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#1d4ed8",
        bannerText: "#ffffff",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_recommendation") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const ownerText = String(cfg.owner_text ?? "").trim();
    const incidentTags = ownerText
      ? compactIncidentTags([
          buildIncidentTag("owner_text", "other", {
            iconSrc: incidentIconByValue("other"),
            label: ownerText,
            pillBg: incidentPillBgByValue("other"),
          }),
        ])
      : [];
    const detailOpen = Boolean(cfg.incident_detail_open);
    return {
      id: flowId,
      type: "incidentRecommendation",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: detailOpen ? incidentOpenDetailZIndex : 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(incidentCardWidth, el.width || incidentCardWidth),
        height: Math.max(incidentExpandedHeight, el.height || incidentExpandedHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_recommendation",
        typeName: "Recommendation",
        title: "Recommendation",
        description: getMethodologyNodeText(el),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#14b8a6",
        bannerText: "#111827",
        incidentTags,
        incidentDetailOpen: detailOpen,
        onToggleIncidentDetail: onToggleIncidentDetail ? (nextOpen) => onToggleIncidentDetail(el.id, nextOpen) : undefined,
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }

  return {
    id: flowId,
    type: "processHeading",
    position: { x: el.pos_x, y: el.pos_y },
    zIndex: 30,
    selected: isMarked,
    draggable: canEditThis,
    selectable: canWriteMap,
    style: {
      width: Math.max(processMinWidth, el.width || processHeadingWidth),
      height: el.height || processHeadingHeight,
      borderRadius: 0,
      border: "none",
      background: "transparent",
      boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
      padding: 0,
      overflow: "hidden",
    },
    data: {
      entityKind: "category",
      typeName: "Category",
      title: el.heading ?? "New Category",
      categoryColor: el.color_hex ?? defaultCategoryColor,
      categoryFillMode: String(((el.element_config as Record<string, unknown> | null) ?? {}).fill_mode ?? "fill") === "outline" ? "outline" : "fill",
      categoryOutlineColor:
        typeof ((el.element_config as Record<string, unknown> | null) ?? {}).outline_color === "string"
          ? String(((el.element_config as Record<string, unknown> | null) ?? {}).outline_color)
          : el.color_hex ?? defaultCategoryColor,
      categoryOutlineWidth: (() => {
        const raw = Number(((el.element_config as Record<string, unknown> | null) ?? {}).outline_width ?? 1);
        return Number.isFinite(raw) ? Math.max(1, Math.min(12, Math.round(raw))) : 1;
      })(),
      textStyle: {
        fontSize: Math.max(10, Math.min(72, Number(((el.element_config as Record<string, unknown> | null) ?? {}).font_size ?? 12) || 12)),
      },
      userGroup: "",
      disciplineKeys: [],
      bannerBg: "#000000",
      bannerText: "#ffffff",
      isLandscape: true,
      isUnconfigured: false,
    },
  };
};
