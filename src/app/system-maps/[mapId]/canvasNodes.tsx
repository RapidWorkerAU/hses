"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Handle,
  type Node,
  type NodeProps,
  NodeResizeControl,
  Position,
} from "@xyflow/react";
import {
  bowtieControlHeight,
  bowtieDefaultWidth,
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
  shapeMinHeight,
  shapeMinWidth,
  shapeArrowMinHeight,
  shapeArrowMinWidth,
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

function NodeInfoBadge({
  text,
  wrapperClassName,
  buttonClassName,
}: {
  text: string;
  wrapperClassName?: string;
  buttonClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const infoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as globalThis.Node | null;
      if (infoRef.current && target && infoRef.current.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  return (
    <div ref={infoRef} className={wrapperClassName || "pointer-events-auto absolute right-[-10px] top-[-10px] z-40"}>
      <button
        type="button"
        className={
          buttonClassName ||
          "flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold leading-none text-slate-700 shadow-[0_2px_6px_rgba(15,23,42,0.2)] hover:bg-slate-50"
        }
        title="Node information"
        aria-label="Node information"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
      >
        i
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-7 w-56 rounded border border-slate-300 bg-white px-2 py-1.5 text-[10px] leading-snug text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.2)]">
          {text}
        </div>
      ) : null}
    </div>
  );
}

