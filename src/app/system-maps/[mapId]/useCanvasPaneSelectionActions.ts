import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import type { FlowData } from "./canvasShared";

type SelectionMarqueeState = {
  active: boolean;
  startClientX: number;
  startClientY: number;
  currentClientX: number;
  currentClientY: number;
};

type Params = {
  rf: {
    screenToFlowPosition: (pt: { x: number; y: number }) => { x: number; y: number };
  } | null;
  flowNodes: Node<FlowData>[];
  getFlowNodeBounds: (id: string) => { x: number; y: number; width: number; height: number } | null;
  canUseContextMenu: boolean;
  canWriteMap: boolean;
  setSelectionMarquee: React.Dispatch<React.SetStateAction<SelectionMarqueeState>>;
  setSelectedFlowIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setHoveredEdgeId: (value: string | null) => void;
  onPaneBlankClick?: () => void;
};

export function useCanvasPaneSelectionActions({
  rf,
  flowNodes,
  getFlowNodeBounds,
  canUseContextMenu,
  canWriteMap,
  setSelectionMarquee,
  setSelectedFlowIds,
  setHoveredEdgeId,
  onPaneBlankClick,
}: Params) {
  const handlePaneClickClearSelection = useCallback(() => {
    setHoveredEdgeId(null);
    onPaneBlankClick?.();
  }, [setHoveredEdgeId, onPaneBlankClick]);

  const handlePaneMouseDown = useCallback(
    (event: {
      button: number;
      clientX: number;
      clientY: number;
      preventDefault: () => void;
      stopPropagation: () => void;
      target?: EventTarget | null;
    }) => {
      if (event.button !== 2 || !rf || !canUseContextMenu || !canWriteMap) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(".react-flow__node")) return;
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startY = event.clientY;
      setSelectionMarquee({
        active: true,
        startClientX: startX,
        startClientY: startY,
        currentClientX: startX,
        currentClientY: startY,
      });

      const onMove = (moveEvent: MouseEvent) => {
        setSelectionMarquee((prev) => ({
          ...prev,
          active: true,
          currentClientX: moveEvent.clientX,
          currentClientY: moveEvent.clientY,
        }));
      };

      const onUp = (upEvent: MouseEvent) => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        const endX = upEvent.clientX;
        const endY = upEvent.clientY;
        setSelectionMarquee({
          active: false,
          startClientX: 0,
          startClientY: 0,
          currentClientX: 0,
          currentClientY: 0,
        });

        const movedEnough = Math.abs(endX - startX) > 4 || Math.abs(endY - startY) > 4;
        if (!movedEnough) return;

        const p1 = rf.screenToFlowPosition({ x: startX, y: startY });
        const p2 = rf.screenToFlowPosition({ x: endX, y: endY });
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);

        const selected = new Set<string>();
        flowNodes.forEach((flowNode) => {
          const bounds = getFlowNodeBounds(flowNode.id);
          if (!bounds) return;
          const fullyInside =
            bounds.x >= minX &&
            bounds.y >= minY &&
            bounds.x + bounds.width <= maxX &&
            bounds.y + bounds.height <= maxY;
          if (fullyInside) selected.add(flowNode.id);
        });
        setSelectedFlowIds(selected);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [
      rf,
      canUseContextMenu,
      canWriteMap,
      setSelectionMarquee,
      flowNodes,
      getFlowNodeBounds,
      setSelectedFlowIds,
    ]
  );

  return {
    handlePaneClickClearSelection,
    handlePaneMouseDown,
  };
}
