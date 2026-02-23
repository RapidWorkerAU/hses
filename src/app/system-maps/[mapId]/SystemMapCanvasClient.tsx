"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BaseEdge,
  Background,
  BackgroundVariant,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  type NodeChange,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  getBezierPath,
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
  getOrgChartPersonBanner,
  getOrgChartPersonLabel,
  orgChartDepartmentOptions,
  parseProcessFlowId,
  pointInAnyRect,
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
import {
  BowtiePropertiesAside,
  CategoryPropertiesAside,
  DocumentPropertiesAside,
  GroupingContainerAside,
  MobileDocumentPropertiesModal,
  ImageAssetAside,
  PersonPropertiesAside,
  ProcessPropertiesAside,
  StickyNoteAside,
  SystemPropertiesAside,
  TextBoxAside,
} from "./canvasElementAsides";
import { AddRelationshipAside, DeleteDocumentAside, DocumentStructureAside } from "./canvasDrilldownAsides";
import { ConfirmDialog } from "./canvasDialogs";
import { defaultMapCategoryId, getAllowedNodeKindsForCategory, type MapCategoryId } from "./mapCategories";
import { useCanvasRelationNodeActions } from "./useCanvasRelationNodeActions";
import { useCanvasElementActions } from "./useCanvasElementActions";
import { useCanvasDeleteSelectionActions } from "./useCanvasDeleteSelectionActions";
import { useCanvasMapInfoActions } from "./useCanvasMapInfoActions";
import { useCanvasOutlineActions } from "./useCanvasOutlineActions";
import { useCanvasPaneSelectionActions } from "./useCanvasPaneSelectionActions";
import { useCanvasNodeDragStop } from "./useCanvasNodeDragStop";
import { useCanvasRelationshipDerived } from "./useCanvasRelationshipDerived";

