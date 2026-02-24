"use client";

import {
  Handle,
  type Node,
  type NodeProps,
  NodeResizeControl,
  Position,
} from "@xyflow/react";
import {
  defaultCategoryColor,
  disciplineOptions,
  type FlowData,
  groupingMinHeight,
  groupingMinWidth,
  minorGridSize,
  parsePersonLabels,
  personIconSize,
  processComponentBodyHeight,
  processComponentLabelHeight,
  processMinHeight,
  processMinWidth,
  stickyMinSize,
  systemCircleDiameter,
  systemCircleLabelHeight,
  unconfiguredDocumentTitle,
} from "./canvasShared";

function HiddenEdgeHandles() {
  return (
    <>
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
    </>
  );
}

function DocumentTileNode({ data }: NodeProps<Node<FlowData>>) {
  if (data.isUnconfigured) {
    return (
      <div className="relative flex h-full w-full items-center justify-center border border-slate-300 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
        <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <div className="text-center text-[12px] font-semibold text-slate-600">{unconfiguredDocumentTitle}</div>
      </div>
    );
  }
  return (
    <div className="relative flex h-full w-full flex-col border border-slate-300 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <div
        className="flex h-6 items-center justify-center px-1 text-center text-[7px] font-semibold uppercase tracking-[0.04em] leading-tight"
        style={{ backgroundColor: data.bannerBg, color: data.bannerText }}
      >
        <span className="block w-full truncate">{data.typeName}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-2 pt-1 pb-2">
        <div className={`overflow-hidden text-center font-semibold leading-tight text-slate-900 ${data.isLandscape ? "text-[9px]" : "text-[10px]"}`}>
          {data.title || "Untitled Document"}
        </div>
        {data.documentNumber ? (
          <div className={`mt-0.5 overflow-hidden text-center font-normal leading-tight text-slate-700 ${data.isLandscape ? "text-[8px]" : "text-[9px]"}`}>
            {data.documentNumber}
          </div>
        ) : null}
        <div className="mt-auto space-y-1 text-[8px] leading-tight">
          <div className="space-y-[1px] border border-slate-300 px-1 py-[2px]">
            <div className="text-center font-semibold text-slate-700">User Group</div>
            <div className={`${data.isLandscape ? "text-[7px]" : ""} truncate text-center text-slate-500`}>{data.userGroup || "Unassigned"}</div>
          </div>
          <div className="space-y-[1px] px-1 py-[2px]">
            <div className="text-center font-semibold text-slate-700">Discipline</div>
            <div className="mt-0.5 grid grid-cols-6 gap-[2px]">
              {disciplineOptions.map((option) => {
                const active = data.disciplineKeys.includes(option.key);
                return (
                  <div
                    key={option.key}
                    title={option.label}
                    className={`flex h-4 w-full items-center justify-center border border-slate-300 text-[8px] leading-none ${active ? "bg-emerald-200 font-bold text-emerald-900" : "bg-white font-medium text-slate-500"}`}
                  >
                    {option.letter}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessHeadingNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const categoryColor = data.categoryColor ?? defaultCategoryColor;
  const headingTextColor = categoryColor.toLowerCase() === defaultCategoryColor ? "#ffffff" : "#000000";
  return (
    <div
      className="flex h-full w-full flex-col border px-2 py-1 shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
      style={{ backgroundColor: categoryColor, borderColor: categoryColor, color: headingTextColor }}
    >
      {selected ? (
        <>
          <NodeResizeControl
            position={Position.Left}
            minWidth={processMinWidth}
            minHeight={processMinHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Right}
            minWidth={processMinWidth}
            minHeight={processMinHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={processMinWidth}
            minHeight={processMinHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div className="text-center text-[9px] font-semibold uppercase tracking-[0.18em]">Category</div>
      <div className="flex flex-1 items-center justify-center overflow-hidden text-center text-[12px] font-semibold leading-tight">
        <span className="line-clamp-3 break-words whitespace-normal">{data.title || "New Category"}</span>
      </div>
    </div>
  );
}

function SystemCircleNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start overflow-hidden">
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <div
        className="flex w-full items-center justify-center rounded-full bg-[#1e3a8a] px-2 text-center text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(30,58,138,0.35)]"
        style={{ height: systemCircleDiameter }}
      >
        <span className="line-clamp-3">{data.title || "System Name"}</span>
      </div>
      <div
        className="flex w-full items-center justify-center text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700"
        style={{ height: systemCircleLabelHeight }}
      >
        System
      </div>
    </div>
  );
}

function ProcessComponentNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start overflow-hidden">
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <div className="relative w-full" style={{ height: processComponentBodyHeight }}>
        <svg viewBox="0 0 700 500" preserveAspectRatio="none" className="h-full w-full drop-shadow-[0_6px_16px_rgba(15,23,42,0.18)]">
          <path
            d="M0 0H700V500C640 458 560 450 486 485C435 510 389 509 338 484C260 447 186 446 112 479C74 496 37 503 0 500V0Z"
            fill="#ff751f"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-center text-[11px] font-semibold text-white">
          {data.title || "Process"}
        </div>
      </div>
      <div
        className="flex w-full items-center justify-center text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700"
        style={{ height: processComponentLabelHeight }}
      >
        Process
      </div>
    </div>
  );
}

function GroupingContainerNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const groupingBorderThickness = 10;
  return (
    <div
      className="pointer-events-none relative h-full w-full rounded-[10px] border bg-transparent"
      style={{
        borderColor: "#000000",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.12)",
      }}
    >
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <div className="grouping-select-handle pointer-events-auto absolute inset-x-0 top-0" style={{ height: groupingBorderThickness }} />
      <div className="grouping-select-handle pointer-events-auto absolute inset-x-0 bottom-0" style={{ height: groupingBorderThickness }} />
      <div className="grouping-select-handle pointer-events-auto absolute inset-y-0 left-0" style={{ width: groupingBorderThickness }} />
      <div className="grouping-select-handle pointer-events-auto absolute inset-y-0 right-0" style={{ width: groupingBorderThickness }} />
      {selected ? (
        <>
          <NodeResizeControl
            className="grouping-select-handle pointer-events-auto"
            position={Position.Right}
            minWidth={groupingMinWidth}
            minHeight={groupingMinHeight}
            style={{
              width: 10,
              height: 10,
              borderRadius: 0,
              border: "1px solid #334155",
              background: "#ffffff",
              pointerEvents: "auto",
              cursor: "ew-resize",
              zIndex: 30,
            }}
          />
          <NodeResizeControl
            className="grouping-select-handle pointer-events-auto"
            position={Position.Bottom}
            minWidth={groupingMinWidth}
            minHeight={groupingMinHeight}
            style={{
              width: 10,
              height: 10,
              borderRadius: 0,
              border: "1px solid #334155",
              background: "#ffffff",
              pointerEvents: "auto",
              cursor: "ns-resize",
              zIndex: 30,
            }}
          />
        </>
      ) : null}
      <div
        className="grouping-drag-handle pointer-events-auto absolute left-5 top-0 -translate-y-1/2 cursor-move rounded-[999px] border bg-white px-3 py-0.5 text-center text-[11px] font-normal text-slate-800 whitespace-nowrap"
        style={{
          borderColor: "#000000",
          boxShadow: "0 3px 8px rgba(15, 23, 42, 0.12)",
        }}
      >
        {data.title || "Group label"}
      </div>
    </div>
  );
}

function StickyNoteNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const canEdit = !!data.canEdit;
  return (
    <div className="relative h-full w-full border border-[#facc15] bg-[#fef08a] p-2 text-[11px] leading-snug text-black shadow-[0_10px_24px_rgba(15,23,42,0.22)]">
      {selected && canEdit ? (
        <>
          <NodeResizeControl
            position={Position.Right}
            minWidth={stickyMinSize}
            minHeight={stickyMinSize}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #92400e", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={stickyMinSize}
            minHeight={stickyMinSize}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #92400e", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div className="flex h-full w-full flex-col">
        <div className="truncate text-[10px] font-bold text-black">{data.creatorName || "User"}</div>
        <div className="mt-1 flex-1 overflow-hidden whitespace-pre-wrap break-words text-[11px] font-normal text-black">
          {data.title || "Enter Text"}
        </div>
        <div className="mt-1 truncate text-right text-[9px] font-normal text-slate-700">{data.createdAtLabel || ""}</div>
      </div>
    </div>
  );
}

function ImageAssetNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <HiddenEdgeHandles />
      {selected ? (
        <>
          <NodeResizeControl
            position="top-left"
            minWidth={minorGridSize * 3}
            minHeight={minorGridSize * 3}
            keepAspectRatio
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position="top-right"
            minWidth={minorGridSize * 3}
            minHeight={minorGridSize * 3}
            keepAspectRatio
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position="bottom-left"
            minWidth={minorGridSize * 3}
            minHeight={minorGridSize * 3}
            keepAspectRatio
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position="bottom-right"
            minWidth={minorGridSize * 3}
            minHeight={minorGridSize * 3}
            keepAspectRatio
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div className="flex h-full w-full items-center justify-center overflow-hidden border border-slate-300 bg-transparent shadow-[0_6px_20px_rgba(15,23,42,0.12)]">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.title || "Map image"} className="h-full w-full object-contain" />
        ) : (
          <div className="px-2 text-center text-[11px] text-slate-500">{data.title || "Image"}</div>
        )}
      </div>
    </div>
  );
}

function TextBoxNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const style = data.textStyle ?? {};
  const fontSize = Number(style.fontSize ?? 14);
  const safeFontSize = Number.isFinite(fontSize) ? Math.min(168, Math.max(16, fontSize)) : 16;
  return (
    <div className="relative h-full w-full overflow-visible">
      {selected ? (
        <>
          <NodeResizeControl
            position="bottom-right"
            minWidth={minorGridSize * 5}
            minHeight={minorGridSize * 2}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position="bottom-left"
            minWidth={minorGridSize * 5}
            minHeight={minorGridSize * 2}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div
        className="h-full w-full px-2 py-1 text-[14px] leading-snug text-slate-900"
        style={{
          background: "rgba(255,255,255,0.5)",
          textAlign: style.align ?? "left",
          fontWeight: style.bold ? 700 : 400,
          fontStyle: style.italic ? "italic" : "normal",
          textDecoration: style.underline ? "underline" : "none",
          fontSize: `${safeFontSize}px`,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {data.title || "Click to edit text box"}
      </div>
    </div>
  );
}

function PersonNode({ data }: NodeProps<Node<FlowData>>) {
  if (data.orgChartPerson) {
    const isProposed = data.orgChartPerson.statusLabel === "Proposed";
    return (
      <div
        className="relative flex h-full w-full overflow-hidden border"
        style={{
          borderColor: isProposed ? "#6b7280" : "#cbd5e1",
          borderWidth: isProposed ? 2 : 1,
          borderStyle: isProposed ? "dashed" : "solid",
          backgroundColor: isProposed ? "rgba(255,255,255,0)" : "#ffffff",
          boxShadow: isProposed ? "0 12px 28px rgba(15,23,42,0.24)" : "0 8px 20px rgba(15,23,42,0.16)",
        }}
      >
        <HiddenEdgeHandles />
        <div className="flex h-full w-full">
          <div className="flex shrink-0 items-center justify-center" style={{ width: `${minorGridSize * 3.5}px`, height: `${minorGridSize * 4}px` }}>
            <div
              className="flex items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_4px_10px_rgba(15,23,42,0.12)]"
              style={{ width: `${minorGridSize * 3}px`, height: `${minorGridSize * 3}px` }}
            >
              <img src={data.orgChartPerson.avatarSrc || "/icons/account.svg"} alt="" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="relative flex min-w-0 flex-1 flex-col justify-center px-1.5 py-2">
            <div className="truncate text-[15px] font-bold leading-tight text-slate-900">{data.orgChartPerson.displayName}</div>
            <div className="mt-0.5 truncate text-[13px] font-normal leading-tight text-slate-700">{data.orgChartPerson.positionLine}</div>
            <div className="mt-2 grid min-w-0 grid-cols-3 gap-1">
              <span className="inline-flex h-6 min-w-0 items-center justify-center rounded-sm bg-black px-1.5 text-[9px] font-semibold text-white">
                <span className="truncate">{data.orgChartPerson.roleTypeLabel}</span>
              </span>
              <span
                className="inline-flex h-6 min-w-0 items-center justify-center rounded-sm border px-1.5 text-[9px] font-semibold"
                style={{ backgroundColor: "#ffffff", borderColor: "#4b5563", color: "#111827" }}
              >
                <span className="inline-flex items-center">
                  <img src="/icons/account.svg" alt="" className="h-3 w-3 object-contain" />
                  <span className="ml-1">{data.orgChartPerson.directReportCount}</span>
                </span>
              </span>
              {data.orgChartPerson.statusLabel ? (
                <span
                  className="inline-flex h-6 min-w-0 items-center justify-center rounded-sm px-1.5 text-[9px] font-semibold"
                  style={{ backgroundColor: data.orgChartPerson.statusBg || "#475569", color: data.orgChartPerson.statusText || "#ffffff" }}
                >
                  <span className="truncate">{data.orgChartPerson.statusLabel}</span>
                </span>
              ) : (
                <span className="h-6" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-start overflow-visible">
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
      <div
        className="flex items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]"
        style={{ width: personIconSize, height: personIconSize }}
      >
        <img src="/icons/account.svg" alt="" className="h-full w-full object-contain" />
      </div>
      <div
        className="mt-1 text-center text-[10px] font-semibold leading-tight text-slate-900 whitespace-normal break-words"
        style={{ width: `${minorGridSize * 7}px`, maxWidth: `${minorGridSize * 7}px` }}
      >
        {parsePersonLabels(data.title).role}
      </div>
      <div
        className="mt-0.5 text-center text-[9px] font-normal leading-tight text-slate-700 whitespace-normal break-words"
        style={{ width: `${minorGridSize * 7}px`, maxWidth: `${minorGridSize * 7}px` }}
      >
        {parsePersonLabels(data.title).department}
      </div>
    </div>
  );
}

function BowtieHazardNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-[14px] border border-slate-700 bg-[#374151] px-2 text-center text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      <HiddenEdgeHandles />
      {data.title || "Hazard"}
    </div>
  );
}

function BowtieTopEventNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center border border-red-700 bg-[#dc2626] px-2 text-center text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
      style={{ clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)" }}
    >
      <HiddenEdgeHandles />
      {data.title || "Top Event"}
    </div>
  );
}

function BowtieThreatNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-full border border-orange-600 bg-[#f97316] px-2 text-center text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      <HiddenEdgeHandles />
      {data.title || "Threat"}
    </div>
  );
}

function BowtieConsequenceNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-full border border-purple-700 bg-[#9333ea] px-2 text-center text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      <HiddenEdgeHandles />
      {data.title || "Consequence"}
    </div>
  );
}

function BowtieControlNode({ data }: NodeProps<Node<FlowData>>) {
  const controlCategory = data.typeName || "Control";
  const bannerColor =
    controlCategory.toLowerCase() === "mitigative"
      ? "#0f766e"
      : controlCategory.toLowerCase() === "escalation"
      ? "#38bdf8"
      : controlCategory.toLowerCase() === "recovery"
      ? "#16a34a"
      : "#2563eb";
  return (
    <div className="relative flex h-full w-full flex-col border border-slate-400 bg-white text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.14)]">
      <HiddenEdgeHandles />
      <div className="flex h-5 items-center justify-center text-[9px] font-semibold uppercase tracking-[0.08em] text-white" style={{ backgroundColor: bannerColor }}>
        {controlCategory}
      </div>
      {data.isCritical ? (
        <div className="absolute right-1 top-6 text-[12px] leading-none text-amber-500" title="Critical control" aria-label="Critical control">
          ★
        </div>
      ) : null}
      <div className="flex flex-1 items-center justify-center px-2 text-center text-[11px] font-semibold">
        {data.title || "Control"}
      </div>
    </div>
  );
}

function BowtieEscalationFactorNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center border border-amber-500 bg-[#facc15] px-2 text-center text-[11px] font-semibold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
      style={{ clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }}
    >
      <HiddenEdgeHandles />
      {data.title || "Escalation Factor"}
    </div>
  );
}

function BowtieRecoveryMeasureNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center border border-green-700 bg-[#22c55e] px-2 text-center text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
      style={{ transform: "skewX(-12deg)" }}
    >
      <HiddenEdgeHandles />
      <span style={{ transform: "skewX(12deg)" }}>{data.title || "Recovery Measure"}</span>
    </div>
  );
}

function BowtieDegradationIndicatorNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center border border-pink-400 bg-[#f472b6] px-2 text-center text-[11px] font-semibold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
      style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
    >
      <HiddenEdgeHandles />
      {data.title || "Degradation Indicator"}
    </div>
  );
}

function BowtieRiskRatingNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-full border border-slate-900 bg-[#111827] px-2 text-center text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      <HiddenEdgeHandles />
      {data.title || "Risk Level: Medium"}
    </div>
  );
}

function IncidentSequenceStepNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full items-center justify-center border border-sky-500 bg-[#bfdbfe] px-2 text-center text-[11px] font-semibold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      <HiddenEdgeHandles />
      {data.title || "Sequence Step"}
    </div>
  );
}

function IncidentOutcomeNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-[14px] border border-red-700 bg-[#ef4444] px-2 text-center text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      <HiddenEdgeHandles />
      {data.title || "Outcome"}
    </div>
  );
}

function IncidentTaskConditionNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full items-center justify-center border border-orange-600 bg-[#fb923c] px-2 text-center text-[11px] font-semibold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      <HiddenEdgeHandles />
      {data.title || "Task / Condition"}
    </div>
  );
}

function IncidentFactorNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center border border-amber-500 bg-[#fde047] px-2 text-center text-[11px] font-semibold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
      style={{ clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }}
    >
      <HiddenEdgeHandles />
      {data.title || "Factor"}
    </div>
  );
}

function IncidentSystemFactorNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center border border-violet-700 bg-[#a78bfa] px-2 text-center text-[11px] font-semibold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
      style={{ clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)" }}
    >
      <HiddenEdgeHandles />
      {data.title || "System Factor"}
    </div>
  );
}

function IncidentControlBarrierNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full items-center justify-center border border-emerald-700 bg-[#4ade80] px-2 text-center text-[11px] font-semibold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      <HiddenEdgeHandles />
      {data.title || "Control / Barrier"}
    </div>
  );
}

function IncidentEvidenceNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center border border-slate-500 bg-[#cbd5e1] px-2 text-center text-[11px] font-semibold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
      style={{ transform: "skewX(-12deg)" }}
    >
      <HiddenEdgeHandles />
      <span style={{ transform: "skewX(12deg)" }}>{data.title || "Evidence"}</span>
    </div>
  );
}

function IncidentFindingNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-full border border-blue-900 bg-[#1d4ed8] px-2 text-center text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      <HiddenEdgeHandles />
      {data.title || "Finding"}
    </div>
  );
}

function IncidentRecommendationNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full items-center justify-center border border-teal-700 bg-[#14b8a6] px-2 text-center text-[11px] font-semibold text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.18)]">
      <HiddenEdgeHandles />
      {data.title || "Recommendation"}
    </div>
  );
}

export const flowNodeTypes = {
  documentTile: DocumentTileNode,
  processHeading: ProcessHeadingNode,
  systemCircle: SystemCircleNode,
  processComponent: ProcessComponentNode,
  groupingContainer: GroupingContainerNode,
  stickyNote: StickyNoteNode,
  imageAsset: ImageAssetNode,
  textBox: TextBoxNode,
  personNode: PersonNode,
  bowtieHazard: BowtieHazardNode,
  bowtieTopEvent: BowtieTopEventNode,
  bowtieThreat: BowtieThreatNode,
  bowtieConsequence: BowtieConsequenceNode,
  bowtieControl: BowtieControlNode,
  bowtieEscalationFactor: BowtieEscalationFactorNode,
  bowtieRecoveryMeasure: BowtieRecoveryMeasureNode,
  bowtieDegradationIndicator: BowtieDegradationIndicatorNode,
  bowtieRiskRating: BowtieRiskRatingNode,
  incidentSequenceStep: IncidentSequenceStepNode,
  incidentOutcome: IncidentOutcomeNode,
  incidentTaskCondition: IncidentTaskConditionNode,
  incidentFactor: IncidentFactorNode,
  incidentSystemFactor: IncidentSystemFactorNode,
  incidentControlBarrier: IncidentControlBarrierNode,
  incidentEvidence: IncidentEvidenceNode,
  incidentFinding: IncidentFindingNode,
  incidentRecommendation: IncidentRecommendationNode,
} as const;
