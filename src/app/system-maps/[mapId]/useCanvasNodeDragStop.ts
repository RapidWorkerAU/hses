import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { boxesOverlap, minorGridSize, parseProcessFlowId, shapeArrowDefaultHeight, shapeArrowDefaultWidth, shapeArrowMinHeight, shapeArrowMinWidth, shapeCircleDefaultSize, shapeMinHeight, shapeMinWidth, shapePentagonDefaultHeight, shapePentagonDefaultWidth, shapePillDefaultHeight, shapePillDefaultWidth, shapeRectangleDefaultHeight, shapeRectangleDefaultWidth, type CanvasElementRow, type DocumentNodeRow, type FlowData } from "./canvasShared";

type Params = {
  canWriteMap: boolean;
  canEditElement: (element: CanvasElementRow) => boolean;
  nodes: DocumentNodeRow[];
  elements: CanvasElementRow[];
  mapId: string;
  snapToMinorGrid: (value: number) => number;
  findNearestFreePosition: (nodeId: string, x: number, y: number) => { x: number; y: number } | null;
  selectedFlowIds: Set<string>;
  flowNodes: Node<FlowData>[];
  setError: (value: string | null) => void;
  setElements: React.Dispatch<React.SetStateAction<CanvasElementRow[]>>;
  setNodes: React.Dispatch<React.SetStateAction<DocumentNodeRow[]>>;
  setFlowNodes: React.Dispatch<React.SetStateAction<Node<FlowData>[]>>;
  savedPos: React.MutableRefObject<Record<string, { x: number; y: number }>>;
};

