"use client";

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Node } from "@xyflow/react";
import type { CanvasElementRow, FlowData } from "./canvasShared";
import { parseProcessFlowId } from "./canvasShared";
import {
  clearCanvasSelections,
  isBowtieOrInvestigationKind,
  isCanvasShapeKind,
  setCanvasSelection,
  type CanvasSelectionSetters,
  type CanvasSelectionTarget,
} from "./canvasSelection";

type Setter<T> = Dispatch<SetStateAction<T>>;

type HandleCanvasNodeClickParams = {
  event: React.MouseEvent | React.PointerEvent;
  node: Node<FlowData>;
  mapRole: "read" | "partial_write" | "full_write" | null;
  elements: CanvasElementRow[];
  canEditElement: (element: CanvasElementRow) => boolean;
  isMobile: boolean;
  lastMobileTapRef: MutableRefObject<{ id: string; ts: number } | null>;
  setSelectedFlowIds: Setter<Set<string>>;
  selectionSetters: CanvasSelectionSetters;
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

export const handleCanvasNodeClick = ({
  event,
  node,
  mapRole,
  elements,
  canEditElement,
  isMobile,
  lastMobileTapRef,
  setSelectedFlowIds,
  selectionSetters,
  setMobileNodeMenuId,
}: HandleCanvasNodeClickParams) => {
  const markSelected = () =>
    setSelectedFlowIds((prev) => {
      if (prev.size === 1 && prev.has(node.id)) return prev;
      return new Set<string>([node.id]);
    });
  const selectNodeTarget = (target: CanvasSelectionTarget, id = parseProcessFlowId(node.id)) => {
    markSelected();
    setCanvasSelection(selectionSetters, target, id);
  };
  const clearAllSelections = () => clearCanvasSelections(selectionSetters);
  selectionSetters.setSelectedFlowShapeId(null);

  if (mapRole === "read") {
    if (node.data.entityKind === "sticky_note") {
      const stickyId = parseProcessFlowId(node.id);
      const sticky = elements.find((el) => el.id === stickyId && el.element_type === "sticky_note");
      if (sticky && canEditElement(sticky)) {
        selectNodeTarget("sticky", stickyId);
        return;
      }
    }
    markSelected();
    clearAllSelections();
    return;
  }

  const isBowtieKind = isBowtieOrInvestigationKind(node.data.entityKind);
  if (!isBowtieKind) selectionSetters.setSelectedBowtieElementId(null);

  if (node.data.entityKind === "category") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("category");
      }
      return;
    }
    selectNodeTarget("category");
    return;
  }

  if (node.data.entityKind === "process_component") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("processComponent");
      }
      return;
    }
    selectNodeTarget("processComponent");
    return;
  }

  if (node.data.entityKind === "system_circle") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("system");
      }
      return;
    }
    selectNodeTarget("system");
    return;
  }

  if (node.data.entityKind === "person" || node.data.entityKind === "equipment" || node.data.entityKind === "environment") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("person");
      }
      return;
    }
    selectNodeTarget("person");
    return;
  }

  if (node.data.entityKind === "anchor") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("anchor");
      }
      return;
    }
    selectNodeTarget("anchor");
    return;
  }

  if (node.data.entityKind === "grouping_container") {
    const target = event.target as HTMLElement | null;
    const clickedGroupingHandle = !!target?.closest(".grouping-drag-handle, .grouping-select-handle");
    if (!clickedGroupingHandle) return;
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("grouping");
      }
      return;
    }
    selectNodeTarget("grouping");
    return;
  }

  if (node.data.entityKind === "image_asset") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("image");
      }
      return;
    }
    selectNodeTarget("image");
    return;
  }

  if (node.data.entityKind === "text_box") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("textBox");
      }
      return;
    }
    selectNodeTarget("textBox");
    return;
  }

  if (node.data.entityKind === "table") {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("table");
      }
      return;
    }
    selectNodeTarget("table");
    return;
  }

  if (isCanvasShapeKind(node.data.entityKind)) {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("flowShape");
      }
      return;
    }
    selectNodeTarget("flowShape");
    return;
  }

  if (isBowtieKind) {
    if (isMobile) {
      if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
        selectNodeTarget("bowtieElement");
      }
      return;
    }
    selectNodeTarget("bowtieElement");
    return;
  }

  if (node.data.entityKind === "sticky_note") {
    selectNodeTarget("sticky");
    return;
  }

  if (isMobile) {
    if (isMobileDoubleTap(node.id, lastMobileTapRef)) {
      markSelected();
      setMobileNodeMenuId(node.id);
    }
    return;
  }

  markSelected();
  setCanvasSelection(selectionSetters, "document", node.id);
};
