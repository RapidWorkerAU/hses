export type SystemMap = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  map_code: string | null;
  map_category?: string | null;
  updated_at: string;
  created_at: string;
};

export type DocumentTypeRow = {
  id: string;
  map_id: string | null;
  name: string;
  level_rank: number;
  band_y_min: number | null;
  band_y_max: number | null;
  is_active: boolean;
};

export type DocumentNodeRow = {
  id: string;
  map_id: string;
  type_id: string;
  title: string;
  document_number: string | null;
  discipline: string | null;
  owner_user_id: string | null;
  owner_name: string | null;
  user_group: string | null;
  pos_x: number;
  pos_y: number;
  width: number | null;
  height: number | null;
  is_archived: boolean;
};

export type NodeRelationRow = {
  id: string;
  map_id: string;
  from_node_id: string | null;
  source_system_element_id?: string | null;
  to_node_id: string | null;
  source_grouping_element_id: string | null;
  target_grouping_element_id: string | null;
  relation_type: string;
  relationship_description: string | null;
  target_system_element_id: string | null;
  relationship_disciplines: string[] | null;
  relationship_category: string | null;
  relationship_custom_type: string | null;
};
export type CanvasElementRow = {
  id: string;
  map_id: string;
  element_type:
    | "category"
    | "system_circle"
    | "grouping_container"
    | "process_component"
    | "sticky_note"
    | "person"
    | "image_asset"
    | "text_box"
    | "table"
    | "shape_rectangle"
    | "shape_circle"
    | "shape_pill"
    | "shape_pentagon"
    | "shape_chevron_left"
    | "shape_arrow"
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
    | "incident_recommendation";
  heading: string;
  color_hex: string | null;
  created_by_user_id: string | null;
  element_config?: Record<string, unknown> | null;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  direct_report_count?: number | null;
  created_at: string;
  updated_at: string;
};
export type MapMemberProfileRow = {
  map_id: string;
  user_id: string;
  role: "read" | "partial_write" | "full_write" | string;
  email: string | null;
  full_name: string | null;
  is_owner: boolean;
};

export type OutlineItemRow = {
  id: string;
  map_id: string;
  node_id: string;
  kind: "heading" | "content";
  heading_level: 1 | 2 | 3 | null;
  parent_heading_id: string | null;
  heading_id: string | null;
  title: string | null;
  content_text: string | null;
  sort_order: number;
  created_at: string;
};