export function useCanvasNodeDragStop({
  canWriteMap,
  canEditElement,
  nodes,
  elements,
  mapId,
  snapToMinorGrid,
  findNearestFreePosition,
  selectedFlowIds,
  flowNodes,
  setError,
  setElements,
  setNodes,
  setFlowNodes,
  savedPos,
}: Params) {
  const isFlowShapeElementType = useCallback(
    (elementType: CanvasElementRow["element_type"]) =>
      elementType === "shape_rectangle" ||
      elementType === "shape_circle" ||
      elementType === "shape_pill" ||
      elementType === "shape_pentagon" ||
      elementType === "shape_chevron_left" ||
      elementType === "shape_arrow",
    []
  );

  const getFlowShapeDimensions = useCallback((element: CanvasElementRow) => {
    const defaultWidth =
      element.element_type === "shape_circle"
        ? shapeCircleDefaultSize
        : element.element_type === "shape_pill"
        ? shapePillDefaultWidth
        : element.element_type === "shape_arrow"
        ? shapeArrowDefaultWidth
        : element.element_type === "shape_pentagon" || element.element_type === "shape_chevron_left"
        ? shapePentagonDefaultWidth
        : shapeRectangleDefaultWidth;
    const defaultHeight =
      element.element_type === "shape_circle"
        ? shapeCircleDefaultSize
        : element.element_type === "shape_pill"
        ? shapePillDefaultHeight
        : element.element_type === "shape_arrow"
        ? shapeArrowDefaultHeight
        : element.element_type === "shape_pentagon" || element.element_type === "shape_chevron_left"
        ? shapePentagonDefaultHeight
        : shapeRectangleDefaultHeight;
    const minWidth = element.element_type === "shape_arrow" ? shapeArrowMinWidth : shapeMinWidth;
    const minHeight = element.element_type === "shape_arrow" ? shapeArrowMinHeight : shapeMinHeight;
    let width = Math.max(minWidth, element.width || defaultWidth);
    let height = Math.max(minHeight, element.height || defaultHeight);
    if (element.element_type === "shape_circle") {
      const side = Math.max(width, height);
      width = side;
      height = side;
    }
    return { width, height };
  }, []);

  const findNearestAvailableShapePosition = useCallback(
    (
      x: number,
      y: number,
      width: number,
      height: number,
      movingType: CanvasElementRow["element_type"],
      blocked: Array<{ x: number; y: number; width: number; height: number; elementType?: CanvasElementRow["element_type"] }>
    ) => {
      const isPentagonChevronPair = (a: CanvasElementRow["element_type"], b: CanvasElementRow["element_type"]) =>
        (a === "shape_pentagon" && b === "shape_chevron_left") || (a === "shape_chevron_left" && b === "shape_pentagon");
      const exceedsAllowedOverlap = (
        a: { x: number; y: number; width: number; height: number },
        b: { x: number; y: number; width: number; height: number },
        allowed: number
      ) => {
        if (!boxesOverlap(a, b, 0)) return false;
        const overlapWidth = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapHeight = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        return overlapWidth > allowed && overlapHeight > allowed;
      };
      const overlapsAt = (candidateX: number, candidateY: number) =>
        blocked.some((box) => {
          const candidate = { x: candidateX, y: candidateY, width, height };
          if (!boxesOverlap(candidate, box, 0)) return false;
          if (box.elementType && isPentagonChevronPair(movingType, box.elementType)) {
            return exceedsAllowedOverlap(candidate, box, minorGridSize * 2);
          }
          return true;
        });
      const startX = snapToMinorGrid(x);
      const startY = snapToMinorGrid(y);
      if (!overlapsAt(startX, startY)) return { x: startX, y: startY };
      const maxRing = 120;
      for (let ring = 1; ring <= maxRing; ring += 1) {
        for (let dx = -ring; dx <= ring; dx += 1) {
          for (let dy = -ring; dy <= ring; dy += 1) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
            const candidateX = snapToMinorGrid(startX + dx * minorGridSize);
            const candidateY = snapToMinorGrid(startY + dy * minorGridSize);
            if (!overlapsAt(candidateX, candidateY)) return { x: candidateX, y: candidateY };
          }
        }
      }
      return null;
    },
    [snapToMinorGrid]
  );

  const getFlowNodeRect = useCallback((flowNode: Node<FlowData>) => {
    const widthRaw = flowNode.style?.width;
    const heightRaw = flowNode.style?.height;
    const width = typeof widthRaw === "number" ? widthRaw : Number(widthRaw ?? 0);
    const height = typeof heightRaw === "number" ? heightRaw : Number(heightRaw ?? 0);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
    return { x: flowNode.position.x, y: flowNode.position.y, width, height };
  }, []);

  const onNodeDragStop = useCallback(
    async (_event: unknown, node: Node<FlowData>) => {
      if (selectedFlowIds.size > 1 && selectedFlowIds.has(node.id)) {
        if (!canWriteMap) {
          setError("You have view access only for this map.");
          return;
        }
        const selectedIds = [...selectedFlowIds];
        const flowById = new Map(flowNodes.map((n) => [n.id, n]));
        const elementUpdates: Array<{ id: string; x: number; y: number }> = [];
        const documentUpdates: Array<{ id: string; x: number; y: number }> = [];
        selectedIds.forEach((flowId) => {
          const flowNode = flowById.get(flowId);
          if (!flowNode) return;
          const snappedX = snapToMinorGrid(flowNode.position.x);
          const snappedY = snapToMinorGrid(flowNode.position.y);
          if (flowId.startsWith("process:")) {
            elementUpdates.push({ id: parseProcessFlowId(flowId), x: snappedX, y: snappedY });
          } else {
            documentUpdates.push({ id: flowId, x: snappedX, y: snappedY });
          }
        });

        if (documentUpdates.length) {
          const nextDocMap = new Map(documentUpdates.map((u) => [u.id, u]));
          setNodes((prev) =>
            prev.map((n) => {
              const next = nextDocMap.get(n.id);
              return next ? { ...n, pos_x: next.x, pos_y: next.y } : n;
            })
          );
        }
        let finalizedElementUpdates = elementUpdates;
        if (elementUpdates.length) {
          const blockedCanvasRects = flowNodes
            .filter((flow) => !selectedFlowIds.has(flow.id))
            .map((flow) => getFlowNodeRect(flow))
            .filter((rect): rect is { x: number; y: number; width: number; height: number } => Boolean(rect));
          const selectedElementIds = new Set(elementUpdates.map((u) => u.id));
          const blockedShapeRects = elements
            .filter((el) => isFlowShapeElementType(el.element_type) && !selectedElementIds.has(el.id))
            .map((el) => {
              const size = getFlowShapeDimensions(el);
              return { x: el.pos_x, y: el.pos_y, width: size.width, height: size.height, elementType: el.element_type };
            });
          finalizedElementUpdates = elementUpdates.map((u) => {
            const source = elements.find((el) => el.id === u.id);
            if (!source || !isFlowShapeElementType(source.element_type)) return u;
            const size = getFlowShapeDimensions(source);
            if (source.element_type === "shape_arrow") {
              const position = findNearestAvailableShapePosition(
                u.x,
                u.y,
                size.width,
                size.height,
                source.element_type,
                blockedCanvasRects
              );
              if (!position) {
                return { ...u, x: source.pos_x, y: source.pos_y };
              }
              blockedCanvasRects.push({ x: position.x, y: position.y, width: size.width, height: size.height });
              return { ...u, x: position.x, y: position.y };
            }
            const position = findNearestAvailableShapePosition(
              u.x,
              u.y,
              size.width,
              size.height,
              source.element_type,
              blockedShapeRects
            );
            if (!position) {
              return { ...u, x: source.pos_x, y: source.pos_y };
            }
            blockedShapeRects.push({
              x: position.x,
              y: position.y,
              width: size.width,
              height: size.height,
              elementType: source.element_type,
            });
            return { ...u, x: position.x, y: position.y };
          });
          const nextElementMap = new Map(finalizedElementUpdates.map((u) => [u.id, u]));
          setElements((prev) =>
            prev.map((el) => {
              const next = nextElementMap.get(el.id);
              return next ? { ...el, pos_x: next.x, pos_y: next.y } : el;
            })
          );
        }

        const persistCalls: Promise<{ error: { message?: string } | null }>[] = [];
        documentUpdates.forEach((u) => {
          persistCalls.push(
            (async () =>
              await supabaseBrowser
                .schema("ms")
                .from("document_nodes")
                .update({ pos_x: u.x, pos_y: u.y })
                .eq("id", u.id)
                .eq("map_id", mapId))()
          );
          savedPos.current[u.id] = { x: u.x, y: u.y };
        });
        finalizedElementUpdates.forEach((u) => {
          persistCalls.push(
            (async () =>
              await supabaseBrowser
                .schema("ms")
                .from("canvas_elements")
                .update({ pos_x: u.x, pos_y: u.y })
                .eq("id", u.id)
                .eq("map_id", mapId))()
          );
        });
        const results = await Promise.all(persistCalls);
        const failed = results.find((r) => {
          const maybe = r as { error?: { message?: string } | null };
          return !!maybe.error;
        }) as { error?: { message?: string } | null } | undefined;
        if (failed?.error?.message) setError(failed.error.message || "Unable to save group position.");
        return;
      }

      if (
        node.data.entityKind === "category" ||
        node.data.entityKind === "system_circle" ||
        node.data.entityKind === "grouping_container" ||
        node.data.entityKind === "process_component" ||
        node.data.entityKind === "person" ||
        node.data.entityKind === "sticky_note" ||
        node.data.entityKind === "image_asset" ||
        node.data.entityKind === "text_box" ||
        node.data.entityKind === "table" ||
        node.data.entityKind === "shape_rectangle" ||
        node.data.entityKind === "shape_circle" ||
        node.data.entityKind === "shape_pill" ||
        node.data.entityKind === "shape_pentagon" ||
        node.data.entityKind === "shape_chevron_left" ||
        node.data.entityKind === "shape_arrow" ||
        (typeof node.data.entityKind === "string" &&
          (node.data.entityKind.startsWith("bowtie_") || node.data.entityKind.startsWith("incident_")))
      ) {
        const elementId = parseProcessFlowId(node.id);
        const sourceElement = elements.find((el) => el.id === elementId);
        if (!sourceElement) return;
        if (!canEditElement(sourceElement)) {
          setError("You can only edit sticky notes you created.");
          return;
        }
        let finalX = snapToMinorGrid(node.position.x);
        let finalY = snapToMinorGrid(node.position.y);
        if (isFlowShapeElementType(sourceElement.element_type)) {
          const size = getFlowShapeDimensions(sourceElement);
          if (sourceElement.element_type === "shape_arrow") {
            const blockedCanvasRects = flowNodes
              .filter((flow) => flow.id !== node.id)
              .map((flow) => getFlowNodeRect(flow))
              .filter((rect): rect is { x: number; y: number; width: number; height: number } => Boolean(rect));
            const nearest = findNearestAvailableShapePosition(
              finalX,
              finalY,
              size.width,
              size.height,
              sourceElement.element_type,
              blockedCanvasRects
            );
            if (!nearest) {
              finalX = sourceElement.pos_x;
              finalY = sourceElement.pos_y;
            } else {
              finalX = nearest.x;
              finalY = nearest.y;
            }
          } else {
          const blockedShapeRects = elements
            .filter((el) => el.id !== elementId && isFlowShapeElementType(el.element_type))
            .map((el) => {
              const dims = getFlowShapeDimensions(el);
              return { x: el.pos_x, y: el.pos_y, width: dims.width, height: dims.height, elementType: el.element_type };
            });
          const nearest = findNearestAvailableShapePosition(
            finalX,
            finalY,
            size.width,
            size.height,
            sourceElement.element_type,
            blockedShapeRects
          );
          if (!nearest) {
            finalX = sourceElement.pos_x;
            finalY = sourceElement.pos_y;
          } else {
            finalX = nearest.x;
            finalY = nearest.y;
          }
          }
        }
        setElements((prev) =>
          prev.map((el) => (el.id === elementId ? { ...el, pos_x: finalX, pos_y: finalY } : el))
        );
        const { error: e } = await supabaseBrowser
          .schema("ms")
          .from("canvas_elements")
          .update({ pos_x: finalX, pos_y: finalY })
          .eq("id", elementId)
          .eq("map_id", mapId);
        if (e) {
          setError(e.message || "Unable to save element position.");
          setElements((prev) => prev.map((el) => (el.id === elementId ? sourceElement : el)));
        }
        return;
      }
      const source = nodes.find((n) => n.id === node.id);
      if (!source) return;
      if (!canWriteMap) {
        setError("You have view access only for this map.");
        return;
      }
      const x = snapToMinorGrid(node.position.x);
      const y = snapToMinorGrid(node.position.y);
      const old = savedPos.current[node.id] ?? { x: source.pos_x, y: source.pos_y };
      const freePosition = findNearestFreePosition(node.id, x, y) ?? old;
      const finalX = freePosition.x;
      const finalY = freePosition.y;
      setFlowNodes((prev) =>
        prev.map((n) => (n.id === node.id ? { ...n, position: { x: finalX, y: finalY } } : n))
      );
      setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, pos_x: finalX, pos_y: finalY } : n)));

      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("document_nodes")
        .update({ pos_x: finalX, pos_y: finalY })
        .eq("id", node.id)
        .eq("map_id", mapId);
      if (e) {
        setError(e.message || "Unable to save position. Reverting.");
        setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, pos_x: old.x, pos_y: old.y } : n)));
        return;
      }
      savedPos.current[node.id] = { x: finalX, y: finalY };
    },
    [
      selectedFlowIds,
      canWriteMap,
      setError,
      flowNodes,
      snapToMinorGrid,
      setNodes,
      setElements,
      mapId,
      savedPos,
      elements,
      canEditElement,
      nodes,
      findNearestFreePosition,
      setFlowNodes,
      findNearestAvailableShapePosition,
      getFlowShapeDimensions,
      isFlowShapeElementType,
    ]
  );

  return { onNodeDragStop };
}
