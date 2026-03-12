"use client";

import { useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { CanvasElementRow, DisciplineKey, DocumentNodeRow } from "./canvasShared";
import { boxesOverlap, parseOrgChartPersonConfig } from "./canvasShared";
import type { MapCategoryId } from "./mapCategories";

type UseCanvasElementActionsParams = {
  mapCategoryId: MapCategoryId;
  canWriteMap: boolean;
  canCreateSticky: boolean;
  canEditElement: (el: CanvasElementRow) => boolean;
  mapId: string;
  userId: string | null;
  rf: { screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number } } | null;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  snapToMinorGrid: (value: number) => number;
  setError: (value: string | null) => void;
  setShowAddMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setNodes: React.Dispatch<React.SetStateAction<DocumentNodeRow[]>>;
  setElements: React.Dispatch<React.SetStateAction<CanvasElementRow[]>>;
  savedPos: React.MutableRefObject<Record<string, { x: number; y: number }>>;
  addDocumentTypes: Array<{ id: string; name: string }>;
  isLandscapeTypeName: (name: string) => boolean;
  unconfiguredDocumentTitle: string;
  landscapeDefaultWidth: number;
  defaultWidth: number;
  landscapeDefaultHeight: number;
  defaultHeight: number;
  canvasElementSelectColumns: string;
  processHeadingWidth: number;
  processHeadingHeight: number;
  systemCircleDiameter: number;
  systemCircleElementHeight: number;
  processComponentWidth: number;
  processComponentElementHeight: number;
  buildPersonHeading: (role: string, department: string) => string;
  personElementWidth: number;
  personElementHeight: number;
  orgChartPersonWidth: number;
  orgChartPersonHeight: number;
  groupingDefaultWidth: number;
  groupingDefaultHeight: number;
  stickyDefaultSize: number;
  imageDefaultWidth: number;
  imageMinWidth: number;
  imageMinHeight: number;
  textBoxDefaultWidth: number;
  textBoxDefaultHeight: number;
  tableDefaultWidth: number;
  tableDefaultHeight: number;
  tableMinWidth: number;
  tableMinHeight: number;
  tableMinRows: number;
  tableMinColumns: number;
  shapeRectangleDefaultWidth: number;
  shapeRectangleDefaultHeight: number;
  shapeCircleDefaultSize: number;
  shapePillDefaultWidth: number;
  shapePillDefaultHeight: number;
  shapePentagonDefaultWidth: number;
  shapePentagonDefaultHeight: number;
  shapeArrowDefaultWidth: number;
  shapeArrowDefaultHeight: number;
  shapeArrowMinWidth: number;
  shapeArrowMinHeight: number;
  shapeMinWidth: number;
  shapeMinHeight: number;
  shapeDefaultFillColor: string;
  bowtieDefaultWidth: number;
  bowtieHazardHeight: number;
  bowtieSquareHeight: number;
  bowtieControlHeight: number;
  bowtieRiskRatingHeight: number;
  incidentDefaultWidth: number;
  incidentThreeTwoHeight: number;
  incidentSquareSize: number;
  incidentFourThreeHeight: number;
  incidentThreeOneHeight: number;
  selectedProcessId: string | null;
  processHeadingDraft: string;
  processWidthDraft: string;
  processHeightDraft: string;
  processMinWidthSquares: number;
  processMinHeightSquares: number;
  processMinWidth: number;
  processMinHeight: number;
  minorGridSize: number;
  processColorDraft: string | null;
  setSelectedProcessId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedSystemId: string | null;
  systemNameDraft: string;
  setSelectedSystemId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedProcessComponentId: string | null;
  processComponentLabelDraft: string;
  setSelectedProcessComponentId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedPersonId: string | null;
  personRoleDraft: string;
  personRoleIdDraft: string;
  personDepartmentDraft: string;
  personOccupantNameDraft: string;
  personStartDateDraft: string;
  personEmploymentTypeDraft: "fte" | "contractor";
  personActingNameDraft: string;
  personActingStartDateDraft: string;
  personRecruitingDraft: boolean;
  personProposedRoleDraft: boolean;
  setSelectedPersonId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedGroupingId: string | null;
  groupingLabelDraft: string;
  groupingWidthDraft: string;
  groupingHeightDraft: string;
  groupingMinWidthSquares: number;
  groupingMinHeightSquares: number;
  groupingMinWidth: number;
  groupingMinHeight: number;
  setSelectedGroupingId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedStickyId: string | null;
  stickyTextDraft: string;
  selectedImageId: string | null;
  imageDescriptionDraft: string;
  selectedTextBoxId: string | null;
  textBoxContentDraft: string;
  textBoxBoldDraft: boolean;
  textBoxItalicDraft: boolean;
  textBoxUnderlineDraft: boolean;
  textBoxAlignDraft: "left" | "center" | "right";
  textBoxFontSizeDraft: string;
  selectedTableId: string | null;
  tableRowsDraft: string;
  tableColumnsDraft: string;
  tableHeaderBgDraft: string;
  tableBoldDraft: boolean;
  tableItalicDraft: boolean;
  tableUnderlineDraft: boolean;
  tableAlignDraft: "left" | "center" | "right";
  tableFontSizeDraft: string;
  selectedFlowShapeId: string | null;
  flowShapeTextDraft: string;
  flowShapeAlignDraft: "left" | "center" | "right";
  flowShapeBoldDraft: boolean;
  flowShapeItalicDraft: boolean;
  flowShapeUnderlineDraft: boolean;
  flowShapeFontSizeDraft: string;
  flowShapeColorDraft: string;
  flowShapeFillModeDraft: "fill" | "outline";
  flowShapeDirectionDraft: "left" | "right";
  flowShapeRotationDraft: 0 | 90 | 180 | 270;
  elements: CanvasElementRow[];
  nodes: DocumentNodeRow[];
  setSelectedStickyId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedImageId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTextBoxId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTableId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedFlowShapeId: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useCanvasElementActions(params: UseCanvasElementActionsParams) {
  const {
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
  } = params;

  const normalizeColorHex = useCallback((value: string | null | undefined): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return null;
    return trimmed.toUpperCase();
  }, []);

  const getCenter = useCallback(() => {
    if (!rf || !canvasRef.current) return null;
    const box = canvasRef.current.getBoundingClientRect();
    const center = rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    return { x: snapToMinorGrid(center.x), y: snapToMinorGrid(center.y) };
  }, [rf, canvasRef, snapToMinorGrid]);

  const getShapeDimensions = useCallback(
    (element: CanvasElementRow) => {
      const fallbackWidth =
        element.element_type === "shape_circle"
          ? shapeCircleDefaultSize
          : element.element_type === "shape_pill"
          ? shapePillDefaultWidth
          : element.element_type === "shape_arrow"
          ? shapeArrowDefaultWidth
          : element.element_type === "shape_pentagon" || element.element_type === "shape_chevron_left"
          ? shapePentagonDefaultWidth
          : shapeRectangleDefaultWidth;
      const fallbackHeight =
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
      let width = Math.max(minWidth, element.width || fallbackWidth);
      let height = Math.max(minHeight, element.height || fallbackHeight);
      if (element.element_type === "shape_circle") {
        const side = Math.max(width, height);
        width = side;
        height = side;
      }
      return { width, height };
    },
    [
      shapeArrowDefaultHeight,
      shapeArrowDefaultWidth,
      shapeArrowMinHeight,
      shapeArrowMinWidth,
      shapeCircleDefaultSize,
      shapeMinHeight,
      shapeMinWidth,
      shapePentagonDefaultHeight,
      shapePentagonDefaultWidth,
      shapePillDefaultHeight,
      shapePillDefaultWidth,
      shapeRectangleDefaultHeight,
      shapeRectangleDefaultWidth,
    ]
  );

  const findNearestAvailableShapePosition = useCallback(
    (x: number, y: number, width: number, height: number, movingType: CanvasElementRow["element_type"]) => {
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
      const blocked: Array<{ x: number; y: number; width: number; height: number; elementType?: CanvasElementRow["element_type"] }> =
        movingType === "shape_arrow"
          ? [
              ...nodes
                .map((n) => {
                  const nodeWidth = Number(n.width ?? 0);
                  const nodeHeight = Number(n.height ?? 0);
                  if (!Number.isFinite(nodeWidth) || !Number.isFinite(nodeHeight) || nodeWidth <= 0 || nodeHeight <= 0) return null;
                  return { x: n.pos_x, y: n.pos_y, width: nodeWidth, height: nodeHeight };
                })
                .filter((rect): rect is { x: number; y: number; width: number; height: number } => Boolean(rect)),
              ...elements.map((el) => {
                let dims: { width: number; height: number };
                if (
                  el.element_type === "shape_rectangle" ||
                  el.element_type === "shape_circle" ||
                  el.element_type === "shape_pill" ||
                  el.element_type === "shape_pentagon" ||
                  el.element_type === "shape_chevron_left" ||
                  el.element_type === "shape_arrow"
                ) {
                  dims = getShapeDimensions(el);
                } else {
                  dims = {
                    width: Math.max(shapeMinWidth, Number(el.width ?? shapeRectangleDefaultWidth)),
                    height: Math.max(shapeMinHeight, Number(el.height ?? shapeRectangleDefaultHeight)),
                  };
                }
                return { x: el.pos_x, y: el.pos_y, width: dims.width, height: dims.height };
              }),
            ]
          : elements
              .filter(
                (el) =>
                  el.element_type === "shape_rectangle" ||
                  el.element_type === "shape_circle" ||
                  el.element_type === "shape_pill" ||
                  el.element_type === "shape_pentagon" ||
                  el.element_type === "shape_chevron_left" ||
                  el.element_type === "shape_arrow"
              )
              .map((el) => {
                const dims = getShapeDimensions(el);
                return { x: el.pos_x, y: el.pos_y, width: dims.width, height: dims.height, elementType: el.element_type };
              });
      const overlapsAt = (candidateX: number, candidateY: number) =>
        blocked.some((box) => {
          const candidate = { x: candidateX, y: candidateY, width, height };
          if (!boxesOverlap(candidate, box, 0)) return false;
          if (box.elementType && isPentagonChevronPair(movingType, box.elementType)) {
            return exceedsAllowedOverlap(candidate, box, minorGridSize * 2);
          }
          return true;
        });
      const startX = snapToMinorGrid(x);
      const startY = snapToMinorGrid(y);
      if (!overlapsAt(startX, startY)) return { x: startX, y: startY };
      const maxRing = 120;
      for (let ring = 1; ring <= maxRing; ring += 1) {
        for (let dx = -ring; dx <= ring; dx += 1) {
          for (let dy = -ring; dy <= ring; dy += 1) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
            const candidateX = snapToMinorGrid(startX + dx * minorGridSize);
            const candidateY = snapToMinorGrid(startY + dy * minorGridSize);
            if (!overlapsAt(candidateX, candidateY)) return { x: candidateX, y: candidateY };
          }
        }
      }
      return null;
    },
    [elements, getShapeDimensions, minorGridSize, nodes, shapeMinHeight, shapeMinWidth, shapeRectangleDefaultHeight, shapeRectangleDefaultWidth, snapToMinorGrid]
  );

  const handleAddBlankDocument = useCallback(async () => {
    if (!canWriteMap) {
      setError("You have view access only for this map.");
      return;
    }
    const t = addDocumentTypes[0];
    const center = getCenter();
    if (!t || !center) return;
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("document_nodes")
      .insert({
        map_id: mapId,
        type_id: t.id,
        title: unconfiguredDocumentTitle,
        document_number: null,
        pos_x: center.x,
        pos_y: center.y,
        width: isLandscapeTypeName(t.name) ? landscapeDefaultWidth : defaultWidth,
        height: isLandscapeTypeName(t.name) ? landscapeDefaultHeight : defaultHeight,
      })
      .select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived")
      .single();
    if (e || !data) {
      setError(e?.message || "Unable to create document.");
      return;
    }
    const inserted = data as DocumentNodeRow;
    setNodes((prev) => [...prev, inserted]);
    savedPos.current[inserted.id] = { x: inserted.pos_x, y: inserted.pos_y };
    setShowAddMenu(false);
  }, [canWriteMap, addDocumentTypes, getCenter, mapId, unconfiguredDocumentTitle, isLandscapeTypeName, landscapeDefaultWidth, defaultWidth, landscapeDefaultHeight, defaultHeight, setError, setNodes, savedPos, setShowAddMenu]);

  const addElement = useCallback(async (payload: Partial<CanvasElementRow>, errorMessage: string) => {
    const normalizedColor =
      payload.element_type === "sticky_note" ? null : normalizeColorHex(payload.color_hex ?? null);
    const normalizedPayload: Partial<CanvasElementRow> = {
      ...payload,
      color_hex: normalizedColor,
    };
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .insert(normalizedPayload)
      .select(canvasElementSelectColumns)
      .single();
    if (e || !data) {
      setError(e?.message || errorMessage);
      return null;
    }
    const inserted = data as unknown as CanvasElementRow;
    setElements((prev) => [...prev, inserted]);
    setShowAddMenu(false);
    return inserted;
  }, [canvasElementSelectColumns, normalizeColorHex, setElements, setError, setShowAddMenu]);

  const handleAddProcessHeading = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement({
      map_id: mapId,
      element_type: "category",
      heading: "New Category",
      color_hex: null,
      created_by_user_id: userId,
      pos_x: center.x,
      pos_y: center.y,
      width: processHeadingWidth,
      height: processHeadingHeight,
    }, "Unable to create process heading.");
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, processHeadingWidth, processHeadingHeight]);

  const handleAddSystemCircle = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement({
      map_id: mapId,
      element_type: "system_circle",
      heading: "System Name",
      color_hex: null,
      created_by_user_id: userId,
      pos_x: center.x,
      pos_y: center.y,
      width: systemCircleDiameter,
      height: systemCircleElementHeight,
    }, "Unable to create system element.");
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, systemCircleDiameter, systemCircleElementHeight]);

  const handleAddProcessComponent = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement({
      map_id: mapId,
      element_type: "process_component",
      heading: "Process",
      color_hex: null,
      created_by_user_id: userId,
      pos_x: center.x,
      pos_y: center.y,
      width: processComponentWidth,
      height: processComponentElementHeight,
    }, "Unable to create process component.");
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, processComponentWidth, processComponentElementHeight]);

  const handleAddPerson = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    const isOrgChart = mapCategoryId === "org_chart";
    await addElement({
      map_id: mapId,
      element_type: "person",
      heading: buildPersonHeading("Role Name", "Department"),
      color_hex: null,
      created_by_user_id: userId,
      element_config: isOrgChart
        ? {
            position_title: "Position Title",
            role_id: "",
            department: "",
            occupant_name: "",
            start_date: "",
            employment_type: "fte",
            acting_name: "",
            acting_start_date: "",
            recruiting: false,
            contractor_role: false,
            proposed_role: false,
          }
        : null,
      pos_x: center.x,
      pos_y: center.y,
      width: isOrgChart ? orgChartPersonWidth : personElementWidth,
      height: isOrgChart ? orgChartPersonHeight : personElementHeight,
    }, "Unable to create person component.");
  }, [canWriteMap, setError, getCenter, addElement, mapId, mapCategoryId, buildPersonHeading, userId, orgChartPersonWidth, orgChartPersonHeight, personElementWidth, personElementHeight]);

  const handleAddGroupingContainer = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement({
      map_id: mapId,
      element_type: "grouping_container",
      heading: "Group label",
      color_hex: null,
      created_by_user_id: userId,
      pos_x: center.x,
      pos_y: center.y,
      width: groupingDefaultWidth,
      height: groupingDefaultHeight,
    }, "Unable to create grouping container.");
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, groupingDefaultWidth, groupingDefaultHeight]);

  const handleAddStickyNote = useCallback(async () => {
    if (!canCreateSticky || !userId) return;
    const center = getCenter();
    if (!center) return;
    await addElement({
      map_id: mapId,
      element_type: "sticky_note",
      heading: "Enter Text",
      color_hex: null,
      created_by_user_id: userId,
      pos_x: center.x,
      pos_y: center.y,
      width: stickyDefaultSize,
      height: stickyDefaultSize,
    }, "Unable to create sticky note.");
  }, [canCreateSticky, userId, getCenter, addElement, mapId, stickyDefaultSize]);

  const handleAddTextBox = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement({
      map_id: mapId,
      element_type: "text_box",
      heading: "Click to edit text box",
      color_hex: null,
      created_by_user_id: userId,
      element_config: {
        bold: false,
        italic: false,
        underline: false,
        align: "left",
        font_size: 16,
      },
      pos_x: center.x,
      pos_y: center.y,
      width: textBoxDefaultWidth,
      height: textBoxDefaultHeight,
    }, "Unable to create text box.");
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, textBoxDefaultWidth, textBoxDefaultHeight]);

  const handleAddTable = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "table",
        heading: "Table",
        color_hex: null,
        created_by_user_id: userId,
        element_config: {
          rows: 2,
          columns: 2,
          header_bg_color: null,
          bold: false,
          italic: false,
          underline: false,
          align: "center",
          font_size: 10,
        },
        pos_x: center.x,
        pos_y: center.y,
        width: tableDefaultWidth,
        height: tableDefaultHeight,
      },
      "Unable to create table."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, tableDefaultWidth, tableDefaultHeight]);

  const handleAddImageAsset = useCallback(async (args: { storagePath: string; description: string; width?: number; height?: number }) => {
    if (!canWriteMap) return null;
    const center = getCenter();
    if (!center) return null;
    return await addElement({
      map_id: mapId,
      element_type: "image_asset",
      heading: args.description.trim() || "Image",
      color_hex: null,
      created_by_user_id: userId,
      element_config: {
        storage_path: args.storagePath,
        description: args.description.trim() || "",
      },
      pos_x: center.x,
      pos_y: center.y,
      width: Math.max(imageMinWidth, args.width ?? imageDefaultWidth),
      height: Math.max(imageMinHeight, args.height ?? imageDefaultWidth),
    }, "Unable to create image.");
  }, [canWriteMap, getCenter, addElement, mapId, userId, imageDefaultWidth, imageMinWidth, imageMinHeight]);

  const handleAddShapeRectangle = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    const position = findNearestAvailableShapePosition(
      center.x,
      center.y,
      shapeRectangleDefaultWidth,
      shapeRectangleDefaultHeight,
      "shape_rectangle"
    );
    if (!position) return setError("No free space available for a new shape.");
    await addElement({
      map_id: mapId,
      element_type: "shape_rectangle",
      heading: "Shape text",
      color_hex: shapeDefaultFillColor,
      created_by_user_id: userId,
      element_config: { bold: false, italic: false, underline: false, align: "center", font_size: 24, fill_mode: "fill" },
      pos_x: position.x,
      pos_y: position.y,
      width: shapeRectangleDefaultWidth,
      height: shapeRectangleDefaultHeight,
    }, "Unable to create rectangle.");
  }, [canWriteMap, setError, getCenter, findNearestAvailableShapePosition, addElement, mapId, userId, shapeDefaultFillColor, shapeRectangleDefaultWidth, shapeRectangleDefaultHeight]);

  const handleAddShapeCircle = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    const position = findNearestAvailableShapePosition(
      center.x,
      center.y,
      shapeCircleDefaultSize,
      shapeCircleDefaultSize,
      "shape_circle"
    );
    if (!position) return setError("No free space available for a new shape.");
    await addElement({
      map_id: mapId,
      element_type: "shape_circle",
      heading: "Shape text",
      color_hex: shapeDefaultFillColor,
      created_by_user_id: userId,
      element_config: { bold: false, italic: false, underline: false, align: "center", font_size: 24, fill_mode: "fill" },
      pos_x: position.x,
      pos_y: position.y,
      width: shapeCircleDefaultSize,
      height: shapeCircleDefaultSize,
    }, "Unable to create circle.");
  }, [canWriteMap, setError, getCenter, findNearestAvailableShapePosition, addElement, mapId, userId, shapeDefaultFillColor, shapeCircleDefaultSize]);

  const handleAddShapePill = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    const position = findNearestAvailableShapePosition(
      center.x,
      center.y,
      shapePillDefaultWidth,
      shapePillDefaultHeight,
      "shape_pill"
    );
    if (!position) return setError("No free space available for a new shape.");
    await addElement({
      map_id: mapId,
      element_type: "shape_pill",
      heading: "Shape text",
      color_hex: shapeDefaultFillColor,
      created_by_user_id: userId,
      element_config: { bold: false, italic: false, underline: false, align: "center", font_size: 24, fill_mode: "fill" },
      pos_x: position.x,
      pos_y: position.y,
      width: shapePillDefaultWidth,
      height: shapePillDefaultHeight,
    }, "Unable to create pill.");
  }, [canWriteMap, setError, getCenter, findNearestAvailableShapePosition, addElement, mapId, userId, shapeDefaultFillColor, shapePillDefaultWidth, shapePillDefaultHeight]);

  const handleAddShapePentagon = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    const position = findNearestAvailableShapePosition(
      center.x,
      center.y,
      shapePentagonDefaultWidth,
      shapePentagonDefaultHeight,
      "shape_pentagon"
    );
    if (!position) return setError("No free space available for a new shape.");
    await addElement({
      map_id: mapId,
      element_type: "shape_pentagon",
      heading: "Shape text",
      color_hex: shapeDefaultFillColor,
      created_by_user_id: userId,
      element_config: { bold: false, italic: false, underline: false, align: "center", font_size: 24, direction: "right", fill_mode: "fill" },
      pos_x: position.x,
      pos_y: position.y,
      width: shapePentagonDefaultWidth,
      height: shapePentagonDefaultHeight,
    }, "Unable to create pentagon.");
  }, [canWriteMap, setError, getCenter, findNearestAvailableShapePosition, addElement, mapId, userId, shapeDefaultFillColor, shapePentagonDefaultWidth, shapePentagonDefaultHeight]);

  const handleAddShapeChevronLeft = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    const position = findNearestAvailableShapePosition(
      center.x,
      center.y,
      shapePentagonDefaultWidth,
      shapePentagonDefaultHeight,
      "shape_chevron_left"
    );
    if (!position) return setError("No free space available for a new shape.");
    await addElement({
      map_id: mapId,
      element_type: "shape_chevron_left",
      heading: "Shape text",
      color_hex: shapeDefaultFillColor,
      created_by_user_id: userId,
      element_config: { bold: false, italic: false, underline: false, align: "center", font_size: 24, direction: "right", fill_mode: "fill" },
      pos_x: position.x,
      pos_y: position.y,
      width: shapePentagonDefaultWidth,
      height: shapePentagonDefaultHeight,
    }, "Unable to create left chevron.");
  }, [canWriteMap, setError, getCenter, findNearestAvailableShapePosition, addElement, mapId, userId, shapeDefaultFillColor, shapePentagonDefaultWidth, shapePentagonDefaultHeight]);

  const handleAddShapeArrow = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    const position = findNearestAvailableShapePosition(
      center.x,
      center.y,
      shapeArrowDefaultWidth,
      shapeArrowDefaultHeight,
      "shape_arrow"
    );
    if (!position) return setError("No free space available for a new shape.");
    await addElement({
      map_id: mapId,
      element_type: "shape_arrow",
      heading: "",
      color_hex: shapeDefaultFillColor,
      created_by_user_id: userId,
      element_config: { fill_mode: "fill", rotation_deg: 0 },
      pos_x: position.x,
      pos_y: position.y,
      width: shapeArrowDefaultWidth,
      height: shapeArrowDefaultHeight,
    }, "Unable to create arrow.");
  }, [canWriteMap, setError, getCenter, findNearestAvailableShapePosition, addElement, mapId, userId, shapeDefaultFillColor, shapeArrowDefaultWidth, shapeArrowDefaultHeight]);

  const handleAddBowtieHazard = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "bowtie_hazard",
        heading: "Hazard",
        color_hex: "#374151",
        created_by_user_id: userId,
        element_config: {
          description: "",
          energy_source_type: "",
          scope_asset: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieHazardHeight,
      },
      "Unable to create hazard."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieHazardHeight]);

  const handleAddBowtieTopEvent = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "bowtie_top_event",
        heading: "Top Event",
        color_hex: "#dc2626",
        created_by_user_id: userId,
        element_config: {
          description: "",
          loss_of_control_type: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieSquareHeight,
      },
      "Unable to create top event."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieSquareHeight]);

  const handleAddBowtieThreat = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "bowtie_threat",
        heading: "Threat",
        color_hex: "#f97316",
        created_by_user_id: userId,
        element_config: {
          description: "",
          threat_category: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieSquareHeight,
      },
      "Unable to create threat."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieSquareHeight]);

  const handleAddBowtieConsequence = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "bowtie_consequence",
        heading: "Consequence",
        color_hex: "#9333ea",
        created_by_user_id: userId,
        element_config: {
          description: "",
          impact_category: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieSquareHeight,
      },
      "Unable to create consequence."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieSquareHeight]);

  const handleAddBowtieControl = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "bowtie_control",
        heading: "Control",
        color_hex: "#ffffff",
        created_by_user_id: userId,
        element_config: {
          description: "",
          control_category: "preventive",
          control_type: "",
          owner_text: "",
          verification_method: "",
          verification_frequency: "",
          is_critical_control: false,
          performance_standard: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
      },
      "Unable to create control."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieControlHeight]);

  const handleAddBowtieEscalationFactor = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "bowtie_escalation_factor",
        heading: "Escalation Factor",
        color_hex: "#facc15",
        created_by_user_id: userId,
        element_config: {
          description: "",
          factor_type: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieSquareHeight,
      },
      "Unable to create escalation factor."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieSquareHeight]);

  const handleAddBowtieRecoveryMeasure = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "bowtie_recovery_measure",
        heading: "Recovery Measure",
        color_hex: "#22c55e",
        created_by_user_id: userId,
        element_config: {
          description: "",
          trigger: "",
          owner_text: "",
          time_requirement: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieHazardHeight,
      },
      "Unable to create recovery measure."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieHazardHeight]);

  const handleAddBowtieDegradationIndicator = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "bowtie_degradation_indicator",
        heading: "Degradation Indicator",
        color_hex: "#f472b6",
        created_by_user_id: userId,
        element_config: {
          description: "",
          monitoring_method: "",
          trigger_threshold: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieSquareHeight,
      },
      "Unable to create degradation indicator."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieSquareHeight]);

  const handleAddBowtieRiskRating = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "bowtie_risk_rating",
        heading: "Risk Level: Medium",
        color_hex: "#111827",
        created_by_user_id: userId,
        element_config: {
          likelihood: "possible",
          consequence: "moderate",
          risk_level: "medium",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieRiskRatingHeight,
      },
      "Unable to create risk rating."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieRiskRatingHeight]);

  const handleAddIncidentSequenceStep = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "incident_sequence_step",
        heading: "Sequence Step",
        color_hex: "#bfdbfe",
        created_by_user_id: userId,
        element_config: {
          description: "",
          timestamp: "",
          location: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
      },
      "Unable to create sequence step."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieControlHeight]);

  const handleAddIncidentOutcome = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "incident_outcome",
        heading: "Outcome",
        color_hex: "#ef4444",
        created_by_user_id: userId,
        element_config: {
          impact_type: "",
          description: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
      },
      "Unable to create outcome."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieControlHeight]);

  const handleAddIncidentTaskCondition = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "incident_task_condition",
        heading: "Task / Condition",
        color_hex: "#fb923c",
        created_by_user_id: userId,
        element_config: {
          description: "",
          state: "normal",
          environmental_context: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
      },
      "Unable to create task/condition."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieControlHeight]);

  const handleAddIncidentFactor = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "incident_factor",
        heading: "Factor",
        color_hex: "#fde047",
        created_by_user_id: userId,
        element_config: {
          factor_presence: "present",
          factor_classification: "contributing",
          influence_type: "human",
          description: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
      },
      "Unable to create factor."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieControlHeight]);

  const handleAddIncidentSystemFactor = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "incident_system_factor",
        heading: "System Factor",
        color_hex: "#a78bfa",
        created_by_user_id: userId,
        element_config: {
          description: "",
          category: "",
          cause_level: "contributing",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
      },
      "Unable to create system factor."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieControlHeight]);

  const handleAddIncidentControlBarrier = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "incident_control_barrier",
        heading: "Control / Barrier",
        color_hex: "#4ade80",
        created_by_user_id: userId,
        element_config: {
          barrier_state: "effective",
          barrier_role: "preventive",
          description: "",
          control_type: "",
          owner_text: "",
          verification_method: "",
          verification_frequency: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
      },
      "Unable to create control/barrier."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieControlHeight]);

  const handleAddIncidentEvidence = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "incident_evidence",
        heading: "Evidence",
        color_hex: "#cbd5e1",
        created_by_user_id: userId,
        element_config: {
          evidence_type: "",
          description: "",
          source: "",
          show_canvas_preview: false,
          media_storage_path: "",
          media_mime: "",
          media_name: "",
          media_rotation_deg: 0,
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
      },
      "Unable to create evidence."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieControlHeight]);

  const handleAddIncidentFinding = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "incident_finding",
        heading: "Finding",
        color_hex: "#1d4ed8",
        created_by_user_id: userId,
        element_config: {
          description: "",
          confidence_level: "medium",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
      },
      "Unable to create finding."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieControlHeight]);

  const handleAddIncidentRecommendation = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    const center = getCenter();
    if (!center) return;
    await addElement(
      {
        map_id: mapId,
        element_type: "incident_recommendation",
        heading: "Recommendation",
        color_hex: "#14b8a6",
        created_by_user_id: userId,
        element_config: {
          action_type: "corrective",
          owner_text: "",
          due_date: "",
          description: "",
        },
        pos_x: center.x,
        pos_y: center.y,
        width: bowtieDefaultWidth,
        height: bowtieControlHeight,
      },
      "Unable to create recommendation."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, bowtieDefaultWidth, bowtieControlHeight]);

  const handleSaveProcessHeading = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    if (!selectedProcessId) return;
    const heading = processHeadingDraft.trim() || "New Category";
    const widthSquares = Number(processWidthDraft.trim());
    const heightSquares = Number(processHeightDraft.trim());
    if (!Number.isInteger(widthSquares) || !Number.isInteger(heightSquares)) {
      setError(`Category size must be whole numbers. Minimum width is ${processMinWidthSquares} and minimum height is ${processMinHeightSquares} small squares.`);
      return;
    }
    if (widthSquares < processMinWidthSquares || heightSquares < processMinHeightSquares) {
      setError(`Category size is below limit. Minimum width is ${processMinWidthSquares} and minimum height is ${processMinHeightSquares} small squares.`);
      return;
    }
    const width = Math.max(processMinWidth, snapToMinorGrid(widthSquares * minorGridSize));
    const height = Math.max(processMinHeight, snapToMinorGrid(heightSquares * minorGridSize));
    const { data, error: e } = await supabaseBrowser.schema("ms").from("canvas_elements").update({ heading, width, height, color_hex: normalizeColorHex(processColorDraft ?? null) }).eq("id", selectedProcessId).eq("map_id", mapId).select(canvasElementSelectColumns).single();
    if (e || !data) return setError(e?.message || "Unable to save process heading.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedProcessId(null);
  }, [canWriteMap, setError, selectedProcessId, processHeadingDraft, processWidthDraft, processHeightDraft, processMinWidthSquares, processMinHeightSquares, processMinWidth, snapToMinorGrid, minorGridSize, processMinHeight, processColorDraft, mapId, canvasElementSelectColumns, normalizeColorHex, setElements, setSelectedProcessId]);

  const handleSaveSystemName = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    if (!selectedSystemId) return;
    const { data, error: e } = await supabaseBrowser.schema("ms").from("canvas_elements").update({ heading: systemNameDraft.trim() || "System Name" }).eq("id", selectedSystemId).eq("map_id", mapId).select(canvasElementSelectColumns).single();
    if (e || !data) return setError(e?.message || "Unable to save system name.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedSystemId(null);
  }, [canWriteMap, setError, selectedSystemId, systemNameDraft, mapId, canvasElementSelectColumns, setElements, setSelectedSystemId]);

  const handleSaveProcessComponent = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    if (!selectedProcessComponentId) return;
    const { data, error: e } = await supabaseBrowser.schema("ms").from("canvas_elements").update({ heading: processComponentLabelDraft.trim() || "Process" }).eq("id", selectedProcessComponentId).eq("map_id", mapId).select(canvasElementSelectColumns).single();
    if (e || !data) return setError(e?.message || "Unable to save process.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedProcessComponentId(null);
  }, [canWriteMap, setError, selectedProcessComponentId, processComponentLabelDraft, mapId, canvasElementSelectColumns, setElements, setSelectedProcessComponentId]);

  const handleSavePerson = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    if (!selectedPersonId) return;
    const isOrgChart = mapCategoryId === "org_chart";
    const currentPerson =
      selectedPersonId ? elements.find((el) => el.id === selectedPersonId && el.element_type === "person") ?? null : null;
    const currentDirectReportCount = currentPerson
      ? Math.max(
          Number(parseOrgChartPersonConfig(currentPerson.element_config).direct_report_count || 0)
        )
      : 0;
    const payload = isOrgChart
        ? {
          heading: personRoleDraft.trim() || "Position Title",
          width: orgChartPersonWidth,
          height: orgChartPersonHeight,
          element_config: {
            position_title: personRoleDraft.trim() || "Position Title",
            role_id: personRoleIdDraft.trim(),
            department: personDepartmentDraft.trim(),
            occupant_name: personOccupantNameDraft.trim(),
            start_date: personStartDateDraft.trim(),
            employment_type: personEmploymentTypeDraft,
            acting_name: personActingNameDraft.trim(),
            acting_start_date: personActingStartDateDraft.trim(),
            recruiting: personRecruitingDraft,
            proposed_role: personProposedRoleDraft,
            direct_report_count: currentDirectReportCount,
          },
        }
      : {
          heading: buildPersonHeading(personRoleDraft, personDepartmentDraft),
          width: personElementWidth,
          height: personElementHeight,
        };
    const { data, error: e } = await supabaseBrowser.schema("ms").from("canvas_elements").update(payload).eq("id", selectedPersonId).eq("map_id", mapId).select(canvasElementSelectColumns).single();
    if (e || !data) return setError(e?.message || "Unable to save person.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedPersonId(null);
  }, [
    canWriteMap,
    setError,
    selectedPersonId,
    mapCategoryId,
    buildPersonHeading,
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
    elements,
    personElementWidth,
    personElementHeight,
    orgChartPersonWidth,
    orgChartPersonHeight,
    mapId,
    canvasElementSelectColumns,
    setElements,
    setSelectedPersonId,
  ]);

  const handleSaveGroupingContainer = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    if (!selectedGroupingId) return;
    const heading = groupingLabelDraft.trim() || "Group label";
    const widthSquares = Number(groupingWidthDraft.trim());
    const heightSquares = Number(groupingHeightDraft.trim());
    if (!Number.isInteger(widthSquares) || !Number.isInteger(heightSquares)) {
      setError(`Grouping size must be whole numbers. Minimum width is ${groupingMinWidthSquares} and minimum height is ${groupingMinHeightSquares} small squares.`);
      return;
    }
    if (widthSquares < groupingMinWidthSquares || heightSquares < groupingMinHeightSquares) {
      setError(`Grouping size is below limit. Minimum width is ${groupingMinWidthSquares} and minimum height is ${groupingMinHeightSquares} small squares.`);
      return;
    }
    const width = Math.max(groupingMinWidth, snapToMinorGrid(widthSquares * minorGridSize));
    const height = Math.max(groupingMinHeight, snapToMinorGrid(heightSquares * minorGridSize));
    const { data, error: e } = await supabaseBrowser.schema("ms").from("canvas_elements").update({ heading, width, height }).eq("id", selectedGroupingId).eq("map_id", mapId).select(canvasElementSelectColumns).single();
    if (e || !data) return setError(e?.message || "Unable to save grouping container.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedGroupingId(null);
  }, [canWriteMap, setError, selectedGroupingId, groupingLabelDraft, groupingWidthDraft, groupingHeightDraft, groupingMinWidthSquares, groupingMinHeightSquares, groupingMinWidth, snapToMinorGrid, minorGridSize, groupingMinHeight, mapId, canvasElementSelectColumns, setElements, setSelectedGroupingId]);

  const handleSaveStickyNote = useCallback(async () => {
    if (!selectedStickyId) return;
    const current = elements.find((el) => el.id === selectedStickyId && el.element_type === "sticky_note");
    if (!current || !canEditElement(current)) {
      setError("You can only edit sticky notes you created.");
      return;
    }
    const { data, error: e } = await supabaseBrowser.schema("ms").from("canvas_elements").update({ heading: stickyTextDraft.trim() || "Enter Text" }).eq("id", selectedStickyId).eq("map_id", mapId).select(canvasElementSelectColumns).single();
    if (e || !data) return setError(e?.message || "Unable to save sticky note.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedStickyId(null);
  }, [selectedStickyId, elements, canEditElement, setError, stickyTextDraft, mapId, canvasElementSelectColumns, setElements, setSelectedStickyId]);

  const handleSaveImageAsset = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    if (!selectedImageId) return;
    const current = elements.find((el) => el.id === selectedImageId && el.element_type === "image_asset");
    if (!current) return;
    const nextConfig = { ...((current.element_config as Record<string, unknown> | null) ?? {}), description: imageDescriptionDraft.trim() };
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update({
        heading: imageDescriptionDraft.trim() || "Image",
        element_config: nextConfig,
      })
      .eq("id", selectedImageId)
      .eq("map_id", mapId)
      .select(canvasElementSelectColumns)
      .single();
    if (e || !data) return setError(e?.message || "Unable to save image details.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedImageId(null);
  }, [canWriteMap, setError, selectedImageId, elements, imageDescriptionDraft, mapId, canvasElementSelectColumns, setElements, setSelectedImageId]);

  const handleSaveTextBox = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    if (!selectedTextBoxId) return;
    const parsedFontSize = Number(textBoxFontSizeDraft.trim());
    const fontSize = Number.isFinite(parsedFontSize) ? Math.max(16, Math.min(168, Math.round(parsedFontSize))) : 16;
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update({
        heading: textBoxContentDraft.trim() || "Click to edit text box",
        element_config: {
          bold: textBoxBoldDraft,
          italic: textBoxItalicDraft,
          underline: textBoxUnderlineDraft,
          align: textBoxAlignDraft,
          font_size: fontSize,
        },
      })
      .eq("id", selectedTextBoxId)
      .eq("map_id", mapId)
      .select(canvasElementSelectColumns)
      .single();
    if (e || !data) return setError(e?.message || "Unable to save text box.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedTextBoxId(null);
  }, [canWriteMap, setError, selectedTextBoxId, textBoxContentDraft, textBoxBoldDraft, textBoxItalicDraft, textBoxUnderlineDraft, textBoxAlignDraft, textBoxFontSizeDraft, mapId, canvasElementSelectColumns, setElements, setSelectedTextBoxId]);

  const handleSaveTable = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    if (!selectedTableId) return;
    const current = elements.find((el) => el.id === selectedTableId && el.element_type === "table");
    if (!current) return;
    const parsedRows = Number(tableRowsDraft.trim());
    const parsedColumns = Number(tableColumnsDraft.trim());
    const rows = Number.isFinite(parsedRows) ? Math.max(tableMinRows, Math.floor(parsedRows)) : tableMinRows;
    const columns = Number.isFinite(parsedColumns) ? Math.max(tableMinColumns, Math.floor(parsedColumns)) : tableMinColumns;
    const currentCfg = (current.element_config as Record<string, unknown> | null) ?? {};
    const currentRowsRaw = Number(currentCfg.rows ?? tableMinRows);
    const currentColumnsRaw = Number(currentCfg.columns ?? tableMinColumns);
    const currentRows = Number.isFinite(currentRowsRaw) ? Math.max(tableMinRows, Math.floor(currentRowsRaw)) : tableMinRows;
    const currentColumns = Number.isFinite(currentColumnsRaw) ? Math.max(tableMinColumns, Math.floor(currentColumnsRaw)) : tableMinColumns;
    const currentWidth = Math.max(tableMinWidth, Number(current.width ?? tableDefaultWidth));
    const currentHeight = Math.max(tableMinHeight, Number(current.height ?? tableDefaultHeight));
    const cellWidth = currentWidth / Math.max(1, currentColumns);
    const cellHeight = currentHeight / Math.max(1, currentRows);
    const nextWidth = Math.max(tableMinWidth, cellWidth * columns);
    const nextHeight = Math.max(tableMinHeight, cellHeight * rows);
    const headerBg = normalizeColorHex(tableHeaderBgDraft);
    const parsedFontSize = Number(tableFontSizeDraft.trim());
    const fontSize = Number.isFinite(parsedFontSize) ? Math.max(10, Math.min(72, Math.round(parsedFontSize))) : 10;
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update({
        heading: current.heading || "Table",
        width: nextWidth,
        height: nextHeight,
        element_config: {
          ...((current.element_config as Record<string, unknown> | null) ?? {}),
          rows,
          columns,
          header_bg_color: headerBg,
          bold: tableBoldDraft,
          italic: tableItalicDraft,
          underline: tableUnderlineDraft,
          align: tableAlignDraft,
          font_size: fontSize,
        },
      })
      .eq("id", selectedTableId)
      .eq("map_id", mapId)
      .select(canvasElementSelectColumns)
      .single();
    if (e || !data) return setError(e?.message || "Unable to save table.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedTableId(null);
  }, [
    canWriteMap,
    setError,
    selectedTableId,
    elements,
    tableRowsDraft,
    tableColumnsDraft,
    tableHeaderBgDraft,
    tableBoldDraft,
    tableItalicDraft,
    tableUnderlineDraft,
    tableAlignDraft,
    tableFontSizeDraft,
    tableMinWidth,
    tableMinHeight,
    tableDefaultWidth,
    tableDefaultHeight,
    tableMinRows,
    tableMinColumns,
    normalizeColorHex,
    mapId,
    canvasElementSelectColumns,
    setElements,
    setSelectedTableId,
  ]);

  const handleSaveFlowShape = useCallback(async () => {
    if (!canWriteMap) return setError("You have view access only for this map.");
    if (!selectedFlowShapeId) return;
    const current = elements.find((el) => el.id === selectedFlowShapeId);
    if (
      !current ||
      !(
        current.element_type === "shape_rectangle" ||
        current.element_type === "shape_circle" ||
        current.element_type === "shape_pill" ||
        current.element_type === "shape_pentagon" ||
        current.element_type === "shape_chevron_left" ||
        current.element_type === "shape_arrow"
      )
    ) {
      return;
    }
    const parsedFontSize = Number(flowShapeFontSizeDraft.trim());
    const fontSize = Number.isFinite(parsedFontSize) ? Math.max(12, Math.min(168, Math.round(parsedFontSize))) : 24;
    const normalizedColor = normalizeColorHex(flowShapeColorDraft) ?? shapeDefaultFillColor;
    const canFlipDirection = current.element_type === "shape_pentagon" || current.element_type === "shape_chevron_left";
    const isArrow = current.element_type === "shape_arrow";
    const currentRotationRaw = Number(((current.element_config as Record<string, unknown> | null) ?? {}).rotation_deg ?? 0);
    const currentRotation = currentRotationRaw === 90 || currentRotationRaw === 180 || currentRotationRaw === 270 ? currentRotationRaw : 0;
    const currentIsVertical = currentRotation === 90 || currentRotation === 270;
    const nextIsVertical = flowShapeRotationDraft === 90 || flowShapeRotationDraft === 270;
    const payload: Partial<CanvasElementRow> = {
      heading: isArrow ? "" : flowShapeTextDraft.trim() || "Shape text",
      color_hex: normalizedColor,
      element_config: {
        ...((current.element_config as Record<string, unknown> | null) ?? {}),
        bold: flowShapeBoldDraft,
        italic: flowShapeItalicDraft,
        underline: flowShapeUnderlineDraft,
        align: flowShapeAlignDraft,
        font_size: fontSize,
        fill_mode: flowShapeFillModeDraft,
        ...(canFlipDirection ? { direction: flowShapeDirectionDraft } : {}),
        ...(current.element_type === "shape_arrow" ? { rotation_deg: flowShapeRotationDraft } : {}),
      },
      width: Math.max(
        isArrow ? shapeArrowMinWidth : shapeMinWidth,
        current.width ||
          (isArrow
            ? shapeArrowDefaultWidth
            : current.element_type === "shape_pentagon" || current.element_type === "shape_chevron_left"
            ? shapePentagonDefaultWidth
            : current.element_type === "shape_pill"
            ? shapePillDefaultWidth
            : current.element_type === "shape_circle"
            ? shapeCircleDefaultSize
            : shapeRectangleDefaultWidth)
      ),
      height: Math.max(
        isArrow ? shapeArrowMinHeight : shapeMinHeight,
        current.height ||
          (isArrow
            ? shapeArrowDefaultHeight
            : current.element_type === "shape_pentagon" || current.element_type === "shape_chevron_left"
            ? shapePentagonDefaultHeight
            : current.element_type === "shape_pill"
            ? shapePillDefaultHeight
            : current.element_type === "shape_circle"
            ? shapeCircleDefaultSize
            : shapeRectangleDefaultHeight)
      ),
    };
    if (current.element_type === "shape_circle") {
      const side = Math.max(shapeMinWidth, payload.width ?? shapeCircleDefaultSize, payload.height ?? shapeCircleDefaultSize);
      payload.width = side;
      payload.height = side;
    } else if (isArrow && currentIsVertical !== nextIsVertical) {
      const nextWidth = Math.max(shapeArrowMinWidth, payload.height ?? shapeArrowDefaultHeight);
      const nextHeight = Math.max(shapeArrowMinHeight, payload.width ?? shapeArrowDefaultWidth);
      payload.width = nextWidth;
      payload.height = nextHeight;
    }
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .update(payload)
      .eq("id", selectedFlowShapeId)
      .eq("map_id", mapId)
      .select(canvasElementSelectColumns)
      .single();
    if (e || !data) return setError(e?.message || "Unable to save shape.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedFlowShapeId(null);
  }, [
    canWriteMap,
    setError,
    selectedFlowShapeId,
    elements,
    flowShapeFontSizeDraft,
    flowShapeColorDraft,
    flowShapeTextDraft,
    flowShapeAlignDraft,
    flowShapeBoldDraft,
    flowShapeItalicDraft,
    flowShapeUnderlineDraft,
    normalizeColorHex,
    shapeDefaultFillColor,
    flowShapeFillModeDraft,
    flowShapeDirectionDraft,
    flowShapeRotationDraft,
    shapeMinWidth,
    shapeArrowMinWidth,
    shapeArrowDefaultWidth,
    shapePillDefaultWidth,
    shapePentagonDefaultWidth,
    shapeRectangleDefaultWidth,
    shapeMinHeight,
    shapeArrowMinHeight,
    shapeArrowDefaultHeight,
    shapePillDefaultHeight,
    shapePentagonDefaultHeight,
    shapeRectangleDefaultHeight,
    shapeCircleDefaultSize,
    mapId,
    canvasElementSelectColumns,
    setElements,
    setSelectedFlowShapeId,
  ]);

  return {
    handleAddBlankDocument,
    handleAddProcessHeading,
    handleAddSystemCircle,
    handleAddProcessComponent,
    handleAddPerson,
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
  };
}
