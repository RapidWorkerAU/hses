"use client";

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Node } from "@xyflow/react";
import type { CanvasElementRow, FlowData } from "./canvasShared";
import { parseProcessFlowId } from "./canvasShared";

type Setter<T> = Dispatch<SetStateAction<T>>;

type HandleCanvasNodeClickParams = {
  event: React.MouseEvent;
  node: Node<FlowData>;
  mapRole: "read" | "partial_write" | "full_write" | null;
  elements: CanvasElementRow[];
  canEditElement: (element: CanvasElementRow) => boolean;
  isMobile: boolean;
  lastMobileTapRef: MutableRefObject<{ id: string; ts: number } | null>;
  setSelectedFlowIds: Setter<Set<string>>;
  setSelectedNodeId: Setter<string | null>;
  setSelectedProcessId: Setter<string | null>;
  setSelectedSystemId: Setter<string | null>;
  setSelectedProcessComponentId: Setter<string | null>;
  setSelectedPersonId: Setter<string | null>;
  setSelectedGroupingId: Setter<string | null>;
  setSelectedStickyId: Setter<string | null>;
  setSelectedImageId: Setter<string | null>;
  setSelectedTextBoxId: Setter<string | null>;
  setSelectedBowtieElementId: Setter<string | null>;
  setMobileNodeMenuId: Setter<string | null>;
};

const isMobileDoubleTap = (
  nodeId: string,
  lastMobileTapRef: MutableRefObject<{ id: string; ts: number } | null>
) => {
  const now = Date.now();
  const lastTap = lastMobileTapRef.current;
  const isDoubleTap = Boolean(lastTap && lastTap.id === nodeId && now - lastTap.ts <= 500);
  if (isDoubleTap) {
    lastMobileTapRef.current = null;
    return true;
  }
  lastMobileTapRef.current = { id: nodeId, ts: now };
  return false;
};

const isBowtieOrInvestigationKind = (entityKind: FlowData["entityKind"]) =>
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
  entityKind === "incident_finding" ||
  entityKind === "incident_recommendation";

export const handleCanvasNodeClick = ({
  event,
  node,
  mapRole,
  elements,
  canEditElement,
  isMobile,
  lastMobileTapRef,
  setSelectedFlowIds,
  setSelectedNodeId,
  setSelectedProcessId,
  setSelectedSystemId,
  setSelectedProcessComponentId,
  setSelectedPersonId,
  setSelectedGroupingId,
  setSelectedStickyId,
  setSelectedImageId,
  setSelectedTextBoxId,
  setSelectedBowtieElementId,
  setMobileNodeMenuId,
}: HandleCanvasNodeClickParams) => {
  setSelectedFlowIds((prev) => (prev.size ? new Set<string>() : prev));

  if (mapRole === "read") {
    if (node.data.entityKind === "sticky_note") {
      const stickyId = parseProcessFlowId(node.id);
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

  const isBowtieKind = isBowtieOrInvestigationKind(node.data.entityKind);
  if (!isBowtieKind) setSelectedBowtieElementId(null);

  if (node.data.entityKind === "category") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        setSelectedNodeId(null);
        setSelectedProcessId(parseProcessFlowId(node.id));
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
    setSelectedProcessId(parseProcessFlowId(node.id));
    return;
  }

  if (node.data.entityKind === "process_component") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        setSelectedNodeId(null);
        setSelectedProcessId(null);
        setSelectedSystemId(null);
        setSelectedGroupingId(null);
        setSelectedPersonId(null);
        setSelectedProcessComponentId(parseProcessFlowId(node.id));
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
    setSelectedProcessComponentId(parseProcessFlowId(node.id));
    return;
  }

  if (node.data.entityKind === "system_circle") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        setSelectedNodeId(null);
        setSelectedProcessId(null);
        setSelectedPersonId(null);
        setSelectedSystemId(parseProcessFlowId(node.id));
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
    setSelectedSystemId(parseProcessFlowId(node.id));
    return;
  }

  if (node.data.entityKind === "person") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        setSelectedNodeId(null);
        setSelectedProcessId(null);
        setSelectedSystemId(null);
        setSelectedProcessComponentId(null);
        setSelectedGroupingId(null);
        setSelectedStickyId(null);
        setSelectedImageId(null);
        setSelectedTextBoxId(null);
        setSelectedPersonId(parseProcessFlowId(node.id));
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
    setSelectedPersonId(parseProcessFlowId(node.id));
    return;
  }

  if (node.data.entityKind === "grouping_container") {
    const target = event.target as HTMLElement | null;
    const clickedGroupingHandle = !!target?.closest(".grouping-drag-handle, .grouping-select-handle");
    if (!clickedGroupingHandle) return;
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        setSelectedNodeId(null);
        setSelectedProcessId(null);
        setSelectedSystemId(null);
        setSelectedPersonId(null);
        setSelectedGroupingId(parseProcessFlowId(node.id));
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
    setSelectedGroupingId(parseProcessFlowId(node.id));
    return;
  }

  if (node.data.entityKind === "image_asset") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        setSelectedNodeId(null);
        setSelectedProcessId(null);
        setSelectedSystemId(null);
        setSelectedProcessComponentId(null);
        setSelectedPersonId(null);
        setSelectedGroupingId(null);
        setSelectedStickyId(null);
        setSelectedTextBoxId(null);
        setSelectedBowtieElementId(null);
        setSelectedImageId(parseProcessFlowId(node.id));
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
    setSelectedImageId(parseProcessFlowId(node.id));
    return;
  }

  if (node.data.entityKind === "text_box") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        setSelectedNodeId(null);
        setSelectedProcessId(null);
        setSelectedSystemId(null);
        setSelectedProcessComponentId(null);
        setSelectedPersonId(null);
        setSelectedGroupingId(null);
        setSelectedStickyId(null);
        setSelectedImageId(null);
        setSelectedBowtieElementId(null);
        setSelectedTextBoxId(parseProcessFlowId(node.id));
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
    setSelectedTextBoxId(parseProcessFlowId(node.id));
    return;
  }

  if (isBowtieKind) {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        setSelectedNodeId(null);
        setSelectedProcessId(null);
        setSelectedSystemId(null);
        setSelectedProcessComponentId(null);
        setSelectedPersonId(null);
        setSelectedGroupingId(null);
        setSelectedStickyId(null);
        setSelectedImageId(null);
        setSelectedTextBoxId(null);
        setSelectedBowtieElementId(parseProcessFlowId(node.id));
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
    setSelectedBowtieElementId(parseProcessFlowId(node.id));
    return;
  }

  if (node.data.entityKind === "sticky_note") {
    setSelectedNodeId(null);
    setSelectedProcessId(null);
    setSelectedSystemId(null);
    setSelectedProcessComponentId(null);
    setSelectedPersonId(null);
    setSelectedGroupingId(null);
    setSelectedImageId(null);
    setSelectedTextBoxId(null);
    setSelectedBowtieElementId(null);
    setSelectedStickyId(parseProcessFlowId(node.id));
    return;
  }

  if (isMobile) {
    if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
      setMobileNodeMenuId(node.id);
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
  setSelectedNodeId(node.id);
};

