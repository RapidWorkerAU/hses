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
  return (
    <div
      className={`relative h-full w-full rounded-[10px] border bg-transparent ${selected ? "pointer-events-auto" : "pointer-events-none"}`}
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
      {selected ? (
        <>
          <NodeResizeControl
            position={Position.Right}
            minWidth={groupingMinWidth}
            minHeight={groupingMinHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={groupingMinWidth}
            minHeight={groupingMinHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
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

function PersonNode({ data }: NodeProps<Node<FlowData>>) {
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

export const flowNodeTypes = {
  documentTile: DocumentTileNode,
  processHeading: ProcessHeadingNode,
  systemCircle: SystemCircleNode,
  processComponent: ProcessComponentNode,
  groupingContainer: GroupingContainerNode,
  stickyNote: StickyNoteNode,
  personNode: PersonNode,
} as const;

