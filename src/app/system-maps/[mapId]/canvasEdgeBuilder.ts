"use client";

import type { Edge } from "@xyflow/react";
import {
  type CanvasElementRow,
  type DocumentNodeRow,
  getDisplayRelationType,
  getRelationshipCategoryLabel,
  getRelationshipDisciplineLetters,
  groupingDefaultHeight,
  groupingDefaultWidth,
  groupingMinHeight,
  groupingMinWidth,
  hashString,
  imageDefaultWidth,
  imageMinHeight,
  imageMinWidth,
  incidentDefaultWidth,
  incidentSquareSize,
  isOrgChartPersonElement,
  isPersonElementType,
  lineIntersectsRect,
  minorGridSize,
  type NodeRelationRow,
  orgChartPersonHeight,
  orgChartPersonWidth,
  personElementHeight,
  personElementWidth,
  processComponentElementHeight,
  processComponentWidth,
  processFlowId,
  processHeadingHeight,
  processHeadingWidth,
  processMinHeight,
  processMinWidth,
  shapeArrowDefaultHeight,
  shapeArrowDefaultWidth,
  shapeArrowMinHeight,
  shapeArrowMinWidth,
  shapeCircleDefaultSize,
  shapeMinHeight,
  shapeMinWidth,
  shapePentagonDefaultHeight,
  shapePentagonDefaultWidth,
  shapePillDefaultHeight,
  shapePillDefaultWidth,
  shapeRectangleDefaultHeight,
  shapeRectangleDefaultWidth,
  type Rect,
  systemCircleDiameter,
  systemCircleElementHeight,
  textBoxDefaultHeight,
  textBoxDefaultWidth,
  textBoxMinHeight,
  textBoxMinWidth,
  tableDefaultHeight,
  tableDefaultWidth,
  tableMinHeight,
  tableMinWidth,
} from "./canvasShared";
import type { MapCategoryId } from "./mapCategories";

const isMethodologyElementType = (elementType: string) =>
  elementType.startsWith("bowtie_") || elementType.startsWith("incident_");

