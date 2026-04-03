"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  type Edge,
  type NodeChange,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { hasMapCategoryAccess } from "@/app/sms-diagnostic/dashboard/dashboardPortals";
import {
  A4_RATIO,
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
  type CanvasElementRow,
  categoryColorOptions,
  ccw,
  clamp,
  defaultCategoryColor,
  defaultHeight,
  defaultWidth,
  type DisciplineKey,
  disciplineKeySet,
  disciplineLabelByKey,
  disciplineLetterByKey,
  disciplineOptions,
  getElementDisplayName,
  getElementRelationshipTypeLabel,
  getElementRelationshipDisplayLabel,
  type DocumentNodeRow,
  type DocumentTypeRow,
  fallbackHierarchy,
  getCanonicalTypeName,
  getDisplayRelationType,
  getDisplayTypeName,
  getNormalizedDocumentSize,
  getRelationshipCategoryLabel,
  getRelationshipCategoryOptions,
  getRelationshipCategoryGroups,
  getDefaultRelationshipCategoryForMap,
  normalizeRelationshipCategoryForMap,
  getRelationshipDisciplineLetters,
  getTypeBannerStyle,
  groupingDefaultHeight,
  groupingDefaultWidth,
  groupingMinHeight,
  groupingMinHeightSquares,
  groupingMinWidth,
  groupingMinWidthSquares,
  hashString,
  isAbortLikeError,
  isOrgChartPersonElement,
  isPersonElementType,
  isLandscapeTypeName,
  laneHeight,
  landscapeDefaultHeight,
  landscapeDefaultWidth,
  lineIntersectsRect,
  majorGridSize,
  minorGridSize,
  type FlowData,
  normalizeTypeRanks,
  type NodeRelationRow,
  type OutlineItemRow,
  parseDisciplines,
  buildPersonHeading,
  parsePersonLabels,
  parseOrgChartPersonConfig,
  orgChartDepartmentOptions,
  parseProcessFlowId,
  processComponentBodyHeight,
  processComponentElementHeight,
  processComponentLabelHeight,
  processComponentWidth,
  processFlowId,
  processHeadingHeight,
  processHeadingWidth,
  processMinHeight,
  processMinHeightSquares,
  processMinWidth,
  processMinWidthSquares,
  type Rect,
  type RelationshipCategory,
  type SelectionMarquee,
  segmentsIntersect,
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
  systemCircleLabelHeight,
  tileGridSpan,
  type SystemMap,
  type MapMemberProfileRow,
  unconfiguredDocumentTitle,
  userGroupOptions,
  boxesOverlap,
  pointInRect,
  personIconSize,
  personRoleLabelHeight,
  personDepartmentLabelHeight,
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
import { SystemMapWelcomeModal } from "./SystemMapWelcomeModal";
import { defaultMapCategoryId, getAllowedNodeKindsForCategory, mapCategoryConfigs, type MapCategoryId } from "./mapCategories";
import { useCanvasRelationNodeActions } from "./useCanvasRelationNodeActions";
import { useCanvasElementActions } from "./useCanvasElementActions";
import { useCanvasDeleteSelectionActions } from "./useCanvasDeleteSelectionActions";
import { useCanvasMapInfoActions } from "./useCanvasMapInfoActions";
import { useCanvasOutlineActions } from "./useCanvasOutlineActions";
import { useCanvasPaneSelectionActions } from "./useCanvasPaneSelectionActions";
import { useCanvasNodeDragStop } from "./useCanvasNodeDragStop";
import { useCanvasRelationshipDerived } from "./useCanvasRelationshipDerived";
import { useCanvasImageUpload } from "./useCanvasImageUpload";
import { handleCanvasNodeClick } from "./canvasNodeClickHandler";
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
  normalizeElementRef,
  sortGroupingElementsForRender,
} from "./canvasFlowNodeBuilder";
import {
  PRINT_HEADER_HEIGHT_PX,
  buildPrintPreviewHtml,
  cropDataUrl,
  loadHtml2Canvas,
  loadHtmlToImage,
} from "./canvasPrintUtils";
import { SystemMapLoadingView } from "./SystemMapLoadingView";
const canvasElementSelectColumns =
  "id,map_id,element_type,heading,color_hex,created_by_user_id,element_config,pos_x,pos_y,width,height,created_at,updated_at";
const isMethodologyElementType = (elementType: string) =>
  elementType.startsWith("bowtie_") || elementType.startsWith("incident_");
const methodologyDefaultLabelByType: Record<string, string> = {
  bowtie_hazard: "Hazard",
  bowtie_top_event: "Top Event",
  bowtie_threat: "Threat",
  bowtie_consequence: "Consequence",
  bowtie_control: "Control",
  bowtie_escalation_factor: "Escalation Factor",
  bowtie_recovery_measure: "Recovery Measure",
  bowtie_degradation_indicator: "Degradation Indicator",
  bowtie_risk_rating: "Risk Level",
  incident_sequence_step: "Sequence Step",
  incident_outcome: "Outcome",
  incident_task_condition: "Task / Condition",
  incident_factor: "Factor",
  incident_system_factor: "System Factor",
  incident_control_barrier: "Control / Barrier",
  incident_evidence: "Evidence",
  incident_finding: "Finding",
  incident_recommendation: "Recommendation",
};
const isDescriptionDrivenMethodologyType = (elementType: string) =>
  isMethodologyElementType(elementType) && elementType !== "bowtie_risk_rating";

function buildMethodologyDraft(element: CanvasElementRow) {
  const currentConfig = ((element.element_config as Record<string, unknown> | null) ?? {}) as Record<string, string | boolean>;
  if (!isDescriptionDrivenMethodologyType(element.element_type)) return currentConfig;
  const defaultLabel = methodologyDefaultLabelByType[element.element_type] ?? "Node";
  const currentHeading = String(element.heading ?? "").trim();
  if (!currentHeading || currentHeading === defaultLabel) return currentConfig;
  return {
    ...currentConfig,
    description: currentHeading,
  };
}

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

type DocumentNodeInsertPayload = {
  map_id: string;
  type_id: string;
  title: string;
  document_number: string;
  discipline: string;
  owner_user_id: string | null;
  owner_name: string;
  user_group: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  is_archived: boolean;
};

const wizardGroupHeadingByStep: Record<string, string> = {
  sequence: "Sequence",
  people: "People",
  "task-condition": "Task / Condition",
  factors: "Factors",
  "control-barrier": "Controls / Barriers",
  evidence: "Evidence",
  finding: "Findings",
  recommendation: "Recommendations",
  systems: "Systems",
  processes: "Processes",
  documents: "Documents",
  hierarchy: "Hierarchy",
  overview: "Overview",
  threats: "Threats",
  consequences: "Consequences",
  controls: "Controls",
  assurance: "Escalation / Recovery",
  departments: "Departments",
  leadership: "Leadership",
  team: "Team",
  lanes: "Lanes",
  steps: "Steps",
  "inputs-outputs": "Inputs / Outputs",
  roles: "Roles",
};

const wizardElementTypesByStep: Record<string, string[]> = {
  sequence: ["incident_sequence_step"],
  people: ["person"],
  "task-condition": ["incident_task_condition"],
  factors: ["incident_factor", "incident_system_factor"],
  "control-barrier": ["incident_control_barrier"],
  evidence: ["incident_evidence"],
  finding: ["incident_finding"],
  recommendation: ["incident_recommendation"],
  systems: ["system_circle"],
  processes: ["process_component"],
  hierarchy: ["category"],
  overview: ["bowtie_hazard", "bowtie_top_event", "bowtie_risk_rating"],
  threats: ["bowtie_threat"],
  consequences: ["bowtie_consequence"],
  controls: ["bowtie_control"],
  assurance: ["bowtie_escalation_factor", "bowtie_recovery_measure", "bowtie_degradation_indicator"],
  departments: ["category"],
  leadership: ["person"],
  team: ["person"],
  lanes: ["category"],
  steps: ["process_component", "shape_rectangle", "shape_pill"],
  "inputs-outputs": ["shape_rectangle"],
  roles: ["person"],
};

