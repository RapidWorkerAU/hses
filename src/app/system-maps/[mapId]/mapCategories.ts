"use client";

export type NodePaletteKind =
  | "document"
  | "system"
  | "process"
  | "person"
  | "category"
  | "grouping_container"
  | "sticky_note"
  | "image_asset"
  | "text_box"
  | "table"
  | "shape_rectangle"
  | "shape_circle"
  | "shape_pill"
  | "shape_pentagon"
  | "shape_chevron_left"
  | "shape_arrow"
  | "incident_sequence_step"
  | "incident_outcome"
  | "incident_task_condition"
  | "incident_factor"
  | "incident_system_factor"
  | "incident_control_barrier"
  | "incident_evidence"
  | "incident_finding"
  | "incident_recommendation"
  | "bowtie_hazard"
  | "bowtie_top_event"
  | "bowtie_threat"
  | "bowtie_consequence"
  | "bowtie_control"
  | "bowtie_escalation_factor"
  | "bowtie_recovery_measure"
  | "bowtie_degradation_indicator"
  | "bowtie_risk_rating";

export type MapCategoryId =
  | "document_map"
  | "bow_tie"
  | "incident_investigation"
  | "org_chart"
  | "process_flow";

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
    allowedNodeKinds: ["document", "system", "process", "person", "category", "grouping_container", "sticky_note", "image_asset", "text_box", "table"],
  },
  bow_tie: {
    id: "bow_tie",
    label: "Bow Tie",
    allowedNodeKinds: [
      "category",
      "grouping_container",
      "person",
      "sticky_note",
      "image_asset",
      "text_box",
      "bowtie_hazard",
      "bowtie_top_event",
      "bowtie_threat",
      "bowtie_consequence",
      "bowtie_control",
      "bowtie_escalation_factor",
      "bowtie_recovery_measure",
      "bowtie_degradation_indicator",
      "bowtie_risk_rating",
    ],
  },
  incident_investigation: {
    id: "incident_investigation",
    label: "Incident Investigation",
    allowedNodeKinds: [
      "document",
      "process",
      "category",
      "grouping_container",
      "person",
      "sticky_note",
      "image_asset",
      "text_box",
      "table",
      "incident_sequence_step",
      "incident_outcome",
      "incident_task_condition",
      "incident_factor",
      "incident_system_factor",
      "incident_control_barrier",
      "incident_evidence",
      "incident_finding",
      "incident_recommendation",
    ],
  },
  org_chart: {
    id: "org_chart",
    label: "Org Chart",
    allowedNodeKinds: ["person", "category", "grouping_container", "image_asset", "text_box"],
  },
  process_flow: {
    id: "process_flow",
    label: "Process Flow",
    allowedNodeKinds: [
      "category",
      "grouping_container",
      "text_box",
      "image_asset",
      "document",
      "sticky_note",
      "process",
      "system",
      "table",
      "shape_rectangle",
      "shape_circle",
      "shape_pill",
      "shape_pentagon",
      "shape_chevron_left",
      "shape_arrow",
    ],
  },
};

export const defaultMapCategoryId: MapCategoryId = "document_map";

export const getAllowedNodeKindsForCategory = (categoryId: MapCategoryId | null | undefined): NodePaletteKind[] => {
  if (!categoryId) return mapCategoryConfigs[defaultMapCategoryId].allowedNodeKinds;
  return mapCategoryConfigs[categoryId]?.allowedNodeKinds ?? mapCategoryConfigs[defaultMapCategoryId].allowedNodeKinds;
};
