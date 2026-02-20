"use client";

import { useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { CanvasElementRow, DisciplineKey, DocumentNodeRow } from "./canvasShared";

type UseCanvasElementActionsParams = {
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
  groupingDefaultWidth: number;
  groupingDefaultHeight: number;
  stickyDefaultSize: number;
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
  personDepartmentDraft: string;
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
  elements: CanvasElementRow[];
  setSelectedStickyId: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useCanvasElementActions(params: UseCanvasElementActionsParams) {
  const {
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
    groupingDefaultWidth,
    groupingDefaultHeight,
    stickyDefaultSize,
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
    personDepartmentDraft,
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
    elements,
    setSelectedStickyId,
  } = params;

  const getCenter = useCallback(() => {
    if (!rf || !canvasRef.current) return null;
    const box = canvasRef.current.getBoundingClientRect();
    const center = rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    return { x: snapToMinorGrid(center.x), y: snapToMinorGrid(center.y) };
  }, [rf, canvasRef, snapToMinorGrid]);

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
    const { data, error: e } = await supabaseBrowser
      .schema("ms")
      .from("canvas_elements")
      .insert(payload)
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
  }, [canvasElementSelectColumns, setElements, setError, setShowAddMenu]);

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
    await addElement({
      map_id: mapId,
      element_type: "person",
      heading: buildPersonHeading("Role Name", "Department"),
      color_hex: null,
      created_by_user_id: userId,
      pos_x: center.x,
      pos_y: center.y,
      width: personElementWidth,
      height: personElementHeight,
    }, "Unable to create person component.");
  }, [canWriteMap, setError, getCenter, addElement, mapId, buildPersonHeading, userId, personElementWidth, personElementHeight]);

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
      color_hex: "#fef08a",
      created_by_user_id: userId,
      pos_x: center.x,
      pos_y: center.y,
      width: stickyDefaultSize,
      height: stickyDefaultSize,
    }, "Unable to create sticky note.");
  }, [canCreateSticky, userId, getCenter, addElement, mapId, stickyDefaultSize]);

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
    const { data, error: e } = await supabaseBrowser.schema("ms").from("canvas_elements").update({ heading, width, height, color_hex: processColorDraft ?? null }).eq("id", selectedProcessId).eq("map_id", mapId).select(canvasElementSelectColumns).single();
    if (e || !data) return setError(e?.message || "Unable to save process heading.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedProcessId(null);
  }, [canWriteMap, setError, selectedProcessId, processHeadingDraft, processWidthDraft, processHeightDraft, processMinWidthSquares, processMinHeightSquares, processMinWidth, snapToMinorGrid, minorGridSize, processMinHeight, processColorDraft, mapId, canvasElementSelectColumns, setElements, setSelectedProcessId]);

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
    const { data, error: e } = await supabaseBrowser.schema("ms").from("canvas_elements").update({ heading: buildPersonHeading(personRoleDraft, personDepartmentDraft), width: personElementWidth, height: personElementHeight }).eq("id", selectedPersonId).eq("map_id", mapId).select(canvasElementSelectColumns).single();
    if (e || !data) return setError(e?.message || "Unable to save person.");
    const updated = data as unknown as CanvasElementRow;
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    setSelectedPersonId(null);
  }, [canWriteMap, setError, selectedPersonId, buildPersonHeading, personRoleDraft, personDepartmentDraft, personElementWidth, personElementHeight, mapId, canvasElementSelectColumns, setElements, setSelectedPersonId]);

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

  return {
    handleAddBlankDocument,
    handleAddProcessHeading,
    handleAddSystemCircle,
    handleAddProcessComponent,
    handleAddPerson,
    handleAddGroupingContainer,
    handleAddStickyNote,
    handleSaveProcessHeading,
    handleSaveSystemName,
    handleSaveProcessComponent,
    handleSavePerson,
    handleSaveGroupingContainer,
    handleSaveStickyNote,
  };
}