function SystemMapCanvasInner({ mapId, showWelcomeOnLoad = false }: { mapId: string; showWelcomeOnLoad?: boolean }) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const relationshipPopupRef = useRef<HTMLDivElement | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const searchMenuRef = useRef<HTMLDivElement | null>(null);
  const printMenuRef = useRef<HTMLDivElement | null>(null);
  const printPreviewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const mapInfoAsideRef = useRef<HTMLDivElement | null>(null);
  const mapInfoButtonRef = useRef<HTMLButtonElement | null>(null);
  const disciplineMenuRef = useRef<HTMLDivElement | null>(null);
  const saveViewportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizePersistTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const resizePersistValuesRef = useRef<Map<string, { width: number; height: number }>>(new Map());
  const savedPos = useRef<Record<string, { x: number; y: number }>>({});
  const convertedMediaObjectUrlsRef = useRef<Set<string>>(new Set());
  const lastMobileTapRef = useRef<{ id: string; ts: number } | null>(null);
  const clipboardPasteCountRef = useRef(1);
  const isNodeDragActiveRef = useRef(false);
  const imagePathPairsRef = useRef<Array<{ id: string; path: string }>>([]);
  const loadingMapIdRef = useRef<string | null>(null);
  const loadingProgressRef = useRef<25 | 50 | 75 | 100>(25);
  const loadingStageStartedAtRef = useRef<number>(Date.now());

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [mapRole, setMapRole] = useState<"read" | "partial_write" | "full_write" | null>(null);
  const [map, setMap] = useState<SystemMap | null>(null);
  const [mapCategoryId, setMapCategoryId] = useState<MapCategoryId>(defaultMapCategoryId);
  const [types, setTypes] = useState<DocumentTypeRow[]>([]);
  const [nodes, setNodes] = useState<DocumentNodeRow[]>([]);
  const [elements, setElements] = useState<CanvasElementRow[]>([]);
  const [relations, setRelations] = useState<NodeRelationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(25);
  const [loadingMessage, setLoadingMessage] = useState("Checking workspace access...");
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
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

  const [rf, setRf] = useState<{
    fitView: (opts?: { duration?: number; padding?: number }) => void;
    screenToFlowPosition: (pt: { x: number; y: number }) => { x: number; y: number };
    setViewport: (v: Viewport, opts?: { duration?: number }) => void;
  } | null>(null);
  const [pendingViewport, setPendingViewport] = useState<Viewport | null>(null);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [canvasLocked, setCanvasLocked] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [wizardSaving, setWizardSaving] = useState(false);
  const [isNodeDragActive, setIsNodeDragActive] = useState(false);
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewImageDataUrl, setPrintPreviewImageDataUrl] = useState<string | null>(null);
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("portrait");
  const [printSelectionMode, setPrintSelectionMode] = useState(false);
  const [isCopyingPrintImage, setIsCopyingPrintImage] = useState(false);
  const [printSelectionCopyMessage, setPrintSelectionCopyMessage] = useState<string | null>(null);
  const [printSelectionDraft, setPrintSelectionDraft] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [printSelectionRect, setPrintSelectionRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [showPrintSelectionConfirm, setShowPrintSelectionConfirm] = useState(false);
  const printPreviewHtml = useMemo(
    () =>
      printPreviewImageDataUrl
        ? buildPrintPreviewHtml({
            mapTitle: map?.title || "System Map",
            imageDataUrl: printPreviewImageDataUrl,
            orientation: printOrientation,
          })
        : null,
    [map?.title, printOrientation, printPreviewImageDataUrl]
  );
  const [searchQuery, setSearchQuery] = useState("");
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
  const canWriteMap = mapRole === "partial_write" || mapRole === "full_write";
  const canManageMapMetadata = mapRole === "full_write" && !!map && !!userId && map.owner_id === userId;
  const canUseContextMenu = mapRole !== "read";
  const canCreateSticky = !!userId;
  const allowedNodeKinds = useMemo(() => getAllowedNodeKindsForCategory(mapCategoryId), [mapCategoryId]);
  const canUseWizard = canWriteMap;
  const addDisabledReason = canWriteMap || canCreateSticky ? undefined : "Adding components is unavailable for this map.";
  const wizardDisabledReason = canWriteMap ? undefined : "You need write access to use the wizard.";
  const canvasLockTitle = canvasLocked
    ? "Unlock canvas navigation and re-enable node interaction."
    : "Lock the canvas so you can pan around without selecting or moving nodes.";
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
  const relationshipCategoryGroups = useMemo(() => getRelationshipCategoryGroups(mapCategoryId), [mapCategoryId]);
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
  const formatStickyDate = useCallback((value: string | null | undefined) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);
  const memberDisplayNameByUserId = useMemo(() => {
    const m = new Map<string, string>();
    mapMembers.forEach((member) => {
      const label = member.full_name?.trim() || member.email?.trim() || member.user_id;
      if (label) m.set(member.user_id, label);
    });
    return m;
  }, [mapMembers]);
  const activePrintSelectionRect = useMemo(() => {
    if (printSelectionDraft) {
      const left = Math.min(printSelectionDraft.startX, printSelectionDraft.currentX);
      const top = Math.min(printSelectionDraft.startY, printSelectionDraft.currentY);
      const width = Math.abs(printSelectionDraft.currentX - printSelectionDraft.startX);
      const height = Math.abs(printSelectionDraft.currentY - printSelectionDraft.startY);
      return { left, top, width, height };
    }
    return printSelectionRect;
  }, [printSelectionDraft, printSelectionRect]);
  const loadingLabel = useMemo(() => {
    const mapCategory = map?.map_category as MapCategoryId | null | undefined;
    if (mapCategory && mapCategory in mapCategoryConfigs) {
      return mapCategoryConfigs[mapCategory].label;
    }
    return mapCategoryConfigs[mapCategoryId]?.label ?? "Map";
  }, [map?.map_category, mapCategoryId]);
  const backHref = useMemo(() => {
    const category = (map?.map_category as MapCategoryId | null | undefined) ?? mapCategoryId;
    if (category === "incident_investigation") return "/dashboard/map-builders";
    if (category === "document_map") return "/dashboard/map-builders";
    if (category === "bow_tie") return "/dashboard/map-builders";
    if (category === "org_chart") return "/dashboard/map-builders";
    if (category === "process_flow") return "/dashboard/map-builders";
    return "/dashboard";
  }, [map?.map_category, mapCategoryId]);
  const backLabel = useMemo(() => `Back to ${loadingLabel}`, [loadingLabel]);
  const exitPrintSelectionMode = useCallback(() => {
    setPrintSelectionMode(false);
    setPrintSelectionDraft(null);
    setPrintSelectionRect(null);
    setShowPrintSelectionConfirm(false);
    setPrintSelectionCopyMessage(null);
  }, []);
  const openPrintPreviewFromDataUrl = useCallback(
    (imageDataUrl: string) => {
      setPrintPreviewImageDataUrl(imageDataUrl);
      setShowPrintPreview(true);
    },
    []
  );
  const capturePrintImage = useCallback(
    async (mode: "current" | "area", options?: { openPreview?: boolean }) => {
      const root = canvasRef.current as HTMLElement | null;
      if (!root) {
        setError("Unable to capture canvas for print.");
        return null;
      }
      const target = (root.querySelector(".react-flow") as HTMLElement | null) ?? root;
      const targetBounds = target.getBoundingClientRect();
      const captureWidth = Math.max(1, Math.floor(target.clientWidth || targetBounds.width));
      const captureHeight = Math.max(1, Math.floor(target.clientHeight || targetBounds.height));
      let crop: { x: number; y: number; width: number; height: number } | null = null;
      if (mode === "area") {
        if (!printSelectionRect || printSelectionRect.width < 12 || printSelectionRect.height < 12) {
          setError("Please select a larger area to print.");
          return null;
        }
        const x = clamp(printSelectionRect.left - targetBounds.left, 0, targetBounds.width);
        const y = clamp(printSelectionRect.top - targetBounds.top, 0, targetBounds.height);
        const width = clamp(printSelectionRect.width, 1, targetBounds.width - x);
        const height = clamp(printSelectionRect.height, 1, targetBounds.height - y);
        crop = { x, y, width, height };
      } else {
        crop = { x: 0, y: 0, width: captureWidth, height: captureHeight };
      }
      setIsPreparingPrint(true);
      const previousTargetBackgroundColor = target.style.backgroundColor;
      target.style.backgroundColor = "#ffffff";
      try {
        let dataUrl = "";
        try {
          const htmlToImage = await loadHtmlToImage();
          const fullDataUrl = await htmlToImage.toPng(target, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: "#ffffff",
            width: captureWidth,
            height: captureHeight,
            filter: (node: Node) => {
              const el = node as unknown as HTMLElement;
              if (!el?.classList) return true;
              return !(
                el.classList.contains("react-flow__background") ||
                el.classList.contains("print-hidden") ||
                el.dataset?.printIgnore === "true"
              );
            },
          });
          dataUrl = crop
            ? await cropDataUrl({
                dataUrl: fullDataUrl,
                crop,
                sourceWidth: captureWidth,
                sourceHeight: captureHeight,
              })
            : fullDataUrl;
        } catch {
          const html2canvas = await loadHtml2Canvas();
          const canvas = await html2canvas(target, {
            backgroundColor: "#ffffff",
            useCORS: true,
            logging: false,
            scale: 2,
            x: crop?.x ?? 0,
            y: crop?.y ?? 0,
            width: crop?.width ?? captureWidth,
            height: crop?.height ?? captureHeight,
            ignoreElements: (element: Element) => {
              const el = element as HTMLElement;
              return (
                el.classList.contains("react-flow__background") ||
                el.classList.contains("print-hidden") ||
                el.dataset.printIgnore === "true"
              );
            },
          });
          dataUrl = canvas.toDataURL("image/png");
        }
        if (options?.openPreview !== false) {
          openPrintPreviewFromDataUrl(dataUrl);
        }
        return dataUrl;
      } catch (e) {
        setError((e as Error)?.message || "Unable to prepare print preview.");
        return null;
      } finally {
        target.style.backgroundColor = previousTargetBackgroundColor;
        setIsPreparingPrint(false);
      }
    },
    [openPrintPreviewFromDataUrl, printSelectionRect, setError]
  );
  const handlePrintCurrentView = useCallback(async () => {
    setShowPrintMenu(false);
    setShowPrintSelectionConfirm(false);
    setPrintSelectionMode(false);
    setPrintSelectionDraft(null);
    setPrintSelectionRect(null);
    await capturePrintImage("current");
  }, [capturePrintImage]);
  const handlePrintSelectArea = useCallback(() => {
    setShowPrintMenu(false);
    setShowPrintSelectionConfirm(false);
    setPrintSelectionDraft(null);
    setPrintSelectionRect(null);
    setPrintSelectionCopyMessage(null);
    setPrintSelectionMode(true);
  }, []);
  const handleConfirmPrintArea = useCallback(async () => {
    setPrintSelectionCopyMessage(null);
    setShowPrintSelectionConfirm(false);
    await capturePrintImage("area");
    setPrintSelectionMode(false);
  }, [capturePrintImage]);
  const handleCopyPrintAreaImageToClipboard = useCallback(async () => {
    setPrintSelectionCopyMessage(null);
    const dataUrl = await capturePrintImage("area", { openPreview: false });
    if (!dataUrl) return;
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      setPrintSelectionCopyMessage("Clipboard image copy is not supported in this browser.");
      return;
    }
    setIsCopyingPrintImage(true);
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
      setPrintSelectionCopyMessage("Image copied to clipboard. You can paste it elsewhere.");
    } catch (e) {
      const message = (e as Error)?.message?.trim();
      setPrintSelectionCopyMessage(message ? `Unable to copy image: ${message}` : "Unable to copy image to clipboard.");
    } finally {
      setIsCopyingPrintImage(false);
    }
  }, [capturePrintImage]);
  const handlePrintOverlayPointerDown = useCallback((event: { clientX: number; clientY: number }) => {
    if (showPrintSelectionConfirm) return;
    setPrintSelectionCopyMessage(null);
    setPrintSelectionDraft({
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
    });
  }, [showPrintSelectionConfirm]);
  const handlePrintOverlayPointerMove = useCallback((event: { clientX: number; clientY: number }) => {
    setPrintSelectionDraft((prev) =>
      prev
        ? {
            ...prev,
            currentX: event.clientX,
            currentY: event.clientY,
          }
        : prev
    );
  }, []);
  const handlePrintOverlayPointerUp = useCallback(() => {
    setPrintSelectionDraft((prev) => {
      if (!prev) return prev;
      const left = Math.min(prev.startX, prev.currentX);
      const top = Math.min(prev.startY, prev.currentY);
      const width = Math.abs(prev.currentX - prev.startX);
      const height = Math.abs(prev.currentY - prev.startY);
      if (width < 12 || height < 12) {
        setPrintSelectionRect(null);
        return null;
      }
      setPrintSelectionRect({ left, top, width, height });
      setShowPrintSelectionConfirm(true);
      return null;
    });
  }, []);

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

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedProcessComponentId, setSelectedProcessComponentId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedGroupingId, setSelectedGroupingId] = useState<string | null>(null);
  const [selectedStickyId, setSelectedStickyId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedFlowShapeId, setSelectedFlowShapeId] = useState<string | null>(null);
  const [selectedBowtieElementId, setSelectedBowtieElementId] = useState<string | null>(null);
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
  const [processComponentLabelDraft, setProcessComponentLabelDraft] = useState("");
  const [systemNameDraft, setSystemNameDraft] = useState("");
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
  const [groupingLabelDraft, setGroupingLabelDraft] = useState("");
  const [groupingWidthDraft, setGroupingWidthDraft] = useState<string>(String(Math.round(groupingDefaultWidth / minorGridSize)));
  const [groupingHeightDraft, setGroupingHeightDraft] = useState<string>(String(Math.round(groupingDefaultHeight / minorGridSize)));
  const [stickyTextDraft, setStickyTextDraft] = useState("");
  const [imageDescriptionDraft, setImageDescriptionDraft] = useState("");
  const [textBoxContentDraft, setTextBoxContentDraft] = useState("");
  const [textBoxBoldDraft, setTextBoxBoldDraft] = useState(false);
  const [textBoxItalicDraft, setTextBoxItalicDraft] = useState(false);
  const [textBoxUnderlineDraft, setTextBoxUnderlineDraft] = useState(false);
  const [textBoxAlignDraft, setTextBoxAlignDraft] = useState<"left" | "center" | "right">("left");
  const [textBoxFontSizeDraft, setTextBoxFontSizeDraft] = useState("24");
  const [tableRowsDraft, setTableRowsDraft] = useState("2");
  const [tableColumnsDraft, setTableColumnsDraft] = useState("2");
  const [tableHeaderBgDraft, setTableHeaderBgDraft] = useState("");
  const [tableHeaderFillModeDraft, setTableHeaderFillModeDraft] = useState<"fill" | "outline">("fill");
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
  const [flowShapeDirectionDraft, setFlowShapeDirectionDraft] = useState<"left" | "right">("right");
  const [flowShapeRotationDraft, setFlowShapeRotationDraft] = useState<0 | 90 | 180 | 270>(0);
  const hydratedFlowShapeDraftIdRef = useRef<string | null>(null);
  const [bowtieHeadingDraft, setBowtieHeadingDraft] = useState("");
  const [bowtieDraft, setBowtieDraft] = useState<Record<string, string | boolean>>({});
  const [imageUrlsByElementId, setImageUrlsByElementId] = useState<Record<string, string>>({});
  const [evidenceUploadFile, setEvidenceUploadFile] = useState<File | null>(null);
  const [evidenceUploadPreviewUrl, setEvidenceUploadPreviewUrl] = useState<string | null>(null);
  const methodologyMigrationInFlightRef = useRef(false);

  const [desktopNodeAction, setDesktopNodeAction] = useState<"relationship" | "structure" | "delete" | null>(null);
  const [mobileNodeMenuId, setMobileNodeMenuId] = useState<string | null>(null);
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
  const [relationshipCategory, setRelationshipCategory] = useState<RelationshipCategory>(getDefaultRelationshipCategoryForMap(defaultMapCategoryId));
  const [relationshipCustomType, setRelationshipCustomType] = useState("");
  const [editingRelationId, setEditingRelationId] = useState<string | null>(null);
  const [editingRelationDescription, setEditingRelationDescription] = useState("");
  const [editingRelationCategory, setEditingRelationCategory] = useState<RelationshipCategory>(getDefaultRelationshipCategoryForMap(defaultMapCategoryId));
  const [editingRelationCustomType, setEditingRelationCustomType] = useState("");
  const [editingRelationDisciplines, setEditingRelationDisciplines] = useState<DisciplineKey[]>([]);
  const [showEditingRelationDisciplineMenu, setShowEditingRelationDisciplineMenu] = useState(false);
  useEffect(() => {
    setRelationshipCategory((prev) => normalizeRelationshipCategoryForMap(prev, mapCategoryId));
    setEditingRelationCategory((prev) => normalizeRelationshipCategoryForMap(prev, mapCategoryId));
  }, [mapCategoryId]);
  const [confirmDeleteNodeId, setConfirmDeleteNodeId] = useState<string | null>(null);
  const [outlineNodeId, setOutlineNodeId] = useState<string | null>(null);
  const [outlineItems, setOutlineItems] = useState<OutlineItemRow[]>([]);
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
  const hoveredNodeFrameRef = useRef<number | null>(null);
  const queuedHoveredNodeRef = useRef<string | null>(null);
  const hoveredEdgeFrameRef = useRef<number | null>(null);
  const queuedHoveredEdgeRef = useRef<string | null>(null);
  const [copiedFlowIds, setCopiedFlowIds] = useState<string[]>([]);
  const [selectionMarquee, setSelectionMarquee] = useState<SelectionMarquee>({
    active: false,
    startClientX: 0,
    startClientY: 0,
    currentClientX: 0,
    currentClientY: 0,
  });
  const [showDeleteSelectionConfirm, setShowDeleteSelectionConfirm] = useState(false);
  const [leftAsideSlideIn, setLeftAsideSlideIn] = useState(false);
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
    return () => {
      convertedMediaObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      convertedMediaObjectUrlsRef.current.clear();
    };
  }, []);
  const normalizePreviewHex = useCallback((value: string | null | undefined): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return null;
    return trimmed.toUpperCase();
  }, []);
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
    const persistedHeading = isArrow ? "" : selectedShape.heading ?? "Shape text";
    const persistedAlignRaw = String(cfg.align ?? "center");
    const persistedAlign = persistedAlignRaw === "left" || persistedAlignRaw === "right" ? persistedAlignRaw : "center";
    const persistedFontSizeRaw = Number(cfg.font_size ?? 24);
    const persistedFontSize = Number.isFinite(persistedFontSizeRaw) ? Math.max(12, Math.min(168, Math.round(persistedFontSizeRaw))) : 24;
    const draftFontSizeRaw = Number(flowShapeFontSizeDraft.trim());
    const draftFontSize = Number.isFinite(draftFontSizeRaw) ? Math.max(12, Math.min(168, Math.round(draftFontSizeRaw))) : 24;
    const persistedColor = normalizePreviewHex(selectedShape.color_hex ?? shapeDefaultFillColor) ?? shapeDefaultFillColor;
    const draftColor = normalizePreviewHex(flowShapeColorDraft) ?? persistedColor;
    const persistedFillMode = String(cfg.fill_mode ?? "fill") === "outline" ? "outline" : "fill";
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
    flowShapeDirectionDraft,
    flowShapeRotationDraft,
    shapeDefaultFillColor,
    normalizePreviewHex,
  ]);
  const hasUnsavedDocumentDraftChanges = useMemo(() => {
    if (!selectedNodeId) return false;
    const current = nodes.find((n) => n.id === selectedNodeId);
    if (!current) return false;
    return (
      selectedTypeId !== current.type_id ||
      title !== (current.title ?? "Untitled Document") ||
      documentNumber !== (current.document_number ?? "") ||
      disciplineSelection.join("|") !== parseDisciplines(current.discipline).join("|") ||
      userGroup !== (current.user_group ?? "") ||
      ownerName !== (current.owner_name ?? "")
    );
  }, [selectedNodeId, nodes, selectedTypeId, title, documentNumber, disciplineSelection, userGroup, ownerName]);
  const hasUnsavedProcessDraftChanges = useMemo(() => {
    if (!selectedProcessId) return false;
    const current = elements.find((el) => el.id === selectedProcessId && el.element_type === "category");
    if (!current) return false;
    const widthSquares = Number(processWidthDraft.trim());
    const heightSquares = Number(processHeightDraft.trim());
    const hasValidSize =
      Number.isInteger(widthSquares) &&
      Number.isInteger(heightSquares) &&
      widthSquares >= processMinWidthSquares &&
      heightSquares >= processMinHeightSquares;
    return (
      processHeadingDraft !== (current.heading ?? "New Category") ||
      (hasValidSize &&
        (processWidthDraft !== String(Math.round(Math.max(processMinWidth, Number(current.width ?? processHeadingWidth)) / minorGridSize)) ||
          processHeightDraft !== String(Math.round(Math.max(processMinHeight, Number(current.height ?? processHeadingHeight)) / minorGridSize)))) ||
      (processColorDraft ?? "") !== (current.color_hex ?? "")
    );
  }, [selectedProcessId, elements, processHeadingDraft, processWidthDraft, processHeightDraft, processColorDraft, processMinWidthSquares, processMinHeightSquares, processMinWidth, processHeadingWidth, minorGridSize, processMinHeight, processHeadingHeight]);
  const hasUnsavedSystemDraftChanges = useMemo(() => {
    if (!selectedSystemId) return false;
    const current = elements.find((el) => el.id === selectedSystemId && el.element_type === "system_circle");
    return current ? systemNameDraft !== (current.heading ?? "System Name") : false;
  }, [selectedSystemId, elements, systemNameDraft]);
  const hasUnsavedProcessComponentDraftChanges = useMemo(() => {
    if (!selectedProcessComponentId) return false;
    const current = elements.find((el) => el.id === selectedProcessComponentId && el.element_type === "process_component");
    return current ? processComponentLabelDraft !== (current.heading ?? "Process") : false;
  }, [selectedProcessComponentId, elements, processComponentLabelDraft]);
  const hasUnsavedPersonDraftChanges = useMemo(() => {
    if (!selectedPersonId) return false;
    const current = elements.find((el) => el.id === selectedPersonId && isPersonElementType(el.element_type));
    if (!current) return false;
    const currentConfig = parseOrgChartPersonConfig(current.element_config);
    if (!isOrgChartPersonElement(current)) {
      return buildPersonHeading(personRoleDraft, personDepartmentDraft) !== (current.heading ?? buildPersonHeading("", ""));
    }
    return (
      personRoleDraft !== String(currentConfig.position_title ?? "Position Title") ||
      personRoleIdDraft !== String(currentConfig.role_id ?? "") ||
      personDepartmentDraft !== String(currentConfig.department ?? "") ||
      personOccupantNameDraft !== String(currentConfig.occupant_name ?? "") ||
      personStartDateDraft !== String(currentConfig.start_date ?? "") ||
      personEmploymentTypeDraft !== (String(currentConfig.employment_type ?? "fte") === "contractor" ? "contractor" : "fte") ||
      personActingNameDraft !== String(currentConfig.acting_name ?? "") ||
      personActingStartDateDraft !== String(currentConfig.acting_start_date ?? "") ||
      personRecruitingDraft !== Boolean(currentConfig.recruiting) ||
      personProposedRoleDraft !== Boolean(currentConfig.proposed_role)
    );
  }, [
    selectedPersonId,
    elements,
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
  ]);
  const hasUnsavedGroupingDraftChanges = useMemo(() => {
    if (!selectedGroupingId) return false;
    const current = elements.find((el) => el.id === selectedGroupingId && el.element_type === "grouping_container");
    if (!current) return false;
    const widthSquares = Number(groupingWidthDraft.trim());
    const heightSquares = Number(groupingHeightDraft.trim());
    const hasValidSize =
      Number.isInteger(widthSquares) &&
      Number.isInteger(heightSquares) &&
      widthSquares >= groupingMinWidthSquares &&
      heightSquares >= groupingMinHeightSquares;
    return (
      groupingLabelDraft !== (current.heading ?? "Group label") ||
      (hasValidSize &&
        (groupingWidthDraft !== String(Math.round(Math.max(groupingMinWidth, Number(current.width ?? groupingDefaultWidth)) / minorGridSize)) ||
          groupingHeightDraft !== String(Math.round(Math.max(groupingMinHeight, Number(current.height ?? groupingDefaultHeight)) / minorGridSize))))
    );
  }, [selectedGroupingId, elements, groupingLabelDraft, groupingWidthDraft, groupingHeightDraft, groupingMinWidthSquares, groupingMinHeightSquares, groupingMinWidth, groupingDefaultWidth, minorGridSize, groupingMinHeight, groupingDefaultHeight]);
  const hasUnsavedStickyDraftChanges = useMemo(() => {
    if (!selectedStickyId) return false;
    const current = elements.find((el) => el.id === selectedStickyId && el.element_type === "sticky_note");
    return current ? stickyTextDraft !== (current.heading ?? "Enter Text") : false;
  }, [selectedStickyId, elements, stickyTextDraft]);
  const hasUnsavedImageDraftChanges = useMemo(() => {
    if (!selectedImageId) return false;
    const current = elements.find((el) => el.id === selectedImageId && el.element_type === "image_asset");
    if (!current) return false;
    const currentConfig = (current.element_config as Record<string, unknown> | null) ?? {};
    return imageDescriptionDraft !== String(currentConfig.description ?? "");
  }, [selectedImageId, elements, imageDescriptionDraft]);
  const hasUnsavedTextBoxDraftChanges = useMemo(() => {
    if (!selectedTextBoxId) return false;
    const current = elements.find((el) => el.id === selectedTextBoxId && el.element_type === "text_box");
    if (!current) return false;
    const cfg = (current.element_config as Record<string, unknown> | null) ?? {};
    const persistedAlignRaw = String(cfg.align ?? "left");
    const persistedAlign = persistedAlignRaw === "center" || persistedAlignRaw === "right" ? persistedAlignRaw : "left";
    const persistedFontSizeRaw = Number(cfg.font_size ?? 16);
    const persistedFontSize = Number.isFinite(persistedFontSizeRaw) ? Math.max(16, Math.min(168, Math.round(persistedFontSizeRaw))) : 16;
    const draftFontSizeRaw = Number(textBoxFontSizeDraft.trim());
    const draftFontSize = Number.isFinite(draftFontSizeRaw) ? Math.max(16, Math.min(168, Math.round(draftFontSizeRaw))) : 16;
    return (
      textBoxContentDraft !== (current.heading ?? "Click to edit text box") ||
      textBoxBoldDraft !== Boolean(cfg.bold) ||
      textBoxItalicDraft !== Boolean(cfg.italic) ||
      textBoxUnderlineDraft !== Boolean(cfg.underline) ||
      textBoxAlignDraft !== persistedAlign ||
      draftFontSize !== persistedFontSize
    );
  }, [selectedTextBoxId, elements, textBoxContentDraft, textBoxBoldDraft, textBoxItalicDraft, textBoxUnderlineDraft, textBoxAlignDraft, textBoxFontSizeDraft]);
  const hasUnsavedTableDraftChanges = useMemo(() => {
    if (!selectedTableId) return false;
    const current = elements.find((el) => el.id === selectedTableId && el.element_type === "table");
    if (!current) return false;
    const cfg = (current.element_config as Record<string, unknown> | null) ?? {};
    const persistedRowsRaw = Number(cfg.rows ?? tableMinRows);
    const persistedColumnsRaw = Number(cfg.columns ?? tableMinColumns);
    const persistedRows = Number.isFinite(persistedRowsRaw) ? Math.max(tableMinRows, Math.floor(persistedRowsRaw)) : tableMinRows;
    const persistedColumns = Number.isFinite(persistedColumnsRaw) ? Math.max(tableMinColumns, Math.floor(persistedColumnsRaw)) : tableMinColumns;
    const persistedHeaderBg = typeof cfg.header_bg_color === "string" ? cfg.header_bg_color.toUpperCase() : "";
    const persistedHeaderFillMode = String(cfg.header_fill_mode ?? "fill") === "outline" ? "outline" : "fill";
    const persistedAlignRaw = String(cfg.align ?? "center");
    const persistedAlign = persistedAlignRaw === "left" || persistedAlignRaw === "right" ? persistedAlignRaw : "center";
    const persistedFontSizeRaw = Number(cfg.font_size ?? 10);
    const persistedFontSize = Number.isFinite(persistedFontSizeRaw) ? Math.max(10, Math.min(72, Math.round(persistedFontSizeRaw))) : 10;
    const draftFontSizeRaw = Number(tableFontSizeDraft.trim());
    const draftFontSize = Number.isFinite(draftFontSizeRaw) ? Math.max(10, Math.min(72, Math.round(draftFontSizeRaw))) : 10;
    return (
      tableRowsDraft !== String(persistedRows) ||
      tableColumnsDraft !== String(persistedColumns) ||
      tableHeaderBgDraft !== persistedHeaderBg ||
      tableHeaderFillModeDraft !== persistedHeaderFillMode ||
      tableBoldDraft !== Boolean(cfg.bold) ||
      tableItalicDraft !== Boolean(cfg.italic) ||
      tableUnderlineDraft !== Boolean(cfg.underline) ||
      tableAlignDraft !== persistedAlign ||
      draftFontSize !== persistedFontSize
    );
  }, [selectedTableId, elements, tableMinRows, tableMinColumns, tableRowsDraft, tableColumnsDraft, tableHeaderBgDraft, tableHeaderFillModeDraft, tableBoldDraft, tableItalicDraft, tableUnderlineDraft, tableAlignDraft, tableFontSizeDraft]);
  const hasUnsavedBowtieDraftChanges = useMemo(() => {
    if (!selectedBowtieElementId) return false;
    const current = elements.find((el) => el.id === selectedBowtieElementId && isMethodologyElementType(el.element_type));
    if (!current) return false;
    const currentConfig = buildMethodologyDraft(current);
    return (
      JSON.stringify(bowtieDraft) !== JSON.stringify(currentConfig) ||
      !!evidenceUploadFile
    );
  }, [selectedBowtieElementId, elements, bowtieDraft, evidenceUploadFile]);
  const canvasPreviewElements = useMemo(() => {
    if (!selectedProcessId && !selectedTextBoxId && !selectedTableId && !selectedFlowShapeId) return elements;
    let changed = false;
    const next = elements.map((el) => {
      if (selectedProcessId && el.id === selectedProcessId && el.element_type === "category") {
        changed = true;
        return {
          ...el,
          heading: processHeadingDraft,
          color_hex: processColorDraft ? normalizePreviewHex(processColorDraft) : el.color_hex,
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
            header_fill_mode: tableHeaderFillModeDraft,
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
    selectedTextBoxId,
    selectedTableId,
    selectedFlowShapeId,
    processHeadingDraft,
    processColorDraft,
    textBoxContentDraft,
    textBoxBoldDraft,
    textBoxItalicDraft,
    textBoxUnderlineDraft,
    textBoxAlignDraft,
    textBoxFontSizeDraft,
    tableRowsDraft,
    tableColumnsDraft,
    tableHeaderBgDraft,
    tableHeaderFillModeDraft,
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
    flowShapeDirectionDraft,
    flowShapeRotationDraft,
    shapeArrowDefaultWidth,
    shapeArrowDefaultHeight,
    shapeArrowMinWidth,
    shapeArrowMinHeight,
    tableMinRows,
    tableMinColumns,
    tableMinWidth,
    tableMinHeight,
    tableDefaultWidth,
    tableDefaultHeight,
    shapeMinWidth,
    shapeMinHeight,
    normalizePreviewHex,
  ]);

  const typesById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);
  const elementsById = useMemo(() => new Map(elements.map((el) => [el.id, el])), [elements]);
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

  const ranks = useMemo(() => {
    const values = new Set<number>();
    nodes.forEach((n) => {
      const t = typesById.get(n.type_id);
      if (t) values.add(t.level_rank);
    });
    if (!values.size) types.forEach((t) => values.add(t.level_rank));
    return [...values].sort((a, b) => a - b);
  }, [nodes, types, typesById]);

  const rankLane = useMemo(() => {
    const m = new Map<number, { min: number; max: number }>();
    ranks.forEach((rank, i) => {
      m.set(rank, { min: i * laneHeight + 20, max: i * laneHeight + laneHeight - 20 });
    });
    return m;
  }, [ranks]);

  const getClampRange = useCallback((typeId: string) => {
    const t = typesById.get(typeId);
    if (!t) return { min: 0, max: 3000 };
    if (t.band_y_min !== null || t.band_y_max !== null) {
      return { min: t.band_y_min ?? 0, max: t.band_y_max ?? 3000 };
    }
    return rankLane.get(t.level_rank) ?? { min: 0, max: 3000 };
  }, [typesById, rankLane]);
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
  const getFlowNodeBounds = useCallback((flowId: string) => {
    if (flowId.startsWith("process:")) {
      const elementId = parseProcessFlowId(flowId);
      const el = canvasPreviewElements.find((item) => item.id === elementId);
      if (!el) return null;
      if (el.element_type === "grouping_container") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(groupingMinWidth, el.width || groupingDefaultWidth),
          height: Math.max(groupingMinHeight, el.height || groupingDefaultHeight),
        };
      }
      if (el.element_type === "system_circle") {
        return { x: el.pos_x, y: el.pos_y, width: systemCircleDiameter, height: systemCircleElementHeight };
      }
      if (el.element_type === "process_component") {
        return { x: el.pos_x, y: el.pos_y, width: processComponentWidth, height: processComponentElementHeight };
      }
      if (isPersonElementType(el.element_type)) {
        const width = isOrgChartPersonElement(el) ? orgChartPersonWidth : personElementWidth;
        const height = isOrgChartPersonElement(el) ? orgChartPersonHeight : personElementHeight;
        return { x: el.pos_x, y: el.pos_y, width, height };
      }
      if (el.element_type === "sticky_note") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(stickyMinSize, el.width || stickyDefaultSize),
          height: Math.max(stickyMinSize, el.height || stickyDefaultSize),
        };
      }
      if (el.element_type === "image_asset") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(imageMinWidth, el.width || imageDefaultWidth),
          height: Math.max(imageMinHeight, el.height || imageDefaultWidth),
        };
      }
      if (el.element_type === "text_box") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(textBoxMinWidth, el.width || textBoxDefaultWidth),
          height: Math.max(textBoxMinHeight, el.height || textBoxDefaultHeight),
        };
      }
      if (el.element_type === "table") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(tableMinWidth, el.width || tableDefaultWidth),
          height: Math.max(tableMinHeight, el.height || tableDefaultHeight),
        };
      }
      if (el.element_type === "shape_rectangle") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeMinWidth, el.width || shapeRectangleDefaultWidth),
          height: Math.max(shapeMinHeight, el.height || shapeRectangleDefaultHeight),
        };
      }
      if (el.element_type === "shape_circle") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeMinWidth, el.width || shapeCircleDefaultSize),
          height: Math.max(shapeMinHeight, el.height || shapeCircleDefaultSize),
        };
      }
      if (el.element_type === "shape_pill") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeMinWidth, el.width || shapePillDefaultWidth),
          height: Math.max(shapeMinHeight, el.height || shapePillDefaultHeight),
        };
      }
      if (el.element_type === "shape_pentagon") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeMinWidth, el.width || shapePentagonDefaultWidth),
          height: Math.max(shapeMinHeight, el.height || shapePentagonDefaultHeight),
        };
      }
      if (el.element_type === "shape_chevron_left") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeMinWidth, el.width || shapePentagonDefaultWidth),
          height: Math.max(shapeMinHeight, el.height || shapePentagonDefaultHeight),
        };
      }
      if (el.element_type === "shape_arrow") {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(shapeArrowMinWidth, el.width || shapeArrowDefaultWidth),
          height: Math.max(shapeArrowMinHeight, el.height || shapeArrowDefaultHeight),
        };
      }
      if (isMethodologyElementType(el.element_type)) {
        return {
          x: el.pos_x,
          y: el.pos_y,
          width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
          height: Math.max(minorGridSize, el.height || incidentSquareSize),
        };
      }
      return {
        x: el.pos_x,
        y: el.pos_y,
        width: Math.max(processMinWidth, el.width || processHeadingWidth),
        height: Math.max(processMinHeight, el.height || processHeadingHeight),
      };
    }
    const node = nodes.find((n) => n.id === flowId);
    if (!node) return null;
    const size = getNodeSize(node);
    return { x: node.pos_x, y: node.pos_y, width: size.width, height: size.height };
  }, [canvasPreviewElements, nodes, getNodeSize, mapCategoryId, minorGridSize, orgChartPersonHeight, orgChartPersonWidth, personElementHeight, personElementWidth, shapeArrowDefaultHeight, shapeArrowDefaultWidth, shapeArrowMinHeight, shapeArrowMinWidth, shapeCircleDefaultSize, shapeMinHeight, shapeMinWidth, shapePentagonDefaultHeight, shapePentagonDefaultWidth, shapePillDefaultHeight, shapePillDefaultWidth, shapeRectangleDefaultHeight, shapeRectangleDefaultWidth, tableDefaultWidth, tableDefaultHeight, tableMinWidth, tableMinHeight]);

  const [flowNodes, setFlowNodes, onFlowNodesChange] = useNodesState<Node<FlowData>>([]);
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
      if (hoveredNodeFrameRef.current !== null) cancelAnimationFrame(hoveredNodeFrameRef.current);
      if (hoveredEdgeFrameRef.current !== null) cancelAnimationFrame(hoveredEdgeFrameRef.current);
    };
  }, []);
  const handleFlowNodesChange = useCallback((changes: NodeChange<Node<FlowData>>[]) => {
    onFlowNodesChange(changes);
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
  }, [onFlowNodesChange, elementsById, elements, mapId, snapToMinorGrid, canEditElement, selectedFlowShapeId, hasUnsavedFlowShapeDraftChanges, tableDefaultWidth, tableDefaultHeight, tableMinWidth, tableMinHeight]);

  useEffect(() => {
    return () => {
      resizePersistTimersRef.current.forEach((timer) => clearTimeout(timer));
      resizePersistTimersRef.current.clear();
      resizePersistValuesRef.current.clear();
    };
  }, []);

  const handleTableCellCommit = useCallback(
    async (elementId: string, rowIndex: number, columnIndex: number, value: string) => {
      const current = elements.find((el) => el.id === elementId && el.element_type === "table");
      if (!current || !canEditElement(current)) return;
      const cfg = (current.element_config as Record<string, unknown> | null) ?? {};
      const existingRows = Array.isArray(cfg.cell_texts)
        ? (cfg.cell_texts as unknown[]).map((row) => (Array.isArray(row) ? row.map((cell) => (cell == null ? "" : String(cell))) : []))
        : [];
      while (existingRows.length <= rowIndex) existingRows.push([]);
      while (existingRows[rowIndex].length <= columnIndex) existingRows[rowIndex].push("");
      existingRows[rowIndex][columnIndex] = value;
      const nextConfig = {
        ...cfg,
        cell_texts: existingRows,
      };
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, element_config: nextConfig } : el))
      );
      if (!canWriteMap) return;
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("canvas_elements")
        .update({ element_config: nextConfig })
        .eq("id", elementId)
        .eq("map_id", mapId);
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
        existingRows[rowIndex][columnIndex] = {
          ...existingRows[rowIndex][columnIndex],
          bold: Boolean(style.bold),
          italic: Boolean(style.italic),
          underline: Boolean(style.underline),
          align,
          v_align: vAlign,
          font_size: fontSize,
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

  useEffect(() => {
    if (isNodeDragActiveRef.current) return;
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
    const nextNodes: Node<FlowData>[] = [
        ...buildGroupingFlowNodes({
          groupingElements,
          selectedFlowIds,
          canWriteMap,
          canEditElement,
        }),
        ...buildDocumentFlowNodes({
          nodes,
          typesById,
          selectedFlowIds,
          canWriteMap,
          getNodeSize,
          unconfiguredDocumentTitle,
        }),
        ...canvasPreviewElements.map((el) => {
          const primaryElementNode = buildPrimaryElementFlowNode({
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
            onTableCellCommit: handleTableCellCommit,
            onTableCellStyleCommit: handleTableCellStyleCommit,
            onToggleIncidentDetail: handleToggleIncidentDetail,
          });
          if (primaryElementNode !== undefined) return primaryElementNode;
          return buildSecondaryElementFlowNode({
            element: el,
            selectedFlowIds,
            canEditElement,
            canWriteMap,
            imageUrlsByElementId,
            onOpenEvidenceMedia: handleOpenEvidenceMediaOverlay,
            onToggleIncidentDetail: handleToggleIncidentDetail,
          });
        }).filter(Boolean) as Node<FlowData>[],
      ];
    setFlowNodes(nextNodes);
  }, [nodes, canvasPreviewElements, relations, typesById, setFlowNodes, getNodeSize, selectedFlowIds, selectedTableId, canWriteMap, canEditElement, selectedFlowShapeId, hasUnsavedFlowShapeDraftChanges, mapCategoryId, memberDisplayNameByUserId, userEmail, userId, formatStickyDate, imageUrlsByElementId, isNodeDragActive, handleTableCellCommit, handleTableCellStyleCommit, handleOpenEvidenceMediaOverlay, handleToggleIncidentDetail]);

  useEffect(() => {
    if (isNodeDragActiveRef.current) return;
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

    const highlightedFlowNodeIds = new Set<string>();
    relations.forEach((rel) => {
      const isConnected = hoveredEdgeId ? rel.id === hoveredEdgeId : isRelationConnectedToHovered(rel);
      if (!isConnected) return;
      if (rel.from_node_id) highlightedFlowNodeIds.add(rel.from_node_id);
      if (rel.to_node_id) highlightedFlowNodeIds.add(rel.to_node_id);
      if (rel.source_system_element_id) highlightedFlowNodeIds.add(processFlowId(rel.source_system_element_id));
      if (rel.target_system_element_id) highlightedFlowNodeIds.add(processFlowId(rel.target_system_element_id));
      if (rel.source_grouping_element_id) highlightedFlowNodeIds.add(processFlowId(rel.source_grouping_element_id));
      if (rel.target_grouping_element_id) highlightedFlowNodeIds.add(processFlowId(rel.target_grouping_element_id));
    });

    setFlowNodes((prev) =>
      prev.map((node) => {
        const classTokens = (node.className || "")
          .split(/\s+/)
          .filter(Boolean)
          .filter((token) => token !== "rf-hover-related-document");
        const isDocumentNode = node.data?.entityKind === "document";
        const shouldHighlight = highlightedFlowNodeIds.has(node.id) && !node.selected && isDocumentNode;
        if (shouldHighlight) classTokens.push("rf-hover-related-document");
        const nextClassName = classTokens.join(" ");
        if ((node.className || "") === nextClassName) return node;
        return { ...node, className: nextClassName };
      })
    );
  }, [hoveredNodeId, hoveredEdgeId, relations, setFlowNodes, isNodeDragActive]);

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
  }, [flowEdgesBase, relationById, hoveredNodeId, hoveredEdgeId, relations]);
  const interactionFlowNodes = useMemo(
    () =>
      canvasLocked
        ? flowNodes.map((node) => ({
            ...node,
            draggable: false,
            selectable: false,
            selected: false,
            className: `${node.className ?? ""} pointer-events-none`.trim(),
          }))
        : flowNodes,
    [canvasLocked, flowNodes]
  );

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
    () => (selectedPersonId ? elements.find((el) => el.id === selectedPersonId && isPersonElementType(el.element_type)) ?? null : null),
    [selectedPersonId, elements]
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
  const activePrimaryLeftAsideKey = useMemo(() => {
    if (isMobile) return null;
    if (selectedSticky) return `sticky:${selectedSticky.id}`;
    if (selectedImage) return `image:${selectedImage.id}`;
    if (selectedTextBox) return `textbox:${selectedTextBox.id}`;
    if (selectedTable) return `table:${selectedTable.id}`;
    if (selectedFlowShape) return `shape:${selectedFlowShape.id}`;
    if (selectedProcess) return `category:${selectedProcess.id}`;
    if (selectedSystem) return `system:${selectedSystem.id}`;
    if (selectedProcessComponent) return `process:${selectedProcessComponent.id}`;
    if (selectedPerson) return `person:${selectedPerson.id}`;
    if (selectedBowtieElement) return `bowtie:${selectedBowtieElement.id}`;
    if (selectedGrouping) return `grouping:${selectedGrouping.id}`;
    if (selectedNode) return `document:${selectedNode.id}`;
    return null;
  }, [isMobile, selectedSticky, selectedImage, selectedTextBox, selectedTable, selectedFlowShape, selectedProcess, selectedSystem, selectedProcessComponent, selectedPerson, selectedBowtieElement, selectedGrouping, selectedNode]);
  const shouldShowDesktopStructurePanel =
    !isMobile && !!selectedNodeId && desktopNodeAction === "structure" && !!outlineNodeId && outlineNodeId === selectedNodeId;
  const searchCatalog = useMemo(() => {
    const nodeEntries = nodes.map((node) => {
      const t = typesById.get(node.type_id);
      const isLandscape = isLandscapeTypeName(t?.name || "");
      const size = getNormalizedDocumentSize(isLandscape, node.width, node.height);
      return {
        id: node.id,
        label: node.title,
        documentNumber: node.document_number ?? null,
        kind: "Document",
        x: node.pos_x,
        y: node.pos_y,
        width: size.width,
        height: size.height,
      };
    });
    const elementEntries = elements.map((el) => ({
      id: `process:${el.id}`,
      label: el.heading || getElementRelationshipTypeLabel(el.element_type),
      documentNumber: null,
      kind: getElementRelationshipTypeLabel(el.element_type),
      x: el.pos_x,
      y: el.pos_y,
      width: el.width,
      height: el.height,
    }));
    return [...nodeEntries, ...elementEntries];
  }, [nodes, elements, typesById]);
  const searchResults = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return [];
    return searchCatalog
      .filter((item) =>
        item.label.toLowerCase().includes(term) ||
        (item.documentNumber ?? "").toLowerCase().includes(term) ||
        item.kind.toLowerCase().includes(term)
      )
      .slice(0, 100)
      .map((item) => ({
        id: item.id,
        label: item.label,
        documentNumber: item.documentNumber,
        kind: item.kind,
      }));
  }, [searchCatalog, searchQuery]);
  const handleSelectSearchResult = useCallback((id: string) => {
    if (!rf) return;
    const match = searchCatalog.find((entry) => entry.id === id);
    if (!match) return;
    const centerX = match.x + match.width / 2;
    const centerY = match.y + match.height / 2;
    const viewportWidth = canvasRef.current?.clientWidth ?? window.innerWidth;
    const viewportHeight = canvasRef.current?.clientHeight ?? window.innerHeight;
    const zoom = 1.6;
    rf.setViewport(
      {
        x: viewportWidth / 2 - centerX * zoom,
        y: viewportHeight / 2 - centerY * zoom,
        zoom,
      },
      { duration: 320 }
    );
    setShowSearchMenu(false);
    setSearchQuery("");
  }, [rf, searchCatalog]);

  useEffect(() => {
    if (!activePrimaryLeftAsideKey) {
      setLeftAsideSlideIn(false);
      return;
    }
    setLeftAsideSlideIn(false);
    const raf = requestAnimationFrame(() => setLeftAsideSlideIn(true));
    return () => cancelAnimationFrame(raf);
  }, [activePrimaryLeftAsideKey]);

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
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    if (loadingMapIdRef.current !== mapId) {
      loadingMapIdRef.current = mapId;
      loadingProgressRef.current = 25;
      loadingStageStartedAtRef.current = Date.now();
      setLoadingProgress(25);
      setLoadingMessage("Checking workspace access...");
    }

    const run = async (attempt: number) => {
      const waitForStageFloor = async () => {
        const elapsed = Date.now() - loadingStageStartedAtRef.current;
        const remaining = 500 - elapsed;
        if (remaining > 0) {
          await new Promise<void>((resolve) => {
            retryTimer = setTimeout(() => resolve(), remaining);
          });
        }
      };
      const setLoadingStage = async (progress: number, message: string) => {
        if (cancelled) return;
        const nextProgress = Math.max(loadingProgressRef.current, progress) as 25 | 50 | 75 | 100;
        if (nextProgress <= loadingProgressRef.current) return;
        await waitForStageFloor();
        if (cancelled) return;
        loadingProgressRef.current = nextProgress;
        loadingStageStartedAtRef.current = Date.now();
        setLoadingProgress(nextProgress);
        setLoadingMessage(message);
      };
      let shouldRetry = false;
      let loadCompleted = false;

      if (cancelled) return;
      if (attempt === 0) {
        setLoading(true);
        setError(null);
        loadingProgressRef.current = Math.max(25, loadingProgressRef.current) as 25 | 50 | 75 | 100;
        setLoadingProgress(loadingProgressRef.current);
        setLoadingMessage(
          loadingProgressRef.current >= 100
            ? "Straightening lines and sharpening pencils..."
            : loadingProgressRef.current >= 75
            ? "Gathering collaborators and lining up the map pieces..."
            : loadingProgressRef.current >= 50
            ? "Loading map shell, nodes, and canvas data..."
            : "Checking workspace access..."
        );
      }
      try {
        const user = await ensurePortalSupabaseUser();
        if (cancelled) return;
        if (!user) {
          window.location.assign(`/login?returnTo=${encodeURIComponent(`/system-maps/${mapId}`)}`);
          return;
        }
        setUserId(user.id);
        await setLoadingStage(50, "Loading map shell, nodes, and canvas data...");
        const [memberRes, mapRes, typeRes, nodeRes, elementRes, relRes, viewRes] = await Promise.all([
          supabaseBrowser.schema("ms").from("map_members").select("role").eq("map_id", mapId).eq("user_id", user.id).maybeSingle(),
          supabaseBrowser.schema("ms").from("system_maps").select("id,title,description,owner_id,map_code,map_category,updated_at,created_at").eq("id", mapId).maybeSingle(),
          supabaseBrowser.schema("ms").from("document_types").select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active").eq("is_active", true).or(`map_id.eq.${mapId},map_id.is.null`).order("level_rank", { ascending: true }),
          supabaseBrowser.schema("ms").from("document_nodes").select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived").eq("map_id", mapId).eq("is_archived", false),
          supabaseBrowser.schema("ms").from("canvas_elements").select(canvasElementSelectColumns).eq("map_id", mapId).order("created_at", { ascending: true }),
          supabaseBrowser
            .schema("ms")
            .from("node_relations")
            .select("*")
            .eq("map_id", mapId),
          supabaseBrowser.schema("ms").from("map_view_state").select("pan_x,pan_y,zoom").eq("map_id", mapId).eq("user_id", user.id).maybeSingle(),
        ]);
        if (cancelled) return;

        if (memberRes.error || !memberRes.data?.role) {
          setError("Unable to load this map. You may not have access.");
          return;
        }
        if (mapRes.error || !mapRes.data) {
          setError("Unable to load this map. You may not have access.");
          return;
        }
        if (nodeRes.error) {
          setError("Unable to load map documents.");
          return;
        }

        setMapRole(memberRes.data.role as "read" | "partial_write" | "full_write");
        const loadedMap = mapRes.data as SystemMap;
        const nextCategory = (loadedMap.map_category || defaultMapCategoryId) as MapCategoryId;
        if (!hasMapCategoryAccess(user.email ?? localStorage.getItem("hses_user_email"), nextCategory)) {
          window.location.replace("/dashboard");
          return;
        }
        setMap(loadedMap);
        setMapCategoryId(nextCategory);
        await setLoadingStage(75, "Gathering collaborators and lining up the map pieces...");
        await loadMapMembers(loadedMap.owner_id);
        let loadedTypes = (typeRes.data ?? []) as DocumentTypeRow[];
        if (!loadedTypes.length) {
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
        setElements((elementRes.data ?? []) as CanvasElementRow[]);
        setRelations((relRes.data ?? []) as NodeRelationRow[]);
        const nextSaved: Record<string, { x: number; y: number }> = {};
        loadedNodes.forEach((n) => (nextSaved[n.id] = { x: n.pos_x, y: n.pos_y }));
        savedPos.current = nextSaved;

        if (viewRes.data) {
          const viewData = viewRes.data;
          setPendingViewport({ x: viewData.pan_x, y: viewData.pan_y, zoom: viewData.zoom });
        }
        await setLoadingStage(100, "Straightening lines and sharpening pencils...");
        loadCompleted = true;
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
          if (loadCompleted) {
            retryTimer = setTimeout(() => {
              if (!cancelled) setLoading(false);
            }, 500);
          } else {
            setLoading(false);
          }
        }
      }
    };

    void run(0);
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [mapId, loadMapMembers]);

  useEffect(() => {
    if (!rf || !pendingViewport) return;
    rf.setViewport(pendingViewport, { duration: 250 });
    setPendingViewport(null);
  }, [rf, pendingViewport]);

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
    if (!selectedNodeId) setDesktopNodeAction(null);
  }, [selectedNodeId]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setUserEmail(localStorage.getItem("hses_user_email") || "");
  }, []);

  useEffect(() => {
    if (!selectedProcess) return;
    setProcessHeadingDraft(selectedProcess.heading ?? "");
    setProcessWidthDraft(String(Math.max(processMinWidthSquares, Math.round((selectedProcess.width || processHeadingWidth) / minorGridSize))));
    setProcessHeightDraft(String(Math.max(processMinHeightSquares, Math.round((selectedProcess.height || processHeadingHeight) / minorGridSize))));
    setProcessColorDraft(selectedProcess.color_hex ?? null);
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
    if (isOrgChartPersonElement(selectedPerson)) {
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
  }, [selectedPerson]);
  useEffect(() => {
    if (!selectedGrouping) return;
    setGroupingLabelDraft(selectedGrouping.heading ?? "");
    setGroupingWidthDraft(String(Math.max(groupingMinWidthSquares, Math.round((selectedGrouping.width || groupingDefaultWidth) / minorGridSize))));
    setGroupingHeightDraft(String(Math.max(groupingMinHeightSquares, Math.round((selectedGrouping.height || groupingDefaultHeight) / minorGridSize))));
  }, [selectedGrouping]);
  useEffect(() => {
    if (!selectedSticky) return;
    setStickyTextDraft(selectedSticky.heading ?? "");
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
  }, [selectedTextBox]);
  useEffect(() => {
    if (!selectedTable) return;
    const cfg = (selectedTable.element_config as Record<string, unknown> | null) ?? {};
    const parsedRows = Number(cfg.rows ?? 2);
    const parsedColumns = Number(cfg.columns ?? 2);
    const rows = Number.isFinite(parsedRows) ? Math.max(tableMinRows, Math.floor(parsedRows)) : tableMinRows;
    const columns = Number.isFinite(parsedColumns) ? Math.max(tableMinColumns, Math.floor(parsedColumns)) : tableMinColumns;
    const headerBg = typeof cfg.header_bg_color === "string" ? cfg.header_bg_color : "";
    const headerFillMode = String(cfg.header_fill_mode ?? "fill") === "outline" ? "outline" : "fill";
    setTableRowsDraft(String(rows));
    setTableColumnsDraft(String(columns));
    setTableHeaderBgDraft(headerBg.toUpperCase());
    setTableHeaderFillModeDraft(headerFillMode);
    setTableBoldDraft(Boolean(cfg.bold));
    setTableItalicDraft(Boolean(cfg.italic));
    setTableUnderlineDraft(Boolean(cfg.underline));
    const align = String(cfg.align ?? "center");
    setTableAlignDraft(align === "left" || align === "right" ? align : "center");
    const size = Number(cfg.font_size ?? 10);
    setTableFontSizeDraft(String(Number.isFinite(size) ? Math.max(10, Math.min(72, Math.round(size))) : 10));
  }, [selectedTable, tableMinRows, tableMinColumns]);
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
  }, [imagePathSignature, elements, isHeicLike, blobLooksLikeHeif, convertHeicBlobToJpegBlob]);
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
        setBowtieDraft((prev) => (selectedBowtieElementId === updated.id ? (updated.element_config as Record<string, string | boolean> | null) ?? prev : prev));
      }
    }
    setEvidenceMediaOverlay(null);
  }, [evidenceMediaOverlay, elements, mapId, canvasElementSelectColumns, setError, setElements, selectedBowtieElementId]);
  useEffect(() => {
    if (!selectedBowtieElement) return;
    setBowtieHeadingDraft(methodologyDefaultLabelByType[selectedBowtieElement.element_type] ?? selectedBowtieElement.heading ?? "");
    setBowtieDraft(buildMethodologyDraft(selectedBowtieElement));
  }, [selectedBowtieElement]);
  useEffect(() => {
    if (!canWriteMap || methodologyMigrationInFlightRef.current) return;
    const elementsToMigrate = elements.filter((el) => {
      if (!isDescriptionDrivenMethodologyType(el.element_type)) return false;
      const defaultLabel = methodologyDefaultLabelByType[el.element_type] ?? "Node";
      const currentHeading = String(el.heading ?? "").trim();
      return !!currentHeading && currentHeading !== defaultLabel;
    });
    if (!elementsToMigrate.length) return;
    methodologyMigrationInFlightRef.current = true;
    void (async () => {
      try {
        const results = await Promise.all(
          elementsToMigrate.map(async (el) => {
            const currentConfig = ((el.element_config as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
            const defaultLabel = methodologyDefaultLabelByType[el.element_type] ?? "Node";
            const migratedDescription = String(el.heading ?? "").trim();
            const { data, error: updateError } = await supabaseBrowser
              .schema("ms")
              .from("canvas_elements")
              .update({
                heading: defaultLabel,
                element_config: {
                  ...currentConfig,
                  description: migratedDescription,
                },
              })
              .eq("id", el.id)
              .eq("map_id", mapId)
              .select(canvasElementSelectColumns)
              .single();
            return updateError || !data ? null : (data as unknown as CanvasElementRow);
          })
        );
        const updatedById = new Map(results.filter((row): row is CanvasElementRow => !!row).map((row) => [row.id, row]));
        if (!updatedById.size) return;
        setElements((prev) => prev.map((el) => updatedById.get(el.id) ?? el));
      } finally {
        methodologyMigrationInFlightRef.current = false;
      }
    })();
  }, [canWriteMap, elements, mapId, setElements]);
  useEffect(() => {
    if (evidenceUploadPreviewUrl) URL.revokeObjectURL(evidenceUploadPreviewUrl);
    setEvidenceUploadPreviewUrl(null);
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
    setBowtieDraft((updated.element_config as Record<string, string | boolean> | null) ?? {});
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
    canvasElementSelectColumns,
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

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as globalThis.Node | null;
      if (target instanceof HTMLElement && target.closest("[data-add-menu-filter='true']")) return;
      if (addMenuRef.current && target && addMenuRef.current.contains(target)) return;
      setShowAddMenu(false);
      if (searchMenuRef.current && target && searchMenuRef.current.contains(target)) return;
      setShowSearchMenu(false);
      if (printMenuRef.current && target && printMenuRef.current.contains(target)) return;
      setShowPrintMenu(false);
      if (disciplineMenuRef.current && target && disciplineMenuRef.current.contains(target)) return;
      setShowDisciplineMenu(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

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

  useEffect(() => {
    if (!relationshipPopup) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as globalThis.Node | null;
      if (relationshipPopupRef.current && target && relationshipPopupRef.current.contains(target)) return;
      setRelationshipPopup(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [relationshipPopup]);
  useEffect(() => {
    if (!showMapInfoAside) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as globalThis.Node | null;
      if (mapInfoAsideRef.current && target && mapInfoAsideRef.current.contains(target)) return;
      if (mapInfoButtonRef.current && target && mapInfoButtonRef.current.contains(target)) return;
      setShowMapInfoAside(false);
      setIsEditingMapInfo(false);
      if (map) {
        setMapInfoNameDraft(map.title);
        setMapInfoDescriptionDraft(map.description ?? "");
        setMapCodeDraft(map.map_code ?? "");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showMapInfoAside, map]);
  useEffect(() => {
    if (!showMapInfoAside) return;
    const hasAnyLeftAsideOpen =
      !!selectedNodeId ||
      !!selectedProcessId ||
      !!selectedSystemId ||
      !!selectedProcessComponentId ||
      !!selectedPersonId ||
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

      if (event.key !== "Delete") return;
      if (!selectedFlowIds.size) return;
      event.preventDefault();
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
  const handleToggleMapInfoAside = useCallback(() => {
    setShowMapInfoAside((prev) => {
      const next = !prev;
      if (next) setIsEditingMapInfo(false);
      return next;
    });
  }, []);

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

  const { onNodeDragStop } = useCanvasNodeDragStop({
    canWriteMap,
    canEditElement,
    nodes,
    elements,
    mapId,
    snapToMinorGrid,
    findNearestFreePosition,
    selectedFlowIds,
    flowNodes,
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
    handleAddOrgChartPerson,
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
    incidentDefaultWidth,
    incidentThreeTwoHeight,
    incidentSquareSize,
    incidentFourThreeHeight,
    incidentThreeOneHeight,
    selectedProcessId,
    processHeadingDraft,
    processWidthDraft,
    processHeightDraft,
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
    setSelectedPersonId,
    selectedGroupingId,
    groupingLabelDraft,
    groupingWidthDraft,
    groupingHeightDraft,
    groupingMinWidthSquares,
    groupingMinHeightSquares,
    groupingMinWidth,
    groupingMinHeight,
    setSelectedGroupingId,
    selectedStickyId,
    stickyTextDraft,
    selectedImageId,
    imageDescriptionDraft,
    selectedTextBoxId,
    textBoxContentDraft,
    textBoxBoldDraft,
    textBoxItalicDraft,
    textBoxUnderlineDraft,
    textBoxAlignDraft,
    textBoxFontSizeDraft,
    selectedTableId,
    tableRowsDraft,
    tableColumnsDraft,
    tableHeaderBgDraft,
    tableHeaderFillModeDraft,
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
  const insertDocumentNodes = useCallback(
    async (payloads: DocumentNodeInsertPayload[]) => {
      if (!payloads.length) return [];
      const { data, error: insertError } = await supabaseBrowser
        .schema("ms")
        .from("document_nodes")
        .insert(payloads)
        .select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived");
      if (insertError) throw insertError;
      const insertedRows = (data as DocumentNodeRow[] | null) ?? [];
      if (insertedRows.length) {
        insertedRows.forEach((row) => {
          savedPos.current[row.id] = { x: row.pos_x, y: row.pos_y };
        });
        setNodes((current) => [...current, ...insertedRows]);
      }
      return insertedRows;
    },
    [setNodes]
  );
  const updateDocumentNodes = useCallback(
    async (
      updates: Array<{
        id: string;
        fields: Partial<Pick<DocumentNodeRow, "pos_x" | "pos_y" | "width" | "height">>;
      }>
    ) => {
      if (!updates.length) return;
      await Promise.all(
        updates.map(async ({ id, fields }) => {
          const { error: updateError } = await supabaseBrowser.schema("ms").from("document_nodes").update(fields).eq("id", id).eq("map_id", mapId);
          if (updateError) throw updateError;
        })
      );
      setNodes((current) =>
        current.map((node) => {
          const match = updates.find((update) => update.id === node.id);
          const next = match ? { ...node, ...match.fields } : node;
          if (match) {
            savedPos.current[node.id] = { x: next.pos_x, y: next.pos_y };
          }
          return next;
        })
      );
    },
    [mapId, setNodes]
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
    [groupingMinHeight, groupingMinWidth]
  );
  const findWizardGroupElements = useCallback(
    (groupElement: CanvasElementRow, stepId: string) => {
      const allowedTypes = new Set(wizardElementTypesByStep[stepId] ?? []);
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
    [elements, groupingDefaultHeight, groupingDefaultWidth]
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
        meaningfulCount: number,
        newGroupPosition?: { x: number; y: number }
      ) => {
        if (!meaningfulCount) return;
        const existingGroup = findExistingWizardGroup(heading);
        const existingNodes = existingGroup ? findWizardGroupElements(existingGroup, step) : [];
        const totalCount = existingNodes.length + meaningfulCount;
        const layout = buildWizardGroupLayout(totalCount, itemWidth, itemHeight);
        const groupPosition = existingGroup
          ? { x: snapToMinorGrid(existingGroup.pos_x), y: snapToMinorGrid(existingGroup.pos_y) }
          : (newGroupPosition ?? getNextWizardGroupPosition(layout.width, layout.height));
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
            fields: { pos_x: origin.x, pos_y: origin.y, width: layout.itemWidth, height: layout.itemHeight },
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
              fields: { pos_x: groupPosition.x, pos_y: groupPosition.y, width: layout.width, height: layout.height },
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
      const buildLooseOrigins = (count: number, itemWidth: number, itemHeight: number) => {
        if (!count) return [] as Array<{ x: number; y: number }>;
        const layout = buildWizardGroupLayout(count, itemWidth, itemHeight);
        const base = getNextWizardGroupPosition(layout.width, layout.height);
        return Array.from({ length: count }, (_, index) => {
          const column = index % layout.columns;
          const row = Math.floor(index / layout.columns);
          return {
            x: snapToMinorGrid(base.x + layout.horizontalPadding + column * (layout.itemWidth + layout.gap)),
            y: snapToMinorGrid(base.y + layout.topPadding + row * (layout.itemHeight + layout.gap)),
          };
        });
      };
      const resolveDocumentType = (value: string) => {
        const normalized = value.trim().toLowerCase();
        return (
          addDocumentTypes.find((option) => option.id === value) ??
          addDocumentTypes.find((option) => option.name.trim().toLowerCase() === normalized) ??
          null
        );
      };
      const buildDocumentPayload = (
        origin: { x: number; y: number },
        typeValue: string,
        title: string,
        documentNumber: string
      ): DocumentNodeInsertPayload | null => {
        const type = resolveDocumentType(typeValue);
        if (!type) return null;
        const isLandscape = isLandscapeTypeName(type.name);
        return {
          map_id: mapId,
          type_id: type.id,
          title: title.trim() || "Document",
          document_number: documentNumber.trim(),
          discipline: "",
          owner_user_id: userId,
          owner_name: userEmail,
          user_group: "",
          pos_x: origin.x,
          pos_y: origin.y,
          width: isLandscape ? landscapeDefaultWidth : defaultWidth,
          height: isLandscape ? landscapeDefaultHeight : defaultHeight,
          is_archived: false,
        };
      };
      const getDocumentDimensionsByTypeValue = (typeValue: string) => {
        const type = resolveDocumentType(typeValue);
        const isLandscape = type ? isLandscapeTypeName(type.name) : false;
        return {
          width: isLandscape ? landscapeDefaultWidth : defaultWidth,
          height: isLandscape ? landscapeDefaultHeight : defaultHeight,
        };
      };
      const createCompactPeople = async (
        heading: string,
        stepId: "people" | "roles",
        items: Array<{ roleName: string; occupantName: string }>,
        newGroupPosition?: { x: number; y: number }
      ) => {
        const filtered = items.filter((item) => isFilled(item.roleName) || isFilled(item.occupantName));
        await createGroupAndInsert(stepId, heading, personElementWidth, personElementHeight, (origin, index) => {
          const item = filtered[index];
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
        }, filtered.length, newGroupPosition);
      };
      const bowtieSectionHeadings = [
        wizardGroupHeadingByStep.overview,
        wizardGroupHeadingByStep.threats,
        wizardGroupHeadingByStep.consequences,
        "Preventive Controls",
        "Recovery Controls",
        wizardGroupHeadingByStep.assurance,
      ];
      const bowtiePreventiveControlsHeading = "Preventive Controls";
      const bowtieRecoveryControlsHeading = "Recovery Controls";
      const getBowtieWizardSectionPosition = (heading: string, sectionWidth: number, sectionHeight: number) => {
        const sectionGap = minorGridSize * 5;
        const existingSections = elements
          .filter((element) => element.element_type === "grouping_container" && bowtieSectionHeadings.includes(element.heading))
          .sort((a, b) => a.pos_y - b.pos_y || a.pos_x - b.pos_x);
        if (!existingSections.length) {
          return getNextWizardGroupPosition(sectionWidth, sectionHeight);
        }
        const leftEdge = Math.min(...existingSections.map((section) => section.pos_x));
        const orderIndex = bowtieSectionHeadings.indexOf(heading);
        const row = Math.floor(Math.max(0, orderIndex) / 3);
        const col = Math.max(0, orderIndex) % 3;
        if (row === 0) {
          if (col === 0) {
            return {
              x: leftEdge,
              y: Math.min(...existingSections.map((section) => section.pos_y)),
            };
          }
          const priorRowSections = existingSections.filter(
            (section) => Math.floor(Math.max(0, bowtieSectionHeadings.indexOf(section.heading)) / 3) === 0
          );
          const rightEdge = Math.max(...priorRowSections.map((section) => section.pos_x + (section.width || sectionWidth)));
          return {
            x: snapToMinorGrid(rightEdge + sectionGap),
            y: Math.min(...priorRowSections.map((section) => section.pos_y)),
          };
        }
        const upperSections = existingSections.filter(
          (section) => Math.floor(Math.max(0, bowtieSectionHeadings.indexOf(section.heading)) / 3) < row
        );
        const rowTop = snapToMinorGrid(
          Math.max(...upperSections.map((section) => section.pos_y + (section.height || sectionHeight))) + sectionGap
        );
        const sameRowSections = existingSections.filter(
          (section) => Math.floor(Math.max(0, bowtieSectionHeadings.indexOf(section.heading)) / 3) === row
        );
        if (!sameRowSections.length || col === 0) {
          return { x: leftEdge, y: rowTop };
        }
        const rightEdge = Math.max(...sameRowSections.map((section) => section.pos_x + (section.width || sectionWidth)));
        return {
          x: snapToMinorGrid(rightEdge + sectionGap),
          y: rowTop,
        };
      };
      const relayoutBowtieWizardSections = async () => {
        const relevantTypes = [
          "grouping_container",
          "bowtie_hazard",
          "bowtie_top_event",
          "bowtie_risk_rating",
          "bowtie_threat",
          "bowtie_consequence",
          "bowtie_control",
          "bowtie_escalation_factor",
          "bowtie_recovery_measure",
          "bowtie_degradation_indicator",
        ];
        const { data, error: fetchError } = await supabaseBrowser
          .schema("ms")
          .from("canvas_elements")
          .select(canvasElementSelectColumns)
          .eq("map_id", mapId)
          .in("element_type", relevantTypes);
        if (fetchError) throw fetchError;
        const allRows = ((data as CanvasElementRow[] | null) ?? []).filter((row) => {
          if (row.element_type !== "grouping_container") return true;
          return bowtieSectionHeadings.includes(row.heading);
        });
        const groupsByHeading = new Map(
          allRows
            .filter((row) => row.element_type === "grouping_container")
            .map((row) => [row.heading, row] as const)
        );
        const sortByVisualOrder = (rows: CanvasElementRow[]) =>
          [...rows].sort((a, b) => a.pos_y - b.pos_y || a.pos_x - b.pos_x || a.created_at.localeCompare(b.created_at));
        const overviewNodes = sortByVisualOrder(
          allRows.filter((row) =>
            row.element_type === "bowtie_hazard" ||
            row.element_type === "bowtie_top_event" ||
            row.element_type === "bowtie_risk_rating"
          )
        );
        const threats = sortByVisualOrder(allRows.filter((row) => row.element_type === "bowtie_threat"));
        const consequences = sortByVisualOrder(allRows.filter((row) => row.element_type === "bowtie_consequence"));
        const controls = sortByVisualOrder(allRows.filter((row) => row.element_type === "bowtie_control"));
        const preventiveControls = controls.filter((row) => {
          const cfg = (row.element_config as Record<string, unknown> | null) ?? {};
          return String(cfg.control_category ?? "").trim().toLowerCase() === "preventive";
        });
        const recoveryControls = controls.filter((row) => {
          const cfg = (row.element_config as Record<string, unknown> | null) ?? {};
          return String(cfg.control_category ?? "").trim().toLowerCase() !== "preventive";
        });
        const assuranceNodes = sortByVisualOrder(
          allRows.filter((row) =>
            row.element_type === "bowtie_escalation_factor" ||
            row.element_type === "bowtie_recovery_measure" ||
            row.element_type === "bowtie_degradation_indicator"
          )
        );
        const gap = minorGridSize;
        const sectionGap = minorGridSize * 5;
        const edgePadding = minorGridSize * 2;
        const anchor = getNextWizardGroupPosition(majorGridSize * 4, majorGridSize * 4);
        const startX = groupsByHeading.size
          ? Math.min(...[...groupsByHeading.values()].map((row) => row.pos_x))
          : anchor.x;
        const startY = groupsByHeading.size
          ? Math.min(...[...groupsByHeading.values()].map((row) => row.pos_y))
          : anchor.y;

        const leftRows = threats.map((threat) => {
          const linkedControls = preventiveControls.filter((control) => {
            const cfg = (control.element_config as Record<string, unknown> | null) ?? {};
            const linked = String(cfg.linked_target_heading ?? "").trim();
            return linked ? linked === threat.heading : threat === threats[0];
          });
          return { anchor: threat, controls: linkedControls };
        });
        const rightRows = consequences.map((consequence) => {
          const linkedControls = recoveryControls.filter((control) => {
            const cfg = (control.element_config as Record<string, unknown> | null) ?? {};
            const linked = String(cfg.linked_target_heading ?? "").trim();
            return linked ? linked === consequence.heading : consequence === consequences[0];
          });
          return { anchor: consequence, controls: linkedControls };
        });
        const leftRowHeights = leftRows.map((row) =>
          Math.max(
            row.anchor.height || bowtieSquareHeight,
            ...row.controls.map((control) => control.height || bowtieControlHeight),
            bowtieSquareHeight
          )
        );
        const rightRowHeights = rightRows.map((row) =>
          Math.max(
            row.anchor.height || bowtieSquareHeight,
            ...row.controls.map((control) => control.height || bowtieControlHeight),
            bowtieSquareHeight
          )
        );
        const totalRows = Math.max(leftRows.length, rightRows.length, 1);
        const rowHeights = Array.from({ length: totalRows }, (_, index) =>
          Math.max(leftRowHeights[index] ?? 0, rightRowHeights[index] ?? 0, bowtieSquareHeight)
        );
        const bodyHeight = edgePadding * 2 + rowHeights.reduce((sum, value) => sum + value, 0) + Math.max(0, totalRows - 1) * gap;
        const leftThreatWidth = edgePadding * 2 + bowtieDefaultWidth;
        const leftControlContentWidth = Math.max(
          bowtieDefaultWidth,
          ...leftRows.map((row) => row.controls.reduce((sum, control) => sum + (control.width || bowtieDefaultWidth), 0) + Math.max(0, row.controls.length - 1) * gap)
        );
        const leftControlWidth = edgePadding * 2 + leftControlContentWidth;
        const overviewContentWidth = overviewNodes.reduce((sum, row) => sum + (row.width || bowtieDefaultWidth), 0) + Math.max(0, overviewNodes.length - 1) * gap;
        const overviewWidth = edgePadding * 2 + Math.max(overviewContentWidth, bowtieDefaultWidth * 2);
        const overviewHeight = edgePadding * 2 + Math.max(...overviewNodes.map((row) => row.height || bowtieSquareHeight), bowtieSquareHeight);
        const rightControlContentWidth = Math.max(
          bowtieDefaultWidth,
          ...rightRows.map((row) => row.controls.reduce((sum, control) => sum + (control.width || bowtieDefaultWidth), 0) + Math.max(0, row.controls.length - 1) * gap)
        );
        const rightControlWidth = edgePadding * 2 + rightControlContentWidth;
        const rightConsequenceWidth = edgePadding * 2 + bowtieDefaultWidth;
        const overviewY = snapToMinorGrid(startY + Math.max(0, (bodyHeight - overviewHeight) / 2));
        const leftThreatX = startX;
        const leftControlX = snapToMinorGrid(leftThreatX + leftThreatWidth + sectionGap);
        const overviewX = snapToMinorGrid(leftControlX + leftControlWidth + sectionGap);
        const rightControlX = snapToMinorGrid(overviewX + overviewWidth + sectionGap);
        const rightConsequenceX = snapToMinorGrid(rightControlX + rightControlWidth + sectionGap);
        const assuranceWidth = edgePadding * 2 + Math.max(bowtieDefaultWidth, Math.min(3, Math.max(1, assuranceNodes.length)) * bowtieDefaultWidth + Math.max(0, Math.min(3, Math.max(1, assuranceNodes.length)) - 1) * gap);
        const assuranceRows = Math.max(1, Math.ceil(Math.max(assuranceNodes.length, 1) / 3));
        const assuranceHeight = edgePadding * 2 + assuranceRows * bowtieSquareHeight + Math.max(0, assuranceRows - 1) * gap;
        const assuranceX = startX;
        const assuranceY = snapToMinorGrid(startY + bodyHeight + sectionGap);

        const updates: CanvasElementUpdatePayload[] = [];
        const pushGroupUpdate = (heading: string, x: number, y: number, width: number, height: number) => {
          const group = groupsByHeading.get(heading);
          if (!group) return;
          updates.push({ id: group.id, fields: { pos_x: x, pos_y: y, width, height } });
        };
        pushGroupUpdate(wizardGroupHeadingByStep.threats, leftThreatX, startY, leftThreatWidth, bodyHeight);
        pushGroupUpdate(bowtiePreventiveControlsHeading, leftControlX, startY, leftControlWidth, bodyHeight);
        pushGroupUpdate(wizardGroupHeadingByStep.overview, overviewX, overviewY, overviewWidth, overviewHeight);
        pushGroupUpdate(bowtieRecoveryControlsHeading, rightControlX, startY, rightControlWidth, bodyHeight);
        pushGroupUpdate(wizardGroupHeadingByStep.consequences, rightConsequenceX, startY, rightConsequenceWidth, bodyHeight);
        pushGroupUpdate(wizardGroupHeadingByStep.assurance, assuranceX, assuranceY, assuranceWidth, assuranceHeight);

        let runningY = snapToMinorGrid(startY + edgePadding);
        leftRows.forEach((row, rowIndex) => {
          updates.push({
            id: row.anchor.id,
            fields: {
              pos_x: snapToMinorGrid(leftThreatX + edgePadding),
              pos_y: runningY,
              width: bowtieDefaultWidth,
              height: bowtieSquareHeight,
            },
          });
          let controlX = snapToMinorGrid(leftControlX + edgePadding);
          row.controls.forEach((control) => {
            updates.push({
              id: control.id,
              fields: {
                pos_x: controlX,
                pos_y: runningY,
                width: bowtieDefaultWidth,
                height: bowtieControlHeight,
              },
            });
            controlX = snapToMinorGrid(controlX + bowtieDefaultWidth + gap);
          });
          runningY = snapToMinorGrid(runningY + rowHeights[rowIndex] + gap);
        });

        runningY = snapToMinorGrid(startY + edgePadding);
        rightRows.forEach((row, rowIndex) => {
          let controlX = snapToMinorGrid(rightControlX + edgePadding);
          row.controls.forEach((control) => {
            updates.push({
              id: control.id,
              fields: {
                pos_x: controlX,
                pos_y: runningY,
                width: bowtieDefaultWidth,
                height: bowtieControlHeight,
              },
            });
            controlX = snapToMinorGrid(controlX + bowtieDefaultWidth + gap);
          });
          updates.push({
            id: row.anchor.id,
            fields: {
              pos_x: snapToMinorGrid(rightConsequenceX + edgePadding),
              pos_y: runningY,
              width: bowtieDefaultWidth,
              height: bowtieSquareHeight,
            },
          });
          runningY = snapToMinorGrid(runningY + rowHeights[rowIndex] + gap);
        });

        let overviewXCursor = snapToMinorGrid(overviewX + edgePadding);
        overviewNodes.forEach((node) => {
          const width = node.element_type === "bowtie_risk_rating" ? bowtieDefaultWidth : bowtieDefaultWidth;
          const height =
            node.element_type === "bowtie_hazard"
              ? bowtieHazardHeight
              : node.element_type === "bowtie_risk_rating"
                ? bowtieRiskRatingHeight
                : bowtieSquareHeight;
          updates.push({
            id: node.id,
            fields: {
              pos_x: overviewXCursor,
              pos_y: snapToMinorGrid(overviewY + edgePadding),
              width,
              height,
            },
          });
          overviewXCursor = snapToMinorGrid(overviewXCursor + width + gap);
        });

        assuranceNodes.forEach((node, index) => {
          const column = index % 3;
          const row = Math.floor(index / 3);
          updates.push({
            id: node.id,
            fields: {
              pos_x: snapToMinorGrid(assuranceX + edgePadding + column * (bowtieDefaultWidth + gap)),
              pos_y: snapToMinorGrid(assuranceY + edgePadding + row * (bowtieSquareHeight + gap)),
              width: bowtieDefaultWidth,
              height: bowtieSquareHeight,
            },
          });
        });

        if (updates.length) {
          await updateCanvasElements(updates);
        }
      };
      const getDocumentWizardTopRowGroups = () =>
        elements.filter(
          (element) =>
            element.element_type === "grouping_container" &&
            (element.heading === wizardGroupHeadingByStep.systems ||
              element.heading === wizardGroupHeadingByStep.processes ||
              element.heading === wizardGroupHeadingByStep.people)
        );
      const getDocumentWizardTopRowWidth = () => {
        const topGroups = getDocumentWizardTopRowGroups();
        if (!topGroups.length) {
          return processHeadingWidth;
        }
        const leftEdge = Math.min(...topGroups.map((group) => group.pos_x));
        const rightEdge = Math.max(...topGroups.map((group) => group.pos_x + (group.width || groupingDefaultWidth)));
        return Math.max(processHeadingWidth, snapToMinorGrid(rightEdge - leftEdge));
      };
      const getDocumentWizardTopRowPosition = (groupWidth: number, groupHeight: number) => {
        const topGroups = getDocumentWizardTopRowGroups();
        if (!topGroups.length) {
          return {
            x: snapToMinorGrid(majorGridSize),
            y: snapToMinorGrid(majorGridSize),
          };
        }
        const topY = topGroups.reduce((best, current) => Math.min(best, current.pos_y), topGroups[0].pos_y);
        const rightmost = topGroups.reduce((best, current) => {
          const bestEdge = best.pos_x + (best.width || groupWidth);
          const currentEdge = current.pos_x + (current.width || groupWidth);
          return currentEdge > bestEdge ? current : best;
        });
        return {
          x: snapToMinorGrid(rightmost.pos_x + (rightmost.width || groupWidth) + majorGridSize),
          y: snapToMinorGrid(topY),
        };
      };
      const getDocumentWizardSecondRowBounds = () => {
        const topGroups = getDocumentWizardTopRowGroups();
        const leftEdge = topGroups.length ? Math.min(...topGroups.map((group) => group.pos_x)) : snapToMinorGrid(majorGridSize);
        const defaultTop = snapToMinorGrid(majorGridSize + groupingDefaultHeight + minorGridSize * 5);
        if (!topGroups.length) {
          return {
            x: leftEdge,
            y: defaultTop,
          };
        }
        const secondRowTop = snapToMinorGrid(
          Math.max(...topGroups.map((group) => group.pos_y + (group.height || groupingDefaultHeight))) + minorGridSize * 5
        );
        const secondRowElementRightEdges = elements
          .filter((element) => element.pos_y >= secondRowTop - minorGridSize)
          .map((element) => element.pos_x + (element.width || defaultWidth));
        const secondRowNodeRightEdges = nodes
          .filter((node) => node.pos_y >= secondRowTop - minorGridSize)
          .map((node) => node.pos_x + (node.width || defaultWidth));
        const rightmost = Math.max(0, ...secondRowElementRightEdges, ...secondRowNodeRightEdges);
        return {
          x: leftEdge,
          y: secondRowTop,
        };
      };

      if (payload.category === "document_map") {
        if (payload.step === "systems") {
          const items = payload.items.filter((item) => isFilled(item.heading) || isFilled(item.description));
          const groupPosition = getDocumentWizardTopRowPosition(
            buildWizardGroupLayout(items.length, systemCircleDiameter, systemCircleElementHeight).width,
            buildWizardGroupLayout(items.length, systemCircleDiameter, systemCircleElementHeight).height
          );
          await createGroupAndInsert("systems", wizardGroupHeadingByStep.systems, systemCircleDiameter, systemCircleElementHeight, (origin, index) => {
            const item = items[index];
            return {
              map_id: mapId,
              element_type: "system_circle",
              heading: item.heading.trim() || `System ${index + 1}`,
              color_hex: null,
              created_by_user_id: userId,
              element_config: null,
              pos_x: origin.x,
              pos_y: origin.y,
              width: systemCircleDiameter,
              height: systemCircleElementHeight,
            };
          }, items.length, groupPosition);
          return;
        }
        if (payload.step === "processes") {
          const items = payload.items.filter((item) => isFilled(item.heading) || isFilled(item.description));
          const groupPosition = getDocumentWizardTopRowPosition(
            buildWizardGroupLayout(items.length, processComponentWidth, processComponentElementHeight).width,
            buildWizardGroupLayout(items.length, processComponentWidth, processComponentElementHeight).height
          );
          await createGroupAndInsert("processes", wizardGroupHeadingByStep.processes, processComponentWidth, processComponentElementHeight, (origin, index) => {
            const item = items[index];
            return {
              map_id: mapId,
              element_type: "process_component",
              heading: item.heading.trim() || `Process ${index + 1}`,
              color_hex: null,
              created_by_user_id: userId,
              element_config: { body: item.description.trim() },
              pos_x: origin.x,
              pos_y: origin.y,
              width: processComponentWidth,
              height: processComponentElementHeight,
            };
          }, items.length, groupPosition);
          return;
        }
        if (payload.step === "people") {
          const filteredCount = payload.items.filter((item) => isFilled(item.roleName) || isFilled(item.occupantName)).length;
          const groupPosition = getDocumentWizardTopRowPosition(
            buildWizardGroupLayout(filteredCount, personElementWidth, personElementHeight).width,
            buildWizardGroupLayout(filteredCount, personElementWidth, personElementHeight).height
          );
          await createCompactPeople(wizardGroupHeadingByStep.people, "people", payload.items, groupPosition);
          return;
        }
        if (payload.step === "documents") {
          const items = payload.items.filter((item) => isFilled(item.title) || isFilled(item.documentNumber) || isFilled(item.documentType));
          const secondRowBase = getDocumentWizardSecondRowBounds();
          let nextX = secondRowBase.x;
          const documentPayloads = items
            .map((item, index) => {
              const dimensions = getDocumentDimensionsByTypeValue(item.documentType);
              const payload = buildDocumentPayload(
                { x: nextX, y: secondRowBase.y },
                item.documentType,
                item.title || `Document ${index + 1}`,
                item.documentNumber
              );
              nextX = snapToMinorGrid(nextX + dimensions.width + minorGridSize);
              return payload;
            })
            .filter((item): item is DocumentNodeInsertPayload => Boolean(item));
          await insertDocumentNodes(documentPayloads);
          return;
        }
        if (payload.step === "hierarchy") {
          const items = payload.items.filter((item) => isFilled(item.layerName) || item.documentIds.length > 0);
          if (!items.length) return;
          const gap = minorGridSize;
          const base = getDocumentWizardSecondRowBounds();
          const maxLayerWidth = getDocumentWizardTopRowWidth();
          const categoryPayloads: CanvasElementInsertPayload[] = [];
          const documentUpdates: Array<{ id: string; fields: Partial<Pick<DocumentNodeRow, "pos_x" | "pos_y" | "width" | "height">> }> = [];
          let nextColumnX = base.x;
          items.forEach((item, index) => {
            const selectedNodes = item.documentIds
              .map((documentId) => nodes.find((node) => node.id === documentId))
              .filter((node): node is DocumentNodeRow => Boolean(node));
            const totalDocWidth =
              selectedNodes.reduce((sum, node) => sum + (node.width || defaultWidth), 0) +
              Math.max(0, selectedNodes.length - 1) * gap;
            const categoryWidth = Math.max(
              processHeadingWidth,
              Math.min(maxLayerWidth, totalDocWidth || processHeadingWidth)
            );
            const categoryX = snapToMinorGrid(nextColumnX);
            categoryPayloads.push({
              map_id: mapId,
              element_type: "category",
              heading: item.layerName.trim() || `Layer ${index + 1}`,
              color_hex: defaultCategoryColor,
              created_by_user_id: userId,
              element_config: null,
              pos_x: categoryX,
              pos_y: base.y,
              width: categoryWidth,
              height: processHeadingHeight,
            });
            let currentX = categoryX;
            let currentY = snapToMinorGrid(base.y + processHeadingHeight + gap);
            let currentRowHeight = 0;
            selectedNodes.forEach((existingNode) => {
              const documentWidth = existingNode.width || defaultWidth;
              const documentHeight = existingNode.height || defaultHeight;
              if (currentX > categoryX && currentX + documentWidth > categoryX + categoryWidth) {
                currentX = categoryX;
                currentY = snapToMinorGrid(currentY + currentRowHeight + gap);
                currentRowHeight = 0;
              }
              documentUpdates.push({
                id: existingNode.id,
                fields: {
                  pos_x: currentX,
                  pos_y: currentY,
                  width: existingNode.width,
                  height: existingNode.height,
                },
              });
              currentX = snapToMinorGrid(currentX + documentWidth + gap);
              currentRowHeight = Math.max(currentRowHeight, documentHeight);
            });
            nextColumnX = snapToMinorGrid(nextColumnX + categoryWidth + gap);
          });
          await insertCanvasElements(categoryPayloads);
          await updateDocumentNodes(documentUpdates);
          return;
        }
      }

      if (payload.category === "bow_tie") {
        if (payload.step === "overview") {
          const item = payload.items[0];
          const edgePadding = minorGridSize * 2;
          const gap = minorGridSize;
          const overviewNodes = [
            {
              element_type: "bowtie_hazard" as const,
              heading: item.hazard.trim() || "Hazard",
              color_hex: "#111827",
              element_config: { description: "", hazard_category: "" },
              width: bowtieDefaultWidth,
              height: bowtieHazardHeight,
            },
            {
              element_type: "bowtie_top_event" as const,
              heading: item.topEvent.trim() || "Top Event",
              color_hex: "#dc2626",
              element_config: { description: "", loss_of_control_type: item.lossOfControlType.trim() },
              width: bowtieDefaultWidth,
              height: bowtieSquareHeight,
            },
            {
              element_type: "bowtie_risk_rating" as const,
              heading: `Risk Level: ${item.riskLevel.charAt(0).toUpperCase() + item.riskLevel.slice(1)}`,
              color_hex: "#111827",
              element_config: { likelihood: item.likelihood, consequence: item.consequence, risk_level: item.riskLevel },
              width: bowtieDefaultWidth,
              height: bowtieRiskRatingHeight,
            },
          ];
          const sectionWidth =
            edgePadding * 2 + overviewNodes.reduce((sum, node) => sum + node.width, 0) + gap * (overviewNodes.length - 1);
          const sectionHeight = edgePadding * 2 + Math.max(...overviewNodes.map((node) => node.height));
          const existingGroup = findExistingWizardGroup(wizardGroupHeadingByStep.overview);
          const sectionPosition = existingGroup
            ? { x: snapToMinorGrid(existingGroup.pos_x), y: snapToMinorGrid(existingGroup.pos_y) }
            : getBowtieWizardSectionPosition(wizardGroupHeadingByStep.overview, sectionWidth, sectionHeight);
          const childOrigins = overviewNodes.map((node, index) => ({
            x: snapToMinorGrid(
              sectionPosition.x +
                edgePadding +
                overviewNodes.slice(0, index).reduce((sum, current) => sum + current.width, 0) +
                gap * index
            ),
            y: snapToMinorGrid(sectionPosition.y + edgePadding),
          }));
          const riskLabel = item.riskLevel.charAt(0).toUpperCase() + item.riskLevel.slice(1);
          if (existingGroup) {
            const existingChildren = findWizardGroupElements(existingGroup, "overview");
            const updates: CanvasElementUpdatePayload[] = [
              {
                id: existingGroup.id,
                fields: { pos_x: sectionPosition.x, pos_y: sectionPosition.y, width: sectionWidth, height: sectionHeight },
              },
            ];
            const inserts: CanvasElementInsertPayload[] = [];
            overviewNodes.forEach((node, index) => {
              const match = existingChildren.find((child) => child.element_type === node.element_type);
              if (match) {
                updates.push({
                  id: match.id,
                  fields: {
                    heading: node.heading,
                    element_config: node.element_config,
                    pos_x: childOrigins[index].x,
                    pos_y: childOrigins[index].y,
                    width: node.width,
                    height: node.height,
                  },
                });
                return;
              }
              inserts.push({
                map_id: mapId,
                element_type: node.element_type,
                heading: node.heading,
                color_hex: node.color_hex,
                created_by_user_id: userId,
                element_config: node.element_config,
                pos_x: childOrigins[index].x,
                pos_y: childOrigins[index].y,
                width: node.width,
                height: node.height,
              });
            });
            await updateCanvasElements(updates);
            await insertCanvasElements(inserts);
            return;
          }
          await insertCanvasElements([
            {
              map_id: mapId,
              element_type: "grouping_container",
              heading: wizardGroupHeadingByStep.overview,
              color_hex: null,
              created_by_user_id: userId,
              pos_x: sectionPosition.x,
              pos_y: sectionPosition.y,
              width: sectionWidth,
              height: sectionHeight,
            },
            {
              map_id: mapId,
              element_type: "bowtie_hazard",
              heading: item.hazard.trim() || "Hazard",
              color_hex: "#111827",
              created_by_user_id: userId,
              element_config: { description: "", hazard_category: "" },
              pos_x: childOrigins[0].x,
              pos_y: childOrigins[0].y,
              width: bowtieDefaultWidth,
              height: bowtieHazardHeight,
            },
            {
              map_id: mapId,
              element_type: "bowtie_top_event",
              heading: item.topEvent.trim() || "Top Event",
              color_hex: "#dc2626",
              created_by_user_id: userId,
              element_config: { description: "", loss_of_control_type: item.lossOfControlType.trim() },
              pos_x: childOrigins[1].x,
              pos_y: childOrigins[1].y,
              width: bowtieDefaultWidth,
              height: bowtieSquareHeight,
            },
            {
              map_id: mapId,
              element_type: "bowtie_risk_rating",
              heading: `Risk Level: ${riskLabel}`,
              color_hex: "#111827",
              created_by_user_id: userId,
              element_config: { likelihood: item.likelihood, consequence: item.consequence, risk_level: item.riskLevel },
              pos_x: childOrigins[2].x,
              pos_y: childOrigins[2].y,
              width: bowtieDefaultWidth,
              height: bowtieRiskRatingHeight,
            },
          ]);
          await relayoutBowtieWizardSections();
          return;
        }
        if (payload.step === "threats") {
          const items = payload.items.filter((item) => isFilled(item.heading) || isFilled(item.threatCategory));
          const layout = buildWizardGroupLayout(items.length, bowtieDefaultWidth, bowtieSquareHeight);
          const sectionPosition = getBowtieWizardSectionPosition(wizardGroupHeadingByStep.threats, layout.width, layout.height);
          await createGroupAndInsert("threats", wizardGroupHeadingByStep.threats, bowtieDefaultWidth, bowtieSquareHeight, (origin, index) => {
            const item = items[index];
            return {
              map_id: mapId,
              element_type: "bowtie_threat",
              heading: item.heading.trim() || `Threat ${index + 1}`,
              color_hex: "#f97316",
              created_by_user_id: userId,
              element_config: { description: "", threat_category: item.threatCategory.trim() },
              pos_x: origin.x,
              pos_y: origin.y,
              width: bowtieDefaultWidth,
              height: bowtieSquareHeight,
            };
          }, items.length, sectionPosition);
          await relayoutBowtieWizardSections();
          return;
        }
        if (payload.step === "consequences") {
          const items = payload.items.filter((item) => isFilled(item.heading) || isFilled(item.impactCategory));
          const layout = buildWizardGroupLayout(items.length, bowtieDefaultWidth, bowtieSquareHeight);
          const sectionPosition = getBowtieWizardSectionPosition(wizardGroupHeadingByStep.consequences, layout.width, layout.height);
          await createGroupAndInsert("consequences", wizardGroupHeadingByStep.consequences, bowtieDefaultWidth, bowtieSquareHeight, (origin, index) => {
            const item = items[index];
            return {
              map_id: mapId,
              element_type: "bowtie_consequence",
              heading: item.heading.trim() || `Consequence ${index + 1}`,
              color_hex: "#9333ea",
              created_by_user_id: userId,
              element_config: { description: "", impact_category: item.impactCategory.trim() },
              pos_x: origin.x,
              pos_y: origin.y,
              width: bowtieDefaultWidth,
              height: bowtieSquareHeight,
            };
          }, items.length, sectionPosition);
          await relayoutBowtieWizardSections();
          return;
        }
        if (payload.step === "controls") {
          const items = payload.items.filter((item) => isFilled(item.heading) || isFilled(item.description) || isFilled(item.controlType));
          const preventiveItems = items.filter((item) => item.controlCategory === "preventive");
          const recoveryItems = items.filter((item) => item.controlCategory !== "preventive");
          if (preventiveItems.length) {
            const layout = buildWizardGroupLayout(preventiveItems.length, bowtieDefaultWidth, bowtieControlHeight);
            const sectionPosition = getBowtieWizardSectionPosition(bowtiePreventiveControlsHeading, layout.width, layout.height);
            await createGroupAndInsert("controls", bowtiePreventiveControlsHeading, bowtieDefaultWidth, bowtieControlHeight, (origin, index) => {
              const item = preventiveItems[index];
              return {
                map_id: mapId,
                element_type: "bowtie_control",
                heading: item.heading.trim() || `Control ${index + 1}`,
                color_hex: "#ffffff",
                created_by_user_id: userId,
                element_config: {
                  description: item.description.trim(),
                  control_category: item.controlCategory,
                  linked_target_heading: item.linkedTargetHeading.trim(),
                  control_type: item.controlType.trim(),
                  owner_text: "",
                  verification_method: item.verificationMethod.trim(),
                  verification_frequency: item.verificationFrequency.trim(),
                  is_critical_control: item.critical,
                  performance_standard: "",
                },
                pos_x: origin.x,
                pos_y: origin.y,
                width: bowtieDefaultWidth,
                height: bowtieControlHeight,
              };
            }, preventiveItems.length, sectionPosition);
          }
          if (recoveryItems.length) {
            const layout = buildWizardGroupLayout(recoveryItems.length, bowtieDefaultWidth, bowtieControlHeight);
            const sectionPosition = getBowtieWizardSectionPosition(bowtieRecoveryControlsHeading, layout.width, layout.height);
            await createGroupAndInsert("controls", bowtieRecoveryControlsHeading, bowtieDefaultWidth, bowtieControlHeight, (origin, index) => {
              const item = recoveryItems[index];
              return {
                map_id: mapId,
                element_type: "bowtie_control",
                heading: item.heading.trim() || `Control ${index + 1}`,
                color_hex: "#ffffff",
                created_by_user_id: userId,
                element_config: {
                  description: item.description.trim(),
                  control_category: item.controlCategory,
                  linked_target_heading: item.linkedTargetHeading.trim(),
                  control_type: item.controlType.trim(),
                  owner_text: "",
                  verification_method: item.verificationMethod.trim(),
                  verification_frequency: item.verificationFrequency.trim(),
                  is_critical_control: item.critical,
                  performance_standard: "",
                },
                pos_x: origin.x,
                pos_y: origin.y,
                width: bowtieDefaultWidth,
                height: bowtieControlHeight,
              };
            }, recoveryItems.length, sectionPosition);
          }
          await relayoutBowtieWizardSections();
          return;
        }
        if (payload.step === "assurance") {
          const items = payload.items.filter((item) => isFilled(item.heading) || isFilled(item.description));
          const layout = buildWizardGroupLayout(items.length, bowtieDefaultWidth, bowtieSquareHeight);
          const sectionPosition = getBowtieWizardSectionPosition(wizardGroupHeadingByStep.assurance, layout.width, layout.height);
          await createGroupAndInsert("assurance", wizardGroupHeadingByStep.assurance, bowtieDefaultWidth, bowtieSquareHeight, (origin, index) => {
            const item = items[index];
            return {
              map_id: mapId,
              element_type: item.kind,
              heading: item.heading.trim() || `Assurance ${index + 1}`,
              color_hex:
                item.kind === "bowtie_escalation_factor" ? "#facc15" : item.kind === "bowtie_recovery_measure" ? "#22c55e" : "#8b5cf6",
              created_by_user_id: userId,
              element_config:
                item.kind === "bowtie_escalation_factor"
                  ? { description: item.description.trim(), factor_type: item.factorType.trim() }
                  : item.kind === "bowtie_recovery_measure"
                    ? { description: item.description.trim(), trigger: "", owner_text: "", time_requirement: item.timeRequirement.trim() }
                    : { description: item.description.trim(), linked_factor: "", indicator_type: item.monitoringMethod.trim(), monitoring_method: item.monitoringMethod.trim() },
              pos_x: origin.x,
              pos_y: origin.y,
              width: bowtieDefaultWidth,
              height: bowtieSquareHeight,
            };
          }, items.length, sectionPosition);
          await relayoutBowtieWizardSections();
          return;
        }
      }

      if (payload.category === "org_chart") {
        if (payload.step === "departments") {
          const items = payload.items.filter((item) => isFilled(item.heading) || isFilled(item.description));
          await createGroupAndInsert("departments", wizardGroupHeadingByStep.departments, processHeadingWidth, processHeadingHeight, (origin, index) => {
            const item = items[index];
            return {
              map_id: mapId,
              element_type: "category",
              heading: item.heading.trim() || `Department ${index + 1}`,
              color_hex: defaultCategoryColor,
              created_by_user_id: userId,
              element_config: item.description.trim() ? { description: item.description.trim() } : null,
              pos_x: origin.x,
              pos_y: origin.y,
              width: processHeadingWidth,
              height: processHeadingHeight,
            };
          }, items.length);
          return;
        }
        const stepId = payload.step;
        const items = payload.items.filter((item) => isFilled(item.positionTitle) || isFilled(item.occupantName) || isFilled(item.roleId));
        await createGroupAndInsert(stepId, wizardGroupHeadingByStep[stepId], orgChartPersonWidth, orgChartPersonHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "person",
            heading: item.positionTitle.trim() || "Position Title",
            color_hex: null,
            created_by_user_id: userId,
            element_config: {
              display_variant: "org_chart",
              position_title: item.positionTitle.trim() || "Position Title",
              role_id: item.roleId.trim(),
              department: "",
              occupant_name: item.occupantName.trim(),
              start_date: "",
              employment_type: item.employmentType,
              acting_name: "",
              acting_start_date: "",
              recruiting: false,
              contractor_role: item.employmentType === "contractor",
              proposed_role: item.proposedRole,
            },
            pos_x: origin.x,
            pos_y: origin.y,
            width: orgChartPersonWidth,
            height: orgChartPersonHeight,
          };
        }, items.length);
        return;
      }

      if (payload.category === "process_flow") {
        if (payload.step === "lanes") {
          const items = payload.items.filter((item) => isFilled(item.heading) || isFilled(item.description));
          await createGroupAndInsert("lanes", wizardGroupHeadingByStep.lanes, processHeadingWidth, processHeadingHeight, (origin, index) => {
            const item = items[index];
            return {
              map_id: mapId,
              element_type: "category",
              heading: item.heading.trim() || `Lane ${index + 1}`,
              color_hex: defaultCategoryColor,
              created_by_user_id: userId,
              element_config: item.description.trim() ? { description: item.description.trim() } : null,
              pos_x: origin.x,
              pos_y: origin.y,
              width: processHeadingWidth,
              height: processHeadingHeight,
            };
          }, items.length);
          return;
        }
        if (payload.step === "steps") {
          const items = payload.items.filter((item) => isFilled(item.heading) || isFilled(item.description));
          await createGroupAndInsert("steps", wizardGroupHeadingByStep.steps, processComponentWidth, processComponentElementHeight, (origin, index) => {
            const item = items[index];
            const dimensions =
              item.kind === "shape_rectangle"
                ? { width: shapeRectangleDefaultWidth, height: shapeRectangleDefaultHeight }
                : item.kind === "shape_pill"
                  ? { width: shapePillDefaultWidth, height: shapePillDefaultHeight }
                  : { width: processComponentWidth, height: processComponentElementHeight };
            return {
              map_id: mapId,
              element_type: item.kind,
              heading: item.heading.trim() || `Step ${index + 1}`,
              color_hex: item.kind === "process_component" ? null : shapeDefaultFillColor,
              created_by_user_id: userId,
              element_config:
                item.kind === "process_component"
                  ? { body: item.description.trim() }
                  : { bold: false, italic: false, underline: false, align: "center", font_size: 24, fill_mode: "fill" },
              pos_x: origin.x,
              pos_y: origin.y,
              width: dimensions.width,
              height: dimensions.height,
            };
          }, items.length);
          return;
        }
        if (payload.step === "inputs-outputs") {
          const items = payload.items.filter((item) => isFilled(item.heading) || isFilled(item.description));
          await createGroupAndInsert("inputs-outputs", wizardGroupHeadingByStep["inputs-outputs"], shapeRectangleDefaultWidth, shapeRectangleDefaultHeight, (origin, index) => {
            const item = items[index];
            return {
              map_id: mapId,
              element_type: "shape_rectangle",
              heading: item.heading.trim() || `Input / Output ${index + 1}`,
              color_hex: shapeDefaultFillColor,
              created_by_user_id: userId,
              element_config: { bold: false, italic: false, underline: false, align: "center", font_size: 24, fill_mode: "fill", description: item.description.trim() },
              pos_x: origin.x,
              pos_y: origin.y,
              width: shapeRectangleDefaultWidth,
              height: shapeRectangleDefaultHeight,
            };
          }, items.length);
          return;
        }
        if (payload.step === "roles") {
          await createCompactPeople(wizardGroupHeadingByStep.roles, "roles", payload.items);
          return;
        }
      }

      if (payload.step === "sequence") {
        const items = (payload.items as any[]).filter((item) => isFilled(item.heading) || isFilled(item.description) || isFilled(item.timestamp) || isFilled(item.location));
        await createGroupAndInsert("sequence", wizardGroupHeadingByStep.sequence, incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_sequence_step",
            heading: item.heading.trim() || `Sequence Step ${index + 1}`,
            color_hex: "#bfdbfe",
            created_by_user_id: userId,
            element_config: { description: item.description.trim(), timestamp: item.timestamp.trim(), location: item.location.trim() },
            pos_x: origin.x,
            pos_y: origin.y,
            width: incidentCardWidth,
            height: incidentCardHeight,
          };
        }, items.length);
        return;
      }

      if (payload.step === "people") {
        const items = (payload.items as any[]).filter((item) => isFilled(item.roleName) || isFilled(item.occupantName));
        await createGroupAndInsert("people", wizardGroupHeadingByStep.people, personElementWidth, personElementHeight, (origin, index) => {
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
        const items = (payload.items as any[]).filter((item) => isFilled(item.heading) || isFilled(item.description) || isFilled(item.environmentalContext));
        await createGroupAndInsert("task-condition", wizardGroupHeadingByStep["task-condition"], incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_task_condition",
            heading: item.heading.trim() || `Task / Condition ${index + 1}`,
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
        const items = (payload.items as any[]).filter((item) => isFilled(item.heading) || isFilled(item.description) || isFilled(item.category));
        await createGroupAndInsert("factors", wizardGroupHeadingByStep.factors, incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          if (item.kind === "incident_system_factor") {
            return {
              map_id: mapId,
              element_type: "incident_system_factor",
              heading: item.heading.trim() || `System Factor ${index + 1}`,
              color_hex: "#a78bfa",
              created_by_user_id: userId,
              element_config: { description: item.description.trim(), category: item.category.trim(), cause_level: item.classification },
              pos_x: origin.x,
              pos_y: origin.y,
              width: incidentCardWidth,
              height: incidentCardHeight,
            };
          }
          return {
            map_id: mapId,
            element_type: "incident_factor",
            heading: item.heading.trim() || `Factor ${index + 1}`,
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
        const items = (payload.items as any[]).filter((item) => isFilled(item.heading) || isFilled(item.description) || isFilled(item.controlType) || isFilled(item.ownerText));
        await createGroupAndInsert("control-barrier", wizardGroupHeadingByStep["control-barrier"], incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_control_barrier",
            heading: item.heading.trim() || `Control / Barrier ${index + 1}`,
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
        const items = (payload.items as any[]).filter((item) => isFilled(item.heading) || isFilled(item.description) || isFilled(item.evidenceType) || isFilled(item.source));
        await createGroupAndInsert("evidence", wizardGroupHeadingByStep.evidence, incidentCardWidth, incidentCardHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_evidence",
            heading: item.heading.trim() || `Evidence ${index + 1}`,
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

      if (payload.step === "finding") {
        const items = (payload.items as any[]).filter((item) => isFilled(item.heading) || isFilled(item.description));
        await createGroupAndInsert("finding", wizardGroupHeadingByStep.finding, bowtieDefaultWidth, bowtieControlHeight, (origin, index) => {
          const item = items[index];
          return {
            map_id: mapId,
            element_type: "incident_finding",
            heading: item.heading.trim() || `Finding ${index + 1}`,
            color_hex: "#1d4ed8",
            created_by_user_id: userId,
            element_config: { description: item.description.trim(), confidence_level: item.confidenceLevel },
            pos_x: origin.x,
            pos_y: origin.y,
            width: bowtieDefaultWidth,
            height: bowtieControlHeight,
          };
        }, items.length);
        return;
      }

      const items = (payload.items as any[]).filter((item) => isFilled(item.heading) || isFilled(item.description) || isFilled(item.ownerText) || isFilled(item.dueDate));
      await createGroupAndInsert("recommendation", wizardGroupHeadingByStep.recommendation, incidentCardWidth, incidentCardHeight, (origin, index) => {
        const item = items[index];
        return {
          map_id: mapId,
          element_type: "incident_recommendation",
          heading: item.heading.trim() || `Recommendation ${index + 1}`,
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
      addDocumentTypes,
      bowtieControlHeight,
      bowtieDefaultWidth,
      bowtieHazardHeight,
      bowtieRiskRatingHeight,
      bowtieSquareHeight,
      buildPersonHeading,
      buildWizardGroupLayout,
      canUseWizard,
      defaultCategoryColor,
      defaultHeight,
      defaultWidth,
      findExistingWizardGroup,
      findWizardGroupElements,
      getNextWizardGroupPosition,
      insertDocumentNodes,
      insertCanvasElements,
      isLandscapeTypeName,
      landscapeDefaultHeight,
      landscapeDefaultWidth,
      mapId,
      minorGridSize,
      orgChartPersonHeight,
      orgChartPersonWidth,
      personElementHeight,
      personElementWidth,
      processComponentElementHeight,
      processComponentWidth,
      processHeadingHeight,
      processHeadingWidth,
      shapeDefaultFillColor,
      shapePillDefaultHeight,
      shapePillDefaultWidth,
      shapeRectangleDefaultHeight,
      shapeRectangleDefaultWidth,
      snapToMinorGrid,
      systemCircleDiameter,
      systemCircleElementHeight,
      updateCanvasElements,
      userEmail,
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
    allowGroupingTargets,
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
        .filter((el) => isOrgChartPersonElement(el))
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
      const source = resolvePersonByAnyRef([
        r.source_system_element_id,
        r.from_node_id,
      ]);
      const target = resolvePersonByAnyRef([
        r.target_system_element_id,
        r.to_node_id,
      ]);
      if (!source || !target) return;
      if (source.id === target.id) return;
      const leaderId = source.pos_y <= target.pos_y ? source.id : target.id;
      counts.set(leaderId, (counts.get(leaderId) ?? 0) + 1);
    });
    return counts;
  }, [elements, mapCategoryId, relations]);
  useEffect(() => {
    if (mapCategoryId !== "org_chart") return;
    const personElements = elements.filter((el) => isOrgChartPersonElement(el));
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
      .filter((el) => isOrgChartPersonElement(el))
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
      .map(({ haystack: _ignore, ...candidate }) => candidate)
      .sort((a, b) => a.nameLine.localeCompare(b.nameLine));
  }, [alreadyRelatedSystemTargetIds, elements, mapCategoryId, relationshipSourceSystemId, relationshipSystemQuery]);
  const orgDirectReportSourceLabel = useMemo(() => {
    if (!relationshipSourceSystemId || mapCategoryId !== "org_chart") return "";
    const source = elements.find((el) => el.id === parseProcessFlowId(relationshipSourceSystemId) && isOrgChartPersonElement(el));
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
  const handleSaveBowtieElement = useCallback(async (options?: { closeAfterSave?: boolean }) => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    if (!selectedBowtieElement) return;
    const elementType = selectedBowtieElement.element_type;
    const nextConfig: Record<string, unknown> = { ...bowtieDraft };
    const defaultLabel = methodologyDefaultLabelByType[elementType] ?? "Node";
    let nextHeading = defaultLabel;
    if (isDescriptionDrivenMethodologyType(elementType)) {
      const persistedHeading = String(selectedBowtieElement.heading ?? "").trim();
      nextConfig.description = String(nextConfig.description ?? "").trim() || persistedHeading || defaultLabel;
    }
    if (elementType === "bowtie_risk_rating") {
      const likelihood = String(nextConfig.likelihood || "possible");
      const consequence = String(nextConfig.consequence || "moderate");
      const riskLevel = calculateRiskLevel(likelihood, consequence);
      nextConfig.risk_level = riskLevel;
      nextHeading = `${riskLevel.charAt(0).toUpperCase()}${riskLevel.slice(1)}`;
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
    if (options?.closeAfterSave !== false) setSelectedBowtieElementId(null);
  }, [
    canWriteMap,
    selectedBowtieElement,
    bowtieDraft,
    calculateRiskLevel,
    mapId,
    setError,
    setElements,
    canvasElementSelectColumns,
    evidenceUploadFile,
    evidenceUploadPreviewUrl,
    setSelectedBowtieElementId,
  ]);
  const closeAddRelationshipModal = useCallback(() => {
    setShowAddRelationship(false);
    setRelationshipSourceNodeId(null);
    setRelationshipSourceSystemId(null);
    setRelationshipSourceGroupingId(null);
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
  }, []);
  const closeDesktopDrilldownPanels = useCallback(() => {
    setDesktopNodeAction(null);
    closeAddRelationshipModal();
    setOutlineNodeId(null);
    setConfirmDeleteNodeId(null);
    setConfirmDeleteOutlineItemId(null);
    setOutlineCreateMode(null);
    setOutlineEditItemId(null);
    setEditHeadingTitle("");
    setEditHeadingLevel(1);
    setEditHeadingParentId("");
    setEditContentHeadingId("");
    setEditContentText("");
  }, [closeAddRelationshipModal]);
  const closeAllLeftAsidesImmediate = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedProcessId(null);
    setSelectedSystemId(null);
    setSelectedProcessComponentId(null);
    setSelectedPersonId(null);
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
    (source: { nodeId?: string | null; systemId?: string | null; groupingId?: string | null }) => {
      setRelationshipSourceNodeId(source.nodeId ?? null);
      setRelationshipSourceSystemId(source.systemId ?? null);
      setRelationshipSourceGroupingId(source.groupingId ?? null);
      setRelationshipDocumentQuery("");
      setRelationshipSystemQuery("");
      setRelationshipGroupingQuery("");
      setRelationshipTargetDocumentId("");
      setRelationshipTargetSystemId("");
      setRelationshipTargetGroupingId("");
      setShowRelationshipDocumentOptions(false);
      setShowRelationshipSystemOptions(false);
      setShowRelationshipGroupingOptions(false);
      setRelationshipDescription("");
      setRelationshipDisciplineSelection([]);
      setShowRelationshipDisciplineMenu(false);
      setRelationshipCategory(getDefaultRelationshipCategoryForMap(mapCategoryId));
      setRelationshipCustomType("");
      setShowAddRelationship(true);
      setDesktopNodeAction("relationship");
    },
    []
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
    const sourcePerson = elements.find((el) => el.id === sourceId && isOrgChartPersonElement(el));
    const targetPerson = elements.find((el) => el.id === targetId && isOrgChartPersonElement(el));
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
  const dismissLeftAsides = useCallback(async (options?: { saveBeforeClose?: boolean }) => {
    if (options?.saveBeforeClose) {
      if (selectedNodeId && hasUnsavedDocumentDraftChanges) return void (await handleSaveNode());
      if (selectedProcessId && hasUnsavedProcessDraftChanges) return void (await handleSaveProcessHeading());
      if (selectedSystemId && hasUnsavedSystemDraftChanges) return void (await handleSaveSystemName());
      if (selectedProcessComponentId && hasUnsavedProcessComponentDraftChanges) return void (await handleSaveProcessComponent());
      if (selectedPersonId && hasUnsavedPersonDraftChanges) return void (await handleSavePerson());
      if (selectedGroupingId && hasUnsavedGroupingDraftChanges) return void (await handleSaveGroupingContainer());
      if (selectedStickyId && hasUnsavedStickyDraftChanges) return void (await handleSaveStickyNote());
      if (selectedImageId && hasUnsavedImageDraftChanges) return void (await handleSaveImageAsset());
      if (selectedTextBoxId && hasUnsavedTextBoxDraftChanges) return void (await handleSaveTextBox());
      if (selectedTableId && hasUnsavedTableDraftChanges) return void (await handleSaveTable());
      if (selectedFlowShapeId && hasUnsavedFlowShapeDraftChanges) return void (await handleSaveFlowShape());
      if (selectedBowtieElementId && hasUnsavedBowtieDraftChanges) return void (await handleSaveBowtieElement());
    }
    closeAllLeftAsidesImmediate();
  }, [
    closeAllLeftAsidesImmediate,
    selectedNodeId,
    selectedProcessId,
    selectedSystemId,
    selectedProcessComponentId,
    selectedPersonId,
    selectedGroupingId,
    selectedStickyId,
    selectedImageId,
    selectedTextBoxId,
    selectedTableId,
    selectedFlowShapeId,
    selectedBowtieElementId,
    hasUnsavedDocumentDraftChanges,
    hasUnsavedProcessDraftChanges,
    hasUnsavedSystemDraftChanges,
    hasUnsavedProcessComponentDraftChanges,
    hasUnsavedPersonDraftChanges,
    hasUnsavedGroupingDraftChanges,
    hasUnsavedStickyDraftChanges,
    hasUnsavedImageDraftChanges,
    hasUnsavedTextBoxDraftChanges,
    hasUnsavedTableDraftChanges,
    hasUnsavedFlowShapeDraftChanges,
    hasUnsavedBowtieDraftChanges,
    handleSaveNode,
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
    handleSaveBowtieElement,
  ]);
  const handleCloseDocumentPropertiesPanel = useCallback(() => {
    void dismissLeftAsides({ saveBeforeClose: true });
  }, [dismissLeftAsides]);
  const closeAllLeftAsides = useCallback(() => {
    void dismissLeftAsides({ saveBeforeClose: true });
  }, [dismissLeftAsides]);
  useEffect(() => {
    if (isMobile) return;
    const hasOpenPropertyAside =
      !!selectedNodeId ||
      !!selectedProcessId ||
      !!selectedSystemId ||
      !!selectedProcessComponentId ||
      !!selectedPersonId ||
      !!selectedStickyId ||
      !!selectedImageId ||
      !!selectedTextBoxId ||
      !!selectedTableId ||
      !!selectedFlowShapeId ||
      !!selectedBowtieElementId ||
      !!selectedGroupingId;
    if (!hasOpenPropertyAside) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-left-aside='true']")) return;
      void dismissLeftAsides({ saveBeforeClose: true });
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [
    isMobile,
    selectedNodeId,
    selectedProcessId,
    selectedSystemId,
    selectedProcessComponentId,
    selectedPersonId,
    selectedStickyId,
    selectedImageId,
    selectedTextBoxId,
    selectedTableId,
    selectedFlowShapeId,
    selectedBowtieElementId,
    selectedGroupingId,
    dismissLeftAsides,
  ]);
  const { handleDeleteProcessElement, handleDeleteSelectedComponents } = useCanvasDeleteSelectionActions({
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
    if (selectedNodeId) return;
    closeDesktopDrilldownPanels();
  }, [selectedNodeId, isMobile, closeDesktopDrilldownPanels]);

  const { handlePaneClickClearSelection, handlePaneMouseDown } = useCanvasPaneSelectionActions({
    rf,
    flowNodes,
    getFlowNodeBounds,
    canUseContextMenu,
    canWriteMap,
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
    }),
    [
      cancelEditRelation,
      disciplineLabelByKey,
      disciplineOptions,
      editingRelationCategory,
      editingRelationCustomType,
      editingRelationDescription,
      editingRelationDisciplines,
      editingRelationId,
      handleDeleteRelation,
      handleUpdateRelation,
      relationshipCategoryOptions,
      setEditingRelationCategory,
      setEditingRelationCustomType,
      setEditingRelationDescription,
      setEditingRelationDisciplines,
      setShowEditingRelationDisciplineMenu,
      showEditingRelationDisciplineMenu,
      startEditRelation,
    ]
  );

  if (loading) {
    return <SystemMapLoadingView progress={loadingProgress} message={loadingMessage} />;
  }

  if (!map) {
    return <div className="flex min-h-screen items-center justify-center text-rose-700">{error || "Map not found."}</div>;
  }

  return (
    <div className="flex h-svh min-h-svh flex-col bg-stone-50 md:min-h-screen md:h-dvh">
      <MapCanvasHeader
        map={map}
        mapRole={mapRole}
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
      />

      <CanvasActionButtons
        isMobile={isMobile}
        backHref={backHref}
        backTitle={backLabel}
        showMapInfoAside={showMapInfoAside}
        onToggleMapInfo={handleToggleMapInfoAside}
        rf={rf}
        setShowAddMenu={setShowAddMenu}
        showAddMenu={showAddMenu}
        addMenuRef={addMenuRef}
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
        canPrint
        printDisabledReason={undefined}
        canvasLocked={canvasLocked}
        onToggleCanvasLock={() => setCanvasLocked((prev) => !prev)}
        canvasLockTitle={canvasLockTitle}
        onOpenWizard={() => {
          if (!canUseWizard) return;
          setShowWizardModal(true);
        }}
        canCreateSticky={canCreateSticky}
        handleAddBlankDocument={handleAddBlankDocument}
        handleAddSystemCircle={handleAddSystemCircle}
        handleAddProcessComponent={handleAddProcessComponent}
        handleAddPerson={handleAddPerson}
        handleAddOrgChartPerson={handleAddOrgChartPerson}
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
        handleAddIncidentFinding={handleAddIncidentFinding}
        handleAddIncidentRecommendation={handleAddIncidentRecommendation}
        allowedNodeKinds={allowedNodeKinds}
        canSaveTemplate={false}
        isPlatformAdmin={false}
        saveAsGlobalTemplate={false}
        setSaveAsGlobalTemplate={() => undefined}
        templateDisabledReason={undefined}
        showTemplateMenu={false}
        setShowTemplateMenu={() => undefined}
        templateMenuRef={addMenuRef}
        templateQuery=""
        setTemplateQuery={() => undefined}
        templateResults={[]}
        isLoadingTemplates={false}
        isSavingTemplate={false}
        templateSaveMessage={null}
        onSelectTemplate={() => undefined}
        onSaveTemplate={() => undefined}
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
        categoryId={mapCategoryId}
        documentTypeOptions={addDocumentTypes.map((type) => ({ id: type.id, name: getDisplayTypeName(type.name) }))}
        existingDocumentOptions={nodes.map((node) => ({
          id: node.id,
          title: node.title?.trim() || "Untitled document",
          subtitle: `${getDisplayTypeName(typesById.get(node.type_id)?.name ?? "Document")}${node.document_number ? ` | ${node.document_number}` : ""}`,
        }))}
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

      <MapInfoAside
        isMobile={isMobile}
        showMapInfoAside={showMapInfoAside}
        mapInfoAsideRef={mapInfoAsideRef}
        handleCloseMapInfoAside={handleCloseMapInfoAside}
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
        userId={userId}
        userEmail={userEmail}
        savingMemberRoleUserId={savingMemberRoleUserId}
        handleUpdateMapMemberRole={handleUpdateMapMemberRole}
        mapRoleLabel={mapRoleLabel}
      />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={canvasRef}
          className={`h-full w-full bg-stone-50 ${canvasLocked ? "[&_.react-flow__edge]:pointer-events-none [&_.react-flow__node]:pointer-events-none" : ""}`}
          onMouseDown={handlePaneMouseDown}
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            setMobileNodeMenuId(null);
            setShowAddMenu(false);
          }}
        >
          <ReactFlow
            nodes={interactionFlowNodes}
            edges={flowEdges}
            nodeTypes={flowNodeTypes}
            edgeTypes={flowEdgeTypes}
            onlyRenderVisibleElements
            elementsSelectable={!canvasLocked}
            nodesConnectable={false}
            edgesReconnectable={false}
            nodesFocusable={false}
            edgesFocusable={false}
            onInit={(instance) => setRf({ fitView: instance.fitView, screenToFlowPosition: instance.screenToFlowPosition, setViewport: instance.setViewport })}
            onNodesChange={handleFlowNodesChange}
            onNodeClick={(event, n) => {
              if (canvasLocked) return;
              handleCanvasNodeClick({
                event,
                node: n,
                mapRole,
                elements,
                canEditElement,
                isMobile,
                lastMobileTapRef,
                setSelectedFlowIds,
                setSelectedNodeId,
                setSelectedProcessId,
                setSelectedSystemId,
                setSelectedProcessComponentId,
                setSelectedPersonId,
                setSelectedGroupingId,
                setSelectedStickyId,
                setSelectedImageId,
                setSelectedTextBoxId,
                setSelectedTableId,
                setSelectedFlowShapeId,
                setSelectedBowtieElementId,
                setMobileNodeMenuId,
              });
            }}
            onNodeContextMenu={(e, n) => {
              if (canvasLocked) return;
              if (!canUseContextMenu) return;
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
              handlePaneClickClearSelection();
            }}
            onPaneContextMenu={(e) => {
              if (!canUseContextMenu) return;
              e.preventDefault();
            }}
            onNodeMouseEnter={(_, n) => {
              if (canvasLocked) return;
              scheduleHoveredNodeId(n.id);
            }}
            onNodeMouseLeave={() => scheduleHoveredNodeId(null)}
            onNodeDragStart={() => {
              if (canvasLocked) return;
              isNodeDragActiveRef.current = true;
              setIsNodeDragActive(true);
            }}
            onNodeDragStop={(event, node) => {
              if (canvasLocked) return;
              void onNodeDragStop(event, node).finally(() => {
                isNodeDragActiveRef.current = false;
                setIsNodeDragActive(false);
              });
            }}
            onMoveEnd={onMoveEnd}
            nodesDraggable={!canvasLocked}
            onEdgeMouseEnter={(_, edge) => scheduleHoveredEdgeId(edge.id)}
            onEdgeMouseLeave={() => scheduleHoveredEdgeId(null)}
            onEdgeClick={(event, edge) => {
              if (canvasLocked) return;
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
            zoomOnScroll
            snapToGrid
            snapGrid={[minorGridSize, minorGridSize]}
            minZoom={0.2}
            maxZoom={2}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ backgroundColor: "#fafaf9" }}
          >
            <Background id="minor" variant={BackgroundVariant.Lines} gap={minorGridSize} size={1} color="#e7e5e4" />
            <Background id="major" variant={BackgroundVariant.Lines} gap={majorGridSize} size={1.2} color="#d6d3d1" />
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
            if (!mobileNodeMenuId) return;
            setRelationshipSourceNodeId(mobileNodeMenuId);
            setRelationshipSourceSystemId(null);
            setRelationshipSourceGroupingId(null);
            setRelationshipDocumentQuery("");
            setRelationshipSystemQuery("");
            setRelationshipGroupingQuery("");
            setRelationshipTargetDocumentId("");
            setRelationshipTargetSystemId("");
            setRelationshipTargetGroupingId("");
            setShowRelationshipDocumentOptions(false);
            setShowRelationshipSystemOptions(false);
            setShowRelationshipGroupingOptions(false);
            setRelationshipDescription("");
            setRelationshipDisciplineSelection([]);
            setShowRelationshipDisciplineMenu(false);
            setRelationshipCategory(getDefaultRelationshipCategoryForMap(mapCategoryId));
            setRelationshipCustomType("");
            setShowAddRelationship(true);
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
            if (!mobileNodeMenuId) return;
            setConfirmDeleteNodeId(mobileNodeMenuId);
            setMobileNodeMenuId(null);
          }}
          onClose={() => setMobileNodeMenuId(null)}
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
          allowGroupingTargets={allowGroupingTargets}
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
          relationshipCategoryGroups={relationshipCategoryGroups}
          relationshipCategoryOptions={relationshipCategoryOptions}
          relationshipCustomType={relationshipCustomType}
          setRelationshipCustomType={setRelationshipCustomType}
          relationshipDescription={relationshipDescription}
          setRelationshipDescription={setRelationshipDescription}
          relationshipTargetDocumentId={relationshipTargetDocumentId}
          relationshipTargetSystemId={relationshipTargetSystemId}
          relationshipTargetGroupingId={relationshipTargetGroupingId}
          onCancel={closeAddRelationshipModal}
          onAdd={handleAddRelation}
        />

        <CanvasConfirmDialogs
          confirmDeleteNodeId={confirmDeleteNodeId}
          isMobile={isMobile}
          setConfirmDeleteNodeId={setConfirmDeleteNodeId}
          handleDeleteNode={handleDeleteNode}
          confirmDeleteOutlineItemId={confirmDeleteOutlineItemId}
          setConfirmDeleteOutlineItemId={setConfirmDeleteOutlineItemId}
          handleDeleteOutlineItem={handleDeleteOutlineItem}
        />

        <CanvasElementPropertyOverlays
          categoryProps={{
            open: !!selectedProcess,
            isMobile,
            leftAsideSlideIn,
            processMinWidthSquares,
            processMinHeightSquares,
            processHeadingDraft,
            setProcessHeadingDraft,
            processWidthDraft,
            setProcessWidthDraft,
            processHeightDraft,
            setProcessHeightDraft,
            categoryColorOptions,
            processColorDraft,
            setProcessColorDraft,
            onDelete: async () => {
              if (!selectedProcess) return;
              await handleDeleteProcessElement(selectedProcess.id);
            },
            onSave: handleSaveProcessHeading,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
          }}
          systemProps={{
            open: !!selectedSystem,
            isMobile,
            leftAsideSlideIn,
            systemNameDraft,
            setSystemNameDraft,
            onDelete: async () => {
              if (!selectedSystem) return;
              await handleDeleteProcessElement(selectedSystem.id);
            },
            onSave: handleSaveSystemName,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
            onAddRelationship: () => {
              if (!selectedSystem) return;
              openAddRelationshipFromSource({ systemId: selectedSystem.id });
            },
            relatedRows: relatedSystemRows,
            resolveLabels: resolveDocumentRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
          }}
          processProps={{
            open: !!selectedProcessComponent,
            isMobile,
            leftAsideSlideIn,
            processComponentLabelDraft,
            setProcessComponentLabelDraft,
            onDelete: async () => {
              if (!selectedProcessComponent) return;
              await handleDeleteProcessElement(selectedProcessComponent.id);
            },
            onSave: handleSaveProcessComponent,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
            onAddRelationship: () => {
              if (!selectedProcessComponent) return;
              openAddRelationshipFromSource({ systemId: selectedProcessComponent.id });
            },
            relatedRows: relatedProcessComponentRows,
            resolveLabels: resolveDocumentRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
          }}
          personProps={{
            open: !!selectedPerson,
            isMobile,
            leftAsideSlideIn,
            mapCategoryId,
            selectedPersonElementType: selectedPerson ? (isOrgChartPersonElement(selectedPerson) ? "org_chart_person" : "person") : null,
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
            orgChartDepartmentOptions,
            onDelete: async () => {
              if (!selectedPerson) return;
              await handleDeleteProcessElement(selectedPerson.id);
            },
            onSave: handleSavePerson,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
            onAddRelationship: () => {
              if (!selectedPerson) return;
              openAddRelationshipFromSource({ systemId: selectedPerson.id });
            },
            relatedRows: relatedPersonRows,
            resolveLabels: resolvePersonRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
          }}
          bowtieProps={{
            open: !!selectedBowtieElement,
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
                    | "incident_finding"
                    | "incident_recommendation")
                : null,
            bowtieHeadingDraft,
            setBowtieHeadingDraft,
            bowtieDraft,
            setBowtieDraft,
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
            onSave: handleSaveBowtieElement,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
            onAddRelationship: () => {
              if (!selectedBowtieElement) return;
              openAddRelationshipFromSource({ systemId: selectedBowtieElement.id });
            },
            relatedRows: relatedBowtieRows,
            resolveLabels: resolvePersonRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
          }}
          groupingProps={{
            open: !!selectedGrouping,
            isMobile,
            leftAsideSlideIn,
            groupingLabelDraft,
            setGroupingLabelDraft,
            groupingWidthDraft,
            setGroupingWidthDraft,
            groupingHeightDraft,
            setGroupingHeightDraft,
            onDelete: async () => {
              if (!selectedGrouping) return;
              await handleDeleteProcessElement(selectedGrouping.id);
            },
            onSave: handleSaveGroupingContainer,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
            onAddRelationship: () => {
              if (!selectedGrouping) return;
              openAddRelationshipFromSource({ groupingId: selectedGrouping.id });
            },
            relatedRows: relatedGroupingRows,
            resolveLabels: resolveGroupingRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
          }}
          stickyProps={{
            open: !!selectedSticky,
            isMobile,
            leftAsideSlideIn,
            stickyTextDraft,
            setStickyTextDraft,
            onDelete: async () => {
              if (!selectedSticky) return;
              await handleDeleteProcessElement(selectedSticky.id);
            },
            onSave: handleSaveStickyNote,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
          }}
          imageProps={{
            open: !!selectedImage,
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
            onSave: handleSaveImageAsset,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
            onAddRelationship: () => {
              if (!selectedImage) return;
              openAddRelationshipFromSource({ systemId: selectedImage.id });
            },
            relatedRows: relatedImageRows,
            resolveLabels: resolvePersonRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
          }}
          textBoxProps={{
            open: !!selectedTextBox,
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
            onDelete: async () => {
              if (!selectedTextBox) return;
              await handleDeleteProcessElement(selectedTextBox.id);
              setSelectedTextBoxId(null);
            },
            onSave: handleSaveTextBox,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
          }}
          tableProps={{
            open: !!selectedTable,
            isMobile,
            leftAsideSlideIn,
            tableRowsDraft,
            setTableRowsDraft,
            tableColumnsDraft,
            setTableColumnsDraft,
            tableHeaderBgDraft,
            setTableHeaderBgDraft,
            tableHeaderFillModeDraft,
            setTableHeaderFillModeDraft,
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
            onSave: handleSaveTable,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
          }}
          flowShapeProps={{
            open: !!selectedFlowShape,
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
            onSave: handleSaveFlowShape,
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
          }}
          documentProps={{
            open: !!selectedNode && !isMobile,
            leftAsideSlideIn,
            onClose: handleCloseDocumentPropertiesPanel,
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
              setDesktopNodeAction("delete");
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
            onSaveNode: handleSaveNode,
            relatedRows,
            resolveLabels: resolveDocumentRelationLabels,
            relationshipSectionProps: sharedRelationshipSectionProps,
          }}
        />
        <CanvasDrilldownOverlays
          orgChartDirectReportAsideProps={{
            open: Boolean(mapCategoryId === "org_chart" && !isMobile && desktopNodeAction === "relationship" && showAddRelationship),
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
            onAdd: handleAddOrgDirectReport,
            onCancel: () => {
              closeAddRelationshipModal();
              setDesktopNodeAction(null);
            },
          }}
          addRelationshipAsideProps={{
            open: Boolean(mapCategoryId !== "org_chart" && !isMobile && desktopNodeAction === "relationship" && showAddRelationship),
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
            allowGroupingTargets,
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
            relationshipCategoryGroups,
            relationshipCategoryOptions,
            relationshipCustomType,
            setRelationshipCustomType,
            relationshipDescription,
            setRelationshipDescription,
            relationshipTargetDocumentId,
            relationshipTargetSystemId,
            relationshipTargetGroupingId,
            onAdd: async () => {
              await handleAddRelation();
              setDesktopNodeAction(null);
            },
            onCancel: () => {
              closeAddRelationshipModal();
              setDesktopNodeAction(null);
            },
          }}
          deleteDocumentAsideProps={{
            open: Boolean(selectedNode && !isMobile && desktopNodeAction === "delete" && !!confirmDeleteNodeId),
            onDelete: async () => {
              const id = confirmDeleteNodeId;
              setConfirmDeleteNodeId(null);
              setDesktopNodeAction(null);
              if (!id) return;
              await handleDeleteNode(id);
            },
            onCancel: () => {
              setConfirmDeleteNodeId(null);
              setDesktopNodeAction(null);
            },
          }}
          mobileDocumentPropertiesModalProps={{
            open: Boolean(selectedNode && isMobile),
            onClose: () => void dismissLeftAsides({ saveBeforeClose: true }),
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
            onSaveNode: handleSaveNode,
            relatedItems: mobileRelatedItems,
            onDeleteRelation: handleDeleteRelation,
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
}: {
  mapId: string;
  showWelcomeOnLoad?: boolean;
}) {
  return (
    <ReactFlowProvider>
      <SystemMapCanvasInner mapId={mapId} showWelcomeOnLoad={showWelcomeOnLoad} />
    </ReactFlowProvider>
  );
}