export type FlowData = {
  entityKind:
    | "document"
    | "category"
    | "system_circle"
    | "grouping_container"
    | "process_component"
    | "sticky_note"
    | "person"
    | "image_asset"
    | "text_box"
    | "table"
    | "shape_rectangle"
    | "shape_circle"
    | "shape_pill"
    | "shape_pentagon"
    | "shape_chevron_left"
    | "shape_arrow"
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
    | "incident_recommendation";
  typeName: string;
  title: string;
  description?: string;
  showInfoButton?: boolean;
  metaLabel?: string;
  metaSubLabel?: string;
  metaLabelSecondary?: string;
  metaLabelBg?: string;
  metaLabelText?: string;
  metaLabelBorder?: string;
  documentNumber?: string;
  categoryColor?: string;
  canEdit?: boolean;
  canResize?: boolean;
  creatorName?: string;
  createdAtLabel?: string;
  userGroup: string;
  disciplineKeys: string[];
  bannerBg: string;
  bannerText: string;
  incidentTags?: Array<{
    key: string;
    label: string;
    iconSrc: string;
    pillBg: string;
    pillText: string;
  }>;
  incidentDetailOpen?: boolean;
  onToggleIncidentDetail?: (nextOpen: boolean) => void;
  isLandscape: boolean;
  isUnconfigured: boolean;
  isCritical?: boolean;
  imageUrl?: string;
  evidenceMediaUrl?: string;
  evidenceMediaMime?: string;
  evidenceMediaName?: string;
  evidenceShowPreview?: boolean;
  evidenceMediaRotationDeg?: 0 | 90 | 180 | 270;
  onOpenEvidenceMedia?: () => void;
  textStyle?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: "left" | "center" | "right";
    fontSize?: number;
  };
  shapeStyle?: {
    direction?: "left" | "right";
    fillMode?: "fill" | "outline";
    rotationDeg?: 0 | 90 | 180 | 270;
  };
  tableConfig?: {
    rows: number;
    columns: number;
    headerRowBg: string | null;
    headerRowMode?: "fill" | "outline";
    cellTexts?: string[][];
    cellStyles?: Array<Array<{
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      align?: "left" | "center" | "right";
      vAlign?: "top" | "middle" | "bottom";
      fontSize?: number;
    }>>;
  };
  onTableCellCommit?: (rowIndex: number, columnIndex: number, value: string) => void;
  onTableCellStyleCommit?: (
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
  ) => void;
  orgChartPerson?: {
    displayName: string;
    positionLine: string;
    avatarSrc: string;
    roleTypeLabel: string;
    statusLabel: string | null;
    statusBg: string | null;
    statusText: string | null;
    directReportCount: number;
  };
};
export type DisciplineKey = "health" | "safety" | "environment" | "security" | "communities" | "training";
export type RelationshipCategory =
  | "information"
  | "systems"
  | "process"
  | "data"
  | "influenced_by"
  | "influences"
  | "responsible_for"
  | "controls"
  | "controlled_by"
  | "risk_level"
  | "energy_type"
  | "leads_to"
  | "mitigated_by"
  | "mitigates"
  | "contributes_to"
  | "evidence_for"
  | "barrier_for"
  | "recommends"
  | "reports_to"
  | "other";