export const buildFlowEdgesBase = (params: {
  relations: NodeRelationRow[];
  nodes: DocumentNodeRow[];
  elements: CanvasElementRow[];
  getNodeSize: (node: DocumentNodeRow) => { width: number; height: number };
  mapCategoryId: MapCategoryId;
}) => {
  const { relations, nodes, elements, getNodeSize, mapCategoryId } = params;
  const pairTotals = new Map<string, number>();
  const pairSeen = new Map<string, number>();
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const relationshipElementsById = new Map(
    elements
      .filter((el) => el.element_type !== "sticky_note")
      .map((el) => [el.id, el])
  );
  const getElementDimensions = (el: CanvasElementRow) => {
    if (el.element_type === "system_circle") return { width: systemCircleDiameter, height: systemCircleElementHeight };
    if (el.element_type === "process_component") return { width: processComponentWidth, height: processComponentElementHeight };
    if (isPersonElementType(el.element_type)) {
      if (isOrgChartPersonElement(el)) {
        return {
          width: orgChartPersonWidth,
          height: orgChartPersonHeight,
        };
      }
      return { width: personElementWidth, height: personElementHeight };
    }
    if (el.element_type === "image_asset") return { width: Math.max(imageMinWidth, el.width || imageDefaultWidth), height: Math.max(imageMinHeight, el.height || imageDefaultWidth) };
    if (el.element_type === "text_box") return { width: Math.max(textBoxMinWidth, el.width || textBoxDefaultWidth), height: Math.max(textBoxMinHeight, el.height || textBoxDefaultHeight) };
    if (el.element_type === "table") return { width: Math.max(tableMinWidth, el.width || tableDefaultWidth), height: Math.max(tableMinHeight, el.height || tableDefaultHeight) };
    if (el.element_type === "shape_rectangle") return { width: Math.max(shapeMinWidth, el.width || shapeRectangleDefaultWidth), height: Math.max(shapeMinHeight, el.height || shapeRectangleDefaultHeight) };
    if (el.element_type === "shape_circle") return { width: Math.max(shapeMinWidth, el.width || shapeCircleDefaultSize), height: Math.max(shapeMinHeight, el.height || shapeCircleDefaultSize) };
    if (el.element_type === "shape_pill") return { width: Math.max(shapeMinWidth, el.width || shapePillDefaultWidth), height: Math.max(shapeMinHeight, el.height || shapePillDefaultHeight) };
    if (el.element_type === "shape_pentagon") return { width: Math.max(shapeMinWidth, el.width || shapePentagonDefaultWidth), height: Math.max(shapeMinHeight, el.height || shapePentagonDefaultHeight) };
    if (el.element_type === "shape_chevron_left") return { width: Math.max(shapeMinWidth, el.width || shapePentagonDefaultWidth), height: Math.max(shapeMinHeight, el.height || shapePentagonDefaultHeight) };
    if (el.element_type === "shape_arrow") return { width: Math.max(shapeArrowMinWidth, el.width || shapeArrowDefaultWidth), height: Math.max(shapeArrowMinHeight, el.height || shapeArrowDefaultHeight) };
    if (el.element_type === "grouping_container") {
      return {
        width: Math.max(groupingMinWidth, el.width || groupingDefaultWidth),
        height: Math.max(groupingMinHeight, el.height || groupingDefaultHeight),
      };
    }
    if (isMethodologyElementType(el.element_type)) {
      return {
        width: Math.max(minorGridSize * 2, el.width || incidentDefaultWidth),
        height: Math.max(minorGridSize, el.height || incidentSquareSize),
      };
    }
    return { width: Math.max(processMinWidth, el.width || processHeadingWidth), height: Math.max(processMinHeight, el.height || processHeadingHeight) };
  };
  const relationEndpointKey = (r: NodeRelationRow) => {
    if (r.source_grouping_element_id && r.target_grouping_element_id) {
      const a = processFlowId(r.source_grouping_element_id);
      const b = processFlowId(r.target_grouping_element_id);
      return a < b ? `group:${a}|${b}` : `group:${b}|${a}`;
    }
    if (r.from_node_id && r.to_node_id) {
      const a = r.from_node_id;
      const b = r.to_node_id;
      return a < b ? `doc:${a}|${b}` : `doc:${b}|${a}`;
    }
    if (r.from_node_id && r.target_system_element_id) {
      const a = r.from_node_id;
      const b = processFlowId(r.target_system_element_id);
      return a < b ? `docsys:${a}|${b}` : `docsys:${b}|${a}`;
    }
    if (r.source_system_element_id && r.to_node_id) {
      const a = processFlowId(r.source_system_element_id);
      const b = r.to_node_id;
      return a < b ? `sysdoc:${a}|${b}` : `sysdoc:${b}|${a}`;
    }
    if (r.source_system_element_id && r.target_system_element_id) {
      const a = processFlowId(r.source_system_element_id);
      const b = processFlowId(r.target_system_element_id);
      return a < b ? `syssys:${a}|${b}` : `syssys:${b}|${a}`;
    }
    return `rel:${r.id}`;
  };
  relations.forEach((r) => {
    const key = relationEndpointKey(r);
    pairTotals.set(key, (pairTotals.get(key) ?? 0) + 1);
  });
  const obstacleElementRects = elements
    .filter((el) => el.element_type !== "grouping_container" && el.element_type !== "sticky_note")
    .map((el) => {
      const dims = getElementDimensions(el);
      return { id: el.id, x: el.pos_x, y: el.pos_y, width: dims.width, height: dims.height };
    });
  const labelObstacleRects: Rect[] = [
    ...nodes.map((n) => {
      const size = getNodeSize(n);
      return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
    }),
    ...obstacleElementRects.map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
  ];
  return relations.map((r) => {
    const sourceDoc = r.from_node_id ? nodesById.get(r.from_node_id) : undefined;
    const sourceElement = r.source_system_element_id ? relationshipElementsById.get(r.source_system_element_id) : undefined;
    const targetDoc = r.to_node_id ? nodesById.get(r.to_node_id) : undefined;
    const targetElement = r.target_system_element_id ? relationshipElementsById.get(r.target_system_element_id) : undefined;
    const sourceGrouping = r.source_grouping_element_id ? relationshipElementsById.get(r.source_grouping_element_id) : undefined;
    const targetGrouping = r.target_grouping_element_id ? relationshipElementsById.get(r.target_grouping_element_id) : undefined;
    if (!sourceDoc && !sourceElement && !(sourceGrouping && targetGrouping)) return null;
    if ((sourceDoc || sourceElement) && !targetDoc && !targetElement) return null;
    const from = r.from_node_id ? nodesById.get(r.from_node_id) : undefined;
    const to = r.to_node_id ? nodesById.get(r.to_node_id) : undefined;
    let source = from ? from.id : "";
    let target = to ? to.id : "";
    let sourceHandle = "bottom";
    let targetHandle = "top";

    if (sourceGrouping && targetGrouping) {
      source = processFlowId(sourceGrouping.id);
      target = processFlowId(targetGrouping.id);
      const sourceDims = getElementDimensions(sourceGrouping);
      const targetDims = getElementDimensions(targetGrouping);
      const sourceWidth = sourceDims.width;
      const sourceHeight = sourceDims.height;
      const targetWidth = targetDims.width;
      const targetHeight = targetDims.height;
      const fromCenterX = sourceGrouping.pos_x + sourceWidth / 2;
      const fromCenterY = sourceGrouping.pos_y + sourceHeight / 2;
      const toCenterX = targetGrouping.pos_x + targetWidth / 2;
      const toCenterY = targetGrouping.pos_y + targetHeight / 2;
      const dx = toCenterX - fromCenterX;
      const dy = toCenterY - fromCenterY;
      if (Math.abs(dx) > Math.abs(dy)) {
        sourceHandle = dx > 0 ? "right" : "left";
        targetHandle = dx > 0 ? "left-target" : "right-target";
      } else {
        sourceHandle = dy > 0 ? "bottom" : "top-source";
        targetHandle = dy > 0 ? "top" : "bottom-target";
      }
    }

    if (from && to) {
      const getAnchors = (node: DocumentNodeRow) => {
        const { width, height } = getNodeSize(node);
        const left = node.pos_x;
        const top = node.pos_y;
        return {
          top: { x: left + width / 2, y: top },
          bottom: { x: left + width / 2, y: top + height },
          left: { x: left, y: top + height / 2 },
          right: { x: left + width, y: top + height / 2 },
        };
      };
      const sourceSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
        top: "top-source",
        bottom: "bottom",
        left: "left",
        right: "right",
      };
      const targetSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
        top: "top",
        bottom: "bottom-target",
        left: "left-target",
        right: "right-target",
      };
      const blockingRects = [
        ...nodes
          .filter((n) => n.id !== from.id && n.id !== to.id)
          .map((n) => {
            const size = getNodeSize(n);
            return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
          }),
        ...obstacleElementRects.map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
      ];
      const pickClosest = (srcNode: DocumentNodeRow, dstNode: DocumentNodeRow) => {
        const srcAnchors = getAnchors(srcNode);
        const dstAnchors = getAnchors(dstNode);
        const sides: Array<"top" | "bottom" | "left" | "right"> = ["top", "bottom", "left", "right"];
        let best: { sourceHandle: string; targetHandle: string; score: number; dist2: number } | null = null;
        for (const srcSide of sides) {
          for (const dstSide of sides) {
            const srcAnchor = srcAnchors[srcSide];
            const dstAnchor = dstAnchors[dstSide];
            const dx = srcAnchor.x - dstAnchor.x;
            const dy = srcAnchor.y - dstAnchor.y;
            const dist2 = dx * dx + dy * dy;
            const crossesOtherNode = blockingRects.some((rect) => lineIntersectsRect(srcAnchor, dstAnchor, rect));
            const score = dist2 + (crossesOtherNode ? 1_000_000_000 : 0);
            if (!best || score < best.score) {
              best = {
                sourceHandle: sourceSideToHandle[srcSide],
                targetHandle: targetSideToHandle[dstSide],
                score,
                dist2,
              };
            }
          }
        }
        return best!;
      };

      const forward = pickClosest(from, to);
      const reverse = pickClosest(to, from);
      if (reverse.dist2 < forward.dist2) {
        source = to.id;
        target = from.id;
        sourceHandle = reverse.sourceHandle;
        targetHandle = reverse.targetHandle;
      } else {
        source = from.id;
        target = to.id;
        sourceHandle = forward.sourceHandle;
        targetHandle = forward.targetHandle;
      }
    }
    if (from && targetElement) {
      target = processFlowId(targetElement.id);
      const fromSize = getNodeSize(from);
      const fromLeft = from.pos_x;
      const fromTop = from.pos_y;
      const toLeft = targetElement.pos_x;
      const toTop = targetElement.pos_y;
      const targetSize = getElementDimensions(targetElement);
      const fromAnchors = {
        top: { x: fromLeft + fromSize.width / 2, y: fromTop },
        bottom: { x: fromLeft + fromSize.width / 2, y: fromTop + fromSize.height },
        left: { x: fromLeft, y: fromTop + fromSize.height / 2 },
        right: { x: fromLeft + fromSize.width, y: fromTop + fromSize.height / 2 },
      };
      const toAnchors = {
        top: { x: toLeft + targetSize.width / 2, y: toTop },
        bottom: { x: toLeft + targetSize.width / 2, y: toTop + targetSize.height },
        left: { x: toLeft, y: toTop + targetSize.height / 2 },
        right: { x: toLeft + targetSize.width, y: toTop + targetSize.height / 2 },
      };
      const sourceSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
        top: "top-source",
        bottom: "bottom",
        left: "left",
        right: "right",
      };
      const targetSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
        top: "top",
        bottom: "bottom-target",
        left: "left-target",
        right: "right-target",
      };
      const blockingRects = [
        ...nodes
          .filter((n) => n.id !== from.id)
          .map((n) => {
            const size = getNodeSize(n);
            return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
          }),
        ...obstacleElementRects
          .filter((rect) => rect.id !== targetElement.id)
          .map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
      ];
      const sides: Array<"top" | "bottom" | "left" | "right"> = ["top", "bottom", "left", "right"];
      let best: { sourceHandle: string; targetHandle: string; score: number } | null = null;
      for (const srcSide of sides) {
        for (const dstSide of sides) {
          const srcAnchor = fromAnchors[srcSide];
          const dstAnchor = toAnchors[dstSide];
          const dx = srcAnchor.x - dstAnchor.x;
          const dy = srcAnchor.y - dstAnchor.y;
          const dist2 = dx * dx + dy * dy;
          const crosses = blockingRects.some((rect) => lineIntersectsRect(srcAnchor, dstAnchor, rect));
          const score = dist2 + (crosses ? 1_000_000_000 : 0);
          if (!best || score < best.score) {
            best = {
              sourceHandle: sourceSideToHandle[srcSide],
              targetHandle: targetSideToHandle[dstSide],
              score,
            };
          }
        }
      }
      if (best) {
        sourceHandle = best.sourceHandle;
        targetHandle = best.targetHandle;
      }
    }
    if (sourceElement && targetDoc) {
      source = processFlowId(sourceElement.id);
      target = targetDoc.id;
      const sourceSize = getElementDimensions(sourceElement);
      const targetSize = getNodeSize(targetDoc);
      const sourceAnchors = {
        top: { x: sourceElement.pos_x + sourceSize.width / 2, y: sourceElement.pos_y },
        bottom: { x: sourceElement.pos_x + sourceSize.width / 2, y: sourceElement.pos_y + sourceSize.height },
        left: { x: sourceElement.pos_x, y: sourceElement.pos_y + sourceSize.height / 2 },
        right: { x: sourceElement.pos_x + sourceSize.width, y: sourceElement.pos_y + sourceSize.height / 2 },
      };
      const targetAnchors = {
        top: { x: targetDoc.pos_x + targetSize.width / 2, y: targetDoc.pos_y },
        bottom: { x: targetDoc.pos_x + targetSize.width / 2, y: targetDoc.pos_y + targetSize.height },
        left: { x: targetDoc.pos_x, y: targetDoc.pos_y + targetSize.height / 2 },
        right: { x: targetDoc.pos_x + targetSize.width, y: targetDoc.pos_y + targetSize.height / 2 },
      };
      const sourceSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
        top: "top-source",
        bottom: "bottom",
        left: "left",
        right: "right",
      };
      const targetSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
        top: "top",
        bottom: "bottom-target",
        left: "left-target",
        right: "right-target",
      };
      const blockingRects = [
        ...nodes
          .filter((n) => n.id !== targetDoc.id)
          .map((n) => {
            const size = getNodeSize(n);
            return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
          }),
        ...obstacleElementRects
          .filter((rect) => rect.id !== sourceElement.id)
          .map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
      ];
      const sides: Array<"top" | "bottom" | "left" | "right"> = ["top", "bottom", "left", "right"];
      let best: { sourceHandle: string; targetHandle: string; score: number } | null = null;
      for (const srcSide of sides) {
        for (const dstSide of sides) {
          const srcAnchor = sourceAnchors[srcSide];
          const dstAnchor = targetAnchors[dstSide];
          const dx = srcAnchor.x - dstAnchor.x;
          const dy = srcAnchor.y - dstAnchor.y;
          const dist2 = dx * dx + dy * dy;
          const crosses = blockingRects.some((rect) => lineIntersectsRect(srcAnchor, dstAnchor, rect));
          const score = dist2 + (crosses ? 1_000_000_000 : 0);
          if (!best || score < best.score) {
            best = {
              sourceHandle: sourceSideToHandle[srcSide],
              targetHandle: targetSideToHandle[dstSide],
              score,
            };
          }
        }
      }
      if (best) {
        sourceHandle = best.sourceHandle;
        targetHandle = best.targetHandle;
      }
    }
    if (sourceElement && targetElement) {
      source = processFlowId(sourceElement.id);
      target = processFlowId(targetElement.id);
      const sourceSize = getElementDimensions(sourceElement);
      const targetSize = getElementDimensions(targetElement);
      const sourceRect = {
        left: sourceElement.pos_x,
        right: sourceElement.pos_x + sourceSize.width,
        top: sourceElement.pos_y,
        bottom: sourceElement.pos_y + sourceSize.height,
      };
      const targetRect = {
        left: targetElement.pos_x,
        right: targetElement.pos_x + targetSize.width,
        top: targetElement.pos_y,
        bottom: targetElement.pos_y + targetSize.height,
      };
      const sourceCenterX = sourceRect.left + sourceSize.width / 2;
      const sourceCenterY = sourceRect.top + sourceSize.height / 2;
      const targetCenterX = targetRect.left + targetSize.width / 2;
      const targetCenterY = targetRect.top + targetSize.height / 2;
      const sourceIsBowtie = isMethodologyElementType(sourceElement.element_type);
      const targetIsBowtie = isMethodologyElementType(targetElement.element_type);
      const horizontalOverlap = sourceRect.left < targetRect.right && sourceRect.right > targetRect.left;
      const verticalOverlap = sourceRect.top < targetRect.bottom && sourceRect.bottom > targetRect.top;
      const dxCenters = targetCenterX - sourceCenterX;
      const dyCenters = targetCenterY - sourceCenterY;

      if (sourceIsBowtie && targetIsBowtie) {
        const absDx = Math.abs(dxCenters);
        const absDy = Math.abs(dyCenters);
        const preferVertical = horizontalOverlap || absDy >= absDx * 0.75;
        if (preferVertical) {
          sourceHandle = dyCenters < 0 ? "top-source" : "bottom";
          targetHandle = dyCenters < 0 ? "bottom-target" : "top";
        } else {
          sourceHandle = dxCenters < 0 ? "left" : "right";
          targetHandle = dxCenters < 0 ? "right-target" : "left-target";
        }
      } else {
        const preferredPair = horizontalOverlap
          ? (sourceCenterY <= targetCenterY
              ? ({ src: "bottom", dst: "top" } as const)
              : ({ src: "top", dst: "bottom" } as const))
          : verticalOverlap
            ? (sourceCenterX <= targetCenterX
                ? ({ src: "right", dst: "left" } as const)
                : ({ src: "left", dst: "right" } as const))
            : Math.abs(dxCenters) > Math.abs(dyCenters)
              ? (sourceCenterX <= targetCenterX
                  ? ({ src: "right", dst: "left" } as const)
                  : ({ src: "left", dst: "right" } as const))
              : sourceCenterY <= targetCenterY
                ? ({ src: "bottom", dst: "top" } as const)
                : ({ src: "top", dst: "bottom" } as const);
        const sourceAnchors = {
          top: { x: sourceElement.pos_x + sourceSize.width / 2, y: sourceElement.pos_y },
          bottom: { x: sourceElement.pos_x + sourceSize.width / 2, y: sourceElement.pos_y + sourceSize.height },
          left: { x: sourceElement.pos_x, y: sourceElement.pos_y + sourceSize.height / 2 },
          right: { x: sourceElement.pos_x + sourceSize.width, y: sourceElement.pos_y + sourceSize.height / 2 },
        };
        const targetAnchors = {
          top: { x: targetElement.pos_x + targetSize.width / 2, y: targetElement.pos_y },
          bottom: { x: targetElement.pos_x + targetSize.width / 2, y: targetElement.pos_y + targetSize.height },
          left: { x: targetElement.pos_x, y: targetElement.pos_y + targetSize.height / 2 },
          right: { x: targetElement.pos_x + targetSize.width, y: targetElement.pos_y + targetSize.height / 2 },
        };
        const sourceSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
          top: "top-source",
          bottom: "bottom",
          left: "left",
          right: "right",
        };
        const targetSideToHandle: Record<"top" | "bottom" | "left" | "right", string> = {
          top: "top",
          bottom: "bottom-target",
          left: "left-target",
          right: "right-target",
        };
        const blockingRects = [
          ...nodes.map((n) => {
            const size = getNodeSize(n);
            return { x: n.pos_x, y: n.pos_y, width: size.width, height: size.height };
          }),
          ...obstacleElementRects
            .filter((rect) => rect.id !== sourceElement.id && rect.id !== targetElement.id)
            .map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
        ];
        const sides: Array<"top" | "bottom" | "left" | "right"> = ["top", "bottom", "left", "right"];
        let best: { sourceHandle: string; targetHandle: string; score: number } | null = null;
        for (const srcSide of sides) {
          for (const dstSide of sides) {
            const srcAnchor = sourceAnchors[srcSide];
            const dstAnchor = targetAnchors[dstSide];
            const dx = srcAnchor.x - dstAnchor.x;
            const dy = srcAnchor.y - dstAnchor.y;
            const dist2 = dx * dx + dy * dy;
            const crosses = blockingRects.some((rect) => lineIntersectsRect(srcAnchor, dstAnchor, rect));
            const preferredPenalty = srcSide === preferredPair.src && dstSide === preferredPair.dst ? 0 : 40_000;
            const score = dist2 + preferredPenalty + (crosses ? 1_000_000_000 : 0);
            if (!best || score < best.score) {
              best = {
                sourceHandle: sourceSideToHandle[srcSide],
                targetHandle: targetSideToHandle[dstSide],
                score,
              };
            }
          }
        }
        if (best) {
          sourceHandle = best.sourceHandle;
          targetHandle = best.targetHandle;
        }
      }
    }
    if (!source || !target) return null;

    const relationLabel = getDisplayRelationType(r.relation_type);
    const relationshipTypeLabel = getRelationshipCategoryLabel(r.relationship_category, r.relationship_custom_type);
    const disciplinesLabel = getRelationshipDisciplineLetters(r.relationship_disciplines);
    const edgeLabel = `${relationLabel} - [${relationshipTypeLabel}${disciplinesLabel ? ` - ${disciplinesLabel}` : ""}]`;
    const pairKey = relationEndpointKey(r);
    const totalForPair = pairTotals.get(pairKey) ?? 1;
    const seenForPair = pairSeen.get(pairKey) ?? 0;
    pairSeen.set(pairKey, seenForPair + 1);
    const center = (totalForPair - 1) / 2;
    const laneIndex = seenForPair - center;
    const pairLaneOffset = Math.abs(laneIndex) * 16;
    const globalLaneIndex = (hashString(`${r.id}:${pairKey}`) % 7) - 3; // -3..+3
    const globalLaneOffset = Math.abs(globalLaneIndex) * 10;
    const curveSeed = hashString(`curve:${r.id}:${pairKey}`);
    const curveMagnitude = 0.22 + (curveSeed % 5) * 0.07; // 0.22..0.50
    const curveDirection = curveSeed % 2 === 0 ? 1 : -1;
    const pairDirection = laneIndex === 0 ? 1 : laneIndex > 0 ? 1 : -1;
    const curvature = Math.max(0.12, Math.min(0.7, curveMagnitude + Math.abs(laneIndex) * 0.05)) * (curveDirection * pairDirection);

    return {
      id: r.id,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: "smartBezier",
      zIndex: 5,
      style: { stroke: "#0f766e", strokeWidth: 1.25 },
      pathOptions: { curvature },
      labelStyle: { fill: "#334155", fontSize: 11 },
      data: {
        displayLabel: edgeLabel,
        obstacleRects: labelObstacleRects,
      },
    };
  }).filter(Boolean) as Edge[];
};
