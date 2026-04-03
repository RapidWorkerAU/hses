"use client";

export type NodePaletteKind =
  | "document"
  | "system"
  | "process"
  | "person"
  | "org_chart_person"
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

export const allNodePaletteKinds: NodePaletteKind[] = [
  "document",
  "system",
  "process",
  "person",
  "org_chart_person",
  "category",
  "grouping_container",
  "sticky_note",
  "image_asset",
  "text_box",
  "table",
  "shape_rectangle",
  "shape_circle",
  "shape_pill",
  "shape_pentagon",
  "shape_chevron_left",
  "shape_arrow",
  "incident_sequence_step",
  "incident_outcome",
  "incident_task_condition",
  "incident_factor",
  "incident_system_factor",
  "incident_control_barrier",
  "incident_evidence",
  "incident_finding",
  "incident_recommendation",
  "bowtie_hazard",
  "bowtie_top_event",
  "bowtie_threat",
  "bowtie_consequence",
  "bowtie_control",
  "bowtie_escalation_factor",
  "bowtie_recovery_measure",
  "bowtie_degradation_indicator",
  "bowtie_risk_rating",
];

export const mapCategoryConfigs: Record<MapCategoryId, MapCategoryConfig> = {
  document_map: {
    id: "document_map",
    label: "Document Map",
    allowedNodeKinds: [...allNodePaletteKinds],
  },
  bow_tie: {
    id: "bow_tie",
    label: "Bow Tie",
    allowedNodeKinds: [...allNodePaletteKinds],
  },
  incident_investigation: {
    id: "incident_investigation",
    label: "Incident Investigation",
    allowedNodeKinds: [...allNodePaletteKinds],
  },
  org_chart: {
    id: "org_chart",
    label: "Org Chart",
    allowedNodeKinds: [...allNodePaletteKinds],
  },
  process_flow: {
    id: "process_flow",
    label: "Process Flow",
    allowedNodeKinds: [...allNodePaletteKinds],
  },
};

export const defaultMapCategoryId: MapCategoryId = "document_map";

export const getAllowedNodeKindsForCategory = (categoryId: MapCategoryId | null | undefined): NodePaletteKind[] => {
  if (!categoryId) return mapCategoryConfigs[defaultMapCategoryId].allowedNodeKinds;
  return mapCategoryConfigs[categoryId]?.allowedNodeKinds ?? mapCategoryConfigs[defaultMapCategoryId].allowedNodeKinds;
};
