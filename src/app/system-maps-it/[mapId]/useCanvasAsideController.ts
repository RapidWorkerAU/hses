"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";

export type DesktopNodeAction = "configure" | "relationship" | "structure" | null;

type Params = {
  isMobile: boolean;
  selectedNodeId: string | null;
  selectedProcessId: string | null;
  selectedSystemId: string | null;
  selectedProcessComponentId: string | null;
  selectedPersonId: string | null;
  selectedAnchorId: string | null;
  selectedGroupingId: string | null;
  selectedStickyId: string | null;
  selectedImageId: string | null;
  selectedTextBoxId: string | null;
  selectedTableId: string | null;
  selectedFlowShapeId: string | null;
  selectedBowtieElementId: string | null;
  selectedSingleFlowId: string | null;
  currentSpecificSelectedFlowId: string | null;
  outlineNodeId: string | null;
  isNodeDragActiveRef: MutableRefObject<boolean>;
};

export function useCanvasAsideController({
  isMobile,
  selectedNodeId,
  selectedProcessId,
  selectedSystemId,
  selectedProcessComponentId,
  selectedPersonId,
  selectedAnchorId,
  selectedGroupingId,
  selectedStickyId,
  selectedImageId,
  selectedTextBoxId,
  selectedTableId,
  selectedFlowShapeId,
  selectedBowtieElementId,
  selectedSingleFlowId,
  currentSpecificSelectedFlowId,
  outlineNodeId,
  isNodeDragActiveRef,
}: Params) {
  const [desktopNodeAction, setDesktopNodeAction] = useState<DesktopNodeAction>(null);
  const [leftAsideSlideIn, setLeftAsideSlideIn] = useState(false);
  const activePrimaryLeftAsideKeyRef = useRef<string | null>(null);
  const autosavePointerLockRef = useRef(false);
  const suppressNextPaneClearRef = useRef(false);
  const suppressNextPaneClearFrameRef = useRef<number | null>(null);
  const suppressPaneClearUntilRef = useRef(0);

  const activePrimaryLeftAsideKey = useMemo(() => {
    if (isMobile) return null;
    if (desktopNodeAction !== "configure" && desktopNodeAction !== "relationship") return null;
    if (selectedStickyId) return `sticky:${selectedStickyId}`;
    if (selectedImageId) return `image:${selectedImageId}`;
    if (selectedTextBoxId) return `textbox:${selectedTextBoxId}`;
    if (selectedTableId) return `table:${selectedTableId}`;
    if (selectedFlowShapeId) return `shape:${selectedFlowShapeId}`;
    if (selectedProcessId) return `category:${selectedProcessId}`;
    if (selectedSystemId) return `system:${selectedSystemId}`;
    if (selectedProcessComponentId) return `process:${selectedProcessComponentId}`;
    if (selectedPersonId) return `person:${selectedPersonId}`;
    if (selectedAnchorId) return `anchor:${selectedAnchorId}`;
    if (selectedBowtieElementId) return `bowtie:${selectedBowtieElementId}`;
    if (selectedGroupingId) return `grouping:${selectedGroupingId}`;
    if (selectedNodeId) return `document:${selectedNodeId}`;
    return null;
  }, [
    desktopNodeAction,
    isMobile,
    selectedBowtieElementId,
    selectedFlowShapeId,
    selectedGroupingId,
    selectedImageId,
    selectedNodeId,
    selectedAnchorId,
    selectedPersonId,
    selectedProcessComponentId,
    selectedProcessId,
    selectedStickyId,
    selectedSystemId,
    selectedTableId,
    selectedTextBoxId,
  ]);

  const shouldShowDesktopStructurePanel =
    !isMobile &&
    !!selectedNodeId &&
    desktopNodeAction === "structure" &&
    !!outlineNodeId &&
    outlineNodeId === selectedNodeId;

  const isPrimaryLeftAsideOpen = useCallback(
    (key: string | null) => Boolean(!isMobile && key && activePrimaryLeftAsideKey === key),
    [activePrimaryLeftAsideKey, isMobile]
  );

  const shouldPreservePrimaryLeftAside = useCallback(
    () =>
      isNodeDragActiveRef.current ||
      Boolean(currentSpecificSelectedFlowId) ||
      Boolean(selectedSingleFlowId) ||
      Date.now() < suppressPaneClearUntilRef.current,
    [currentSpecificSelectedFlowId, isNodeDragActiveRef, selectedSingleFlowId]
  );

  const armPaneClearSuppression = useCallback(() => {
    suppressNextPaneClearRef.current = true;
    if (suppressNextPaneClearFrameRef.current !== null) {
      cancelAnimationFrame(suppressNextPaneClearFrameRef.current);
    }
    suppressNextPaneClearFrameRef.current = requestAnimationFrame(() => {
      suppressNextPaneClearRef.current = false;
      suppressNextPaneClearFrameRef.current = null;
    });
  }, []);

  const consumePaneClearSuppression = useCallback(() => {
    if (!suppressNextPaneClearRef.current && Date.now() >= suppressPaneClearUntilRef.current) return false;
    suppressNextPaneClearRef.current = false;
    suppressPaneClearUntilRef.current = 0;
    if (suppressNextPaneClearFrameRef.current !== null) {
      cancelAnimationFrame(suppressNextPaneClearFrameRef.current);
      suppressNextPaneClearFrameRef.current = null;
    }
    return true;
  }, []);

  const beginNodeDrag = useCallback(() => {
    isNodeDragActiveRef.current = true;
    suppressPaneClearUntilRef.current = Date.now() + 500;
  }, [isNodeDragActiveRef]);

  const beginNodeDragStop = useCallback(() => {
    suppressPaneClearUntilRef.current = Date.now() + 750;
  }, []);

  const finishNodeDragStop = useCallback(() => {
    suppressPaneClearUntilRef.current = Date.now() + 500;
    isNodeDragActiveRef.current = false;
  }, [isNodeDragActiveRef]);

  useLayoutEffect(() => {
    if (!activePrimaryLeftAsideKey) {
      if (activePrimaryLeftAsideKeyRef.current && shouldPreservePrimaryLeftAside()) return;
      activePrimaryLeftAsideKeyRef.current = null;
      // Deliberately sync before paint so closing/changing the aside cannot flash stale content.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLeftAsideSlideIn(false);
      return;
    }
    if (activePrimaryLeftAsideKeyRef.current === activePrimaryLeftAsideKey) return;
    activePrimaryLeftAsideKeyRef.current = activePrimaryLeftAsideKey;
    // Deliberately sync before paint to reset the transform before the next slide-in frame.
    setLeftAsideSlideIn(false);
    const raf = requestAnimationFrame(() => setLeftAsideSlideIn(true));
    return () => cancelAnimationFrame(raf);
  }, [activePrimaryLeftAsideKey, shouldPreservePrimaryLeftAside]);

  useEffect(() => {
    return () => {
      if (suppressNextPaneClearFrameRef.current !== null) {
        cancelAnimationFrame(suppressNextPaneClearFrameRef.current);
      }
    };
  }, []);

  return {
    desktopNodeAction,
    setDesktopNodeAction,
    leftAsideSlideIn,
    activePrimaryLeftAsideKey,
    shouldShowDesktopStructurePanel,
    isPrimaryLeftAsideOpen,
    autosavePointerLockRef,
    armPaneClearSuppression,
    consumePaneClearSuppression,
    beginNodeDrag,
    beginNodeDragStop,
    finishNodeDragStop,
  };
}
