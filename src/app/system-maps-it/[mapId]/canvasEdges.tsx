"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import { pointInAnyRect, type Rect } from "./canvasShared";

type SmartBezierEdgeData = {
  displayLabel?: string;
  obstacleRects?: Rect[];
  skipObstacleLabelPlacement?: boolean;
};

function SmartBezierEdge(props: EdgeProps<Edge<SmartBezierEdgeData>>) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    labelStyle,
    data,
    pathOptions,
  } = props;
  const curvature =
    pathOptions && typeof pathOptions === "object" && "curvature" in pathOptions && typeof pathOptions.curvature === "number"
      ? pathOptions.curvature
      : 0.25;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature,
  });
  const obstacles = data?.obstacleRects ?? [];
  let finalLabelX = labelX;
  let finalLabelY = labelY;
  if (!data?.skipObstacleLabelPlacement && obstacles.length && pointInAnyRect(finalLabelX, finalLabelY, obstacles)) {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const candidateOffsets = [120, -120, 180, -180, 240, -240, 300, -300];
    for (const offset of candidateOffsets) {
      const cx = labelX + ux * offset;
      const cy = labelY + uy * offset;
      if (!pointInAnyRect(cx, cy, obstacles)) {
        finalLabelX = cx;
        finalLabelY = cy;
        break;
      }
    }
  }

  const displayLabel = data?.displayLabel ?? "";
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {displayLabel ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto absolute z-[8] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm border border-slate-200 bg-white px-1 py-0 text-[11px] shadow-sm"
            style={{ left: finalLabelX, top: finalLabelY, color: labelStyle?.fill as string | undefined, zIndex: 8 }}
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const flowEdgeTypes = {
  smartBezier: memo(SmartBezierEdge),
} as const;
