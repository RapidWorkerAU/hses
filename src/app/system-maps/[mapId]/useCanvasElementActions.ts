"use client";

import { useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { CanvasElementRow, DisciplineKey, DocumentNodeRow } from "./canvasShared";
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
  personContractorRoleDraft: boolean;
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
  elements: CanvasElementRow[];
  setSelectedStickyId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedImageId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTextBoxId: React.Dispatch<React.SetStateAction<string | null>>;
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
      color_hex: "#fef08a",
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
        font_size: 24,
      },
      pos_x: center.x,
      pos_y: center.y,
      width: textBoxDefaultWidth,
      height: textBoxDefaultHeight,
    }, "Unable to create text box.");
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, textBoxDefaultWidth, textBoxDefaultHeight]);

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
        width: incidentDefaultWidth,
        height: incidentThreeTwoHeight,
      },
      "Unable to create sequence step."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, incidentDefaultWidth, incidentThreeTwoHeight]);

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
        width: incidentDefaultWidth,
        height: incidentThreeTwoHeight,
      },
      "Unable to create outcome."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, incidentDefaultWidth, incidentThreeTwoHeight]);

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
        width: incidentDefaultWidth,
        height: incidentThreeTwoHeight,
      },
      "Unable to create task/condition."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, incidentDefaultWidth, incidentThreeTwoHeight]);

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
        width: incidentSquareSize,
        height: incidentSquareSize,
      },
      "Unable to create factor."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, incidentSquareSize]);

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
        width: incidentSquareSize,
        height: incidentSquareSize,
      },
      "Unable to create system factor."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, incidentSquareSize]);

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
        width: incidentDefaultWidth,
        height: incidentFourThreeHeight,
      },
      "Unable to create control/barrier."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, incidentDefaultWidth, incidentFourThreeHeight]);

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
        },
        pos_x: center.x,
        pos_y: center.y,
        width: incidentDefaultWidth,
        height: incidentThreeTwoHeight,
      },
      "Unable to create evidence."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, incidentDefaultWidth, incidentThreeTwoHeight]);

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
        width: incidentDefaultWidth,
        height: incidentThreeOneHeight,
      },
      "Unable to create finding."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, incidentDefaultWidth, incidentThreeOneHeight]);

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
        width: incidentDefaultWidth,
        height: incidentThreeTwoHeight,
      },
      "Unable to create recommendation."
    );
  }, [canWriteMap, setError, getCenter, addElement, mapId, userId, incidentDefaultWidth, incidentThreeTwoHeight]);

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
    const isOrgChart = mapCategoryId === "org_chart";
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
            contractor_role: personContractorRoleDraft,
            proposed_role: personProposedRoleDraft,
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
    personContractorRoleDraft,
    personProposedRoleDraft,
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
    const fontSize = Number.isFinite(parsedFontSize) ? Math.max(24, Math.min(168, Math.round(parsedFontSize))) : 24;
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

  return {
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
  };
}
