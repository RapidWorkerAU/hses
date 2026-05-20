"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Node } from "@xyflow/react";
import type { FlowData } from "./canvasShared";
import { parseProcessFlowId } from "./canvasShared";

type Setter<T> = Dispatch<SetStateAction<T>>;

export type CanvasSelectionTarget =
  | "document"
  | "category"
  | "system"
  | "processComponent"
  | "person"
  | "anchor"
  | "grouping"
  | "sticky"
  | "image"
  | "textBox"
  | "table"
  | "flowShape"
  | "bowtieElement";

export type CanvasSelectionSetters = {
  setSelectedNodeId: Setter<string | null>;
  setSelectedProcessId: Setter<string | null>;
  setSelectedSystemId: Setter<string | null>;
  setSelectedProcessComponentId: Setter<string | null>;
  setSelectedPersonId: Setter<string | null>;
  setSelectedAnchorId: Setter<string | null>;
  setSelectedGroupingId: Setter<string | null>;
  setSelectedStickyId: Setter<string | null>;
  setSelectedImageId: Setter<string | null>;
  setSelectedTextBoxId: Setter<string | null>;
  setSelectedTableId: Setter<string | null>;
  setSelectedFlowShapeId: Setter<string | null>;
  setSelectedBowtieElementId: Setter<string | null>;
};

type ClearCanvasSelectionsOptions = {
  except?: CanvasSelectionTarget[];
};

const isExcepted = (target: CanvasSelectionTarget, except: CanvasSelectionTarget[]) => except.includes(target);

export const clearCanvasSelections = (
  setters: CanvasSelectionSetters,
  options: ClearCanvasSelectionsOptions = {}
) => {
  const except = options.except ?? [];
  if (!isExcepted("document", except)) setters.setSelectedNodeId(null);
  if (!isExcepted("category", except)) setters.setSelectedProcessId(null);
  if (!isExcepted("system", except)) setters.setSelectedSystemId(null);
  if (!isExcepted("processComponent", except)) setters.setSelectedProcessComponentId(null);
  if (!isExcepted("person", except)) setters.setSelectedPersonId(null);
  if (!isExcepted("anchor", except)) setters.setSelectedAnchorId(null);
  if (!isExcepted("grouping", except)) setters.setSelectedGroupingId(null);
  if (!isExcepted("sticky", except)) setters.setSelectedStickyId(null);
  if (!isExcepted("image", except)) setters.setSelectedImageId(null);
  if (!isExcepted("textBox", except)) setters.setSelectedTextBoxId(null);
  if (!isExcepted("table", except)) setters.setSelectedTableId(null);
  if (!isExcepted("flowShape", except)) setters.setSelectedFlowShapeId(null);
  if (!isExcepted("bowtieElement", except)) setters.setSelectedBowtieElementId(null);
};

export const setCanvasSelection = (
  setters: CanvasSelectionSetters,
  target: CanvasSelectionTarget,
  id: string
) => {
  clearCanvasSelections(setters, { except: [target] });
  switch (target) {
    case "document":
      setters.setSelectedNodeId(id);
      break;
    case "category":
      setters.setSelectedProcessId(id);
      break;
    case "system":
      setters.setSelectedSystemId(id);
      break;
    case "processComponent":
      setters.setSelectedProcessComponentId(id);
      break;
    case "person":
      setters.setSelectedPersonId(id);
      break;
    case "anchor":
      setters.setSelectedAnchorId(id);
      break;
    case "grouping":
      setters.setSelectedGroupingId(id);
      break;
    case "sticky":
      setters.setSelectedStickyId(id);
      break;
    case "image":
      setters.setSelectedImageId(id);
      break;
    case "textBox":
      setters.setSelectedTextBoxId(id);
      break;
    case "table":
      setters.setSelectedTableId(id);
      break;
    case "flowShape":
      setters.setSelectedFlowShapeId(id);
      break;
    case "bowtieElement":
      setters.setSelectedBowtieElementId(id);
      break;
  }
};

export const isCanvasShapeKind = (entityKind: FlowData["entityKind"]) =>
  entityKind === "shape_rectangle" ||
  entityKind === "shape_circle" ||
  entityKind === "shape_pill" ||
  entityKind === "shape_pentagon" ||
  entityKind === "shape_chevron_left" ||
  entityKind === "shape_arrow";

export const isBowtieOrInvestigationKind = (entityKind: FlowData["entityKind"]) =>
  entityKind === "bowtie_hazard" ||
  entityKind === "bowtie_top_event" ||
  entityKind === "bowtie_threat" ||
  entityKind === "bowtie_consequence" ||
  entityKind === "bowtie_control" ||
  entityKind === "bowtie_escalation_factor" ||
  entityKind === "bowtie_recovery_measure" ||
  entityKind === "bowtie_degradation_indicator" ||
  entityKind === "bowtie_risk_rating" ||
  entityKind === "incident_sequence_step" ||
  entityKind === "incident_outcome" ||
  entityKind === "incident_task_condition" ||
  entityKind === "incident_factor" ||
  entityKind === "incident_system_factor" ||
  entityKind === "incident_control_barrier" ||
  entityKind === "incident_evidence" ||
  entityKind === "incident_response_recovery" ||
  entityKind === "incident_finding" ||
  entityKind === "incident_recommendation";

export const getCanvasSelectionTargetForEntityKind = (
  entityKind: FlowData["entityKind"]
): CanvasSelectionTarget | null => {
  if (entityKind === "document") return "document";
  if (entityKind === "category") return "category";
  if (entityKind === "system_circle") return "system";
  if (entityKind === "process_component") return "processComponent";
  if (entityKind === "person" || entityKind === "equipment" || entityKind === "environment") return "person";
  if (entityKind === "anchor") return "anchor";
  if (entityKind === "grouping_container") return "grouping";
  if (entityKind === "sticky_note") return "sticky";
  if (entityKind === "image_asset") return "image";
  if (entityKind === "text_box") return "textBox";
  if (entityKind === "table") return "table";
  if (isCanvasShapeKind(entityKind)) return "flowShape";
  if (isBowtieOrInvestigationKind(entityKind)) return "bowtieElement";
  return null;
};

type SyncCanvasSelectionFromFlowNodeOptions = {
  parseProcessPrefixedIdsOnly?: boolean;
};

export const syncCanvasSelectionFromFlowNode = (
  setters: CanvasSelectionSetters,
  flowNode: Node<FlowData>,
  options: SyncCanvasSelectionFromFlowNodeOptions = {}
) => {
  const target = getCanvasSelectionTargetForEntityKind(flowNode.data.entityKind);
  if (!target) {
    clearCanvasSelections(setters);
    return;
  }

  const id =
    target === "document"
      ? flowNode.id
      : options.parseProcessPrefixedIdsOnly
        ? flowNode.id.startsWith("process:")
          ? parseProcessFlowId(flowNode.id)
          : flowNode.id
        : parseProcessFlowId(flowNode.id);

  setCanvasSelection(setters, target, id);
};
