"use client";

export type NodePaletteKind =
  | "document"
  | "system"
  | "process"
  | "person"
  | "category"
  | "grouping_container"
  | "sticky_note";

export type MapCategoryId =
  | "document_map"
  | "bow_tie"
  | "incident_investigation"
  | "org_chart";

export type MapCategoryConfig = {
  id: MapCategoryId;
  label: string;
  allowedNodeKinds: NodePaletteKind[];
};

export const mapCategoryConfigs: Record<MapCategoryId, MapCategoryConfig> = {
  document_map: {
    id: "document_map",
    label: "Document Map",
    // Current behavior baseline; future categories can narrow this safely.
    allowedNodeKinds: ["document", "system", "process", "person", "category", "grouping_container", "sticky_note"],
  },
  bow_tie: {
    id: "bow_tie",
    label: "Bow Tie",
    allowedNodeKinds: ["category", "process", "sticky_note"],
  },
  incident_investigation: {
    id: "incident_investigation",
    label: "Incident Investigation",
    allowedNodeKinds: ["document", "process", "person", "sticky_note"],
  },
  org_chart: {
    id: "org_chart",
    label: "Org Chart",
    allowedNodeKinds: ["person", "grouping_container", "sticky_note"],
  },
};

export const defaultMapCategoryId: MapCategoryId = "document_map";

export const getAllowedNodeKindsForCategory = (categoryId: MapCategoryId | null | undefined): NodePaletteKind[] => {
  if (!categoryId) return mapCategoryConfigs[defaultMapCategoryId].allowedNodeKinds;
  return mapCategoryConfigs[categoryId]?.allowedNodeKinds ?? mapCategoryConfigs[defaultMapCategoryId].allowedNodeKinds;
};