export type RelationshipCategoryOption = { value: RelationshipCategory; label: string };
export type RelationshipCategoryGroup = {
  label: string;
  options: RelationshipCategoryOption[];
};
export type SelectionMarquee = {
  active: boolean;
  startClientX: number;
  startClientY: number;
  currentClientX: number;
  currentClientY: number;
};
export type Rect = { x: number; y: number; width: number; height: number };

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};
export const A4_RATIO = 1.414;
export const minorGridSize = 24;
export const majorGridSize = minorGridSize * 5;
export const tileGridSpan = 5;
export const defaultWidth = minorGridSize * tileGridSpan;
export const defaultHeight = Math.round(defaultWidth * A4_RATIO);
export const landscapeDefaultWidth = defaultHeight;
export const landscapeDefaultHeight = defaultWidth;
export const processHeadingWidth = minorGridSize * 18;
export const processHeadingHeight = minorGridSize * 3;
export const processMinWidth = minorGridSize * 10;
export const processMinHeight = minorGridSize * 3;
export const processMinWidthSquares = Math.round(processMinWidth / minorGridSize);
export const processMinHeightSquares = Math.round(processMinHeight / minorGridSize);
export const processComponentWidth = minorGridSize * 7;
export const processComponentBodyHeight = minorGridSize * 3;
export const processComponentLabelHeight = minorGridSize;
export const processComponentElementHeight = processComponentBodyHeight + processComponentLabelHeight;
export const systemCircleDiameter = minorGridSize * 5;
export const systemCircleLabelHeight = minorGridSize;
export const systemCircleElementHeight = systemCircleDiameter + systemCircleLabelHeight;
export const personIconSize = minorGridSize * 4;
export const personRoleLabelHeight = minorGridSize;
export const personDepartmentLabelHeight = minorGridSize;
export const personElementWidth = personIconSize;
export const personElementHeight = personIconSize + personRoleLabelHeight + personDepartmentLabelHeight;
export const orgChartPersonWidth = minorGridSize * 13;
export const orgChartPersonHeight = minorGridSize * 4;
export const groupingDefaultWidth = minorGridSize * 22;
export const groupingDefaultHeight = minorGridSize * 12;
export const groupingMinWidth = minorGridSize * 8;
export const groupingMinHeight = minorGridSize * 6;
export const groupingMinWidthSquares = Math.round(groupingMinWidth / minorGridSize);
export const groupingMinHeightSquares = Math.round(groupingMinHeight / minorGridSize);
export const stickyDefaultSize = minorGridSize * 5;
export const stickyMinSize = minorGridSize * 2;
export const imageDefaultWidth = minorGridSize * 7;
export const imageMinWidth = minorGridSize * 3;
export const imageMinHeight = minorGridSize * 3;
export const textBoxDefaultWidth = minorGridSize * 20;
export const textBoxDefaultHeight = minorGridSize * 5;
export const textBoxMinWidth = minorGridSize * 5;
export const textBoxMinHeight = minorGridSize * 2;
export const tableCellDefaultWidthSquares = 5;
export const tableCellDefaultHeightSquares = 2;
export const tableDefaultRows = 2;
export const tableDefaultColumns = 2;
export const tableDefaultWidth = minorGridSize * tableCellDefaultWidthSquares * tableDefaultColumns;
export const tableDefaultHeight = minorGridSize * tableCellDefaultHeightSquares * tableDefaultRows;
export const tableMinRows = 1;
export const tableMinColumns = 1;
export const tableMinWidth = minorGridSize * tableCellDefaultWidthSquares * tableMinColumns;
export const tableMinHeight = minorGridSize * tableCellDefaultHeightSquares * tableMinRows;
export const shapeRectangleDefaultWidth = minorGridSize * 10;
export const shapeRectangleDefaultHeight = minorGridSize * 5;
export const shapeCircleDefaultSize = minorGridSize * 7;
export const shapePillDefaultWidth = minorGridSize * 10;
export const shapePillDefaultHeight = minorGridSize * 5;
export const shapePentagonDefaultWidth = minorGridSize * 10;
export const shapePentagonDefaultHeight = minorGridSize * 5;
export const shapeArrowDefaultWidth = minorGridSize * 5;
export const shapeArrowDefaultHeight = minorGridSize * 2;
export const shapeArrowMinWidth = minorGridSize * 2;
export const shapeArrowMinHeight = minorGridSize * 2;
export const shapeMinWidth = minorGridSize * 3;
export const shapeMinHeight = minorGridSize * 2;
export const shapeDefaultFillColor = "#249BC7";
export const bowtieDefaultWidth = minorGridSize * 7;
export const bowtieHazardHeight = minorGridSize * 4;
export const bowtieSquareHeight = minorGridSize * 4;
export const bowtieControlHeight = minorGridSize * 4;
export const bowtieRiskRatingHeight = minorGridSize * 3;
export const incidentDefaultWidth = minorGridSize * 6;
export const incidentCardWidth = minorGridSize * 9;
export const incidentCardHeight = minorGridSize * 6;
export const incidentThreeTwoHeight = Math.round((incidentDefaultWidth * 2) / 3);
export const incidentSquareSize = incidentDefaultWidth;
export const incidentFourThreeHeight = Math.round((incidentDefaultWidth * 3) / 4);
export const incidentThreeOneHeight = Math.round(incidentDefaultWidth / 3);
export const unconfiguredDocumentTitle = "Click to configure";
export const defaultCategoryColor = "#000000";
export const categoryColorOptions = [
  { name: "Light Blue", value: "#70cbff" },
  { name: "Light Green", value: "#5cffb0" },
  { name: "Pink", value: "#ff99d8" },
  { name: "Purple", value: "#d8c7fa" },
  { name: "Pale Red", value: "#ffc2c2" },
  { name: "Pale Yellow", value: "#fff3c2" },
] as const;
export const laneHeight = 260;
export const fallbackHierarchy = [
  { name: "System Manual", level_rank: 1 },
  { name: "Policy", level_rank: 2 },
  { name: "Risk Document", level_rank: 3 },
  { name: "Management Plan", level_rank: 4 },
  { name: "Procedure", level_rank: 5 },
  { name: "Guidance Note", level_rank: 6 },
  { name: "Work Instruction", level_rank: 7 },
  { name: "Form / Template", level_rank: 8 },
  { name: "Record", level_rank: 9 },
] as const;
const fallbackRankByName = new Map(fallbackHierarchy.map((item) => [item.name.trim().toLowerCase(), item.level_rank]));
export const normalizeTypeRanks = (items: DocumentTypeRow[]) =>
  items
    .map((item) => {
      const normalizedRank = fallbackRankByName.get(item.name.trim().toLowerCase());
      return normalizedRank ? { ...item, level_rank: normalizedRank } : item;
    })
    .sort((a, b) => a.level_rank - b.level_rank);

