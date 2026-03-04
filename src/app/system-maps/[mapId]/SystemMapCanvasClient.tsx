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
import {
  A4_RATIO,
  bowtieControlHeight,
  bowtieDefaultWidth,
  bowtieHazardHeight,
  bowtieRiskRatingHeight,
  bowtieSquareHeight,
  incidentDefaultWidth,
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
import { handleCanvasNodeClick } from "./canvasNodeClickHandler";
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
const canvasElementSelectColumns =
  "id,map_id,element_type,heading,color_hex,created_by_user_id,element_config,pos_x,pos_y,width,height,created_at,updated_at";
const isMethodologyElementType = (elementType: string) =>
  elementType.startsWith("bowtie_") || elementType.startsWith("incident_");

function SystemMapCanvasInner({ mapId }: { mapId: string }) {
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
  const lastMobileTapRef = useRef<{ id: string; ts: number } | null>(null);
  const clipboardPasteCountRef = useRef(1);
  const isNodeDragActiveRef = useRef(false);
  const imagePathPairsRef = useRef<Array<{ id: string; path: string }>>([]);

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
  const [isNodeDragActive, setIsNodeDragActive] = useState(false);
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewImageDataUrl, setPrintPreviewImageDataUrl] = useState<string | null>(null);
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("portrait");
  const [printSelectionMode, setPrintSelectionMode] = useState(false);
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
  const canWriteMap = mapRole === "partial_write" || mapRole === "full_write";
  const canManageMapMetadata = mapRole === "full_write" && !!map && !!userId && map.owner_id === userId;
  const canUseContextMenu = mapRole !== "read";
  const canCreateSticky = !!userId;
  const allowedNodeKinds = useMemo(() => getAllowedNodeKindsForCategory(mapCategoryId), [mapCategoryId]);
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
  const exitPrintSelectionMode = useCallback(() => {
    setPrintSelectionMode(false);
    setPrintSelectionDraft(null);
    setPrintSelectionRect(null);
    setShowPrintSelectionConfirm(false);
  }, []);
  const openPrintPreviewFromDataUrl = useCallback(
    (imageDataUrl: string) => {
      setPrintPreviewImageDataUrl(imageDataUrl);
      setShowPrintPreview(true);
    },
    []
  );
  const capturePrintImage = useCallback(
    async (mode: "current" | "area") => {
      const root = canvasRef.current as HTMLElement | null;
      if (!root) {
        setError("Unable to capture canvas for print.");
        return;
      }
      const target = (root.querySelector(".react-flow") as HTMLElement | null) ?? root;
      const targetBounds = target.getBoundingClientRect();
      const captureWidth = Math.max(1, Math.floor(target.clientWidth || targetBounds.width));
      const captureHeight = Math.max(1, Math.floor(target.clientHeight || targetBounds.height));
      let crop: { x: number; y: number; width: number; height: number } | null = null;
      if (mode === "area") {
        if (!printSelectionRect || printSelectionRect.width < 12 || printSelectionRect.height < 12) {
          setError("Please select a larger area to print.");
          return;
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
      try {
        let dataUrl = "";
        try {
          const htmlToImage = await loadHtmlToImage();
          const fullDataUrl = await htmlToImage.toPng(target, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: "#fafaf9",
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
            backgroundColor: "#fafaf9",
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
        openPrintPreviewFromDataUrl(dataUrl);
      } catch (e) {
        setError((e as Error)?.message || "Unable to prepare print preview.");
      } finally {
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
    setPrintSelectionMode(true);
  }, []);
  const handleConfirmPrintArea = useCallback(async () => {
    setShowPrintSelectionConfirm(false);
    await capturePrintImage("area");
    setPrintSelectionMode(false);
  }, [capturePrintImage]);
  const handlePrintOverlayPointerDown = useCallback((event: { clientX: number; clientY: number }) => {
    if (showPrintSelectionConfirm) return;
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
  const [bowtieHeadingDraft, setBowtieHeadingDraft] = useState("");
  const [bowtieDraft, setBowtieDraft] = useState<Record<string, string | boolean>>({});
  const [imageUrlsByElementId, setImageUrlsByElementId] = useState<Record<string, string>>({});

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
      const el = elements.find((item) => item.id === elementId);
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
      if (el.element_type === "person") {
        const width = mapCategoryId === "org_chart" ? orgChartPersonWidth : personElementWidth;
        const height = mapCategoryId === "org_chart" ? orgChartPersonHeight : personElementHeight;
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
  }, [elements, nodes, getNodeSize, mapCategoryId, minorGridSize, orgChartPersonHeight, orgChartPersonWidth, personElementHeight, personElementWidth]);

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
      return change.type === "dimensions" && typeof change.id === "string" && change.id.startsWith("process:") && !!change.dimensions;
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
  }, [onFlowNodesChange, elementsById, mapId, snapToMinorGrid, canEditElement]);

  useEffect(() => {
    return () => {
      resizePersistTimersRef.current.forEach((timer) => clearTimeout(timer));
      resizePersistTimersRef.current.clear();
      resizePersistValuesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (isNodeDragActiveRef.current) return;
    const directReportCountByPersonNormalizedId = buildOrgDirectReportCountByPersonNormalizedId({
      elements,
      relations,
      mapCategoryId,
    });
    const groupingElements = sortGroupingElementsForRender({
      elements,
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
        ...elements.map((el) => {
          const primaryElementNode = buildPrimaryElementFlowNode({
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
          });
          if (primaryElementNode !== undefined) return primaryElementNode;
          return buildSecondaryElementFlowNode({
            element: el,
            selectedFlowIds,
            canEditElement,
            canWriteMap,
          });
        }).filter(Boolean) as Node<FlowData>[],
      ];
    setFlowNodes(nextNodes);
  }, [nodes, elements, relations, typesById, setFlowNodes, getNodeSize, selectedFlowIds, canWriteMap, canEditElement, memberDisplayNameByUserId, userEmail, userId, formatStickyDate, imageUrlsByElementId, isNodeDragActive]);

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
        elements,
        getNodeSize,
        mapCategoryId,
      }),
    [relations, nodes, elements, getNodeSize, mapCategoryId]
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
    () => (selectedPersonId ? elements.find((el) => el.id === selectedPersonId && el.element_type === "person") ?? null : null),
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
    if (selectedProcess) return `category:${selectedProcess.id}`;
    if (selectedSystem) return `system:${selectedSystem.id}`;
    if (selectedProcessComponent) return `process:${selectedProcessComponent.id}`;
    if (selectedPerson) return `person:${selectedPerson.id}`;
    if (selectedBowtieElement) return `bowtie:${selectedBowtieElement.id}`;
    if (selectedGrouping) return `grouping:${selectedGrouping.id}`;
    if (selectedNode) return `document:${selectedNode.id}`;
    return null;
  }, [isMobile, selectedSticky, selectedImage, selectedTextBox, selectedProcess, selectedSystem, selectedProcessComponent, selectedPerson, selectedBowtieElement, selectedGrouping, selectedNode]);
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

    const run = async (attempt: number) => {
      if (cancelled) return;
      if (attempt === 0) {
        setLoading(true);
        setError(null);
      }
      try {
        const user = await ensurePortalSupabaseUser();
        if (cancelled) return;
        if (!user) {
          window.location.assign(`/login?returnTo=${encodeURIComponent(`/system-maps/${mapId}`)}`);
          return;
        }
        setUserId(user.id);

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
        setMap(loadedMap);
        const nextCategory = (loadedMap.map_category || defaultMapCategoryId) as MapCategoryId;
        setMapCategoryId(nextCategory);
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
      } catch (err) {
        if (cancelled) return;
        if (isAbortLikeError(err) && attempt < 3) {
          retryTimer = setTimeout(() => {
            void run(attempt + 1);
          }, 250);
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Unable to load map.");
      } finally {
        if (!cancelled) setLoading(false);
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
  const imagePathPairs = useMemo(
    () =>
      elements
        .filter((el) => el.element_type === "image_asset")
        .map((el) => {
          const cfg = (el.element_config as Record<string, unknown> | null) ?? {};
          return {
            id: el.id,
            path: typeof cfg.storage_path === "string" ? cfg.storage_path : "",
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
      setImageUrlsByElementId(next);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [imagePathSignature]);
  useEffect(() => {
    if (!selectedBowtieElement) return;
    setBowtieHeadingDraft(selectedBowtieElement.heading ?? "");
    setBowtieDraft((selectedBowtieElement.element_config as Record<string, string | boolean> | null) ?? {});
  }, [selectedBowtieElement]);
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
    handleAddGroupingContainer,
    handleAddStickyNote,
    handleAddTextBox,
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
    elements,
    setSelectedStickyId,
    setSelectedImageId,
    setSelectedTextBoxId,
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
      .map(({ haystack: _ignore, ...candidate }) => candidate)
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
  const handleSaveBowtieElement = useCallback(async () => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    if (!selectedBowtieElement) return;
    const elementType = selectedBowtieElement.element_type;
    const defaultLabelByType: Record<string, string> = {
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
      incident_finding: "Finding",
      incident_recommendation: "Recommendation",
    };
    const nextConfig: Record<string, unknown> = { ...bowtieDraft };
    const isIncidentElement = elementType.startsWith("incident_");
    let nextHeading = isIncidentElement
      ? selectedBowtieElement.heading || defaultLabelByType[elementType] || "Node"
      : bowtieHeadingDraft.trim() || defaultLabelByType[elementType] || "Bow Tie Node";
    if (elementType === "bowtie_risk_rating") {
      const likelihood = String(nextConfig.likelihood || "possible");
      const consequence = String(nextConfig.consequence || "moderate");
      const riskLevel = calculateRiskLevel(likelihood, consequence);
      nextConfig.risk_level = riskLevel;
      if (!bowtieHeadingDraft.trim()) {
        nextHeading = `Risk Level: ${riskLevel.charAt(0).toUpperCase()}${riskLevel.slice(1)}`;
      }
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
    setSelectedBowtieElementId(null);
  }, [canWriteMap, selectedBowtieElement, bowtieDraft, bowtieHeadingDraft, calculateRiskLevel, mapId, setError, setElements, canvasElementSelectColumns]);
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
  const handleCloseDocumentPropertiesPanel = useCallback(() => {
    setSelectedNodeId(null);
    closeDesktopDrilldownPanels();
  }, [closeDesktopDrilldownPanels]);
  const closeAllLeftAsides = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedProcessId(null);
    setSelectedSystemId(null);
    setSelectedProcessComponentId(null);
    setSelectedPersonId(null);
    setSelectedGroupingId(null);
    setSelectedStickyId(null);
    setSelectedImageId(null);
    setSelectedTextBoxId(null);
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
    return <div className="flex min-h-screen items-center justify-center">Loading map...</div>;
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
        showMapInfoAside={showMapInfoAside}
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
        canCreateSticky={canCreateSticky}
        handleAddBlankDocument={handleAddBlankDocument}
        handleAddSystemCircle={handleAddSystemCircle}
        handleAddProcessComponent={handleAddProcessComponent}
        handleAddPerson={handleAddPerson}
        handleAddProcessHeading={handleAddProcessHeading}
        handleAddGroupingContainer={handleAddGroupingContainer}
        handleAddStickyNote={handleAddStickyNote}
        handleStartAddImageAsset={handleStartAddImageAsset}
        handleAddTextBox={handleAddTextBox}
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
        showPrintMenu={showPrintMenu}
        setShowPrintMenu={setShowPrintMenu}
        printMenuRef={printMenuRef}
        onPrintCurrentView={() => void handlePrintCurrentView()}
        onPrintSelectArea={handlePrintSelectArea}
        isPreparingPrint={isPreparingPrint}
      />

      <MapInfoAside
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
          className="h-full w-full bg-stone-50"
          onMouseDown={handlePaneMouseDown}
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
            nodesFocusable={false}
            edgesFocusable={false}
            onInit={(instance) => setRf({ fitView: instance.fitView, screenToFlowPosition: instance.screenToFlowPosition, setViewport: instance.setViewport })}
            onNodesChange={handleFlowNodesChange}
            onNodeClick={(event, n) =>
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
                setSelectedBowtieElementId,
                setMobileNodeMenuId,
              })
            }
            onNodeContextMenu={(e, n) => {
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
            onNodeMouseEnter={(_, n) => scheduleHoveredNodeId(n.id)}
            onNodeMouseLeave={() => scheduleHoveredNodeId(null)}
            onNodeDragStart={() => {
              isNodeDragActiveRef.current = true;
              setIsNodeDragActive(true);
            }}
            onNodeDragStop={(event, node) => {
              void onNodeDragStop(event, node).finally(() => {
                isNodeDragActiveRef.current = false;
                setIsNodeDragActive(false);
              });
            }}
            onMoveEnd={onMoveEnd}
            nodesDraggable
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
            onClose: () => setSelectedProcessId(null),
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
            onClose: () => setSelectedSystemId(null),
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
            onClose: () => setSelectedProcessComponentId(null),
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
            onClose: () => setSelectedPersonId(null),
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
            onDelete: async () => {
              if (!selectedBowtieElement) return;
              await handleDeleteProcessElement(selectedBowtieElement.id);
              setSelectedBowtieElementId(null);
            },
            onSave: handleSaveBowtieElement,
            onClose: () => setSelectedBowtieElementId(null),
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
            onClose: () => setSelectedGroupingId(null),
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
            onClose: () => setSelectedStickyId(null),
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
            onClose: () => setSelectedImageId(null),
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
            onClose: () => setSelectedTextBoxId(null),
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

export default function SystemMapCanvasClient({ mapId }: { mapId: string }) {
  return (
    <ReactFlowProvider>
      <SystemMapCanvasInner mapId={mapId} />
    </ReactFlowProvider>
  );
}

