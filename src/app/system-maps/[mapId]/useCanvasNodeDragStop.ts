import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { CanvasElementRow, DocumentNodeRow, FlowData } from "./canvasShared";
import { parseProcessFlowId } from "./canvasShared";

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
        if (elementUpdates.length) {
          const nextElementMap = new Map(elementUpdates.map((u) => [u.id, u]));
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
        elementUpdates.forEach((u) => {
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
        node.data.entityKind === "sticky_note"
      ) {
        const elementId = parseProcessFlowId(node.id);
        const sourceElement = elements.find((el) => el.id === elementId);
        if (!sourceElement) return;
        if (!canEditElement(sourceElement)) {
          setError("You can only edit sticky notes you created.");
          return;
        }
        const finalX = snapToMinorGrid(node.position.x);
        const finalY = snapToMinorGrid(node.position.y);
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
    ]
  );

  return { onNodeDragStop };
}