export const getDisplayTypeName = (typeName: string) =>
  typeName.trim().toLowerCase() === "management system manual" ? "System Manual" : typeName;
export const isLandscapeTypeName = (typeName: string) => typeName.trim().toLowerCase() === "risk document";
export const getCanonicalTypeName = (typeName: string) => getDisplayTypeName(typeName).trim().toLowerCase();
export const parsePersonLabels = (heading: string | null | undefined) => {
  const raw = heading ?? "";
  const [roleLine, ...rest] = raw.split("\n");
  const role = roleLine?.trim() || "Role Name";
  const department = rest.join("\n").trim() || "Department";
  return { role, department };
};
export const buildPersonHeading = (role: string, department: string) =>
  `${role.trim() || "Role Name"}\n${department.trim() || "Department"}`;
export const isPersonElementType = (elementType: CanvasElementRow["element_type"]) => elementType === "person";
export type OrgChartEmploymentType = "fte" | "contractor";
export type OrgChartPersonConfig = {
  position_title: string;
  role_id: string;
  department: string;
  occupant_name: string;
  start_date: string;
  employment_type: OrgChartEmploymentType;
  acting_name: string;
  acting_start_date: string;
  recruiting: boolean;
  contractor_role: boolean;
  proposed_role: boolean;
  direct_report_count: number;
};
export const orgChartDepartmentOptions = [
  "Executive",
  "Operations",
  "Projects",
  "Engineering",
  "HSE",
  "Finance",
  "HR",
  "Commercial",
  "IT",
  "Other",
] as const;
export const getDefaultOrgChartPersonConfig = (): OrgChartPersonConfig => ({
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
  direct_report_count: 0,
});
export const parseOrgChartPersonConfig = (value: unknown): OrgChartPersonConfig => {
  const raw = (value && typeof value === "object" ? (value as Record<string, unknown>) : {}) as Record<string, unknown>;
  const base = getDefaultOrgChartPersonConfig();
  const parseText = (key: keyof OrgChartPersonConfig) => {
    const v = raw[key];
    return typeof v === "string" ? v.trim() : "";
  };
  const employment = parseText("employment_type").toLowerCase();
  const directReportRaw = Number(raw.direct_report_count);
  return {
    position_title: parseText("position_title") || base.position_title,
    role_id: parseText("role_id"),
    department: parseText("department"),
    occupant_name: parseText("occupant_name"),
    start_date: parseText("start_date"),
    employment_type: employment === "contractor" ? "contractor" : "fte",
    acting_name: parseText("acting_name"),
    acting_start_date: parseText("acting_start_date"),
    recruiting: Boolean(raw.recruiting),
    contractor_role: employment === "contractor" || Boolean(raw.contractor_role),
    proposed_role: Boolean(raw.proposed_role),
    direct_report_count: Number.isFinite(directReportRaw) ? Math.max(0, Math.floor(directReportRaw)) : 0,
  };
};
export const isOrgChartPersonElement = (element: Pick<CanvasElementRow, "element_type" | "element_config"> | null | undefined) => {
  if (!element || element.element_type !== "person") return false;
  const raw = (element.element_config && typeof element.element_config === "object"
    ? (element.element_config as Record<string, unknown>)
    : null);
  return String(raw?.display_variant ?? "").trim().toLowerCase() === "org_chart";
};
export const getOrgChartPersonLabel = (cfg: OrgChartPersonConfig) => {
  if (cfg.occupant_name) return cfg.occupant_name;
  if (cfg.acting_name) return cfg.acting_name;
  return "VACANT";
};
export const getOrgChartPersonBanner = (cfg: OrgChartPersonConfig): { label: string; bg: string; text: string } => {
  if (cfg.acting_name) return { label: "ACTING", bg: "#f97316", text: "#ffffff" };
  if (cfg.contractor_role) return { label: "CONTRACTOR", bg: "#9333ea", text: "#ffffff" };
  if (cfg.recruiting && !cfg.occupant_name) return { label: "RECRUITING", bg: "#2563eb", text: "#ffffff" };
  if (cfg.proposed_role) return { label: "PROPOSED", bg: "#6b7280", text: "#ffffff" };
  if (!cfg.occupant_name && !cfg.acting_name) return { label: "VACANT", bg: "#dc2626", text: "#ffffff" };
  return { label: "FILLED", bg: "#16a34a", text: "#ffffff" };
};
export const processFlowId = (id: string) => `process:${id}`;
export const parseProcessFlowId = (id: string) => (id.startsWith("process:") ? id.slice(8) : id);
export const isAbortLikeError = (error: unknown) => {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("aborterror") ||
    normalized.includes("signal is aborted") ||
    normalized.includes("aborted") ||
    normalized.includes("err_network_changed") ||
    normalized.includes("err_name_not_resolved") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror when attempting to fetch resource")
  );
};
export const userGroupOptions = [
  "Group/ Corporate",
  "Business Unit/ Division",
  "Site/ Project/ Client",
  "Team/ Contractor",
  "Not Applicable",
] as const;
export const disciplineOptions: Array<{ key: DisciplineKey; label: string; letter: string }> = [
  { key: "health", label: "Health", letter: "H" },
  { key: "safety", label: "Safety", letter: "S" },
  { key: "environment", label: "Environment", letter: "E" },
  { key: "security", label: "Security", letter: "S" },
  { key: "communities", label: "Communities", letter: "C" },
  { key: "training", label: "Training", letter: "T" },
];
export const disciplineKeySet = new Set<DisciplineKey>(disciplineOptions.map((option) => option.key));
export const disciplineLabelByKey = new Map(disciplineOptions.map((option) => [option.key, option.label]));
export const disciplineLetterByKey = new Map(disciplineOptions.map((option) => [option.key, option.letter]));
export const parseDisciplines = (value: string | null | undefined): DisciplineKey[] => {
  if (!value) return [];
  const normalized = value.trim().toLowerCase();
  if (!normalized) return [];
  const selected = new Set<DisciplineKey>();
  const addMatch = (token: string) => {
    const t = token.trim().toLowerCase();
    if (!t) return;
    if (t === "hset") {
      selected.add("health");
      selected.add("safety");
      selected.add("environment");
      selected.add("training");
      return;
    }
    if (t === "hse") {
      selected.add("health");
      selected.add("safety");
      selected.add("environment");
      return;
    }
    disciplineOptions.forEach((option) => {
      if (option.key === t || option.label.toLowerCase() === t) selected.add(option.key);
    });
  };
  normalized
    .split(/[;,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach(addMatch);
  if (!selected.size) addMatch(normalized);
  return disciplineOptions.filter((option) => selected.has(option.key)).map((option) => option.key);
};
export const serializeDisciplines = (keys: DisciplineKey[]) => {
  if (!keys.length) return null;
  const labels = keys.map((key) => disciplineLabelByKey.get(key)).filter(Boolean) as string[];
  return labels.join(", ");
};
export const disciplineSummary = (value: string | null | undefined) => {
  const keys = parseDisciplines(value);
  if (!keys.length) return "No discipline";
  return keys.map((key) => disciplineLabelByKey.get(key)).filter(Boolean).join(", ");
};
export const getNormalizedDocumentSize = (
  isLandscape: boolean,
  width: number | null,
  height: number | null
) => {
  let nextWidth = width ?? (isLandscape ? landscapeDefaultWidth : defaultWidth);
  let nextHeight = height ?? Math.round(isLandscape ? nextWidth / A4_RATIO : nextWidth * A4_RATIO);
  if (isLandscape && nextHeight > nextWidth) {
    [nextWidth, nextHeight] = [nextHeight, nextWidth];
  }
  if (!isLandscape && nextWidth > nextHeight) {
    [nextWidth, nextHeight] = [nextHeight, nextWidth];
  }
  return { width: nextWidth, height: nextHeight };
};
export const getDisplayRelationType = (relationType: string) => {
  if (!relationType) return "Related";
  const trimmed = relationType.trim();
  if (!trimmed) return "Related";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};
export const getRelationshipCategoryLabel = (category: string | null | undefined, customType: string | null | undefined) => {
  const normalized = (category || "").trim().toLowerCase();
  if (normalized === "other") {
    const custom = (customType || "").trim();
    return custom || "Other";
  }
  const labelByCategory: Record<string, string> = {
    information: "Information",
    systems: "Systems",
    process: "Process",
    data: "Data",
    influenced_by: "Influenced By",
    influences: "Influences",
    responsible_for: "Responsible For",
    controls: "Controls",
    controlled_by: "Controlled By",
    risk_level: "Risk Level",
    energy_type: "Energy Type",
    leads_to: "Leads To",
    mitigated_by: "Mitigated By",
    mitigates: "Mitigates",
    contributes_to: "Contributes To",
    evidence_for: "Evidence For",
    barrier_for: "Barrier For",
    recommends: "Recommends",
    reports_to: "Reports To",
  };
  if (!normalized) return "Information";
  return labelByCategory[normalized] || (normalized.charAt(0).toUpperCase() + normalized.slice(1));
};
export const defaultRelationshipCategoryOptions: RelationshipCategoryOption[] = [
  { value: "information", label: "Information" },
  { value: "systems", label: "Systems" },
  { value: "process", label: "Process" },
  { value: "data", label: "Data" },
];

export const bowtieIncidentRelationshipCategoryOptions: RelationshipCategoryOption[] = [
  { value: "influenced_by", label: "Influenced By" },
  { value: "influences", label: "Influences" },
  { value: "responsible_for", label: "Responsible For" },
  { value: "controls", label: "Controls" },
  { value: "controlled_by", label: "Controlled By" },
  { value: "risk_level", label: "Risk Level" },
  { value: "energy_type", label: "Energy Type" },
  { value: "leads_to", label: "Leads To" },
  { value: "mitigated_by", label: "Mitigated By" },
  { value: "mitigates", label: "Mitigates" },
  { value: "contributes_to", label: "Contributes To" },
  { value: "evidence_for", label: "Evidence For" },
  { value: "barrier_for", label: "Barrier For" },
  { value: "recommends", label: "Recommends" },
];
export const incidentRelationshipCategoryOptions = bowtieIncidentRelationshipCategoryOptions;
export const orgChartRelationshipCategoryOptions: RelationshipCategoryOption[] = [
  { value: "reports_to", label: "Reports To" },
];
export const customRelationshipCategoryOptions: RelationshipCategoryOption[] = [
  { value: "other", label: "Other" },
];
export const allRelationshipCategoryGroups: RelationshipCategoryGroup[] = [
  { label: "General", options: defaultRelationshipCategoryOptions },
  { label: "Bow Tie / Incident", options: bowtieIncidentRelationshipCategoryOptions },
  { label: "Org Chart", options: orgChartRelationshipCategoryOptions },
  { label: "Custom", options: customRelationshipCategoryOptions },
];

export const getRelationshipCategoryOptions = (mapCategoryId: string | null | undefined): RelationshipCategoryOption[] => {
  const preferredOrder =
    mapCategoryId === "incident_investigation" || mapCategoryId === "bow_tie"
      ? ["Bow Tie / Incident", "General", "Org Chart", "Custom"]
      : mapCategoryId === "org_chart"
      ? ["Org Chart", "General", "Bow Tie / Incident", "Custom"]
      : ["General", "Bow Tie / Incident", "Org Chart", "Custom"];
  return preferredOrder
    .flatMap((groupLabel) => allRelationshipCategoryGroups.find((group) => group.label === groupLabel)?.options ?? []);
};

export const getRelationshipCategoryGroups = (mapCategoryId: string | null | undefined): RelationshipCategoryGroup[] => {
  const preferredOrder =
    mapCategoryId === "incident_investigation" || mapCategoryId === "bow_tie"
      ? ["Bow Tie / Incident", "General", "Org Chart", "Custom"]
      : mapCategoryId === "org_chart"
      ? ["Org Chart", "General", "Bow Tie / Incident", "Custom"]
      : ["General", "Bow Tie / Incident", "Org Chart", "Custom"];
  return preferredOrder
    .map((groupLabel) => allRelationshipCategoryGroups.find((group) => group.label === groupLabel))
    .filter((group): group is RelationshipCategoryGroup => !!group);
};

export const getDefaultRelationshipCategoryForMap = (mapCategoryId: string | null | undefined): RelationshipCategory =>
  mapCategoryId === "incident_investigation" || mapCategoryId === "bow_tie"
    ? "leads_to"
    : mapCategoryId === "org_chart"
    ? "reports_to"
    : "information";

export const normalizeRelationshipCategoryForMap = (
  value: string | null | undefined,
  mapCategoryId: string | null | undefined,
  customType?: string | null | undefined
): RelationshipCategory => {
  const normalized = (value || "").trim().toLowerCase() as RelationshipCategory;
  const options = getRelationshipCategoryOptions(mapCategoryId);
  if (normalized === "other" && customType?.trim().toLowerCase() === "reports to") {
    return "reports_to";
  }
  if (normalized === "other" && customType?.trim()) {
    const normalizedCustom = customType.trim().toLowerCase();
    const flattenedOptions = allRelationshipCategoryGroups.flatMap((group) => group.options).filter((option) => option.value !== "other");
    const match = flattenedOptions.find((option) => option.label.trim().toLowerCase() === normalizedCustom);
    if (match) return match.value;
  }
  if (options.some((option) => option.value === normalized)) return normalized;
  return getDefaultRelationshipCategoryForMap(mapCategoryId);
};
export const getRelationshipDisciplineLetters = (disciplines: string[] | null | undefined) => {
  if (!disciplines?.length) return "";
  return disciplines
    .map((key) => disciplineLetterByKey.get(key as DisciplineKey) || "")
    .filter(Boolean)
    .join("");
};
export const getElementRelationshipTypeLabel = (elementType: CanvasElementRow["element_type"]) => {
  if (elementType === "system_circle") return "System";
  if (elementType === "process_component") return "Process";
  if (elementType === "person") return "Person";
  if (elementType === "grouping_container") return "Grouping Container";
  if (elementType === "category") return "Category";
  if (elementType === "sticky_note") return "Sticky Note";
  if (elementType === "image_asset") return "Image";
  if (elementType === "text_box") return "Text";
  if (elementType === "table") return "Table";
  if (elementType === "shape_rectangle") return "Rectangle";
  if (elementType === "shape_circle") return "Circle";
  if (elementType === "shape_pill") return "Pill";
  if (elementType === "shape_pentagon") return "Pentagon";
  if (elementType === "shape_chevron_left") return "Chevron";
  if (elementType === "shape_arrow") return "Arrow";
  if (elementType === "bowtie_hazard") return "Hazard";
  if (elementType === "bowtie_top_event") return "Top Event";
  if (elementType === "bowtie_threat") return "Threat";
  if (elementType === "bowtie_consequence") return "Consequence";
  if (elementType === "bowtie_control") return "Control";
  if (elementType === "bowtie_escalation_factor") return "Escalation Factor";
  if (elementType === "bowtie_recovery_measure") return "Recovery Measure";
  if (elementType === "bowtie_degradation_indicator") return "Degradation Indicator";
  if (elementType === "bowtie_risk_rating") return "Risk Rating";
  if (elementType === "incident_sequence_step") return "Sequence Step";
  if (elementType === "incident_outcome") return "Outcome";
  if (elementType === "incident_task_condition") return "Task / Condition";
  if (elementType === "incident_factor") return "Factor";
  if (elementType === "incident_system_factor") return "System Factor";
  if (elementType === "incident_control_barrier") return "Control / Barrier";
  if (elementType === "incident_evidence") return "Evidence";
  if (elementType === "incident_finding") return "Finding";
  if (elementType === "incident_recommendation") return "Recommendation";
  return "Component";
};
export const getElementDisplayName = (element: CanvasElementRow) => {
  if (isOrgChartPersonElement(element)) {
    const cfg = parseOrgChartPersonConfig(element.element_config);
    return cfg.position_title || "Position Title";
  }
  if (element.element_type === "person") {
    const labels = parsePersonLabels(element.heading);
    return labels.role;
  }
  if (element.element_type.startsWith("bowtie_") || element.element_type.startsWith("incident_")) {
    const cfg = (element.element_config as Record<string, unknown> | null) ?? {};
    const description = String(cfg.description ?? "").trim();
    if (description) return description;
  }
  return element.heading || "Untitled";
};
export const getElementRelationshipDisplayLabel = (element: CanvasElementRow) => {
  return `${getElementDisplayName(element)} (${getElementRelationshipTypeLabel(element.element_type)})`;
};

export const getTypeBannerStyle = (typeName: string) => {
  const key = typeName.toLowerCase();
  if (key.includes("manual")) return { bg: "#b91c1c", text: "#ffffff" };
  if (key.includes("policy")) return { bg: "#7e22ce", text: "#ffffff" };
  if (key.includes("management plan")) return { bg: "#1d4ed8", text: "#ffffff" };
  if (key.includes("procedure")) return { bg: "#c2410c", text: "#ffffff" };
  if (key.includes("guidance")) return { bg: "#8b5a2b", text: "#ffffff" };
  if (key.includes("work instruction")) return { bg: "#facc15", text: "#1f2937" };
  if (key.includes("form")) return { bg: "#15803d", text: "#ffffff" };
  if (key.includes("record")) return { bg: "#475569", text: "#ffffff" };
  if (key.includes("risk")) return { bg: "#0ea5a4", text: "#ffffff" };
  return { bg: "#64748b", text: "#ffffff" };
};
export const boxesOverlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  gap = 0
) =>
  a.x < b.x + b.width + gap &&
  a.x + a.width + gap > b.x &&
  a.y < b.y + b.height + gap &&
  a.y + a.height + gap > b.y;
export const pointInRect = (p: { x: number; y: number }, r: { x: number; y: number; width: number; height: number }) =>
  p.x > r.x && p.x < r.x + r.width && p.y > r.y && p.y < r.y + r.height;
export const ccw = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) =>
  (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
export const segmentsIntersect = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }) =>
  ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
export const lineIntersectsRect = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
) => {
  if (pointInRect(p1, rect) || pointInRect(p2, rect)) return true;
  const tl = { x: rect.x, y: rect.y };
  const tr = { x: rect.x + rect.width, y: rect.y };
  const br = { x: rect.x + rect.width, y: rect.y + rect.height };
  const bl = { x: rect.x, y: rect.y + rect.height };
  return (
    segmentsIntersect(p1, p2, tl, tr) ||
    segmentsIntersect(p1, p2, tr, br) ||
    segmentsIntersect(p1, p2, br, bl) ||
    segmentsIntersect(p1, p2, bl, tl)
  );
};
export const pointInRectXY = (x: number, y: number, rect: Rect) =>
  x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
export const pointInAnyRect = (x: number, y: number, rects: Rect[]) => rects.some((rect) => pointInRectXY(x, y, rect));
