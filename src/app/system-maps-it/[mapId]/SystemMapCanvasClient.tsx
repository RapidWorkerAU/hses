"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  type Edge,
  type NodeChange,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type BillingAccessState } from "@/lib/access";
import {
  hasActiveTemplateAccess,
  templateAccessDisabledReason,
  type InvestigationTemplateVisibility,
} from "@/lib/investigationTemplates";
import { supabaseBrowser } from "@/lib/supabase/client";
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
  incidentDefaultWidth,
  incidentCardHeight,
  incidentCardWidth,
  incidentFourThreeHeight,
  incidentSquareSize,
  incidentThreeOneHeight,
  incidentThreeTwoHeight,
  type AnchorLinkRow,
  type CanvasElementRow,
  categoryColorOptions,
  clamp,
  defaultHeight,
  defaultWidth,
  type DisciplineKey,
  disciplineKeySet,
  disciplineLabelByKey,
  disciplineOptions,
  getElementDisplayName,
  getElementRelationshipDisplayLabel,
  type DocumentNodeRow,
  type DocumentTypeRow,
  getCanonicalTypeName,
  getDisplayRelationType,
  getDisplayTypeName,
  getNormalizedDocumentSize,
  getRelationshipCategoryLabel,
  getRelationshipCategoryOptions,
  getDefaultRelationshipCategoryForMap,
  normalizeRelationshipCategoryForMap,
  getRelationshipDisciplineLetters,
  groupingDefaultHeight,
  groupingDefaultWidth,
  groupingMinHeight,
  groupingMinHeightSquares,
  groupingMinWidth,
  groupingMinWidthSquares,
  isAbortLikeError,
  isLandscapeTypeName,
  landscapeDefaultHeight,
  landscapeDefaultWidth,
  majorGridSize,
  minorGridSize,
  type FlowData,
  type NodeRelationRow,
  type OutlineItemRow,
  parseDisciplines,
  parseEquipmentLabels,
  parseEnvironmentLabels,
  buildPersonHeading,
  parsePersonLabels,
  parseOrgChartPersonConfig,
  orgChartDepartmentOptions,
  parseProcessFlowId,
  processComponentElementHeight,
  processComponentWidth,
  processFlowId,
  processHeadingHeight,
  processHeadingWidth,
  processMinHeight,
  processMinHeightSquares,
  processMinWidth,
  processMinWidthSquares,
  type RelationshipCategory,
  type SelectionMarquee,
  serializeDisciplines,
  stickyDefaultSize,
  stickyMinSize,
  imageDefaultWidth,
  imageMinWidth,
  imageMinHeight,
  textBoxDefaultWidth,
  textBoxDefaultHeight,
  textBoxMinWidth,
  textBoxMinHeight,
  tableDefaultHeight,
  tableDefaultWidth,
  tableMinHeight,
  tableMinColumns,
  tableMinWidth,
  tableMinRows,
  shapeRectangleDefaultWidth,
  shapeRectangleDefaultHeight,
  shapeCircleDefaultSize,
  shapePillDefaultWidth,
  shapePillDefaultHeight,
  shapePentagonDefaultWidth,
  shapePentagonDefaultHeight,
  shapeArrowDefaultWidth,
  shapeArrowDefaultHeight,
  shapeArrowMinWidth,
  shapeArrowMinHeight,
  shapeMinWidth,
  shapeMinHeight,
  shapeDefaultFillColor,
  systemCircleDiameter,
  systemCircleElementHeight,
  type SystemMap,
  type MapMemberProfileRow,
  type SystemMapCanvasSnapshot,
  unconfiguredDocumentTitle,
  userGroupOptions,
  boxesOverlap,
  personElementWidth,
  personElementHeight,
  orgChartPersonWidth,
  orgChartPersonHeight,
} from "./canvasShared";
import { flowNodeTypes } from "./canvasNodes";
import { CanvasActionButtons, MapInfoAside } from "./canvasPanels";
import { MapCanvasHeader } from "./canvasHeader";
import { flowEdgeTypes } from "./canvasEdges";
import { buildFlowEdgesBase } from "./canvasEdgeBuilder";
import { CanvasPrintOverlay } from "./canvasPrintOverlay";
import { CanvasFloatingOverlays } from "./canvasFloatingOverlays";
import { MobileAddRelationshipModal, MobileNodeActionSheet } from "./canvasMobileOverlays";
import { CanvasDrilldownOverlays } from "./canvasDrilldownAsides";
import { CanvasConfirmDialogs } from "./canvasDialogs";
import { CanvasElementPropertyOverlays } from "./canvasPropertyOverlays";
import { CanvasNodeSelectionToolbar } from "./canvasNodeSelectionToolbar";
import { GuestMapNotesLayer } from "./GuestMapNotesLayer";
import { SystemMapWelcomeModal } from "./SystemMapWelcomeModal";
import { CanvasHelpModal } from "./CanvasHelpModal";
import { defaultMapCategoryId, getAllowedNodeKindsForCategory, type MapCategoryId } from "./mapCategories";
import { useCanvasRelationNodeActions } from "./useCanvasRelationNodeActions";
import { useCanvasElementActions } from "./useCanvasElementActions";
import { useCanvasDeleteSelectionActions } from "./useCanvasDeleteSelectionActions";
import { useCanvasMapInfoActions } from "./useCanvasMapInfoActions";
import { useCanvasOutlineActions } from "./useCanvasOutlineActions";
import { useCanvasPaneSelectionActions } from "./useCanvasPaneSelectionActions";
import { useCanvasNodeDragStop } from "./useCanvasNodeDragStop";
import { useCanvasRelationshipDerived } from "./useCanvasRelationshipDerived";
import { useCanvasImageUpload } from "./useCanvasImageUpload";
import { useCanvasAsideController } from "./useCanvasAsideController";
import { usePrimaryAsideRegistry } from "./usePrimaryAsideRegistry";
import { useCanvasRelationshipController } from "./useCanvasRelationshipController";
import { useMapSuggestions } from "./useMapSuggestions";
import { useInvestigationTemplates } from "./useInvestigationTemplates";
import { useMapSessionHistory } from "./useMapSessionHistory";
import { useCanvasPrintController } from "./useCanvasPrintController";
import { useCanvasSearch } from "./useCanvasSearch";
import { useSystemMapBootstrap } from "./useSystemMapBootstrap";
import { formatShortAuDate } from "./dateFormatters";
import { resolveMapSessionHistorySnapshotState, type MapSessionHistorySnapshot } from "./mapSnapshotUtils";
import { useOutsidePointerDismiss, useStackedOutsidePointerDismiss } from "./useOutsidePointerDismiss";
import { handleCanvasNodeClick } from "./canvasNodeClickHandler";
import { syncCanvasSelectionFromFlowNode, type CanvasSelectionSetters } from "./canvasSelection";
import {
  SystemMapWizardModal,
  type SystemMapWizardCommitPayload,
} from "./SystemMapWizardModal";
import {
  buildDocumentFlowNodes,
  buildGroupingFlowNodes,
  buildPrimaryElementFlowNode,
  buildSecondaryElementFlowNode,
  buildOrgDirectReportCountByPersonNormalizedId,
  sortGroupingElementsForRender,
} from "./canvasFlowNodeBuilder";
import {
  PRINT_HEADER_HEIGHT_PX,
} from "./canvasPrintUtils";
import { SystemMapLoadingView } from "./SystemMapLoadingView";

const canvasElementSelectColumns =
  "id,map_id,element_type,heading,color_hex,created_by_user_id,element_config,pos_x,pos_y,width,height,created_at,updated_at";
const platformAdminUserId = "420266a0-2087-4f36-8c28-340443dd1a82";
const isMethodologyElementType = (elementType: string) =>
  elementType.startsWith("bowtie_") || elementType.startsWith("incident_");