function DocumentTileNode({ data }: NodeProps<Node<FlowData>>) {
  if (data.isUnconfigured) {
    return (
      <div className="relative flex h-full w-full items-center justify-center border border-slate-300 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
        <NodeInfoBadge text={getNodeInfoText(data)} />
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
      <NodeInfoBadge text={getNodeInfoText(data)} />
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
      className="relative flex h-full w-full flex-col border px-2 py-1 shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
      style={{ backgroundColor: categoryColor, borderColor: categoryColor, color: headingTextColor }}
    >
      <NodeInfoBadge text={getNodeInfoText(data)} />
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
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-hidden">
      <NodeInfoBadge text={getNodeInfoText(data)} />
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
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-hidden">
      <NodeInfoBadge text={getNodeInfoText(data)} />
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
      <NodeInfoBadge text={getNodeInfoText(data)} />
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

function FlowTableNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const rows = Math.max(1, Math.floor(data.tableConfig?.rows ?? 2));
  const columns = Math.max(1, Math.floor(data.tableConfig?.columns ?? 2));
  const headerBg = data.tableConfig?.headerRowBg ?? null;
  const textStyle = data.textStyle ?? {};
  const baseAlign = textStyle.align ?? "center";
  const baseFontSize = Math.max(10, Math.min(72, Number(textStyle.fontSize ?? 10) || 10));
  const baseBold = Boolean(textStyle.bold);
  const baseItalic = Boolean(textStyle.italic);
  const baseUnderline = Boolean(textStyle.underline);
  const canEdit = Boolean(data.canEdit && data.onTableCellCommit);
  const sourceCellTexts = data.tableConfig?.cellTexts ?? [];
  const sourceCellStyles = data.tableConfig?.cellStyles ?? [];
  const totalCells = rows * columns;
  const normalizedCellTexts = useMemo(
    () =>
      Array.from({ length: totalCells }, (_, index) => {
        const rowIndex = Math.floor(index / columns);
        const columnIndex = index % columns;
        return sourceCellTexts?.[rowIndex]?.[columnIndex] ?? "";
      }),
    [totalCells, columns, sourceCellTexts]
  );
  const normalizedCellStyles = useMemo(
    () =>
      Array.from({ length: totalCells }, (_, index) => {
        const rowIndex = Math.floor(index / columns);
        const columnIndex = index % columns;
        const raw = sourceCellStyles?.[rowIndex]?.[columnIndex] ?? {};
        const alignRaw = raw.align;
        const vAlignRaw = (raw as { vAlign?: string }).vAlign;
        const fontSizeRaw = Number(raw.fontSize ?? 10);
        return {
          bold: Boolean(raw.bold),
          italic: Boolean(raw.italic),
          underline: Boolean(raw.underline),
          align: alignRaw === "left" || alignRaw === "right" ? alignRaw : "center",
          vAlign: vAlignRaw === "top" || vAlignRaw === "bottom" ? vAlignRaw : "middle",
          fontSize: Number.isFinite(fontSizeRaw) ? Math.max(10, Math.min(72, Math.round(fontSizeRaw))) : 10,
        };
      }),
    [totalCells, columns, sourceCellStyles]
  );
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null);
  const [rangeAnchorCellIndex, setRangeAnchorCellIndex] = useState<number | null>(null);
  const [selectedCellIndices, setSelectedCellIndices] = useState<Set<number>>(new Set());
  const [editingCellIndex, setEditingCellIndex] = useState<number | null>(null);
  const [draftCellTexts, setDraftCellTexts] = useState<string[]>(normalizedCellTexts);
  const [draftCellStyles, setDraftCellStyles] = useState(normalizedCellStyles);
  const tableRootRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const toolbarInteractionUntilRef = useRef<number>(0);
  const showResizeHandles = Boolean(data.canEdit) && selected;
  const markToolbarInteraction = useCallback(() => {
    toolbarInteractionUntilRef.current = Date.now() + 700;
  }, []);

  useEffect(() => {
    setDraftCellTexts(normalizedCellTexts);
    setDraftCellStyles(normalizedCellStyles);
    setSelectedCellIndex((prev) => {
      if (prev == null) return null;
      return prev < totalCells ? prev : null;
    });
    setRangeAnchorCellIndex((prev) => {
      if (prev == null) return null;
      return prev < totalCells ? prev : null;
    });
    setSelectedCellIndices((prev) => {
      const next = new Set<number>();
      prev.forEach((idx) => {
        if (idx < totalCells) next.add(idx);
      });
      return next;
    });
    setEditingCellIndex((prev) => {
      if (prev == null) return null;
      return prev < totalCells ? prev : null;
    });
  }, [normalizedCellTexts, normalizedCellStyles, totalCells]);

  const buildRangeSelection = useCallback(
    (startIndex: number, endIndex: number) => {
      const startRow = Math.floor(startIndex / columns);
      const startCol = startIndex % columns;
      const endRow = Math.floor(endIndex / columns);
      const endCol = endIndex % columns;
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      const next = new Set<number>();
      for (let row = minRow; row <= maxRow; row += 1) {
        for (let col = minCol; col <= maxCol; col += 1) {
          next.add(row * columns + col);
        }
      }
      return next;
    },
    [columns]
  );

  const getEffectiveCellStyle = useCallback(
    (index: number) => {
      const cell = draftCellStyles[index] ?? {};
      const alignRaw = cell.align;
      const fontSizeRaw = Number(cell.fontSize ?? baseFontSize);
      return {
        bold: cell.bold ?? baseBold,
        italic: cell.italic ?? baseItalic,
        underline: cell.underline ?? baseUnderline,
        align: alignRaw === "left" || alignRaw === "right" ? alignRaw : baseAlign,
        vAlign: cell.vAlign === "top" || cell.vAlign === "bottom" ? cell.vAlign : "middle",
        fontSize: Number.isFinite(fontSizeRaw) ? Math.max(10, Math.min(72, Math.round(fontSizeRaw))) : baseFontSize,
      };
    },
    [draftCellStyles, baseAlign, baseBold, baseFontSize, baseItalic, baseUnderline]
  );

  const toolbarActiveCellIndex =
    selectedCellIndex != null
      ? selectedCellIndex
      : selectedCellIndices.size
      ? Array.from(selectedCellIndices.values())[0]
      : null;
  const activeCellStyle = toolbarActiveCellIndex != null ? getEffectiveCellStyle(toolbarActiveCellIndex) : null;
  const commitCellAtIndex = useCallback(
    (cellIndex: number | null) => {
      if (!canEdit || cellIndex == null) return;
      const rowIndex = Math.floor(cellIndex / columns);
      const columnIndex = cellIndex % columns;
      const cellValue = draftCellTexts[cellIndex] ?? "";
      data.onTableCellCommit?.(rowIndex, columnIndex, cellValue);
    },
    [canEdit, columns, draftCellTexts, data]
  );
  const commitAndClearSelection = useCallback(() => {
    if (selectedCellIndex != null) {
      commitCellAtIndex(selectedCellIndex);
    }
    setEditingCellIndex(null);
    setSelectedCellIndex(null);
    setRangeAnchorCellIndex(null);
    setSelectedCellIndices(new Set());
  }, [selectedCellIndex, commitCellAtIndex]);
  const applyStyleToEditingCell = useCallback(
    (nextStyle: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      align?: "left" | "center" | "right";
      vAlign?: "top" | "middle" | "bottom";
      fontSize?: number;
    }) => {
      const targets = selectedCellIndices.size ? Array.from(selectedCellIndices.values()) : selectedCellIndex != null ? [selectedCellIndex] : [];
      if (!targets.length) return;
      const normalizedByIndex = new Map<
        number,
        {
          bold: boolean;
          italic: boolean;
          underline: boolean;
          align: "left" | "center" | "right";
          vAlign: "top" | "middle" | "bottom";
          fontSize: number;
        }
      >();
      targets.forEach((targetIndex) => {
        const merged = {
          ...getEffectiveCellStyle(targetIndex),
          ...nextStyle,
        };
        const align = merged.align === "left" || merged.align === "right" ? merged.align : "center";
        const vAlign = merged.vAlign === "top" || merged.vAlign === "bottom" ? merged.vAlign : "middle";
        const fontSizeRaw = Number(merged.fontSize ?? baseFontSize);
        const fontSize = Number.isFinite(fontSizeRaw) ? Math.max(10, Math.min(72, Math.round(fontSizeRaw))) : baseFontSize;
        normalizedByIndex.set(targetIndex, {
          bold: Boolean(merged.bold),
          italic: Boolean(merged.italic),
          underline: Boolean(merged.underline),
          align: align as "left" | "center" | "right",
          vAlign: vAlign as "top" | "middle" | "bottom",
          fontSize,
        });
      });
      setDraftCellStyles((prev) => {
        const next = [...prev];
        normalizedByIndex.forEach((normalized, targetIndex) => {
          next[targetIndex] = normalized;
        });
        return next;
      });
      normalizedByIndex.forEach((normalized, targetIndex) => {
        const rowIndex = Math.floor(targetIndex / columns);
        const columnIndex = targetIndex % columns;
        data.onTableCellStyleCommit?.(rowIndex, columnIndex, normalized);
      });
    },
    [selectedCellIndex, selectedCellIndices, columns, data, getEffectiveCellStyle, baseFontSize]
  );
  useEffect(() => {
    if (selectedCellIndex == null) return;
    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (Date.now() < toolbarInteractionUntilRef.current) return;
      const activeEl = document.activeElement;
      if (activeEl && toolbarRef.current?.contains(activeEl)) return;
      const targetNode = event.target as globalThis.Node | null;
      if (!targetNode) return;
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      if (tableRootRef.current && (tableRootRef.current.contains(targetNode) || path.includes(tableRootRef.current))) return;
      if (toolbarRef.current && (toolbarRef.current.contains(targetNode) || path.includes(toolbarRef.current))) return;
      commitAndClearSelection();
    };
    document.addEventListener("pointerdown", handleDocumentPointerDown);
    return () => document.removeEventListener("pointerdown", handleDocumentPointerDown);
  }, [selectedCellIndex, commitAndClearSelection]);

  const headerTextColor = (() => {
    if (!headerBg) return "#111827";
    const match = headerBg.trim().match(/^#([0-9a-fA-F]{6})$/);
    if (!match) return "#111827";
    const hex = match[1];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const toLinear = (channel: number) => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance > 0.42 ? "#111827" : "#FFFFFF";
  })();
  const subtleTint = (() => {
    if (!headerBg) return "rgba(15, 23, 42, 0.045)";
    const match = headerBg.trim().match(/^#([0-9a-fA-F]{6})$/);
    if (!match) return "rgba(15, 23, 42, 0.045)";
    const hex = match[1];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.10)`;
  })();
  const isDarkBackground = (color: string | null | undefined) => {
    if (!color) return false;
    const hexMatch = color.trim().match(/^#([0-9a-fA-F]{6})$/);
    if (!hexMatch) return false;
    const hex = hexMatch[1];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const toLinear = (channel: number) => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance < 0.45;
  };
  const getCellBackground = (rowIndex: number) => {
    if (rowIndex === 0 && headerBg) return headerBg;
    const bodyRowIndex = headerBg ? rowIndex - 1 : rowIndex;
    const isAlternate = bodyRowIndex >= 0 && bodyRowIndex % 2 === 1;
    return isAlternate ? subtleTint : "#ffffff";
  };
  const defaultGridBorder = "rgba(148, 163, 184, 0.35)";
  const contrastGridBorder = "rgba(248, 250, 252, 0.92)";

  return (
    <div ref={tableRootRef} className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <HiddenEdgeHandles />
      {canEdit && selectedCellIndices.size > 0 && editingCellIndex == null && activeCellStyle ? (
        <div
          ref={toolbarRef}
          className="nodrag nopan absolute left-1/2 top-0 z-30 flex -translate-x-1/2 -translate-y-[calc(100%+8px)] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.18)]"
          onPointerDown={(event) => {
            markToolbarInteraction();
            event.stopPropagation();
          }}
          onMouseDown={(event) => {
            markToolbarInteraction();
            event.stopPropagation();
          }}
          onClick={(event) => {
            markToolbarInteraction();
            event.stopPropagation();
          }}
        >
          <select
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[12px] text-slate-800 outline-none"
            value={activeCellStyle.align}
            onChange={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
              applyStyleToEditingCell({ align: event.target.value as "left" | "center" | "right" });
            }}
            onPointerDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onClick={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onFocus={markToolbarInteraction}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
          <select
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[12px] text-slate-800 outline-none"
            value={activeCellStyle.vAlign}
            onChange={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
              applyStyleToEditingCell({ vAlign: event.target.value as "top" | "middle" | "bottom" });
            }}
            onPointerDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onClick={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onFocus={markToolbarInteraction}
          >
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
          <select
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[12px] text-slate-800 outline-none"
            value={String(activeCellStyle.fontSize)}
            onChange={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
              applyStyleToEditingCell({ fontSize: Number(event.target.value) });
            }}
            onPointerDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onClick={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onFocus={markToolbarInteraction}
          >
            {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 56, 72].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`h-8 min-w-8 rounded-md border px-2 text-[12px] font-bold ${
              activeCellStyle.bold ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800"
            }`}
            onClick={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
              applyStyleToEditingCell({ bold: !activeCellStyle.bold });
            }}
            onPointerDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
          >
            B
          </button>
          <button
            type="button"
            className={`h-8 min-w-8 rounded-md border px-2 text-[12px] italic ${
              activeCellStyle.italic ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800"
            }`}
            onClick={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
              applyStyleToEditingCell({ italic: !activeCellStyle.italic });
            }}
            onPointerDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
          >
            I
          </button>
          <button
            type="button"
            className={`h-8 min-w-8 rounded-md border px-2 text-[12px] underline ${
              activeCellStyle.underline ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800"
            }`}
            onClick={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
              applyStyleToEditingCell({ underline: !activeCellStyle.underline });
            }}
            onPointerDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              markToolbarInteraction();
              event.stopPropagation();
            }}
          >
            U
          </button>
        </div>
      ) : null}
      <div
        className="relative h-full w-full overflow-hidden border bg-white"
        style={{
          borderColor: "rgba(148, 163, 184, 0.55)",
          borderWidth: "0.5px",
          borderRadius: "14px",
          boxShadow: "0 14px 34px rgba(15,23,42,0.12)",
        }}
      >
      {showResizeHandles ? (
        <>
          <NodeResizeControl
            position={Position.Left}
            minWidth={minorGridSize * 5}
            minHeight={minorGridSize * 2}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Right}
            minWidth={minorGridSize * 5}
            minHeight={minorGridSize * 2}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={minorGridSize * 5}
            minHeight={minorGridSize * 2}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position="bottom-right"
            minWidth={minorGridSize * 5}
            minHeight={minorGridSize * 2}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: rows * columns }).map((_, index) => {
            const rowIndex = Math.floor(index / columns);
            const columnIndex = index % columns;
            const isHeaderCell = rowIndex === 0 && !!headerBg;
            const isEditing = editingCellIndex === index;
            const cellValue = draftCellTexts[index] ?? "";
            const cellStyle = getEffectiveCellStyle(index);
            const commit = () => {
              if (!canEdit) return;
              data.onTableCellCommit?.(rowIndex, columnIndex, cellValue);
              setEditingCellIndex(null);
            };
            return (
              <div
                key={`table-cell-${index}`}
                className={`flex items-center justify-center overflow-hidden p-1 text-[10px] font-medium ${isEditing ? "nodrag" : ""}`}
                style={{
                  backgroundColor: getCellBackground(rowIndex),
                  color: isHeaderCell ? headerTextColor : "#111827",
                  borderRight:
                    columnIndex < columns - 1
                      ? `0.5px solid ${
                          isDarkBackground(getCellBackground(rowIndex))
                            ? contrastGridBorder
                            : defaultGridBorder
                        }`
                      : "none",
                  borderBottom:
                    rowIndex < rows - 1
                      ? `0.5px solid ${
                          isDarkBackground(getCellBackground(rowIndex)) || isDarkBackground(getCellBackground(rowIndex + 1))
                            ? contrastGridBorder
                            : defaultGridBorder
                        }`
                      : "none",
                  textAlign: cellStyle.align,
                  fontSize: `${cellStyle.fontSize}px`,
                  fontWeight: cellStyle.bold ? 700 : 500,
                  fontStyle: cellStyle.italic ? "italic" : "normal",
                  textDecoration: cellStyle.underline ? "underline" : "none",
                  boxShadow: selectedCellIndices.has(index) ? "inset 0 0 0 2px #1d4ed8" : "none",
                  alignItems: cellStyle.vAlign === "top" ? "flex-start" : cellStyle.vAlign === "bottom" ? "flex-end" : "center",
                }}
                onClick={(event) => {
                  if (!selected) return;
                  const useRangeSelect = event.shiftKey && rangeAnchorCellIndex != null;
                  if (useRangeSelect) {
                    const nextRange = buildRangeSelection(rangeAnchorCellIndex, index);
                    setSelectedCellIndices(nextRange);
                    setSelectedCellIndex(index);
                    setEditingCellIndex(null);
                    return;
                  }
                  if (selectedCellIndex == null) {
                    setSelectedCellIndex(index);
                    setRangeAnchorCellIndex(index);
                    setSelectedCellIndices(new Set([index]));
                    return;
                  }
                  if (selectedCellIndex === index) return;
                  commitCellAtIndex(selectedCellIndex);
                  setEditingCellIndex(null);
                  setSelectedCellIndex(index);
                  setRangeAnchorCellIndex(index);
                  setSelectedCellIndices(new Set([index]));
                }}
                onDoubleClick={(event) => {
                  if (!canEdit) return;
                  if (!selected) return;
                  if (selectedCellIndex != null && selectedCellIndex !== index) {
                    commitCellAtIndex(selectedCellIndex);
                  }
                  setSelectedCellIndex(index);
                  setRangeAnchorCellIndex(index);
                  setSelectedCellIndices(new Set([index]));
                  setEditingCellIndex(index);
                }}
              >
                {isEditing && canEdit ? (
                  <textarea
                    autoFocus
                    className="nodrag h-full w-full resize-none bg-transparent p-0 text-[10px] font-medium leading-tight outline-none"
                    style={{
                      color: isHeaderCell ? headerTextColor : "#111827",
                      textAlign: cellStyle.align,
                      fontSize: `${cellStyle.fontSize}px`,
                      fontWeight: cellStyle.bold ? 700 : 500,
                      fontStyle: cellStyle.italic ? "italic" : "normal",
                      textDecoration: cellStyle.underline ? "underline" : "none",
                    }}
                    value={cellValue}
                    onChange={(event) =>
                      setDraftCellTexts((prev) => {
                        const next = [...prev];
                        next[index] = event.target.value;
                        return next;
                      })
                    }
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    onBlur={(event) => {
                      event.stopPropagation();
                      commitCellAtIndex(index);
                      setEditingCellIndex(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        commitCellAtIndex(index);
                        setEditingCellIndex(null);
                      }
                    }}
                  />
                ) : (
                  <div
                    className="w-full min-w-0 overflow-hidden leading-tight"
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 6,
                      maxHeight: "100%",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {cellValue}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StickyNoteNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const canEdit = !!data.canEdit;
  return (
    <div className="relative h-full w-full border border-[#facc15] bg-[#fef08a] p-2 text-[11px] leading-snug text-black shadow-[0_10px_24px_rgba(15,23,42,0.22)]">
      <NodeInfoBadge text={getNodeInfoText(data)} />
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
      <NodeInfoBadge text={getNodeInfoText(data)} />
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
      <NodeInfoBadge text={getNodeInfoText(data)} />
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

function FlowShapeNode({
  data,
  selected,
  kind,
}: NodeProps<Node<FlowData>> & { kind: "rectangle" | "circle" | "pill" | "pentagon" | "chevronLeft" | "arrow" }) {
  const style = data.textStyle ?? {};
  const fontSize = Number(style.fontSize ?? 24);
  const safeFontSize = Number.isFinite(fontSize) ? Math.min(168, Math.max(12, fontSize)) : 24;
  const fill = data.categoryColor || "#249BC7";
  const shapeStyle = data.shapeStyle ?? {};
  const fillMode = shapeStyle.fillMode === "outline" ? "outline" : "fill";
  const direction = shapeStyle.direction === "left" ? "left" : "right";
  const rotationDeg = shapeStyle.rotationDeg === 90 || shapeStyle.rotationDeg === 180 || shapeStyle.rotationDeg === 270 ? shapeStyle.rotationDeg : 0;
  const textColor = (() => {
    if (fillMode === "outline") return "#111827";
    const match = fill.trim().match(/^#([0-9a-fA-F]{6})$/);
    if (!match) return "#FFFFFF";
    const hex = match[1];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const toLinear = (channel: number) => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance > 0.42 ? "#111827" : "#FFFFFF";
  })();
  const align = style.align ?? "center";
  const bold = Boolean(style.bold);
  const italic = Boolean(style.italic);
  const underline = Boolean(style.underline);
  const wrapperClass =
    kind === "circle"
      ? "rounded-full"
      : kind === "pill"
      ? "rounded-[999px]"
      : "rounded-none";
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <HiddenEdgeHandles />
      {selected && data.canResize !== false ? (
        <NodeResizeControl
          position="bottom-right"
          minWidth={kind === "arrow" ? shapeArrowMinWidth : shapeMinWidth}
          minHeight={kind === "arrow" ? shapeArrowMinHeight : shapeMinHeight}
          keepAspectRatio={kind === "circle"}
          style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
        />
      ) : null}
      {kind === "pentagon" ? (
        <div
          className={`relative flex h-full w-full items-center px-3 py-2 ${
            direction === "left" ? "pl-[16%]" : "pr-[16%]"
          }`}
          style={{
            color: textColor,
            textAlign: align,
            fontSize: `${safeFontSize}px`,
            fontWeight: bold ? 700 : 400,
            fontStyle: italic ? "italic" : "normal",
            textDecoration: underline ? "underline" : "none",
          }}
        >
          <svg
            viewBox="-2 -2 104 104"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            style={{ filter: "drop-shadow(0 6px 18px rgba(15,23,42,0.16))" }}
          >
            <polygon
              points={direction === "left" ? "16,0 100,0 100,100 16,100 0,50" : "0,0 84,0 100,50 84,100 0,100"}
              fill={fillMode === "outline" ? "#ffffff" : fill}
              stroke={fillMode === "outline" ? fill : "transparent"}
              strokeWidth={fillMode === "outline" ? 3 : 0}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              shapeRendering="geometricPrecision"
            />
          </svg>
          <span className="relative z-[1] w-full whitespace-pre-wrap break-words">{data.title || "Shape text"}</span>
        </div>
      ) : kind === "chevronLeft" ? (
        <div
          className={`relative flex h-full w-full items-center px-3 py-2 ${
            direction === "left" ? "pl-[16%] pr-[20%]" : "pl-[20%] pr-[16%]"
          }`}
          style={{
            color: textColor,
            textAlign: align,
            fontSize: `${safeFontSize}px`,
            fontWeight: bold ? 700 : 400,
            fontStyle: italic ? "italic" : "normal",
            textDecoration: underline ? "underline" : "none",
          }}
        >
          <svg
            viewBox="-2 -2 104 104"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            style={{ filter: "drop-shadow(0 6px 18px rgba(15,23,42,0.16))" }}
          >
            <polygon
              points={direction === "left" ? "22,0 100,0 80,50 100,100 22,100 0,50" : "0,0 78,0 100,50 78,100 0,100 20,50"}
              fill={fillMode === "outline" ? "#ffffff" : fill}
              stroke={fillMode === "outline" ? fill : "transparent"}
              strokeWidth={fillMode === "outline" ? 3 : 0}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              shapeRendering="geometricPrecision"
            />
          </svg>
          <span className="relative z-[1] w-full whitespace-pre-wrap break-words">{data.title || "Shape text"}</span>
        </div>
      ) : kind === "arrow" ? (
        <div className="relative h-full w-full">
          <svg
            viewBox="-2 -2 104 104"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            style={{ filter: "drop-shadow(0 6px 18px rgba(15,23,42,0.16))" }}
          >
            <polygon
              points={
                rotationDeg === 90
                  ? "25,0 25,68 0,68 50,100 100,68 75,68 75,0"
                  : rotationDeg === 180
                  ? "100,25 32,25 32,0 0,50 32,100 32,75 100,75"
                  : rotationDeg === 270
                  ? "25,100 25,32 0,32 50,0 100,32 75,32 75,100"
                  : "0,25 68,25 68,0 100,50 68,100 68,75 0,75"
              }
              fill={fillMode === "outline" ? "#ffffff" : fill}
              stroke={fillMode === "outline" ? fill : "transparent"}
              strokeWidth={fillMode === "outline" ? 3 : 0}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              shapeRendering="geometricPrecision"
            />
          </svg>
        </div>
      ) : (
        <div
          className={`flex h-full w-full items-center px-3 py-2 shadow-[0_6px_18px_rgba(15,23,42,0.16)] ${wrapperClass}`}
          style={{
            backgroundColor: fillMode === "outline" ? "#ffffff" : fill,
            border: `3px solid ${fill}`,
            color: textColor,
            textAlign: align,
            fontSize: `${safeFontSize}px`,
            fontWeight: bold ? 700 : 400,
            fontStyle: italic ? "italic" : "normal",
            textDecoration: underline ? "underline" : "none",
          }}
        >
          <span className="w-full whitespace-pre-wrap break-words">{data.title || "Shape text"}</span>
        </div>
      )}
    </div>
  );
}

function FlowShapeRectangleNode(props: NodeProps<Node<FlowData>>) {
  return <FlowShapeNode {...props} kind="rectangle" />;
}

function FlowShapeCircleNode(props: NodeProps<Node<FlowData>>) {
  return <FlowShapeNode {...props} kind="circle" />;
}

function FlowShapePillNode(props: NodeProps<Node<FlowData>>) {
  return <FlowShapeNode {...props} kind="pill" />;
}

function FlowShapePentagonNode(props: NodeProps<Node<FlowData>>) {
  return <FlowShapeNode {...props} kind="pentagon" />;
}

function FlowShapeChevronLeftNode(props: NodeProps<Node<FlowData>>) {
  return <FlowShapeNode {...props} kind="chevronLeft" />;
}

function FlowShapeArrowNode(props: NodeProps<Node<FlowData>>) {
  return <FlowShapeNode {...props} kind="arrow" />;
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
        <NodeInfoBadge text={getNodeInfoText(data)} />
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
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
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

function BowtieCard({
  title,
  subtitle,
  accent,
  background,
  border,
  textColor = "#0f172a",
  label,
  labelBackground,
  labelTextColor = "#ffffff",
  stripeHeader = false,
  icon,
}: {
  title: string;
  subtitle?: string;
  accent: string;
  background: string;
  border: string;
  textColor?: string;
  label?: string;
  labelBackground?: string;
  labelTextColor?: string;
  stripeHeader?: boolean;
  icon?: string;
}) {
  return (
    <div
      className="relative flex h-full w-full overflow-hidden rounded-[18px] border shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
      style={{ backgroundColor: background, borderColor: border }}
    >
      <HiddenEdgeHandles />
      <div className="w-2 shrink-0" style={{ backgroundColor: accent }} />
      <div className="flex min-w-0 flex-1 flex-col">
        {stripeHeader ? (
          <div
            className="h-4 w-full border-b border-slate-700"
            style={{ backgroundImage: "repeating-linear-gradient(-45deg, #111827 0 10px, #facc15 10px 20px)" }}
          />
        ) : label ? (
          <div
            className="flex min-h-0 items-center justify-between gap-2 border-b px-3 py-1.5"
            style={{
              backgroundColor: labelBackground ?? accent,
              borderColor: "rgba(15,23,42,0.08)",
              color: labelTextColor,
            }}
          >
            <span className="truncate text-[8px] font-bold uppercase tracking-[0.16em]">{label}</span>
            {icon ? <span className="text-[11px] leading-none">{icon}</span> : null}
          </div>
        ) : null}
        <div className="flex flex-1 items-center justify-center px-3 py-2 text-center" style={{ color: textColor }}>
          <div className="flex max-w-full flex-col items-center gap-1">
            <span className="line-clamp-4 whitespace-normal break-words text-[11px] font-semibold leading-tight">{title}</span>
            {subtitle ? (
              <span className="line-clamp-2 whitespace-normal break-words text-[10px] font-medium leading-tight text-slate-600">{subtitle}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function getBowtieRiskPalette(title: string) {
  const normalized = title.trim().toLowerCase();
  if (normalized.includes("extreme")) return { accent: "#7f1d1d", background: "#fee2e2", border: "#dc2626", text: "#7f1d1d" };
  if (normalized.includes("high")) return { accent: "#991b1b", background: "#fee2e2", border: "#ef4444", text: "#7f1d1d" };
  if (normalized.includes("medium")) return { accent: "#b45309", background: "#fef3c7", border: "#f59e0b", text: "#92400e" };
  if (normalized.includes("low")) return { accent: "#166534", background: "#dcfce7", border: "#4ade80", text: "#166534" };
  return { accent: "#334155", background: "#e2e8f0", border: "#94a3b8", text: "#0f172a" };
}

function BowtieHazardNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <BowtieCard
        title={data.title || "Hazard"}
        subtitle={data.description || undefined}
        accent="#facc15"
        background="#f8fafc"
        border="#334155"
        stripeHeader
      />
    </div>
  );
}

function BowtieTopEventNode({ data }: NodeProps<Node<FlowData>>) {
  const lossOfControlType = (data.description || "").trim();
  return (
    <div className="relative h-full w-full overflow-visible">
      <BowtieCard
        title={data.title || "Top Event"}
        accent="#22c55e"
        background="#ecfdf5"
        border="#16a34a"
        label="Top Event"
        labelBackground="#16a34a"
      />
      <NodeInfoBadge text={getNodeInfoText(data)} />
      {lossOfControlType ? (
        <div className="pointer-events-none absolute left-0 top-full z-10 mt-1.5 w-full rounded border border-[#16a34a] bg-white px-2 py-1 text-center text-[10px] font-semibold leading-tight text-[#166534] shadow-[0_2px_6px_rgba(15,23,42,0.18)]">
          {lossOfControlType}
        </div>
      ) : null}
    </div>
  );
}

function BowtieThreatNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <BowtieCard
        title={data.title || "Threat"}
        subtitle={data.description || undefined}
        accent="#f97316"
        background="#fff7ed"
        border="#fb923c"
        label="Threat"
        labelBackground="#f97316"
      />
    </div>
  );
}

function BowtieConsequenceNode({ data }: NodeProps<Node<FlowData>>) {
  const impactCategory = (data.metaSubLabel || "").trim();
  return (
    <div className="relative h-full w-full overflow-visible">
      <BowtieCard
        title={data.title || "Consequence"}
        accent="#ef4444"
        background="#fef2f2"
        border="#f87171"
        label="Consequence"
        labelBackground="#ef4444"
      />
      <NodeInfoBadge text={getNodeInfoText(data)} />
      {impactCategory ? (
        <div className="pointer-events-none absolute left-0 top-full z-10 mt-1.5 w-full rounded border border-[#ef4444] bg-white px-2 py-1 text-center text-[10px] font-semibold leading-tight text-[#991b1b] shadow-[0_2px_6px_rgba(15,23,42,0.18)]">
          {impactCategory}
        </div>
      ) : null}
    </div>
  );
}

function getControlTypeInfo(controlTypeKeyRaw: string) {
  const key = controlTypeKeyRaw.trim().toLowerCase();
  const infoByType: Record<string, string> = {
    elimination: "Removes the hazard completely so the risk source is no longer present.",
    substitution: "Replaces the hazard with a safer material, process, or approach.",
    isolation: "Separates people from the hazard using distance, barriers, or segregation.",
    engineering: "Uses physical design or equipment changes to reduce exposure to the hazard.",
    administrative: "Uses rules, permits, supervision, and scheduling to reduce risk exposure.",
    procedural: "Defines step-by-step methods so work is performed consistently and safely.",
    behavioural: "Builds safe actions and decision-making through habits, coaching, and culture.",
    detection: "Identifies developing hazards early so intervention can occur before escalation.",
    ppe: "Protects individuals with personal protective equipment as the last line of defence.",
  };
  if (!key) return "Select a control type to view guidance on what this control does.";
  return infoByType[key] || "This control type helps manage risk by reducing likelihood and/or consequence.";
}

function getNodeInfoText(data: FlowData): string {
  switch (data.entityKind) {
    case "document": return "Represents a document, including key metadata, ownership, and discipline relevance.";
    case "category": return "Category heading used to group related map content.";
    case "system_circle": return "Represents a system or platform in the workflow.";
    case "process_component": return "Represents a process step or activity.";
    case "grouping_container": return "Visual container used to group nodes by scope or context.";
    case "sticky_note": return "Annotation note for quick context, comments, or reminders.";
    case "person": return "Represents a role or person connected to the process.";
    case "image_asset": return "Image node for visual reference material.";
    case "text_box": return "Free-form text node for additional narrative or instruction.";
    case "table": return "Structured table node for row/column based information.";
    case "shape_rectangle":
    case "shape_circle":
    case "shape_pill":
    case "shape_pentagon":
    case "shape_chevron_left":
    case "shape_arrow": return "General-purpose shape node for emphasis, direction, or visual structure.";
    case "bowtie_hazard": return "Hazard source node defining what can cause harm.";
    case "bowtie_top_event": return "Top event node defining loss of control.";
    case "bowtie_threat": return "Threat node showing causes that can trigger the top event.";
    case "bowtie_consequence": return "Consequence node showing potential outcomes if the top event occurs.";
    case "bowtie_control": return `Control barrier node. ${getControlTypeInfo(String(data.metaSubLabel || ""))}`;
    case "bowtie_escalation_factor": return "Escalation factor node showing conditions that weaken a control.";
    case "bowtie_recovery_measure": return "Recovery measure node showing actions after loss of control.";
    case "bowtie_degradation_indicator": return "Degradation indicator node showing signs of reducing control performance.";
    case "bowtie_risk_rating": return "Risk rating node showing level based on likelihood and consequence.";
    case "incident_sequence_step": return "Incident timeline step node.";
    case "incident_outcome": return "Incident outcome node showing resulting impact.";
    case "incident_task_condition": return "Task/condition node showing work state and context.";
    case "incident_factor": return "Incident factor node showing contributors to the event.";
    case "incident_system_factor": return "System factor node showing organisational contributors.";
    case "incident_control_barrier": return "Control/barrier node showing safeguards and their effectiveness.";
    case "incident_evidence": return "Evidence node supporting findings.";
    case "incident_finding": return "Finding node capturing key analysis conclusions.";
    case "incident_recommendation": return "Recommendation node for corrective or preventive actions.";
    default: return "Map node providing contextual information in this system map.";
  }
}

function BowtieControlNode({ data }: NodeProps<Node<FlowData>>) {
  const controlCategory = data.typeName || "Control";
  const bannerColor = data.bannerBg || "#2563eb";

  return (
    <div className="relative h-full w-full overflow-visible">
      {data.isCritical ? (
        <div
          className="pointer-events-none absolute bottom-0 left-[-24px] top-0 w-5 rounded-l-md bg-black shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
          aria-label="Critical control"
          title="Critical control"
        >
          <span className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rotate-[-90deg] whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.06em] text-white">
            Critical
          </span>
        </div>
      ) : null}
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <BowtieCard
        title={data.title || "Control"}
        accent={bannerColor}
        background="#ffffff"
        border="#cbd5e1"
        label={controlCategory}
        labelBackground={bannerColor}
      />
    </div>
  );
  /*
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
  */
}

function BowtieEscalationFactorNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <BowtieCard
        title={data.title || "Escalation Factor"}
        subtitle={data.description || undefined}
        accent="#f59e0b"
        background="#fffbeb"
        border="#fcd34d"
        label="Escalation"
        labelBackground="#f59e0b"
        labelTextColor="#111827"
      />
    </div>
  );
}

function BowtieRecoveryMeasureNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <BowtieCard
        title={data.title || "Recovery Measure"}
        accent="#0f766e"
        background="#f0fdfa"
        border="#5eead4"
        label="Recovery"
        labelBackground="#0f766e"
      />
    </div>
  );
}

function BowtieDegradationIndicatorNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <BowtieCard
        title={data.title || "Degradation Indicator"}
        accent="#06b6d4"
        background="#ecfeff"
        border="#67e8f9"
        label="Degradation Indicator"
        labelBackground="#0891b2"
      />
    </div>
  );
}

function BowtieRiskRatingNode({ data }: NodeProps<Node<FlowData>>) {
  const riskLabel = data.title || "Medium";
  const palette = getBowtieRiskPalette(riskLabel);
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <BowtieCard
        title={riskLabel}
        accent={palette.accent}
        background={palette.background}
        border={palette.border}
        textColor={palette.text}
        label={riskLabel}
        labelBackground={palette.accent}
      />
    </div>
  );
}

function IncidentCard({
  data,
  selected,
  fallbackTitle,
  fallbackType,
}: {
  data: FlowData;
  selected: boolean;
  fallbackTitle: string;
  fallbackType: string;
}) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <HiddenEdgeHandles />
      {selected ? (
        <>
          <NodeResizeControl
            position={Position.Right}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div className="flex h-full w-full flex-col overflow-hidden border border-slate-300 bg-white text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.16)]">
        <div
          className="flex h-5 items-center justify-center px-2 text-[9px] font-semibold uppercase tracking-[0.08em]"
          style={{ backgroundColor: data.bannerBg || "#64748b", color: data.bannerText || "#ffffff" }}
        >
          {data.typeName || fallbackType}
        </div>
        <div className="flex flex-1 flex-col px-3 py-2 text-center text-slate-900">
          {data.metaSubLabel ? (
            <div className="w-full text-center text-[10px] font-medium leading-tight text-slate-600">
              {data.metaSubLabel}
            </div>
          ) : null}
          <div className="flex flex-1 items-center justify-center text-[11px] font-semibold leading-tight">
            {data.description || data.title || fallbackTitle}
          </div>
        </div>
      </div>
      {data.metaLabel ? (
        <div
          className="pointer-events-none absolute left-0 right-0 top-full mt-1 border px-2 py-1 text-center text-[9px] font-semibold leading-tight"
          style={{
            backgroundColor: data.metaLabelBg || "#000000",
            color: data.metaLabelText || "#ffffff",
            borderColor: data.metaLabelBorder || "#000000",
          }}
        >
          <span>{data.metaLabel}</span>
          {data.metaLabelSecondary ? <span className="ml-1 font-normal">{data.metaLabelSecondary}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function IncidentSequenceStepNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const locationLabel = (data.metaSubLabel || "").trim();
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <HiddenEdgeHandles />
      {selected ? (
        <>
          <NodeResizeControl
            position={Position.Right}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div className="flex h-full w-full flex-col overflow-hidden border border-slate-300 bg-white text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.16)]">
        <div
          className="flex h-5 items-center justify-center px-2 text-[9px] font-semibold uppercase tracking-[0.08em]"
          style={{ backgroundColor: data.bannerBg || "#64748b", color: data.bannerText || "#ffffff" }}
        >
          {data.typeName || "Sequence Step"}
        </div>
        <div className="flex flex-1 flex-col px-3 py-2 text-center text-slate-900">
          <div className="flex flex-1 items-center justify-center text-[11px] font-semibold leading-tight">
            {data.description || data.title || "Sequence Step"}
          </div>
          {locationLabel ? (
            <div className="mt-1 w-full text-center text-[10px] font-normal leading-tight text-slate-600">
              ({locationLabel})
            </div>
          ) : null}
        </div>
      </div>
      {data.metaLabel ? (
        <div
          className="pointer-events-none absolute left-0 right-0 top-full mt-1 border px-2 py-1 text-center text-[9px] font-semibold leading-tight"
          style={{
            backgroundColor: data.metaLabelBg || "#000000",
            color: data.metaLabelText || "#ffffff",
            borderColor: data.metaLabelBorder || "#000000",
          }}
        >
          <span>{data.metaLabel}</span>
          {data.metaLabelSecondary ? <span className="ml-1 font-normal">{data.metaLabelSecondary}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function IncidentOutcomeNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <IncidentCard data={data} selected={selected} fallbackTitle="Outcome" fallbackType="Outcome" />;
}

function IncidentTaskConditionNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <IncidentCard data={data} selected={selected} fallbackTitle="Task / Condition" fallbackType="Task / Condition" />;
}

function IncidentFactorNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const classification = (data.metaLabelSecondary || "").trim().toLowerCase();
  const classificationBorder =
    classification === "essential"
      ? "#dc2626"
      : classification === "contributing"
      ? "#f59e0b"
      : classification === "predisposing"
      ? "#7c3aed"
      : "#64748b";
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <HiddenEdgeHandles />
      {selected ? (
        <>
          <NodeResizeControl
            position={Position.Right}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div className="flex h-full w-full flex-col overflow-hidden border border-slate-300 bg-white text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.16)]">
        <div
          className="flex h-5 items-center justify-center px-2 text-[9px] font-semibold uppercase tracking-[0.08em]"
          style={{ backgroundColor: data.bannerBg || "#64748b", color: data.bannerText || "#ffffff" }}
        >
          {data.typeName || "Factor"}
        </div>
        <div className="flex flex-1 flex-col px-3 py-2 text-center text-slate-900">
          <div className="flex flex-1 items-center justify-center text-[11px] font-semibold leading-tight">
            {data.description || data.title || "Factor"}
          </div>
          {data.metaSubLabel ? (
            <div className="mt-1 w-full text-center text-[10px] font-normal leading-tight text-slate-600">
              {data.metaSubLabel}
            </div>
          ) : null}
        </div>
      </div>
      {data.metaLabel ? (
        <div className="pointer-events-none absolute left-0 right-0 top-full mt-1 flex flex-col gap-1">
          <div
            className="border px-2 py-1 text-center text-[9px] font-semibold leading-tight"
            style={{
              backgroundColor: data.metaLabelBg || "#16a34a",
              color: data.metaLabelText || "#ffffff",
              borderColor: data.metaLabelBg || "#16a34a",
            }}
          >
            {data.metaLabel}
          </div>
          {data.metaLabelSecondary ? (
            <div
              className="border bg-white px-2 py-1 text-center text-[9px] font-semibold leading-tight text-slate-800"
              style={{ borderColor: classificationBorder }}
            >
              {data.metaLabelSecondary}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function IncidentSystemFactorNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const classification = (data.metaLabelSecondary || "").trim().toLowerCase();
  const classificationBorder =
    classification === "essential"
      ? "#dc2626"
      : classification === "contributing"
      ? "#f59e0b"
      : classification === "predisposing"
      ? "#7c3aed"
      : "#64748b";
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <HiddenEdgeHandles />
      {selected ? (
        <>
          <NodeResizeControl
            position={Position.Right}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div className="flex h-full w-full flex-col overflow-hidden border border-slate-300 bg-white text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.16)]">
        <div
          className="flex h-5 items-center justify-center px-2 text-[9px] font-semibold uppercase tracking-[0.08em]"
          style={{ backgroundColor: data.bannerBg || "#64748b", color: data.bannerText || "#ffffff" }}
        >
          {data.typeName || "System Factor"}
        </div>
        <div className="flex flex-1 flex-col px-3 py-2 text-center text-slate-900">
          <div className="flex flex-1 items-center justify-center text-[11px] font-semibold leading-tight">
            {data.description || data.title || "System Factor"}
          </div>
          {data.metaSubLabel ? (
            <div className="mt-1 w-full text-center text-[10px] font-normal leading-tight text-slate-600">
              {data.metaSubLabel}
            </div>
          ) : null}
        </div>
      </div>
      {data.metaLabel ? (
        <div className="pointer-events-none absolute left-0 right-0 top-full mt-1 flex flex-col gap-1">
          <div
            className="border px-2 py-1 text-center text-[9px] font-semibold leading-tight"
            style={{
              backgroundColor: data.metaLabelBg || "#16a34a",
              color: data.metaLabelText || "#ffffff",
              borderColor: data.metaLabelBg || "#16a34a",
            }}
          >
            {data.metaLabel}
          </div>
          {data.metaLabelSecondary ? (
            <div
              className="border bg-white px-2 py-1 text-center text-[9px] font-semibold leading-tight text-slate-800"
              style={{ borderColor: classificationBorder }}
            >
              {data.metaLabelSecondary}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function IncidentControlBarrierNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <HiddenEdgeHandles />
      {selected ? (
        <>
          <NodeResizeControl
            position={Position.Right}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div className="flex h-full w-full flex-col overflow-hidden border border-slate-300 bg-white text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.16)]">
        <div
          className="flex h-5 items-center justify-center px-2 text-[9px] font-semibold uppercase tracking-[0.08em]"
          style={{ backgroundColor: data.bannerBg || "#64748b", color: data.bannerText || "#ffffff" }}
        >
          {data.typeName || "Control / Barrier"}
        </div>
        <div className="flex flex-1 flex-col px-3 py-2 text-center text-slate-900">
          <div className="flex flex-1 items-center justify-center text-[11px] font-semibold leading-tight">
            {data.description || data.title || "Control / Barrier"}
          </div>
          {data.metaSubLabel ? (
            <div className="mt-1 w-full text-center text-[10px] font-normal leading-tight text-slate-600">
              {data.metaSubLabel}
            </div>
          ) : null}
        </div>
      </div>
      {data.metaLabel ? (
        <div
          className="pointer-events-none absolute left-0 right-0 top-full mt-1 border px-2 py-1 text-center text-[9px] font-semibold leading-tight"
          style={{
            backgroundColor: data.metaLabelBg || "#000000",
            color: data.metaLabelText || "#ffffff",
            borderColor: data.metaLabelBorder || "#000000",
          }}
        >
          <span>{data.metaLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

function IncidentEvidenceNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const hasPreview = Boolean(data.evidenceShowPreview && data.evidenceMediaUrl);
  const isPdf = (data.evidenceMediaMime || "").toLowerCase().includes("pdf");
  const previewName = data.evidenceMediaName || (isPdf ? "PDF Document" : "Evidence File");
  const rotationDeg = data.evidenceMediaRotationDeg ?? 0;
  const [imageAspectRatio, setImageAspectRatio] = useState(3 / 4);
  const [imagePreviewErrored, setImagePreviewErrored] = useState(false);
  const [renderImageUrl, setRenderImageUrl] = useState<string | null>(null);
  useEffect(() => {
    setImagePreviewErrored(false);
    setImageAspectRatio(3 / 4);
  }, [data.evidenceMediaUrl]);
  useEffect(() => {
    let cancelled = false;
    if (!data.evidenceMediaUrl || isPdf) {
      setRenderImageUrl(data.evidenceMediaUrl || null);
      return;
    }
      if (rotationDeg === 0) {
        setRenderImageUrl(data.evidenceMediaUrl ?? null);
        return;
      }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (cancelled) return;
      try {
        const iw = image.naturalWidth || image.width;
        const ih = image.naturalHeight || image.height;
        if (!iw || !ih) {
          setRenderImageUrl(data.evidenceMediaUrl ?? null);
          return;
        }
        const canvas = document.createElement("canvas");
        if (rotationDeg === 90 || rotationDeg === 270) {
          canvas.width = ih;
          canvas.height = iw;
        } else {
          canvas.width = iw;
          canvas.height = ih;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setRenderImageUrl(data.evidenceMediaUrl ?? null);
          return;
        }
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotationDeg * Math.PI) / 180);
        ctx.drawImage(image, -iw / 2, -ih / 2);
        setRenderImageUrl(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        setRenderImageUrl(data.evidenceMediaUrl ?? null);
      }
    };
    image.onerror = () => {
      if (cancelled) return;
      setRenderImageUrl(data.evidenceMediaUrl ?? null);
    };
    image.src = data.evidenceMediaUrl;
    return () => {
      cancelled = true;
    };
  }, [data.evidenceMediaUrl, isPdf, rotationDeg]);
  return (
    <div className="relative h-full w-full overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <HiddenEdgeHandles />
      {selected ? (
        <>
          <NodeResizeControl
            position={Position.Right}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
          <NodeResizeControl
            position={Position.Bottom}
            minWidth={bowtieDefaultWidth}
            minHeight={bowtieControlHeight}
            style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
          />
        </>
      ) : null}
      <div className="flex h-full w-full flex-col overflow-hidden border border-slate-300 bg-white text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.16)]">
        <div
          className="flex h-5 items-center justify-center px-2 text-[9px] font-semibold uppercase tracking-[0.08em]"
          style={{ backgroundColor: data.bannerBg || "#64748b", color: data.bannerText || "#ffffff" }}
        >
          {data.typeName || "Evidence"}
        </div>
        <div className="flex flex-1 flex-col px-3 py-2 text-center text-slate-900">
          <div className="flex flex-1 items-center justify-center text-[11px] font-semibold leading-tight">
            {data.description || data.title || "Evidence"}
          </div>
          {data.metaSubLabel ? (
            <div className="mt-1 w-full text-center text-[10px] font-normal leading-tight text-slate-600">
              {data.metaSubLabel}
            </div>
          ) : null}
        </div>
      </div>
      {hasPreview ? (
        <button
          type="button"
          className="nodrag nopan absolute left-0 top-full mt-2 w-full cursor-pointer border-0 bg-transparent p-0 text-left"
          style={{ maxWidth: `${minorGridSize * 7}px` }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            data.onOpenEvidenceMedia?.();
          }}
        >
          {isPdf ? (
            <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.14)]">
              <div className="relative h-36 w-full overflow-hidden bg-white">
                {data.evidenceMediaUrl ? (
                  <iframe
                    title={previewName}
                    src={`${data.evidenceMediaUrl}#page=1&view=FitH&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0`}
                    className="pointer-events-none absolute inset-0 h-full w-[calc(100%+18px)] border-0 bg-white"
                  />
                ) : null}
              </div>
              <div className="border-t border-slate-200 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">PDF</div>
                <div className="mt-1 truncate text-[11px] font-semibold text-slate-900">{previewName}</div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md shadow-[0_4px_14px_rgba(15,23,42,0.14)]">
              {imagePreviewErrored ? (
                <div className="flex h-48 w-full items-center justify-center px-3 text-center text-[11px] text-slate-700">
                  Preview unavailable
                </div>
              ) : (
                <div className="relative w-full overflow-hidden rounded-md" style={{ aspectRatio: `${imageAspectRatio}` }}>
                  <img
                    src={renderImageUrl || data.evidenceMediaUrl}
                    alt={previewName}
                    className="absolute inset-0 h-full w-full object-contain"
                    onLoad={(event) => {
                      const img = event.currentTarget;
                      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        setImageAspectRatio(img.naturalWidth / img.naturalHeight);
                      }
                    }}
                    onError={() => setImagePreviewErrored(true)}
                  />
                </div>
              )}
            </div>
          )}
        </button>
      ) : null}
    </div>
  );
}

function IncidentFindingNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full flex-col items-center overflow-visible">
      <NodeInfoBadge text={getNodeInfoText(data)} />
      <HiddenEdgeHandles />
      <div
        className="flex w-full items-center justify-center border border-blue-900 bg-[#1d4ed8] px-3 text-center text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
        style={{ minHeight: `${minorGridSize * 2}px` }}
      >
        {data.title || "Finding"}
      </div>
      <div className="mt-2 flex w-full flex-1 items-start justify-center border border-slate-300 bg-white px-2 py-2 text-center text-[10px] leading-snug text-slate-900 whitespace-pre-wrap break-words">
        {data.description || "Add description"}
      </div>
    </div>
  );
}

function IncidentRecommendationNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <IncidentCard data={data} selected={selected} fallbackTitle="Recommendation" fallbackType="Recommendation" />;
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
  flowTable: FlowTableNode,
  flowShapeRectangle: FlowShapeRectangleNode,
  flowShapeCircle: FlowShapeCircleNode,
  flowShapePill: FlowShapePillNode,
  flowShapePentagon: FlowShapePentagonNode,
  flowShapeChevronLeft: FlowShapeChevronLeftNode,
  flowShapeArrow: FlowShapeArrowNode,
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
