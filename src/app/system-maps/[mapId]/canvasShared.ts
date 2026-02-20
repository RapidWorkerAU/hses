export type SystemMap = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  map_code: string | null;
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
  element_type: "category" | "system_circle" | "grouping_container" | "process_component" | "sticky_note" | "person";
  heading: string;
  color_hex: string | null;
  created_by_user_id: string | null;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
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
  entityKind: "document" | "category" | "system_circle" | "grouping_container" | "process_component" | "sticky_note" | "person";
  typeName: string;
  title: string;
  documentNumber?: string;
  categoryColor?: string;
  canEdit?: boolean;
  creatorName?: string;
  createdAtLabel?: string;
  userGroup: string;
  disciplineKeys: string[];
  bannerBg: string;
  bannerText: string;
  isLandscape: boolean;
  isUnconfigured: boolean;
};
export type DisciplineKey = "health" | "safety" | "environment" | "security" | "communities" | "training";
export type RelationshipCategory = "information" | "systems" | "process" | "data" | "other";
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
export const groupingDefaultWidth = minorGridSize * 22;
export const groupingDefaultHeight = minorGridSize * 12;
export const groupingMinWidth = minorGridSize * 8;
export const groupingMinHeight = minorGridSize * 6;
export const groupingMinWidthSquares = Math.round(groupingMinWidth / minorGridSize);
export const groupingMinHeightSquares = Math.round(groupingMinHeight / minorGridSize);
export const stickyDefaultSize = minorGridSize * 5;
export const stickyMinSize = minorGridSize * 2;
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
export const processFlowId = (id: string) => `process:${id}`;
export const parseProcessFlowId = (id: string) => (id.startsWith("process:") ? id.slice(8) : id);
export const isAbortLikeError = (error: unknown) => {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return normalized.includes("aborterror") || normalized.includes("signal is aborted") || normalized.includes("aborted");
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
  if (!normalized) return "Information";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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
  return "Component";
};
export const getElementDisplayName = (element: CanvasElementRow) => {
  if (element.element_type === "person") {
    const labels = parsePersonLabels(element.heading);
    return labels.role;
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