const areStringSetsEqual = (left: Set<string>, right: Set<string>) => {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
};
const methodologyDefaultLabelByType: Record<string, string> = {
  bowtie_hazard: "Hazard",
  bowtie_top_event: "Top Event",
  bowtie_threat: "Threat",
  bowtie_consequence: "Consequence",
  bowtie_control: "Control",
  bowtie_escalation_factor: "Escalation Factor",
  bowtie_recovery_measure: "Recovery Measure",
  bowtie_degradation_indicator: "Degradation Indicator",
  bowtie_risk_rating: "Risk Level: Medium",
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

const getMethodologyEditableLabel = (elementType: string, headingRaw: string | null | undefined) => {
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

type CanvasElementInsertPayload = {
  map_id: string;
  element_type: string;
  heading: string;
  color_hex: string | null;
  created_by_user_id: string | null;
  element_config?: Record<string, unknown> | null;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
};

type CanvasElementUpdatePayload = {
  id: string;
  fields: Partial<Pick<CanvasElementRow, "heading" | "element_config" | "pos_x" | "pos_y" | "width" | "height">>;
};

type OrgAccessCandidate = {
  userId: string;
  fullName: string;
  email: string;
  organisations: string[];
  currentRole: "read" | "partial_write" | "full_write" | null;
};

type BowtieDraftState = Record<string, string | boolean | string[]>;

const stepGroupHeadingByWizardStep: Record<SystemMapWizardCommitPayload["step"], string> = {
  sequence: "Sequence",
  outcome: "Outcomes",
  people: "People",
  "task-condition": "Task / Condition",
  factors: "Factors",
  "control-barrier": "Controls / Barriers",
  evidence: "Evidence",
  "response-recovery": "Response / Recovery",
  finding: "Findings",
  recommendation: "Recommendations",
};

const stepElementTypesByWizardStep: Record<SystemMapWizardCommitPayload["step"], string[]> = {
  sequence: ["incident_sequence_step"],
  outcome: ["incident_outcome"],
  people: ["person"],
  "task-condition": ["incident_task_condition"],
  factors: ["incident_factor", "incident_system_factor"],
  "control-barrier": ["incident_control_barrier"],
  evidence: ["incident_evidence"],
  "response-recovery": ["incident_response_recovery"],
  finding: ["incident_finding"],
  recommendation: ["incident_recommendation"],
};

function SystemMapCanvasInner({
  mapId,
  showWelcomeOnLoad,
  templateEditorTemplateId,
  templateEditorTemplateName,
  templateEditorVisibility,
  entrySource,
  viewerMode,
  initialSnapshot,
  guestSessionEmail,
  guestCampaignSlug,
}: {
  mapId: string;
  showWelcomeOnLoad: boolean;
  templateEditorTemplateId: string | null;
  templateEditorTemplateName: string | null;
  templateEditorIsGlobal: boolean;
  templateEditorVisibility: InvestigationTemplateVisibility;
  entrySource: "dashboard" | "templates";
  viewerMode: "member" | "guest";
  initialSnapshot: SystemMapCanvasSnapshot | null;
  guestSessionEmail: string | null;
  guestCampaignSlug: string | null;
}) {
  const isGuestViewer = viewerMode === "guest";
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const relationshipPopupRef = useRef<HTMLDivElement | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const suggestionMenuRef = useRef<HTMLDivElement | null>(null);
  const templateMenuRef = useRef<HTMLDivElement | null>(null);
  const searchMenuRef = useRef<HTMLDivElement | null>(null);
  const printMenuRef = useRef<HTMLDivElement | null>(null);
  const mapInfoAsideRef = useRef<HTMLDivElement | null>(null);
  const mapInfoButtonRef = useRef<HTMLButtonElement | null>(null);
  const disciplineMenuRef = useRef<HTMLDivElement | null>(null);
  const saveViewportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorNavigateRef = useRef<((anchorId: string, direction: "previous" | "next") => void) | null>(null);
  const resizePersistTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const resizePersistValuesRef = useRef<Map<string, { width: number; height: number }>>(new Map());
  const savedPos = useRef<Record<string, { x: number; y: number }>>({});
  const convertedMediaObjectUrlsRef = useRef<Set<string>>(new Set());
  const lastMobileTapRef = useRef<{ id: string; ts: number } | null>(null);
  const clipboardPasteCountRef = useRef(1);
  const isNodeDragActiveRef = useRef(false);
  const flowNodesRef = useRef<Node<FlowData>[]>([]);
  const pendingFlowNodePositionChangesRef = useRef<NodeChange<Node<FlowData>>[]>([]);
  const flowNodeChangeFrameRef = useRef<number | null>(null);
  const imagePathPairsRef = useRef<Array<{ id: string; path: string }>>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [mapRole, setMapRole] = useState<"read" | "partial_write" | "full_write" | null>(null);
  const [accessState, setAccessState] = useState<BillingAccessState | null>(null);
  const [map, setMap] = useState<SystemMap | null>(null);
  const [mapCategoryId, setMapCategoryId] = useState<MapCategoryId>(defaultMapCategoryId);
  const [types, setTypes] = useState<DocumentTypeRow[]>([]);
  const [nodes, setNodes] = useState<DocumentNodeRow[]>([]);
  const [elements, setElements] = useState<CanvasElementRow[]>([]);
  const [relations, setRelations] = useState<NodeRelationRow[]>([]);
  const [anchorLinks, setAnchorLinks] = useState<AnchorLinkRow[]>([]);
  const [outlineItems, setOutlineItems] = useState<OutlineItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(25);
  const [loadingMessage, setLoadingMessage] = useState("Checking workspace access...");
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px), (pointer: coarse)").matches || window.innerWidth <= 768;
  });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isEditingMapTitle, setIsEditingMapTitle] = useState(false);
  const [mapTitleDraft, setMapTitleDraft] = useState("");
  const [savingMapTitle, setSavingMapTitle] = useState(false);
  const [mapTitleSavedFlash, setMapTitleSavedFlash] = useState(false);
  const [showMapInfoAside, setShowMapInfoAside] = useState(false);
  const [isEditingMapInfo, setIsEditingMapInfo] = useState(false);
  const [mapInfoNameDraft, setMapInfoNameDraft] = useState("");
  const [mapInfoDescriptionDraft, setMapInfoDescriptionDraft] = useState("");
  const [mapCodeDraft, setMapCodeDraft] = useState("");
  const [savingMapInfo, setSavingMapInfo] = useState(false);
  const [mapMembers, setMapMembers] = useState<MapMemberProfileRow[]>([]);
  const [savingMemberRoleUserId, setSavingMemberRoleUserId] = useState<string | null>(null);
  const [orgAccessCandidates, setOrgAccessCandidates] = useState<OrgAccessCandidate[]>([]);
  const [orgAccessSearch, setOrgAccessSearch] = useState("");
  const [orgAccessLoading, setOrgAccessLoading] = useState(false);
  const [orgAccessError, setOrgAccessError] = useState<string | null>(null);
  const [grantingOrgAccessUserId, setGrantingOrgAccessUserId] = useState<string | null>(null);
  const [showOrgAccessModal, setShowOrgAccessModal] = useState(false);
  const [ownerHasActiveOrganisation, setOwnerHasActiveOrganisation] = useState(false);

  const [rf, setRf] = useState<{
    fitView: (opts?: { duration?: number; padding?: number }) => void;
    screenToFlowPosition: (pt: { x: number; y: number }) => { x: number; y: number };
    setViewport: (v: Viewport, opts?: { duration?: number }) => void;
  } | null>(null);
  const [pendingViewport, setPendingViewport] = useState<Viewport | null>(null);
  const [hasStoredViewport, setHasStoredViewport] = useState(false);
  const mobileViewportInitializedRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (anchorNoticeTimerRef.current) clearTimeout(anchorNoticeTimerRef.current);
    };
  }, []);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSuggestionsMenu, setShowSuggestionsMenu] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [wizardSaving, setWizardSaving] = useState(false);
  const [isNodeDragActive, setIsNodeDragActive] = useState(false);
  const [hasCurrentPassAssignment, setHasCurrentPassAssignment] = useState(true);
  const {
    printPreviewFrameRef,
    showPrintMenu,
    setShowPrintMenu,
    isPreparingPrint,
    showPrintPreview,
    printPreviewHtml,
    printOrientation,
    setPrintOrientation,
    printSelectionMode,
    isCopyingPrintImage,
    printSelectionCopyMessage,
    activePrintSelectionRect,
    showPrintSelectionConfirm,
    setShowPrintPreview,
    exitPrintSelectionMode,
    handlePrintCurrentView,
    handlePrintSelectArea,
    handleConfirmPrintArea,
    handleCopyPrintAreaImageToClipboard,
    handlePrintOverlayPointerDown,
    handlePrintOverlayPointerMove,
    handlePrintOverlayPointerUp,
  } = useCanvasPrintController({
    canvasRef,
    mapTitle: map?.title || "System Map",
    setError,
  });
  const {
    showSearchMenu,
    setShowSearchMenu,
    searchQuery,
    setSearchQuery,
    searchCatalog,
    searchResults,
    handleSelectSearchResult,
  } = useCanvasSearch({
    rf,
    canvasRef,
    types,
    nodes,
    elements,
    outlineItems,
  });
  const snapToMinorGrid = useCallback((v: number) => Math.round(v / minorGridSize) * minorGridSize, []);
  const getCanvasFlowCenter = useCallback(() => {
    if (!rf || !canvasRef.current) return null;
    const bounds = canvasRef.current.getBoundingClientRect();
    const flowPoint = rf.screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    });
    return {
      x: snapToMinorGrid(flowPoint.x),
      y: snapToMinorGrid(flowPoint.y),
    };
  }, [rf, snapToMinorGrid]);
  const passScopedWriteBlocked =
    accessState?.currentAccessStatus === "active" &&
    accessState.currentAccessType === "pass_30d" &&
    !hasCurrentPassAssignment;
  const accessAllowsEditing = !isGuestViewer && (accessState?.canEditMaps ?? true) && !passScopedWriteBlocked;
  const canSaveTemplate = hasActiveTemplateAccess(accessState);
  const isTemplateEditor = Boolean(templateEditorTemplateId);
  const isPlatformAdmin = userId === platformAdminUserId || accessState?.userId === platformAdminUserId;
  const canWriteMap = accessAllowsEditing && (mapRole === "partial_write" || mapRole === "full_write");
  const canManageMapMetadata = accessAllowsEditing && mapRole === "full_write" && !!map && !!userId && map.owner_id === userId;
  const canUseContextMenu = accessAllowsEditing && mapRole !== "read";
  const canCreateSticky = accessAllowsEditing && !!userId;
  const allowedNodeKinds = useMemo(() => getAllowedNodeKindsForCategory(mapCategoryId), [mapCategoryId]);
  const canUseWizard = canWriteMap && allowedNodeKinds.some((kind) => kind.startsWith("incident_"));
  const canUseSuggestionCheck = !isGuestViewer && !!map;
  const {
    isLoadingSuggestions,
    suggestionProgress,
    mapSuggestions,
    suggestionError,
    suggestionsLastUpdatedAt,
    loadPersistedMapSuggestions,
    handleDismissMapSuggestion,
    handleRunSuggestionCheck,
  } = useMapSuggestions({
    canUseSuggestionCheck,
    map,
    mapId,
    mapCategoryId,
    types,
    nodes,
    elements,
    relations,
    userId,
  });
  const readOnlyActionReason = !accessAllowsEditing
    ? passScopedWriteBlocked
      ? "This map belongs to an older 30 Day Access period. Start monthly access to restore full editing across older pass maps."
      : accessState?.readOnlyReason || "This map is read only for your current access."
    : undefined;
  const deleteDisabledReason = !canWriteMap
    ? readOnlyActionReason || "You have view access only for this map."
    : undefined;
  const backHref = entrySource === "templates" ? "/templates" : "/dashboard";
  const backTitle = entrySource === "templates" ? "Back to templates" : "Back to dashboard";
  const canPrintMap = accessAllowsEditing;
  const addDisabledReason = !accessAllowsEditing
    ? accessState?.readOnlyReason || "This map is read only for your current access."
    : "Adding components is unavailable for this map.";
  const wizardDisabledReason = !accessAllowsEditing
    ? accessState?.readOnlyReason || "The wizard is unavailable while this map is read only."
    : "The wizard is unavailable for this map.";
  const templateDisabledReason = canSaveTemplate ? undefined : templateAccessDisabledReason;
  useEffect(() => {
    if (!showWelcomeOnLoad) return;
    setShowWelcomeModal(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("welcome") === "1") {
        url.searchParams.delete("welcome");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    }
  }, [showWelcomeOnLoad]);
  const relationshipCategoryOptions = useMemo(() => getRelationshipCategoryOptions(mapCategoryId), [mapCategoryId]);
  const canEditElement = useCallback(
    (element: CanvasElementRow) =>
      canWriteMap || (mapRole === "read" && element.element_type === "sticky_note" && !!userId && element.created_by_user_id === userId),
    [canWriteMap, mapRole, userId]
  );
  const mapRoleLabel = useCallback((role: string | null | undefined) => {
    const normalized = (role || "").toLowerCase();
    if (normalized === "full_write") return "Full write";
    if (normalized === "partial_write") return "Partial write";
    return "Read";
  }, []);
  const formatStickyDate = useCallback(formatShortAuDate, []);
  const {
    showTemplateMenu,
    setShowTemplateMenu,
    templateQuery,
    templateResults,
    isLoadingTemplates,
    isSavingTemplate,
    templateSaveMessage,
    templateVisibility,
    handleTemplateQueryChange,
    handleSelectTemplateResult,
    handleSetTemplateVisibility,
    handleSaveTemplate,
  } = useInvestigationTemplates({
    canSaveTemplate,
    formatStickyDate,
    setError,
    initialTemplateVisibility: templateEditorVisibility,
    isTemplateEditor,
    templateEditorTemplateId,
    templateEditorTemplateName,
    templateEditorVisibility,
    loading,
    map,
    types,
    nodes,
    elements,
    relations,
    anchorLinks,
    outlineItems,
  });
  const memberDisplayNameByUserId = useMemo(() => {
    const m = new Map<string, string>();
    mapMembers.forEach((member) => {
      const label = member.full_name?.trim() || member.email?.trim() || member.user_id;
      if (label) m.set(member.user_id, label);
    });
    return m;
  }, [mapMembers]);
  const anchorElements = useMemo(
    () => elements.filter((element) => element.element_type === "anchor"),
    [elements]
  );
  const anchorById = useMemo(
    () => new Map(anchorElements.map((anchor) => [anchor.id, anchor])),
    [anchorElements]
  );
  const getAnchorCreatorName = useCallback(
    (anchor: CanvasElementRow) =>
      (anchor.created_by_user_id ? memberDisplayNameByUserId.get(anchor.created_by_user_id) : null) ||
      (anchor.created_by_user_id === userId ? userEmail : null) ||
      "Unknown user",
    [memberDisplayNameByUserId, userEmail, userId]
  );
  const anchorSequenceNumberById = useMemo(() => {
    const sequenceNumbers = new Map<string, number>();
    const anchors = anchorElements
      .slice()
      .sort((a, b) => {
        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (createdA !== createdB) return createdA - createdB;
        return a.id.localeCompare(b.id);
      });
    const anchorIds = new Set(anchors.map((anchor) => anchor.id));
    const adjacency = new Map<string, Set<string>>();
    anchorLinks.forEach((link) => {
      if (!anchorIds.has(link.anchor_id) || !anchorIds.has(link.linked_anchor_id)) return;
      if (!adjacency.has(link.anchor_id)) adjacency.set(link.anchor_id, new Set());
      if (!adjacency.has(link.linked_anchor_id)) adjacency.set(link.linked_anchor_id, new Set());
      adjacency.get(link.anchor_id)?.add(link.linked_anchor_id);
      adjacency.get(link.linked_anchor_id)?.add(link.anchor_id);
    });
    const fallbackOrderById = new Map(anchors.map((anchor, index) => [anchor.id, index]));
    const visited = new Set<string>();
    anchors.forEach((startAnchor) => {
      if (visited.has(startAnchor.id)) return;
      const componentIds = new Set<string>();
      const stack = [startAnchor.id];
      while (stack.length) {
        const id = stack.pop();
        if (!id || componentIds.has(id)) continue;
        componentIds.add(id);
        adjacency.get(id)?.forEach((nextId) => {
          if (!componentIds.has(nextId)) stack.push(nextId);
        });
      }
      const orderByAnchorId = new Map<string, number>();
      anchorLinks.forEach((link) => {
        if (!componentIds.has(link.anchor_id) || !componentIds.has(link.linked_anchor_id)) return;
        const order = Number(link.sort_order);
        if (!Number.isFinite(order)) return;
        const current = orderByAnchorId.get(link.linked_anchor_id);
        if (current == null || order < current) orderByAnchorId.set(link.linked_anchor_id, order);
      });
      const orderedIds = anchors
        .filter((anchor) => componentIds.has(anchor.id))
        .sort((a, b) => {
          const orderA = orderByAnchorId.get(a.id);
          const orderB = orderByAnchorId.get(b.id);
          if (orderA != null && orderB != null && orderA !== orderB) return orderA - orderB;
          if (orderA != null && orderB == null) return -1;
          if (orderA == null && orderB != null) return 1;
          return (fallbackOrderById.get(a.id) ?? 0) - (fallbackOrderById.get(b.id) ?? 0);
        })
        .map((anchor) => anchor.id);
      orderedIds.forEach((id, index) => {
        visited.add(id);
        sequenceNumbers.set(id, index + 1);
      });
    });
    return sequenceNumbers;
  }, [anchorElements, anchorLinks]);
  const anchorGroupIdsById = useMemo(() => {
    const groups = new Map<string, string[]>();
    const anchors = anchorElements
      .slice()
      .sort((a, b) => {
        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (createdA !== createdB) return createdA - createdB;
        return a.id.localeCompare(b.id);
      });
    const anchorIds = new Set(anchors.map((anchor) => anchor.id));
    const adjacency = new Map<string, Set<string>>();
    anchorLinks.forEach((link) => {
      if (!anchorIds.has(link.anchor_id) || !anchorIds.has(link.linked_anchor_id)) return;
      if (!adjacency.has(link.anchor_id)) adjacency.set(link.anchor_id, new Set());
      if (!adjacency.has(link.linked_anchor_id)) adjacency.set(link.linked_anchor_id, new Set());
      adjacency.get(link.anchor_id)?.add(link.linked_anchor_id);
      adjacency.get(link.linked_anchor_id)?.add(link.anchor_id);
    });
    const visited = new Set<string>();
    anchors.forEach((startAnchor) => {
      if (visited.has(startAnchor.id)) return;
      const componentIds = new Set<string>();
      const stack = [startAnchor.id];
      while (stack.length) {
        const id = stack.pop();
        if (!id || componentIds.has(id) || !anchorIds.has(id)) continue;
        componentIds.add(id);
        adjacency.get(id)?.forEach((nextId) => {
          if (!componentIds.has(nextId)) stack.push(nextId);
        });
      }
      const orderedIds = anchors.filter((anchor) => componentIds.has(anchor.id)).map((anchor) => anchor.id);
      orderedIds.forEach((id) => {
        visited.add(id);
        groups.set(id, orderedIds);
      });
    });
    return groups;
  }, [anchorElements, anchorLinks]);
  const applyHistorySnapshotLocally = useCallback((snapshot: MapSessionHistorySnapshot) => {
    if (!map) return;
    const restored = resolveMapSessionHistorySnapshotState(snapshot);
    setMap({
      ...map,
      ...restored.mapPatch,
    });
    setMapTitleDraft(restored.titleDraft);
    setMapInfoNameDraft(restored.titleDraft);
    setMapInfoDescriptionDraft(restored.descriptionDraft);
    setMapCodeDraft(restored.codeDraft);
    setMapCategoryId(restored.mapCategory);
    setTypes(restored.types);
    setNodes(restored.nodes);
    setElements(restored.elements);
    setRelations(restored.relations);
    setAnchorLinks(restored.anchorLinks);
    setOutlineItems(restored.outlineItems);
  }, [map]);
  const {
    canUndoSessionMapChanges,
    canRedoSessionMapChanges,
    handleUndoSessionChanges,
    handleRedoSessionChanges,
  } = useMapSessionHistory({
    canWriteMap,
    loading,
    mapId,
    userId,
    map,
    types,
    nodes,
    elements,
    relations,
    anchorLinks,
    outlineItems,
    applyHistorySnapshotLocally,
    setError,
  });

  const handleToggleSuggestionsMenu = useCallback(() => {
    setShowAddMenu(false);
    setShowTemplateMenu(false);
    setShowSearchMenu(false);
    setShowPrintMenu(false);
    setShowSuggestionsMenu((prev) => !prev);
  }, [setShowPrintMenu, setShowSearchMenu, setShowTemplateMenu]);

  useEffect(() => {
    if (!canUseSuggestionCheck) return;
    void loadPersistedMapSuggestions();
  }, [canUseSuggestionCheck, loadPersistedMapSuggestions]);

  const loadMapMembers = useCallback(
    async (ownerId?: string | null) => {
      const { data, error: profileError } = await supabaseBrowser
        .schema("ms")
        .from("map_member_profiles")
        .select("map_id,user_id,role,email,full_name,is_owner")
        .eq("map_id", mapId)
        .order("is_owner", { ascending: false });

      if (!profileError) {
        setMapMembers((data ?? []) as MapMemberProfileRow[]);
        return;
      }

      const { data: fallbackData, error: fallbackError } = await supabaseBrowser
        .schema("ms")
        .from("map_members")
        .select("map_id,user_id,role")
        .eq("map_id", mapId);

      if (fallbackError) {
        setError(fallbackError.message || "Unable to load map members.");
        return;
      }

      const resolvedOwnerId = ownerId ?? map?.owner_id ?? null;
      const fallbackMembers: MapMemberProfileRow[] = ((fallbackData ?? []) as Array<{ map_id: string; user_id: string; role: string }>).map(
        (member) => ({
          map_id: member.map_id,
          user_id: member.user_id,
          role: member.role,
          email: null,
          full_name: null,
          is_owner: !!resolvedOwnerId && member.user_id === resolvedOwnerId,
        })
      );
      fallbackMembers.sort((a, b) => Number(b.is_owner) - Number(a.is_owner));
      setMapMembers(fallbackMembers);
    },
    [mapId, map?.owner_id]
  );
  const loadOrgAccessCandidates = useCallback(async (searchOverride?: string) => {
    if (!canManageMapMetadata) {
      setOrgAccessCandidates([]);
      setOrgAccessError(null);
      setOwnerHasActiveOrganisation(false);
      return;
    }

    const search = (searchOverride ?? orgAccessSearch).trim();
    if (search.length < 2) {
      setOrgAccessCandidates([]);
      setOrgAccessError(null);
      setOrgAccessLoading(false);
      return;
    }

    setOrgAccessLoading(true);
    setOrgAccessError(null);

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const params = new URLSearchParams({ q: search });
      const response = await fetch(`/api/system-maps/${mapId}/org-access?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json()) as {
        hasActiveOrganisation?: boolean;
        hasOrganisationMembership?: boolean;
        users?: OrgAccessCandidate[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load organisation users.");
      }

      setOwnerHasActiveOrganisation(Boolean(payload.hasOrganisationMembership ?? payload.hasActiveOrganisation));
      setOrgAccessCandidates(payload.users ?? []);
    } catch (loadError) {
      setOrgAccessError(loadError instanceof Error ? loadError.message : "Unable to load organisation users.");
    } finally {
      setOrgAccessLoading(false);
    }
  }, [canManageMapMetadata, mapId, orgAccessSearch]);

  const loadOrgAccessStatus = useCallback(async () => {
    if (!canManageMapMetadata) {
      setOwnerHasActiveOrganisation(false);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(`/api/system-maps/${mapId}/org-access`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json()) as {
        hasActiveOrganisation?: boolean;
        hasOrganisationMembership?: boolean;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load organisation access status.");
      }

      setOwnerHasActiveOrganisation(Boolean(payload.hasOrganisationMembership ?? payload.hasActiveOrganisation));
    } catch {
      setOwnerHasActiveOrganisation(false);
    }
  }, [canManageMapMetadata, mapId]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedProcessComponentId, setSelectedProcessComponentId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
  const [selectedGroupingId, setSelectedGroupingId] = useState<string | null>(null);
  const [selectedStickyId, setSelectedStickyId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedFlowShapeId, setSelectedFlowShapeId] = useState<string | null>(null);
  const [selectedBowtieElementId, setSelectedBowtieElementId] = useState<string | null>(null);
  const selectedFlowIdsRef = useRef<Set<string>>(new Set());
  const canvasSelectionSetters = useMemo<CanvasSelectionSetters>(
    () => ({
      setSelectedNodeId,
      setSelectedProcessId,
      setSelectedSystemId,
      setSelectedProcessComponentId,
      setSelectedPersonId,
      setSelectedAnchorId,
      setSelectedGroupingId,
      setSelectedStickyId,
      setSelectedImageId,
      setSelectedTextBoxId,
      setSelectedTableId,
      setSelectedFlowShapeId,
      setSelectedBowtieElementId,
    }),
    []
  );
  const [title, setTitle] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [disciplineSelection, setDisciplineSelection] = useState<DisciplineKey[]>([]);
  const [showDisciplineMenu, setShowDisciplineMenu] = useState(false);
  const [showTypeSelectArrowUp, setShowTypeSelectArrowUp] = useState(false);
  const [showUserGroupSelectArrowUp, setShowUserGroupSelectArrowUp] = useState(false);
  const [userGroup, setUserGroup] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [processHeadingDraft, setProcessHeadingDraft] = useState("");
  const [processWidthDraft, setProcessWidthDraft] = useState<string>(String(Math.round(processHeadingWidth / minorGridSize)));
  const [processHeightDraft, setProcessHeightDraft] = useState<string>(String(Math.round(processHeadingHeight / minorGridSize)));
  const [processColorDraft, setProcessColorDraft] = useState<string | null>(null);
  const [processFillModeDraft, setProcessFillModeDraft] = useState<"fill" | "outline">("fill");
  const [processOutlineColorDraft, setProcessOutlineColorDraft] = useState<string | null>(null);
  const [processOutlineWidthDraft, setProcessOutlineWidthDraft] = useState("1");
  const [processComponentLabelDraft, setProcessComponentLabelDraft] = useState("");
  const [systemNameDraft, setSystemNameDraft] = useState("");
  const [personTypeDraft, setPersonTypeDraft] = useState("");
  const [personRoleDraft, setPersonRoleDraft] = useState("");
  const [personRoleIdDraft, setPersonRoleIdDraft] = useState("");
  const [personDepartmentDraft, setPersonDepartmentDraft] = useState("");
  const [personOccupantNameDraft, setPersonOccupantNameDraft] = useState("");
  const [personStartDateDraft, setPersonStartDateDraft] = useState("");
  const [personEmploymentTypeDraft, setPersonEmploymentTypeDraft] = useState<"fte" | "contractor">("fte");
  const [personActingNameDraft, setPersonActingNameDraft] = useState("");
  const [personActingStartDateDraft, setPersonActingStartDateDraft] = useState("");
  const [personRecruitingDraft, setPersonRecruitingDraft] = useState(false);
  const [personProposedRoleDraft, setPersonProposedRoleDraft] = useState(false);
  const [equipmentTypeDraft, setEquipmentTypeDraft] = useState("");
  const [equipmentIdentifierDraft, setEquipmentIdentifierDraft] = useState("");
  const [environmentDetailDraft, setEnvironmentDetailDraft] = useState("");
  const [environmentFactorTypeDraft, setEnvironmentFactorTypeDraft] = useState("Weather");
  const [anchorTitleDraft, setAnchorTitleDraft] = useState("");
  const [anchorColorDraft, setAnchorColorDraft] = useState("#0F766E");
  const [anchorSearchDraft, setAnchorSearchDraft] = useState("");
  const [anchorLinkedOrderDraft, setAnchorLinkedOrderDraft] = useState<string[]>([]);
  const [anchorNavigationNotice, setAnchorNavigationNotice] = useState<{ message: string; left: number; top: number } | null>(null);
  const [groupingLabelDraft, setGroupingLabelDraft] = useState("");
  const [groupingHeaderColorDraft, setGroupingHeaderColorDraft] = useState("#FFFFFF");
  const [groupingHeaderFontSizeDraft, setGroupingHeaderFontSizeDraft] = useState("11");
  const [groupingOutlineWidthDraft, setGroupingOutlineWidthDraft] = useState("1");
  const [groupingWidthDraft, setGroupingWidthDraft] = useState<string>(String(Math.round(groupingDefaultWidth / minorGridSize)));
  const [groupingHeightDraft, setGroupingHeightDraft] = useState<string>(String(Math.round(groupingDefaultHeight / minorGridSize)));
  const [processFontSizeDraft, setProcessFontSizeDraft] = useState("12");
  const [stickyTextDraft, setStickyTextDraft] = useState("");
  const [stickyBackgroundColorDraft, setStickyBackgroundColorDraft] = useState("#FEF08A");
  const [stickyOutlineColorDraft, setStickyOutlineColorDraft] = useState("#F59E0B");
  const [stickyFillModeDraft, setStickyFillModeDraft] = useState<"fill" | "outline">("fill");
  const [stickyOutlineWidthDraft, setStickyOutlineWidthDraft] = useState("1");
  const [imageDescriptionDraft, setImageDescriptionDraft] = useState("");
  const [textBoxContentDraft, setTextBoxContentDraft] = useState("");
  const [textBoxBoldDraft, setTextBoxBoldDraft] = useState(false);
  const [textBoxItalicDraft, setTextBoxItalicDraft] = useState(false);
  const [textBoxUnderlineDraft, setTextBoxUnderlineDraft] = useState(false);
  const [textBoxAlignDraft, setTextBoxAlignDraft] = useState<"left" | "center" | "right">("left");
  const [textBoxFontSizeDraft, setTextBoxFontSizeDraft] = useState("24");
  const [textBoxBackgroundColorDraft, setTextBoxBackgroundColorDraft] = useState("#FFFFFF");
  const [textBoxOutlineDraft, setTextBoxOutlineDraft] = useState(false);
  const [textBoxOutlineColorDraft, setTextBoxOutlineColorDraft] = useState("#111827");
  const [textBoxOutlineWidthDraft, setTextBoxOutlineWidthDraft] = useState("2");
  const [tableRowsDraft, setTableRowsDraft] = useState("2");
  const [tableColumnsDraft, setTableColumnsDraft] = useState("2");
  const [tableHeaderBgDraft, setTableHeaderBgDraft] = useState("");
  const [tableGridLineColorDraft, setTableGridLineColorDraft] = useState("");
  const [tableGridLineWeightDraft, setTableGridLineWeightDraft] = useState("0.5");
  const [tableBoldDraft, setTableBoldDraft] = useState(false);
  const [tableItalicDraft, setTableItalicDraft] = useState(false);
  const [tableUnderlineDraft, setTableUnderlineDraft] = useState(false);
  const [tableAlignDraft, setTableAlignDraft] = useState<"left" | "center" | "right">("center");
  const [tableFontSizeDraft, setTableFontSizeDraft] = useState("10");
  const [flowShapeTextDraft, setFlowShapeTextDraft] = useState("");
  const [flowShapeAlignDraft, setFlowShapeAlignDraft] = useState<"left" | "center" | "right">("center");
  const [flowShapeBoldDraft, setFlowShapeBoldDraft] = useState(false);
  const [flowShapeItalicDraft, setFlowShapeItalicDraft] = useState(false);
  const [flowShapeUnderlineDraft, setFlowShapeUnderlineDraft] = useState(false);
  const [flowShapeFontSizeDraft, setFlowShapeFontSizeDraft] = useState("24");
  const [flowShapeColorDraft, setFlowShapeColorDraft] = useState(shapeDefaultFillColor);
  const [flowShapeFillModeDraft, setFlowShapeFillModeDraft] = useState<"fill" | "outline">("fill");
  const [flowShapeOutlineColorDraft, setFlowShapeOutlineColorDraft] = useState(shapeDefaultFillColor);
  const [flowShapeOutlineWidthDraft, setFlowShapeOutlineWidthDraft] = useState("3");
  const [flowShapeDirectionDraft, setFlowShapeDirectionDraft] = useState<"left" | "right">("right");
  const [flowShapeRotationDraft, setFlowShapeRotationDraft] = useState<0 | 90 | 180 | 270>(0);
  const hydratedFlowShapeDraftIdRef = useRef<string | null>(null);
  const [bowtieDraft, setBowtieDraft] = useState<BowtieDraftState>({});
  const [imageUrlsByElementId, setImageUrlsByElementId] = useState<Record<string, string>>({});
  const [evidenceUploadFile, setEvidenceUploadFile] = useState<File | null>(null);
  const [evidenceUploadPreviewUrl, setEvidenceUploadPreviewUrl] = useState<string | null>(null);
  useSystemMapBootstrap({
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
  });

  const [mobileNodeMenuId, setMobileNodeMenuId] = useState<string | null>(null);
  const {
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
    openAddRelationshipFromSource: openRelationshipStateFromSource,
  } = useCanvasRelationshipController({ mapCategoryId });
  const [editingRelationId, setEditingRelationId] = useState<string | null>(null);
  const [editingRelationDescription, setEditingRelationDescription] = useState("");
  const [editingRelationCategory, setEditingRelationCategory] = useState<RelationshipCategory>(getDefaultRelationshipCategoryForMap(defaultMapCategoryId));
  const [editingRelationCustomType, setEditingRelationCustomType] = useState("");
  const [editingRelationDisciplines, setEditingRelationDisciplines] = useState<DisciplineKey[]>([]);
  const [showEditingRelationDisciplineMenu, setShowEditingRelationDisciplineMenu] = useState(false);
  useEffect(() => {
    setEditingRelationCategory((prev) => normalizeRelationshipCategoryForMap(prev, mapCategoryId));
  }, [mapCategoryId]);
  const [confirmDeleteNodeId, setConfirmDeleteNodeId] = useState<string | null>(null);
  const [confirmDeleteElementId, setConfirmDeleteElementId] = useState<string | null>(null);
  const [outlineNodeId, setOutlineNodeId] = useState<string | null>(null);
  const [outlineCreateMode, setOutlineCreateMode] = useState<"heading" | "content" | null>(null);
  const [outlineEditItemId, setOutlineEditItemId] = useState<string | null>(null);
  const [confirmDeleteOutlineItemId, setConfirmDeleteOutlineItemId] = useState<string | null>(null);
  const [relationshipPopup, setRelationshipPopup] = useState<{
    x: number;
    y: number;
    fromLabel: string;
    toLabel: string;
    relationLabel: string;
    relationshipType: string;
    disciplines: string;
    description: string;
  } | null>(null);
  const [evidenceMediaOverlay, setEvidenceMediaOverlay] = useState<{
    elementId: string;
    fileName: string;
    description: string;
    mediaUrl: string;
    mediaMime: string;
    rotationDeg: 0 | 90 | 180 | 270;
  } | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedFlowIds, setSelectedFlowIds] = useState<Set<string>>(new Set());
  const [canvasInteractionLocked, setCanvasInteractionLocked] = useState(false);
  const canManipulateCanvasElements = canWriteMap && !canvasInteractionLocked;
  const hoveredNodeFrameRef = useRef<number | null>(null);
  const queuedHoveredNodeRef = useRef<string | null>(null);
  const hoveredEdgeFrameRef = useRef<number | null>(null);
  const queuedHoveredEdgeRef = useRef<string | null>(null);
  const highlightedDocumentIdsRef = useRef<Set<string>>(new Set());
  const [copiedFlowIds, setCopiedFlowIds] = useState<string[]>([]);
  const [selectionMarquee, setSelectionMarquee] = useState<SelectionMarquee>({
    active: false,
    startClientX: 0,
    startClientY: 0,
    currentClientX: 0,
    currentClientY: 0,
  });
  const [showDeleteSelectionConfirm, setShowDeleteSelectionConfirm] = useState(false);
  const [collapsedHeadingIds, setCollapsedHeadingIds] = useState<Set<string>>(new Set());
  const [newHeadingTitle, setNewHeadingTitle] = useState("");
  const [newHeadingLevel, setNewHeadingLevel] = useState<1 | 2 | 3>(1);
  const [newHeadingParentId, setNewHeadingParentId] = useState("");
  const [newContentHeadingId, setNewContentHeadingId] = useState("");
  const [newContentText, setNewContentText] = useState("");
  const [editHeadingTitle, setEditHeadingTitle] = useState("");
  const [editHeadingLevel, setEditHeadingLevel] = useState<1 | 2 | 3>(1);
  const [editHeadingParentId, setEditHeadingParentId] = useState("");
  const [editContentHeadingId, setEditContentHeadingId] = useState("");
  const [editContentText, setEditContentText] = useState("");
  useEffect(() => {
    return () => {
      if (evidenceUploadPreviewUrl) URL.revokeObjectURL(evidenceUploadPreviewUrl);
    };
  }, [evidenceUploadPreviewUrl]);
  useEffect(() => {
    const objectUrls = convertedMediaObjectUrlsRef.current;
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, [setShowPrintMenu, setShowSearchMenu, setShowTemplateMenu]);
  useEffect(() => {
    if (!canvasInteractionLocked) return;
    setSelectedFlowIds(new Set());
    setSelectionMarquee({
      active: false,
      startClientX: 0,
      startClientY: 0,
      currentClientX: 0,
      currentClientY: 0,
    });
  }, [canvasInteractionLocked]);
  const normalizePreviewHex = useCallback((value: string | null | undefined): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return null;
    return trimmed.toUpperCase();
  }, []);
  const selectedAnchorGroupIds = useMemo(
    () => (selectedAnchorId ? (anchorGroupIdsById.get(selectedAnchorId) ?? [selectedAnchorId]) : []),
    [anchorGroupIdsById, selectedAnchorId]
  );
  const selectedAnchorGroupColor = useMemo(() => {
    const color =
      selectedAnchorGroupIds
        .map((id) => normalizePreviewHex(anchorById.get(id)?.color_hex ?? null))
        .find((value): value is string => Boolean(value)) ?? "#0F766E";
    return color;
  }, [anchorById, normalizePreviewHex, selectedAnchorGroupIds]);
  const isHeicLike = useCallback((mimeRaw: string | null | undefined, nameRaw: string | null | undefined) => {
    const mime = String(mimeRaw ?? "").toLowerCase();
    const name = String(nameRaw ?? "").toLowerCase();
    return mime.includes("heic") || mime.includes("heif") || name.endsWith(".heic") || name.endsWith(".heif");
  }, []);
  const convertHeicBlobToJpegBlob = useCallback(async (blob: Blob): Promise<Blob | null> => {
    try {
      const mod = await import("heic2any");
      const heic2anyFn = (mod.default ?? mod) as (opts: { blob: Blob; toType: string; quality?: number }) => Promise<Blob | Blob[]>;
      const converted = await heic2anyFn({ blob, toType: "image/jpeg", quality: 0.9 });
      if (Array.isArray(converted)) return converted[0] ?? null;
      return converted ?? null;
    } catch {
      return null;
    }
  }, []);
  const blobLooksLikeHeif = useCallback(async (blob: Blob): Promise<boolean> => {
    try {
      const buffer = await blob.slice(0, 64).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.length < 12) return false;
      const ascii = String.fromCharCode(...bytes);
      if (!ascii.includes("ftyp")) return false;
      const brands = ["heic", "heix", "hevc", "hevx", "mif1", "msf1"];
      return brands.some((brand) => ascii.includes(brand));
    } catch {
      return false;
    }
  }, []);
  const hasUnsavedFlowShapeDraftChanges = useMemo(() => {
    if (!selectedFlowShapeId) return false;
    const selectedShape = elements.find(
      (el) =>
        el.id === selectedFlowShapeId &&
        (el.element_type === "shape_rectangle" ||
          el.element_type === "shape_circle" ||
          el.element_type === "shape_pill" ||
          el.element_type === "shape_pentagon" ||
          el.element_type === "shape_chevron_left" ||
          el.element_type === "shape_arrow")
    );
    if (!selectedShape) return false;
    const cfg = (selectedShape.element_config as Record<string, unknown> | null) ?? {};
    const isArrow = selectedShape.element_type === "shape_arrow";
    const canFlipDirection = selectedShape.element_type === "shape_pentagon" || selectedShape.element_type === "shape_chevron_left";
    const persistedHeading = isArrow ? "" : selectedShape.heading ?? "";
    const persistedAlignRaw = String(cfg.align ?? "center");
    const persistedAlign = persistedAlignRaw === "left" || persistedAlignRaw === "right" ? persistedAlignRaw : "center";
    const persistedFontSizeRaw = Number(cfg.font_size ?? 24);
    const persistedFontSize = Number.isFinite(persistedFontSizeRaw) ? Math.max(12, Math.min(168, Math.round(persistedFontSizeRaw))) : 24;
    const draftFontSizeRaw = Number(flowShapeFontSizeDraft.trim());
    const draftFontSize = Number.isFinite(draftFontSizeRaw) ? Math.max(12, Math.min(168, Math.round(draftFontSizeRaw))) : 24;
    const persistedColor = normalizePreviewHex(selectedShape.color_hex ?? shapeDefaultFillColor) ?? shapeDefaultFillColor;
    const draftColor = normalizePreviewHex(flowShapeColorDraft) ?? persistedColor;
    const persistedFillMode = String(cfg.fill_mode ?? "fill") === "outline" ? "outline" : "fill";
    const persistedOutlineColor =
      typeof cfg.outline_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.outline_color) ? cfg.outline_color.toUpperCase() : persistedColor;
    const draftOutlineColor = normalizePreviewHex(flowShapeOutlineColorDraft) ?? persistedOutlineColor;
    const persistedOutlineWidthRaw = Number(cfg.outline_width ?? 3);
    const persistedOutlineWidth = Number.isFinite(persistedOutlineWidthRaw) ? Math.max(1, Math.min(12, Math.round(persistedOutlineWidthRaw))) : 3;
    const draftOutlineWidthRaw = Number(flowShapeOutlineWidthDraft.trim());
    const draftOutlineWidth = Number.isFinite(draftOutlineWidthRaw) ? Math.max(1, Math.min(12, Math.round(draftOutlineWidthRaw))) : 3;
    const persistedDirection = String(cfg.direction ?? "right") === "left" ? "left" : "right";
    const persistedRotationRaw = Number(cfg.rotation_deg ?? 0);
    const persistedRotation = persistedRotationRaw === 90 || persistedRotationRaw === 180 || persistedRotationRaw === 270 ? persistedRotationRaw : 0;
    return (
      flowShapeTextDraft !== persistedHeading ||
      flowShapeBoldDraft !== Boolean(cfg.bold) ||
      flowShapeItalicDraft !== Boolean(cfg.italic) ||
      flowShapeUnderlineDraft !== Boolean(cfg.underline) ||
      flowShapeAlignDraft !== persistedAlign ||
      draftFontSize !== persistedFontSize ||
      draftColor !== persistedColor ||
      flowShapeFillModeDraft !== persistedFillMode ||
      draftOutlineColor !== persistedOutlineColor ||
      draftOutlineWidth !== persistedOutlineWidth ||
      (canFlipDirection && flowShapeDirectionDraft !== persistedDirection) ||
      (isArrow && flowShapeRotationDraft !== persistedRotation)
    );
  }, [
    selectedFlowShapeId,
    elements,
    flowShapeTextDraft,
    flowShapeBoldDraft,
    flowShapeItalicDraft,
    flowShapeUnderlineDraft,
    flowShapeAlignDraft,
    flowShapeFontSizeDraft,
    flowShapeColorDraft,
    flowShapeFillModeDraft,
    flowShapeOutlineColorDraft,
    flowShapeOutlineWidthDraft,
    flowShapeDirectionDraft,
    flowShapeRotationDraft,
    normalizePreviewHex,
  ]);
  const canvasPreviewElements = useMemo(() => {
    if (!selectedProcessId && !selectedAnchorId && !selectedGroupingId && !selectedStickyId && !selectedTextBoxId && !selectedTableId && !selectedFlowShapeId) return elements;
    let changed = false;
    const anchorGroupPreviewColor = normalizePreviewHex(anchorColorDraft) ?? selectedAnchorGroupColor;
    const selectedAnchorGroupIdSet = new Set(selectedAnchorGroupIds);
    const next = elements.map((el) => {
      if (selectedAnchorId && selectedAnchorGroupIdSet.has(el.id) && el.element_type === "anchor") {
        changed = true;
        return {
          ...el,
          heading: el.id === selectedAnchorId ? anchorTitleDraft : el.heading,
          color_hex: anchorGroupPreviewColor,
        };
      }
      if (selectedProcessId && el.id === selectedProcessId && el.element_type === "category") {
        changed = true;
        const parsedProcessSize = Number(processFontSizeDraft.trim());
        const previewProcessSize = Number.isFinite(parsedProcessSize) ? Math.max(10, Math.min(72, Math.round(parsedProcessSize))) : 12;
        return {
          ...el,
          heading: processHeadingDraft,
          color_hex: processColorDraft ? normalizePreviewHex(processColorDraft) : el.color_hex,
          element_config: {
            ...((el.element_config as Record<string, unknown> | null) ?? {}),
            font_size: previewProcessSize,
            fill_mode: processFillModeDraft,
            outline_color: normalizePreviewHex(processOutlineColorDraft) ?? (el.element_config as Record<string, unknown> | null)?.outline_color,
            outline_width: (() => {
              const parsed = Number(processOutlineWidthDraft.trim());
              return Number.isFinite(parsed) ? Math.max(1, Math.min(12, Math.round(parsed))) : 1;
            })(),
          },
        };
      }
      if (selectedTextBoxId && el.id === selectedTextBoxId && el.element_type === "text_box") {
        changed = true;
        const parsedTextSize = Number(textBoxFontSizeDraft.trim());
        const previewTextSize = Number.isFinite(parsedTextSize) ? Math.max(16, Math.min(168, Math.round(parsedTextSize))) : 16;
        return {
          ...el,
          heading: textBoxContentDraft,
          element_config: {
            ...((el.element_config as Record<string, unknown> | null) ?? {}),
            bold: textBoxBoldDraft,
            italic: textBoxItalicDraft,
            underline: textBoxUnderlineDraft,
            align: textBoxAlignDraft,
            font_size: previewTextSize,
            background_color: textBoxBackgroundColorDraft,
            outline: textBoxOutlineDraft,
            outline_color: normalizePreviewHex(textBoxOutlineColorDraft) ?? (el.element_config as Record<string, unknown> | null)?.outline_color,
            outline_width: (() => {
              const parsed = Number(textBoxOutlineWidthDraft.trim());
              return Number.isFinite(parsed) ? Math.max(1, Math.min(12, Math.round(parsed))) : 2;
            })(),
          },
        };
      }
      if (selectedGroupingId && el.id === selectedGroupingId && el.element_type === "grouping_container") {
        changed = true;
        const parsedHeaderFontSize = Number(groupingHeaderFontSizeDraft.trim());
        const headerFontSize = Number.isFinite(parsedHeaderFontSize) ? Math.max(10, Math.min(48, Math.round(parsedHeaderFontSize))) : 11;
        const parsedOutlineWidth = Number(groupingOutlineWidthDraft.trim());
        const outlineWidth = Number.isFinite(parsedOutlineWidth) ? Math.max(1, Math.min(12, Math.round(parsedOutlineWidth))) : 1;
        return {
          ...el,
          heading: groupingLabelDraft,
          element_config: {
            ...((el.element_config as Record<string, unknown> | null) ?? {}),
            header_bg_color: normalizePreviewHex(groupingHeaderColorDraft) ?? (el.element_config as Record<string, unknown> | null)?.header_bg_color,
            header_font_size: headerFontSize,
            outline_width: outlineWidth,
          },
        };
      }
      if (selectedStickyId && el.id === selectedStickyId && el.element_type === "sticky_note") {
        changed = true;
        return {
          ...el,
          heading: stickyTextDraft,
          element_config: {
            ...((el.element_config as Record<string, unknown> | null) ?? {}),
            background_color: normalizePreviewHex(stickyBackgroundColorDraft) ?? (el.element_config as Record<string, unknown> | null)?.background_color,
            outline_color: normalizePreviewHex(stickyOutlineColorDraft) ?? (el.element_config as Record<string, unknown> | null)?.outline_color,
            fill_mode: stickyFillModeDraft,
            outline_width: (() => {
              const parsed = Number(stickyOutlineWidthDraft.trim());
              return Number.isFinite(parsed) ? Math.max(1, Math.min(12, Math.round(parsed))) : 1;
            })(),
          },
        };
      }
      if (selectedTableId && el.id === selectedTableId && el.element_type === "table") {
        changed = true;
        const currentCfg = (el.element_config as Record<string, unknown> | null) ?? {};
        const currentRowsRaw = Number(currentCfg.rows ?? tableMinRows);
        const currentColumnsRaw = Number(currentCfg.columns ?? tableMinColumns);
        const currentRows = Number.isFinite(currentRowsRaw) ? Math.max(tableMinRows, Math.floor(currentRowsRaw)) : tableMinRows;
        const currentColumns = Number.isFinite(currentColumnsRaw) ? Math.max(tableMinColumns, Math.floor(currentColumnsRaw)) : tableMinColumns;
        const currentWidth = Math.max(tableMinWidth, Number(el.width ?? tableDefaultWidth));
        const currentHeight = Math.max(tableMinHeight, Number(el.height ?? tableDefaultHeight));
        const cellWidth = currentWidth / Math.max(1, currentColumns);
        const cellHeight = currentHeight / Math.max(1, currentRows);
        const parsedRows = Number(tableRowsDraft.trim());
        const parsedColumns = Number(tableColumnsDraft.trim());
        const rows = Number.isFinite(parsedRows) ? Math.max(tableMinRows, Math.floor(parsedRows)) : tableMinRows;
        const columns = Number.isFinite(parsedColumns) ? Math.max(tableMinColumns, Math.floor(parsedColumns)) : tableMinColumns;
        const nextHeaderColor = normalizePreviewHex(tableHeaderBgDraft);
        const nextGridLineColor = normalizePreviewHex(tableGridLineColorDraft);
        const parsedGridLineWeight = Number(tableGridLineWeightDraft.trim());
        const previewGridLineWeight = Number.isFinite(parsedGridLineWeight) ? Math.max(0.5, Math.min(6, Math.round(parsedGridLineWeight * 2) / 2)) : 0.5;
        const parsedTableSize = Number(tableFontSizeDraft.trim());
        const previewTableSize = Number.isFinite(parsedTableSize) ? Math.max(10, Math.min(72, Math.round(parsedTableSize))) : 10;
        return {
          ...el,
          width: Math.max(tableMinWidth, cellWidth * columns),
          height: Math.max(tableMinHeight, cellHeight * rows),
          element_config: {
            ...((el.element_config as Record<string, unknown> | null) ?? {}),
            rows,
            columns,
            header_bg_color: nextHeaderColor,
            grid_line_color: nextGridLineColor,
            grid_line_weight: previewGridLineWeight,
            bold: tableBoldDraft,
            italic: tableItalicDraft,
            underline: tableUnderlineDraft,
            align: tableAlignDraft,
            font_size: previewTableSize,
          },
        };
      }
      if (
        selectedFlowShapeId &&
        el.id === selectedFlowShapeId &&
        (el.element_type === "shape_rectangle" ||
          el.element_type === "shape_circle" ||
          el.element_type === "shape_pill" ||
          el.element_type === "shape_pentagon" ||
          el.element_type === "shape_chevron_left" ||
          el.element_type === "shape_arrow")
      ) {
        changed = true;
        const parsedTextSize = Number(flowShapeFontSizeDraft.trim());
        const previewTextSize = Number.isFinite(parsedTextSize) ? Math.max(16, Math.min(168, Math.round(parsedTextSize))) : 16;
        const previewColor = normalizePreviewHex(flowShapeColorDraft) ?? el.color_hex;
        const canFlipDirection = el.element_type === "shape_pentagon" || el.element_type === "shape_chevron_left";
        const isArrow = el.element_type === "shape_arrow";
        const currentRotationRaw = Number(((el.element_config as Record<string, unknown> | null) ?? {}).rotation_deg ?? 0);
        const currentRotation = currentRotationRaw === 90 || currentRotationRaw === 180 || currentRotationRaw === 270 ? currentRotationRaw : 0;
        const currentIsVertical = currentRotation === 90 || currentRotation === 270;
        const nextIsVertical = flowShapeRotationDraft === 90 || flowShapeRotationDraft === 270;
        const nextWidth =
          isArrow && currentIsVertical !== nextIsVertical
            ? Math.max(shapeArrowMinWidth, el.height || shapeArrowDefaultHeight)
            : el.width;
        const nextHeight =
          isArrow && currentIsVertical !== nextIsVertical
            ? Math.max(shapeArrowMinHeight, el.width || shapeArrowDefaultWidth)
            : el.height;
        return {
          ...el,
          heading: isArrow ? "" : flowShapeTextDraft,
          color_hex: previewColor,
          width: nextWidth,
          height: nextHeight,
          element_config: {
            ...((el.element_config as Record<string, unknown> | null) ?? {}),
            bold: flowShapeBoldDraft,
            italic: flowShapeItalicDraft,
            underline: flowShapeUnderlineDraft,
            align: flowShapeAlignDraft,
            font_size: previewTextSize,
            fill_mode: flowShapeFillModeDraft,
            outline_color: normalizePreviewHex(flowShapeOutlineColorDraft) ?? previewColor,
            outline_width: (() => {
              const parsed = Number(flowShapeOutlineWidthDraft.trim());
              return Number.isFinite(parsed) ? Math.max(1, Math.min(12, Math.round(parsed))) : 3;
            })(),
            ...(canFlipDirection ? { direction: flowShapeDirectionDraft } : {}),
            ...(isArrow ? { rotation_deg: flowShapeRotationDraft } : {}),
          },
        };
      }
      return el;
    });
    return changed ? next : elements;
  }, [
    elements,
    selectedProcessId,
    selectedAnchorId,
    selectedAnchorGroupIds,
    selectedAnchorGroupColor,
    selectedGroupingId,
    selectedStickyId,
    selectedTextBoxId,
    selectedTableId,
    selectedFlowShapeId,
    processHeadingDraft,
    processColorDraft,
    processFillModeDraft,
    processOutlineColorDraft,
    processOutlineWidthDraft,
    processFontSizeDraft,
    anchorTitleDraft,
    anchorColorDraft,
    groupingLabelDraft,
    groupingHeaderColorDraft,
    groupingHeaderFontSizeDraft,
    groupingOutlineWidthDraft,
    stickyTextDraft,
    stickyBackgroundColorDraft,
    stickyOutlineColorDraft,
    stickyFillModeDraft,
    stickyOutlineWidthDraft,
    textBoxContentDraft,
    textBoxBoldDraft,
    textBoxItalicDraft,
    textBoxUnderlineDraft,
    textBoxAlignDraft,
    textBoxFontSizeDraft,
    textBoxBackgroundColorDraft,
    textBoxOutlineDraft,
    textBoxOutlineColorDraft,
    textBoxOutlineWidthDraft,
    tableRowsDraft,
    tableColumnsDraft,
    tableHeaderBgDraft,
    tableGridLineColorDraft,
    tableGridLineWeightDraft,
    tableBoldDraft,
    tableItalicDraft,
    tableUnderlineDraft,
    tableAlignDraft,
    tableFontSizeDraft,
    flowShapeTextDraft,
    flowShapeBoldDraft,
    flowShapeItalicDraft,
    flowShapeUnderlineDraft,
    flowShapeAlignDraft,
    flowShapeFontSizeDraft,
    flowShapeColorDraft,
    flowShapeFillModeDraft,
    flowShapeOutlineColorDraft,
    flowShapeOutlineWidthDraft,
    flowShapeDirectionDraft,
    flowShapeRotationDraft,
    normalizePreviewHex,
  ]);
  const anchorGroupColorById = useMemo(() => {
    const colors = new Map<string, string>();
    const previewAnchorById = new Map(
      canvasPreviewElements
        .filter((element) => element.element_type === "anchor")
        .map((anchor) => [anchor.id, anchor] as const)
    );
    const seen = new Set<string>();
    anchorGroupIdsById.forEach((groupIds, anchorId) => {
      if (seen.has(anchorId)) return;
      const groupColor =
        groupIds
          .map((id) => normalizePreviewHex(previewAnchorById.get(id)?.color_hex ?? null))
          .find((value): value is string => Boolean(value)) ?? "#0F766E";
      groupIds.forEach((id) => {
        seen.add(id);
        colors.set(id, groupColor);
      });
    });
    previewAnchorById.forEach((anchor, id) => {
      if (!colors.has(id)) colors.set(id, normalizePreviewHex(anchor.color_hex ?? null) ?? "#0F766E");
    });
    return colors;
  }, [anchorGroupIdsById, canvasPreviewElements, normalizePreviewHex]);

  const typesById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);
  const elementsById = useMemo(() => new Map(elements.map((el) => [el.id, el])), [elements]);
  const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const addDocumentTypes = useMemo(() => {
    const grouped = new Map<string, DocumentTypeRow[]>();
    types.forEach((t) => {
      const key = `${getCanonicalTypeName(t.name)}::${t.level_rank}`;
      const bucket = grouped.get(key);
      if (bucket) bucket.push(t);
      else grouped.set(key, [t]);
    });
    return [...grouped.values()]
      .map((bucket) => {
        bucket.sort((a, b) => {
          const aCanonical = getCanonicalTypeName(a.name) === a.name.trim().toLowerCase() ? 1 : 0;
          const bCanonical = getCanonicalTypeName(b.name) === b.name.trim().toLowerCase() ? 1 : 0;
          if (aCanonical !== bCanonical) return bCanonical - aCanonical;
          const aMapSpecific = a.map_id === mapId ? 1 : 0;
          const bMapSpecific = b.map_id === mapId ? 1 : 0;
          if (aMapSpecific !== bMapSpecific) return bMapSpecific - aMapSpecific;
          return a.name.localeCompare(b.name);
        });
        return bucket[0];
      })
      .sort((a, b) => a.level_rank - b.level_rank || getDisplayTypeName(a.name).localeCompare(getDisplayTypeName(b.name)));
  }, [types, mapId]);

  const getNodeSize = useCallback((node: DocumentNodeRow) => {
    const rawTypeName = typesById.get(node.type_id)?.name ?? "Document";
    const isLandscape = isLandscapeTypeName(rawTypeName);
    return getNormalizedDocumentSize(isLandscape, node.width, node.height);
  }, [typesById]);
  const findNearestFreePosition = useCallback((nodeId: string, startX: number, startY: number) => {
    const movingNode = nodes.find((n) => n.id === nodeId);
    if (!movingNode) return null;
    const movingSize = getNodeSize(movingNode);
    const occupied = nodes
      .filter((n) => n.id !== nodeId)
      .map((n) => {
        const size = getNodeSize(n);
        return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
      });

    const isFree = (x: number, y: number) =>
      !occupied.some((box) =>
        boxesOverlap(
          { x, y, width: movingSize.width, height: movingSize.height },
          box,
          4
        )
      );

    if (isFree(startX, startY)) return { x: startX, y: startY };

    const step = minorGridSize;
    const maxRing = 120;
    for (let ring = 1; ring <= maxRing; ring += 1) {
      for (let dx = -ring; dx <= ring; dx += 1) {
        for (let dy = -ring; dy <= ring; dy += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const x = snapToMinorGrid(startX + dx * step);
          const y = snapToMinorGrid(startY + dy * step);
          if (isFree(x, y)) return { x, y };
        }
      }
    }
    return null;
  }, [nodes, getNodeSize, snapToMinorGrid]);
  const flowElementBoundsById = useMemo(() => {
    const bounds = new Map<string, { x: number; y: number; width: number; height: number }>();
    canvasPreviewElements.forEach((el) => {
      if (el.element_type === "grouping_container") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(groupingMinWidth, el.width || groupingDefaultWidth),
          height: Math.max(groupingMinHeight, el.height || groupingDefaultHeight),
        });
        return;
      }
      if (el.element_type === "system_circle") {
        bounds.set(el.id, { x: el.pos_x, y: el.pos_y, width: systemCircleDiameter, height: systemCircleElementHeight });
        return;
      }
      if (el.element_type === "process_component") {
        bounds.set(el.id, { x: el.pos_x, y: el.pos_y, width: processComponentWidth, height: processComponentElementHeight });
        return;
      }
      if (el.element_type === "person") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: mapCategoryId === "org_chart" ? orgChartPersonWidth : personElementWidth,
          height: mapCategoryId === "org_chart" ? orgChartPersonHeight : personElementHeight,
        });
        return;
      }
      if (el.element_type === "equipment" || el.element_type === "environment") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: personElementWidth,
          height: personElementHeight,
        });
        return;
      }
      if (el.element_type === "sticky_note") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(stickyMinSize, el.width || stickyDefaultSize),
          height: Math.max(stickyMinSize, el.height || stickyDefaultSize),
        });
        return;
      }
      if (el.element_type === "image_asset") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(imageMinWidth, el.width || imageDefaultWidth),
          height: Math.max(imageMinHeight, el.height || imageDefaultWidth),
        });
        return;
      }
      if (el.element_type === "text_box") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(textBoxMinWidth, el.width || textBoxDefaultWidth),
          height: Math.max(textBoxMinHeight, el.height || textBoxDefaultHeight),
        });
        return;
      }
      if (el.element_type === "table") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(tableMinWidth, el.width || tableDefaultWidth),
          height: Math.max(tableMinHeight, el.height || tableDefaultHeight),
        });
        return;
      }
      if (el.element_type === "shape_rectangle") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeMinWidth, el.width || shapeRectangleDefaultWidth),
          height: Math.max(shapeMinHeight, el.height || shapeRectangleDefaultHeight),
        });
        return;
      }
      if (el.element_type === "shape_circle") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeMinWidth, el.width || shapeCircleDefaultSize),
          height: Math.max(shapeMinHeight, el.height || shapeCircleDefaultSize),
        });
        return;
      }
      if (el.element_type === "shape_pill") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeMinWidth, el.width || shapePillDefaultWidth),
          height: Math.max(shapeMinHeight, el.height || shapePillDefaultHeight),
        });
        return;
      }
      if (el.element_type === "shape_pentagon" || el.element_type === "shape_chevron_left") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeMinWidth, el.width || shapePentagonDefaultWidth),
          height: Math.max(shapeMinHeight, el.height || shapePentagonDefaultHeight),
        });
        return;
      }
      if (el.element_type === "shape_arrow") {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeArrowMinWidth, el.width || shapeArrowDefaultWidth),
          height: Math.max(shapeArrowMinHeight, el.height || shapeArrowDefaultHeight),
        });
        return;
      }
      if (isMethodologyElementType(el.element_type)) {
        bounds.set(el.id, {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
          height: Math.max(minorGridSize, el.height || incidentSquareSize),
        });
        return;
      }
      bounds.set(el.id, {
        x: el.pos_x,
        y: el.pos_y,
        width: Math.max(processMinWidth, el.width || processHeadingWidth),
        height: Math.max(processMinHeight, el.height || processHeadingHeight),
      });
    });
    return bounds;
  }, [canvasPreviewElements, mapCategoryId]);

  const getFlowNodeBounds = useCallback((flowId: string) => {
    if (flowId.startsWith("process:")) {
      return flowElementBoundsById.get(parseProcessFlowId(flowId)) ?? null;
    }
    const node = nodesById.get(flowId);
    if (!node) return null;
    const size = getNodeSize(node);
    return { x: node.pos_x, y: node.pos_y, width: size.width, height: size.height };
  }, [flowElementBoundsById, nodesById, getNodeSize]);

  const [flowNodes, setFlowNodesState] = useState<Node<FlowData>[]>([]);
  const setFlowNodes = useCallback<React.Dispatch<React.SetStateAction<Node<FlowData>[]>>>((value) => {
    const next =
      typeof value === "function"
        ? (value as (previous: Node<FlowData>[]) => Node<FlowData>[])(flowNodesRef.current)
        : value;
    flowNodesRef.current = next;
    setFlowNodesState(next);
  }, []);
  useEffect(() => {
    flowNodesRef.current = flowNodes;
  }, [flowNodes]);
  const applyFlowNodeChanges = useCallback(
    (changes: NodeChange<Node<FlowData>>[]) => {
      if (!changes.length) return;
      setFlowNodes((previous) => applyNodeChanges(changes, previous));
    },
    [setFlowNodes]
  );
  const flushPendingFlowNodePositionChanges = useCallback(() => {
    if (flowNodeChangeFrameRef.current !== null) {
      cancelAnimationFrame(flowNodeChangeFrameRef.current);
      flowNodeChangeFrameRef.current = null;
    }
    const pending = pendingFlowNodePositionChangesRef.current;
    if (!pending.length) return;
    pendingFlowNodePositionChangesRef.current = [];
    const latestByNodeId = new Map<string, NodeChange<Node<FlowData>>>();
    pending.forEach((change) => {
      const id = (change as { id?: string }).id;
      if (!id) return;
      latestByNodeId.set(id, change);
    });
    applyFlowNodeChanges(Array.from(latestByNodeId.values()));
  }, [applyFlowNodeChanges]);
  const scheduleFlowNodePositionChanges = useCallback(
    (changes: NodeChange<Node<FlowData>>[]) => {
      pendingFlowNodePositionChangesRef.current.push(...changes);
      if (flowNodeChangeFrameRef.current !== null) return;
      flowNodeChangeFrameRef.current = requestAnimationFrame(() => {
        flowNodeChangeFrameRef.current = null;
        flushPendingFlowNodePositionChanges();
      });
    },
    [flushPendingFlowNodePositionChanges]
  );
  const scheduleHoveredNodeId = useCallback((value: string | null) => {
    if (isNodeDragActiveRef.current) return;
    queuedHoveredNodeRef.current = value;
    if (hoveredNodeFrameRef.current !== null) return;
    hoveredNodeFrameRef.current = requestAnimationFrame(() => {
      hoveredNodeFrameRef.current = null;
      const next = queuedHoveredNodeRef.current;
      setHoveredNodeId((prev) => (prev === next ? prev : next));
    });
  }, []);
  const scheduleHoveredEdgeId = useCallback((value: string | null) => {
    if (isNodeDragActiveRef.current) return;
    queuedHoveredEdgeRef.current = value;
    if (hoveredEdgeFrameRef.current !== null) return;
    hoveredEdgeFrameRef.current = requestAnimationFrame(() => {
      hoveredEdgeFrameRef.current = null;
      const next = queuedHoveredEdgeRef.current;
      setHoveredEdgeId((prev) => (prev === next ? prev : next));
    });
  }, []);
  useEffect(() => {
    return () => {
      if (flowNodeChangeFrameRef.current !== null) cancelAnimationFrame(flowNodeChangeFrameRef.current);
      if (hoveredNodeFrameRef.current !== null) cancelAnimationFrame(hoveredNodeFrameRef.current);
      if (hoveredEdgeFrameRef.current !== null) cancelAnimationFrame(hoveredEdgeFrameRef.current);
      pendingFlowNodePositionChangesRef.current = [];
    };
  }, []);
  const handleFlowNodesChange = useCallback((changes: NodeChange<Node<FlowData>>[]) => {
    const positionOnly = changes.length > 0 && changes.every((change) => (change as { type?: string }).type === "position");
    if (positionOnly) {
      scheduleFlowNodePositionChanges(changes);
      return;
    }
    flushPendingFlowNodePositionChanges();
    applyFlowNodeChanges(changes);
    const dimensionChanges = changes.filter((c) => {
      const change = c as { type?: string; id?: string; dimensions?: { width: number; height: number } };
      return (
        change.type === "dimensions" &&
        typeof change.id === "string" &&
        change.id.startsWith("process:") &&
        !!change.dimensions &&
        typeof (change as { resizing?: boolean }).resizing === "boolean"
      );
    }) as Array<{ id: string; dimensions: { width: number; height: number }; resizing?: boolean }>;
    if (!dimensionChanges.length) return;

    const nextSizes = new Map<string, { width: number; height: number }>();
    const completedResizeIds = new Set<string>();
    dimensionChanges.forEach((change) => {
      const elementId = parseProcessFlowId(change.id);
      const current = elementsById.get(elementId);
      if (!current) return;
      if (!canEditElement(current)) return;
      if (current.element_type === "category") {
        const width = Math.max(processMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(processMinHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(processMinWidth, snapToMinorGrid(current.width || processHeadingWidth));
        const currentHeight = Math.max(processMinHeight, snapToMinorGrid(current.height || processHeadingHeight));
        if (width !== currentWidth || height !== currentHeight) {
          nextSizes.set(elementId, { width, height });
          if (change.resizing === false) completedResizeIds.add(elementId);
        }
        return;
      }
      if (current.element_type === "anchor") {
        const width = Math.max(anchorNodeMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(anchorNodeMinHeight, Math.round((width / anchorNodeWidth) * anchorNodeHeight));
        const currentWidth = Math.max(anchorNodeMinWidth, snapToMinorGrid(current.width || anchorNodeWidth));
        const currentHeight = Math.max(anchorNodeMinHeight, Math.round((currentWidth / anchorNodeWidth) * anchorNodeHeight));
        if (width !== currentWidth || height !== currentHeight) {
          nextSizes.set(elementId, { width, height });
          if (change.resizing === false) completedResizeIds.add(elementId);
        }
        return;
      }
      if (current.element_type === "grouping_container") {
        const width = Math.max(groupingMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(groupingMinHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(groupingMinWidth, snapToMinorGrid(current.width || groupingDefaultWidth));
        const currentHeight = Math.max(groupingMinHeight, snapToMinorGrid(current.height || groupingDefaultHeight));
        if (width !== currentWidth || height !== currentHeight) {
          nextSizes.set(elementId, { width, height });
          if (change.resizing === false) completedResizeIds.add(elementId);
        }
        return;
      }
      if (current.element_type === "sticky_note") {
        const width = Math.max(stickyMinSize, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(stickyMinSize, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(stickyMinSize, snapToMinorGrid(current.width || stickyDefaultSize));
        const currentHeight = Math.max(stickyMinSize, snapToMinorGrid(current.height || stickyDefaultSize));
        if (width !== currentWidth || height !== currentHeight) {
          nextSizes.set(elementId, { width, height });
          if (change.resizing === false) completedResizeIds.add(elementId);
        }
        return;
      }
      if (current.element_type === "image_asset") {
        const width = Math.max(imageMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(imageMinHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(imageMinWidth, snapToMinorGrid(current.width || imageDefaultWidth));
        const currentHeight = Math.max(imageMinHeight, snapToMinorGrid(current.height || imageDefaultWidth));
        if (width !== currentWidth || height !== currentHeight) {
          nextSizes.set(elementId, { width, height });
          if (change.resizing === false) completedResizeIds.add(elementId);
        }
        return;
      }
      if (current.element_type === "text_box") {
        const width = Math.max(textBoxMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(textBoxMinHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(textBoxMinWidth, snapToMinorGrid(current.width || textBoxDefaultWidth));
        const currentHeight = Math.max(textBoxMinHeight, snapToMinorGrid(current.height || textBoxDefaultHeight));
        if (width !== currentWidth || height !== currentHeight) {
          nextSizes.set(elementId, { width, height });
          if (change.resizing === false) completedResizeIds.add(elementId);
        }
        return;
      }
      if (current.element_type === "table") {
        const width = Math.max(tableMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(tableMinHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(tableMinWidth, snapToMinorGrid(current.width || tableDefaultWidth));
        const currentHeight = Math.max(tableMinHeight, snapToMinorGrid(current.height || tableDefaultHeight));
        if (width !== currentWidth || height !== currentHeight) {
          nextSizes.set(elementId, { width, height });
          if (change.resizing === false) completedResizeIds.add(elementId);
        }
        return;
      }
      if (
        current.element_type === "shape_rectangle" ||
        current.element_type === "shape_circle" ||
        current.element_type === "shape_pill" ||
        current.element_type === "shape_pentagon" ||
        current.element_type === "shape_chevron_left" ||
        current.element_type === "shape_arrow"
      ) {
        if (current.id === selectedFlowShapeId && hasUnsavedFlowShapeDraftChanges) return;
        const getShapeSize = (element: CanvasElementRow, override?: { width?: number; height?: number }) => {
          const baseWidth =
            element.element_type === "shape_circle"
              ? shapeCircleDefaultSize
              : element.element_type === "shape_pill"
              ? shapePillDefaultWidth
              : element.element_type === "shape_arrow"
              ? shapeArrowDefaultWidth
              : element.element_type === "shape_pentagon" || element.element_type === "shape_chevron_left"
              ? shapePentagonDefaultWidth
              : shapeRectangleDefaultWidth;
          const baseHeight =
            element.element_type === "shape_circle"
              ? shapeCircleDefaultSize
              : element.element_type === "shape_pill"
              ? shapePillDefaultHeight
              : element.element_type === "shape_arrow"
              ? shapeArrowDefaultHeight
              : element.element_type === "shape_pentagon" || element.element_type === "shape_chevron_left"
              ? shapePentagonDefaultHeight
              : shapeRectangleDefaultHeight;
          const minWidth = element.element_type === "shape_arrow" ? shapeArrowMinWidth : shapeMinWidth;
          const minHeight = element.element_type === "shape_arrow" ? shapeArrowMinHeight : shapeMinHeight;
          let nextWidth = Math.max(minWidth, snapToMinorGrid(override?.width ?? element.width ?? baseWidth));
          let nextHeight = Math.max(minHeight, snapToMinorGrid(override?.height ?? element.height ?? baseHeight));
          if (element.element_type === "shape_circle") {
            const side = Math.max(nextWidth, nextHeight, shapeMinWidth);
            nextWidth = side;
            nextHeight = side;
          }
          return { width: nextWidth, height: nextHeight };
        };
        const minWidth = current.element_type === "shape_arrow" ? shapeArrowMinWidth : shapeMinWidth;
        const minHeight = current.element_type === "shape_arrow" ? shapeArrowMinHeight : shapeMinHeight;
        let width = Math.max(minWidth, snapToMinorGrid(change.dimensions.width));
        let height = Math.max(minHeight, snapToMinorGrid(change.dimensions.height));
        const fallbackWidth =
          current.element_type === "shape_circle"
            ? shapeCircleDefaultSize
            : current.element_type === "shape_pill"
            ? shapePillDefaultWidth
            : current.element_type === "shape_arrow"
            ? shapeArrowDefaultWidth
            : current.element_type === "shape_pentagon" || current.element_type === "shape_chevron_left"
            ? shapePentagonDefaultWidth
            : shapeRectangleDefaultWidth;
        const fallbackHeight =
          current.element_type === "shape_circle"
            ? shapeCircleDefaultSize
            : current.element_type === "shape_pill"
            ? shapePillDefaultHeight
            : current.element_type === "shape_arrow"
            ? shapeArrowDefaultHeight
            : current.element_type === "shape_pentagon" || current.element_type === "shape_chevron_left"
            ? shapePentagonDefaultHeight
            : shapeRectangleDefaultHeight;
        let currentWidth = Math.max(minWidth, snapToMinorGrid(current.width || fallbackWidth));
        let currentHeight = Math.max(minHeight, snapToMinorGrid(current.height || fallbackHeight));
        if (current.element_type === "shape_circle") {
          const side = Math.max(width, height, shapeMinWidth);
          width = side;
          height = side;
          const currentSide = Math.max(currentWidth, currentHeight, shapeMinWidth);
          currentWidth = currentSide;
          currentHeight = currentSide;
        }
        const candidateRect = { x: current.pos_x, y: current.pos_y, width, height };
        const isPentagonChevronPair = (a: CanvasElementRow["element_type"], b: CanvasElementRow["element_type"]) =>
          (a === "shape_pentagon" && b === "shape_chevron_left") || (a === "shape_chevron_left" && b === "shape_pentagon");
        const exceedsAllowedOverlap = (
          a: { x: number; y: number; width: number; height: number },
          b: { x: number; y: number; width: number; height: number },
          allowed: number
        ) => {
          if (!boxesOverlap(a, b, 0)) return false;
          const overlapWidth = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
          const overlapHeight = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
          return overlapWidth > allowed && overlapHeight > allowed;
        };
        const overlapsOtherShape = elements
          .filter(
            (el) =>
              el.id !== elementId &&
              (el.element_type === "shape_rectangle" ||
                el.element_type === "shape_circle" ||
                el.element_type === "shape_pill" ||
                el.element_type === "shape_pentagon" ||
                el.element_type === "shape_chevron_left" ||
                el.element_type === "shape_arrow")
          )
          .some((el) => {
            const pending = nextSizes.get(el.id);
            const size = getShapeSize(el, pending ? { width: pending.width, height: pending.height } : undefined);
            const otherRect = { x: el.pos_x, y: el.pos_y, width: size.width, height: size.height };
            if (!boxesOverlap(candidateRect, otherRect, 0)) return false;
            if (isPentagonChevronPair(current.element_type, el.element_type)) {
              return exceedsAllowedOverlap(candidateRect, otherRect, minorGridSize * 2);
            }
            return true;
          });
        if (overlapsOtherShape) return;
        if (current.element_type === "shape_arrow") {
          const overlapsDocumentNode = nodes.some((doc) => {
            const size = getNodeSize(doc);
            return boxesOverlap(candidateRect, { x: doc.pos_x, y: doc.pos_y, width: size.width, height: size.height }, 0);
          });
          if (overlapsDocumentNode) return;
          const overlapsAnyElement = elements
            .filter((el) => el.id !== elementId)
            .some((el) => {
              const rect = getFlowNodeBounds(processFlowId(el.id));
              if (!rect) return false;
              return boxesOverlap(candidateRect, rect, 0);
            });
          if (overlapsAnyElement) return;
        }
        if (width !== currentWidth || height !== currentHeight) {
          nextSizes.set(elementId, { width, height });
          if (change.resizing === false) completedResizeIds.add(elementId);
        }
        return;
      }
      if (isMethodologyElementType(current.element_type)) {
        let minWidth = bowtieDefaultWidth;
        let minHeight = bowtieControlHeight;
        if (current.element_type === "bowtie_hazard") {
          minHeight = bowtieHazardHeight;
        } else if (
          current.element_type === "bowtie_top_event" ||
          current.element_type === "bowtie_threat" ||
          current.element_type === "bowtie_consequence"
        ) {
          minHeight = bowtieSquareHeight;
        } else if (current.element_type === "bowtie_risk_rating") {
          minHeight = bowtieRiskRatingHeight;
        } else if (current.element_type === "incident_finding") {
          minWidth = incidentDefaultWidth;
          minHeight = incidentThreeOneHeight;
        } else if (current.element_type.startsWith("incident_")) {
          minWidth = incidentCardWidth;
          minHeight = incidentCardHeight;
        }
        const width = Math.max(minWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(minHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(minWidth, snapToMinorGrid(current.width || minWidth));
        const currentHeight = Math.max(minHeight, snapToMinorGrid(current.height || minHeight));
        if (width !== currentWidth || height !== currentHeight) {
          nextSizes.set(elementId, { width, height });
          if (change.resizing === false) completedResizeIds.add(elementId);
        }
      }
    });
    if (!nextSizes.size) return;

    nextSizes.forEach((size, elementId) => {
      resizePersistValuesRef.current.set(elementId, size);
      const existing = resizePersistTimersRef.current.get(elementId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        const queued = resizePersistValuesRef.current.get(elementId);
        if (!queued) return;
        setElements((prev) => {
          let changed = false;
          const next = prev.map((el) => {
            if (el.id !== elementId) return el;
            const nextWidth = queued.width;
            const nextHeight = queued.height;
            if ((el.width ?? 0) === nextWidth && (el.height ?? 0) === nextHeight) return el;
            changed = true;
            return {
              ...el,
              width: nextWidth,
              height: nextHeight,
            };
          });
          return changed ? next : prev;
        });
        const { error: e } = await supabaseBrowser
          .schema("ms")
          .from("canvas_elements")
          .update({ width: queued.width, height: queued.height })
          .eq("id", elementId)
          .eq("map_id", mapId);
        if (e && !isAbortLikeError(e)) setError(e.message || "Unable to save component size.");
        resizePersistTimersRef.current.delete(elementId);
      }, completedResizeIds.has(elementId) ? 0 : 220);
      resizePersistTimersRef.current.set(elementId, timer);
    });
  }, [
    applyFlowNodeChanges,
    flushPendingFlowNodePositionChanges,
    scheduleFlowNodePositionChanges,
    elementsById,
    elements,
    nodes,
    getNodeSize,
    getFlowNodeBounds,
    mapId,
    snapToMinorGrid,
    canEditElement,
    selectedFlowShapeId,
    hasUnsavedFlowShapeDraftChanges,
  ]);

  useEffect(() => {
    const resizeTimers = resizePersistTimersRef.current;
    const resizeValues = resizePersistValuesRef.current;
    return () => {
      resizeTimers.forEach((timer) => clearTimeout(timer));
      resizeTimers.clear();
      resizeValues.clear();
    };
  }, []);

  const handleTableCellCommit = useCallback(
    async (elementId: string, rowIndex: number, columnIndex: number, value: string) => {
      const current = elements.find((el) => el.id === elementId && el.element_type === "table");
      if (!current || !canEditElement(current)) return;
      let nextConfig: Record<string, unknown> | null = null;
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== elementId || el.element_type !== "table") return el;
          const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
          const existingRows = Array.isArray(cfg.cell_texts)
            ? (cfg.cell_texts as unknown[]).map((row) => (Array.isArray(row) ? row.map((cell) => (cell == null ? "" : String(cell))) : []))
            : [];
          while (existingRows.length <= rowIndex) existingRows.push([]);
          while (existingRows[rowIndex].length <= columnIndex) existingRows[rowIndex].push("");
          existingRows[rowIndex][columnIndex] = value;
          nextConfig = {
            ...cfg,
            cell_texts: existingRows,
          };
          return { ...el, element_config: nextConfig };
        })
      );
      if (!canWriteMap || !nextConfig) return;
      const { data, error: e } = await supabaseBrowser
        .schema("ms")
        .from("canvas_elements")
        .update({ element_config: nextConfig })
        .eq("id", elementId)
        .eq("map_id", mapId)
        .select(canvasElementSelectColumns)
        .single();
      if (data) {
        const updated = data as unknown as CanvasElementRow;
        setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
      }
      if (e) setError(e.message || "Unable to save table cell.");
    },
    [elements, canEditElement, canWriteMap, mapId, setElements, setError]
  );

  const handleTableCellStyleCommit = useCallback(
    async (
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
    ) => {
      let nextConfig: Record<string, unknown> | null = null;
      let canPersist = false;
      setElements((prev) => {
        const current = prev.find((el) => el.id === elementId && el.element_type === "table");
        if (!current || !canEditElement(current)) return prev;
        canPersist = canWriteMap;
        const cfg = (current.element_config as Record<string, unknown> | null) ?? {};
        const existingRows = Array.isArray(cfg.cell_styles)
          ? (cfg.cell_styles as unknown[]).map((row) =>
              Array.isArray(row)
                ? row.map((cellStyle) => ((cellStyle && typeof cellStyle === "object" ? cellStyle : {}) as Record<string, unknown>))
                : []
            )
          : [];
        while (existingRows.length <= rowIndex) existingRows.push([]);
        while (existingRows[rowIndex].length <= columnIndex) existingRows[rowIndex].push({});
        const align = style.align === "left" || style.align === "right" ? style.align : "center";
        const vAlign = style.vAlign === "top" || style.vAlign === "bottom" ? style.vAlign : "middle";
        const fontSizeRaw = Number(style.fontSize ?? 10);
        const fontSize = Number.isFinite(fontSizeRaw) ? Math.max(10, Math.min(72, Math.round(fontSizeRaw))) : 10;
        const backgroundColor =
          typeof style.backgroundColor === "string" && /^#[0-9a-fA-F]{6}$/.test(style.backgroundColor)
            ? style.backgroundColor.toUpperCase()
            : style.backgroundColor === null
            ? null
            : undefined;
        existingRows[rowIndex][columnIndex] = {
          ...existingRows[rowIndex][columnIndex],
          bold: Boolean(style.bold),
          italic: Boolean(style.italic),
          underline: Boolean(style.underline),
          align,
          v_align: vAlign,
          font_size: fontSize,
          ...(backgroundColor !== undefined ? { background_color: backgroundColor } : {}),
        };
        nextConfig = {
          ...cfg,
          cell_styles: existingRows,
        };
        return prev.map((el) => (el.id === elementId ? { ...el, element_config: nextConfig } : el));
      });
      if (!nextConfig || !canPersist) return;
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("canvas_elements")
        .update({ element_config: nextConfig })
        .eq("id", elementId)
        .eq("map_id", mapId);
      if (e) setError(e.message || "Unable to save table cell style.");
    },
    [canEditElement, canWriteMap, mapId, setElements, setError]
  );
  const handleOpenEvidenceMediaOverlay = useCallback(
    (elementId: string) => {
      const element = elements.find((el) => el.id === elementId && el.element_type === "incident_evidence");
      if (!element) return;
      const cfg = (element.element_config as Record<string, unknown> | null) ?? {};
      const mediaUrl = imageUrlsByElementId[element.id];
      if (!mediaUrl) return;
      const rotationRaw = Number(cfg.media_rotation_deg ?? 0);
      const rotationDeg: 0 | 90 | 180 | 270 =
        rotationRaw === 90 || rotationRaw === 180 || rotationRaw === 270 ? rotationRaw : 0;
      setEvidenceMediaOverlay({
        elementId: element.id,
        fileName: String(cfg.media_name ?? "").trim() || "Evidence",
        description: String(cfg.description ?? "").trim(),
        mediaUrl,
        mediaMime: String(cfg.media_mime ?? "").trim(),
        rotationDeg,
      });
    },
    [elements, imageUrlsByElementId]
  );

  const handleToggleIncidentDetail = useCallback(
    async (elementId: string, nextOpen: boolean) => {
      let nextConfig: Record<string, unknown> | null = null;
      let canPersist = false;
      setElements((prev) => {
        const current = prev.find((el) => el.id === elementId && el.element_type.startsWith("incident_"));
        if (!current || !canEditElement(current)) return prev;
        canPersist = canWriteMap;
        nextConfig = {
          ...((current.element_config as Record<string, unknown> | null) ?? {}),
          incident_detail_open: nextOpen,
        };
        return prev.map((el) => (el.id === elementId ? { ...el, element_config: nextConfig } : el));
      });
      if (!nextConfig || !canPersist) return;
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("canvas_elements")
        .update({ element_config: nextConfig })
        .eq("id", elementId)
        .eq("map_id", mapId);
      if (e) setError(e.message || "Unable to save node detail state.");
    },
    [canEditElement, canWriteMap, mapId, setElements, setError]
  );

  const orgDirectReportCountByPersonId = useMemo(() => {
    const counts = new Map<string, number>();
    if (mapCategoryId !== "org_chart") return counts;
    const normalizeRef = (value: string | null | undefined) => {
      if (!value) return "";
      const trimmed = String(value).replace(/^process:/i, "").trim().toLowerCase();
      const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
      return uuidMatch ? uuidMatch[0].toLowerCase() : trimmed;
    };
    const peopleByNormalizedId = new Map(
      elements
        .filter((el) => el.element_type === "person")
        .map((el) => [normalizeRef(el.id), el] as const)
    );
    const resolvePersonByAnyRef = (refs: Array<string | null | undefined>) => {
      for (const ref of refs) {
        const normalized = normalizeRef(ref ?? "");
        if (!normalized) continue;
        const person = peopleByNormalizedId.get(normalized);
        if (person) return person;
      }
      return null;
    };
    peopleByNormalizedId.forEach((person) => counts.set(person.id, 0));
    relations.forEach((r) => {
      const relationType = String(r.relation_type ?? "").trim().toLowerCase();
      if (relationType !== "reports_to") return;
      const source = resolvePersonByAnyRef([r.source_system_element_id, r.from_node_id]);
      const target = resolvePersonByAnyRef([r.target_system_element_id, r.to_node_id]);
      if (!source || !target) return;
      if (source.id === target.id) return;
      const leaderId = source.pos_y <= target.pos_y ? source.id : target.id;
      counts.set(leaderId, (counts.get(leaderId) ?? 0) + 1);
    });
    return counts;
  }, [elements, mapCategoryId, relations]);
  const handleAnchorNodeNavigate = useCallback((anchorId: string, direction: "previous" | "next") => {
    anchorNavigateRef.current?.(anchorId, direction);
  }, []);

  useEffect(() => {
    if (isNodeDragActiveRef.current) return;
    const currentSelectedFlowIds = selectedFlowIdsRef.current;
    const directReportCountByPersonNormalizedId = buildOrgDirectReportCountByPersonNormalizedId({
      elements: canvasPreviewElements,
      relations,
      mapCategoryId,
    });
    const groupingElements = sortGroupingElementsForRender({
      elements: canvasPreviewElements,
      minWidth: groupingMinWidth,
      minHeight: groupingMinHeight,
      defaultWidth: groupingDefaultWidth,
      defaultHeight: groupingDefaultHeight,
    });
    const builtNodes: Node<FlowData>[] = [
        ...buildGroupingFlowNodes({
          groupingElements,
          selectedFlowIds: currentSelectedFlowIds,
          canWriteMap: canManipulateCanvasElements,
          canEditElement,
        }),
        ...buildDocumentFlowNodes({
          nodes,
          typesById,
          selectedFlowIds: currentSelectedFlowIds,
          canWriteMap: canManipulateCanvasElements,
          getNodeSize,
          unconfiguredDocumentTitle,
        }),
        ...canvasPreviewElements.map((el) => {
          const primaryElementNode = buildPrimaryElementFlowNode({
            element: el,
            selectedFlowIds: currentSelectedFlowIds,
            selectedTableId,
            canEditElement,
            canWriteMap: canManipulateCanvasElements,
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
            onNavigateAnchor: handleAnchorNodeNavigate,
            onTableCellCommit: handleTableCellCommit,
            onTableCellStyleCommit: handleTableCellStyleCommit,
            onToggleIncidentDetail: handleToggleIncidentDetail,
          });
          if (primaryElementNode !== undefined) return primaryElementNode;
          return buildSecondaryElementFlowNode({
            element: el,
            selectedFlowIds: currentSelectedFlowIds,
            canEditElement,
            canWriteMap: canManipulateCanvasElements,
            imageUrlsByElementId,
            onOpenEvidenceMedia: handleOpenEvidenceMediaOverlay,
            onToggleIncidentDetail: handleToggleIncidentDetail,
          });
        }).filter(Boolean) as Node<FlowData>[],
      ];
    const nextNodes = builtNodes.map((node) => ({
      ...node,
      draggable: canvasInteractionLocked ? false : node.draggable,
      selectable: canvasInteractionLocked ? false : node.selectable,
      data: {
        ...node.data,
        canResize: canManipulateCanvasElements && node.data.canResize !== false,
      },
    }));
    setFlowNodes(nextNodes);
  }, [nodes, canvasPreviewElements, typesById, setFlowNodes, getNodeSize, selectedTableId, canManipulateCanvasElements, canEditElement, selectedFlowShapeId, hasUnsavedFlowShapeDraftChanges, mapCategoryId, memberDisplayNameByUserId, userEmail, userId, formatStickyDate, imageUrlsByElementId, handleAnchorNodeNavigate, handleTableCellCommit, handleTableCellStyleCommit, handleOpenEvidenceMediaOverlay, handleToggleIncidentDetail, canvasInteractionLocked, orgDirectReportCountByPersonId, anchorSequenceNumberById, anchorGroupColorById, relations]);

  useEffect(() => {
    const previousSelectedFlowIds = selectedFlowIdsRef.current;
    selectedFlowIdsRef.current = selectedFlowIds;
    if (areStringSetsEqual(previousSelectedFlowIds, selectedFlowIds)) return;
    const changedIds = new Set<string>();
    previousSelectedFlowIds.forEach((id) => changedIds.add(id));
    selectedFlowIds.forEach((id) => changedIds.add(id));
    setFlowNodes((prev) =>
      prev.map((node) => {
        if (!changedIds.has(node.id)) return node;
        const selected = selectedFlowIds.has(node.id);
        const boxShadow = selected ? "0 0 0 2px rgba(15,23,42,0.9)" : "none";
        if (node.selected === selected && node.style?.boxShadow === boxShadow) return node;
        return {
          ...node,
          selected,
          style: {
            ...node.style,
            boxShadow,
          },
        };
      })
    );
  }, [selectedFlowIds, setFlowNodes]);

  const highlightedRelatedDocumentIds = useMemo(() => {
    if (isNodeDragActive) return new Set<string>();
    const hoveredGroupingId = hoveredNodeId?.startsWith("process:") ? parseProcessFlowId(hoveredNodeId) : null;
    const hoveredElementId = hoveredNodeId?.startsWith("process:") ? parseProcessFlowId(hoveredNodeId) : null;
    const isRelationConnectedToHovered = (rel: NodeRelationRow) =>
      !!hoveredNodeId &&
      (rel.from_node_id === hoveredNodeId ||
        rel.to_node_id === hoveredNodeId ||
        (hoveredElementId !== null &&
          (rel.source_system_element_id === hoveredElementId ||
            rel.target_system_element_id === hoveredElementId ||
            rel.source_grouping_element_id === hoveredElementId ||
            rel.target_grouping_element_id === hoveredElementId)) ||
        (hoveredGroupingId !== null &&
          (rel.source_grouping_element_id === hoveredGroupingId || rel.target_grouping_element_id === hoveredGroupingId)));

    const nextIds = new Set<string>();
    relations.forEach((rel) => {
      const isConnected = hoveredEdgeId ? rel.id === hoveredEdgeId : isRelationConnectedToHovered(rel);
      if (!isConnected) return;
      if (rel.from_node_id) nextIds.add(rel.from_node_id);
      if (rel.to_node_id) nextIds.add(rel.to_node_id);
    });
    return nextIds;
  }, [hoveredNodeId, hoveredEdgeId, relations, isNodeDragActive]);

  useEffect(() => {
    const previousIds = highlightedDocumentIdsRef.current;
    if (areStringSetsEqual(previousIds, highlightedRelatedDocumentIds)) return;
    const changedIds = new Set<string>();
    previousIds.forEach((id) => changedIds.add(id));
    highlightedRelatedDocumentIds.forEach((id) => changedIds.add(id));
    highlightedDocumentIdsRef.current = highlightedRelatedDocumentIds;

    setFlowNodes((prev) =>
      prev.map((node) => {
        if (node.data?.entityKind !== "document" || !changedIds.has(node.id)) return node;
        const classTokens = (node.className || "")
          .split(/\s+/)
          .filter(Boolean)
          .filter((token) => token !== "rf-hover-related-document");
        const shouldHighlight = highlightedRelatedDocumentIds.has(node.id) && !node.selected;
        if (shouldHighlight) classTokens.push("rf-hover-related-document");
        const nextClassName = classTokens.join(" ");
        if ((node.className || "") === nextClassName) return node;
        return { ...node, className: nextClassName };
      })
    );
  }, [highlightedRelatedDocumentIds, setFlowNodes]);

  const flowEdgesBase = useMemo<Edge[]>(
    () =>
      buildFlowEdgesBase({
        relations,
        nodes,
        elements: canvasPreviewElements,
        getNodeSize,
        mapCategoryId,
      }),
    [relations, nodes, canvasPreviewElements, getNodeSize, mapCategoryId]
  );

  const relationById = useMemo(() => new Map(relations.map((rel) => [rel.id, rel])), [relations]);
  const flowEdges = useMemo(() => {
    if (isNodeDragActive) {
      return flowEdgesBase.map((edge) => ({
        ...edge,
        data: {
          ...(edge.data ?? {}),
          displayLabel: "",
          skipObstacleLabelPlacement: true,
        },
      }));
    }
    const hoveredNodeElementId = hoveredNodeId?.startsWith("process:") ? parseProcessFlowId(hoveredNodeId) : null;
    const hoveredGroupingId = hoveredNodeElementId;
    const isConnectedToHoveredNode = (rel: NodeRelationRow) =>
      !!hoveredNodeId &&
      (rel.from_node_id === hoveredNodeId ||
        rel.to_node_id === hoveredNodeId ||
        (hoveredNodeElementId !== null &&
          (rel.source_system_element_id === hoveredNodeElementId ||
            rel.target_system_element_id === hoveredNodeElementId ||
            rel.source_grouping_element_id === hoveredNodeElementId ||
            rel.target_grouping_element_id === hoveredNodeElementId)) ||
        (hoveredGroupingId !== null &&
          (rel.source_grouping_element_id === hoveredGroupingId || rel.target_grouping_element_id === hoveredGroupingId)));
    const hasHoveredRelations = !!hoveredEdgeId || (!!hoveredNodeId && relations.some((rel) => isConnectedToHoveredNode(rel)));
    if (!hasHoveredRelations) return flowEdgesBase;
    return flowEdgesBase.map((edge) => {
      const rel = relationById.get(edge.id);
      if (!rel) return edge;
      const isConnected = hoveredEdgeId ? edge.id === hoveredEdgeId : isConnectedToHoveredNode(rel);
      const stroke = isConnected ? "#0f766e" : "#cbd5e1";
      const strokeWidth = isConnected ? 1.8 : 1.1;
      const labelFill = isConnected ? "#334155" : "#94a3b8";
      return {
        ...edge,
        style: { ...(edge.style ?? {}), stroke, strokeWidth },
        labelStyle: { ...(edge.labelStyle ?? {}), fill: labelFill },
      };
    });
  }, [flowEdgesBase, isNodeDragActive, relationById, hoveredNodeId, hoveredEdgeId, relations]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [selectedNodeId, nodes]
  );
  const selectedProcess = useMemo(
    () => (selectedProcessId ? elements.find((el) => el.id === selectedProcessId && el.element_type === "category") ?? null : null),
    [selectedProcessId, elements]
  );
  const selectedSystem = useMemo(
    () => (selectedSystemId ? elements.find((el) => el.id === selectedSystemId && el.element_type === "system_circle") ?? null : null),
    [selectedSystemId, elements]
  );
  const selectedProcessComponent = useMemo(
    () => (selectedProcessComponentId ? elements.find((el) => el.id === selectedProcessComponentId && el.element_type === "process_component") ?? null : null),
    [selectedProcessComponentId, elements]
  );
  const selectedPerson = useMemo(
    () =>
      selectedPersonId
        ? elements.find((el) => el.id === selectedPersonId && (el.element_type === "person" || el.element_type === "equipment" || el.element_type === "environment")) ?? null
        : null,
    [selectedPersonId, elements]
  );
  const selectedAnchor = useMemo(
    () => (selectedAnchorId ? elements.find((el) => el.id === selectedAnchorId && el.element_type === "anchor") ?? null : null),
    [selectedAnchorId, elements]
  );
  const selectedGrouping = useMemo(
    () => (selectedGroupingId ? elements.find((el) => el.id === selectedGroupingId && el.element_type === "grouping_container") ?? null : null),
    [selectedGroupingId, elements]
  );
  const selectedSticky = useMemo(
    () => (selectedStickyId ? elements.find((el) => el.id === selectedStickyId && el.element_type === "sticky_note") ?? null : null),
    [selectedStickyId, elements]
  );
  const selectedImage = useMemo(
    () => (selectedImageId ? elements.find((el) => el.id === selectedImageId && el.element_type === "image_asset") ?? null : null),
    [selectedImageId, elements]
  );
  const selectedTextBox = useMemo(
    () => (selectedTextBoxId ? elements.find((el) => el.id === selectedTextBoxId && el.element_type === "text_box") ?? null : null),
    [selectedTextBoxId, elements]
  );
  const selectedTable = useMemo(
    () => (selectedTableId ? elements.find((el) => el.id === selectedTableId && el.element_type === "table") ?? null : null),
    [selectedTableId, elements]
  );
  const selectedFlowShape = useMemo(
    () =>
      selectedFlowShapeId
        ? elements.find(
            (el) =>
              el.id === selectedFlowShapeId &&
              (el.element_type === "shape_rectangle" ||
                el.element_type === "shape_circle" ||
                el.element_type === "shape_pill" ||
                el.element_type === "shape_pentagon" ||
                el.element_type === "shape_chevron_left" ||
                el.element_type === "shape_arrow")
          ) ?? null
        : null,
    [selectedFlowShapeId, elements]
  );
  const selectedBowtieElement = useMemo(
    () =>
      selectedBowtieElementId
        ? elements.find((el) => el.id === selectedBowtieElementId && isMethodologyElementType(el.element_type)) ?? null
        : null,
    [selectedBowtieElementId, elements]
  );
  const selectedAnchorOrderIds = useMemo(
    () => {
      if (!selectedAnchorId) return [];
      const knownGroupIds = selectedAnchorGroupIds.length ? selectedAnchorGroupIds : [selectedAnchorId];
      const groupIdSet = new Set(knownGroupIds.filter((id) => anchorById.has(id)));
      groupIdSet.add(selectedAnchorId);
      const orderedDraftIds = anchorLinkedOrderDraft.filter((id) => groupIdSet.has(id));
      const missingIds = [...groupIdSet]
        .filter((id) => !orderedDraftIds.includes(id))
        .sort(
          (a, b) =>
            (anchorSequenceNumberById.get(a) ?? 1) - (anchorSequenceNumberById.get(b) ?? 1) ||
            (anchorById.get(a)?.heading ?? "").localeCompare(anchorById.get(b)?.heading ?? "")
        );
      return [...orderedDraftIds, ...missingIds];
    },
    [anchorById, anchorLinkedOrderDraft, anchorSequenceNumberById, selectedAnchorGroupIds, selectedAnchorId]
  );
  const selectedAnchorSequenceNumber = selectedAnchorId
    ? Math.max(1, selectedAnchorOrderIds.indexOf(selectedAnchorId) + 1 || anchorSequenceNumberById.get(selectedAnchorId) || 1)
    : 1;
  const selectedAnchorOrderIdSet = useMemo(
    () => new Set(selectedAnchorOrderIds),
    [selectedAnchorOrderIds]
  );
  const selectedAnchorDirectLinkedIdSet = useMemo(
    () =>
      new Set(
        selectedAnchorId
          ? anchorLinks
              .filter((link) => link.anchor_id === selectedAnchorId && anchorById.has(link.linked_anchor_id))
              .map((link) => link.linked_anchor_id)
          : []
      ),
    [anchorById, anchorLinks, selectedAnchorId]
  );
  const selectedAnchorOrderItems = useMemo(
    () =>
      selectedAnchorOrderIds
        .map((id, index) => {
          const anchor = anchorById.get(id);
          if (!anchor) return null;
          return {
            id: anchor.id,
            title: anchor.heading || "Anchor",
            creatorName: getAnchorCreatorName(anchor),
            sequenceNumber: index + 1,
            isCurrent: anchor.id === selectedAnchorId,
            isDirectLink: anchor.id !== selectedAnchorId && selectedAnchorDirectLinkedIdSet.has(anchor.id),
          };
        })
        .filter(Boolean) as Array<{ id: string; title: string; creatorName: string; sequenceNumber: number; isCurrent?: boolean; isDirectLink?: boolean }>,
    [anchorById, getAnchorCreatorName, selectedAnchorDirectLinkedIdSet, selectedAnchorId, selectedAnchorOrderIds]
  );
  const anchorSearchResults = useMemo(() => {
    if (!selectedAnchorId) return [];
    const query = anchorSearchDraft.trim().toLowerCase();
    if (!query) return [];
    return anchorElements
      .filter((anchor) => !selectedAnchorOrderIdSet.has(anchor.id))
      .filter((anchor) => {
        const creatorName = getAnchorCreatorName(anchor).toLowerCase();
        const title = (anchor.heading || "Anchor").toLowerCase();
        return title.includes(query) || creatorName.includes(query);
      })
      .sort((a, b) => (anchorSequenceNumberById.get(a.id) ?? 1) - (anchorSequenceNumberById.get(b.id) ?? 1) || a.heading.localeCompare(b.heading))
      .slice(0, 12)
      .map((anchor) => ({
        id: anchor.id,
        title: anchor.heading || "Anchor",
        creatorName: getAnchorCreatorName(anchor),
        sequenceNumber: anchorSequenceNumberById.get(anchor.id) ?? 1,
      }));
  }, [anchorElements, anchorSearchDraft, anchorSequenceNumberById, getAnchorCreatorName, selectedAnchorId, selectedAnchorOrderIdSet]);
  const selectedSingleFlowId = useMemo(() => {
    if (selectedFlowIds.size !== 1) return null;
    const [flowId] = Array.from(selectedFlowIds);
    return flowId ?? null;
  }, [selectedFlowIds]);
  const currentSpecificSelectedFlowId = useMemo(() => {
    if (selectedNodeId) return selectedNodeId;
    if (selectedProcessId) return processFlowId(selectedProcessId);
    if (selectedSystemId) return processFlowId(selectedSystemId);
    if (selectedProcessComponentId) return processFlowId(selectedProcessComponentId);
    if (selectedPersonId) return processFlowId(selectedPersonId);
    if (selectedAnchorId) return processFlowId(selectedAnchorId);
    if (selectedGroupingId) return processFlowId(selectedGroupingId);
    if (selectedStickyId) return processFlowId(selectedStickyId);
    if (selectedImageId) return processFlowId(selectedImageId);
    if (selectedTextBoxId) return processFlowId(selectedTextBoxId);
    if (selectedTableId) return processFlowId(selectedTableId);
    if (selectedFlowShapeId) return processFlowId(selectedFlowShapeId);
    if (selectedBowtieElementId) return processFlowId(selectedBowtieElementId);
    return null;
  }, [
    selectedBowtieElementId,
    selectedFlowShapeId,
    selectedAnchorId,
    selectedGroupingId,
    selectedImageId,
    selectedNodeId,
    selectedPersonId,
    selectedProcessComponentId,
    selectedProcessId,
    selectedStickyId,
    selectedSystemId,
    selectedTableId,
    selectedTextBoxId,
  ]);
  const desktopToolbarSelection = useMemo(() => {
    if (!selectedSingleFlowId) return null;
    if (!selectedSingleFlowId.startsWith("process:")) {
      if (!nodesById.has(selectedSingleFlowId)) return null;
      return { kind: "document" as const, id: selectedSingleFlowId, supportsRelationships: true };
    }
    const elementId = parseProcessFlowId(selectedSingleFlowId);
    const element = elementsById.get(elementId);
    if (!element) return null;
    switch (element.element_type) {
      case "system_circle":
        return { kind: "system" as const, id: elementId, supportsRelationships: true };
      case "process_component":
        return { kind: "process_component" as const, id: elementId, supportsRelationships: true };
      case "person":
      case "equipment":
      case "environment":
        return { kind: "person" as const, id: elementId, supportsRelationships: true };
      case "anchor":
        return { kind: "anchor" as const, id: elementId, supportsRelationships: false };
      case "grouping_container":
        return { kind: "grouping" as const, id: elementId, supportsRelationships: true };
      case "image_asset":
        return { kind: "image" as const, id: elementId, supportsRelationships: true };
      case "category":
        return { kind: "category" as const, id: elementId, supportsRelationships: false };
      case "sticky_note":
        return { kind: "sticky" as const, id: elementId, supportsRelationships: false };
      case "text_box":
        return { kind: "text_box" as const, id: elementId, supportsRelationships: false };
      case "table":
        return { kind: "table" as const, id: elementId, supportsRelationships: false };
      case "shape_rectangle":
      case "shape_circle":
      case "shape_pill":
      case "shape_pentagon":
      case "shape_chevron_left":
      case "shape_arrow":
        return { kind: "shape" as const, id: elementId, supportsRelationships: false };
      default:
        return {
          kind: "bowtie" as const,
          id: elementId,
          supportsRelationships: true,
        };
    }
  }, [elementsById, nodesById, selectedSingleFlowId]);
  const availableFactorPeople = useMemo(
    () =>
      elements
        .filter((element) => element.element_type === "person")
        .map((element) => {
          const labels = parsePersonLabels(element.heading);
          const role = labels.role.trim();
          const department = labels.department.trim();
          const roleLabel = role && role !== "Role Name" ? role : "Person";
          const departmentLabel = department && department !== "Department" ? department : "";
          return {
            id: element.id,
            label: departmentLabel ? `${roleLabel} • ${departmentLabel}` : roleLabel,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [elements]
  );

  const headingItems = useMemo(
    () => outlineItems.filter((i) => i.kind === "heading"),
    [outlineItems]
  );
  const level1Headings = useMemo(
    () => headingItems.filter((h) => h.heading_level === 1),
    [headingItems]
  );
  const level2Headings = useMemo(
    () => headingItems.filter((h) => h.heading_level === 2),
    [headingItems]
  );
  const headingById = useMemo(
    () => new Map(headingItems.map((h) => [h.id, h])),
    [headingItems]
  );
  const outlineEditItem = useMemo(
    () => (outlineEditItemId ? outlineItems.find((i) => i.id === outlineEditItemId) ?? null : null),
    [outlineEditItemId, outlineItems]
  );

  const hasCollapsedAncestor = useCallback((headingId: string | null) => {
    let current = headingId;
    while (current) {
      if (collapsedHeadingIds.has(current)) return true;
      current = headingById.get(current)?.parent_heading_id ?? null;
    }
    return false;
  }, [collapsedHeadingIds, headingById]);

  const visibleOutlineItems = useMemo(() => {
    return outlineItems.filter((item) => {
      if (item.kind === "heading") {
        if (item.heading_level === 1) return true;
        return !hasCollapsedAncestor(item.parent_heading_id);
      }
      return !hasCollapsedAncestor(item.heading_id);
    });
  }, [outlineItems, hasCollapsedAncestor]);
  const {
    desktopNodeAction,
    setDesktopNodeAction,
    leftAsideSlideIn,
    activePrimaryLeftAsideKey,
    shouldShowDesktopStructurePanel,
    isPrimaryLeftAsideOpen,
    autosavePointerLockRef,
    armPaneClearSuppression,
    consumePaneClearSuppression,
    beginNodeDrag,
    beginNodeDragStop,
    finishNodeDragStop,
  } = useCanvasAsideController({
    isMobile,
    selectedNodeId,
    selectedProcessId,
    selectedSystemId,
    selectedProcessComponentId,
    selectedPersonId,
    selectedAnchorId,
    selectedGroupingId,
    selectedStickyId,
    selectedImageId,
    selectedTextBoxId,
    selectedTableId,
    selectedFlowShapeId,
    selectedBowtieElementId,
    selectedSingleFlowId,
    currentSpecificSelectedFlowId,
    outlineNodeId,
    isNodeDragActiveRef,
  });
  const loadOutline = useCallback(async (nodeId: string) => {
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("document_outline_items")
      .select("id,map_id,node_id,kind,heading_level,parent_heading_id,heading_id,title,content_text,sort_order,created_at")
      .eq("node_id", nodeId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (e) {
      setError(e.message || "Unable to load outline.");
      return;
    }
    setOutlineItems((data ?? []) as OutlineItemRow[]);
  }, []);

  useEffect(() => {
    if (!rf || !pendingViewport) return;
    rf.setViewport(pendingViewport, { duration: 250 });
    mobileViewportInitializedRef.current = mapId;
    setPendingViewport(null);
  }, [rf, pendingViewport, mapId]);

  useEffect(() => {
    if (!isMobile || !rf || loading || hasStoredViewport || mobileViewportInitializedRef.current === mapId) return;

    const viewportWidth = canvasRef.current?.clientWidth ?? window.innerWidth;
    const viewportHeight = canvasRef.current?.clientHeight ?? window.innerHeight;
    if (viewportWidth <= 0 || viewportHeight <= 0) return;

    if (!searchCatalog.length) {
      rf.setViewport({ x: 24, y: 24, zoom: 0.9 }, { duration: 280 });
      mobileViewportInitializedRef.current = mapId;
      return;
    }

    const paddingX = 44;
    const paddingY = 56;
    const bounds = searchCatalog.reduce(
      (acc, item) => ({
        minX: Math.min(acc.minX, item.x),
        minY: Math.min(acc.minY, item.y),
        maxX: Math.max(acc.maxX, item.x + item.width),
        maxY: Math.max(acc.maxY, item.y + item.height),
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      }
    );

    const contentWidth = Math.max(bounds.maxX - bounds.minX, 240);
    const contentHeight = Math.max(bounds.maxY - bounds.minY, 240);
    const zoom = clamp(
      Math.min(
        (viewportWidth - paddingX * 2) / contentWidth,
        (viewportHeight - paddingY * 2) / contentHeight
      ),
      0.68,
      1
    );
    const centerX = bounds.minX + contentWidth / 2;
    const centerY = bounds.minY + contentHeight / 2;

    rf.setViewport(
      {
        x: viewportWidth / 2 - centerX * zoom,
        y: viewportHeight / 2 - centerY * zoom,
        zoom,
      },
      { duration: 320 }
    );
    mobileViewportInitializedRef.current = mapId;
  }, [isMobile, rf, loading, hasStoredViewport, mapId, searchCatalog]);

  useEffect(() => {
    if (!selectedNode) return;
    setTitle(selectedNode.title ?? "");
    setDocumentNumber(selectedNode.document_number ?? "");
    setSelectedTypeId(selectedNode.type_id ?? "");
    setDisciplineSelection(parseDisciplines(selectedNode.discipline));
    setUserGroup(selectedNode.user_group ?? "");
    setOwnerName(selectedNode.owner_name ?? "");
  }, [selectedNode]);
  useEffect(() => {
    if (!selectedNodeId) setShowDisciplineMenu(false);
  }, [selectedNodeId]);
  useEffect(() => {
    if (isGuestViewer) {
      setUserEmail(guestSessionEmail || "");
      return;
    }
    if (typeof window === "undefined") return;
    setUserEmail(localStorage.getItem("investigation_tool_user_email") || "");
  }, [guestSessionEmail, isGuestViewer]);

  useEffect(() => {
    mobileViewportInitializedRef.current = null;
    setHasStoredViewport(false);
  }, [mapId]);

  useEffect(() => {
    if (!selectedProcess) return;
    setProcessHeadingDraft(selectedProcess.heading ?? "");
    setProcessWidthDraft(String(Math.max(processMinWidthSquares, Math.round((selectedProcess.width || processHeadingWidth) / minorGridSize))));
    setProcessHeightDraft(String(Math.max(processMinHeightSquares, Math.round((selectedProcess.height || processHeadingHeight) / minorGridSize))));
    setProcessColorDraft(selectedProcess.color_hex ?? null);
    const cfg = (selectedProcess.element_config as Record<string, unknown> | null) ?? {};
    setProcessFillModeDraft(String(cfg.fill_mode ?? "fill") === "outline" ? "outline" : "fill");
    setProcessOutlineColorDraft(typeof cfg.outline_color === "string" ? cfg.outline_color : selectedProcess.color_hex ?? null);
    const outlineWidthRaw = Number(cfg.outline_width ?? 1);
    setProcessOutlineWidthDraft(String(Number.isFinite(outlineWidthRaw) ? Math.max(1, Math.min(12, Math.round(outlineWidthRaw))) : 1));
  }, [selectedProcess]);
  useEffect(() => {
    if (!selectedSystem) return;
    setSystemNameDraft(selectedSystem.heading ?? "");
  }, [selectedSystem]);
  useEffect(() => {
    if (!selectedProcessComponent) return;
    setProcessComponentLabelDraft(selectedProcessComponent.heading ?? "");
  }, [selectedProcessComponent]);
  useEffect(() => {
    if (!selectedPerson) return;
    if (selectedPerson.element_type === "equipment") {
      const labels = parseEquipmentLabels(selectedPerson.heading);
      setEquipmentTypeDraft(labels.equipmentType);
      setEquipmentIdentifierDraft(labels.identifier);
      return;
    }
    if (selectedPerson.element_type === "environment") {
      const labels = parseEnvironmentLabels(selectedPerson.heading);
      setEnvironmentDetailDraft(labels.detail);
      setEnvironmentFactorTypeDraft(labels.factorType);
      return;
    }
    if (mapCategoryId === "org_chart") {
      const cfg = parseOrgChartPersonConfig(selectedPerson.element_config);
      setPersonRoleDraft(cfg.position_title);
      setPersonRoleIdDraft(cfg.role_id);
      setPersonDepartmentDraft(cfg.department);
      setPersonOccupantNameDraft(cfg.occupant_name);
      setPersonStartDateDraft(cfg.start_date);
      setPersonEmploymentTypeDraft(cfg.employment_type);
      setPersonActingNameDraft(cfg.acting_name);
      setPersonActingStartDateDraft(cfg.acting_start_date);
      setPersonRecruitingDraft(cfg.recruiting);
      setPersonProposedRoleDraft(cfg.proposed_role);
      return;
    }
    const labels = parsePersonLabels(selectedPerson.heading);
    const cfg = (selectedPerson.element_config as Record<string, unknown> | null) ?? {};
    setPersonTypeDraft(typeof cfg.person_type === "string" ? String(cfg.person_type).trim() : "");
    setPersonRoleDraft(labels.role);
    setPersonRoleIdDraft("");
    setPersonDepartmentDraft(labels.department);
    setPersonOccupantNameDraft("");
    setPersonStartDateDraft("");
    setPersonEmploymentTypeDraft("fte");
    setPersonActingNameDraft("");
    setPersonActingStartDateDraft("");
    setPersonRecruitingDraft(false);
    setPersonProposedRoleDraft(false);
  }, [selectedPerson, mapCategoryId]);
  useEffect(() => {
    if (!selectedProcess) return;
    const cfg = (selectedProcess.element_config as Record<string, unknown> | null) ?? {};
    const processSizeRaw = Number(cfg.font_size ?? 12);
    setProcessFontSizeDraft(String(Number.isFinite(processSizeRaw) ? Math.max(10, Math.min(72, Math.round(processSizeRaw))) : 12));
  }, [selectedProcess]);
  useEffect(() => {
    if (!selectedGrouping) return;
    setGroupingLabelDraft(selectedGrouping.heading ?? "");
    const cfg = (selectedGrouping.element_config as Record<string, unknown> | null) ?? {};
    setGroupingHeaderColorDraft(typeof cfg.header_bg_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.header_bg_color) ? cfg.header_bg_color.toUpperCase() : "#FFFFFF");
    const headerFontSizeRaw = Number(cfg.header_font_size ?? 11);
    setGroupingHeaderFontSizeDraft(String(Number.isFinite(headerFontSizeRaw) ? Math.max(10, Math.min(48, Math.round(headerFontSizeRaw))) : 11));
    const outlineWidthRaw = Number(cfg.outline_width ?? 1);
    setGroupingOutlineWidthDraft(String(Number.isFinite(outlineWidthRaw) ? Math.max(1, Math.min(12, Math.round(outlineWidthRaw))) : 1));
    setGroupingWidthDraft(String(Math.max(groupingMinWidthSquares, Math.round((selectedGrouping.width || groupingDefaultWidth) / minorGridSize))));
    setGroupingHeightDraft(String(Math.max(groupingMinHeightSquares, Math.round((selectedGrouping.height || groupingDefaultHeight) / minorGridSize))));
  }, [selectedGrouping]);
  useEffect(() => {
    if (!selectedAnchor) {
      setAnchorTitleDraft("");
      setAnchorColorDraft("#0F766E");
      setAnchorSearchDraft("");
      setAnchorLinkedOrderDraft([]);
      return;
    }
    setAnchorTitleDraft(selectedAnchor.heading ?? "Anchor");
    setAnchorColorDraft(selectedAnchorGroupColor);
    setAnchorSearchDraft("");
    const groupIds = anchorGroupIdsById.get(selectedAnchor.id) ?? [selectedAnchor.id];
    const orderedGroupIds = groupIds
      .filter((id) => anchorById.has(id))
      .sort(
        (a, b) =>
          (anchorSequenceNumberById.get(a) ?? 1) - (anchorSequenceNumberById.get(b) ?? 1) ||
          (anchorById.get(a)?.heading ?? "").localeCompare(anchorById.get(b)?.heading ?? "")
      );
    setAnchorLinkedOrderDraft(orderedGroupIds.includes(selectedAnchor.id) ? orderedGroupIds : [selectedAnchor.id, ...orderedGroupIds]);
  }, [anchorById, anchorGroupIdsById, anchorSequenceNumberById, selectedAnchor, selectedAnchorGroupColor]);
  useEffect(() => {
    if (!selectedSticky) return;
    setStickyTextDraft(selectedSticky.heading ?? "");
    const cfg = (selectedSticky.element_config as Record<string, unknown> | null) ?? {};
    setStickyBackgroundColorDraft(typeof cfg.background_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.background_color) ? cfg.background_color.toUpperCase() : "#FEF08A");
    setStickyOutlineColorDraft(typeof cfg.outline_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.outline_color) ? cfg.outline_color.toUpperCase() : "#F59E0B");
    setStickyFillModeDraft(String(cfg.fill_mode ?? "fill") === "outline" ? "outline" : "fill");
    const outlineWidthRaw = Number(cfg.outline_width ?? 1);
    setStickyOutlineWidthDraft(String(Number.isFinite(outlineWidthRaw) ? Math.max(1, Math.min(12, Math.round(outlineWidthRaw))) : 1));
  }, [selectedSticky]);
  useEffect(() => {
    if (!selectedImage) return;
    const cfg = (selectedImage.element_config as Record<string, unknown> | null) ?? {};
    setImageDescriptionDraft(String(cfg.description ?? selectedImage.heading ?? ""));
  }, [selectedImage]);
  useEffect(() => {
    if (!selectedTextBox) return;
    const cfg = (selectedTextBox.element_config as Record<string, unknown> | null) ?? {};
    setTextBoxContentDraft(selectedTextBox.heading ?? "Click to edit text box");
    setTextBoxBoldDraft(Boolean(cfg.bold));
    setTextBoxItalicDraft(Boolean(cfg.italic));
    setTextBoxUnderlineDraft(Boolean(cfg.underline));
    const align = String(cfg.align ?? "left");
    setTextBoxAlignDraft(align === "center" || align === "right" ? align : "left");
    const size = Number(cfg.font_size ?? 16);
    setTextBoxFontSizeDraft(String(Number.isFinite(size) ? Math.max(16, Math.min(168, Math.round(size))) : 16));
    const backgroundColor = typeof cfg.background_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.background_color) ? cfg.background_color.toUpperCase() : "#FFFFFF";
    setTextBoxBackgroundColorDraft(backgroundColor);
    setTextBoxOutlineDraft(Boolean(cfg.outline));
    const outlineColor = typeof cfg.outline_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.outline_color) ? cfg.outline_color.toUpperCase() : "#111827";
    setTextBoxOutlineColorDraft(outlineColor);
    const outlineWidthRaw = Number(cfg.outline_width ?? 2);
    setTextBoxOutlineWidthDraft(String(Number.isFinite(outlineWidthRaw) ? Math.max(1, Math.min(12, Math.round(outlineWidthRaw))) : 2));
  }, [selectedTextBox]);
  useEffect(() => {
    if (!selectedTable) return;
    const cfg = (selectedTable.element_config as Record<string, unknown> | null) ?? {};
    const parsedRows = Number(cfg.rows ?? 2);
    const parsedColumns = Number(cfg.columns ?? 2);
    const rows = Number.isFinite(parsedRows) ? Math.max(tableMinRows, Math.floor(parsedRows)) : tableMinRows;
    const columns = Number.isFinite(parsedColumns) ? Math.max(tableMinColumns, Math.floor(parsedColumns)) : tableMinColumns;
    const headerBg = typeof cfg.header_bg_color === "string" ? cfg.header_bg_color : "";
    const gridLineColor = typeof cfg.grid_line_color === "string" ? cfg.grid_line_color : "";
    const gridLineWeightRaw = Number(cfg.grid_line_weight ?? 0.5);
    setTableRowsDraft(String(rows));
    setTableColumnsDraft(String(columns));
    setTableHeaderBgDraft(headerBg.toUpperCase());
    setTableGridLineColorDraft(gridLineColor.toUpperCase());
    setTableGridLineWeightDraft(String(Number.isFinite(gridLineWeightRaw) ? Math.max(0.5, Math.min(6, Math.round(gridLineWeightRaw * 2) / 2)) : 0.5));
    setTableBoldDraft(Boolean(cfg.bold));
    setTableItalicDraft(Boolean(cfg.italic));
    setTableUnderlineDraft(Boolean(cfg.underline));
    const align = String(cfg.align ?? "center");
    setTableAlignDraft(align === "left" || align === "right" ? align : "center");
    const size = Number(cfg.font_size ?? 10);
    setTableFontSizeDraft(String(Number.isFinite(size) ? Math.max(10, Math.min(72, Math.round(size))) : 10));
  }, [selectedTable]);
  useEffect(() => {
    if (!selectedFlowShape) {
      hydratedFlowShapeDraftIdRef.current = null;
      return;
    }
    if (hydratedFlowShapeDraftIdRef.current === selectedFlowShape.id) return;
    const cfg = (selectedFlowShape.element_config as Record<string, unknown> | null) ?? {};
    setFlowShapeTextDraft(selectedFlowShape.heading ?? "Shape text");
    setFlowShapeBoldDraft(Boolean(cfg.bold));
    setFlowShapeItalicDraft(Boolean(cfg.italic));
    setFlowShapeUnderlineDraft(Boolean(cfg.underline));
    const align = String(cfg.align ?? "center");
    setFlowShapeAlignDraft(align === "left" || align === "right" ? align : "center");
    const size = Number(cfg.font_size ?? 24);
    setFlowShapeFontSizeDraft(String(Number.isFinite(size) ? Math.max(12, Math.min(168, Math.round(size))) : 24));
    setFlowShapeColorDraft(selectedFlowShape.color_hex ?? shapeDefaultFillColor);
    const fillModeRaw = String(cfg.fill_mode ?? "fill");
    setFlowShapeFillModeDraft(fillModeRaw === "outline" ? "outline" : "fill");
    const outlineColor =
      typeof cfg.outline_color === "string" && /^#[0-9a-fA-F]{6}$/.test(cfg.outline_color)
        ? cfg.outline_color.toUpperCase()
        : (selectedFlowShape.color_hex ?? shapeDefaultFillColor);
    setFlowShapeOutlineColorDraft(outlineColor);
    const outlineWidthRaw = Number(cfg.outline_width ?? 3);
    setFlowShapeOutlineWidthDraft(String(Number.isFinite(outlineWidthRaw) ? Math.max(1, Math.min(12, Math.round(outlineWidthRaw))) : 3));
    const directionRaw = String(cfg.direction ?? "right");
    setFlowShapeDirectionDraft(directionRaw === "left" ? "left" : "right");
    const rotationRaw = Number(cfg.rotation_deg ?? 0);
    setFlowShapeRotationDraft(
      rotationRaw === 90 || rotationRaw === 180 || rotationRaw === 270 ? rotationRaw : 0
    );
    hydratedFlowShapeDraftIdRef.current = selectedFlowShape.id;
  }, [selectedFlowShape]);
  const imagePathPairs = useMemo(
    () =>
      elements
        .filter((el) => el.element_type === "image_asset" || el.element_type === "incident_evidence")
        .map((el) => {
          const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
          const key = el.element_type === "incident_evidence" ? "media_storage_path" : "storage_path";
          return {
            id: el.id,
            path: typeof cfg[key] === "string" ? String(cfg[key]) : "",
          };
        })
        .filter((pair) => pair.path)
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    [elements]
  );
  const imagePathSignature = useMemo(
    () => imagePathPairs.map((pair) => `${pair.id}:${pair.path}`).join("|"),
    [imagePathPairs]
  );
  useEffect(() => {
    imagePathPairsRef.current = imagePathPairs;
  }, [imagePathPairs]);
  useEffect(() => {
    let cancelled = false;
    if (isGuestViewer) {
      convertedMediaObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      convertedMediaObjectUrlsRef.current.clear();
      setImageUrlsByElementId(initialSnapshot?.imageUrlsByElementId ?? {});
      return;
    }
    const pairs = imagePathPairsRef.current;
    if (!pairs.length) {
      convertedMediaObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      convertedMediaObjectUrlsRef.current.clear();
      setImageUrlsByElementId({});
      return;
    }
    const run = async () => {
      const paths = pairs.map((pair) => pair.path);
      const { data, error: e } = await supabaseBrowser.storage.from("systemmap").createSignedUrls(paths, 3600);
      if (cancelled) return;
      if (e || !data) {
        setImageUrlsByElementId({});
        return;
      }
      const urlByPath = new Map<string, string>();
      data.forEach((row) => {
        if (row.path && row.signedUrl) urlByPath.set(row.path, row.signedUrl);
      });
      const next: Record<string, string> = {};
      pairs.forEach((pair) => {
        const signedUrl = urlByPath.get(pair.path);
        if (signedUrl) next[pair.id] = signedUrl;
      });
      const incidentEvidenceIds = new Set(
        elements.filter((el) => el.element_type === "incident_evidence").map((el) => el.id)
      );
      if (incidentEvidenceIds.size > 0) {
        await Promise.all(
          Object.entries(next).map(async ([elementId, signedUrl]) => {
            if (!incidentEvidenceIds.has(elementId)) return;
            try {
              const response = await fetch(signedUrl);
              if (!response.ok) return;
              const blob = await response.blob();
              const shouldConvert =
                isHeicLike(blob.type, "") || (blob.type === "application/octet-stream" ? await blobLooksLikeHeif(blob) : await blobLooksLikeHeif(blob));
              if (!shouldConvert) return;
              const jpegBlob = await convertHeicBlobToJpegBlob(blob);
              if (!jpegBlob || cancelled) return;
              const objectUrl = URL.createObjectURL(jpegBlob);
              convertedMediaObjectUrlsRef.current.add(objectUrl);
              next[elementId] = objectUrl;
            } catch {
              // Keep signed URL fallback if conversion fails.
            }
          })
        );
      }
      convertedMediaObjectUrlsRef.current.forEach((url) => {
        if (!Object.values(next).includes(url)) {
          URL.revokeObjectURL(url);
          convertedMediaObjectUrlsRef.current.delete(url);
        }
      });
      setImageUrlsByElementId(next);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [imagePathSignature, elements, initialSnapshot, isGuestViewer, isHeicLike, blobLooksLikeHeif, convertHeicBlobToJpegBlob]);
  const handleRotateEvidenceMediaOverlay = useCallback(() => {
    setEvidenceMediaOverlay((prev) => {
      if (!prev) return prev;
      const nextRotation = ((prev.rotationDeg + 90) % 360) as 0 | 90 | 180 | 270;
      return { ...prev, rotationDeg: nextRotation };
    });
  }, []);
  const handleCancelEvidenceMediaOverlay = useCallback(() => {
    setEvidenceMediaOverlay(null);
  }, []);
  const handleSaveEvidenceMediaOverlay = useCallback(async () => {
    if (!evidenceMediaOverlay) return;
    const element = elements.find((el) => el.id === evidenceMediaOverlay.elementId && el.element_type === "incident_evidence");
    if (!element) {
      setEvidenceMediaOverlay(null);
      return;
    }
    const currentConfig = (element.element_config as Record<string, unknown> | null) ?? {};
    const nextConfig: Record<string, unknown> = {
      ...currentConfig,
      media_name: evidenceMediaOverlay.fileName.trim() || String(currentConfig.media_name ?? "").trim() || "Evidence",
      description: evidenceMediaOverlay.description,
      media_rotation_deg: evidenceMediaOverlay.rotationDeg,
    };
    const unchanged =
      String(currentConfig.media_name ?? "").trim() === String(nextConfig.media_name ?? "").trim() &&
      String(currentConfig.description ?? "") === String(nextConfig.description ?? "") &&
      Number(currentConfig.media_rotation_deg ?? 0) === Number(nextConfig.media_rotation_deg ?? 0);
    if (!unchanged) {
      const { data, error: e } = await supabaseBrowser
        .schema("ms")
        .from("canvas_elements")
        .update({ element_config: nextConfig })
        .eq("id", element.id)
        .eq("map_id", mapId)
        .select(canvasElementSelectColumns)
        .single();
      if (e || !data) {
        setError(e?.message || "Unable to save evidence media details.");
      } else {
        const updated = data as unknown as CanvasElementRow;
        setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
        setBowtieDraft((prev) => (selectedBowtieElementId === updated.id ? (updated.element_config as BowtieDraftState | null) ?? prev : prev));
      }
    }
    setEvidenceMediaOverlay(null);
  }, [evidenceMediaOverlay, elements, mapId, setError, setElements, selectedBowtieElementId]);
  useEffect(() => {
    if (!selectedBowtieElement) return;
    const currentConfig = (selectedBowtieElement.element_config as BowtieDraftState | null) ?? {};
    const label = getMethodologyEditableLabel(selectedBowtieElement.element_type, selectedBowtieElement.heading);
    const description = String(currentConfig.description ?? "").trim();
    setBowtieDraft({
      ...currentConfig,
      ...(selectedBowtieElement.element_type !== "bowtie_risk_rating"
        ? {
            label,
            description,
            body_display_mode: getMethodologyBodyDisplayMode(
              label,
              description,
              currentConfig.body_display_mode
            ),
          }
        : {}),
    });
  }, [selectedBowtieElement]);
  useEffect(() => {
    setEvidenceUploadPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setEvidenceUploadFile(null);
  }, [selectedBowtieElementId]);
  const handleClearEvidenceUploadFile = useCallback(() => {
    if (evidenceUploadPreviewUrl) URL.revokeObjectURL(evidenceUploadPreviewUrl);
    setEvidenceUploadPreviewUrl(null);
    setEvidenceUploadFile(null);
  }, [evidenceUploadPreviewUrl]);
  const handleSelectEvidenceUploadFile = useCallback(
    async (file: File | null) => {
      if (evidenceUploadPreviewUrl) URL.revokeObjectURL(evidenceUploadPreviewUrl);
      setEvidenceUploadPreviewUrl(null);
      setEvidenceUploadFile(null);
      if (!file) return;
      let nextFile = file;
      const looksHeic = isHeicLike(file.type, file.name) || (await blobLooksLikeHeif(file));
      if (looksHeic) {
        const jpegBlob = await convertHeicBlobToJpegBlob(file);
        if (jpegBlob) {
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          nextFile = new File([jpegBlob], `${baseName}.jpg`, { type: "image/jpeg" });
        }
      }
      setEvidenceUploadFile(nextFile);
      const objectUrl = URL.createObjectURL(nextFile);
      setEvidenceUploadPreviewUrl(objectUrl);
    },
    [evidenceUploadPreviewUrl, isHeicLike, blobLooksLikeHeif, convertHeicBlobToJpegBlob]
  );
  const handleDeleteEvidenceAttachment = useCallback(async () => {
    if (!selectedBowtieElement || selectedBowtieElement.element_type !== "incident_evidence") return;
    const currentConfig = (selectedBowtieElement.element_config as Record<string, unknown> | null) ?? {};
    const path = typeof currentConfig.media_storage_path === "string" ? currentConfig.media_storage_path : "";
    if (path) {
      const { error: removeError } = await supabaseBrowser.storage.from("systemmap").remove([path]);
      if (removeError) {
        setError(removeError.message || "Unable to delete attachment from storage.");
        return;
      }
    }
    const nextConfig: Record<string, unknown> = { ...currentConfig };
    delete nextConfig.media_storage_path;
    delete nextConfig.media_mime;
    delete nextConfig.media_name;
    nextConfig.media_rotation_deg = 0;
    const { data, error: updateError } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update({ element_config: nextConfig })
      .eq("id", selectedBowtieElement.id)
      .eq("map_id", mapId)
      .select(canvasElementSelectColumns)
      .single();
    if (updateError || !data) {
      setError(updateError?.message || "Unable to clear attachment from evidence node.");
      return;
    }
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setBowtieDraft((updated.element_config as BowtieDraftState | null) ?? {});
    setImageUrlsByElementId((prev) => {
      const next = { ...prev };
      delete next[selectedBowtieElement.id];
      return next;
    });
    if (evidenceUploadPreviewUrl) URL.revokeObjectURL(evidenceUploadPreviewUrl);
    setEvidenceUploadPreviewUrl(null);
    setEvidenceUploadFile(null);
  }, [
    selectedBowtieElement,
    mapId,
    setElements,
    setError,
    evidenceUploadPreviewUrl,
  ]);
  useEffect(() => {
    if (!map) return;
    setMapTitleDraft(map.title);
    setMapInfoNameDraft(map.title);
    setMapInfoDescriptionDraft(map.description ?? "");
    setMapCodeDraft(map.map_code ?? "");
  }, [map]);

  const stackedDismissMenus = useMemo(
    () => [
      { ref: addMenuRef, onDismiss: () => setShowAddMenu(false) },
      { ref: suggestionMenuRef, onDismiss: () => setShowSuggestionsMenu(false) },
      { ref: templateMenuRef, onDismiss: () => setShowTemplateMenu(false) },
      { ref: searchMenuRef, onDismiss: () => setShowSearchMenu(false) },
      { ref: printMenuRef, onDismiss: () => setShowPrintMenu(false) },
      { ref: disciplineMenuRef, onDismiss: () => setShowDisciplineMenu(false) },
    ],
    [setShowPrintMenu, setShowSearchMenu, setShowTemplateMenu]
  );
  useStackedOutsidePointerDismiss(stackedDismissMenus);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const apply = () => setIsMobile(mq.matches || window.innerWidth <= 768);
    apply();
    const handleResize = () => apply();
    window.addEventListener("resize", handleResize);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => {
        mq.removeEventListener("change", apply);
        window.removeEventListener("resize", handleResize);
      };
    }
    mq.addListener(apply);
    return () => {
      mq.removeListener(apply);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (outlineNodeId) return;
    setOutlineCreateMode(null);
    setOutlineEditItemId(null);
    setEditHeadingTitle("");
    setEditHeadingLevel(1);
    setEditHeadingParentId("");
    setEditContentHeadingId("");
    setEditContentText("");
    setConfirmDeleteOutlineItemId(null);
    setCollapsedHeadingIds(new Set());
  }, [outlineNodeId]);

  useEffect(() => {
    if (outlineCreateMode !== "content") return;
    if (!newContentHeadingId && headingItems.length) {
      setNewContentHeadingId(headingItems[0].id);
    }
  }, [outlineCreateMode, newContentHeadingId, headingItems]);

  const relationshipPopupDismissRefs = useMemo(() => [relationshipPopupRef], []);
  const dismissRelationshipPopup = useCallback(() => setRelationshipPopup(null), []);
  useOutsidePointerDismiss({
    enabled: !!relationshipPopup,
    refs: relationshipPopupDismissRefs,
    onDismiss: dismissRelationshipPopup,
  });

  const mapInfoDismissRefs = useMemo(() => [mapInfoAsideRef, mapInfoButtonRef], []);
  const dismissMapInfoAside = useCallback(() => {
    setShowMapInfoAside(false);
    setShowOrgAccessModal(false);
    setIsEditingMapInfo(false);
    if (map) {
      setMapInfoNameDraft(map.title);
      setMapInfoDescriptionDraft(map.description ?? "");
      setMapCodeDraft(map.map_code ?? "");
    }
  }, [map]);
  useOutsidePointerDismiss({
    enabled: showMapInfoAside && !showOrgAccessModal,
    refs: mapInfoDismissRefs,
    onDismiss: dismissMapInfoAside,
  });
  useEffect(() => {
    if (!showMapInfoAside) {
      setShowOrgAccessModal(false);
      return;
    }
    if (!canManageMapMetadata) {
      setOwnerHasActiveOrganisation(false);
      return;
    }
    void loadOrgAccessStatus();
  }, [canManageMapMetadata, loadOrgAccessStatus, showMapInfoAside]);
  useEffect(() => {
    if (!showMapInfoAside) return;
    const hasAnyLeftAsideOpen =
      !!selectedNodeId ||
      !!selectedProcessId ||
      !!selectedSystemId ||
      !!selectedProcessComponentId ||
      !!selectedPersonId ||
      !!selectedAnchorId ||
      !!selectedStickyId ||
      !!selectedImageId ||
      !!selectedTextBoxId ||
      !!selectedTableId ||
      !!selectedFlowShapeId ||
      !!selectedBowtieElementId ||
      !!selectedGroupingId ||
      !!outlineNodeId ||
      !!desktopNodeAction ||
      !!showAddRelationship ||
      !!mobileNodeMenuId;
    if (hasAnyLeftAsideOpen) {
      setShowMapInfoAside(false);
      setIsEditingMapInfo(false);
      if (map) {
        setMapInfoNameDraft(map.title);
        setMapInfoDescriptionDraft(map.description ?? "");
        setMapCodeDraft(map.map_code ?? "");
      }
    }
  }, [
    showMapInfoAside,
    selectedNodeId,
    selectedProcessId,
    selectedSystemId,
    selectedProcessComponentId,
    selectedPersonId,
    selectedAnchorId,
    selectedStickyId,
    selectedImageId,
    selectedTextBoxId,
    selectedTableId,
    selectedFlowShapeId,
    selectedBowtieElementId,
    selectedGroupingId,
    outlineNodeId,
    desktopNodeAction,
    showAddRelationship,
    mobileNodeMenuId,
    map,
  ]);

  useEffect(() => {
    const onKeyDown = async (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        !!target &&
        (target.isContentEditable || tag === "input" || tag === "textarea" || tag === "select");
      if (isEditable) return;

      const isCopy = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c";
      const isPaste = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v";

      if (isCopy) {
        if (!selectedFlowIds.size) return;
        event.preventDefault();
        setCopiedFlowIds([...selectedFlowIds]);
        clipboardPasteCountRef.current = 1;
        return;
      }

      if (isPaste) {
        if (!copiedFlowIds.length) return;
        if (!canWriteMap) {
          setError("You have view access only for this map.");
          return;
        }
        event.preventDefault();
        const step = clipboardPasteCountRef.current;
        const offset = minorGridSize * 2 * step;

        const sourceNodeIds = copiedFlowIds.filter((id) => !id.startsWith("process:"));
        const sourceElementIds = copiedFlowIds
          .filter((id) => id.startsWith("process:"))
          .map((id) => parseProcessFlowId(id));

        const sourceNodes = nodes.filter((n) => sourceNodeIds.includes(n.id));
        const sourceElements = elements.filter((el) => sourceElementIds.includes(el.id));

        const nodePayload = sourceNodes.map((n) => ({
          map_id: mapId,
          type_id: n.type_id,
          title: n.title,
          document_number: n.document_number,
          discipline: n.discipline,
          owner_user_id: n.owner_user_id,
          owner_name: n.owner_name,
          user_group: n.user_group,
          pos_x: snapToMinorGrid(n.pos_x + offset),
          pos_y: snapToMinorGrid(n.pos_y + offset),
          width: n.width,
          height: n.height,
          is_archived: false,
        }));

        const elementPayload = sourceElements.map((el) => ({
          map_id: mapId,
          element_type: el.element_type,
          heading: el.heading,
          color_hex: el.color_hex,
          created_by_user_id: userId ?? el.created_by_user_id,
          element_config: (el.element_config as Record<string, unknown> | null) ?? null,
          pos_x: snapToMinorGrid(el.pos_x + offset),
          pos_y: snapToMinorGrid(el.pos_y + offset),
          width: el.width,
          height: el.height,
        }));

        let insertedNodes: DocumentNodeRow[] = [];
        let insertedElements: CanvasElementRow[] = [];

        if (nodePayload.length) {
          const { data, error: e } = await supabaseBrowser
            .schema("ms")
            .from("document_nodes")
            .insert(nodePayload)
            .select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived");
          if (e) {
            setError(e.message || "Unable to paste document nodes.");
            return;
          }
          insertedNodes = (data ?? []) as DocumentNodeRow[];
        }

        if (elementPayload.length) {
          const { data, error: e } = await supabaseBrowser
            .schema("ms")
            .from("canvas_elements")
            .insert(elementPayload)
            .select(canvasElementSelectColumns);
          if (e) {
            setError(e.message || "Unable to paste canvas elements.");
            return;
          }
          insertedElements = (data ?? []) as CanvasElementRow[];
        }

        if (insertedNodes.length) {
          insertedNodes.forEach((n) => {
            savedPos.current[n.id] = { x: n.pos_x, y: n.pos_y };
          });
          setNodes((prev) => [...prev, ...insertedNodes]);
        }
        if (insertedElements.length) {
          setElements((prev) => [...prev, ...insertedElements]);
        }
        if (insertedNodes.length || insertedElements.length) {
          const nextSelected = new Set<string>();
          insertedNodes.forEach((n) => nextSelected.add(n.id));
          insertedElements.forEach((el) => nextSelected.add(`process:${el.id}`));
          setSelectedFlowIds(nextSelected);
          clipboardPasteCountRef.current += 1;
        }
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (!selectedFlowIds.size) return;
      event.preventDefault();
      if (!canWriteMap) return;
      setShowDeleteSelectionConfirm(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedFlowIds,
    copiedFlowIds,
    canWriteMap,
    mapId,
    nodes,
    elements,
    snapToMinorGrid,
    userId,
  ]);

  const onMoveEnd = useCallback((_event: unknown, viewport: Viewport) => {
    if (!userId) return;
    if (saveViewportTimer.current) clearTimeout(saveViewportTimer.current);
    saveViewportTimer.current = setTimeout(async () => {
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("map_view_state")
        .upsert({ map_id: mapId, user_id: userId, pan_x: viewport.x, pan_y: viewport.y, zoom: viewport.zoom }, { onConflict: "map_id,user_id" });
      if (e && !isAbortLikeError(e)) setError(e.message || "Unable to save viewport state.");
    }, 500);
  }, [mapId, userId]);

  const { handleSaveMapTitle, handleCloseMapInfoAside, handleSaveMapInfo, handleUpdateMapMemberRole } =
    useCanvasMapInfoActions({
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
    });

  const handleGrantOrgUserFullWrite = useCallback(
    async (targetUserId: string) => {
      setGrantingOrgAccessUserId(targetUserId);
      setOrgAccessError(null);

      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session?.access_token) {
          throw new Error("You are no longer signed in.");
        }

        const response = await fetch(`/api/system-maps/${mapId}/org-access`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: targetUserId }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Unable to grant full write access.");
        }

        await loadMapMembers(map?.owner_id);
        await loadOrgAccessCandidates(orgAccessSearch);
      } catch (grantError) {
        setOrgAccessError(grantError instanceof Error ? grantError.message : "Unable to grant full write access.");
      } finally {
        setGrantingOrgAccessUserId(null);
      }
    },
    [loadMapMembers, loadOrgAccessCandidates, map?.owner_id, mapId, orgAccessSearch]
  );

  const handleUpdateMapMemberRoleAndRefresh = useCallback(
    async (targetUserId: string, nextRole: "read" | "partial_write" | "full_write") => {
      await handleUpdateMapMemberRole(targetUserId, nextRole);
      await loadOrgAccessCandidates(orgAccessSearch);
    },
    [handleUpdateMapMemberRole, loadOrgAccessCandidates, orgAccessSearch]
  );

  const filteredOrgAccessCandidates = useMemo(() => {
    const search = orgAccessSearch.trim().toLowerCase();
    if (!search) return orgAccessCandidates;

    return orgAccessCandidates.filter((candidate) =>
      [candidate.fullName, candidate.email, candidate.organisations.join(", ")]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search))
    );
  }, [orgAccessCandidates, orgAccessSearch]);

  useEffect(() => {
    if (!showOrgAccessModal || !canManageMapMetadata) return;
    const search = orgAccessSearch.trim();
    if (search.length < 2) {
      setOrgAccessCandidates([]);
      setOrgAccessLoading(false);
      return;
    }
    const timer = window.setTimeout(() => {
      void loadOrgAccessCandidates(search);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [canManageMapMetadata, loadOrgAccessCandidates, orgAccessSearch, showOrgAccessModal]);

  const { onNodeDragStop } = useCanvasNodeDragStop({
    canWriteMap,
    canEditElement,
    nodes,
    elements,
    mapId,
    snapToMinorGrid,
    findNearestFreePosition,
    selectedFlowIds,
    flowNodesRef,
    setError,
    setElements,
    setNodes,
    setFlowNodes,
    savedPos,
  });
  const {
    handleAddBlankDocument,
    handleAddProcessHeading,
    handleAddSystemCircle,
    handleAddProcessComponent,
    handleAddPerson,
    handleAddEquipment,
    handleAddEnvironment,
    handleAddAnchor,
    handleAddGroupingContainer,
    handleAddStickyNote,
    handleAddTextBox,
    handleAddTable,
    handleAddShapeRectangle,
    handleAddShapeCircle,
    handleAddShapePill,
    handleAddShapePentagon,
    handleAddShapeChevronLeft,
    handleAddShapeArrow,
    handleAddImageAsset,
    handleAddBowtieHazard,
    handleAddBowtieTopEvent,
    handleAddBowtieThreat,
    handleAddBowtieConsequence,
    handleAddBowtieControl,
    handleAddBowtieEscalationFactor,
    handleAddBowtieRecoveryMeasure,
    handleAddBowtieDegradationIndicator,
    handleAddBowtieRiskRating,
    handleAddIncidentSequenceStep,
    handleAddIncidentOutcome,
    handleAddIncidentTaskCondition,
    handleAddIncidentFactor,
    handleAddIncidentSystemFactor,
    handleAddIncidentControlBarrier,
    handleAddIncidentEvidence,
    handleAddIncidentResponseRecovery,
    handleAddIncidentFinding,
    handleAddIncidentRecommendation,
    handleSaveProcessHeading,
    handleSaveSystemName,
    handleSaveProcessComponent,
    handleSavePerson,
    handleSaveGroupingContainer,
    handleSaveStickyNote,
    handleSaveImageAsset,
    handleSaveTextBox,
    handleSaveTable,
    handleSaveFlowShape,
  } = useCanvasElementActions({
    mapCategoryId,
    canWriteMap,
    canCreateSticky,
    canEditElement,
    mapId,
    userId,
    rf,
    canvasRef,
    snapToMinorGrid,
    setError,
    setShowAddMenu,
    setNodes,
    setElements,
    savedPos,
    addDocumentTypes,
    isLandscapeTypeName,
    unconfiguredDocumentTitle,
    landscapeDefaultWidth,
    defaultWidth,
    landscapeDefaultHeight,
    defaultHeight,
    canvasElementSelectColumns,
    processHeadingWidth,
    processHeadingHeight,
    systemCircleDiameter,
    systemCircleElementHeight,
    processComponentWidth,
    processComponentElementHeight,
    buildPersonHeading,
    personElementWidth,
    personElementHeight,
    orgChartPersonWidth,
    orgChartPersonHeight,
    anchorNodeWidth,
    anchorNodeHeight,
    groupingDefaultWidth,
    groupingDefaultHeight,
    stickyDefaultSize,
    imageDefaultWidth,
    imageMinWidth,
    imageMinHeight,
    textBoxDefaultWidth,
    textBoxDefaultHeight,
    tableDefaultWidth,
    tableDefaultHeight,
    tableMinWidth,
    tableMinHeight,
    tableMinRows,
    tableMinColumns,
    shapeRectangleDefaultWidth,
    shapeRectangleDefaultHeight,
    shapeCircleDefaultSize,
    shapePillDefaultWidth,
    shapePillDefaultHeight,
    shapePentagonDefaultWidth,
    shapePentagonDefaultHeight,
    shapeArrowDefaultWidth,
    shapeArrowDefaultHeight,
    shapeArrowMinWidth,
    shapeArrowMinHeight,
    shapeMinWidth,
    shapeMinHeight,
    shapeDefaultFillColor,
    bowtieDefaultWidth,
    bowtieHazardHeight,
    bowtieSquareHeight,
    bowtieControlHeight,
    bowtieRiskRatingHeight,
    incidentCardWidth,
    incidentCardHeight,
    incidentDefaultWidth,
    incidentThreeTwoHeight,
    incidentSquareSize,
    incidentFourThreeHeight,
    incidentThreeOneHeight,
    selectedProcessId,
    processHeadingDraft,
    processFontSizeDraft,
    processWidthDraft,
    processHeightDraft,
    processFillModeDraft,
    processOutlineColorDraft,
    processOutlineWidthDraft,
    processMinWidthSquares,
    processMinHeightSquares,
    processMinWidth,
    processMinHeight,
    minorGridSize,
    processColorDraft,
    setSelectedProcessId,
    selectedSystemId,
    systemNameDraft,
    setSelectedSystemId,
    selectedProcessComponentId,
    processComponentLabelDraft,
    setSelectedProcessComponentId,
    selectedPersonId,
    personTypeDraft,
    personRoleDraft,
    personRoleIdDraft,
    personDepartmentDraft,
    personOccupantNameDraft,
    personStartDateDraft,
    personEmploymentTypeDraft,
    personActingNameDraft,
    personActingStartDateDraft,
    personRecruitingDraft,
    personProposedRoleDraft,
    equipmentTypeDraft,
    equipmentIdentifierDraft,
    environmentDetailDraft,
    environmentFactorTypeDraft,
    setSelectedPersonId,
    selectedGroupingId,
    groupingLabelDraft,
    groupingHeaderColorDraft,
    groupingHeaderFontSizeDraft,
    groupingOutlineWidthDraft,
    groupingWidthDraft,
    groupingHeightDraft,
    groupingMinWidthSquares,
    groupingMinHeightSquares,
    groupingMinWidth,
    groupingMinHeight,
    setSelectedGroupingId,
    selectedStickyId,
    stickyTextDraft,
    stickyBackgroundColorDraft,
    stickyOutlineColorDraft,
    stickyFillModeDraft,
    stickyOutlineWidthDraft,
    selectedImageId,
    imageDescriptionDraft,
    selectedTextBoxId,
    textBoxContentDraft,
    textBoxBoldDraft,
    textBoxItalicDraft,
    textBoxUnderlineDraft,
    textBoxAlignDraft,
    textBoxFontSizeDraft,
    textBoxBackgroundColorDraft,
    textBoxOutlineDraft,
    textBoxOutlineColorDraft,
    textBoxOutlineWidthDraft,
    selectedTableId,
    tableRowsDraft,
    tableColumnsDraft,
    tableHeaderBgDraft,
    tableGridLineColorDraft,
    tableGridLineWeightDraft,
    tableBoldDraft,
    tableItalicDraft,
    tableUnderlineDraft,
    tableAlignDraft,
    tableFontSizeDraft,
    selectedFlowShapeId,
    flowShapeTextDraft,
    flowShapeAlignDraft,
    flowShapeBoldDraft,
    flowShapeItalicDraft,
    flowShapeUnderlineDraft,
    flowShapeFontSizeDraft,
    flowShapeColorDraft,
    flowShapeFillModeDraft,
    flowShapeOutlineColorDraft,
    flowShapeOutlineWidthDraft,
    flowShapeDirectionDraft,
    flowShapeRotationDraft,
    elements,
    nodes,
    setSelectedStickyId,
    setSelectedImageId,
    setSelectedTextBoxId,
    setSelectedTableId,
    setSelectedFlowShapeId,
  });
  const {
    showImageUploadModal,
    imageUploadFile,
    imageUploadPreviewUrl,
    imageUploadDescription,
    setImageUploadDescription,
    imageUploadSaving,
    handleStartAddImageAsset,
    handleSelectImageUploadFile,
    handleCancelImageUpload,
    handleConfirmImageUpload,
  } = useCanvasImageUpload({
    canWriteMap,
    mapId,
    userId,
    setError,
    setShowAddMenu,
    handleAddImageAsset,
  });
  const insertCanvasElements = useCallback(
    async (payloads: CanvasElementInsertPayload[]) => {
      if (!payloads.length) return [];
      const { data, error: insertError } = await supabaseBrowser
        .schema("ms")
        .from("canvas_elements")
        .insert(payloads)
        .select(canvasElementSelectColumns);
      if (insertError) throw insertError;
      const insertedRows = (data as CanvasElementRow[] | null) ?? [];
      if (insertedRows.length) {
        setElements((current) => [...current, ...insertedRows]);
      }
      return insertedRows;
    },
    [setElements]
  );
  const updateCanvasElements = useCallback(
    async (updates: CanvasElementUpdatePayload[]) => {
      if (!updates.length) return;
      await Promise.all(
        updates.map(async ({ id, fields }) => {
          const { error: updateError } = await supabaseBrowser
            .schema("ms")
            .from("canvas_elements")
            .update(fields)
            .eq("id", id);
          if (updateError) throw updateError;
        })
      );
      setElements((current) =>
        current.map((element) => {
          const match = updates.find((update) => update.id === element.id);
          return match ? { ...element, ...match.fields } : element;
        })
      );
    },
    [setElements]
  );
  const buildWizardGroupLayout = useCallback(
    (itemCount: number, itemWidth: number, itemHeight: number) => {
      const columns = itemCount <= 1 ? 1 : itemCount <= 4 ? 2 : 3;
      const rows = Math.max(1, Math.ceil(itemCount / columns));
      const edgePadding = minorGridSize * 2;
      const gap = minorGridSize;
      return {
        columns,
        rows,
        gap,
        itemWidth,
        itemHeight,
        horizontalPadding: edgePadding,
        topPadding: edgePadding,
        bottomPadding: edgePadding,
        width: Math.max(
          groupingMinWidth,
          edgePadding * 2 + columns * itemWidth + Math.max(0, columns - 1) * gap
        ),
        height: Math.max(
          groupingMinHeight,
          edgePadding + rows * itemHeight + Math.max(0, rows - 1) * gap + edgePadding
        ),
      };
    },
    []
  );
  const findWizardGroupElements = useCallback(
    (groupElement: CanvasElementRow, step: SystemMapWizardCommitPayload["step"]) => {
      const allowedTypes = new Set(stepElementTypesByWizardStep[step]);
      const rightEdge = groupElement.pos_x + (groupElement.width || groupingDefaultWidth);
      const bottomEdge = groupElement.pos_y + (groupElement.height || groupingDefaultHeight);
      return elements
        .filter((element) => {
          if (!allowedTypes.has(element.element_type)) return false;
          const elementRight = element.pos_x + (element.width || 0);
          const elementBottom = element.pos_y + (element.height || 0);
          return (
            element.pos_x >= groupElement.pos_x &&
            element.pos_y >= groupElement.pos_y &&
            elementRight <= rightEdge &&
            elementBottom <= bottomEdge
          );
        })
        .sort((a, b) => (a.pos_y === b.pos_y ? a.pos_x - b.pos_x : a.pos_y - b.pos_y));
    },
    [elements]
  );
  const findExistingWizardGroup = useCallback(
    (heading: string) =>
      elements
        .filter(
          (element) =>
            element.element_type === "grouping_container" &&
            (element.heading || "").trim().toLowerCase() === heading.trim().toLowerCase()
        )
        .sort((a, b) => (a.pos_x === b.pos_x ? a.pos_y - b.pos_y : a.pos_x - b.pos_x))[0] ?? null,
    [elements]
  );
  const getNextWizardGroupPosition = useCallback(
    (groupWidth: number, groupHeight: number) => {
      const groupingElements = elements.filter((element) => element.element_type === "grouping_container");
      if (groupingElements.length) {
        const rightmostGroup = groupingElements.reduce((best, current) => {
          const bestEdge = best.pos_x + (best.width || groupingDefaultWidth);
          const currentEdge = current.pos_x + (current.width || groupingDefaultWidth);
          return currentEdge > bestEdge ? current : best;
        });
        return {
          x: snapToMinorGrid(rightmostGroup.pos_x + (rightmostGroup.width || groupingDefaultWidth) + majorGridSize),
          y: snapToMinorGrid(rightmostGroup.pos_y),
        };
      }
      const center = getCanvasFlowCenter();
      if (!center) {
        return {
          x: snapToMinorGrid(majorGridSize),
          y: snapToMinorGrid(majorGridSize),
        };
      }
      return {
        x: snapToMinorGrid(center.x - groupWidth / 2),
        y: snapToMinorGrid(center.y - groupHeight / 2),
      };
    },
    [elements, getCanvasFlowCenter, snapToMinorGrid]
  );
  const handleWizardCommitStep = useCallback(
    async (payload: SystemMapWizardCommitPayload) => {
      if (!canUseWizard || !userId) return;
      const createGroupAndInsert = async (
        step: SystemMapWizardCommitPayload["step"],
        heading: string,
        itemWidth: number,
        itemHeight: number,
        nodeBuilder: (origin: { x: number; y: number }, index: number) => CanvasElementInsertPayload | null,
        meaningfulCount: number
      ) => {
        if (!meaningfulCount) return;
        const existingGroup = findExistingWizardGroup(heading);
        const existingNodes = existingGroup ? findWizardGroupElements(existingGroup, step) : [];
        const totalCount = existingNodes.length + meaningfulCount;
        const layout = buildWizardGroupLayout(totalCount, itemWidth, itemHeight);
        const groupPosition = existingGroup
          ? {
              x: snapToMinorGrid(existingGroup.pos_x),
              y: snapToMinorGrid(existingGroup.pos_y),
            }
          : getNextWizardGroupPosition(layout.width, layout.height);
        const relayoutUpdates: CanvasElementUpdatePayload[] = [];
        existingNodes.forEach((node, index) => {
          const column = index % layout.columns;
          const row = Math.floor(index / layout.columns);
          const origin = {
            x: snapToMinorGrid(groupPosition.x + layout.horizontalPadding + column * (layout.itemWidth + layout.gap)),
            y: snapToMinorGrid(groupPosition.y + layout.topPadding + row * (layout.itemHeight + layout.gap)),
          };
          relayoutUpdates.push({
            id: node.id,
            fields: {
              pos_x: origin.x,
              pos_y: origin.y,
              width: layout.itemWidth,
              height: layout.itemHeight,
            },
          });
        });
        const nodePayloads: CanvasElementInsertPayload[] = [];
        for (let index = 0; index < meaningfulCount; index += 1) {
          const absoluteIndex = existingNodes.length + index;
          const column = absoluteIndex % layout.columns;
          const row = Math.floor(absoluteIndex / layout.columns);
          const origin = {
            x: snapToMinorGrid(groupPosition.x + layout.horizontalPadding + column * (layout.itemWidth + layout.gap)),
            y: snapToMinorGrid(groupPosition.y + layout.topPadding + row * (layout.itemHeight + layout.gap)),
          };
          const nodePayload = nodeBuilder(origin, index);
          if (nodePayload) nodePayloads.push(nodePayload);
        }
        if (existingGroup) {
          await updateCanvasElements([
            {
              id: existingGroup.id,
              fields: {
                pos_x: groupPosition.x,
                pos_y: groupPosition.y,
                width: layout.width,
                height: layout.height,
              },
            },
            ...relayoutUpdates,
          ]);
          await insertCanvasElements(nodePayloads);
          return;
        }
        const groupPayload: CanvasElementInsertPayload = {
          map_id: mapId,
          element_type: "grouping_container",
          heading,
          color_hex: null,
          created_by_user_id: userId,
          pos_x: groupPosition.x,
          pos_y: groupPosition.y,
          width: layout.width,
          height: layout.height,
        };
        await insertCanvasElements([groupPayload, ...nodePayloads]);
      };

      const isFilled = (value: string) => value.trim().length > 0;

      if (payload.step === "sequence") {
        const items = payload.items.filter((item) => isFilled(item.description) || isFilled(item.timestamp) || isFilled(item.location));
        await createGroupAndInsert("sequence", stepGroupHeadingByWizardStep.sequence, incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_sequence_step",
            heading: "Sequence Step",
            color_hex: "#bfdbfe",
            created_by_user_id: userId,
            element_config: {
              description: item.description.trim(),
              timestamp: item.timestamp.trim(),
              location: item.location.trim(),
            },
            pos_x: origin.x,
            pos_y: origin.y,
            width: incidentCardWidth,
            height: incidentCardHeight,
          };
        }, items.length);
        return;
      }

      if (payload.step === "outcome") {
        const items = payload.items.filter(
          (item) =>
            isFilled(item.description) ||
            (item.outcomeCategory === "reporting"
              ? isFilled(item.reportingOutcome)
              : item.outcomeCategory !== "actual" || item.likelihood !== "possible" || item.consequence !== "moderate")
        );
        await createGroupAndInsert("outcome", stepGroupHeadingByWizardStep.outcome, incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          const elementConfig =
            item.outcomeCategory === "reporting"
              ? {
                  description: item.description.trim(),
                  consequence_category: item.outcomeCategory,
                  reporting_consequence: item.reportingOutcome,
                }
              : {
                  description: item.description.trim(),
                  consequence_category: item.outcomeCategory,
                  likelihood: item.likelihood,
                  consequence: item.consequence,
                  risk_level: (() => {
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
                    const score = (likelihoodScoreByKey[item.likelihood] ?? 3) * (consequenceScoreByKey[item.consequence] ?? 3);
                    if (score <= 4) return "low";
                    if (score <= 9) return "medium";
                    if (score <= 16) return "high";
                    return "extreme";
                  })(),
                };
          return {
            map_id: mapId,
            element_type: "incident_outcome",
            heading: "Outcome",
            color_hex: "#fca5a5",
            created_by_user_id: userId,
            element_config: elementConfig,
            pos_x: origin.x,
            pos_y: origin.y,
            width: incidentCardWidth,
            height: incidentCardHeight,
          };
        }, items.length);
        return;
      }

      if (payload.step === "people") {
        const items = payload.items.filter((item) => isFilled(item.roleName) || isFilled(item.occupantName));
        await createGroupAndInsert("people", stepGroupHeadingByWizardStep.people, personElementWidth, personElementHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "person",
            heading: buildPersonHeading(item.roleName.trim() || "Role Name", item.occupantName.trim() || "Occupant Name"),
            color_hex: null,
            created_by_user_id: userId,
            element_config: {
              position_title: item.roleName.trim(),
              role_id: "",
              department: "",
              occupant_name: item.occupantName.trim(),
              start_date: "",
              employment_type: "fte",
              acting_name: "",
              acting_start_date: "",
              recruiting: false,
              contractor_role: false,
              proposed_role: false,
            },
            pos_x: origin.x,
            pos_y: origin.y,
            width: personElementWidth,
            height: personElementHeight,
          };
        }, items.length);
        return;
      }

      if (payload.step === "task-condition") {
        const items = payload.items.filter((item) => isFilled(item.description) || isFilled(item.environmentalContext));
        await createGroupAndInsert("task-condition", stepGroupHeadingByWizardStep["task-condition"], incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_task_condition",
            heading: "Task / Condition",
            color_hex: "#fb923c",
            created_by_user_id: userId,
            element_config: {
              description: item.description.trim(),
              state: item.state,
              environmental_context: item.environmentalContext.trim(),
            },
            pos_x: origin.x,
            pos_y: origin.y,
            width: incidentCardWidth,
            height: incidentCardHeight,
          };
        }, items.length);
        return;
      }

      if (payload.step === "factors") {
        const items = payload.items.filter((item) => isFilled(item.description) || isFilled(item.category));
        await createGroupAndInsert("factors", stepGroupHeadingByWizardStep.factors, incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          if (item.kind === "incident_system_factor") {
            return {
              map_id: mapId,
              element_type: "incident_system_factor",
              heading: "System Factor",
              color_hex: "#a78bfa",
              created_by_user_id: userId,
              element_config: {
                description: item.description.trim(),
                category: item.category.trim(),
                cause_level: item.classification,
              },
              pos_x: origin.x,
              pos_y: origin.y,
              width: incidentCardWidth,
              height: incidentCardHeight,
            };
          }
          return {
            map_id: mapId,
            element_type: "incident_factor",
            heading: "Factor",
            color_hex: "#fde047",
            created_by_user_id: userId,
            element_config: {
              factor_presence: item.presence,
              factor_classification: item.classification,
              influence_type: item.category.trim(),
              description: item.description.trim(),
            },
            pos_x: origin.x,
            pos_y: origin.y,
            width: incidentCardWidth,
            height: incidentCardHeight,
          };
        }, items.length);
        return;
      }

      if (payload.step === "control-barrier") {
        const items = payload.items.filter((item) => isFilled(item.description) || isFilled(item.controlType) || isFilled(item.ownerText));
        await createGroupAndInsert("control-barrier", stepGroupHeadingByWizardStep["control-barrier"], incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_control_barrier",
            heading: "Control / Barrier",
            color_hex: "#4ade80",
            created_by_user_id: userId,
            element_config: {
              barrier_state: item.barrierState,
              barrier_role: item.barrierRole,
              description: item.description.trim(),
              control_type: item.controlType.trim(),
              owner_text: item.ownerText.trim(),
              verification_method: "",
              verification_frequency: "",
            },
            pos_x: origin.x,
            pos_y: origin.y,
            width: incidentCardWidth,
            height: incidentCardHeight,
          };
        }, items.length);
        return;
      }

      if (payload.step === "evidence") {
        const items = payload.items.filter((item) => isFilled(item.description) || isFilled(item.evidenceType) || isFilled(item.source));
        await createGroupAndInsert("evidence", stepGroupHeadingByWizardStep.evidence, incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_evidence",
            heading: "Evidence",
            color_hex: "#cbd5e1",
            created_by_user_id: userId,
            element_config: {
              evidence_type: item.evidenceType.trim(),
              description: item.description.trim(),
              source: item.source.trim(),
              show_canvas_preview: false,
              media_storage_path: "",
              media_mime: "",
              media_name: "",
              media_rotation_deg: 0,
            },
            pos_x: origin.x,
            pos_y: origin.y,
            width: incidentCardWidth,
            height: incidentCardHeight,
          };
        }, items.length);
        return;
      }

      if (payload.step === "response-recovery") {
        const items = payload.items.filter((item) => isFilled(item.description) || isFilled(item.category));
        await createGroupAndInsert("response-recovery", stepGroupHeadingByWizardStep["response-recovery"], incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_response_recovery",
            heading: "Response / Recovery",
            color_hex: "#67e8f9",
            created_by_user_id: userId,
            element_config: {
              category: item.category,
              description: item.description.trim(),
            },
            pos_x: origin.x,
            pos_y: origin.y,
            width: incidentCardWidth,
            height: incidentCardHeight,
          };
        }, items.length);
        return;
      }

      if (payload.step === "finding") {
        const items = payload.items.filter((item) => isFilled(item.description));
        await createGroupAndInsert("finding", stepGroupHeadingByWizardStep.finding, bowtieDefaultWidth, bowtieControlHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_finding",
            heading: "Finding",
            color_hex: "#1d4ed8",
            created_by_user_id: userId,
            element_config: {
              description: item.description.trim(),
              confidence_level: item.confidenceLevel,
            },
            pos_x: origin.x,
            pos_y: origin.y,
            width: incidentCardWidth,
            height: minorGridSize * 6,
          };
        }, items.length);
        return;
      }

      const items = payload.items.filter((item) => isFilled(item.description) || isFilled(item.ownerText) || isFilled(item.dueDate));
      await createGroupAndInsert("recommendation", stepGroupHeadingByWizardStep.recommendation, incidentCardWidth, incidentCardHeight, (origin, index) => {
        const item = items[index];
        return {
          map_id: mapId,
          element_type: "incident_recommendation",
          heading: "Recommendation",
          color_hex: "#14b8a6",
          created_by_user_id: userId,
          element_config: {
            action_type: item.actionType,
            owner_text: item.ownerText.trim(),
            due_date: item.dueDate.trim(),
            description: item.description.trim(),
          },
          pos_x: origin.x,
          pos_y: origin.y,
          width: incidentCardWidth,
          height: incidentCardHeight,
        };
      }, items.length);
    },
    [
      buildWizardGroupLayout,
      canUseWizard,
      findExistingWizardGroup,
      findWizardGroupElements,
      getNextWizardGroupPosition,
      insertCanvasElements,
      mapId,
      snapToMinorGrid,
      updateCanvasElements,
      userId,
    ]
  );
  const {
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
  } = useCanvasRelationshipDerived({
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
  });
  useEffect(() => {
    if (mapCategoryId !== "org_chart") return;
    const personElements = elements.filter((el) => el.element_type === "person");
    if (!personElements.length) return;
    const changed = personElements
      .map((person) => {
        const cfg = parseOrgChartPersonConfig(person.element_config);
        const nextCount = orgDirectReportCountByPersonId.get(person.id) ?? 0;
        const currentKnownCount = Number.isFinite(Number(cfg.direct_report_count))
          ? Math.max(0, Math.floor(Number(cfg.direct_report_count)))
          : 0;
        // Never downgrade an existing non-zero persisted count to zero from client-side inference.
        // This avoids hiding the label when relation IDs are stored in older endpoint fields.
        if (nextCount === 0 && currentKnownCount > 0) return null;
        if (cfg.direct_report_count === nextCount) return null;
        return {
          id: person.id,
          nextConfig: {
            ...cfg,
            direct_report_count: nextCount,
          },
          nextCount,
        };
      })
      .filter((entry): entry is { id: string; nextConfig: ReturnType<typeof parseOrgChartPersonConfig>; nextCount: number } => Boolean(entry));
    if (!changed.length) return;
    const changedConfigById = new Map(changed.map((entry) => [entry.id, entry.nextConfig] as const));
    setElements((prev) =>
      prev.map((el) =>
        changedConfigById.has(el.id)
          ? {
              ...el,
              element_config: changedConfigById.get(el.id) ?? el.element_config,
            }
          : el
      )
    );
    if (!canWriteMap) return;
    void Promise.all(
      changed.map((entry) =>
        supabaseBrowser
          .schema("ms")
          .from("canvas_elements")
          .update({ element_config: entry.nextConfig })
          .eq("id", entry.id)
          .eq("map_id", mapId)
      )
    ).catch((e) => {
      setError(e?.message || "Unable to persist direct report counts.");
    });
  }, [canWriteMap, elements, mapCategoryId, mapId, orgDirectReportCountByPersonId, setElements, setError]);
  const orgDirectReportCandidates = useMemo(() => {
    if (mapCategoryId !== "org_chart" || !relationshipSourceSystemId) return [];
    const sourceId = parseProcessFlowId(relationshipSourceSystemId);
    const term = relationshipSystemQuery.trim().toLowerCase();
    return elements
      .filter((el) => el.element_type === "person")
      .filter((el) => el.id !== sourceId)
      .map((el) => {
        const cfg = parseOrgChartPersonConfig(el.element_config);
        const actingName = cfg.acting_name.trim();
        const occupantName = cfg.occupant_name.trim();
        const nameLine = actingName ? `${actingName} (A)` : occupantName || "VACANT";
        const detailLine = `${cfg.position_title || "Position Title"}${cfg.role_id ? ` (${cfg.role_id})` : ""}`;
        const haystack = [cfg.position_title, cfg.role_id, occupantName, actingName, el.heading, nameLine, detailLine]
          .join(" ")
          .toLowerCase();
        return {
          id: el.id,
          nameLine,
          detailLine,
          disabled: alreadyRelatedSystemTargetIds.has(el.id),
          haystack,
        };
      })
      .filter((candidate) => !term || candidate.haystack.includes(term))
      .map((candidate) => ({
        id: candidate.id,
        nameLine: candidate.nameLine,
        detailLine: candidate.detailLine,
        disabled: candidate.disabled,
      }))
      .sort((a, b) => a.nameLine.localeCompare(b.nameLine));
  }, [alreadyRelatedSystemTargetIds, elements, mapCategoryId, relationshipSourceSystemId, relationshipSystemQuery]);
  const orgDirectReportSourceLabel = useMemo(() => {
    if (!relationshipSourceSystemId || mapCategoryId !== "org_chart") return "";
    const source = elements.find((el) => el.id === parseProcessFlowId(relationshipSourceSystemId) && el.element_type === "person");
    if (!source) return "";
    const cfg = parseOrgChartPersonConfig(source.element_config);
    const actingName = cfg.acting_name.trim();
    const occupantName = cfg.occupant_name.trim();
    return actingName ? `${actingName} (A)` : occupantName || "VACANT";
  }, [elements, mapCategoryId, relationshipSourceSystemId]);
  const relatedBowtieRows = useMemo(() => {
    if (!selectedBowtieElementId) return [];
    return relations.filter(
      (r) => r.target_system_element_id === selectedBowtieElementId || r.source_system_element_id === selectedBowtieElementId
    );
  }, [relations, selectedBowtieElementId]);
  const relatedImageRows = useMemo(() => {
    if (!selectedImageId) return [];
    return relations.filter((r) => r.target_system_element_id === selectedImageId || r.source_system_element_id === selectedImageId);
  }, [relations, selectedImageId]);
  const startEditRelation = useCallback((r: NodeRelationRow) => {
    setEditingRelationId(r.id);
    setEditingRelationDescription(r.relationship_description ?? "");
    setEditingRelationCategory(normalizeRelationshipCategoryForMap(r.relationship_category, mapCategoryId, r.relationship_custom_type));
    setEditingRelationCustomType(r.relationship_custom_type ?? "");
    setEditingRelationDisciplines(
      (r.relationship_disciplines ?? []).filter(
        (key): key is DisciplineKey => disciplineKeySet.has(key as DisciplineKey)
      )
    );
    setShowEditingRelationDisciplineMenu(false);
  }, [mapCategoryId]);
  const cancelEditRelation = useCallback(() => {
    setEditingRelationId(null);
    setEditingRelationDescription("");
    setEditingRelationCategory(getDefaultRelationshipCategoryForMap(mapCategoryId));
    setEditingRelationCustomType("");
    setEditingRelationDisciplines([]);
    setShowEditingRelationDisciplineMenu(false);
  }, [mapCategoryId]);
  const calculateRiskLevel = useCallback((likelihoodRaw: string, consequenceRaw: string) => {
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
  }, []);
  const handleSaveBowtieElement = useCallback(async (closeAfterSave = true) => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    if (!selectedBowtieElement) return;
    const elementType = selectedBowtieElement.element_type;
    const nextConfig: Record<string, unknown> = { ...bowtieDraft };
    if (elementType === "incident_factor") {
      nextConfig.people_involved = Array.isArray(bowtieDraft.people_involved)
        ? Array.from(
            new Set(
              bowtieDraft.people_involved.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            )
          )
        : [];
    }
    if (elementType === "incident_outcome") {
      const category = String(nextConfig.consequence_category ?? "actual").trim().toLowerCase();
      nextConfig.consequence_category = category || "actual";
      if (category === "reporting") {
        nextConfig.reporting_consequence = String(nextConfig.reporting_consequence ?? "").trim().toLowerCase();
        delete nextConfig.likelihood;
        delete nextConfig.consequence;
        delete nextConfig.risk_level;
      } else {
        const likelihood = String(nextConfig.likelihood ?? "possible").trim().toLowerCase();
        const consequence = String(nextConfig.consequence ?? "moderate").trim().toLowerCase();
        nextConfig.likelihood = likelihood;
        nextConfig.consequence = consequence;
        nextConfig.risk_level = calculateRiskLevel(likelihood, consequence);
        delete nextConfig.reporting_consequence;
      }
    }
    const defaultLabel = methodologyDefaultLabelByType[elementType] || "Node";
    let nextHeading = defaultLabel;
    if (elementType === "bowtie_risk_rating") {
      const likelihood = String(nextConfig.likelihood || "possible");
      const consequence = String(nextConfig.consequence || "moderate");
      const riskLevel = calculateRiskLevel(likelihood, consequence);
      nextConfig.risk_level = riskLevel;
      nextHeading = `${riskLevel.charAt(0).toUpperCase()}${riskLevel.slice(1)}`;
    } else {
      const nextLabel = String(nextConfig.label ?? "").trim();
      const nextDescription = String(nextConfig.description ?? "").trim();
      nextConfig.description = nextDescription;
      nextConfig.body_display_mode = getMethodologyBodyDisplayMode(
        nextLabel,
        nextDescription,
        nextConfig.body_display_mode
      );
      delete nextConfig.label;
      nextHeading = nextLabel;
    }
    if (elementType === "incident_evidence" && evidenceUploadFile) {
      const ext = evidenceUploadFile.name.includes(".") ? evidenceUploadFile.name.split(".").pop() : "bin";
      const safeBaseName =
        evidenceUploadFile.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase() || "evidence";
      const storagePath = `${mapId}/${Date.now()}-${crypto.randomUUID()}-${safeBaseName}.${ext}`;
      const { error: uploadError } = await supabaseBrowser.storage.from("systemmap").upload(storagePath, evidenceUploadFile, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        setError(uploadError.message || "Unable to upload evidence file.");
        return;
      }
      const previousPath = typeof nextConfig.media_storage_path === "string" ? nextConfig.media_storage_path : "";
      if (previousPath && previousPath !== storagePath) {
        await supabaseBrowser.storage.from("systemmap").remove([previousPath]);
      }
      nextConfig.media_storage_path = storagePath;
      nextConfig.media_mime = evidenceUploadFile.type || "";
      nextConfig.media_name = evidenceUploadFile.name;
    }
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update({ heading: nextHeading, element_config: nextConfig })
      .eq("id", selectedBowtieElement.id)
      .eq("map_id", mapId)
      .select(canvasElementSelectColumns)
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to save bow tie node.");
      return;
    }
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    if (evidenceUploadFile) {
      if (evidenceUploadPreviewUrl) URL.revokeObjectURL(evidenceUploadPreviewUrl);
      setEvidenceUploadPreviewUrl(null);
      setEvidenceUploadFile(null);
    }
    if (closeAfterSave) setSelectedBowtieElementId(null);
  }, [
    canWriteMap,
    selectedBowtieElement,
    bowtieDraft,
    calculateRiskLevel,
    mapId,
    setError,
    setElements,
    evidenceUploadFile,
    evidenceUploadPreviewUrl,
  ]);
  const handleAddAnchorLink = useCallback(async (targetAnchorId: string) => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    if (!selectedAnchor) return;
    const targetAnchor = anchorById.get(targetAnchorId);
    if (!targetAnchor || targetAnchor.id === selectedAnchor.id) return;
    const alreadyLinked = anchorLinks.some(
      (link) => link.anchor_id === selectedAnchor.id && link.linked_anchor_id === targetAnchor.id
    );
    if (alreadyLinked) return;
    const selectedMaxSort = anchorLinks
      .filter((link) => link.anchor_id === selectedAnchor.id)
      .reduce((max, link) => Math.max(max, Number(link.sort_order) || 0), -1);
    const targetMaxSort = anchorLinks
      .filter((link) => link.anchor_id === targetAnchor.id)
      .reduce((max, link) => Math.max(max, Number(link.sort_order) || 0), -1);
    const rows = [
      {
        map_id: mapId,
        anchor_id: selectedAnchor.id,
        linked_anchor_id: targetAnchor.id,
        sort_order: selectedMaxSort + 1,
        created_by_user_id: userId,
      },
      {
        map_id: mapId,
        anchor_id: targetAnchor.id,
        linked_anchor_id: selectedAnchor.id,
        sort_order: targetMaxSort + 1,
        created_by_user_id: userId,
      },
    ];
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_anchor_links")
      .upsert(rows, { onConflict: "map_id,anchor_id,linked_anchor_id" })
      .select("*");
    if (e || !data) {
      setError(e?.message || "Unable to link anchors.");
      return;
    }
    const insertedRows = data as AnchorLinkRow[];
    setAnchorLinks((prev) => {
      const insertedKeys = new Set(insertedRows.map((link) => `${link.anchor_id}:${link.linked_anchor_id}`));
      return [
        ...prev.filter((link) => !insertedKeys.has(`${link.anchor_id}:${link.linked_anchor_id}`)),
        ...insertedRows,
      ];
    });
    setAnchorLinkedOrderDraft((prev) => (prev.includes(targetAnchor.id) ? prev : [...prev, targetAnchor.id]));
    setAnchorSearchDraft("");
  }, [anchorById, anchorLinks, canWriteMap, mapId, selectedAnchor, setError, userId]);

  const handleRemoveAnchorLink = useCallback(async (targetAnchorId: string) => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    if (!selectedAnchor) return;
    const [forwardDelete, reverseDelete] = await Promise.all([
      supabaseBrowser
        .schema("ms")
        .from("canvas_anchor_links")
        .delete()
        .eq("map_id", mapId)
        .eq("anchor_id", selectedAnchor.id)
        .eq("linked_anchor_id", targetAnchorId),
      supabaseBrowser
        .schema("ms")
        .from("canvas_anchor_links")
        .delete()
        .eq("map_id", mapId)
        .eq("anchor_id", targetAnchorId)
        .eq("linked_anchor_id", selectedAnchor.id),
    ]);
    const deleteError = forwardDelete.error || reverseDelete.error;
    if (deleteError) {
      setError(deleteError.message || "Unable to remove anchor link.");
      return;
    }
    setAnchorLinks((prev) =>
      prev.filter(
        (link) =>
          !(
            (link.anchor_id === selectedAnchor.id && link.linked_anchor_id === targetAnchorId) ||
            (link.anchor_id === targetAnchorId && link.linked_anchor_id === selectedAnchor.id)
          )
      )
    );
    setAnchorLinkedOrderDraft((prev) => prev.filter((id) => id !== targetAnchorId));
  }, [canWriteMap, mapId, selectedAnchor, setError]);

  const handleReorderAnchorLinks = useCallback((orderedIds: string[]) => {
    setAnchorLinkedOrderDraft(orderedIds);
  }, []);

  const handleSaveAnchor = useCallback(async (closeAfterSave = true) => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    if (!selectedAnchor) return;
    const heading = anchorTitleDraft.trim() || "Anchor";
    const groupColor = normalizePreviewHex(anchorColorDraft) ?? "#0F766E";
    const anchorGroupIds = selectedAnchorOrderIds.length ? selectedAnchorOrderIds : selectedAnchorGroupIds.length ? selectedAnchorGroupIds : [selectedAnchor.id];
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update({ heading, color_hex: groupColor })
      .eq("id", selectedAnchor.id)
      .eq("map_id", mapId)
      .select(canvasElementSelectColumns)
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to save anchor.");
      return;
    }
    const otherAnchorGroupIds = anchorGroupIds.filter((id) => id !== selectedAnchor.id);
    if (otherAnchorGroupIds.length) {
      const { error: colorUpdateError } = await supabaseBrowser
        .schema("ms")
        .from("canvas_elements")
        .update({ color_hex: groupColor })
        .eq("map_id", mapId)
        .in("id", otherAnchorGroupIds);
      if (colorUpdateError) {
        setError(colorUpdateError.message || "Unable to save anchor group colour.");
        return;
      }
    }
    const anchorOrderIndexById = new Map(anchorGroupIds.map((id, index) => [id, index]));
    const anchorOrderLinks = anchorLinks.filter(
      (link) => anchorOrderIndexById.has(link.anchor_id) && anchorOrderIndexById.has(link.linked_anchor_id)
    );
    const updateResults = await Promise.all(
      anchorOrderLinks.map((link) =>
        supabaseBrowser
          .schema("ms")
          .from("canvas_anchor_links")
          .update({ sort_order: anchorOrderIndexById.get(link.linked_anchor_id) ?? 0 })
          .eq("map_id", mapId)
          .eq("anchor_id", link.anchor_id)
          .eq("linked_anchor_id", link.linked_anchor_id)
      )
    );
    const updateError = updateResults.find((result) => result.error)?.error;
    if (updateError) {
      setError(updateError.message || "Unable to save anchor order.");
      return;
    }
    const updated = data as unknown as CanvasElementRow;
    const anchorGroupIdSet = new Set(anchorGroupIds);
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === updated.id) return updated;
        if (anchorGroupIdSet.has(el.id) && el.element_type === "anchor") return { ...el, color_hex: groupColor };
        return el;
      })
    );
    setAnchorColorDraft(groupColor);
    setAnchorLinks((prev) =>
      prev.map((link) => {
        if (!anchorOrderIndexById.has(link.anchor_id)) return link;
        const orderIndex = anchorOrderIndexById.get(link.linked_anchor_id);
        return orderIndex != null ? { ...link, sort_order: orderIndex } : link;
      })
    );
    if (closeAfterSave) setSelectedAnchorId(null);
  }, [anchorColorDraft, anchorLinks, anchorTitleDraft, canWriteMap, mapId, normalizePreviewHex, selectedAnchor, selectedAnchorGroupIds, selectedAnchorOrderIds, setError, setElements]);
  const closeDesktopDrilldownPanels = useCallback(() => {
    setDesktopNodeAction(null);
    closeAddRelationshipModal();
    setOutlineNodeId(null);
    setConfirmDeleteNodeId(null);
    setConfirmDeleteElementId(null);
    setConfirmDeleteOutlineItemId(null);
    setOutlineCreateMode(null);
    setOutlineEditItemId(null);
    setEditHeadingTitle("");
    setEditHeadingLevel(1);
    setEditHeadingParentId("");
    setEditContentHeadingId("");
    setEditContentText("");
  }, [closeAddRelationshipModal, setDesktopNodeAction]);
  const handleCloseDocumentPropertiesPanel = useCallback(() => {
    setSelectedNodeId(null);
    closeDesktopDrilldownPanels();
  }, [closeDesktopDrilldownPanels]);
  const { closePrimaryAside, getPrimaryAsideOpen } = usePrimaryAsideRegistry({
    isMobile,
    selectionSetters: canvasSelectionSetters,
    setDesktopNodeAction,
    handleCloseDocumentPropertiesPanel,
    isPrimaryLeftAsideOpen,
  });
  const closeCategoryAside = useCallback(
    () => closePrimaryAside("category"),
    [closePrimaryAside]
  );
  const closeSystemAside = useCallback(
    () => closePrimaryAside("system"),
    [closePrimaryAside]
  );
  const closeProcessComponentAside = useCallback(
    () => closePrimaryAside("processComponent"),
    [closePrimaryAside]
  );
  const closePersonAside = useCallback(
    () => closePrimaryAside("person"),
    [closePrimaryAside]
  );
  const closeAnchorAside = useCallback(
    () => closePrimaryAside("anchor"),
    [closePrimaryAside]
  );
  const closeBowtieElementAside = useCallback(
    () => closePrimaryAside("bowtieElement"),
    [closePrimaryAside]
  );
  const closeGroupingAside = useCallback(
    () => closePrimaryAside("grouping"),
    [closePrimaryAside]
  );
  const closeStickyAside = useCallback(
    () => closePrimaryAside("sticky"),
    [closePrimaryAside]
  );
  const closeImageAside = useCallback(
    () => closePrimaryAside("image"),
    [closePrimaryAside]
  );
  const closeTextBoxAside = useCallback(
    () => closePrimaryAside("textBox"),
    [closePrimaryAside]
  );
  const closeTableAside = useCallback(
    () => closePrimaryAside("table"),
    [closePrimaryAside]
  );
  const closeFlowShapeAside = useCallback(
    () => closePrimaryAside("flowShape"),
    [closePrimaryAside]
  );
  const closeDocumentAside = useCallback(
    () => closePrimaryAside("document"),
    [closePrimaryAside]
  );
  const closeAllLeftAsides = useCallback(() => {
    setSelectedFlowIds(new Set());
    setSelectedNodeId(null);
    setSelectedProcessId(null);
    setSelectedSystemId(null);
    setSelectedProcessComponentId(null);
    setSelectedPersonId(null);
    setSelectedAnchorId(null);
    setSelectedGroupingId(null);
    setSelectedStickyId(null);
    setSelectedImageId(null);
    setSelectedTextBoxId(null);
    setSelectedTableId(null);
    setSelectedFlowShapeId(null);
    setSelectedBowtieElementId(null);
    closeDesktopDrilldownPanels();
    setMobileNodeMenuId(null);
  }, [closeDesktopDrilldownPanels]);
  const openAddRelationshipFromSource = useCallback(
    (source: { nodeId?: string | null; systemId?: string | null; groupingId?: string | null }, openAddForm = true) => {
      openRelationshipStateFromSource(source, openAddForm);
      setDesktopNodeAction("relationship");
    },
    [openRelationshipStateFromSource, setDesktopNodeAction]
  );
  const openRelationshipListFromSource = useCallback(
    (source: { nodeId?: string | null; systemId?: string | null; groupingId?: string | null }) => {
      openAddRelationshipFromSource(source, false);
    },
    [openAddRelationshipFromSource]
  );
  const handleAddOrgDirectReport = useCallback(async () => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    if (mapCategoryId !== "org_chart") return;
    const sourceId = relationshipSourceSystemId ? parseProcessFlowId(relationshipSourceSystemId) : "";
    const targetId = relationshipTargetSystemId ? parseProcessFlowId(relationshipTargetSystemId) : "";
    if (!sourceId || !targetId || sourceId === targetId) {
      setError("Please select a valid direct report.");
      return;
    }
    const sourcePerson = elements.find((el) => el.id === sourceId && el.element_type === "person");
    const targetPerson = elements.find((el) => el.id === targetId && el.element_type === "person");
    if (!sourcePerson || !targetPerson) {
      setError("Direct report links must be person-to-person.");
      return;
    }
    const exists = relations.some(
      (r) =>
        r.source_system_element_id &&
        r.target_system_element_id &&
        ((parseProcessFlowId(r.source_system_element_id) === sourceId && parseProcessFlowId(r.target_system_element_id) === targetId) ||
          (parseProcessFlowId(r.source_system_element_id) === targetId && parseProcessFlowId(r.target_system_element_id) === sourceId))
    );
    if (exists) {
      setError("Direct report link already exists.");
      return;
    }
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("node_relations")
      .insert({
        map_id: mapId,
        from_node_id: null,
        to_node_id: null,
        source_grouping_element_id: null,
        target_grouping_element_id: null,
        source_system_element_id: sourceId,
        target_system_element_id: targetId,
        relation_type: "reports_to",
        relationship_category: "other",
        relationship_custom_type: "direct_report",
        relationship_description: relationshipDescription.trim() || null,
        relationship_disciplines: null,
      })
      .select("*")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to link direct report.");
      return;
    }
    setRelations((prev) => [...prev, data as NodeRelationRow]);
    closeAddRelationshipModal();
    setDesktopNodeAction(null);
  }, [
    canWriteMap,
    closeAddRelationshipModal,
    elements,
    mapCategoryId,
    mapId,
    relationshipDescription,
    relationshipSourceSystemId,
    relationshipTargetSystemId,
    relations,
    setError,
    setDesktopNodeAction,
    setRelations,
  ]);

  const { handleAddRelation, handleDeleteRelation, handleUpdateRelation, handleDeleteNode, handleSaveNode } =
    useCanvasRelationNodeActions({
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
    });
  const saveOpenLeftAside = useCallback(async (closeAfterSave = false) => {
    if (selectedNodeId) {
      await handleSaveNode(closeAfterSave);
      return;
    }
    if (selectedProcessId) {
      await handleSaveProcessHeading(closeAfterSave);
      return;
    }
    if (selectedSystemId) {
      await handleSaveSystemName(closeAfterSave);
      return;
    }
    if (selectedProcessComponentId) {
      await handleSaveProcessComponent(closeAfterSave);
      return;
    }
    if (selectedPersonId) {
      await handleSavePerson(closeAfterSave);
      return;
    }
    if (selectedAnchorId) {
      await handleSaveAnchor(closeAfterSave);
      return;
    }
    if (selectedGroupingId) {
      await handleSaveGroupingContainer(closeAfterSave);
      return;
    }
    if (selectedStickyId) {
      await handleSaveStickyNote(closeAfterSave);
      return;
    }
    if (selectedImageId) {
      await handleSaveImageAsset(closeAfterSave);
      return;
    }
    if (selectedTextBoxId) {
      await handleSaveTextBox(closeAfterSave);
      return;
    }
    if (selectedTableId) {
      await handleSaveTable(closeAfterSave);
      return;
    }
    if (selectedFlowShapeId) {
      await handleSaveFlowShape(closeAfterSave);
      return;
    }
    if (selectedBowtieElementId) {
      await handleSaveBowtieElement(closeAfterSave);
    }
  }, [
    handleSaveBowtieElement,
    handleSaveFlowShape,
    handleSaveGroupingContainer,
    handleSaveImageAsset,
    handleSaveNode,
    handleSaveAnchor,
    handleSavePerson,
    handleSaveProcessComponent,
    handleSaveProcessHeading,
    handleSaveStickyNote,
    handleSaveSystemName,
    handleSaveTable,
    handleSaveTextBox,
    selectedBowtieElementId,
    selectedFlowShapeId,
    selectedGroupingId,
    selectedImageId,
    selectedNodeId,
    selectedAnchorId,
    selectedPersonId,
    selectedProcessComponentId,
    selectedProcessId,
    selectedStickyId,
    selectedSystemId,
    selectedTableId,
    selectedTextBoxId,
  ]);
  const queueOpenLeftAsideAutosave = useCallback(
    (closeAfterSave = false) => {
      if (autosavePointerLockRef.current) return;
      autosavePointerLockRef.current = true;
      void saveOpenLeftAside(closeAfterSave).finally(() => {
        window.setTimeout(() => {
          autosavePointerLockRef.current = false;
        }, 0);
      });
    },
    [autosavePointerLockRef, saveOpenLeftAside]
  );
  const hasSelectedMobileAsideOpen =
    isMobile &&
    (!!selectedNodeId ||
      !!selectedProcessId ||
      !!selectedSystemId ||
      !!selectedProcessComponentId ||
      !!selectedPersonId ||
      !!selectedAnchorId ||
      !!selectedGroupingId ||
      !!selectedStickyId ||
      !!selectedImageId ||
      !!selectedTextBoxId ||
      !!selectedTableId ||
      !!selectedFlowShapeId ||
      !!selectedBowtieElementId);
  const hasOpenCanvasAside = hasSelectedMobileAsideOpen || Boolean(activePrimaryLeftAsideKey || shouldShowDesktopStructurePanel);
  useEffect(() => {
    if (!hasOpenCanvasAside) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(".canvas-left-aside")) return;
      if (target.closest(".react-flow__node")) return;
      if (target.closest(".react-flow__pane")) return;
      if (autosavePointerLockRef.current) return;
      queueOpenLeftAsideAutosave(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [
    autosavePointerLockRef,
    hasOpenCanvasAside,
    queueOpenLeftAsideAutosave,
  ]);
  const { handleDeleteProcessElement, handleDeleteSelectedComponents } = useCanvasDeleteSelectionActions({
    canWriteMap,
    canEditElement,
    mapId,
    elements,
    setError,
    setElements,
    setRelations,
    setAnchorLinks,
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
    selectedAnchorId,
    setSelectedAnchorId,
    selectedGroupingId,
    setSelectedGroupingId,
    selectedStickyId,
    setSelectedStickyId,
    selectedImageId,
    setSelectedImageId,
    selectedTextBoxId,
    setSelectedTextBoxId,
    selectedTableId,
    setSelectedTableId,
    selectedFlowShapeId,
    setSelectedFlowShapeId,
    selectedFlowIds,
    handleDeleteNode,
    setShowDeleteSelectionConfirm,
  });

  const {
    handleCreateHeading,
    handleCreateContent,
    openOutlineEditor,
    closeOutlineEditor,
    handleSaveOutlineEdit,
    handleDeleteOutlineItem,
  } = useCanvasOutlineActions({
    mapId,
    outlineNodeId,
    outlineItems,
    headingItems,
    newHeadingTitle,
    newHeadingLevel,
    newHeadingParentId,
    newContentHeadingId,
    newContentText,
    outlineEditItem,
    editHeadingTitle,
    editHeadingLevel,
    editHeadingParentId,
    editContentHeadingId,
    editContentText,
    confirmDeleteOutlineItemId,
    outlineEditItemId,
    setError,
    setOutlineCreateMode,
    setNewHeadingTitle,
    setNewHeadingLevel,
    setNewHeadingParentId,
    setNewContentHeadingId,
    setNewContentText,
    setOutlineEditItemId,
    setEditHeadingTitle,
    setEditHeadingLevel,
    setEditHeadingParentId,
    setEditContentHeadingId,
    setEditContentText,
    setCollapsedHeadingIds,
    setConfirmDeleteOutlineItemId,
    loadOutline,
  });
  useEffect(() => {
    if (isMobile) return;
    if (currentSpecificSelectedFlowId || selectedSingleFlowId) return;
    closeDesktopDrilldownPanels();
  }, [currentSpecificSelectedFlowId, selectedSingleFlowId, isMobile, closeDesktopDrilldownPanels]);

  const { handlePaneClickClearSelection, handlePaneMouseDown } = useCanvasPaneSelectionActions({
    rf,
    flowNodes,
    getFlowNodeBounds,
    canUseContextMenu,
    canWriteMap: canManipulateCanvasElements,
    setSelectionMarquee,
    setSelectedFlowIds,
    setHoveredEdgeId,
    onPaneBlankClick: closeAllLeftAsides,
  });

  const sharedRelationshipSectionProps = useMemo(
    () => ({
      editingRelationId,
      editingRelationDescription,
      setEditingRelationDescription,
      editingRelationCategory,
      setEditingRelationCategory,
      relationshipCategoryOptions,
      editingRelationCustomType,
      setEditingRelationCustomType,
      editingRelationDisciplines,
      setEditingRelationDisciplines,
      showEditingRelationDisciplineMenu,
      setShowEditingRelationDisciplineMenu,
      disciplineOptions,
      getDisciplineLabel: (key: DisciplineKey) => disciplineLabelByKey.get(key),
      onStartEdit: startEditRelation,
      onDelete: handleDeleteRelation,
      onSave: (id: string) => void handleUpdateRelation(id),
      onCancelEdit: cancelEditRelation,
      actionDisabledReason: readOnlyActionReason,
    }),
    [
      cancelEditRelation,
      editingRelationCategory,
      editingRelationCustomType,
      editingRelationDescription,
      editingRelationDisciplines,
      editingRelationId,
      handleDeleteRelation,
      handleUpdateRelation,
      relationshipCategoryOptions,
      readOnlyActionReason,
      setEditingRelationCategory,
      setEditingRelationCustomType,
      setEditingRelationDescription,
      setEditingRelationDisciplines,
      setShowEditingRelationDisciplineMenu,
      showEditingRelationDisciplineMenu,
      startEditRelation,
    ]
  );
  const relationshipModalContext = useMemo(() => {
    if (selectedNode) {
      return {
        title: "Relationships",
        addButtonLabel: "Add Relationship",
        rows: relatedRows,
        resolveLabels: resolveDocumentRelationLabels,
        openAdd: () => openAddRelationshipFromSource({ nodeId: selectedNode.id }),
      };
    }
    if (selectedSystem) {
      return {
        title: "Relationships",
        addButtonLabel: "Add Relationship",
        rows: relatedSystemRows,
        resolveLabels: resolveDocumentRelationLabels,
        openAdd: () => openAddRelationshipFromSource({ systemId: selectedSystem.id }),
      };
    }
    if (selectedProcessComponent) {
      return {
        title: "Relationships",
        addButtonLabel: "Add Relationship",
        rows: relatedProcessComponentRows,
        resolveLabels: resolveDocumentRelationLabels,
        openAdd: () => openAddRelationshipFromSource({ systemId: selectedProcessComponent.id }),
      };
    }
    if (selectedPerson) {
      return {
        title: "Relationships",
        addButtonLabel: mapCategoryId === "org_chart" ? "Link Direct Report" : "Add Relationship",
        rows: relatedPersonRows,
        resolveLabels: resolvePersonRelationLabels,
        openAdd: () => openAddRelationshipFromSource({ systemId: selectedPerson.id }),
      };
    }
    if (selectedBowtieElement) {
      return {
        title: "Relationships",
        addButtonLabel: "Add Relationship",
        rows: relatedBowtieRows,
        resolveLabels: resolvePersonRelationLabels,
        openAdd: () => openAddRelationshipFromSource({ systemId: selectedBowtieElement.id }),
      };
    }
    if (selectedGrouping) {
      return {
        title: "Relationships",
        addButtonLabel: "Add Relationship",
        rows: relatedGroupingRows,
        resolveLabels: resolveGroupingRelationLabels,
        openAdd: () => openAddRelationshipFromSource({ groupingId: selectedGrouping.id }),
      };
    }
    if (selectedImage) {
      return {
        title: "Relationships",
        addButtonLabel: "Add Relationship",
        rows: relatedImageRows,
        resolveLabels: resolvePersonRelationLabels,
        openAdd: () => openAddRelationshipFromSource({ systemId: selectedImage.id }),
      };
    }
    return null;
  }, [
    mapCategoryId,
    openAddRelationshipFromSource,
    relatedBowtieRows,
    relatedGroupingRows,
    relatedImageRows,
    relatedPersonRows,
    relatedProcessComponentRows,
    relatedRows,
    relatedSystemRows,
    resolveDocumentRelationLabels,
    resolveGroupingRelationLabels,
    resolvePersonRelationLabels,
    selectedBowtieElement,
    selectedGrouping,
    selectedImage,
    selectedNode,
    selectedPerson,
    selectedProcessComponent,
    selectedSystem,
  ]);
  const handleOpenToolbarConfigure = useCallback(() => {
    if (!desktopToolbarSelection) return;
    setDesktopNodeAction("configure");
  }, [desktopToolbarSelection, setDesktopNodeAction]);
  const handleOpenToolbarRelationships = useCallback(() => {
    if (!desktopToolbarSelection?.supportsRelationships) return;
    switch (desktopToolbarSelection.kind) {
      case "document":
        openRelationshipListFromSource({ nodeId: desktopToolbarSelection.id });
        return;
      case "system":
      case "process_component":
      case "person":
      case "bowtie":
      case "image":
        openRelationshipListFromSource({ systemId: desktopToolbarSelection.id });
        return;
      case "grouping":
        openRelationshipListFromSource({ groupingId: desktopToolbarSelection.id });
        return;
      default:
        return;
    }
  }, [desktopToolbarSelection, openRelationshipListFromSource]);
  const handleOpenToolbarDelete = useCallback(() => {
    if (!canWriteMap) return;
    if (!desktopToolbarSelection) return;
    if (desktopToolbarSelection.kind === "document") {
      setConfirmDeleteNodeId(desktopToolbarSelection.id);
      return;
    }
    setConfirmDeleteElementId(desktopToolbarSelection.id);
  }, [canWriteMap, desktopToolbarSelection]);
  const isNodeTextScrollbarDoubleClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return false;
    if (target.closest("[data-node-text-scroll-control='true']")) return true;

    const scrollRegion = target.closest("[data-node-text-scroll-region='true']") as HTMLElement | null;
    if (!scrollRegion) return false;
    if (scrollRegion.scrollHeight <= scrollRegion.clientHeight + 1) return false;

    const rect = scrollRegion.getBoundingClientRect();
    const nativeScrollbarWidth = scrollRegion.offsetWidth - scrollRegion.clientWidth;
    const scrollbarHitWidth = Math.max(14, nativeScrollbarWidth);
    const isInsideVerticalScrollbar =
      event.clientX >= rect.right - scrollbarHitWidth &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    return isInsideVerticalScrollbar;
  }, []);
  const selectCanvasNode = useCallback(
    (event: React.MouseEvent, node: Node<FlowData>) => {
      handleCanvasNodeClick({
        event,
        node,
        mapRole,
        elements,
        canEditElement,
        isMobile,
        lastMobileTapRef,
        setSelectedFlowIds,
        selectionSetters: canvasSelectionSetters,
        setMobileNodeMenuId,
      });
    },
    [canEditElement, canvasSelectionSetters, elements, isMobile, mapRole, setSelectedFlowIds]
  );
  const handleCanvasNodeSingleClick = useCallback(
    (event: React.MouseEvent, node: Node<FlowData>) => {
      armPaneClearSuppression();
      const isChangingOpenAsideSelection =
        !isMobile &&
        Boolean(activePrimaryLeftAsideKey || shouldShowDesktopStructurePanel) &&
        currentSpecificSelectedFlowId !== node.id;
      if (isChangingOpenAsideSelection) queueOpenLeftAsideAutosave(false);
      if (!isMobile && event.detail > 1) return;
      if (!isMobile && desktopNodeAction === "configure" && currentSpecificSelectedFlowId === node.id) return;
      if (!isMobile && desktopNodeAction !== "configure") closeDesktopDrilldownPanels();
      selectCanvasNode(event, node);
    },
    [
      activePrimaryLeftAsideKey,
      armPaneClearSuppression,
      closeDesktopDrilldownPanels,
      currentSpecificSelectedFlowId,
      desktopNodeAction,
      isMobile,
      queueOpenLeftAsideAutosave,
      selectCanvasNode,
      shouldShowDesktopStructurePanel,
    ]
  );
  const handleCanvasNodePointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isMobile) return;
      if (event.button !== 0) return;
      if (event.detail > 1) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(".nodrag, .nopan, button, input, textarea, select, [contenteditable='true']")) return;
      const nodeElement = target.closest(".react-flow__node") as HTMLElement | null;
      const nodeId = nodeElement?.dataset.id;
      if (!nodeId) return;
      armPaneClearSuppression();
    },
    [armPaneClearSuppression, isMobile]
  );
  const showAnchorNavigationNotice = useCallback((message: string, position?: { left: number; top: number }) => {
    if (anchorNoticeTimerRef.current) {
      clearTimeout(anchorNoticeTimerRef.current);
      anchorNoticeTimerRef.current = null;
    }
    setAnchorNavigationNotice({
      message,
      left: position?.left ?? (canvasRef.current?.clientWidth ?? 0) / 2,
      top: position?.top ?? 16,
    });
    anchorNoticeTimerRef.current = setTimeout(() => {
      setAnchorNavigationNotice(null);
      anchorNoticeTimerRef.current = null;
    }, 1800);
  }, []);
  const getAnchorNavigationNoticePosition = useCallback((anchorId: string) => {
    if (typeof document === "undefined") return undefined;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const nodeElement = document.querySelector<HTMLElement>(`.react-flow__node[data-id="${processFlowId(anchorId)}"]`);
    const nodeRect = nodeElement?.getBoundingClientRect();
    if (!canvasRect || !nodeRect) return undefined;
    return {
      left: nodeRect.left - canvasRect.left + nodeRect.width / 2,
      top: Math.max(40, nodeRect.top - canvasRect.top - 8),
    };
  }, []);
  const handleNavigateFromAnchor = useCallback(
    (anchorId: string, direction: "previous" | "next" = "next", noticePosition?: { left: number; top: number }) => {
      if (!rf) return;
      const currentAnchor = anchorById.get(anchorId);
      if (!currentAnchor) return;
      const fallbackNoticePosition = noticePosition ?? getAnchorNavigationNoticePosition(anchorId);
      const anchorIds = new Set(anchorElements.map((anchor) => anchor.id));
      const componentIds = new Set<string>();
      const stack = [anchorId];
      while (stack.length) {
        const id = stack.pop();
        if (!id || componentIds.has(id) || !anchorIds.has(id)) continue;
        componentIds.add(id);
        anchorLinks.forEach((link) => {
          if (link.anchor_id === id && anchorIds.has(link.linked_anchor_id)) stack.push(link.linked_anchor_id);
          if (link.linked_anchor_id === id && anchorIds.has(link.anchor_id)) stack.push(link.anchor_id);
        });
      }
      if (componentIds.size <= 1) {
        showAnchorNavigationNotice("No more anchor nodes to view", fallbackNoticePosition);
        return;
      }
      const sequence = anchorElements
        .filter((anchor) => componentIds.has(anchor.id))
        .sort((a, b) => {
          const sequenceA = anchorSequenceNumberById.get(a.id) ?? Number.MAX_SAFE_INTEGER;
          const sequenceB = anchorSequenceNumberById.get(b.id) ?? Number.MAX_SAFE_INTEGER;
          if (sequenceA !== sequenceB) return sequenceA - sequenceB;
          const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (createdA !== createdB) return createdA - createdB;
          return a.id.localeCompare(b.id);
        });
      const currentIndex = sequence.findIndex((anchor) => anchor.id === anchorId);
      const offset = direction === "previous" ? -1 : 1;
      const targetAnchor = sequence[(currentIndex + offset + sequence.length) % sequence.length];
      if (!targetAnchor || targetAnchor.id === anchorId) {
        showAnchorNavigationNotice("No more anchor nodes to view", fallbackNoticePosition);
        return;
      }
      if (anchorNoticeTimerRef.current) {
        clearTimeout(anchorNoticeTimerRef.current);
        anchorNoticeTimerRef.current = null;
      }
      setAnchorNavigationNotice(null);
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const viewportWidth = canvasRect?.width ?? window.innerWidth;
      const viewportHeight = canvasRect?.height ?? window.innerHeight;
      const zoom = 1;
      const width = Math.max(anchorNodeMinWidth, targetAnchor.width || anchorNodeWidth);
      const height = Math.max(anchorNodeMinHeight, Math.round((width / anchorNodeWidth) * anchorNodeHeight));
      rf.setViewport(
        {
          x: viewportWidth / 2 - (targetAnchor.pos_x + width / 2) * zoom,
          y: viewportHeight / 2 - (targetAnchor.pos_y + height / 2) * zoom,
          zoom,
        },
        { duration: 420 }
      );
    },
    [
      anchorById,
      anchorElements,
      anchorLinks,
      anchorSequenceNumberById,
      getAnchorNavigationNoticePosition,
      rf,
      showAnchorNavigationNotice,
    ]
  );
  useEffect(() => {
    anchorNavigateRef.current = handleNavigateFromAnchor;
    return () => {
      if (anchorNavigateRef.current === handleNavigateFromAnchor) anchorNavigateRef.current = null;
    };
  }, [handleNavigateFromAnchor]);
  const handleCanvasNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node<FlowData>) => {
      if (isMobile) return;
      if (isNodeTextScrollbarDoubleClick(event)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      armPaneClearSuppression();
      if (desktopNodeAction === "configure" && currentSpecificSelectedFlowId === node.id) return;
      selectCanvasNode(event, node);
      setDesktopNodeAction("configure");
    },
    [
      armPaneClearSuppression,
      currentSpecificSelectedFlowId,
      desktopNodeAction,
      isNodeTextScrollbarDoubleClick,
      isMobile,
      selectCanvasNode,
      setDesktopNodeAction,
    ]
  );
  useEffect(() => {
    if (isMobile || !selectedSingleFlowId || currentSpecificSelectedFlowId === selectedSingleFlowId) return;
    const flowNode = flowNodes.find((node) => node.id === selectedSingleFlowId);
    if (!flowNode) return;
    syncCanvasSelectionFromFlowNode(canvasSelectionSetters, flowNode, { parseProcessPrefixedIdsOnly: true });
  }, [canvasSelectionSetters, currentSpecificSelectedFlowId, flowNodes, isMobile, selectedSingleFlowId]);

  if (loading) {
    return <SystemMapLoadingView progress={loadingProgress} message={loadingMessage} />;
  }

  if (!map) {
    return <div className="flex min-h-screen items-center justify-center text-rose-700">{error || "Map not found."}</div>;
  }

  return (
    <div className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-stone-50 md:min-h-screen">
      <MapCanvasHeader
        map={map}
        isTemplateEditor={isTemplateEditor}
        mapRole={mapRole}
        accessState={accessState}
        brandHref={isGuestViewer ? null : "/"}
        showMapInfoButton={!isGuestViewer}
        canManageMapMetadata={canManageMapMetadata}
        isEditingMapTitle={isEditingMapTitle}
        mapTitleDraft={mapTitleDraft}
        setMapTitleDraft={setMapTitleDraft}
        setIsEditingMapTitle={setIsEditingMapTitle}
        handleSaveMapTitle={handleSaveMapTitle}
        savingMapTitle={savingMapTitle}
        mapTitleSavedFlash={mapTitleSavedFlash}
        mapInfoButtonRef={mapInfoButtonRef}
        closeAllLeftAsides={closeAllLeftAsides}
        setShowMapInfoAside={setShowMapInfoAside}
        setIsEditingMapInfo={setIsEditingMapInfo}
        setError={setError}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      <CanvasNodeSelectionToolbar
        open={!isMobile && !!desktopToolbarSelection}
        showRelationships={!!desktopToolbarSelection}
        relationshipsDisabled={!desktopToolbarSelection?.supportsRelationships}
        deleteDisabled={!canWriteMap}
        deleteDisabledReason={deleteDisabledReason}
        onConfigure={handleOpenToolbarConfigure}
        onRelationships={handleOpenToolbarRelationships}
        onDelete={handleOpenToolbarDelete}
      />

      <CanvasActionButtons
        viewerMode={isGuestViewer ? "guest" : "member"}
        isMobile={isMobile}
        backHref={backHref}
        backTitle={backTitle}
        showMapInfoAside={showMapInfoAside}
        canUndoSessionChanges={canUndoSessionMapChanges}
        canRedoSessionChanges={canRedoSessionMapChanges}
        onUndoSessionChanges={() => void handleUndoSessionChanges()}
        onRedoSessionChanges={() => void handleRedoSessionChanges()}
        rf={rf}
        setShowAddMenu={setShowAddMenu}
        showAddMenu={showAddMenu}
        addMenuRef={addMenuRef}
        canUseSuggestionCheck={canUseSuggestionCheck}
        suggestionsDisabledReason={!canUseSuggestionCheck ? "Suggestions are unavailable for this map." : undefined}
        showSuggestionsMenu={showSuggestionsMenu}
        suggestionMenuRef={suggestionMenuRef}
        onToggleSuggestionsMenu={handleToggleSuggestionsMenu}
        isLoadingSuggestions={isLoadingSuggestions}
        suggestionProgress={suggestionProgress}
        suggestions={mapSuggestions}
        suggestionError={suggestionError}
        suggestionsLastUpdatedAt={suggestionsLastUpdatedAt}
        onRunSuggestionCheck={() => void handleRunSuggestionCheck()}
        onDismissSuggestion={handleDismissMapSuggestion}
        canSaveTemplate={!isTemplateEditor && canSaveTemplate}
        canvasInteractionLocked={canvasInteractionLocked}
        onToggleCanvasInteractionLock={() => setCanvasInteractionLocked((prev) => !prev)}
        isPlatformAdmin={isPlatformAdmin}
        isOrgTemplateUser={accessState?.orgManagedAccess === true}
        templateVisibility={templateVisibility}
        setTemplateVisibility={handleSetTemplateVisibility}
        templateDisabledReason={templateDisabledReason}
        showTemplateMenu={showTemplateMenu}
        setShowTemplateMenu={setShowTemplateMenu}
        templateMenuRef={templateMenuRef}
        templateQuery={templateQuery}
        setTemplateQuery={handleTemplateQueryChange}
        templateResults={templateResults}
        isLoadingTemplates={isLoadingTemplates}
        isSavingTemplate={isSavingTemplate}
        templateSaveMessage={templateSaveMessage}
        onSelectTemplate={handleSelectTemplateResult}
        onSaveTemplate={() => void handleSaveTemplate()}
        showSearchMenu={showSearchMenu}
        setShowSearchMenu={setShowSearchMenu}
        searchMenuRef={searchMenuRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onSelectSearchResult={handleSelectSearchResult}
        canWriteMap={canWriteMap}
        canUseWizard={canUseWizard}
        addDisabledReason={addDisabledReason}
        wizardDisabledReason={wizardDisabledReason}
        canPrint={canPrintMap}
        printDisabledReason={readOnlyActionReason}
        onOpenWizard={() => {
          if (!canUseWizard) return;
          setShowWizardModal(true);
        }}
        canCreateSticky={canCreateSticky}
        handleAddBlankDocument={handleAddBlankDocument}
        handleAddSystemCircle={handleAddSystemCircle}
        handleAddProcessComponent={handleAddProcessComponent}
        handleAddPerson={handleAddPerson}
        handleAddEquipment={handleAddEquipment}
        handleAddEnvironment={handleAddEnvironment}
        handleAddAnchor={handleAddAnchor}
        handleAddProcessHeading={handleAddProcessHeading}
        handleAddGroupingContainer={handleAddGroupingContainer}
        handleAddStickyNote={handleAddStickyNote}
        handleStartAddImageAsset={handleStartAddImageAsset}
        handleAddTextBox={handleAddTextBox}
        handleAddTable={handleAddTable}
        handleAddShapeRectangle={handleAddShapeRectangle}
        handleAddShapeCircle={handleAddShapeCircle}
        handleAddShapePill={handleAddShapePill}
        handleAddShapePentagon={handleAddShapePentagon}
        handleAddShapeChevronLeft={handleAddShapeChevronLeft}
        handleAddShapeArrow={handleAddShapeArrow}
        handleAddBowtieHazard={handleAddBowtieHazard}
        handleAddBowtieTopEvent={handleAddBowtieTopEvent}
        handleAddBowtieThreat={handleAddBowtieThreat}
        handleAddBowtieConsequence={handleAddBowtieConsequence}
        handleAddBowtieControl={handleAddBowtieControl}
        handleAddBowtieEscalationFactor={handleAddBowtieEscalationFactor}
        handleAddBowtieRecoveryMeasure={handleAddBowtieRecoveryMeasure}
        handleAddBowtieDegradationIndicator={handleAddBowtieDegradationIndicator}
        handleAddBowtieRiskRating={handleAddBowtieRiskRating}
        handleAddIncidentSequenceStep={handleAddIncidentSequenceStep}
        handleAddIncidentOutcome={handleAddIncidentOutcome}
        handleAddIncidentTaskCondition={handleAddIncidentTaskCondition}
        handleAddIncidentFactor={handleAddIncidentFactor}
        handleAddIncidentSystemFactor={handleAddIncidentSystemFactor}
        handleAddIncidentControlBarrier={handleAddIncidentControlBarrier}
        handleAddIncidentEvidence={handleAddIncidentEvidence}
        handleAddIncidentResponseRecovery={handleAddIncidentResponseRecovery}
        handleAddIncidentFinding={handleAddIncidentFinding}
        handleAddIncidentRecommendation={handleAddIncidentRecommendation}
        allowedNodeKinds={allowedNodeKinds}
        showPrintMenu={showPrintMenu}
        setShowPrintMenu={setShowPrintMenu}
        printMenuRef={printMenuRef}
        onPrintCurrentView={() => void handlePrintCurrentView()}
        onPrintSelectArea={handlePrintSelectArea}
        isPreparingPrint={isPreparingPrint}
      />
      <SystemMapWelcomeModal
        open={showWelcomeModal}
        isMobile={isMobile}
        onStartManual={() => setShowWelcomeModal(false)}
        onStartWizard={() => {
          setShowWelcomeModal(false);
          if (canUseWizard) setShowWizardModal(true);
        }}
      />
      <SystemMapWizardModal
        open={showWizardModal}
        isMobile={isMobile}
        onClose={() => setShowWizardModal(false)}
        isSaving={wizardSaving}
        onCommitStep={async (payload) => {
          setWizardSaving(true);
          try {
            await handleWizardCommitStep(payload);
          } finally {
            setWizardSaving(false);
          }
        }}
      />
      <CanvasHelpModal
        open={showHelpModal}
        isMobile={isMobile}
        mapCategoryId={mapCategoryId}
        allowedNodeKinds={allowedNodeKinds}
        onClose={() => setShowHelpModal(false)}
      />

      {!isGuestViewer ? (
        <MapInfoAside
          isMobile={isMobile}
          showMapInfoAside={showMapInfoAside}
          mapInfoAsideRef={mapInfoAsideRef}
          handleCloseMapInfoAside={() => {
            setShowOrgAccessModal(false);
            handleCloseMapInfoAside();
          }}
          canManageMapMetadata={canManageMapMetadata}
          isEditingMapInfo={isEditingMapInfo}
          mapInfoNameDraft={mapInfoNameDraft}
          setMapInfoNameDraft={setMapInfoNameDraft}
          mapCodeDraft={mapCodeDraft}
          setMapCodeDraft={setMapCodeDraft}
          mapInfoDescriptionDraft={mapInfoDescriptionDraft}
          setMapInfoDescriptionDraft={setMapInfoDescriptionDraft}
          map={map}
          savingMapInfo={savingMapInfo}
          handleSaveMapInfo={handleSaveMapInfo}
          setIsEditingMapInfo={setIsEditingMapInfo}
          setMapInfoDescriptionDraftFromMap={() => setMapInfoDescriptionDraft(map.description ?? "")}
          setMapCodeDraftFromMap={() => setMapCodeDraft(map.map_code ?? "")}
          mapMembers={mapMembers}
          ownerHasActiveOrganisation={ownerHasActiveOrganisation}
          showOrgAccessModal={showOrgAccessModal}
          setShowOrgAccessModal={setShowOrgAccessModal}
          userId={userId}
          userEmail={userEmail}
          orgAccessCandidates={filteredOrgAccessCandidates}
          orgAccessSearch={orgAccessSearch}
          setOrgAccessSearch={setOrgAccessSearch}
          orgAccessLoading={orgAccessLoading}
          orgAccessError={orgAccessError}
          grantingOrgAccessUserId={grantingOrgAccessUserId}
          handleGrantOrgUserFullWrite={handleGrantOrgUserFullWrite}
          savingMemberRoleUserId={savingMemberRoleUserId}
          handleUpdateMapMemberRole={handleUpdateMapMemberRoleAndRefresh}
          mapRoleLabel={mapRoleLabel}
        />
      ) : null}

      <main className="relative min-h-0 flex-1 overflow-hidden pb-0">
        {anchorNavigationNotice ? (
          <div
            className="pointer-events-none absolute z-[160] -translate-x-1/2 -translate-y-full rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-lg"
            style={{ left: anchorNavigationNotice.left, top: anchorNavigationNotice.top }}
          >
            {anchorNavigationNotice.message}
          </div>
        ) : null}
        <div
          ref={canvasRef}
          className="h-full w-full bg-stone-50"
          onMouseDown={handlePaneMouseDown}
          onPointerDownCapture={handleCanvasNodePointerDownCapture}
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            setMobileNodeMenuId(null);
            setShowAddMenu(false);
          }}
        >
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={flowNodeTypes}
            edgeTypes={flowEdgeTypes}
            onlyRenderVisibleElements
            nodesConnectable={false}
            edgesReconnectable={false}
            deleteKeyCode={null}
            elevateNodesOnSelect={false}
            nodesFocusable={false}
            edgesFocusable={false}
            onInit={(instance) => setRf({ fitView: instance.fitView, screenToFlowPosition: instance.screenToFlowPosition, setViewport: instance.setViewport })}
            onNodesChange={handleFlowNodesChange}
            onNodeClick={handleCanvasNodeSingleClick}
            onNodeDoubleClick={handleCanvasNodeDoubleClick}
            onNodeContextMenu={(e, n) => {
              if (!canUseContextMenu || canvasInteractionLocked) return;
              e.preventDefault();
              if (n.data.entityKind === "grouping_container") {
                const target = e.target as HTMLElement | null;
                const clickedGroupingHandle = !!target?.closest(".grouping-drag-handle, .grouping-select-handle");
                if (!clickedGroupingHandle) return;
              }
              if (isMobile) {
                setMobileNodeMenuId(n.id);
                return;
              }
              setSelectedFlowIds((prev) => {
                const next = new Set(prev);
                if (next.has(n.id)) next.delete(n.id);
                else next.add(n.id);
                return next;
              });
            }}
            onPaneClick={() => {
              scheduleHoveredNodeId(null);
              scheduleHoveredEdgeId(null);
              if (isNodeDragActiveRef.current) return;
              if (consumePaneClearSuppression()) return;
              if (hasOpenCanvasAside) queueOpenLeftAsideAutosave(true);
              handlePaneClickClearSelection();
            }}
            onPaneContextMenu={(e) => {
              if (!canUseContextMenu) return;
              e.preventDefault();
            }}
            onNodeMouseEnter={(_, n) => scheduleHoveredNodeId(n.id)}
            onNodeMouseLeave={() => scheduleHoveredNodeId(null)}
            onNodeDragStart={() => {
              beginNodeDrag();
              setIsNodeDragActive(true);
            }}
            onNodeDragStop={(event, node) => {
              flushPendingFlowNodePositionChanges();
              beginNodeDragStop();
              void onNodeDragStop(event, node).finally(() => {
                finishNodeDragStop();
                setIsNodeDragActive(false);
              });
            }}
            onMoveEnd={onMoveEnd}
            nodesDraggable={canManipulateCanvasElements}
            zoomOnDoubleClick={false}
            onEdgeMouseEnter={(_, edge) => scheduleHoveredEdgeId(edge.id)}
            onEdgeMouseLeave={() => scheduleHoveredEdgeId(null)}
            onEdgeClick={(event, edge) => {
              event.preventDefault();
              event.stopPropagation();
              const rel = relations.find((r) => r.id === edge.id);
              if (!rel) return;
              const fromNode = rel.from_node_id ? nodes.find((n) => n.id === rel.from_node_id) : null;
              const fromSystem = rel.source_system_element_id
                ? elements.find((el) => el.id === rel.source_system_element_id && el.element_type !== "grouping_container")
                : null;
              const fromGrouping = rel.source_grouping_element_id
                ? elements.find((el) => el.id === rel.source_grouping_element_id && el.element_type === "grouping_container")
                : null;
              const toNode = rel.to_node_id ? nodes.find((n) => n.id === rel.to_node_id) : null;
              const toSystem = rel.target_system_element_id
                ? elements.find((el) => el.id === rel.target_system_element_id && el.element_type !== "grouping_container")
                : null;
              const toGrouping = rel.target_grouping_element_id
                ? elements.find((el) => el.id === rel.target_grouping_element_id && el.element_type === "grouping_container")
                : null;
              const fromLabel =
                fromNode?.title ||
                (fromSystem ? getElementDisplayName(fromSystem) : null) ||
                fromGrouping?.heading ||
                "Unknown source";
              const toLabel = toNode?.title || (toSystem ? getElementDisplayName(toSystem) : null) || toGrouping?.heading || "Unknown destination";
              const relationLabel = getDisplayRelationType(rel.relation_type);
              const relationshipType = getRelationshipCategoryLabel(rel.relationship_category, rel.relationship_custom_type);
              const disciplines = getRelationshipDisciplineLetters(rel.relationship_disciplines);
              const description = rel.relationship_description?.trim() || "No relationship context added by user";
              setRelationshipPopup({
                x: event.clientX,
                y: event.clientY,
                fromLabel,
                toLabel,
                relationLabel,
                relationshipType,
                disciplines: disciplines || "None",
                description,
              });
            }}
            panOnDrag
            elementsSelectable={canManipulateCanvasElements}
            selectionOnDrag={canManipulateCanvasElements}
            zoomOnScroll
            snapToGrid
            snapGrid={[minorGridSize, minorGridSize]}
            minZoom={isMobile ? 0.2 : 0.2}
            maxZoom={2}
            fitView={!isMobile}
            fitViewOptions={{ padding: 0.2 }}
            style={{ backgroundColor: "#fafaf9" }}
          >
            <Background id="minor" variant={BackgroundVariant.Lines} gap={minorGridSize} size={1} color="#e7e5e4" />
            <Background id="major" variant={BackgroundVariant.Lines} gap={majorGridSize} size={1.2} color="#d6d3d1" />
            <GuestMapNotesLayer
              enabled={isGuestViewer}
              campaignSlug={guestCampaignSlug}
              guestSessionEmail={guestSessionEmail}
              canvasRef={canvasRef}
              screenToFlowPosition={rf?.screenToFlowPosition ?? null}
            />
          </ReactFlow>
        </div>

        <CanvasPrintOverlay
          printSelectionMode={printSelectionMode}
          printHeaderHeightPx={PRINT_HEADER_HEIGHT_PX}
          activePrintSelectionRect={activePrintSelectionRect}
          onOverlayPointerDown={handlePrintOverlayPointerDown}
          onOverlayPointerMove={handlePrintOverlayPointerMove}
          onOverlayPointerUp={handlePrintOverlayPointerUp}
          showPrintSelectionConfirm={showPrintSelectionConfirm}
          onCancelPrintSelection={exitPrintSelectionMode}
          onConfirmPrintArea={() => void handleConfirmPrintArea()}
          onCopyPrintAreaImage={() => void handleCopyPrintAreaImageToClipboard()}
          isCopyingPrintImage={isCopyingPrintImage}
          printSelectionCopyMessage={printSelectionCopyMessage}
          isPreparingPrint={isPreparingPrint}
          showPrintPreview={showPrintPreview}
          printPreviewHtml={printPreviewHtml}
          printOrientation={printOrientation}
          onSetPortrait={() => setPrintOrientation("portrait")}
          onSetLandscape={() => setPrintOrientation("landscape")}
          onSavePrint={() => {
            const w = printPreviewFrameRef.current?.contentWindow;
            if (!w) return;
            w.focus();
            w.print();
          }}
          onClosePreview={() => setShowPrintPreview(false)}
          printPreviewFrameRef={printPreviewFrameRef}
        />

        <CanvasFloatingOverlays
          selectionMarquee={selectionMarquee}
          showDeleteSelectionConfirm={showDeleteSelectionConfirm}
          selectedFlowIdsSize={selectedFlowIds.size}
          onDeleteSelected={handleDeleteSelectedComponents}
          onCancelDeleteSelected={() => setShowDeleteSelectionConfirm(false)}
          showImageUploadModal={showImageUploadModal}
          onCancelImageUpload={handleCancelImageUpload}
          onSelectImageUploadFile={handleSelectImageUploadFile}
          imageUploadPreviewUrl={imageUploadPreviewUrl}
          imageUploadDescription={imageUploadDescription}
          setImageUploadDescription={setImageUploadDescription}
          onConfirmImageUpload={() => {
            void handleConfirmImageUpload();
          }}
          imageUploadFile={imageUploadFile}
          imageUploadSaving={imageUploadSaving}
          evidenceMediaOverlay={evidenceMediaOverlay}
          onCancelEvidenceMediaOverlay={handleCancelEvidenceMediaOverlay}
          onSaveEvidenceMediaOverlay={() => {
            void handleSaveEvidenceMediaOverlay();
          }}
          onRotateEvidenceMediaOverlay={handleRotateEvidenceMediaOverlay}
          onChangeEvidenceMediaOverlayFileName={(value) =>
            setEvidenceMediaOverlay((prev) => (prev ? { ...prev, fileName: value } : prev))
          }
          onChangeEvidenceMediaOverlayDescription={(value) =>
            setEvidenceMediaOverlay((prev) => (prev ? { ...prev, description: value } : prev))
          }
          relationshipPopup={relationshipPopup}
          relationshipPopupRef={relationshipPopupRef}
        />


        <MobileNodeActionSheet
          open={Boolean(isMobile && mobileNodeMenuId)}
          title={mobileNodeMenuId ? (nodes.find((n) => n.id === mobileNodeMenuId)?.title || "Document") : "Document"}
          onEditProperties={() => {
            if (!mobileNodeMenuId) return;
            setSelectedProcessId(null);
            setSelectedNodeId(mobileNodeMenuId);
            setMobileNodeMenuId(null);
          }}
          onAddRelationship={() => {
            if (readOnlyActionReason) return;
            if (!mobileNodeMenuId) return;
            openRelationshipStateFromSource({ nodeId: mobileNodeMenuId });
            setMobileNodeMenuId(null);
          }}
          onOpenStructure={() => {
            if (!mobileNodeMenuId) return;
            setOutlineCreateMode(null);
            closeOutlineEditor();
            setConfirmDeleteOutlineItemId(null);
            setCollapsedHeadingIds(new Set());
            setOutlineNodeId(mobileNodeMenuId);
            setMobileNodeMenuId(null);
            void loadOutline(mobileNodeMenuId);
          }}
          onDeleteDocument={() => {
            if (readOnlyActionReason) return;
            if (!mobileNodeMenuId) return;
            setConfirmDeleteNodeId(mobileNodeMenuId);
            setMobileNodeMenuId(null);
          }}
          onClose={() => setMobileNodeMenuId(null)}
          actionDisabledReason={readOnlyActionReason}
        />

        <MobileAddRelationshipModal
          open={Boolean(showAddRelationship && isMobile)}
          sourceLabel={relationshipSourceNode?.title || relationshipSourceGrouping?.heading || "Unknown source"}
          relationshipModeGrouping={relationshipModeGrouping}
          relationshipGroupingQuery={relationshipGroupingQuery}
          setRelationshipGroupingQuery={setRelationshipGroupingQuery}
          groupingRelationCandidateIdByLabel={groupingRelationCandidateIdByLabel}
          setRelationshipTargetGroupingId={setRelationshipTargetGroupingId}
          alreadyRelatedGroupingTargetIds={alreadyRelatedGroupingTargetIds}
          showRelationshipGroupingOptions={showRelationshipGroupingOptions}
          setShowRelationshipGroupingOptions={setShowRelationshipGroupingOptions}
          groupingRelationCandidates={groupingRelationCandidates}
          groupingRelationCandidateLabelById={groupingRelationCandidateLabelById}
          allowDocumentTargets={allowDocumentTargets}
          relationshipDocumentQuery={relationshipDocumentQuery}
          setRelationshipDocumentQuery={setRelationshipDocumentQuery}
          documentRelationCandidateIdByLabel={documentRelationCandidateIdByLabel}
          setRelationshipTargetDocumentId={setRelationshipTargetDocumentId}
          alreadyRelatedDocumentTargetIds={alreadyRelatedDocumentTargetIds}
          showRelationshipDocumentOptions={showRelationshipDocumentOptions}
          setShowRelationshipDocumentOptions={setShowRelationshipDocumentOptions}
          documentRelationCandidates={documentRelationCandidates}
          documentRelationCandidateLabelById={documentRelationCandidateLabelById}
          allowSystemTargets={allowSystemTargets}
          relationshipSystemQuery={relationshipSystemQuery}
          setRelationshipSystemQuery={setRelationshipSystemQuery}
          systemRelationCandidateIdByLabel={systemRelationCandidateIdByLabel}
          setRelationshipTargetSystemId={setRelationshipTargetSystemId}
          alreadyRelatedSystemTargetIds={alreadyRelatedSystemTargetIds}
          showRelationshipSystemOptions={showRelationshipSystemOptions}
          setShowRelationshipSystemOptions={setShowRelationshipSystemOptions}
          systemRelationCandidates={systemRelationCandidates}
          systemRelationCandidateLabelById={systemRelationCandidateLabelById}
          getElementRelationshipDisplayLabel={getElementRelationshipDisplayLabel}
          relationshipDisciplineSelection={relationshipDisciplineSelection}
          disciplineLabelByKey={disciplineLabelByKey}
          showRelationshipDisciplineMenu={showRelationshipDisciplineMenu}
          setShowRelationshipDisciplineMenu={setShowRelationshipDisciplineMenu}
          disciplineOptions={disciplineOptions}
          setRelationshipDisciplineSelection={setRelationshipDisciplineSelection}
          relationshipCategory={relationshipCategory}
          setRelationshipCategory={setRelationshipCategory}
          relationshipCategoryOptions={relationshipCategoryOptions}
          relationshipCustomType={relationshipCustomType}
          setRelationshipCustomType={setRelationshipCustomType}
          relationshipDescription={relationshipDescription}
          setRelationshipDescription={setRelationshipDescription}
          relationshipTargetDocumentId={relationshipTargetDocumentId}
          relationshipTargetSystemId={relationshipTargetSystemId}
          relationshipTargetGroupingId={relationshipTargetGroupingId}
          onCancel={closeAddRelationshipModal}
          onAdd={() => {
            if (readOnlyActionReason) return;
            void handleAddRelation();
          }}
          actionDisabledReason={readOnlyActionReason}
        />

        <CanvasConfirmDialogs
          confirmDeleteNodeId={confirmDeleteNodeId}
          setConfirmDeleteNodeId={setConfirmDeleteNodeId}
          handleDeleteNode={handleDeleteNode}
          confirmDeleteElementId={confirmDeleteElementId}
          setConfirmDeleteElementId={setConfirmDeleteElementId}
          handleDeleteElement={handleDeleteProcessElement}
          confirmDeleteOutlineItemId={confirmDeleteOutlineItemId}
          setConfirmDeleteOutlineItemId={setConfirmDeleteOutlineItemId}
          handleDeleteOutlineItem={handleDeleteOutlineItem}
        />

        <CanvasElementPropertyOverlays
          categoryProps={{
            open: getPrimaryAsideOpen("category", selectedProcess, selectedProcessId),
            isMobile,
            leftAsideSlideIn,
            processHeadingDraft,
            setProcessHeadingDraft,
            processFontSizeDraft,
            setProcessFontSizeDraft,
            processFillModeDraft,
            setProcessFillModeDraft,
            processOutlineColorDraft,
            setProcessOutlineColorDraft,
            processOutlineWidthDraft,
            setProcessOutlineWidthDraft,
            categoryColorOptions,
            processColorDraft,
            setProcessColorDraft,
            onDelete: async () => {
              if (!selectedProcess) return;
              await handleDeleteProcessElement(selectedProcess.id);
            },
            onSave: async () => {
              await handleSaveProcessHeading();
              closeCategoryAside();
            },
            onClose: closeCategoryAside,
            actionDisabledReason: readOnlyActionReason,
          }}
          systemProps={{
            open: getPrimaryAsideOpen("system", selectedSystem, selectedSystemId),
            isMobile,
            leftAsideSlideIn,
            systemNameDraft,
            setSystemNameDraft,
            onDelete: async () => {
              if (!selectedSystem) return;
              await handleDeleteProcessElement(selectedSystem.id);
            },
            onSave: async () => {
              await handleSaveSystemName();
              closeSystemAside();
            },
            onClose: closeSystemAside,
            onAddRelationship: () => {
              if (!selectedSystem) return;
              openAddRelationshipFromSource({ systemId: selectedSystem.id });
            },
            relatedRows: relatedSystemRows,
            resolveLabels: resolveDocumentRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
            actionDisabledReason: readOnlyActionReason,
          }}
          processProps={{
            open: getPrimaryAsideOpen("processComponent", selectedProcessComponent, selectedProcessComponentId),
            isMobile,
            leftAsideSlideIn,
            processComponentLabelDraft,
            setProcessComponentLabelDraft,
            onDelete: async () => {
              if (!selectedProcessComponent) return;
              await handleDeleteProcessElement(selectedProcessComponent.id);
            },
            onSave: async () => {
              await handleSaveProcessComponent();
              closeProcessComponentAside();
            },
            onClose: closeProcessComponentAside,
            onAddRelationship: () => {
              if (!selectedProcessComponent) return;
              openAddRelationshipFromSource({ systemId: selectedProcessComponent.id });
            },
            relatedRows: relatedProcessComponentRows,
            resolveLabels: resolveDocumentRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
            actionDisabledReason: readOnlyActionReason,
          }}
          personProps={{
            open: getPrimaryAsideOpen("person", selectedPerson, selectedPersonId),
            isMobile,
            leftAsideSlideIn,
            mapCategoryId,
            selectedElementType:
              selectedPerson?.element_type === "person" ||
              selectedPerson?.element_type === "equipment" ||
              selectedPerson?.element_type === "environment"
                ? selectedPerson.element_type
                : null,
            personTypeDraft,
            setPersonTypeDraft,
            personRoleDraft,
            setPersonRoleDraft,
            personRoleIdDraft,
            setPersonRoleIdDraft,
            personDepartmentDraft,
            setPersonDepartmentDraft,
            personOccupantNameDraft,
            setPersonOccupantNameDraft,
            personStartDateDraft,
            setPersonStartDateDraft,
            personEmploymentTypeDraft,
            setPersonEmploymentTypeDraft,
            personActingNameDraft,
            setPersonActingNameDraft,
            personActingStartDateDraft,
            setPersonActingStartDateDraft,
            personRecruitingDraft,
            setPersonRecruitingDraft,
            personProposedRoleDraft,
            setPersonProposedRoleDraft,
            equipmentTypeDraft,
            setEquipmentTypeDraft,
            equipmentIdentifierDraft,
            setEquipmentIdentifierDraft,
            environmentDetailDraft,
            setEnvironmentDetailDraft,
            environmentFactorTypeDraft,
            setEnvironmentFactorTypeDraft,
            orgChartDepartmentOptions,
            onDelete: async () => {
              if (!selectedPerson) return;
              await handleDeleteProcessElement(selectedPerson.id);
            },
            onSave: async () => {
              await handleSavePerson();
              closePersonAside();
            },
            onClose: closePersonAside,
            onAddRelationship: () => {
              if (!selectedPerson) return;
              openAddRelationshipFromSource({ systemId: selectedPerson.id });
            },
            relatedRows: relatedPersonRows,
            resolveLabels: resolvePersonRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
            actionDisabledReason: readOnlyActionReason,
          }}
          anchorProps={{
            open: getPrimaryAsideOpen("anchor", selectedAnchor, selectedAnchorId),
            isMobile,
            leftAsideSlideIn,
            anchorTitleDraft,
            setAnchorTitleDraft,
            anchorColorDraft,
            setAnchorColorDraft,
            anchorSearchDraft,
            setAnchorSearchDraft,
            selectedAnchorSequenceNumber,
            anchorGroupSize: Math.max(1, selectedAnchorOrderIds.length || selectedAnchorGroupIds.length),
            linkedAnchors: selectedAnchorOrderItems,
            searchResults: anchorSearchResults,
            onAddLink: handleAddAnchorLink,
            onRemoveLink: handleRemoveAnchorLink,
            onReorderLinkedAnchors: handleReorderAnchorLinks,
            onDelete: async () => {
              if (!selectedAnchor) return;
              await handleDeleteProcessElement(selectedAnchor.id);
            },
            onSave: async () => {
              await handleSaveAnchor();
              closeAnchorAside();
            },
            onClose: closeAnchorAside,
            actionDisabledReason: readOnlyActionReason,
          }}
          bowtieProps={{
            open: getPrimaryAsideOpen("bowtieElement", selectedBowtieElement, selectedBowtieElementId),
            isMobile,
            leftAsideSlideIn,
            bowtieElementType:
              selectedBowtieElement?.element_type && isMethodologyElementType(selectedBowtieElement.element_type)
                ? (selectedBowtieElement.element_type as
                    | "bowtie_hazard"
                    | "bowtie_top_event"
                    | "bowtie_threat"
                    | "bowtie_consequence"
                    | "bowtie_control"
                    | "bowtie_escalation_factor"
                    | "bowtie_recovery_measure"
                    | "bowtie_degradation_indicator"
                    | "bowtie_risk_rating"
                    | "incident_sequence_step"
                    | "incident_outcome"
                    | "incident_task_condition"
                    | "incident_factor"
                    | "incident_system_factor"
                    | "incident_control_barrier"
                    | "incident_evidence"
                    | "incident_response_recovery"
                    | "incident_finding"
                    | "incident_recommendation")
                : null,
            bowtieDraft,
            setBowtieDraft,
            availableFactorPeople,
            evidenceUploadPreviewUrl,
            evidenceUploadFileName: evidenceUploadFile?.name ?? "",
            evidenceUploadFileMime: evidenceUploadFile?.type ?? "",
            evidenceCurrentMediaName: String(bowtieDraft.media_name ?? ""),
            evidenceCurrentMediaMime: String(bowtieDraft.media_mime ?? ""),
            evidenceCurrentMediaUrl:
              selectedBowtieElement?.element_type === "incident_evidence" ? imageUrlsByElementId[selectedBowtieElement.id] ?? null : null,
            onSelectEvidenceUploadFile: handleSelectEvidenceUploadFile,
            onClearEvidenceUploadFile: handleClearEvidenceUploadFile,
            onDeleteEvidenceAttachment: handleDeleteEvidenceAttachment,
            onDelete: async () => {
              if (!selectedBowtieElement) return;
              if (selectedBowtieElement.element_type === "incident_evidence") {
                const cfg = (selectedBowtieElement.element_config as Record<string, unknown> | null) ?? {};
                const path = typeof cfg.media_storage_path === "string" ? cfg.media_storage_path : "";
                if (path) {
                  await supabaseBrowser.storage.from("systemmap").remove([path]);
                }
              }
              await handleDeleteProcessElement(selectedBowtieElement.id);
              setSelectedBowtieElementId(null);
            },
            onSave: async () => {
              await handleSaveBowtieElement(isMobile);
              closeBowtieElementAside();
            },
            onClose: closeBowtieElementAside,
            onAddRelationship: () => {
              if (!selectedBowtieElement) return;
              openAddRelationshipFromSource({ systemId: selectedBowtieElement.id });
            },
            relatedRows: relatedBowtieRows,
            resolveLabels: resolvePersonRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
            actionDisabledReason: readOnlyActionReason,
          }}
          groupingProps={{
            open: getPrimaryAsideOpen("grouping", selectedGrouping, selectedGroupingId),
            isMobile,
            leftAsideSlideIn,
            groupingLabelDraft,
            setGroupingLabelDraft,
            groupingHeaderColorDraft,
            setGroupingHeaderColorDraft,
            groupingHeaderFontSizeDraft,
            setGroupingHeaderFontSizeDraft,
            groupingOutlineWidthDraft,
            setGroupingOutlineWidthDraft,
            onDelete: async () => {
              if (!selectedGrouping) return;
              await handleDeleteProcessElement(selectedGrouping.id);
            },
            onSave: async () => {
              await handleSaveGroupingContainer();
              closeGroupingAside();
            },
            onClose: closeGroupingAside,
            onAddRelationship: () => {
              if (!selectedGrouping) return;
              openAddRelationshipFromSource({ groupingId: selectedGrouping.id });
            },
            relatedRows: relatedGroupingRows,
            resolveLabels: resolveGroupingRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
            actionDisabledReason: readOnlyActionReason,
          }}
          stickyProps={{
            open: getPrimaryAsideOpen("sticky", selectedSticky, selectedStickyId),
            isMobile,
            leftAsideSlideIn,
            stickyTextDraft,
            setStickyTextDraft,
            stickyBackgroundColorDraft,
            setStickyBackgroundColorDraft,
            stickyOutlineColorDraft,
            setStickyOutlineColorDraft,
            stickyFillModeDraft,
            setStickyFillModeDraft,
            stickyOutlineWidthDraft,
            setStickyOutlineWidthDraft,
            onDelete: async () => {
              if (!selectedSticky) return;
              await handleDeleteProcessElement(selectedSticky.id);
            },
            onSave: async () => {
              await handleSaveStickyNote();
              closeStickyAside();
            },
            onClose: closeStickyAside,
            actionDisabledReason: readOnlyActionReason,
          }}
          imageProps={{
            open: getPrimaryAsideOpen("image", selectedImage, selectedImageId),
            isMobile,
            leftAsideSlideIn,
            imageDescriptionDraft,
            setImageDescriptionDraft,
            onDelete: async () => {
              if (!selectedImage) return;
              const cfg = (selectedImage.element_config as Record<string, unknown> | null) ?? {};
              const path = typeof cfg.storage_path === "string" ? cfg.storage_path : "";
              if (path) {
                await supabaseBrowser.storage.from("systemmap").remove([path]);
              }
              await handleDeleteProcessElement(selectedImage.id);
              setSelectedImageId(null);
            },
            onSave: async () => {
              await handleSaveImageAsset();
              closeImageAside();
            },
            onClose: closeImageAside,
            onAddRelationship: () => {
              if (!selectedImage) return;
              openAddRelationshipFromSource({ systemId: selectedImage.id });
            },
            relatedRows: relatedImageRows,
            resolveLabels: resolvePersonRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
            actionDisabledReason: readOnlyActionReason,
          }}
          textBoxProps={{
            open: getPrimaryAsideOpen("textBox", selectedTextBox, selectedTextBoxId),
            isMobile,
            leftAsideSlideIn,
            textBoxContentDraft,
            setTextBoxContentDraft,
            textBoxBoldDraft,
            setTextBoxBoldDraft,
            textBoxItalicDraft,
            setTextBoxItalicDraft,
            textBoxUnderlineDraft,
            setTextBoxUnderlineDraft,
            textBoxAlignDraft,
            setTextBoxAlignDraft,
            textBoxFontSizeDraft,
            setTextBoxFontSizeDraft,
            textBoxBackgroundColorDraft,
            setTextBoxBackgroundColorDraft,
            textBoxOutlineDraft,
            setTextBoxOutlineDraft,
            textBoxOutlineColorDraft,
            setTextBoxOutlineColorDraft,
            textBoxOutlineWidthDraft,
            setTextBoxOutlineWidthDraft,
            onDelete: async () => {
              if (!selectedTextBox) return;
              await handleDeleteProcessElement(selectedTextBox.id);
              setSelectedTextBoxId(null);
            },
            onSave: async () => {
              await handleSaveTextBox();
              closeTextBoxAside();
            },
            onClose: closeTextBoxAside,
            actionDisabledReason: readOnlyActionReason,
          }}
          tableProps={{
            open: getPrimaryAsideOpen("table", selectedTable, selectedTableId),
            isMobile,
            leftAsideSlideIn,
            tableRowsDraft,
            setTableRowsDraft,
            tableColumnsDraft,
            setTableColumnsDraft,
            tableHeaderBgDraft,
            setTableHeaderBgDraft,
            tableGridLineColorDraft,
            setTableGridLineColorDraft,
            tableGridLineWeightDraft,
            setTableGridLineWeightDraft,
            tableBoldDraft,
            setTableBoldDraft,
            tableItalicDraft,
            setTableItalicDraft,
            tableUnderlineDraft,
            setTableUnderlineDraft,
            tableAlignDraft,
            setTableAlignDraft,
            tableFontSizeDraft,
            setTableFontSizeDraft,
            tableMinRows,
            tableMinColumns,
            onDelete: async () => {
              if (!selectedTable) return;
              await handleDeleteProcessElement(selectedTable.id);
              setSelectedTableId(null);
            },
            onSave: async () => {
              await handleSaveTable();
              closeTableAside();
            },
            onClose: closeTableAside,
            actionDisabledReason: readOnlyActionReason,
          }}
          flowShapeProps={{
            open: getPrimaryAsideOpen("flowShape", selectedFlowShape, selectedFlowShapeId),
            isMobile,
            leftAsideSlideIn,
            title:
              selectedFlowShape?.element_type === "shape_circle"
                ? "Circle Properties"
                : selectedFlowShape?.element_type === "shape_pill"
                ? "Pill Properties"
                : selectedFlowShape?.element_type === "shape_pentagon"
                ? "Pentagon Properties"
                : selectedFlowShape?.element_type === "shape_chevron_left"
                ? "Chevron Properties"
                : selectedFlowShape?.element_type === "shape_arrow"
                ? "Arrow Properties"
                : "Rectangle Properties",
            shapeTextDraft: flowShapeTextDraft,
            setShapeTextDraft: setFlowShapeTextDraft,
            shapeAlignDraft: flowShapeAlignDraft,
            setShapeAlignDraft: setFlowShapeAlignDraft,
            shapeBoldDraft: flowShapeBoldDraft,
            setShapeBoldDraft: setFlowShapeBoldDraft,
            shapeItalicDraft: flowShapeItalicDraft,
            setShapeItalicDraft: setFlowShapeItalicDraft,
            shapeUnderlineDraft: flowShapeUnderlineDraft,
            setShapeUnderlineDraft: setFlowShapeUnderlineDraft,
            shapeFontSizeDraft: flowShapeFontSizeDraft,
            setShapeFontSizeDraft: setFlowShapeFontSizeDraft,
            shapeColorDraft: flowShapeColorDraft,
            setShapeColorDraft: setFlowShapeColorDraft,
            shapeFillModeDraft: flowShapeFillModeDraft,
            setShapeFillModeDraft: setFlowShapeFillModeDraft,
            shapeOutlineColorDraft: flowShapeOutlineColorDraft,
            setShapeOutlineColorDraft: setFlowShapeOutlineColorDraft,
            shapeOutlineWidthDraft: flowShapeOutlineWidthDraft,
            setShapeOutlineWidthDraft: setFlowShapeOutlineWidthDraft,
            canFlipDirection:
              selectedFlowShape?.element_type === "shape_pentagon" ||
              selectedFlowShape?.element_type === "shape_chevron_left",
            shapeDirectionDraft: flowShapeDirectionDraft,
            setShapeDirectionDraft: setFlowShapeDirectionDraft,
            supportsText: selectedFlowShape?.element_type !== "shape_arrow",
            canRotate: selectedFlowShape?.element_type === "shape_arrow",
            shapeRotationDraft: flowShapeRotationDraft,
            setShapeRotationDraft: setFlowShapeRotationDraft,
            onDelete: async () => {
              if (!selectedFlowShape) return;
              await handleDeleteProcessElement(selectedFlowShape.id);
              setSelectedFlowShapeId(null);
            },
            onSave: async () => {
              await handleSaveFlowShape();
              closeFlowShapeAside();
            },
            onClose: closeFlowShapeAside,
            actionDisabledReason: readOnlyActionReason,
          }}
          documentProps={{
            open: getPrimaryAsideOpen("document", selectedNode, selectedNodeId),
            leftAsideSlideIn,
            onClose: closeDocumentAside,
            onOpenRelationship: () => {
              if (!selectedNode) return;
              openAddRelationshipFromSource({ nodeId: selectedNode.id });
            },
            onOpenStructure: async () => {
              if (!selectedNode) return;
              setOutlineCreateMode(null);
              closeOutlineEditor();
              setConfirmDeleteOutlineItemId(null);
              setCollapsedHeadingIds(new Set());
              setOutlineNodeId(selectedNode.id);
              await loadOutline(selectedNode.id);
              setDesktopNodeAction("structure");
            },
            onOpenDelete: () => {
              if (!selectedNode) return;
              setConfirmDeleteNodeId(selectedNode.id);
            },
            selectedTypeId,
            setSelectedTypeId,
            showTypeSelectArrowUp,
            setShowTypeSelectArrowUp,
            addDocumentTypes,
            getDisplayTypeName,
            title,
            setTitle,
            documentNumber,
            setDocumentNumber,
            disciplineMenuRef,
            showDisciplineMenu,
            setShowDisciplineMenu,
            disciplineSelection,
            setDisciplineSelection,
            disciplineOptions,
            getDisciplineLabel: (key) => disciplineLabelByKey.get(key),
            userGroup,
            setUserGroup,
            showUserGroupSelectArrowUp,
            setShowUserGroupSelectArrowUp,
            userGroupOptions,
            ownerName,
            setOwnerName,
            onSaveNode: async () => {
              await handleSaveNode();
              closeDocumentAside();
            },
            relatedRows,
            resolveLabels: resolveDocumentRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
            actionDisabledReason: readOnlyActionReason,
          }}
        />
        <CanvasDrilldownOverlays
          orgChartDirectReportAsideProps={{
            open: Boolean(mapCategoryId === "org_chart" && !isMobile && desktopNodeAction === "relationship" && showAddRelationship),
            isMobile,
            leftAsideSlideIn,
            sourceLabel: orgDirectReportSourceLabel,
            query: relationshipSystemQuery,
            setQuery: setRelationshipSystemQuery,
            showOptions: showRelationshipSystemOptions,
            setShowOptions: setShowRelationshipSystemOptions,
            candidates: orgDirectReportCandidates,
            selectedTargetId: relationshipTargetSystemId,
            setSelectedTargetId: setRelationshipTargetSystemId,
            notes: relationshipDescription,
            setNotes: setRelationshipDescription,
            onAdd: async () => {
              if (readOnlyActionReason) return;
              await handleAddOrgDirectReport();
              setShowAddRelationship(false);
            },
            onCancel: () => {
              setShowAddRelationship(false);
            },
            actionDisabledReason: readOnlyActionReason,
          }}
          relationshipManagerAsideProps={{
            open: Boolean(!isMobile && desktopNodeAction === "relationship" && !showAddRelationship && relationshipModalContext),
            isMobile,
            leftAsideSlideIn,
            title: relationshipModalContext?.title,
            addButtonLabel: relationshipModalContext?.addButtonLabel,
            onAddRelationship: () => {
              if (readOnlyActionReason) return;
              relationshipModalContext?.openAdd();
            },
            onClose: () => {
              closeAddRelationshipModal();
              setDesktopNodeAction(null);
            },
            rows: relationshipModalContext?.rows ?? [],
            resolveLabels: relationshipModalContext?.resolveLabels ?? resolveDocumentRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
            actionDisabledReason: readOnlyActionReason,
          }}
          addRelationshipAsideProps={{
            open: Boolean(mapCategoryId !== "org_chart" && !isMobile && desktopNodeAction === "relationship" && showAddRelationship),
            isMobile,
            leftAsideSlideIn,
            relationshipModeGrouping,
            relationshipSourceLabel:
              relationshipSourceNode?.title ||
              (relationshipSourceSystem ? getElementDisplayName(relationshipSourceSystem) : "") ||
              relationshipSourceGrouping?.heading ||
              "",
            relationshipSourceNodeTitle: relationshipSourceNode?.title || "",
            relationshipSourceGroupingHeading: relationshipSourceGrouping?.heading || "",
            allowDocumentTargets,
            allowSystemTargets,
            relationshipGroupingQuery,
            setRelationshipGroupingQuery,
            groupingRelationCandidateIdByLabel,
            setRelationshipTargetGroupingId,
            alreadyRelatedGroupingTargetIds,
            showRelationshipGroupingOptions,
            setShowRelationshipGroupingOptions,
            groupingRelationCandidates,
            groupingRelationCandidateLabelById,
            relationshipDocumentQuery,
            setRelationshipDocumentQuery,
            documentRelationCandidateIdByLabel,
            setRelationshipTargetDocumentId,
            alreadyRelatedDocumentTargetIds,
            showRelationshipDocumentOptions,
            setShowRelationshipDocumentOptions,
            documentRelationCandidates,
            documentRelationCandidateLabelById,
            relationshipSystemQuery,
            setRelationshipSystemQuery,
            systemRelationCandidateIdByLabel,
            setRelationshipTargetSystemId,
            alreadyRelatedSystemTargetIds,
            showRelationshipSystemOptions,
            setShowRelationshipSystemOptions,
            systemRelationCandidates,
            systemRelationCandidateLabelById,
            getElementRelationshipDisplayLabel,
            relationshipDisciplineSelection,
            disciplineLabelByKey,
            showRelationshipDisciplineMenu,
            setShowRelationshipDisciplineMenu,
            disciplineOptions,
            setRelationshipDisciplineSelection,
            relationshipCategory,
            setRelationshipCategory,
            relationshipCategoryOptions,
            relationshipCustomType,
            setRelationshipCustomType,
            relationshipDescription,
            setRelationshipDescription,
            relationshipTargetDocumentId,
            relationshipTargetSystemId,
            relationshipTargetGroupingId,
            onAdd: async () => {
              if (readOnlyActionReason) return;
              await handleAddRelation();
              setShowAddRelationship(false);
            },
            onCancel: () => {
              setShowAddRelationship(false);
            },
            actionDisabledReason: readOnlyActionReason,
          }}
          deleteDocumentAsideProps={{
            open: false,
            onDelete: async () => {
              const id = confirmDeleteNodeId;
              setConfirmDeleteNodeId(null);
              if (!id) return;
              await handleDeleteNode(id);
            },
            onCancel: () => {
              setConfirmDeleteNodeId(null);
            },
          }}
          mobileDocumentPropertiesModalProps={{
            open: Boolean(selectedNode && isMobile),
            onClose: () => setSelectedNodeId(null),
            selectedTypeId,
            setSelectedTypeId,
            addDocumentTypes,
            getDisplayTypeName,
            title,
            setTitle,
            documentNumber,
            setDocumentNumber,
            showDisciplineMenu,
            setShowDisciplineMenu,
            disciplineMenuRef,
            disciplineSelection,
            setDisciplineSelection,
            disciplineOptions,
            getDisciplineLabel: (key) => disciplineLabelByKey.get(key),
            userGroup,
            setUserGroup,
            userGroupOptions,
            ownerName,
            setOwnerName,
            onSaveNode: async () => {
              await handleSaveNode();
              setSelectedNodeId(null);
            },
            relatedItems: mobileRelatedItems,
            onDeleteRelation: handleDeleteRelation,
            actionDisabledReason: readOnlyActionReason,
          }}
          documentStructureAsideProps={{
            open: Boolean(isMobile || shouldShowDesktopStructurePanel),
            isMobile,
            outlineNodeId,
            shouldShowDesktopStructurePanel,
            onClose: () => {
              setOutlineNodeId(null);
              setOutlineCreateMode(null);
              closeOutlineEditor();
              setConfirmDeleteOutlineItemId(null);
              setDesktopNodeAction(null);
            },
            setOutlineCreateMode,
            closeOutlineEditor,
            setNewHeadingTitle,
            setNewHeadingLevel,
            setNewHeadingParentId,
            setNewContentText,
            setNewContentHeadingId,
            headingItems,
            outlineCreateMode,
            newHeadingTitle,
            newHeadingLevel,
            newHeadingParentId,
            level1Headings,
            level2Headings,
            handleCreateHeading,
            newContentHeadingId,
            newContentText,
            handleCreateContent,
            outlineEditItem,
            editHeadingTitle,
            setEditHeadingTitle,
            editHeadingLevel,
            setEditHeadingLevel,
            editHeadingParentId,
            setEditHeadingParentId,
            editContentHeadingId,
            setEditContentHeadingId,
            editContentText,
            setEditContentText,
            handleSaveOutlineEdit,
            visibleOutlineItems,
            outlineItems,
            collapsedHeadingIds,
            setCollapsedHeadingIds,
            openOutlineEditor,
            setConfirmDeleteOutlineItemId,
          }}
        />

      </main>
    </div>
  );
}

export default function SystemMapCanvasClient({
  mapId,
  showWelcomeOnLoad = false,
  templateEditorTemplateId = null,
  templateEditorTemplateName = null,
  templateEditorIsGlobal = false,
  templateEditorVisibility = templateEditorIsGlobal ? "global" : "private",
  entrySource = "dashboard",
  viewerMode = "member",
  initialSnapshot = null,
  guestSessionEmail = null,
  guestCampaignSlug = null,
}: {
  mapId: string;
  showWelcomeOnLoad?: boolean;
  templateEditorTemplateId?: string | null;
  templateEditorTemplateName?: string | null;
  templateEditorIsGlobal?: boolean;
  templateEditorVisibility?: InvestigationTemplateVisibility;
  entrySource?: "dashboard" | "templates";
  viewerMode?: "member" | "guest";
  initialSnapshot?: SystemMapCanvasSnapshot | null;
  guestSessionEmail?: string | null;
  guestCampaignSlug?: string | null;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const proto = Element.prototype as Element & {
      __systemMapReleasePointerCapturePatched?: boolean;
      __systemMapOriginalReleasePointerCapture?: typeof Element.prototype.releasePointerCapture;
    };
    if (proto.__systemMapReleasePointerCapturePatched) return;
    const original = Element.prototype.releasePointerCapture;
    proto.__systemMapOriginalReleasePointerCapture = original;
    Element.prototype.releasePointerCapture = function patchedReleasePointerCapture(pointerId: number) {
      try {
        if (typeof this.hasPointerCapture === "function" && !this.hasPointerCapture(pointerId)) {
          return;
        }
        original.call(this, pointerId);
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError") {
          return;
        }
        throw error;
      }
    };
    proto.__systemMapReleasePointerCapturePatched = true;
  }, []);

  useEffect(() => {
    const body = document.body;
    const main = document.querySelector("body > main");

    body.classList.add("system-map-route");
    main?.classList.add("dashboardSystemMapMain");

    return () => {
      body.classList.remove("system-map-route");
      main?.classList.remove("dashboardSystemMapMain");
    };
  }, []);

  return (
    <ReactFlowProvider>
      <SystemMapCanvasInner
        mapId={mapId}
        showWelcomeOnLoad={showWelcomeOnLoad}
        templateEditorTemplateId={templateEditorTemplateId}
        templateEditorTemplateName={templateEditorTemplateName}
        templateEditorIsGlobal={templateEditorIsGlobal}
        templateEditorVisibility={templateEditorVisibility}
        entrySource={entrySource}
        viewerMode={viewerMode}
        initialSnapshot={initialSnapshot}
        guestSessionEmail={guestSessionEmail}
        guestCampaignSlug={guestCampaignSlug}
      />
    </ReactFlowProvider>
  );
}

