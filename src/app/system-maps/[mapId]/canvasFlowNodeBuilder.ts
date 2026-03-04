"use client";

import type { Node } from "@xyflow/react";
import type { CanvasElementRow, NodeRelationRow } from "./canvasShared";
import {
  bowtieControlHeight,
  bowtieDefaultWidth,
  bowtieHazardHeight,
  bowtieRiskRatingHeight,
  bowtieSquareHeight,
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
  processFlowId,
  stickyDefaultSize,
  stickyMinSize,
  systemCircleDiameter,
  systemCircleElementHeight,
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
  return groupingElements.map((el): Node<FlowData> => {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
    return {
      id: flowId,
      type: "groupingContainer",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 1,
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
        bannerBg: "#ffffff",
        bannerText: "#111827",
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
  canEditElement: (element: CanvasElementRow) => boolean;
  canWriteMap: boolean;
  mapCategoryId: MapCategoryId;
  userId: string | null;
  userEmail: string;
  memberDisplayNameByUserId: Map<string, string>;
  formatStickyDate: (value: string | null | undefined) => string;
  imageUrlsByElementId: Record<string, string | undefined>;
  directReportCountByPersonNormalizedId: Map<string, number>;
  orgDirectReportCountByPersonId: Map<string, number>;
}): Node<FlowData> | null | undefined => {
  const {
    element: el,
    selectedFlowIds,
    canEditElement,
    canWriteMap,
    mapCategoryId,
    userId,
    userEmail,
    memberDisplayNameByUserId,
    formatStickyDate,
    imageUrlsByElementId,
    directReportCountByPersonNormalizedId,
    orgDirectReportCountByPersonId,
  } = params;

  if (el.element_type === "grouping_container") return null;

  if (el.element_type === "sticky_note") {
    const flowId = processFlowId(el.id);
    const isMarked = selectedFlowIds.has(flowId);
    const canEditThis = canEditElement(el);
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
        bannerBg: "#fef08a",
        bannerText: "#000000",
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
}): Node<FlowData> => {
  const { element: el, selectedFlowIds, canEditElement, canWriteMap } = params;
  const flowId = processFlowId(el.id);
  const isMarked = selectedFlowIds.has(flowId);
  const canEditThis = canEditElement(el);

  if (el.element_type === "bowtie_hazard") {
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
        title: el.heading ?? "Hazard",
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
        title: el.heading ?? "Top Event",
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
        title: el.heading ?? "Threat",
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
        title: el.heading ?? "Consequence",
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
        title: el.heading ?? "Control",
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
        title: el.heading ?? "Escalation Factor",
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
        title: el.heading ?? "Recovery Measure",
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
        title: el.heading ?? "Degradation Indicator",
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
        title: el.heading ?? "Risk Level: Medium",
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
    return {
      id: flowId,
      type: "incidentSequenceStep",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(bowtieDefaultWidth, el.width || bowtieDefaultWidth),
        height:
          el.height === incidentDefaultWidth
            ? bowtieControlHeight
            : Math.max(bowtieControlHeight, el.height || bowtieControlHeight),
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
        title: el.heading ?? "Sequence Step",
        description: String(cfg.description ?? "").trim(),
        metaLabel: timestampLabel || undefined,
        metaSubLabel: locationLabel || undefined,
        metaLabelSecondary: timestampSecondary || undefined,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#bfdbfe",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_outcome") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const impactType = String(cfg.impact_type ?? "").trim();
    const impactLabel = impactType
      ? `${impactType
          .split("_")
          .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
          .join(" ")} Impact`
      : "";
    return {
      id: flowId,
      type: "incidentOutcome",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(bowtieDefaultWidth, el.width || bowtieDefaultWidth),
        height:
          el.height === incidentDefaultWidth
            ? bowtieControlHeight
            : Math.max(bowtieControlHeight, el.height || bowtieControlHeight),
        borderRadius: 0,
        border: "none",
        background: "transparent",
        boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
        padding: 0,
        overflow: "visible",
      },
      data: {
        entityKind: "incident_outcome",
        typeName: "Outcome",
        title: el.heading ?? "Outcome",
        description: String(cfg.description ?? "").trim(),
        metaLabel: impactLabel || undefined,
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#ef4444",
        bannerText: "#ffffff",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_task_condition") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const state = String(cfg.state ?? "normal").trim().toLowerCase();
    const stateLabel = state ? `${state.charAt(0).toUpperCase()}${state.slice(1)}` : "";
    return {
      id: flowId,
      type: "incidentTaskCondition",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(bowtieDefaultWidth, el.width || bowtieDefaultWidth),
        height:
          el.height === incidentFourThreeHeight
            ? bowtieControlHeight
            : Math.max(bowtieControlHeight, el.height || bowtieControlHeight),
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
        title: el.heading ?? "Task / Condition",
        description: String(cfg.description ?? "").trim(),
        metaLabel: stateLabel || undefined,
        metaLabelBg: state === "abnormal" ? "#fecaca" : "#dcfce7",
        metaLabelText: "#111827",
        metaLabelBorder: "transparent",
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#fb923c",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_factor") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    return {
      id: flowId,
      type: "incidentFactor",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(bowtieDefaultWidth, el.width || bowtieDefaultWidth),
        height: Math.max(bowtieControlHeight, el.height || bowtieControlHeight),
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
        title: el.heading ?? "Factor",
        description: String(cfg.description ?? "").trim(),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#fde047",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_system_factor") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    return {
      id: flowId,
      type: "incidentSystemFactor",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(bowtieDefaultWidth, el.width || bowtieDefaultWidth),
        height: Math.max(bowtieControlHeight, el.height || bowtieControlHeight),
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
        title: el.heading ?? "System Factor",
        description: String(cfg.description ?? "").trim(),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#a78bfa",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_control_barrier") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    return {
      id: flowId,
      type: "incidentControlBarrier",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(bowtieDefaultWidth, el.width || bowtieDefaultWidth),
        height: Math.max(bowtieControlHeight, el.height || bowtieControlHeight),
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
        title: el.heading ?? "Control / Barrier",
        description: String(cfg.description ?? "").trim(),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#4ade80",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_evidence") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    return {
      id: flowId,
      type: "incidentEvidence",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(bowtieDefaultWidth, el.width || bowtieDefaultWidth),
        height: Math.max(bowtieControlHeight, el.height || bowtieControlHeight),
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
        title: el.heading ?? "Evidence",
        description: String(cfg.description ?? "").trim(),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#cbd5e1",
        bannerText: "#111827",
        isLandscape: true,
        isUnconfigured: false,
      },
    };
  }
  if (el.element_type === "incident_finding") {
    const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
    const description = String(cfg.description ?? "").trim();
    const lineCount = description
      ? description.split(/\r?\n/).reduce((count, line) => count + Math.max(1, Math.ceil(line.length / 24)), 0)
      : 1;
    const descriptionHeight = Math.max(minorGridSize, lineCount * 14 + 10);
    const autoHeight = minorGridSize * 2 + descriptionHeight + 8;
    return {
      id: flowId,
      type: "incidentFinding",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(bowtieDefaultWidth, el.width || bowtieDefaultWidth),
        height: Math.max(autoHeight, el.height || autoHeight),
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
        title: el.heading ?? "Finding",
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
    return {
      id: flowId,
      type: "incidentRecommendation",
      position: { x: el.pos_x, y: el.pos_y },
      zIndex: 30,
      selected: isMarked,
      draggable: canEditThis,
      selectable: canWriteMap,
      style: {
        width: Math.max(bowtieDefaultWidth, el.width || bowtieDefaultWidth),
        height: Math.max(bowtieControlHeight, el.height || bowtieControlHeight),
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
        title: el.heading ?? "Recommendation",
        description: String(cfg.description ?? "").trim(),
        userGroup: "",
        disciplineKeys: [],
        bannerBg: "#14b8a6",
        bannerText: "#111827",
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
      userGroup: "",
      disciplineKeys: [],
      bannerBg: "#000000",
      bannerText: "#ffffff",
      isLandscape: true,
      isUnconfigured: false,
    },
  };
};