function SmartBezierEdge(props: EdgeProps<Edge<{ displayLabel?: string; obstacleRects?: Rect[] }>>) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    labelStyle,
    data,
    pathOptions,
  } = props;
  const curvature =
    pathOptions && typeof pathOptions === "object" && "curvature" in pathOptions && typeof pathOptions.curvature === "number"
      ? pathOptions.curvature
      : 0.25;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature,
  });
  const obstacles = data?.obstacleRects ?? [];
  let finalLabelX = labelX;
  let finalLabelY = labelY;
  if (obstacles.length && pointInAnyRect(finalLabelX, finalLabelY, obstacles)) {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const candidateOffsets = [120, -120, 180, -180, 240, -240, 300, -300];
    for (const offset of candidateOffsets) {
      const cx = labelX + ux * offset;
      const cy = labelY + uy * offset;
      if (!pointInAnyRect(cx, cy, obstacles)) {
        finalLabelX = cx;
        finalLabelY = cy;
        break;
      }
    }
  }

  const displayLabel = data?.displayLabel ?? "";
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {displayLabel ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto absolute z-[8] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm border border-slate-200 bg-white px-1 py-0 text-[11px] shadow-sm"
            style={{ left: finalLabelX, top: finalLabelY, color: labelStyle?.fill as string | undefined, zIndex: 8 }}
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
const flowEdgeTypes = {
  smartBezier: SmartBezierEdge,
} as const;
const canvasElementSelectColumns =
  "id,map_id,element_type,heading,color_hex,created_by_user_id,element_config,pos_x,pos_y,width,height,created_at,updated_at";
const isMethodologyElementType = (elementType: string) =>
  elementType.startsWith("bowtie_") || elementType.startsWith("incident_");

function SystemMapCanvasInner({ mapId }: { mapId: string }) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const relationshipPopupRef = useRef<HTMLDivElement | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const searchMenuRef = useRef<HTMLDivElement | null>(null);
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
  const [personContractorRoleDraft, setPersonContractorRoleDraft] = useState(false);
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
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [imageUploadFile, setImageUploadFile] = useState<File | null>(null);
  const [imageUploadPreviewUrl, setImageUploadPreviewUrl] = useState<string | null>(null);
  const [imageUploadWidth, setImageUploadWidth] = useState<number>(imageDefaultWidth);
  const [imageUploadHeight, setImageUploadHeight] = useState<number>(imageDefaultWidth);
  const [imageUploadDescription, setImageUploadDescription] = useState("");
  const [imageUploadSaving, setImageUploadSaving] = useState(false);
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
        const width = mapCategoryId === "org_chart" ? Math.max(minorGridSize * 4, el.width || orgChartPersonWidth) : personElementWidth;
        const height = mapCategoryId === "org_chart" ? Math.max(minorGridSize * 3, el.height || orgChartPersonHeight) : personElementHeight;
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
    }) as Array<{ id: string; dimensions: { width: number; height: number } }>;
    if (!dimensionChanges.length) return;

    const nextSizes = new Map<string, { width: number; height: number }>();
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
        if (width !== currentWidth || height !== currentHeight) nextSizes.set(elementId, { width, height });
        return;
      }
      if (current.element_type === "grouping_container") {
        const width = Math.max(groupingMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(groupingMinHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(groupingMinWidth, snapToMinorGrid(current.width || groupingDefaultWidth));
        const currentHeight = Math.max(groupingMinHeight, snapToMinorGrid(current.height || groupingDefaultHeight));
        if (width !== currentWidth || height !== currentHeight) nextSizes.set(elementId, { width, height });
        return;
      }
      if (current.element_type === "sticky_note") {
        const width = Math.max(stickyMinSize, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(stickyMinSize, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(stickyMinSize, snapToMinorGrid(current.width || stickyDefaultSize));
        const currentHeight = Math.max(stickyMinSize, snapToMinorGrid(current.height || stickyDefaultSize));
        if (width !== currentWidth || height !== currentHeight) nextSizes.set(elementId, { width, height });
        return;
      }
      if (current.element_type === "image_asset") {
        const width = Math.max(imageMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(imageMinHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(imageMinWidth, snapToMinorGrid(current.width || imageDefaultWidth));
        const currentHeight = Math.max(imageMinHeight, snapToMinorGrid(current.height || imageDefaultWidth));
        if (width !== currentWidth || height !== currentHeight) nextSizes.set(elementId, { width, height });
        return;
      }
      if (current.element_type === "text_box") {
        const width = Math.max(textBoxMinWidth, snapToMinorGrid(change.dimensions.width));
        const height = Math.max(textBoxMinHeight, snapToMinorGrid(change.dimensions.height));
        const currentWidth = Math.max(textBoxMinWidth, snapToMinorGrid(current.width || textBoxDefaultWidth));
        const currentHeight = Math.max(textBoxMinHeight, snapToMinorGrid(current.height || textBoxDefaultHeight));
        if (width !== currentWidth || height !== currentHeight) nextSizes.set(elementId, { width, height });
      }
    });
    if (!nextSizes.size) return;

    setElements((prev) =>
      prev.map((el) =>
        nextSizes.has(el.id)
          ? {
              ...el,
              width: nextSizes.get(el.id)!.width,
              height: nextSizes.get(el.id)!.height,
            }
          : el
      )
    );

    nextSizes.forEach((size, elementId) => {
      resizePersistValuesRef.current.set(elementId, size);
      const existing = resizePersistTimersRef.current.get(elementId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        const queued = resizePersistValuesRef.current.get(elementId);
        if (!queued) return;
        const { error: e } = await supabaseBrowser
          .schema("ms")
          .from("canvas_elements")
          .update({ width: queued.width, height: queued.height })
          .eq("id", elementId)
          .eq("map_id", mapId);
        if (e && !isAbortLikeError(e)) setError(e.message || "Unable to save component size.");
        resizePersistTimersRef.current.delete(elementId);
      }, 220);
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
    const groupingElements = elements
      .filter((el) => el.element_type === "grouping_container")
      .sort((a, b) => {
        const areaA = Math.max(groupingMinWidth, a.width || groupingDefaultWidth) * Math.max(groupingMinHeight, a.height || groupingDefaultHeight);
        const areaB = Math.max(groupingMinWidth, b.width || groupingDefaultWidth) * Math.max(groupingMinHeight, b.height || groupingDefaultHeight);
        if (areaA !== areaB) return areaB - areaA;
        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return createdA - createdB;
      });
    const nextNodes: Node<FlowData>[] = [
        ...groupingElements.map((el) => {
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
                entityKind: "grouping_container" as const,
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
          }),
        ...nodes.map((n) => {
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
              entityKind: "document" as const,
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
        }),
        ...elements.map((el) =>
          el.element_type === "grouping_container"
            ? null
            : el.element_type === "sticky_note"
            ? (() => {
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
                    entityKind: "sticky_note" as const,
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
              })()
            : el.element_type === "image_asset"
            ? (() => {
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
                    entityKind: "image_asset" as const,
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
              })()
            : el.element_type === "text_box"
            ? (() => {
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
                    entityKind: "text_box" as const,
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
              })()
            : el.element_type === "process_component"
            ? (() => {
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
                  entityKind: "process_component" as const,
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
            })()
            : el.element_type === "person"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                const personWidth = mapCategoryId === "org_chart" ? Math.max(minorGridSize * 4, el.width || orgChartPersonWidth) : personElementWidth;
                const personHeight = mapCategoryId === "org_chart" ? Math.max(minorGridSize * 3, el.height || orgChartPersonHeight) : personElementHeight;
                const orgConfig = mapCategoryId === "org_chart" ? parseOrgChartPersonConfig(el.element_config) : null;
                const orgBanner = orgConfig ? getOrgChartPersonBanner(orgConfig) : null;
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
                  entityKind: "person" as const,
                  typeName: "Person",
                  title: orgConfig ? getOrgChartPersonLabel(orgConfig) : el.heading ?? buildPersonHeading("Role Name", "Department"),
                  userGroup: "",
                  disciplineKeys: [],
                  bannerBg: "#ffffff",
                  bannerText: "#111827",
                  isLandscape: true,
                  isUnconfigured: false,
                  orgChartPerson: orgConfig
                    ? {
                        label: getOrgChartPersonLabel(orgConfig),
                        subtitle: orgConfig.position_title || "Position Title",
                        banner: orgBanner?.label || "VACANT",
                        bannerBg: orgBanner?.bg || "#dc2626",
                        bannerText: orgBanner?.text || "#ffffff",
                      }
                    : undefined,
                },
              };
            })()
            : el.element_type === "system_circle"
            ? (() => {
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
                  entityKind: "system_circle" as const,
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
            })()
            : el.element_type === "bowtie_hazard"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "bowtieHazard",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || bowtieDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || bowtieHazardHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "bowtie_hazard" as const,
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
              })()
            : el.element_type === "bowtie_top_event"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "bowtieTopEvent",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || bowtieDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || bowtieSquareHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "bowtie_top_event" as const,
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
              })()
            : el.element_type === "bowtie_threat"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "bowtieThreat",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || bowtieDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || bowtieSquareHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "bowtie_threat" as const,
                    typeName: "Threat",
                    title: el.heading ?? "Threat",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#f97316",
                    bannerText: "#ffffff",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "bowtie_consequence"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "bowtieConsequence",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || bowtieDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || bowtieSquareHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "bowtie_consequence" as const,
                    typeName: "Consequence",
                    title: el.heading ?? "Consequence",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#9333ea",
                    bannerText: "#ffffff",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "bowtie_control"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                const controlCategory = String((el.element_config as { control_category?: string } | null)?.control_category || "preventive");
                const isCritical = Boolean((el.element_config as { is_critical_control?: boolean } | null)?.is_critical_control);
                return {
                  id: flowId,
                  type: "bowtieControl",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || bowtieDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || bowtieControlHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "bowtie_control" as const,
                    typeName: controlCategory.charAt(0).toUpperCase() + controlCategory.slice(1),
                    title: el.heading ?? "Control",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#ffffff",
                    bannerText: "#111827",
                    isLandscape: true,
                    isUnconfigured: false,
                    isCritical,
                  },
                };
              })()
            : el.element_type === "bowtie_escalation_factor"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "bowtieEscalationFactor",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || bowtieDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || bowtieSquareHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "bowtie_escalation_factor" as const,
                    typeName: "Escalation Factor",
                    title: el.heading ?? "Escalation Factor",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#facc15",
                    bannerText: "#111827",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "bowtie_recovery_measure"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "bowtieRecoveryMeasure",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || bowtieDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || bowtieHazardHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "bowtie_recovery_measure" as const,
                    typeName: "Recovery Measure",
                    title: el.heading ?? "Recovery Measure",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#22c55e",
                    bannerText: "#ffffff",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "bowtie_degradation_indicator"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "bowtieDegradationIndicator",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || bowtieDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || bowtieSquareHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "bowtie_degradation_indicator" as const,
                    typeName: "Degradation Indicator",
                    title: el.heading ?? "Degradation Indicator",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#f472b6",
                    bannerText: "#111827",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "bowtie_risk_rating"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "bowtieRiskRating",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || bowtieDefaultWidth),
                    height: Math.max(minorGridSize, el.height || bowtieRiskRatingHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "bowtie_risk_rating" as const,
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
              })()
            : el.element_type === "incident_sequence_step"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "incidentSequenceStep",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || incidentThreeTwoHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "incident_sequence_step" as const,
                    typeName: "Sequence Step",
                    title: el.heading ?? "Sequence Step",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#bfdbfe",
                    bannerText: "#111827",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "incident_outcome"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "incidentOutcome",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || incidentThreeTwoHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "incident_outcome" as const,
                    typeName: "Outcome",
                    title: el.heading ?? "Outcome",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#ef4444",
                    bannerText: "#ffffff",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "incident_task_condition"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "incidentTaskCondition",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || incidentThreeTwoHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "incident_task_condition" as const,
                    typeName: "Task / Condition",
                    title: el.heading ?? "Task / Condition",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#fb923c",
                    bannerText: "#111827",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "incident_factor"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "incidentFactor",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || incidentSquareSize),
                    height: Math.max(minorGridSize * 2, el.height || incidentSquareSize),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "incident_factor" as const,
                    typeName: "Factor",
                    title: el.heading ?? "Factor",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#fde047",
                    bannerText: "#111827",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "incident_system_factor"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "incidentSystemFactor",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || incidentSquareSize),
                    height: Math.max(minorGridSize * 2, el.height || incidentSquareSize),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "incident_system_factor" as const,
                    typeName: "System Factor",
                    title: el.heading ?? "System Factor",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#a78bfa",
                    bannerText: "#111827",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "incident_control_barrier"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "incidentControlBarrier",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || incidentFourThreeHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "incident_control_barrier" as const,
                    typeName: "Control / Barrier",
                    title: el.heading ?? "Control / Barrier",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#4ade80",
                    bannerText: "#111827",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "incident_evidence"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "incidentEvidence",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || incidentThreeTwoHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "incident_evidence" as const,
                    typeName: "Evidence",
                    title: el.heading ?? "Evidence",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#cbd5e1",
                    bannerText: "#111827",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "incident_finding"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "incidentFinding",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
                    height: Math.max(minorGridSize, el.height || incidentThreeOneHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "incident_finding" as const,
                    typeName: "Finding",
                    title: el.heading ?? "Finding",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#1d4ed8",
                    bannerText: "#ffffff",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : el.element_type === "incident_recommendation"
            ? (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
                return {
                  id: flowId,
                  type: "incidentRecommendation",
                  position: { x: el.pos_x, y: el.pos_y },
                  zIndex: 30,
                  selected: isMarked,
                  draggable: canEditThis,
                  selectable: canWriteMap,
                  style: {
                    width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
                    height: Math.max(minorGridSize * 2, el.height || incidentThreeTwoHeight),
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    boxShadow: isMarked ? "0 0 0 2px rgba(15,23,42,0.9)" : "none",
                    padding: 0,
                    overflow: "visible",
                  },
                  data: {
                    entityKind: "incident_recommendation" as const,
                    typeName: "Recommendation",
                    title: el.heading ?? "Recommendation",
                    userGroup: "",
                    disciplineKeys: [],
                    bannerBg: "#14b8a6",
                    bannerText: "#111827",
                    isLandscape: true,
                    isUnconfigured: false,
                  },
                };
              })()
            : (() => {
                const flowId = processFlowId(el.id);
                const isMarked = selectedFlowIds.has(flowId);
                const canEditThis = canEditElement(el);
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
                  entityKind: "category" as const,
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
            })()
        ).filter(Boolean) as Node<FlowData>[],
      ];
    setFlowNodes(nextNodes);
  }, [nodes, elements, typesById, setFlowNodes, getNodeSize, selectedFlowIds, canWriteMap, canEditElement, memberDisplayNameByUserId, userEmail, userId, formatStickyDate, imageUrlsByElementId, isNodeDragActive]);

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
    () => {
      const pairTotals = new Map<string, number>();
      const pairSeen = new Map<string, number>();
      const nodesById = new Map(nodes.map((n) => [n.id, n]));
      const relationshipElementsById = new Map(
        elements
          .filter((el) => el.element_type !== "sticky_note")
          .map((el) => [el.id, el])
      );
      const getElementDimensions = (el: CanvasElementRow) => {
        if (el.element_type === "system_circle") return { width: systemCircleDiameter, height: systemCircleElementHeight };
        if (el.element_type === "process_component") return { width: processComponentWidth, height: processComponentElementHeight };
        if (el.element_type === "person") {
          if (mapCategoryId === "org_chart") {
            return {
              width: Math.max(minorGridSize * 4, el.width || orgChartPersonWidth),
              height: Math.max(minorGridSize * 3, el.height || orgChartPersonHeight),
            };
          }
          return { width: personElementWidth, height: personElementHeight };
        }
        if (el.element_type === "image_asset") return { width: Math.max(imageMinWidth, el.width || imageDefaultWidth), height: Math.max(imageMinHeight, el.height || imageDefaultWidth) };
        if (el.element_type === "text_box") return { width: Math.max(textBoxMinWidth, el.width || textBoxDefaultWidth), height: Math.max(textBoxMinHeight, el.height || textBoxDefaultHeight) };
        if (el.element_type === "grouping_container") {
          return {
            width: Math.max(groupingMinWidth, el.width || groupingDefaultWidth),
            height: Math.max(groupingMinHeight, el.height || groupingDefaultHeight),
          };
        }
        if (isMethodologyElementType(el.element_type)) {
          return {
            width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
            height: Math.max(minorGridSize, el.height || incidentSquareSize),
          };
        }
        return { width: Math.max(processMinWidth, el.width || processHeadingWidth), height: Math.max(processMinHeight, el.height || processHeadingHeight) };
      };
      const relationEndpointKey = (r: NodeRelationRow) => {
        if (r.source_grouping_element_id && r.target_grouping_element_id) {
          const a = processFlowId(r.source_grouping_element_id);
          const b = processFlowId(r.target_grouping_element_id);
          return a < b ? `group:${a}|${b}` : `group:${b}|${a}`;
        }
        if (r.from_node_id && r.to_node_id) {
          const a = r.from_node_id;
          const b = r.to_node_id;
          return a < b ? `doc:${a}|${b}` : `doc:${b}|${a}`;
        }
        if (r.from_node_id && r.target_system_element_id) {
          const a = r.from_node_id;
          const b = processFlowId(r.target_system_element_id);
          return a < b ? `docsys:${a}|${b}` : `docsys:${b}|${a}`;
        }
        if (r.source_system_element_id && r.to_node_id) {
          const a = processFlowId(r.source_system_element_id);
          const b = r.to_node_id;
          return a < b ? `sysdoc:${a}|${b}` : `sysdoc:${b}|${a}`;
        }
        if (r.source_system_element_id && r.target_system_element_id) {
          const a = processFlowId(r.source_system_element_id);
          const b = processFlowId(r.target_system_element_id);
          return a < b ? `syssys:${a}|${b}` : `syssys:${b}|${a}`;
        }
        return `rel:${r.id}`;
      };
      relations.forEach((r) => {
        const key = relationEndpointKey(r);
        pairTotals.set(key, (pairTotals.get(key) ?? 0) + 1);
      });
      const obstacleElementRects = elements
        .filter((el) => el.element_type !== "grouping_container" && el.element_type !== "sticky_note")
        .map((el) => {
          const dims = getElementDimensions(el);
          return { id: el.id, x: el.pos_x, y: el.pos_y, width: dims.width, height: dims.height };
        });
      const labelObstacleRects: Rect[] = [
        ...nodes.map((n) => {
          const size = getNodeSize(n);
          return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
        }),
        ...obstacleElementRects.map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
      ];
      return relations.map((r) => {
        const sourceDoc = r.from_node_id ? nodesById.get(r.from_node_id) : undefined;
        const sourceElement = r.source_system_element_id ? relationshipElementsById.get(r.source_system_element_id) : undefined;
        const targetDoc = r.to_node_id ? nodesById.get(r.to_node_id) : undefined;
        const targetElement = r.target_system_element_id ? relationshipElementsById.get(r.target_system_element_id) : undefined;
        const sourceGrouping = r.source_grouping_element_id ? relationshipElementsById.get(r.source_grouping_element_id) : undefined;
        const targetGrouping = r.target_grouping_element_id ? relationshipElementsById.get(r.target_grouping_element_id) : undefined;
        if (!sourceDoc && !sourceElement && !(sourceGrouping && targetGrouping)) return null;
        if ((sourceDoc || sourceElement) && !targetDoc && !targetElement) return null;
        const from = r.from_node_id ? nodesById.get(r.from_node_id) : undefined;
        const to = r.to_node_id ? nodesById.get(r.to_node_id) : undefined;
        let source = from ? from.id : "";
        let target = to ? to.id : "";
        let sourceHandle = "bottom";
        let targetHandle = "top";

        if (sourceGrouping && targetGrouping) {
          source = processFlowId(sourceGrouping.id);
          target = processFlowId(targetGrouping.id);
          const sourceDims = getElementDimensions(sourceGrouping);
          const targetDims = getElementDimensions(targetGrouping);
          const sourceWidth = sourceDims.width;
          const sourceHeight = sourceDims.height;
          const targetWidth = targetDims.width;
          const targetHeight = targetDims.height;
          const fromCenterX = sourceGrouping.pos_x + sourceWidth / 2;
          const fromCenterY = sourceGrouping.pos_y + sourceHeight / 2;
          const toCenterX = targetGrouping.pos_x + targetWidth / 2;
          const toCenterY = targetGrouping.pos_y + targetHeight / 2;
          const dx = toCenterX - fromCenterX;
          const dy = toCenterY - fromCenterY;
          if (Math.abs(dx) > Math.abs(dy)) {
            sourceHandle = dx > 0 ? "right" : "left";
            targetHandle = dx > 0 ? "left-target" : "right-target";
          } else {
            sourceHandle = dy > 0 ? "bottom" : "top-source";
            targetHandle = dy > 0 ? "top" : "bottom-target";
          }
        }

        if (from && to) {
          const getAnchors = (node: DocumentNodeRow) => {
            const { width, height } = getNodeSize(node);
            const left = node.pos_x;
            const top = node.pos_y;
            return {
              top: { x: left + width / 2, y: top },
              bottom: { x: left + width / 2, y: top + height },
              left: { x: left, y: top + height / 2 },
              right: { x: left + width, y: top + height / 2 },
            };
          };
          const sourceSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
            top: "top-source",
            bottom: "bottom",
            left: "left",
            right: "right",
          };
          const targetSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
            top: "top",
            bottom: "bottom-target",
            left: "left-target",
            right: "right-target",
          };
          const blockingRects = [
            ...nodes
            .filter((n) => n.id !== from.id && n.id !== to.id)
            .map((n) => {
              const size = getNodeSize(n);
              return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
            }),
            ...obstacleElementRects.map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
          ];
          const pickClosest = (srcNode: DocumentNodeRow, dstNode: DocumentNodeRow) => {
            const srcAnchors = getAnchors(srcNode);
            const dstAnchors = getAnchors(dstNode);
            const sides: Array<"top" | "bottom" | "left" | "right"> = ["top", "bottom", "left", "right"];
            let best: { sourceHandle: string; targetHandle: string; score: number; dist2: number } | null = null;
            for (const srcSide of sides) {
              for (const dstSide of sides) {
                const srcAnchor = srcAnchors[srcSide];
                const dstAnchor = dstAnchors[dstSide];
                const dx = srcAnchor.x - dstAnchor.x;
                const dy = srcAnchor.y - dstAnchor.y;
                const dist2 = dx * dx + dy * dy;
                const crossesOtherNode = blockingRects.some((rect) => lineIntersectsRect(srcAnchor, dstAnchor, rect));
                const score = dist2 + (crossesOtherNode ? 1_000_000_000 : 0);
                if (!best || score < best.score) {
                  best = {
                    sourceHandle: sourceSideToHandle[srcSide],
                    targetHandle: targetSideToHandle[dstSide],
                    score,
                    dist2,
                  };
                }
              }
            }
            return best!;
          };

          const forward = pickClosest(from, to);
          const reverse = pickClosest(to, from);
          if (reverse.dist2 < forward.dist2) {
            source = to.id;
            target = from.id;
            sourceHandle = reverse.sourceHandle;
            targetHandle = reverse.targetHandle;
          } else {
            source = from.id;
            target = to.id;
            sourceHandle = forward.sourceHandle;
            targetHandle = forward.targetHandle;
          }
        }
        if (from && targetElement) {
          target = processFlowId(targetElement.id);
          const fromSize = getNodeSize(from);
          const fromLeft = from.pos_x;
          const fromTop = from.pos_y;
          const toLeft = targetElement.pos_x;
          const toTop = targetElement.pos_y;
          const targetSize = getElementDimensions(targetElement);
          const fromAnchors = {
            top: { x: fromLeft + fromSize.width / 2, y: fromTop },
            bottom: { x: fromLeft + fromSize.width / 2, y: fromTop + fromSize.height },
            left: { x: fromLeft, y: fromTop + fromSize.height / 2 },
            right: { x: fromLeft + fromSize.width, y: fromTop + fromSize.height / 2 },
          };
          const toAnchors = {
            top: { x: toLeft + targetSize.width / 2, y: toTop },
            bottom: { x: toLeft + targetSize.width / 2, y: toTop + targetSize.height },
            left: { x: toLeft, y: toTop + targetSize.height / 2 },
            right: { x: toLeft + targetSize.width, y: toTop + targetSize.height / 2 },
          };
          const sourceSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
            top: "top-source",
            bottom: "bottom",
            left: "left",
            right: "right",
          };
          const targetSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
            top: "top",
            bottom: "bottom-target",
            left: "left-target",
            right: "right-target",
          };
          const blockingRects = [
            ...nodes
              .filter((n) => n.id !== from.id)
              .map((n) => {
                const size = getNodeSize(n);
                return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
              }),
            ...obstacleElementRects
              .filter((rect) => rect.id !== targetElement.id)
              .map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
          ];
          const sides: Array<"top" | "bottom" | "left" | "right"> = ["top", "bottom", "left", "right"];
          let best: { sourceHandle: string; targetHandle: string; score: number } | null = null;
          for (const srcSide of sides) {
            for (const dstSide of sides) {
              const srcAnchor = fromAnchors[srcSide];
              const dstAnchor = toAnchors[dstSide];
              const dx = srcAnchor.x - dstAnchor.x;
              const dy = srcAnchor.y - dstAnchor.y;
              const dist2 = dx * dx + dy * dy;
              const crosses = blockingRects.some((rect) => lineIntersectsRect(srcAnchor, dstAnchor, rect));
              const score = dist2 + (crosses ? 1_000_000_000 : 0);
              if (!best || score < best.score) {
                best = {
                  sourceHandle: sourceSideToHandle[srcSide],
                  targetHandle: targetSideToHandle[dstSide],
                  score,
                };
              }
            }
          }
          if (best) {
            sourceHandle = best.sourceHandle;
            targetHandle = best.targetHandle;
          }
        }
        if (sourceElement && targetDoc) {
          source = processFlowId(sourceElement.id);
          target = targetDoc.id;
          const sourceSize = getElementDimensions(sourceElement);
          const targetSize = getNodeSize(targetDoc);
          const sourceAnchors = {
            top: { x: sourceElement.pos_x + sourceSize.width / 2, y: sourceElement.pos_y },
            bottom: { x: sourceElement.pos_x + sourceSize.width / 2, y: sourceElement.pos_y + sourceSize.height },
            left: { x: sourceElement.pos_x, y: sourceElement.pos_y + sourceSize.height / 2 },
            right: { x: sourceElement.pos_x + sourceSize.width, y: sourceElement.pos_y + sourceSize.height / 2 },
          };
          const targetAnchors = {
            top: { x: targetDoc.pos_x + targetSize.width / 2, y: targetDoc.pos_y },
            bottom: { x: targetDoc.pos_x + targetSize.width / 2, y: targetDoc.pos_y + targetSize.height },
            left: { x: targetDoc.pos_x, y: targetDoc.pos_y + targetSize.height / 2 },
            right: { x: targetDoc.pos_x + targetSize.width, y: targetDoc.pos_y + targetSize.height / 2 },
          };
          const sourceSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
            top: "top-source",
            bottom: "bottom",
            left: "left",
            right: "right",
          };
          const targetSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
            top: "top",
            bottom: "bottom-target",
            left: "left-target",
            right: "right-target",
          };
          const blockingRects = [
            ...nodes
              .filter((n) => n.id !== targetDoc.id)
              .map((n) => {
                const size = getNodeSize(n);
                return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
              }),
            ...obstacleElementRects
              .filter((rect) => rect.id !== sourceElement.id)
              .map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
          ];
          const sides: Array<"top" | "bottom" | "left" | "right"> = ["top", "bottom", "left", "right"];
          let best: { sourceHandle: string; targetHandle: string; score: number } | null = null;
          for (const srcSide of sides) {
            for (const dstSide of sides) {
              const srcAnchor = sourceAnchors[srcSide];
              const dstAnchor = targetAnchors[dstSide];
              const dx = srcAnchor.x - dstAnchor.x;
              const dy = srcAnchor.y - dstAnchor.y;
              const dist2 = dx * dx + dy * dy;
              const crosses = blockingRects.some((rect) => lineIntersectsRect(srcAnchor, dstAnchor, rect));
              const score = dist2 + (crosses ? 1_000_000_000 : 0);
              if (!best || score < best.score) {
                best = {
                  sourceHandle: sourceSideToHandle[srcSide],
                  targetHandle: targetSideToHandle[dstSide],
                  score,
                };
              }
            }
          }
          if (best) {
            sourceHandle = best.sourceHandle;
            targetHandle = best.targetHandle;
          }
        }
        if (sourceElement && targetElement) {
          source = processFlowId(sourceElement.id);
          target = processFlowId(targetElement.id);
          const sourceSize = getElementDimensions(sourceElement);
          const targetSize = getElementDimensions(targetElement);
          const sourceRect = {
            left: sourceElement.pos_x,
            right: sourceElement.pos_x + sourceSize.width,
            top: sourceElement.pos_y,
            bottom: sourceElement.pos_y + sourceSize.height,
          };
          const targetRect = {
            left: targetElement.pos_x,
            right: targetElement.pos_x + targetSize.width,
            top: targetElement.pos_y,
            bottom: targetElement.pos_y + targetSize.height,
          };
          const sourceCenterX = sourceRect.left + sourceSize.width / 2;
          const sourceCenterY = sourceRect.top + sourceSize.height / 2;
          const targetCenterX = targetRect.left + targetSize.width / 2;
          const targetCenterY = targetRect.top + targetSize.height / 2;
          const sourceIsBowtie = isMethodologyElementType(sourceElement.element_type);
          const targetIsBowtie = isMethodologyElementType(targetElement.element_type);
          const horizontalOverlap = sourceRect.left < targetRect.right && sourceRect.right > targetRect.left;
          const verticalOverlap = sourceRect.top < targetRect.bottom && sourceRect.bottom > targetRect.top;
          const dxCenters = targetCenterX - sourceCenterX;
          const dyCenters = targetCenterY - sourceCenterY;

          if (sourceIsBowtie && targetIsBowtie) {
            const absDx = Math.abs(dxCenters);
            const absDy = Math.abs(dyCenters);
            const preferVertical = horizontalOverlap || absDy >= absDx * 0.75;
            if (preferVertical) {
              sourceHandle = dyCenters < 0 ? "top-source" : "bottom";
              targetHandle = dyCenters < 0 ? "bottom-target" : "top";
            } else {
              sourceHandle = dxCenters < 0 ? "left" : "right";
              targetHandle = dxCenters < 0 ? "right-target" : "left-target";
            }
            // For Bow Tie component-to-component links, keep handles deterministic
            // so edges attach to the nearest directional faces.
          } else {
          const preferredPair = horizontalOverlap
            ? (sourceCenterY <= targetCenterY
                ? ({ src: "bottom", dst: "top" } as const)
                : ({ src: "top", dst: "bottom" } as const))
            : verticalOverlap
              ? (sourceCenterX <= targetCenterX
                  ? ({ src: "right", dst: "left" } as const)
                  : ({ src: "left", dst: "right" } as const))
              : Math.abs(dxCenters) > Math.abs(dyCenters)
                ? (sourceCenterX <= targetCenterX
                    ? ({ src: "right", dst: "left" } as const)
                    : ({ src: "left", dst: "right" } as const))
                : sourceCenterY <= targetCenterY
                  ? ({ src: "bottom", dst: "top" } as const)
                  : ({ src: "top", dst: "bottom" } as const);
          const sourceAnchors = {
            top: { x: sourceElement.pos_x + sourceSize.width / 2, y: sourceElement.pos_y },
            bottom: { x: sourceElement.pos_x + sourceSize.width / 2, y: sourceElement.pos_y + sourceSize.height },
            left: { x: sourceElement.pos_x, y: sourceElement.pos_y + sourceSize.height / 2 },
            right: { x: sourceElement.pos_x + sourceSize.width, y: sourceElement.pos_y + sourceSize.height / 2 },
          };
          const targetAnchors = {
            top: { x: targetElement.pos_x + targetSize.width / 2, y: targetElement.pos_y },
            bottom: { x: targetElement.pos_x + targetSize.width / 2, y: targetElement.pos_y + targetSize.height },
            left: { x: targetElement.pos_x, y: targetElement.pos_y + targetSize.height / 2 },
            right: { x: targetElement.pos_x + targetSize.width, y: targetElement.pos_y + targetSize.height / 2 },
          };
          const sourceSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
            top: "top-source",
            bottom: "bottom",
            left: "left",
            right: "right",
          };
          const targetSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
            top: "top",
            bottom: "bottom-target",
            left: "left-target",
            right: "right-target",
          };
          const blockingRects = [
            ...nodes.map((n) => {
              const size = getNodeSize(n);
              return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
            }),
            ...obstacleElementRects
              .filter((rect) => rect.id !== sourceElement.id && rect.id !== targetElement.id)
              .map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
          ];
          const sides: Array<"top" | "bottom" | "left" | "right"> = ["top", "bottom", "left", "right"];
          let best: { sourceHandle: string; targetHandle: string; score: number } | null = null;
          for (const srcSide of sides) {
            for (const dstSide of sides) {
              const srcAnchor = sourceAnchors[srcSide];
              const dstAnchor = targetAnchors[dstSide];
              const dx = srcAnchor.x - dstAnchor.x;
              const dy = srcAnchor.y - dstAnchor.y;
              const dist2 = dx * dx + dy * dy;
              const crosses = blockingRects.some((rect) => lineIntersectsRect(srcAnchor, dstAnchor, rect));
              const preferredPenalty = srcSide === preferredPair.src && dstSide === preferredPair.dst ? 0 : 40_000;
              const score = dist2 + preferredPenalty + (crosses ? 1_000_000_000 : 0);
              if (!best || score < best.score) {
                best = {
                  sourceHandle: sourceSideToHandle[srcSide],
                  targetHandle: targetSideToHandle[dstSide],
                  score,
                };
              }
            }
          }
          if (best) {
            sourceHandle = best.sourceHandle;
            targetHandle = best.targetHandle;
          }
          }
        }
        if (!source || !target) return null;

        const relationLabel = getDisplayRelationType(r.relation_type);
        const relationshipTypeLabel = getRelationshipCategoryLabel(r.relationship_category, r.relationship_custom_type);
        const disciplinesLabel = getRelationshipDisciplineLetters(r.relationship_disciplines);
        const edgeLabel = `${relationLabel} - [${relationshipTypeLabel}${disciplinesLabel ? ` - ${disciplinesLabel}` : ""}]`;
        const pairKey = relationEndpointKey(r);
        const totalForPair = pairTotals.get(pairKey) ?? 1;
        const seenForPair = pairSeen.get(pairKey) ?? 0;
        pairSeen.set(pairKey, seenForPair + 1);
        const center = (totalForPair - 1) / 2;
        const laneIndex = seenForPair - center;
        const pairLaneOffset = Math.abs(laneIndex) * 16;
        const globalLaneIndex = (hashString(`${r.id}:${pairKey}`) % 7) - 3; // -3..+3
        const globalLaneOffset = Math.abs(globalLaneIndex) * 10;
        const laneOffset = 28 + pairLaneOffset + globalLaneOffset;
        const curveSeed = hashString(`curve:${r.id}:${pairKey}`);
        const curveMagnitude = 0.22 + (curveSeed % 5) * 0.07; // 0.22..0.50
        const curveDirection = curveSeed % 2 === 0 ? 1 : -1;
        const pairDirection = laneIndex === 0 ? 1 : laneIndex > 0 ? 1 : -1;
        const curvature = Math.max(0.12, Math.min(0.7, curveMagnitude + Math.abs(laneIndex) * 0.05)) * (curveDirection * pairDirection);

        return {
          id: r.id,
          source,
          target,
          sourceHandle,
          targetHandle,
          type: "smartBezier",
          zIndex: 5,
          style: { stroke: "#0f766e", strokeWidth: 1.25 },
          pathOptions: { curvature },
          labelStyle: { fill: "#334155", fontSize: 11 },
          data: {
            displayLabel: edgeLabel,
            obstacleRects: labelObstacleRects,
          },
        };
      }).filter(Boolean) as Edge[];
    },
    [
      relations,
      nodes,
      elements,
      getNodeSize,
      mapCategoryId,
      minorGridSize,
      orgChartPersonHeight,
      orgChartPersonWidth,
      personElementHeight,
      personElementWidth,
    ]
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
      setPersonContractorRoleDraft(cfg.contractor_role);
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
    setPersonContractorRoleDraft(false);
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
    return () => {
      if (imageUploadPreviewUrl) URL.revokeObjectURL(imageUploadPreviewUrl);
    };
  }, [imageUploadPreviewUrl]);

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
    personContractorRoleDraft,
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
  const handleStartAddImageAsset = useCallback(() => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    setShowAddMenu(false);
    setImageUploadFile(null);
    setImageUploadDescription("");
    setImageUploadPreviewUrl(null);
    setImageUploadWidth(imageDefaultWidth);
    setImageUploadHeight(imageDefaultWidth);
    setShowImageUploadModal(true);
  }, [canWriteMap, setError, imageDefaultWidth]);
  const handleSelectImageUploadFile = useCallback((file: File | null) => {
    setImageUploadFile(file);
    if (!file) {
      setImageUploadPreviewUrl(null);
      setImageUploadWidth(imageDefaultWidth);
      setImageUploadHeight(imageDefaultWidth);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setImageUploadPreviewUrl(objectUrl);
    const img = new Image();
    img.onload = () => {
      const ratio = img.width > 0 ? img.height / img.width : 1;
      const width = imageDefaultWidth;
      const height = Math.max(imageMinHeight, Math.round(width * ratio));
      setImageUploadWidth(width);
      setImageUploadHeight(height);
    };
    img.src = objectUrl;
  }, [imageDefaultWidth, imageMinHeight]);
  const handleCancelImageUpload = useCallback(() => {
    if (imageUploadPreviewUrl) URL.revokeObjectURL(imageUploadPreviewUrl);
    setShowImageUploadModal(false);
    setImageUploadFile(null);
    setImageUploadPreviewUrl(null);
    setImageUploadDescription("");
    setImageUploadSaving(false);
  }, [imageUploadPreviewUrl]);
  const handleConfirmImageUpload = useCallback(async () => {
    if (!canWriteMap || !imageUploadFile || !userId) return;
    setImageUploadSaving(true);
    const ext = imageUploadFile.name.includes(".") ? imageUploadFile.name.split(".").pop() : "bin";
    const baseName = imageUploadFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "image";
    const storagePath = `${mapId}/${Date.now()}-${crypto.randomUUID()}-${baseName}.${ext}`;
    const { error: uploadError } = await supabaseBrowser.storage.from("systemmap").upload(storagePath, imageUploadFile, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      setError(uploadError.message || "Unable to upload image.");
      setImageUploadSaving(false);
      return;
    }
    const inserted = await handleAddImageAsset({
      storagePath,
      description: imageUploadDescription.trim() || imageUploadFile.name.replace(/\.[^/.]+$/, ""),
      width: imageUploadWidth,
      height: imageUploadHeight,
    });
    if (!inserted) {
      await supabaseBrowser.storage.from("systemmap").remove([storagePath]);
      setImageUploadSaving(false);
      return;
    }
    setImageUploadSaving(false);
    handleCancelImageUpload();
  }, [canWriteMap, imageUploadFile, userId, mapId, handleAddImageAsset, imageUploadDescription, imageUploadWidth, imageUploadHeight, setError, handleCancelImageUpload]);
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
    let nextHeading = bowtieHeadingDraft.trim() || defaultLabelByType[elementType] || "Bow Tie Node";
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
            onInit={(instance) => setRf({ fitView: instance.fitView, screenToFlowPosition: instance.screenToFlowPosition, setViewport: instance.setViewport })}
            onNodesChange={handleFlowNodesChange}
            onNodeClick={(event, n) => {
              setSelectedFlowIds((prev) => (prev.size ? new Set<string>() : prev));
              if (mapRole === "read") {
                if (n.data.entityKind === "sticky_note") {
                  const stickyId = parseProcessFlowId(n.id);
                  const sticky = elements.find((el) => el.id === stickyId && el.element_type === "sticky_note");
                  if (sticky && canEditElement(sticky)) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedSystemId(null);
                    setSelectedProcessComponentId(null);
                    setSelectedPersonId(null);
                    setSelectedGroupingId(null);
                    setSelectedBowtieElementId(null);
                    setSelectedImageId(null);
                    setSelectedTextBoxId(null);
                    setSelectedStickyId(stickyId);
                    return;
                  }
                }
                setSelectedStickyId(null);
                setSelectedPersonId(null);
                setSelectedImageId(null);
                setSelectedTextBoxId(null);
                setSelectedBowtieElementId(null);
                return;
              }
              const isBowtieKind =
                n.data.entityKind === "bowtie_hazard" ||
                n.data.entityKind === "bowtie_top_event" ||
                n.data.entityKind === "bowtie_threat" ||
                n.data.entityKind === "bowtie_consequence" ||
                n.data.entityKind === "bowtie_control" ||
                n.data.entityKind === "bowtie_escalation_factor" ||
                n.data.entityKind === "bowtie_recovery_measure" ||
                n.data.entityKind === "bowtie_degradation_indicator" ||
                n.data.entityKind === "bowtie_risk_rating" ||
                n.data.entityKind === "incident_sequence_step" ||
                n.data.entityKind === "incident_outcome" ||
                n.data.entityKind === "incident_task_condition" ||
                n.data.entityKind === "incident_factor" ||
                n.data.entityKind === "incident_system_factor" ||
                n.data.entityKind === "incident_control_barrier" ||
                n.data.entityKind === "incident_evidence" ||
                n.data.entityKind === "incident_finding" ||
                n.data.entityKind === "incident_recommendation";
              if (!isBowtieKind) setSelectedBowtieElementId(null);
              if (n.data.entityKind === "category") {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedSystemId(null);
                setSelectedProcessComponentId(null);
                setSelectedPersonId(null);
                setSelectedGroupingId(null);
                setSelectedStickyId(null);
                setSelectedImageId(null);
                setSelectedTextBoxId(null);
                setSelectedBowtieElementId(null);
                setSelectedProcessId(parseProcessFlowId(n.id));
                return;
              }
              if (n.data.entityKind === "process_component") {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedSystemId(null);
                    setSelectedGroupingId(null);
                    setSelectedPersonId(null);
                    setSelectedProcessComponentId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedSystemId(null);
                setSelectedPersonId(null);
                setSelectedGroupingId(null);
                setSelectedStickyId(null);
                setSelectedImageId(null);
                setSelectedTextBoxId(null);
                setSelectedBowtieElementId(null);
                setSelectedProcessComponentId(parseProcessFlowId(n.id));
                return;
              }
              if (n.data.entityKind === "system_circle") {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedPersonId(null);
                    setSelectedSystemId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedProcessComponentId(null);
                setSelectedPersonId(null);
                setSelectedGroupingId(null);
                setSelectedStickyId(null);
                setSelectedImageId(null);
                setSelectedTextBoxId(null);
                setSelectedBowtieElementId(null);
                setSelectedSystemId(parseProcessFlowId(n.id));
                return;
              }
              if (n.data.entityKind === "person") {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedSystemId(null);
                    setSelectedProcessComponentId(null);
                    setSelectedGroupingId(null);
                    setSelectedStickyId(null);
                    setSelectedImageId(null);
                    setSelectedTextBoxId(null);
                    setSelectedPersonId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedSystemId(null);
                setSelectedProcessComponentId(null);
                setSelectedGroupingId(null);
                setSelectedStickyId(null);
                setSelectedImageId(null);
                setSelectedTextBoxId(null);
                setSelectedBowtieElementId(null);
                setSelectedPersonId(parseProcessFlowId(n.id));
                return;
              }
              if (n.data.entityKind === "grouping_container") {
                const target = event.target as HTMLElement | null;
                const clickedGroupingHandle = !!target?.closest(".grouping-drag-handle, .grouping-select-handle");
                if (!clickedGroupingHandle) return;
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedSystemId(null);
                    setSelectedPersonId(null);
                    setSelectedGroupingId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedSystemId(null);
                setSelectedProcessComponentId(null);
                setSelectedPersonId(null);
                setSelectedStickyId(null);
                setSelectedImageId(null);
                setSelectedTextBoxId(null);
                setSelectedBowtieElementId(null);
                setSelectedGroupingId(parseProcessFlowId(n.id));
                return;
              }
              if (n.data.entityKind === "image_asset") {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedSystemId(null);
                    setSelectedProcessComponentId(null);
                    setSelectedPersonId(null);
                    setSelectedGroupingId(null);
                    setSelectedStickyId(null);
                    setSelectedTextBoxId(null);
                    setSelectedBowtieElementId(null);
                    setSelectedImageId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedSystemId(null);
                setSelectedProcessComponentId(null);
                setSelectedPersonId(null);
                setSelectedGroupingId(null);
                setSelectedStickyId(null);
                setSelectedTextBoxId(null);
                setSelectedBowtieElementId(null);
                setSelectedImageId(parseProcessFlowId(n.id));
                return;
              }
              if (n.data.entityKind === "text_box") {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedSystemId(null);
                    setSelectedProcessComponentId(null);
                    setSelectedPersonId(null);
                    setSelectedGroupingId(null);
                    setSelectedStickyId(null);
                    setSelectedImageId(null);
                    setSelectedBowtieElementId(null);
                    setSelectedTextBoxId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedSystemId(null);
                setSelectedProcessComponentId(null);
                setSelectedPersonId(null);
                setSelectedGroupingId(null);
                setSelectedStickyId(null);
                setSelectedImageId(null);
                setSelectedBowtieElementId(null);
                setSelectedTextBoxId(parseProcessFlowId(n.id));
                return;
              }
              if (isBowtieKind) {
                if (isMobile) {
                  const now = Date.now();
                  const lastTap = lastMobileTapRef.current;
                  const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                  if (isDoubleTap) {
                    setSelectedNodeId(null);
                    setSelectedProcessId(null);
                    setSelectedSystemId(null);
                    setSelectedProcessComponentId(null);
                    setSelectedPersonId(null);
                    setSelectedGroupingId(null);
                    setSelectedStickyId(null);
                    setSelectedImageId(null);
                    setSelectedTextBoxId(null);
                    setSelectedBowtieElementId(parseProcessFlowId(n.id));
                    lastMobileTapRef.current = null;
                  } else {
                    lastMobileTapRef.current = { id: n.id, ts: now };
                  }
                  return;
                }
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedSystemId(null);
                setSelectedProcessComponentId(null);
                setSelectedPersonId(null);
                setSelectedGroupingId(null);
                setSelectedStickyId(null);
                setSelectedImageId(null);
                setSelectedTextBoxId(null);
                setSelectedBowtieElementId(parseProcessFlowId(n.id));
                return;
              }
              if (n.data.entityKind === "sticky_note") {
                setSelectedNodeId(null);
                setSelectedProcessId(null);
                setSelectedSystemId(null);
                setSelectedProcessComponentId(null);
                setSelectedPersonId(null);
                setSelectedGroupingId(null);
                setSelectedImageId(null);
                setSelectedTextBoxId(null);
                setSelectedBowtieElementId(null);
                setSelectedStickyId(parseProcessFlowId(n.id));
                return;
              }
              if (isMobile) {
                const now = Date.now();
                const lastTap = lastMobileTapRef.current;
                const isDoubleTap = Boolean(lastTap && lastTap.id === n.id && now - lastTap.ts <= 500);
                if (isDoubleTap) {
                  setMobileNodeMenuId(n.id);
                  lastMobileTapRef.current = null;
                } else {
                  lastMobileTapRef.current = { id: n.id, ts: now };
                }
                return;
              }
              setSelectedProcessId(null);
              setSelectedSystemId(null);
              setSelectedProcessComponentId(null);
              setSelectedPersonId(null);
              setSelectedGroupingId(null);
              setSelectedStickyId(null);
              setSelectedImageId(null);
              setSelectedTextBoxId(null);
              setSelectedBowtieElementId(null);
              setSelectedNodeId(n.id);
            }}
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

        {selectionMarquee.active && (
          <div
            className="pointer-events-none fixed z-[66] border border-[#0f172a] bg-[#0f172a]/10"
            style={{
              left: Math.min(selectionMarquee.startClientX, selectionMarquee.currentClientX),
              top: Math.min(selectionMarquee.startClientY, selectionMarquee.currentClientY),
              width: Math.abs(selectionMarquee.currentClientX - selectionMarquee.startClientX),
              height: Math.abs(selectionMarquee.currentClientY - selectionMarquee.startClientY),
            }}
          />
        )}

        {showDeleteSelectionConfirm && (
          <div className="fixed inset-0 z-[92] flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-lg rounded-none border border-slate-300 bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-slate-900">Delete selected components?</h2>
              <p className="mt-2 text-sm text-slate-700">
                You are about to permanently delete {selectedFlowIds.size} selected component{selectedFlowIds.size === 1 ? "" : "s"} and associated data.
                This action cannot be recovered.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                  onClick={handleDeleteSelectedComponents}
                >
                  Delete selected
                </button>
                <button
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                  onClick={() => setShowDeleteSelectionConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showImageUploadModal && (
          <div className="fixed inset-0 z-[93] flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-xl rounded-none border border-slate-300 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Upload Image</h2>
                <button className="text-slate-500 hover:text-slate-800" onClick={handleCancelImageUpload}>x</button>
              </div>
              <div className="mt-4 rounded-none border border-dashed border-slate-300 p-6">
                <label className="flex cursor-pointer flex-col items-center justify-center text-center">
                  <div className="text-sm text-slate-700">Drag and drop image or click to browse</div>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-3 block text-sm text-slate-700"
                    onChange={(e) => handleSelectImageUploadFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {imageUploadPreviewUrl ? (
                  <div className="mt-4 overflow-hidden rounded border border-slate-200 bg-slate-50 p-2">
                    <img src={imageUploadPreviewUrl} alt="Upload preview" className="max-h-64 w-full object-contain" />
                  </div>
                ) : null}
              </div>
              <label className="mt-4 block text-sm text-slate-700">
                Image Description
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-none border border-slate-300 px-3 py-2 text-black"
                  value={imageUploadDescription}
                  onChange={(e) => setImageUploadDescription(e.target.value)}
                  placeholder="Describe this image"
                />
              </label>
              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={handleCancelImageUpload}>
                  Cancel image upload
                </button>
                <button
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void handleConfirmImageUpload()}
                  disabled={!imageUploadFile || imageUploadSaving}
                >
                  {imageUploadSaving ? "Uploading..." : "Save and close"}
                </button>
              </div>
            </div>
          </div>
        )}


        {isMobile && mobileNodeMenuId && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:p-4">
            <div className="w-full rounded-t-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200/70 sm:max-w-md sm:rounded-xl">
              <div className="mb-2 text-sm font-semibold text-slate-900">
                {nodes.find((n) => n.id === mobileNodeMenuId)?.title || "Document"}
              </div>
              <div className="grid gap-2">
                <button className="btn btn-outline justify-start" onClick={() => {
                  setSelectedProcessId(null);
                  setSelectedNodeId(mobileNodeMenuId);
                  setMobileNodeMenuId(null);
                }}>Edit Properties</button>
                <button className="btn btn-outline justify-start" onClick={() => {
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
                }}>Add Relationship</button>
                <button className="btn btn-outline justify-start" onClick={async () => {
                  setOutlineCreateMode(null);
                  closeOutlineEditor();
                  setConfirmDeleteOutlineItemId(null);
                  setCollapsedHeadingIds(new Set());
                  setOutlineNodeId(mobileNodeMenuId);
                  setMobileNodeMenuId(null);
                  await loadOutline(mobileNodeMenuId);
                }}>Open Document Structure</button>
                <button className="btn btn-outline justify-start text-rose-700" onClick={() => {
                  setConfirmDeleteNodeId(mobileNodeMenuId);
                  setMobileNodeMenuId(null);
                }}>Delete Document</button>
                <button className="btn btn-outline" onClick={() => setMobileNodeMenuId(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {relationshipPopup && (
          <div
            ref={relationshipPopupRef}
            className="fixed z-[65] w-[320px] max-w-[90vw] rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg"
            style={{ left: relationshipPopup.x, top: relationshipPopup.y + 14, transform: "translateX(-50%)" }}
          >
            <div className="space-y-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">From</div>
                <div className="text-xs text-slate-800">{relationshipPopup.fromLabel}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">To</div>
                <div className="text-xs text-slate-800">{relationshipPopup.toLabel}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Mode</div>
                <div className="text-xs text-slate-800">{relationshipPopup.relationLabel}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Type</div>
                <div className="text-xs text-slate-800">{relationshipPopup.relationshipType}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Disciplines</div>
                <div className="text-xs text-slate-800">{relationshipPopup.disciplines}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Definition</div>
                <div className="text-xs text-slate-800">{relationshipPopup.description}</div>
              </div>
            </div>
          </div>
        )}

        {showAddRelationship && isMobile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70">
              <h2 className="text-lg font-semibold">Add Relationship</h2>
              <p className="mt-1 text-sm text-slate-600">From: {relationshipSourceNode?.title || relationshipSourceGrouping?.heading || "Unknown source"}</p>
              <div className="mt-4 grid gap-3">
                {relationshipModeGrouping ? (
                  <div className="relative">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Grouping Containers</div>
                    <div className="relative flex">
                      <input
                        className="w-full rounded-l border border-slate-300 bg-white px-3 py-2"
                        placeholder="Search grouping containers..."
                        value={relationshipGroupingQuery}
                        onChange={(e) => {
                          const query = e.target.value;
                          setRelationshipGroupingQuery(query);
                          const candidateId = groupingRelationCandidateIdByLabel.get(query) ?? "";
                          setRelationshipTargetGroupingId(candidateId && !alreadyRelatedGroupingTargetIds.has(candidateId) ? candidateId : "");
                        }}
                      />
                      <button
                        type="button"
                        className="rounded-r border border-l-0 border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => setShowRelationshipGroupingOptions((prev) => !prev)}
                      >
                        {showRelationshipGroupingOptions ? "â–²" : "â–¼"}
                      </button>
                    </div>
                    {showRelationshipGroupingOptions && (
                      <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                        {groupingRelationCandidates.length > 0 ? groupingRelationCandidates.map((el) => {
                          const optionLabel = groupingRelationCandidateLabelById.get(el.id) ?? (el.heading || "Group label");
                          const isDisabled = alreadyRelatedGroupingTargetIds.has(el.id);
                          return (
                            <button
                              key={el.id}
                              type="button"
                              className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                                isDisabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-800 hover:bg-slate-50"
                              }`}
                              disabled={isDisabled}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (isDisabled) return;
                                setRelationshipTargetGroupingId(el.id);
                                setRelationshipGroupingQuery(optionLabel);
                                setShowRelationshipGroupingOptions(false);
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>{optionLabel}</span>
                                {isDisabled && <span className="text-[10px] uppercase tracking-[0.06em]">Relationship already exists</span>}
                              </div>
                            </button>
                          );
                        }) : (
                          <div className="px-3 py-2 text-sm text-slate-500">No search results found</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                {allowDocumentTargets ? <div className="relative">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Documents</div>
                  <div className="relative flex">
                    <input
                      className="w-full rounded-l border border-slate-300 bg-white px-3 py-2"
                      placeholder="Search documents..."
                      value={relationshipDocumentQuery}
                      onChange={(e) => {
                        const query = e.target.value;
                        setRelationshipDocumentQuery(query);
                        const candidateId = documentRelationCandidateIdByLabel.get(query) ?? "";
                        setRelationshipTargetDocumentId(candidateId && !alreadyRelatedDocumentTargetIds.has(candidateId) ? candidateId : "");
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-r border border-l-0 border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setShowRelationshipDocumentOptions((prev) => !prev);
                        setShowRelationshipSystemOptions(false);
                      }}
                    >
                      {showRelationshipDocumentOptions ? "â–²" : "â–¼"}
                    </button>
                  </div>
                  {showRelationshipDocumentOptions && (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                      {documentRelationCandidates.length > 0 ? documentRelationCandidates.map((n) => {
                        const optionLabel = documentRelationCandidateLabelById.get(n.id) ?? n.title;
                        const isDisabled = alreadyRelatedDocumentTargetIds.has(n.id);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                              isDisabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-800 hover:bg-slate-50"
                            }`}
                            disabled={isDisabled}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (isDisabled) return;
                              setRelationshipTargetDocumentId(n.id);
                              setRelationshipTargetSystemId("");
                              setRelationshipDocumentQuery(optionLabel);
                              setShowRelationshipDocumentOptions(false);
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{optionLabel}</span>
                              {isDisabled && <span className="text-[10px] uppercase tracking-[0.06em]">Relationship already exists</span>}
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="px-3 py-2 text-sm text-slate-500">No search results found</div>
                      )}
                    </div>
                  )}
                </div> : null}
                {allowSystemTargets ? <div className="relative">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Components (Systems, Processes, People)</div>
                  <div className="relative flex">
                    <input
                      className="w-full rounded-l border border-slate-300 bg-white px-3 py-2"
                      placeholder="Search components..."
                      value={relationshipSystemQuery}
                      onChange={(e) => {
                        const query = e.target.value;
                        setRelationshipSystemQuery(query);
                        const candidateId = systemRelationCandidateIdByLabel.get(query) ?? "";
                        setRelationshipTargetSystemId(candidateId && !alreadyRelatedSystemTargetIds.has(candidateId) ? candidateId : "");
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-r border border-l-0 border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setShowRelationshipSystemOptions((prev) => !prev);
                        setShowRelationshipDocumentOptions(false);
                      }}
                    >
                      {showRelationshipSystemOptions ? "â–²" : "â–¼"}
                    </button>
                  </div>
                  {showRelationshipSystemOptions && (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                      {systemRelationCandidates.length > 0 ? systemRelationCandidates.map((el) => {
                        const optionLabel = systemRelationCandidateLabelById.get(el.id) ?? getElementRelationshipDisplayLabel(el);
                        const isDisabled = alreadyRelatedSystemTargetIds.has(el.id);
                        return (
                          <button
                            key={el.id}
                            type="button"
                            className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                              isDisabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-800 hover:bg-slate-50"
                            }`}
                            disabled={isDisabled}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (isDisabled) return;
                              setRelationshipTargetSystemId(el.id);
                              setRelationshipTargetDocumentId("");
                              setRelationshipSystemQuery(optionLabel);
                              setShowRelationshipSystemOptions(false);
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{optionLabel}</span>
                              {isDisabled && <span className="text-[10px] uppercase tracking-[0.06em]">Relationship already exists</span>}
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="px-3 py-2 text-sm text-slate-500">No search results found</div>
                      )}
                    </div>
                  )}
                </div> : null}
                {!allowDocumentTargets && !allowSystemTargets ? (
                  <div className="rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    No valid target component types are available for this source in Bow Tie mode.
                  </div>
                ) : null}
                  </>
                )}
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Disciplines</div>
                  <div className="relative">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left text-slate-700"
                      onClick={() => setShowRelationshipDisciplineMenu((prev) => !prev)}
                    >
                      <span className="truncate text-sm">
                        {relationshipDisciplineSelection.length
                          ? relationshipDisciplineSelection.map((key) => disciplineLabelByKey.get(key)).filter(Boolean).join(", ")
                          : "Select disciplines"}
                      </span>
                      <span className="text-xs text-slate-500">{showRelationshipDisciplineMenu ? "â–²" : "â–¼"}</span>
                    </button>
                    {showRelationshipDisciplineMenu && (
                      <div className="absolute z-20 mt-1 w-full rounded border border-slate-300 bg-white p-2 shadow-lg">
                        {disciplineOptions.map((option) => {
                          const checked = relationshipDisciplineSelection.includes(option.key);
                          return (
                            <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-black hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setRelationshipDisciplineSelection((prev) =>
                                    prev.includes(option.key)
                                      ? prev.filter((key) => key !== option.key)
                                      : [...prev, option.key]
                                  )
                                }
                              />
                              <span className="text-black">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <label className="text-sm">Relationship Type
                  <div className="relative mt-1">
                    <select
                      className="w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-black"
                      value={relationshipCategory}
                      onChange={(e) => setRelationshipCategory(e.target.value as RelationshipCategory)}
                    >
                      {relationshipCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black">?</span>
                  </div>
                </label>
                {relationshipCategory === "other" && (
                  <label className="text-sm">Custom Relationship Type
                    <input
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                      placeholder="Enter relationship type for this link only"
                      value={relationshipCustomType}
                      onChange={(e) => setRelationshipCustomType(e.target.value)}
                    />
                  </label>
                )}
                <textarea
                  className="rounded border border-slate-300 px-3 py-2"
                  rows={3}
                  placeholder="Relationship description (optional)"
                  value={relationshipDescription}
                  onChange={(e) => setRelationshipDescription(e.target.value)}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="btn btn-outline" onClick={closeAddRelationshipModal}>Cancel</button>
                <button
                  className="btn btn-primary"
                  disabled={
                    (!relationshipModeGrouping && (!allowDocumentTargets && !allowSystemTargets)) ||
                    (!relationshipModeGrouping && !relationshipTargetDocumentId && !relationshipTargetSystemId) ||
                    (relationshipModeGrouping && !relationshipTargetGroupingId) ||
                    (relationshipCategory === "other" && !relationshipCustomType.trim())
                  }
                  onClick={handleAddRelation}
                >
                  Add relationship
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!confirmDeleteNodeId && isMobile}
          title="Delete document?"
          message="This will permanently remove the document from the map."
          confirmLabel="Delete"
          onCancel={() => setConfirmDeleteNodeId(null)}
          onConfirm={() => {
            const id = confirmDeleteNodeId;
            setConfirmDeleteNodeId(null);
            if (!id) return;
            void handleDeleteNode(id);
          }}
        />

        <ConfirmDialog
          open={!!confirmDeleteOutlineItemId}
          title="Delete outline item?"
          message="This removes the selected heading/content and any dependent children defined by your data rules."
          confirmLabel="Delete"
          onCancel={() => setConfirmDeleteOutlineItemId(null)}
          onConfirm={() => void handleDeleteOutlineItem()}
        />

        <CategoryPropertiesAside
          open={!!selectedProcess}
          isMobile={isMobile}
          leftAsideSlideIn={leftAsideSlideIn}
          processMinWidthSquares={processMinWidthSquares}
          processMinHeightSquares={processMinHeightSquares}
          processHeadingDraft={processHeadingDraft}
          setProcessHeadingDraft={setProcessHeadingDraft}
          processWidthDraft={processWidthDraft}
          setProcessWidthDraft={setProcessWidthDraft}
          processHeightDraft={processHeightDraft}
          setProcessHeightDraft={setProcessHeightDraft}
          categoryColorOptions={categoryColorOptions}
          processColorDraft={processColorDraft}
          setProcessColorDraft={setProcessColorDraft}
          onDelete={async () => {
            if (!selectedProcess) return;
            await handleDeleteProcessElement(selectedProcess.id);
          }}
          onSave={handleSaveProcessHeading}
          onClose={() => setSelectedProcessId(null)}
        />
        <SystemPropertiesAside
          open={!!selectedSystem}
          isMobile={isMobile}
          leftAsideSlideIn={leftAsideSlideIn}
          systemNameDraft={systemNameDraft}
          setSystemNameDraft={setSystemNameDraft}
          onDelete={async () => {
            if (!selectedSystem) return;
            await handleDeleteProcessElement(selectedSystem.id);
          }}
          onSave={handleSaveSystemName}
          onClose={() => setSelectedSystemId(null)}
          onAddRelationship={() => {
            if (!selectedSystem) return;
            openAddRelationshipFromSource({ systemId: selectedSystem.id });
          }}
          relatedRows={relatedSystemRows}
          resolveLabels={resolveDocumentRelationLabels}
          relationshipSectionProps={{
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
            getDisciplineLabel: (key) => disciplineLabelByKey.get(key),
            onStartEdit: startEditRelation,
            onDelete: handleDeleteRelation,
            onSave: (id) => void handleUpdateRelation(id),
            onCancelEdit: cancelEditRelation,
          }}
        />
        <ProcessPropertiesAside
          open={!!selectedProcessComponent}
          isMobile={isMobile}
          leftAsideSlideIn={leftAsideSlideIn}
          processComponentLabelDraft={processComponentLabelDraft}
          setProcessComponentLabelDraft={setProcessComponentLabelDraft}
          onDelete={async () => {
            if (!selectedProcessComponent) return;
            await handleDeleteProcessElement(selectedProcessComponent.id);
          }}
          onSave={handleSaveProcessComponent}
          onClose={() => setSelectedProcessComponentId(null)}
          onAddRelationship={() => {
            if (!selectedProcessComponent) return;
            openAddRelationshipFromSource({ systemId: selectedProcessComponent.id });
          }}
          relatedRows={relatedProcessComponentRows}
          resolveLabels={resolveDocumentRelationLabels}
          relationshipSectionProps={{
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
            getDisciplineLabel: (key) => disciplineLabelByKey.get(key),
            onStartEdit: startEditRelation,
            onDelete: handleDeleteRelation,
            onSave: (id) => void handleUpdateRelation(id),
            onCancelEdit: cancelEditRelation,
          }}
        />
        <PersonPropertiesAside
          open={!!selectedPerson}
          isMobile={isMobile}
          leftAsideSlideIn={leftAsideSlideIn}
          mapCategoryId={mapCategoryId}
          personRoleDraft={personRoleDraft}
          setPersonRoleDraft={setPersonRoleDraft}
          personRoleIdDraft={personRoleIdDraft}
          setPersonRoleIdDraft={setPersonRoleIdDraft}
          personDepartmentDraft={personDepartmentDraft}
          setPersonDepartmentDraft={setPersonDepartmentDraft}
          personOccupantNameDraft={personOccupantNameDraft}
          setPersonOccupantNameDraft={setPersonOccupantNameDraft}
          personStartDateDraft={personStartDateDraft}
          setPersonStartDateDraft={setPersonStartDateDraft}
          personEmploymentTypeDraft={personEmploymentTypeDraft}
          setPersonEmploymentTypeDraft={setPersonEmploymentTypeDraft}
          personActingNameDraft={personActingNameDraft}
          setPersonActingNameDraft={setPersonActingNameDraft}
          personActingStartDateDraft={personActingStartDateDraft}
          setPersonActingStartDateDraft={setPersonActingStartDateDraft}
          personRecruitingDraft={personRecruitingDraft}
          setPersonRecruitingDraft={setPersonRecruitingDraft}
          personContractorRoleDraft={personContractorRoleDraft}
          setPersonContractorRoleDraft={setPersonContractorRoleDraft}
          personProposedRoleDraft={personProposedRoleDraft}
          setPersonProposedRoleDraft={setPersonProposedRoleDraft}
          orgChartDepartmentOptions={orgChartDepartmentOptions}
          onDelete={async () => {
            if (!selectedPerson) return;
            await handleDeleteProcessElement(selectedPerson.id);
          }}
          onSave={handleSavePerson}
          onClose={() => setSelectedPersonId(null)}
          onAddRelationship={() => {
            if (!selectedPerson) return;
            openAddRelationshipFromSource({ systemId: selectedPerson.id });
          }}
          relatedRows={relatedPersonRows}
          resolveLabels={resolvePersonRelationLabels}
          relationshipSectionProps={{
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
            getDisciplineLabel: (key) => disciplineLabelByKey.get(key),
            onStartEdit: startEditRelation,
            onDelete: handleDeleteRelation,
            onSave: (id) => void handleUpdateRelation(id),
            onCancelEdit: cancelEditRelation,
          }}
        />
        <BowtiePropertiesAside
          open={!!selectedBowtieElement}
          isMobile={isMobile}
          leftAsideSlideIn={leftAsideSlideIn}
          bowtieElementType={
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
              : null
          }
          bowtieHeadingDraft={bowtieHeadingDraft}
          setBowtieHeadingDraft={setBowtieHeadingDraft}
          bowtieDraft={bowtieDraft}
          setBowtieDraft={setBowtieDraft}
          onDelete={async () => {
            if (!selectedBowtieElement) return;
            await handleDeleteProcessElement(selectedBowtieElement.id);
            setSelectedBowtieElementId(null);
          }}
          onSave={handleSaveBowtieElement}
          onClose={() => setSelectedBowtieElementId(null)}
          onAddRelationship={() => {
            if (!selectedBowtieElement) return;
            openAddRelationshipFromSource({ systemId: selectedBowtieElement.id });
          }}
          relatedRows={relatedBowtieRows}
          resolveLabels={resolvePersonRelationLabels}
          relationshipSectionProps={{
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
            getDisciplineLabel: (key) => disciplineLabelByKey.get(key),
            onStartEdit: startEditRelation,
            onDelete: handleDeleteRelation,
            onSave: (id) => void handleUpdateRelation(id),
            onCancelEdit: cancelEditRelation,
          }}
        />
        <GroupingContainerAside
          open={!!selectedGrouping}
          isMobile={isMobile}
          leftAsideSlideIn={leftAsideSlideIn}
          groupingLabelDraft={groupingLabelDraft}
          setGroupingLabelDraft={setGroupingLabelDraft}
          groupingWidthDraft={groupingWidthDraft}
          setGroupingWidthDraft={setGroupingWidthDraft}
          groupingHeightDraft={groupingHeightDraft}
          setGroupingHeightDraft={setGroupingHeightDraft}
          onDelete={async () => {
            if (!selectedGrouping) return;
            await handleDeleteProcessElement(selectedGrouping.id);
          }}
          onSave={handleSaveGroupingContainer}
          onClose={() => setSelectedGroupingId(null)}
          onAddRelationship={() => {
            if (!selectedGrouping) return;
            openAddRelationshipFromSource({ groupingId: selectedGrouping.id });
          }}
          relatedRows={relatedGroupingRows}
          resolveLabels={resolveGroupingRelationLabels}
          relationshipSectionProps={{
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
            getDisciplineLabel: (key) => disciplineLabelByKey.get(key),
            onStartEdit: startEditRelation,
            onDelete: handleDeleteRelation,
            onSave: (id) => void handleUpdateRelation(id),
            onCancelEdit: cancelEditRelation,
          }}
        />
        <StickyNoteAside
          open={!!selectedSticky}
          isMobile={isMobile}
          leftAsideSlideIn={leftAsideSlideIn}
          stickyTextDraft={stickyTextDraft}
          setStickyTextDraft={setStickyTextDraft}
          onDelete={async () => {
            if (!selectedSticky) return;
            await handleDeleteProcessElement(selectedSticky.id);
          }}
          onSave={handleSaveStickyNote}
          onClose={() => setSelectedStickyId(null)}
        />
        <ImageAssetAside
          open={!!selectedImage}
          isMobile={isMobile}
          leftAsideSlideIn={leftAsideSlideIn}
          imageDescriptionDraft={imageDescriptionDraft}
          setImageDescriptionDraft={setImageDescriptionDraft}
          onDelete={async () => {
            if (!selectedImage) return;
            const cfg = (selectedImage.element_config as Record<string, unknown> | null) ?? {};
            const path = typeof cfg.storage_path === "string" ? cfg.storage_path : "";
            if (path) {
              await supabaseBrowser.storage.from("systemmap").remove([path]);
            }
            await handleDeleteProcessElement(selectedImage.id);
            setSelectedImageId(null);
          }}
          onSave={handleSaveImageAsset}
          onClose={() => setSelectedImageId(null)}
          onAddRelationship={() => {
            if (!selectedImage) return;
            openAddRelationshipFromSource({ systemId: selectedImage.id });
          }}
          relatedRows={relatedImageRows}
          resolveLabels={resolvePersonRelationLabels}
          relationshipSectionProps={{
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
            getDisciplineLabel: (key) => disciplineLabelByKey.get(key),
            onStartEdit: startEditRelation,
            onDelete: handleDeleteRelation,
            onSave: (id) => void handleUpdateRelation(id),
            onCancelEdit: cancelEditRelation,
          }}
        />
        <TextBoxAside
          open={!!selectedTextBox}
          isMobile={isMobile}
          leftAsideSlideIn={leftAsideSlideIn}
          textBoxContentDraft={textBoxContentDraft}
          setTextBoxContentDraft={setTextBoxContentDraft}
          textBoxBoldDraft={textBoxBoldDraft}
          setTextBoxBoldDraft={setTextBoxBoldDraft}
          textBoxItalicDraft={textBoxItalicDraft}
          setTextBoxItalicDraft={setTextBoxItalicDraft}
          textBoxUnderlineDraft={textBoxUnderlineDraft}
          setTextBoxUnderlineDraft={setTextBoxUnderlineDraft}
          textBoxAlignDraft={textBoxAlignDraft}
          setTextBoxAlignDraft={setTextBoxAlignDraft}
          textBoxFontSizeDraft={textBoxFontSizeDraft}
          setTextBoxFontSizeDraft={setTextBoxFontSizeDraft}
          onDelete={async () => {
            if (!selectedTextBox) return;
            await handleDeleteProcessElement(selectedTextBox.id);
            setSelectedTextBoxId(null);
          }}
          onSave={handleSaveTextBox}
          onClose={() => setSelectedTextBoxId(null)}
        />
        <DocumentPropertiesAside
          open={!!selectedNode && !isMobile}
          leftAsideSlideIn={leftAsideSlideIn}
          onClose={handleCloseDocumentPropertiesPanel}
          onOpenRelationship={() => {
            if (!selectedNode) return;
            openAddRelationshipFromSource({ nodeId: selectedNode.id });
          }}
          onOpenStructure={async () => {
            if (!selectedNode) return;
            setOutlineCreateMode(null);
            closeOutlineEditor();
            setConfirmDeleteOutlineItemId(null);
            setCollapsedHeadingIds(new Set());
            setOutlineNodeId(selectedNode.id);
            await loadOutline(selectedNode.id);
            setDesktopNodeAction("structure");
          }}
          onOpenDelete={() => {
            if (!selectedNode) return;
            setConfirmDeleteNodeId(selectedNode.id);
            setDesktopNodeAction("delete");
          }}
          selectedTypeId={selectedTypeId}
          setSelectedTypeId={setSelectedTypeId}
          showTypeSelectArrowUp={showTypeSelectArrowUp}
          setShowTypeSelectArrowUp={setShowTypeSelectArrowUp}
          addDocumentTypes={addDocumentTypes}
          getDisplayTypeName={getDisplayTypeName}
          title={title}
          setTitle={setTitle}
          documentNumber={documentNumber}
          setDocumentNumber={setDocumentNumber}
          disciplineMenuRef={disciplineMenuRef}
          showDisciplineMenu={showDisciplineMenu}
          setShowDisciplineMenu={setShowDisciplineMenu}
          disciplineSelection={disciplineSelection}
          setDisciplineSelection={setDisciplineSelection}
          disciplineOptions={disciplineOptions}
          getDisciplineLabel={(key) => disciplineLabelByKey.get(key)}
          userGroup={userGroup}
          setUserGroup={setUserGroup}
          showUserGroupSelectArrowUp={showUserGroupSelectArrowUp}
          setShowUserGroupSelectArrowUp={setShowUserGroupSelectArrowUp}
          userGroupOptions={userGroupOptions}
          ownerName={ownerName}
          setOwnerName={setOwnerName}
          onSaveNode={handleSaveNode}
          relatedRows={relatedRows}
          resolveLabels={resolveDocumentRelationLabels}
          relationshipSectionProps={{
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
            getDisciplineLabel: (key) => disciplineLabelByKey.get(key),
            onStartEdit: startEditRelation,
            onDelete: handleDeleteRelation,
            onSave: (id) => void handleUpdateRelation(id),
            onCancelEdit: cancelEditRelation,
          }}
        />        <AddRelationshipAside
          open={Boolean(!isMobile && desktopNodeAction === "relationship" && showAddRelationship)}
          relationshipModeGrouping={relationshipModeGrouping}
          relationshipSourceLabel={
            relationshipSourceNode?.title ||
            (relationshipSourceSystem ? getElementDisplayName(relationshipSourceSystem) : "") ||
            relationshipSourceGrouping?.heading ||
            ""
          }
          relationshipSourceNodeTitle={relationshipSourceNode?.title || ""}
          relationshipSourceGroupingHeading={relationshipSourceGrouping?.heading || ""}
          allowDocumentTargets={allowDocumentTargets}
          allowSystemTargets={allowSystemTargets}
          relationshipGroupingQuery={relationshipGroupingQuery}
          setRelationshipGroupingQuery={setRelationshipGroupingQuery}
          groupingRelationCandidateIdByLabel={groupingRelationCandidateIdByLabel}
          setRelationshipTargetGroupingId={setRelationshipTargetGroupingId}
          alreadyRelatedGroupingTargetIds={alreadyRelatedGroupingTargetIds}
          showRelationshipGroupingOptions={showRelationshipGroupingOptions}
          setShowRelationshipGroupingOptions={setShowRelationshipGroupingOptions}
          groupingRelationCandidates={groupingRelationCandidates}
          groupingRelationCandidateLabelById={groupingRelationCandidateLabelById}
          relationshipDocumentQuery={relationshipDocumentQuery}
          setRelationshipDocumentQuery={setRelationshipDocumentQuery}
          documentRelationCandidateIdByLabel={documentRelationCandidateIdByLabel}
          setRelationshipTargetDocumentId={setRelationshipTargetDocumentId}
          alreadyRelatedDocumentTargetIds={alreadyRelatedDocumentTargetIds}
          showRelationshipDocumentOptions={showRelationshipDocumentOptions}
          setShowRelationshipDocumentOptions={setShowRelationshipDocumentOptions}
          documentRelationCandidates={documentRelationCandidates}
          documentRelationCandidateLabelById={documentRelationCandidateLabelById}
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
          onAdd={async () => {
            await handleAddRelation();
            setDesktopNodeAction(null);
          }}
          onCancel={() => {
            closeAddRelationshipModal();
            setDesktopNodeAction(null);
          }}
        />
        <DeleteDocumentAside
          open={Boolean(selectedNode && !isMobile && desktopNodeAction === "delete" && !!confirmDeleteNodeId)}
          onDelete={async () => {
            const id = confirmDeleteNodeId;
            setConfirmDeleteNodeId(null);
            setDesktopNodeAction(null);
            if (!id) return;
            await handleDeleteNode(id);
          }}
          onCancel={() => {
            setConfirmDeleteNodeId(null);
            setDesktopNodeAction(null);
          }}
        />
        <MobileDocumentPropertiesModal
          open={Boolean(selectedNode && isMobile)}
          onClose={() => setSelectedNodeId(null)}
          selectedTypeId={selectedTypeId}
          setSelectedTypeId={setSelectedTypeId}
          addDocumentTypes={addDocumentTypes}
          getDisplayTypeName={getDisplayTypeName}
          title={title}
          setTitle={setTitle}
          documentNumber={documentNumber}
          setDocumentNumber={setDocumentNumber}
          showDisciplineMenu={showDisciplineMenu}
          setShowDisciplineMenu={setShowDisciplineMenu}
          disciplineMenuRef={disciplineMenuRef}
          disciplineSelection={disciplineSelection}
          setDisciplineSelection={setDisciplineSelection}
          disciplineOptions={disciplineOptions}
          getDisciplineLabel={(key) => disciplineLabelByKey.get(key)}
          userGroup={userGroup}
          setUserGroup={setUserGroup}
          userGroupOptions={userGroupOptions}
          ownerName={ownerName}
          setOwnerName={setOwnerName}
          onSaveNode={handleSaveNode}
          relatedItems={mobileRelatedItems}
          onDeleteRelation={handleDeleteRelation}
        />
        <DocumentStructureAside
          open={Boolean(isMobile || shouldShowDesktopStructurePanel)}
          isMobile={isMobile}
          outlineNodeId={outlineNodeId}
          shouldShowDesktopStructurePanel={shouldShowDesktopStructurePanel}
          onClose={() => {
            setOutlineNodeId(null);
            setOutlineCreateMode(null);
            closeOutlineEditor();
            setConfirmDeleteOutlineItemId(null);
            setDesktopNodeAction(null);
          }}
          setOutlineCreateMode={setOutlineCreateMode}
          closeOutlineEditor={closeOutlineEditor}
          setNewHeadingTitle={setNewHeadingTitle}
          setNewHeadingLevel={setNewHeadingLevel}
          setNewHeadingParentId={setNewHeadingParentId}
          setNewContentText={setNewContentText}
          setNewContentHeadingId={setNewContentHeadingId}
          headingItems={headingItems}
          outlineCreateMode={outlineCreateMode}
          newHeadingTitle={newHeadingTitle}
          newHeadingLevel={newHeadingLevel}
          newHeadingParentId={newHeadingParentId}
          level1Headings={level1Headings}
          level2Headings={level2Headings}
          handleCreateHeading={handleCreateHeading}
          newContentHeadingId={newContentHeadingId}
          newContentText={newContentText}
          handleCreateContent={handleCreateContent}
          outlineEditItem={outlineEditItem}
          editHeadingTitle={editHeadingTitle}
          setEditHeadingTitle={setEditHeadingTitle}
          editHeadingLevel={editHeadingLevel}
          setEditHeadingLevel={setEditHeadingLevel}
          editHeadingParentId={editHeadingParentId}
          setEditHeadingParentId={setEditHeadingParentId}
          editContentHeadingId={editContentHeadingId}
          setEditContentHeadingId={setEditContentHeadingId}
          editContentText={editContentText}
          setEditContentText={setEditContentText}
          handleSaveOutlineEdit={handleSaveOutlineEdit}
          visibleOutlineItems={visibleOutlineItems}
          outlineItems={outlineItems}
          collapsedHeadingIds={collapsedHeadingIds}
          setCollapsedHeadingIds={setCollapsedHeadingIds}
          openOutlineEditor={openOutlineEditor}
          setConfirmDeleteOutlineItemId={setConfirmDeleteOutlineItemId}
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








