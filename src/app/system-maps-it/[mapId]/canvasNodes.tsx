"use client";

import { memo, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type WheelEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Handle,
  type Node,
  type NodeProps,
  NodeToolbar,
  NodeResizeControl,
  Position,
} from "@xyflow/react";
import {
  anchorNodeHeight,
  anchorNodeMinHeight,
  anchorNodeMinWidth,
  anchorNodeWidth,
  bowtieControlHeight,
  bowtieDefaultWidth,
  defaultCategoryColor,
  disciplineOptions,
  type FlowData,
  groupingMinHeight,
  groupingMinWidth,
  incidentCardHeight,
  incidentCardWidth,
  minorGridSize,
  parseEquipmentLabels,
  parseEnvironmentLabels,
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

function getContrastTextColor(hex: string | null | undefined, fallback = "#111827") {
  if (!hex) return fallback;
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback;
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const toLinear = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.42 ? "#111827" : "#FFFFFF";
}

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

function getScrollableLineHeight(element: HTMLElement) {
  const computedStyle = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(computedStyle.lineHeight);
  if (Number.isFinite(lineHeight) && lineHeight > 0) return lineHeight;
  const fontSize = Number.parseFloat(computedStyle.fontSize);
  return Number.isFinite(fontSize) && fontSize > 0 ? fontSize * 1.35 : 16;
}

function clampScrollTop(element: HTMLElement, scrollTop: number) {
  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
  return Math.max(0, Math.min(maxScrollTop, scrollTop));
}

const nodeTextScrollButtonSize = 14;
const nodeTextScrollButtonOffset = 1;
const nodeTextScrollTrackGap = 5;
const nodeTextScrollTrackInset = nodeTextScrollButtonOffset + nodeTextScrollButtonSize + nodeTextScrollTrackGap;
const nodeTextScrollThumbMinHeight = 14;
const nodeTextScrollThumbMaxHeight = 22;

function OneLineScrollableText({ className, children }: { className: string; children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const thumbDragRef = useRef<{ pointerId: number; startY: number; startScrollTop: number } | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [useCustomScrollbar, setUseCustomScrollbar] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState({
    trackTop: nodeTextScrollTrackInset,
    trackHeight: 0,
    thumbTop: 0,
    thumbHeight: nodeTextScrollThumbMinHeight,
  });
  const outerClassName = `${className.replace(/\boverflow-y-auto\b/g, "overflow-hidden").replace(/\bpr-1\b/g, "")} relative`;
  const innerClassName = `h-full w-full overflow-y-auto ${useCustomScrollbar ? "node-text-scrollbar-hidden pr-5" : className.includes("pr-1") ? "pr-1" : ""}`;
  const hiddenNativeScrollbarStyle: CSSProperties | undefined = useCustomScrollbar
    ? { scrollbarWidth: "none", msOverflowStyle: "none" }
    : undefined;

  const updateScrollMetrics = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
    const nextCanScroll = maxScrollTop > 1;
    setCanScroll(nextCanScroll);
    if (!nextCanScroll) return;

    const trackHeight = Math.max(0, element.clientHeight - nodeTextScrollTrackInset * 2);
    const minimumThumbHeight = Math.min(nodeTextScrollThumbMinHeight, trackHeight);
    const maximumThumbHeight = Math.min(trackHeight, nodeTextScrollThumbMaxHeight);
    const proportionalThumbHeight = Math.round((element.clientHeight / element.scrollHeight) * trackHeight);
    const thumbHeight = Math.max(minimumThumbHeight, Math.min(maximumThumbHeight, proportionalThumbHeight));
    const travel = Math.max(1, trackHeight - thumbHeight);
    const thumbTop = Math.round((element.scrollTop / maxScrollTop) * travel);
    setScrollMetrics((current) =>
      Math.abs(current.trackTop - nodeTextScrollTrackInset) < 0.5 &&
      Math.abs(current.trackHeight - trackHeight) < 0.5 &&
      Math.abs(current.thumbTop - thumbTop) < 0.5 &&
      Math.abs(current.thumbHeight - thumbHeight) < 0.5
        ? current
        : { trackTop: nodeTextScrollTrackInset, trackHeight, thumbTop, thumbHeight }
    );
  }, []);

  const scrollOneLine = useCallback((direction: -1 | 1) => {
    const element = scrollRef.current;
    if (!element) return;
    const lineHeight = getScrollableLineHeight(element);
    const nextScrollTop = clampScrollTop(element, element.scrollTop + direction * lineHeight);
    element.scrollTop = nextScrollTop;
    updateScrollMetrics();
  }, [updateScrollMetrics]);

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      event.stopPropagation();
      scrollOneLine(event.deltaY > 0 ? 1 : -1);
    },
    [scrollOneLine]
  );

  useEffect(() => {
    updateScrollMetrics();
    const element = scrollRef.current;
    const content = contentRef.current;
    if (!element) return;
    const observer = new ResizeObserver(updateScrollMetrics);
    observer.observe(element);
    if (content) observer.observe(content);
    window.addEventListener("resize", updateScrollMetrics);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollMetrics);
    };
  }, [children, updateScrollMetrics]);

  useEffect(() => {
    setUseCustomScrollbar(/\bEdg\//.test(window.navigator.userAgent));
  }, []);

  useEffect(() => {
    updateScrollMetrics();
  }, [updateScrollMetrics, useCustomScrollbar]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.addEventListener("scroll", updateScrollMetrics, { passive: true });
    return () => element.removeEventListener("scroll", updateScrollMetrics);
  }, [updateScrollMetrics]);

  const stopScrollButtonPointer = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleScrollButtonClick = useCallback(
    (direction: -1 | 1) => (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      scrollOneLine(direction);
    },
    [scrollOneLine]
  );

  const handleCustomTrackPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const element = scrollRef.current;
      if (!element || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      const direction = event.clientY < rect.top + scrollMetrics.thumbTop ? -1 : 1;
      scrollOneLine(direction);
    },
    [scrollMetrics.thumbTop, scrollOneLine]
  );

  const handleCustomThumbPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const element = scrollRef.current;
    if (!element || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    thumbDragRef.current = { pointerId: event.pointerId, startY: event.clientY, startScrollTop: element.scrollTop };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handleCustomThumbPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const element = scrollRef.current;
      const drag = thumbDragRef.current;
      if (!element || !drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      const travel = Math.max(1, scrollMetrics.trackHeight - scrollMetrics.thumbHeight);
      const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
      const nextScrollTop = clampScrollTop(element, drag.startScrollTop + ((event.clientY - drag.startY) / travel) * maxScrollTop);
      element.scrollTop = nextScrollTop;
      updateScrollMetrics();
    },
    [scrollMetrics.trackHeight, scrollMetrics.thumbHeight, updateScrollMetrics]
  );

  const handleCustomThumbPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (thumbDragRef.current?.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    thumbDragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return (
    <div className={outerClassName}>
      <div
        ref={scrollRef}
        className={innerClassName}
        style={hiddenNativeScrollbarStyle}
        data-node-text-scroll-region="true"
        onWheel={handleWheel}
      >
        <div ref={contentRef}>{children}</div>
      </div>
      {canScroll ? (
        <>
          <button
            type="button"
            className="nodrag nopan absolute right-[1px] top-[1px] z-20 flex h-[14px] w-[14px] items-center justify-center rounded-[2px] border border-[#8f8f8f] bg-[#8f8f8f] p-0 shadow-[0_1px_3px_rgba(15,23,42,0.16)] hover:border-[#7f7f7f] hover:bg-[#7f7f7f]"
            aria-label="Scroll text up one line"
            title="Scroll text up one line"
            data-node-text-scroll-control="true"
            onPointerDown={stopScrollButtonPointer}
            onMouseDown={stopScrollButtonPointer}
            onClick={handleScrollButtonClick(-1)}
          >
            <span aria-hidden="true" className="h-0 w-0 border-x-[4px] border-b-[5px] border-x-transparent border-b-white" />
          </button>
          <button
            type="button"
            className="nodrag nopan absolute bottom-[1px] right-[1px] z-20 flex h-[14px] w-[14px] items-center justify-center rounded-[2px] border border-[#8f8f8f] bg-[#8f8f8f] p-0 shadow-[0_1px_3px_rgba(15,23,42,0.16)] hover:border-[#7f7f7f] hover:bg-[#7f7f7f]"
            aria-label="Scroll text down one line"
            title="Scroll text down one line"
            data-node-text-scroll-control="true"
            onPointerDown={stopScrollButtonPointer}
            onMouseDown={stopScrollButtonPointer}
            onClick={handleScrollButtonClick(1)}
          >
            <span aria-hidden="true" className="h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-white" />
          </button>
          {useCustomScrollbar && scrollMetrics.trackHeight >= nodeTextScrollThumbMinHeight ? (
            <div
              className="nodrag nopan absolute right-[4px] z-10 w-[8px] rounded-full bg-transparent"
              style={{ top: `${scrollMetrics.trackTop}px`, height: `${scrollMetrics.trackHeight}px` }}
              data-node-text-scroll-control="true"
              onPointerDown={handleCustomTrackPointerDown}
            >
              <div
                className="absolute left-0 w-[8px] cursor-pointer rounded-full bg-[#8f8f8f] hover:bg-[#7f7f7f]"
                style={{ top: `${scrollMetrics.thumbTop}px`, height: `${scrollMetrics.thumbHeight}px` }}
                onPointerDown={handleCustomThumbPointerDown}
                onPointerMove={handleCustomThumbPointerMove}
                onPointerUp={handleCustomThumbPointerUp}
                onPointerCancel={handleCustomThumbPointerUp}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function NodeInfoBadge({
  text,
  wrapperClassName,
  buttonClassName,
  iconSrc,
  iconClassName,
  iconMaskClassName,
}: {
  text: string;
  wrapperClassName?: string;
  buttonClassName?: string;
  iconSrc?: string;
  iconClassName?: string;
  iconMaskClassName?: string;
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
        {iconSrc ? (
          iconMaskClassName ? (
            <span
              aria-hidden="true"
              className={iconMaskClassName}
              style={{
                WebkitMaskImage: `url('${iconSrc}')`,
                maskImage: `url('${iconSrc}')`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
          ) : (
            <img src={iconSrc} alt="" className={iconClassName || "h-3.5 w-3.5"} />
          )
        ) : "i"}
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
          {data.title ?? "Untitled Document"}
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
  const outlineColor = data.categoryOutlineColor ?? categoryColor;
  const outlineWidth = Number.isFinite(Number(data.categoryOutlineWidth)) ? Math.max(1, Math.min(12, Math.round(Number(data.categoryOutlineWidth)))) : 1;
  const fillMode = data.categoryFillMode === "outline" ? "outline" : "fill";
  const headingTextColor = fillMode === "outline" ? outlineColor : getContrastTextColor(categoryColor, "#111827");
  const fontSize = Math.max(10, Math.min(72, Number(data.textStyle?.fontSize ?? 12) || 12));
  return (
    <div
      className="relative flex h-full w-full flex-col border px-2 py-1 shadow-[0_6px_20px_rgba(15,23,42,0.18)]"
      style={{ backgroundColor: fillMode === "outline" ? "#ffffff" : categoryColor, borderColor: outlineColor, borderWidth: `${outlineWidth}px`, color: headingTextColor }}
    >
      {selected && data.canResize !== false ? (
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
      <div className="flex flex-1 items-center justify-center overflow-hidden text-center font-semibold leading-tight" style={{ fontSize: `${fontSize}px` }}>
        <span className="line-clamp-3 break-words whitespace-normal">{data.title ?? "New Category"}</span>
      </div>
    </div>
  );
}

function SystemCircleNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-hidden">
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
        <span className="line-clamp-3">{data.title ?? "System Name"}</span>
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
          {data.title ?? "Process"}
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

function EditableAnchorIcon({ sequenceNumber, groupColor }: { sequenceNumber: number; groupColor: string }) {
  const numberText = String(sequenceNumber);
  const numberFontSize = numberText.length >= 3 ? 44 : numberText.length === 2 ? 56 : 64;
  const numberTextColor = getContrastTextColor(groupColor, "#ffffff");

  return (
    <svg viewBox="0 0 375 191" className="h-full w-full" aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="359"
        height="175"
        rx="87.5"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="12"
      />
      <circle cx="98" cy="95.5" r="76" fill="#000000" />
      <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8">
        <circle cx="98" cy="55" r="12" />
        <path d="M98 69v55" />
        <path d="M76 82h44" />
        <path d="M62 111c6 17 18 28 36 35 18-7 30-18 36-35" />
        <path d="M54 118l8-22 18 14" />
        <path d="M142 118l-8-22-18 14" />
      </g>
      <circle cx="276" cy="95.5" r="76" fill={groupColor} />
      <text
        x="276"
        y="116"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={numberFontSize}
        fontWeight="800"
        fill={numberTextColor}
      >
        {numberText}
      </text>
    </svg>
  );
}

function AnchorNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [nodeSize, setNodeSize] = useState({ width: anchorNodeWidth, height: anchorNodeHeight });
  const sequenceNumber = Number.isFinite(Number(data.anchorSequenceNumber))
    ? Math.max(1, Math.round(Number(data.anchorSequenceNumber)))
    : 1;
  const anchorId = data.anchorId;
  const groupColor = /^#[0-9a-fA-F]{6}$/.test(data.anchorGroupColor ?? "")
    ? String(data.anchorGroupColor).toUpperCase()
    : "#0F766E";
  const handleNavigate = (direction: "previous" | "next") => (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!anchorId) return;
    data.onNavigateAnchor?.(anchorId, direction);
  };
  useEffect(() => {
    const element = nodeRef.current;
    if (!element) return;
    const updateSize = (nextWidth = element.offsetWidth, nextHeight = element.offsetHeight) => {
      setNodeSize((prev) => {
        const width = Math.max(anchorNodeMinWidth, nextWidth || anchorNodeWidth);
        const height = Math.max(anchorNodeMinHeight, nextHeight || anchorNodeHeight);
        if (Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5) return prev;
        return { width, height };
      });
    };
    updateSize();
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      updateSize(entry?.contentRect.width, entry?.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const groupScale = Math.min(nodeSize.width / anchorNodeWidth, nodeSize.height / anchorNodeHeight);

  return (
    <div ref={nodeRef} className="relative h-full w-full overflow-visible">
      <HiddenEdgeHandles />
      {selected && data.canResize !== false ? (
        <NodeResizeControl
          position="bottom-right"
          minWidth={anchorNodeMinWidth}
          minHeight={anchorNodeMinHeight}
          keepAspectRatio
          style={{
            width: 10,
            height: 10,
            borderRadius: 0,
            border: "1px solid #334155",
            background: "#ffffff",
            cursor: "nwse-resize",
            zIndex: 180,
          }}
        />
      ) : null}
      <div
        className="absolute left-1/2 top-1/2 flex origin-center flex-col items-center"
        style={{
          width: anchorNodeWidth,
          height: anchorNodeHeight,
          transform: `translate(-50%, -50%) scale(${groupScale})`,
        }}
      >
        <div className="h-[60px] w-full shrink-0 drop-shadow-[0_5px_10px_rgba(15,23,42,0.18)]">
          <EditableAnchorIcon sequenceNumber={sequenceNumber} groupColor={groupColor} />
        </div>
        <div className="mt-0.5 h-[24px] w-full px-1 text-center text-[11px] font-semibold leading-tight text-slate-900">
          <span className="line-clamp-2 break-words">{data.title || "Anchor"}</span>
        </div>
        <div className="mt-[1px] h-[10px] w-full truncate px-1 text-center text-[8px] font-medium leading-tight text-slate-500">
          {data.creatorName || "Unknown user"}
        </div>
        <div
          className="nodrag nopan mt-1 flex h-6 w-full items-center justify-between"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <button
            type="button"
            className="flex h-6 min-w-[60px] items-center justify-center rounded-full border border-slate-300 bg-white px-2.5 text-[9px] font-bold leading-none text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.2)] hover:bg-slate-50"
            title="Previous anchor"
            aria-label="Previous anchor"
            onClick={handleNavigate("previous")}
          >
            Previous
          </button>
          <button
            type="button"
            className="flex h-6 min-w-[60px] items-center justify-center rounded-full border border-slate-300 bg-white px-2.5 text-[9px] font-bold leading-none text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.2)] hover:bg-slate-50"
            title="Next anchor"
            aria-label="Next anchor"
            onClick={handleNavigate("next")}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupingContainerNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const outlineWidth = Math.max(1, Math.min(12, Math.round(data.groupingOutlineWidth ?? 1)));
  const headerFontSize = Math.max(10, Math.min(48, Math.round(data.groupingHeaderFontSize ?? 11)));
  const groupingBorderThickness = Math.max(10, outlineWidth);
  const headerVerticalPadding = Math.max(2, Math.round(headerFontSize * 0.22));
  const headerHorizontalPadding = Math.max(12, Math.round(headerFontSize * 1.05));
  const headerBg = data.bannerBg || "#FFFFFF";
  const headerText = data.bannerText || "#111827";
  return (
    <div
      className="pointer-events-none relative h-full w-full rounded-[10px] border bg-transparent"
      style={{
        borderColor: "#000000",
        borderWidth: outlineWidth,
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
      {selected && data.canResize !== false ? (
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
        className="grouping-drag-handle pointer-events-auto absolute left-5 top-0 -translate-y-1/2 cursor-move rounded-[999px] border bg-white text-center font-normal text-slate-800 whitespace-nowrap"
        style={{
          borderColor: "#000000",
          boxShadow: "0 3px 8px rgba(15, 23, 42, 0.12)",
          backgroundColor: headerBg,
          color: headerText,
          fontSize: headerFontSize,
          lineHeight: `${Math.round(headerFontSize * 1.2)}px`,
          padding: `${headerVerticalPadding}px ${headerHorizontalPadding}px`,
        }}
      >
        {data.title ?? "Group label"}
      </div>
    </div>
  );
}

function FlowTableNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const tableFillPaletteRows = [
    ["#EBC0C0", "#E5CFB6", "#E3E3B5", "#C7E2B0", "#B1E1B3", "#A7DEBF", "#A6DCE0", "#A7C9E3", "#B4B4E0", "#CAB4E1", "#DDB2DF", "#E2B2CF", "#DCDCDC"],
    ["#EE8F91", "#E8BD8D", "#E4E68A", "#B4E189", "#88DF8D", "#83D8AB", "#7FD2D4", "#83B3DF", "#8F8DDE", "#B18BDE", "#D883D9", "#E288C0", "#C9C9C9"],
    ["#FA6565", "#F1AF67", "#ECEF57", "#A2EA56", "#61E95F", "#5FDEA0", "#59D6D8", "#549FE6", "#6163E6", "#9E5AE5", "#DB59E2", "#EC5BAC", "#B3B3B3"],
    ["#FF3333", "#F89835", "#F2EF2C", "#8AF22C", "#38F234", "#3BE08E", "#3DD0D2", "#3B8FE4", "#3D37E3", "#8938E5", "#E538E4", "#F137A1", "#9F9F9F"],
    ["#EF0F0F", "#FC8801", "#F1EE03", "#75F100", "#13F500", "#12E17D", "#18CED1", "#1B84E8", "#130AEB", "#790CE6", "#EA03E8", "#FF0090", "#878787"],
    ["#DE0000", "#D26C00", "#C7C200", "#5ECA00", "#03C900", "#0DC269", "#19B8BA", "#1063C9", "#1209C1", "#6B07BA", "#D100CD", "#D00077", "#6C6C6C"],
    ["#B80000", "#A35A00", "#9C9B00", "#4F9900", "#029A00", "#0A9B53", "#109A9A", "#0A51A2", "#0D0DA0", "#5D0C97", "#AD0CA9", "#AE005E", "#4F4F4F"],
    ["#930000", "#7D4100", "#777700", "#376E00", "#006C00", "#066C3E", "#0B6F70", "#083B77", "#090976", "#43066F", "#7C007A", "#7F0045", "#1F1F1F"],
    ["#7A0000", "#5B2A00", "#4F5000", "#254A00", "#004A00", "#004A2A", "#00494A", "#002C57", "#000056", "#2E0050", "#530052", "#52002E", "#000000"],
  ] as const;
  const rows = Math.max(1, Math.floor(data.tableConfig?.rows ?? 2));
  const columns = Math.max(1, Math.floor(data.tableConfig?.columns ?? 2));
  const headerBg = data.tableConfig?.headerRowBg ?? null;
  const customGridLineColor =
    typeof data.tableConfig?.gridLineColor === "string" && /^#[0-9a-fA-F]{6}$/.test(data.tableConfig.gridLineColor)
      ? data.tableConfig.gridLineColor.toUpperCase()
      : null;
  const customGridLineWeightRaw = Number(data.tableConfig?.gridLineWeight ?? 0.5);
  const customGridLineWeight = Number.isFinite(customGridLineWeightRaw)
    ? Math.max(0.5, Math.min(6, Math.round(customGridLineWeightRaw * 2) / 2))
    : 0.5;
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
        const backgroundColorRaw = (raw as { backgroundColor?: string | null }).backgroundColor;
        return {
          bold: Boolean(raw.bold),
          italic: Boolean(raw.italic),
          underline: Boolean(raw.underline),
          align: alignRaw === "left" || alignRaw === "right" ? alignRaw : "center",
          vAlign: vAlignRaw === "top" || vAlignRaw === "bottom" ? vAlignRaw : "middle",
          fontSize: Number.isFinite(fontSizeRaw) ? Math.max(10, Math.min(72, Math.round(fontSizeRaw))) : 10,
          backgroundColor:
            typeof backgroundColorRaw === "string" && /^#[0-9a-fA-F]{6}$/.test(backgroundColorRaw) ? backgroundColorRaw.toUpperCase() : null,
        };
      }),
    [totalCells, columns, sourceCellStyles]
  );
  const normalizedCellTextSignature = useMemo(
    () => normalizedCellTexts.map((value) => value ?? "").join("\u0001"),
    [normalizedCellTexts]
  );
  const normalizedCellStyleSignature = useMemo(
    () =>
      normalizedCellStyles
        .map((style) =>
          JSON.stringify({
            bold: Boolean(style.bold),
            italic: Boolean(style.italic),
            underline: Boolean(style.underline),
            align: style.align ?? "center",
            vAlign: style.vAlign ?? "middle",
            fontSize: Number(style.fontSize ?? 10),
            backgroundColor: style.backgroundColor ?? null,
          })
        )
        .join("\u0001"),
    [normalizedCellStyles]
  );
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null);
  const [rangeAnchorCellIndex, setRangeAnchorCellIndex] = useState<number | null>(null);
  const [selectedCellIndices, setSelectedCellIndices] = useState<Set<number>>(new Set());
  const [editingCellIndex, setEditingCellIndex] = useState<number | null>(null);
  const [draftCellTexts, setDraftCellTexts] = useState<string[]>(normalizedCellTexts);
  const [draftCellStyles, setDraftCellStyles] = useState(normalizedCellStyles);
  const tableRootRef = useRef<HTMLDivElement | null>(null);
  const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const lastSyncedCellTextSignatureRef = useRef(normalizedCellTextSignature);
  const lastSyncedCellStyleSignatureRef = useRef(normalizedCellStyleSignature);
  const skipBlurCommitCellRef = useRef<number | null>(null);
  const toolbarInteractionUntilRef = useRef<number>(0);
  const pendingCursorToEndCellRef = useRef<number | null>(null);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);
  const showResizeHandles = Boolean(data.canEdit) && selected;
  const markToolbarInteraction = useCallback(() => {
    toolbarInteractionUntilRef.current = Date.now() + 700;
  }, []);

  const areCellTextArraysEqual = useCallback((left: string[], right: string[]) => {
    if (left === right) return true;
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if ((left[index] ?? "") !== (right[index] ?? "")) return false;
    }
    return true;
  }, []);

  const areCellStyleArraysEqual = useCallback(
    (
      left: Array<{
        bold: boolean;
        italic: boolean;
        underline: boolean;
        align: string;
        vAlign: string;
        fontSize: number;
        backgroundColor?: string | null;
      }>,
      right: Array<{
        bold: boolean;
        italic: boolean;
        underline: boolean;
        align: string;
        vAlign: string;
        fontSize: number;
        backgroundColor?: string | null;
      }>
    ) => {
      if (left === right) return true;
      if (left.length !== right.length) return false;
      for (let index = 0; index < left.length; index += 1) {
        const a = left[index];
        const b = right[index];
        if (!a || !b) return false;
        if (
          a.bold !== b.bold ||
          a.italic !== b.italic ||
          a.underline !== b.underline ||
          a.align !== b.align ||
          a.vAlign !== b.vAlign ||
          a.fontSize !== b.fontSize ||
          (a.backgroundColor ?? null) !== (b.backgroundColor ?? null)
        ) {
          return false;
        }
      }
      return true;
    },
    []
  );

  useEffect(() => {
    if (lastSyncedCellTextSignatureRef.current !== normalizedCellTextSignature) {
      setDraftCellTexts((prev) => (areCellTextArraysEqual(prev, normalizedCellTexts) ? prev : normalizedCellTexts));
      lastSyncedCellTextSignatureRef.current = normalizedCellTextSignature;
    }
    if (lastSyncedCellStyleSignatureRef.current !== normalizedCellStyleSignature) {
      setDraftCellStyles((prev) => (areCellStyleArraysEqual(prev, normalizedCellStyles) ? prev : normalizedCellStyles));
      lastSyncedCellStyleSignatureRef.current = normalizedCellStyleSignature;
    }
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
      if (next.size !== prev.size) return next;
      for (const idx of prev) {
        if (!next.has(idx)) return next;
      }
      return prev;
    });
    setEditingCellIndex((prev) => {
      if (prev == null) return null;
      return prev < totalCells ? prev : null;
    });
  }, [normalizedCellTextSignature, normalizedCellStyleSignature, normalizedCellTexts, normalizedCellStyles, totalCells, areCellTextArraysEqual, areCellStyleArraysEqual]);

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
      const backgroundColor =
        typeof cell.backgroundColor === "string" && /^#[0-9a-fA-F]{6}$/.test(cell.backgroundColor) ? cell.backgroundColor.toUpperCase() : null;
      return {
        bold: cell.bold ?? baseBold,
        italic: cell.italic ?? baseItalic,
        underline: cell.underline ?? baseUnderline,
        align: alignRaw === "left" || alignRaw === "right" ? alignRaw : baseAlign,
        vAlign: cell.vAlign === "top" || cell.vAlign === "bottom" ? cell.vAlign : "middle",
        fontSize: Number.isFinite(fontSizeRaw) ? Math.max(10, Math.min(72, Math.round(fontSizeRaw))) : baseFontSize,
        backgroundColor,
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
  const setDraftCellTextAtIndex = useCallback((cellIndex: number, value: string) => {
    setDraftCellTexts((prev) => {
      if ((prev[cellIndex] ?? "") === value) return prev;
      const next = [...prev];
      next[cellIndex] = value;
      return next;
    });
  }, []);
  const commitCellAtIndex = useCallback(
    (cellIndex: number | null, overrideValue?: string) => {
      if (!canEdit || cellIndex == null) return;
      const rowIndex = Math.floor(cellIndex / columns);
      const columnIndex = cellIndex % columns;
      const cellValue = overrideValue ?? draftCellTexts[cellIndex] ?? "";
      if (overrideValue !== undefined) {
        setDraftCellTextAtIndex(cellIndex, overrideValue);
      }
      data.onTableCellCommit?.(rowIndex, columnIndex, cellValue);
    },
    [canEdit, columns, draftCellTexts, data, setDraftCellTextAtIndex]
  );
  const commitAndClearSelection = useCallback(() => {
    if (selectedCellIndex != null) {
      const liveEditingValue =
        editingCellIndex != null && editingCellIndex === selectedCellIndex ? editingTextareaRef.current?.value : undefined;
      if (editingCellIndex != null && editingCellIndex === selectedCellIndex) {
        skipBlurCommitCellRef.current = selectedCellIndex;
      }
      commitCellAtIndex(selectedCellIndex, liveEditingValue);
    }
    setEditingCellIndex(null);
    setSelectedCellIndex(null);
    setRangeAnchorCellIndex(null);
    setSelectedCellIndices(new Set());
  }, [selectedCellIndex, editingCellIndex, commitCellAtIndex]);
  const selectCell = useCallback(
    (index: number, options?: { extendRange?: boolean; enterEdit?: boolean }) => {
      const extendRange = Boolean(options?.extendRange && rangeAnchorCellIndex != null);
      if (extendRange && rangeAnchorCellIndex != null) {
        const nextRange = buildRangeSelection(rangeAnchorCellIndex, index);
        setSelectedCellIndices(nextRange);
        setSelectedCellIndex(index);
        setEditingCellIndex(null);
        return;
      }
      if (selectedCellIndex != null && selectedCellIndex !== index) {
        const liveEditingValue =
          editingCellIndex != null && editingCellIndex === selectedCellIndex ? editingTextareaRef.current?.value : undefined;
        if (editingCellIndex != null && editingCellIndex === selectedCellIndex) {
          skipBlurCommitCellRef.current = selectedCellIndex;
        }
        commitCellAtIndex(selectedCellIndex, liveEditingValue);
      }
      setSelectedCellIndex(index);
      setRangeAnchorCellIndex(index);
      setSelectedCellIndices(new Set([index]));
      setEditingCellIndex(options?.enterEdit && canEdit ? index : null);
    },
    [rangeAnchorCellIndex, buildRangeSelection, selectedCellIndex, editingCellIndex, commitCellAtIndex, canEdit]
  );
  const moveSelectedCell = useCallback(
    (cellIndex: number, direction: "up" | "down" | "left" | "right") => {
      const rowIndex = Math.floor(cellIndex / columns);
      const columnIndex = cellIndex % columns;
      let nextRow = rowIndex;
      let nextColumn = columnIndex;
      if (direction === "up") nextRow -= 1;
      if (direction === "down") nextRow += 1;
      if (direction === "left") nextColumn -= 1;
      if (direction === "right") nextColumn += 1;
      if (nextRow < 0 || nextRow >= rows || nextColumn < 0 || nextColumn >= columns) return;
      const nextIndex = nextRow * columns + nextColumn;
      setSelectedCellIndex(nextIndex);
      setRangeAnchorCellIndex(nextIndex);
      setSelectedCellIndices(new Set([nextIndex]));
      setEditingCellIndex(null);
    },
    [columns, rows]
  );
  const applyStyleToEditingCell = useCallback(
    (nextStyle: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      align?: "left" | "center" | "right";
      vAlign?: "top" | "middle" | "bottom";
      fontSize?: number;
      backgroundColor?: string | null;
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
          backgroundColor: string | null;
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
        const backgroundColor =
          typeof merged.backgroundColor === "string" && /^#[0-9a-fA-F]{6}$/.test(merged.backgroundColor) ? merged.backgroundColor.toUpperCase() : null;
        normalizedByIndex.set(targetIndex, {
          bold: Boolean(merged.bold),
          italic: Boolean(merged.italic),
          underline: Boolean(merged.underline),
          align: align as "left" | "center" | "right",
          vAlign: vAlign as "top" | "middle" | "bottom",
          fontSize,
          backgroundColor,
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
  useEffect(() => {
    if (!showFillColorPicker) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as globalThis.Node | null;
      if (!target) return;
      if (colorPickerRef.current?.contains(target)) return;
      setShowFillColorPicker(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showFillColorPicker]);
  useEffect(() => {
    if (!canEdit || !selected || selectedCellIndex == null || editingCellIndex != null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase() ?? "";
      if (target?.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select") return;

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelectedCell(selectedCellIndex, "up");
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelectedCell(selectedCellIndex, "down");
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSelectedCell(selectedCellIndex, "left");
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveSelectedCell(selectedCellIndex, "right");
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1) return;

      event.preventDefault();
      setDraftCellTexts((prev) => {
        const next = [...prev];
        next[selectedCellIndex] = `${next[selectedCellIndex] ?? ""}${event.key}`;
        return next;
      });
      pendingCursorToEndCellRef.current = selectedCellIndex;
      setEditingCellIndex(selectedCellIndex);
      setSelectedCellIndices(new Set([selectedCellIndex]));
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [canEdit, selected, selectedCellIndex, editingCellIndex, moveSelectedCell]);
  useEffect(() => {
    if (editingCellIndex == null) return;
    if (pendingCursorToEndCellRef.current !== editingCellIndex) return;
    const textarea = editingTextareaRef.current;
    if (!textarea) return;
    const setCursorToEnd = () => {
      const end = textarea.value.length;
      textarea.focus();
      textarea.setSelectionRange(end, end);
      pendingCursorToEndCellRef.current = null;
    };
    const frame = requestAnimationFrame(setCursorToEnd);
    return () => cancelAnimationFrame(frame);
  }, [editingCellIndex]);

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
  const outerGridBorder = customGridLineColor ?? "rgba(148, 163, 184, 0.55)";
  const getContrastColor = (hex: string) => {
    const normalized = hex.replace("#", "");
    const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
    const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
    const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
    const toLinear = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance > 0.42 ? "#111827" : "#FFFFFF";
  };
  const activeCellFillColor = activeCellStyle?.backgroundColor ?? "#FFFFFF";

  return (
    <div ref={tableRootRef} className="relative h-full w-full overflow-visible">
      <HiddenEdgeHandles />
      {canEdit && selectedCellIndices.size > 0 && editingCellIndex == null && activeCellStyle ? (
        <NodeToolbar
          isVisible
          position={Position.Top}
          offset={12}
        >
        <div
          ref={toolbarRef}
          className="nodrag nopan flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.18)]"
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
          <div ref={colorPickerRef} className="relative">
            <button
              type="button"
              className="flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-300 bg-white px-2"
              title="Cell background colour"
              aria-label="Cell background colour"
              onClick={(event) => {
                markToolbarInteraction();
                event.stopPropagation();
                setShowFillColorPicker((prev) => !prev);
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
              <span
                className="h-4 w-4 rounded-[4px] border border-slate-300"
                style={{ backgroundColor: activeCellFillColor }}
              />
            </button>
            {showFillColorPicker ? (
              <div
                className="absolute left-0 top-[calc(100%+8px)] z-20 w-[316px] rounded-xl border border-slate-200 bg-white p-2 shadow-[0_14px_30px_rgba(15,23,42,0.2)]"
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
                <div className="space-y-1">
                  <button
                    type="button"
                    className={`h-5 w-full rounded-[4px] border ${activeCellFillColor === "#FFFFFF" ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-300"}`}
                    style={{ backgroundColor: "#FFFFFF" }}
                    title="#FFFFFF"
                    aria-label="Apply #FFFFFF"
                    onClick={(event) => {
                      markToolbarInteraction();
                      event.stopPropagation();
                      applyStyleToEditingCell({ backgroundColor: "#FFFFFF" });
                      setShowFillColorPicker(false);
                    }}
                  />
                  {tableFillPaletteRows.map((row, rowIndex) => (
                    <div key={`table-fill-row-${rowIndex}`} className="grid gap-1" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
                      {row.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          className={`h-5 w-5 rounded-[4px] border ${activeCellFillColor === hex ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-300"}`}
                          style={{ backgroundColor: hex }}
                          title={hex}
                          aria-label={`Apply ${hex}`}
                          onClick={(event) => {
                            markToolbarInteraction();
                            event.stopPropagation();
                            applyStyleToEditingCell({ backgroundColor: hex });
                            setShowFillColorPicker(false);
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                  onClick={(event) => {
                    markToolbarInteraction();
                    event.stopPropagation();
                    applyStyleToEditingCell({ backgroundColor: null });
                    setShowFillColorPicker(false);
                  }}
                >
                  Clear
                </button>
              </div>
            ) : null}
          </div>
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
        </NodeToolbar>
      ) : null}
      <div
        className="relative h-full w-full overflow-hidden border bg-white"
        style={{
          borderColor: outerGridBorder,
          borderWidth: `${customGridLineWeight}px`,
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
            const cellBackground = cellStyle.backgroundColor ?? getCellBackground(rowIndex);
            const nextRowBackground =
              rowIndex < rows - 1 ? (getEffectiveCellStyle(index + columns).backgroundColor ?? getCellBackground(rowIndex + 1)) : null;
            const cellTextColor = getContrastColor(cellBackground);
            const verticalBorderColor = customGridLineColor ?? (isDarkBackground(cellBackground) ? contrastGridBorder : defaultGridBorder);
            const horizontalBorderColor =
              customGridLineColor ?? (isDarkBackground(cellBackground) || isDarkBackground(nextRowBackground) ? contrastGridBorder : defaultGridBorder);
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
                  backgroundColor: cellBackground,
                  color: cellStyle.backgroundColor ? cellTextColor : isHeaderCell ? headerTextColor : "#111827",
                  borderRight:
                    columnIndex < columns - 1
                      ? `${customGridLineWeight}px solid ${verticalBorderColor}`
                      : "none",
                  borderBottom:
                    rowIndex < rows - 1
                      ? `${customGridLineWeight}px solid ${horizontalBorderColor}`
                      : "none",
                  textAlign: cellStyle.align,
                  fontSize: `${cellStyle.fontSize}px`,
                  fontWeight: cellStyle.bold ? 700 : 500,
                  fontStyle: cellStyle.italic ? "italic" : "normal",
                  textDecoration: cellStyle.underline ? "underline" : "none",
                  boxShadow: selectedCellIndices.has(index) ? "inset 0 0 0 2px #1d4ed8" : "none",
                  alignItems: cellStyle.vAlign === "top" ? "flex-start" : cellStyle.vAlign === "bottom" ? "flex-end" : "center",
                }}
                onPointerDown={(event) => {
                  if (!selected || event.button !== 0) return;
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  if (!selected) return;
                  event.stopPropagation();
                  selectCell(index, { extendRange: event.shiftKey });
                }}
                onDoubleClickCapture={(event) => {
                  if (!canEdit) return;
                  if (!selected) return;
                  event.preventDefault();
                  event.stopPropagation();
                  selectCell(index, { enterEdit: true });
                }}
              >
                {isEditing && canEdit ? (
                  <textarea
                    ref={isEditing ? editingTextareaRef : null}
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
                    onPointerDown={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    onBlur={(event) => {
                      event.stopPropagation();
                      if (skipBlurCommitCellRef.current === index) {
                        skipBlurCommitCellRef.current = null;
                        setEditingCellIndex(null);
                        return;
                      }
                      commitCellAtIndex(index, event.target.value);
                      setEditingCellIndex(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        skipBlurCommitCellRef.current = index;
                        commitCellAtIndex(index, event.currentTarget.value);
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
  const backgroundColor =
    typeof data.textStyle?.backgroundColor === "string" && /^#[0-9a-fA-F]{6}$/.test(data.textStyle.backgroundColor) ? data.textStyle.backgroundColor : "#FEF08A";
  const outlineColor =
    typeof data.textStyle?.outlineColor === "string" && /^#[0-9a-fA-F]{6}$/.test(data.textStyle.outlineColor) ? data.textStyle.outlineColor : "#F59E0B";
  const outlineWidth = Number.isFinite(Number(data.textStyle?.outlineWidth)) ? Math.max(1, Math.min(12, Math.round(Number(data.textStyle?.outlineWidth)))) : 1;
  const fillMode = data.shapeStyle?.fillMode === "outline" ? "outline" : "fill";
  const renderedBackground = fillMode === "outline" ? "#FFFFFF" : backgroundColor;
  const textColor = (() => {
    const normalized = renderedBackground.replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "#111827";
    const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
    const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
    const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
    const toLinear = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance > 0.42 ? "#111827" : "#FFFFFF";
  })();
  return (
    <div
      className="relative h-full w-full p-2 text-[11px] leading-snug shadow-[0_10px_24px_rgba(15,23,42,0.22)]"
      style={{
        backgroundColor: renderedBackground,
        border: `${outlineWidth}px solid ${outlineColor}`,
        color: textColor,
      }}
    >
      {selected && canEdit && data.canResize !== false ? (
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
        <div className="truncate text-[10px] font-bold">{data.creatorName || "User"}</div>
        <div className="mt-1 flex-1 overflow-hidden whitespace-pre-wrap break-words text-[11px] font-normal">
          {data.title ?? "Enter Text"}
        </div>
        <div className="mt-1 truncate text-right text-[9px] font-normal opacity-80">{data.createdAtLabel || ""}</div>
      </div>
    </div>
  );
}

function ImageAssetNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <HiddenEdgeHandles />
      {selected && data.canResize !== false ? (
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
          <div className="px-2 text-center text-[11px] text-slate-500">{data.title ?? "Image"}</div>
        )}
      </div>
    </div>
  );
}

function TextBoxNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const style = data.textStyle ?? {};
  const fontSize = Number(style.fontSize ?? 14);
  const safeFontSize = Number.isFinite(fontSize) ? Math.min(168, Math.max(16, fontSize)) : 16;
  const backgroundColor =
    typeof style.backgroundColor === "string" && /^#[0-9a-fA-F]{6}$/.test(style.backgroundColor) ? style.backgroundColor : "#FFFFFF";
  const getContrastColor = (hex: string) => {
    const normalized = hex.replace("#", "");
    const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
    const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
    const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
    const toLinear = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance > 0.42 ? "#111827" : "#FFFFFF";
  };
  const contrastTextColor = getContrastColor(backgroundColor);
  const hasOutline = Boolean(style.outline);
  const outlineColor =
    typeof style.outlineColor === "string" && /^#[0-9a-fA-F]{6}$/.test(style.outlineColor) ? style.outlineColor : contrastTextColor;
  const outlineWidth = Number.isFinite(Number(style.outlineWidth)) ? Math.max(1, Math.min(12, Math.round(Number(style.outlineWidth)))) : 2;
  return (
    <div className="relative h-full w-full overflow-visible">
      {selected && data.canResize !== false ? (
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
          background: backgroundColor,
          color: contrastTextColor,
          border: hasOutline ? `${outlineWidth}px solid ${outlineColor}` : "none",
          textAlign: style.align ?? "left",
          fontWeight: style.bold ? 700 : 400,
          fontStyle: style.italic ? "italic" : "normal",
          textDecoration: style.underline ? "underline" : "none",
          fontSize: `${safeFontSize}px`,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {data.title ?? "Click to edit text box"}
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
  const outlineColor =
    typeof shapeStyle.outlineColor === "string" && /^#[0-9a-fA-F]{6}$/.test(shapeStyle.outlineColor) ? shapeStyle.outlineColor : fill;
  const outlineWidth = Number.isFinite(Number(shapeStyle.outlineWidth)) ? Math.max(1, Math.min(12, Math.round(Number(shapeStyle.outlineWidth)))) : 3;
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
              stroke={outlineColor}
              strokeWidth={outlineWidth}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              shapeRendering="geometricPrecision"
            />
          </svg>
          <span className="relative z-[1] w-full whitespace-pre-wrap break-words">{data.title ?? "Shape text"}</span>
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
              stroke={outlineColor}
              strokeWidth={outlineWidth}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              shapeRendering="geometricPrecision"
            />
          </svg>
          <span className="relative z-[1] w-full whitespace-pre-wrap break-words">{data.title ?? "Shape text"}</span>
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
              stroke={outlineColor}
              strokeWidth={outlineWidth}
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
            border: `${outlineWidth}px solid ${outlineColor}`,
            color: textColor,
            textAlign: align,
            fontSize: `${safeFontSize}px`,
            fontWeight: bold ? 700 : 400,
            fontStyle: italic ? "italic" : "normal",
            textDecoration: underline ? "underline" : "none",
          }}
        >
          <span className="w-full whitespace-pre-wrap break-words">{data.title ?? "Shape text"}</span>
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
      <div className="relative flex h-full w-full flex-col items-center justify-start overflow-visible pt-2">
        <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="top-source" type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="left" type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="right" type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="left-target" type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        <Handle id="right-target" type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none", width: 6, height: 6 }} />
        {data.personBadge ? (
          <div
            className="absolute left-1/2 top-0 z-20 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-2 py-1 text-center text-[8px] font-semibold leading-none shadow-[0_6px_14px_rgba(15,23,42,0.18)]"
            style={{
              backgroundColor: data.personBadge.bg,
              color: data.personBadge.text,
              minWidth: `${minorGridSize * 3.5}px`,
              maxWidth: `${minorGridSize * 6.5}px`,
            }}
          >
            <span className="truncate">{data.personBadge.label}</span>
          </div>
        ) : null}
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

function StandaloneIconNode({
  iconSrc,
  title,
  subtitle,
}: {
  iconSrc: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-visible pt-2">
      <HiddenEdgeHandles />
      <div
        className="flex items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]"
        style={{ width: personIconSize, height: personIconSize }}
      >
        <img src={iconSrc} alt="" className="h-full w-full object-contain" />
      </div>
      <div
        className="mt-1 text-center text-[10px] font-semibold leading-tight text-slate-900 whitespace-normal break-words"
        style={{ width: `${minorGridSize * 7}px`, maxWidth: `${minorGridSize * 7}px` }}
      >
        {title}
      </div>
      <div
        className="mt-0.5 text-center text-[9px] font-normal leading-tight text-slate-700 whitespace-normal break-words"
        style={{ width: `${minorGridSize * 7}px`, maxWidth: `${minorGridSize * 7}px` }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function EquipmentNode({ data }: NodeProps<Node<FlowData>>) {
  const labels = parseEquipmentLabels(data.title);
  return (
    <StandaloneIconNode
      iconSrc="/icons/equipment.svg"
      title={labels.equipmentType}
      subtitle={labels.identifier}
    />
  );
}

function EnvironmentNode({ data }: NodeProps<Node<FlowData>>) {
  const labels = parseEnvironmentLabels(data.title);
  return (
    <StandaloneIconNode
      iconSrc="/icons/environment.svg"
      title={labels.factorType}
      subtitle={labels.detail}
    />
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
      <BowtieCard
        title={data.title ?? "Hazard"}
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
        title={data.title ?? "Top Event"}
        accent="#22c55e"
        background="#ecfdf5"
        border="#16a34a"
      />
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
      <BowtieCard
        title={data.title ?? "Threat"}
        subtitle={data.description || undefined}
        accent="#f97316"
        background="#fff7ed"
        border="#fb923c"
      />
    </div>
  );
}

function BowtieConsequenceNode({ data }: NodeProps<Node<FlowData>>) {
  const impactCategory = (data.metaSubLabel || "").trim();
  return (
    <div className="relative h-full w-full overflow-visible">
      <BowtieCard
        title={data.title ?? "Consequence"}
        accent="#ef4444"
        background="#fef2f2"
        border="#f87171"
      />
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
    case "anchor": return "Navigation anchor used to step through a linked map sequence.";
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
    case "incident_outcome": return "Incident outcome node showing actual, potential, or reporting outcome details.";
    case "incident_task_condition": return "Task/condition node showing work state and context.";
    case "incident_factor": return "Incident factor node showing contributors to the event.";
    case "incident_system_factor": return "System factor node showing organisational contributors.";
    case "incident_control_barrier": return "Control/barrier node showing safeguards and their effectiveness.";
    case "incident_evidence": return "Evidence node supporting findings.";
    case "incident_response_recovery": return "Response or recovery node showing the immediate response category and description.";
    case "incident_finding": return "Finding node capturing key analysis conclusions.";
    case "incident_recommendation": return "Recommendation node for corrective or preventive actions.";
    default: return "Map node providing contextual information in this system map.";
  }
}

function BowtieControlNode({ data }: NodeProps<Node<FlowData>>) {
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
      <BowtieCard
        title={data.title ?? "Control"}
        accent={bannerColor}
        background="#ffffff"
        border="#cbd5e1"
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
          â˜…
        </div>
      ) : null}
      <div className="flex flex-1 items-center justify-center px-2 text-center text-[11px] font-semibold">
        {data.title ?? "Control"}
      </div>
    </div>
  );
  */
}

function BowtieEscalationFactorNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <BowtieCard
        title={data.title ?? "Escalation Factor"}
        subtitle={data.description || undefined}
        accent="#f59e0b"
        background="#fffbeb"
        border="#fcd34d"
      />
    </div>
  );
}

function BowtieRecoveryMeasureNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <BowtieCard
        title={data.title ?? "Recovery Measure"}
        accent="#0f766e"
        background="#f0fdfa"
        border="#5eead4"
      />
    </div>
  );
}

function BowtieDegradationIndicatorNode({ data }: NodeProps<Node<FlowData>>) {
  return (
    <div className="relative h-full w-full overflow-visible">
      <BowtieCard
        title={data.title ?? "Degradation Indicator"}
        accent="#06b6d4"
        background="#ecfeff"
        border="#67e8f9"
      />
    </div>
  );
}

function BowtieRiskRatingNode({ data }: NodeProps<Node<FlowData>>) {
  const riskLabel = data.title ?? "Medium";
  const palette = getBowtieRiskPalette(riskLabel);
  return (
    <div className="relative h-full w-full overflow-visible">
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

const incidentNodeShadow = "0 14px 30px rgba(15,23,42,0.14)";
const incidentFloatingShadow = "0 10px 24px rgba(15,23,42,0.16)";
const incidentNodeMinHeight = incidentCardHeight;

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function mixHex(hex: string, targetHex: string, ratio: number) {
  const source = hexToRgb(hex);
  const target = hexToRgb(targetHex);
  if (!source || !target) return hex;
  const blend = (from: number, to: number) => Math.round(from + (to - from) * ratio);
  const r = blend(source.r, target.r);
  const g = blend(source.g, target.g);
  const b = blend(source.b, target.b);
  return `rgb(${r}, ${g}, ${b})`;
}

function incidentBannerGradient(base: string) {
  return `linear-gradient(135deg, ${mixHex(base, "#0f172a", 0.2)} 0%, ${mixHex(base, "#1d4ed8", 0.08)} 45%, ${mixHex(base, "#ffffff", 0.08)} 100%)`;
}

function IncidentResizeHandles() {
  return (
    <>
      <NodeResizeControl
        position={Position.Right}
        minWidth={incidentCardWidth}
        minHeight={incidentNodeMinHeight}
        style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
      />
      <NodeResizeControl
        position={Position.Bottom}
        minWidth={incidentCardWidth}
        minHeight={incidentNodeMinHeight}
        style={{ width: 10, height: 10, borderRadius: 0, border: "1px solid #334155", background: "#ffffff" }}
      />
    </>
  );
}

function ModernIncidentNode({
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
  const tags = data.incidentTags ?? [];
  const hasTags = tags.length > 0;
  const isEvidenceNode = data.entityKind === "incident_evidence";
  const hasEvidencePreview = Boolean(data.evidenceShowPreview && data.evidenceMediaUrl);
  const isEvidencePdf = (data.evidenceMediaMime || "").toLowerCase().includes("pdf");
  const evidencePreviewName = data.evidenceMediaName || (isEvidencePdf ? "PDF Document" : "Evidence File");
  const evidenceRotationDeg = data.evidenceMediaRotationDeg ?? 0;
  const [detailOpen, setDetailOpen] = useState(Boolean(data.incidentDetailOpen));
  const [infoOpen, setInfoOpen] = useState(false);
  const [isInfoAnimating, setIsInfoAnimating] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(3 / 4);
  const [imagePreviewErrored, setImagePreviewErrored] = useState(false);
  const [renderImageUrl, setRenderImageUrl] = useState<string | null>(null);
  const hasOutcomeRiskStrip = data.entityKind === "incident_outcome" && Boolean(data.metaLabel);

  useEffect(() => {
    setDetailOpen(Boolean(data.incidentDetailOpen));
  }, [data.incidentDetailOpen]);

  useEffect(() => {
    if (!infoOpen) return;
    const handlePointerDown = () => {
      setInfoOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [infoOpen]);

  const triggerInfoFlip = useCallback((nextOpen: boolean) => {
    setIsInfoAnimating(true);
    setInfoOpen(nextOpen);
    window.setTimeout(() => {
      setIsInfoAnimating(false);
    }, 320);
  }, []);

  useEffect(() => {
    setImagePreviewErrored(false);
    setImageAspectRatio(3 / 4);
  }, [data.evidenceMediaUrl]);

  useEffect(() => {
    let cancelled = false;
    if (!data.evidenceMediaUrl || isEvidencePdf) {
      setRenderImageUrl(data.evidenceMediaUrl || null);
      return;
    }
    if (evidenceRotationDeg === 0) {
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
        if (evidenceRotationDeg === 90 || evidenceRotationDeg === 270) {
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((evidenceRotationDeg * Math.PI) / 180);
        ctx.drawImage(image, -iw / 2, -ih / 2);
        setRenderImageUrl(canvas.toDataURL("image/png"));
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
  }, [data.evidenceMediaUrl, isEvidencePdf, evidenceRotationDeg]);

  const showDetailToggle = hasTags || hasEvidencePreview;

  return (
    <div className="relative h-full w-full overflow-visible">
      <HiddenEdgeHandles />
      {selected && data.canResize !== false ? <IncidentResizeHandles /> : null}
      {!infoOpen ? (
        <button
          type="button"
          className="nodrag nopan absolute right-3 top-[15px] z-[140] flex h-[20px] w-[20px] -translate-y-1/2 items-center justify-center bg-transparent p-0 transition"
          aria-label="Node information"
          title="Node information"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            triggerInfoFlip(true);
          }}
        >
          <span
            aria-hidden="true"
            className="block h-[20px] w-[20px] bg-white"
            style={{
              WebkitMaskImage: "url('/icons/infoicon.svg')",
              maskImage: "url('/icons/infoicon.svg')",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
        </button>
      ) : null}
      <div className={`h-full w-full ${isInfoAnimating ? "[perspective:1200px]" : ""}`}>
        <div
          className={`relative h-full w-full ${isInfoAnimating ? "transition-transform duration-300 [transform-style:preserve-3d]" : ""}`}
          style={isInfoAnimating ? { transform: infoOpen ? "rotateY(180deg)" : "rotateY(0deg)" } : undefined}
        >
          <div
            className={`absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white text-slate-900 ${isInfoAnimating ? "[backface-visibility:hidden]" : ""}`}
            style={{
              boxShadow: incidentNodeShadow,
              visibility: !infoOpen || isInfoAnimating ? "visible" : "hidden",
              pointerEvents: infoOpen ? "none" : "auto",
            }}
          >
            <div
              className="flex min-h-[28px] items-center justify-between gap-2 px-4 py-1.5 pr-11"
              style={{ background: incidentBannerGradient(data.bannerBg || "#64748b"), color: data.bannerText || "#111827" }}
            >
              <div className="truncate text-[10px] font-semibold uppercase tracking-[0.08em]">
                {data.typeName || fallbackType}
              </div>
            </div>
            {data.entityKind === "incident_outcome" ? (
              <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] px-4 pb-3 pt-3">
                <div className="min-h-0 overflow-hidden">
                  <OneLineScrollableText className="h-full w-full overflow-y-auto pr-1 text-left text-[11px] font-medium leading-[1.35] text-slate-800">
                    {data.metaLabel ? (
                      <div className="mb-2 flex">
                        <span
                          className="inline-flex min-h-[20px] w-full items-center justify-center rounded-[6px] border px-2 py-0.5 text-center text-[10px] font-semibold uppercase tracking-[0.06em] leading-none"
                          style={{
                            backgroundColor: data.metaLabelBg || "#e5e7eb",
                            color: data.metaLabelText || "#111827",
                            borderColor: data.metaLabelBorder || "transparent",
                          }}
                        >
                          {data.metaLabel}
                        </span>
                      </div>
                    ) : null}
                    <div>
                      {data.description ?? data.title ?? fallbackTitle}
                    </div>
                  </OneLineScrollableText>
                </div>
                <div className="mt-2 flex h-[28px] min-h-[28px] items-center gap-2 overflow-hidden">
                  {tags.map((tag) => (
                    <button
                      key={tag.key}
                      type="button"
                      title={tag.label}
                      aria-label={tag.label}
                      className="nodrag nopan flex h-7 w-7 items-center justify-center bg-transparent p-0"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <img src={tag.iconSrc} alt="" className="h-7 w-7 object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            ) : data.entityKind === "incident_response_recovery" ? (
              <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-3">
                <OneLineScrollableText className="min-h-0 flex-1 overflow-y-auto pr-1 text-left text-[11px] font-medium leading-[1.35] text-slate-800">
                  {data.metaLabel ? (
                    <div className="mb-2 flex">
                      <span
                        className="inline-flex min-h-[20px] w-full items-center justify-center rounded-[6px] border px-2 py-0.5 text-center text-[10px] font-semibold uppercase tracking-[0.06em] leading-none"
                        style={{
                          backgroundColor: data.metaLabelBg || "#e5e7eb",
                          color: data.metaLabelText || "#111827",
                          borderColor: data.metaLabelBorder || "transparent",
                        }}
                      >
                        {data.metaLabel}
                      </span>
                    </div>
                  ) : null}
                  <div>
                    {data.description ?? data.title ?? fallbackTitle}
                  </div>
                </OneLineScrollableText>
              </div>
            ) : data.entityKind === "incident_finding" ? (
              <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-3">
                <OneLineScrollableText className="min-h-0 flex-1 overflow-y-auto pr-1 text-left text-[11px] font-medium leading-[1.35] text-slate-800">
                  {data.description ?? data.title ?? fallbackTitle}
                </OneLineScrollableText>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-3 pt-3">
                <div className="flex min-h-0 flex-1 overflow-hidden">
                  <OneLineScrollableText className="h-full min-h-0 flex-1 overflow-y-auto pr-1 text-left text-[11px] font-medium leading-[1.35] text-slate-800">
                    {data.description ?? data.title ?? fallbackTitle}
                  </OneLineScrollableText>
                </div>
                <div className="mt-2 flex min-h-[26px] shrink-0 items-center gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.key}
                      type="button"
                      title={tag.label}
                      aria-label={tag.label}
                      className="nodrag nopan flex h-7 w-7 items-center justify-center bg-transparent p-0"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <img src={tag.iconSrc} alt="" className="h-7 w-7 object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            className={`absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white text-slate-900 ${isInfoAnimating ? "[backface-visibility:hidden]" : ""}`}
            style={{
              boxShadow: incidentNodeShadow,
              transform: isInfoAnimating ? "rotateY(180deg)" : undefined,
              visibility: infoOpen || isInfoAnimating ? "visible" : "hidden",
              pointerEvents: infoOpen ? "auto" : "none",
            }}
          >
            <div className="relative flex min-h-[28px] items-center px-4 py-1.5 pr-11 bg-[#111827] text-white">
              <div className="truncate text-[10px] font-semibold uppercase tracking-[0.08em]">
                Node Information
              </div>
              <button
                type="button"
                className="nodrag nopan absolute right-3 top-1/2 flex h-[20px] w-[20px] -translate-y-1/2 items-center justify-center bg-transparent p-0 transition"
                aria-label="Close node information"
                title="Close node information"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  triggerInfoFlip(false);
                }}
              >
                <span
                  aria-hidden="true"
                  className="block h-[20px] w-[20px] bg-white"
                  style={{
                    WebkitMaskImage: "url('/icons/infoicon.svg')",
                    maskImage: "url('/icons/infoicon.svg')",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 px-4 pb-3 pt-2">
              <OneLineScrollableText className="min-h-0 flex-1 overflow-y-auto pr-1 text-left text-[11px] font-medium leading-[1.35] text-slate-800">
                {getNodeInfoText(data)}
              </OneLineScrollableText>
            </div>
          </div>
        </div>
      </div>
      {showDetailToggle ? (
        <button
          type="button"
          className="nodrag nopan absolute right-3 top-full z-[130] mt-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 bg-white transition hover:bg-slate-50"
          style={{ boxShadow: incidentFloatingShadow }}
          aria-label={detailOpen ? "Collapse node details" : "Expand node details"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const nextOpen = !detailOpen;
            setDetailOpen(nextOpen);
            data.onToggleIncidentDetail?.(nextOpen);
          }}
        >
          <img src={detailOpen ? "/icons/collapse.svg" : "/icons/expand.svg"} alt="" className="h-[14px] w-[14px]" />
        </button>
      ) : null}
      {detailOpen && isEvidenceNode && hasEvidencePreview ? (
        <button
          type="button"
          className="nodrag nopan absolute left-0 top-full z-[120] mt-14 w-full cursor-pointer border-0 bg-transparent p-0 text-left"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            data.onOpenEvidenceMedia?.();
          }}
        >
          {isEvidencePdf ? (
            <div className="relative h-56 w-full overflow-hidden bg-transparent">
              {data.evidenceMediaUrl ? (
                <iframe
                  title={evidencePreviewName}
                  src={`${data.evidenceMediaUrl}#page=1&view=FitH&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0`}
                  className="pointer-events-none absolute inset-0 h-full w-[calc(100%+18px)] border-0 bg-white"
                />
              ) : null}
            </div>
          ) : (
            <>
              {imagePreviewErrored ? (
                <div className="flex h-56 w-full items-center justify-center px-3 text-center text-[11px] text-slate-700">
                  Preview unavailable
                </div>
              ) : (
                <div className="relative w-full overflow-hidden bg-transparent" style={{ aspectRatio: `${imageAspectRatio}` }}>
                  <img
                    src={renderImageUrl || data.evidenceMediaUrl || ""}
                    alt={evidencePreviewName}
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
            </>
          )}
        </button>
      ) : null}
      {detailOpen && (!isEvidenceNode || !hasEvidencePreview) && hasTags ? (
        <div
          className="nodrag nopan absolute left-0 right-0 top-full z-[120] mt-14 rounded-[18px] border border-white/70 bg-white/55 px-4 py-4 backdrop-blur-[3px]"
          style={{ boxShadow: incidentFloatingShadow }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        >
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={`${tag.key}-pill`}
                className="flex items-center gap-2 rounded-full border border-white/70 px-3 py-1.5 text-[11px] font-medium text-slate-900"
                style={{ backgroundColor: tag.pillBg, color: tag.pillText }}
              >
                <img src={tag.iconSrc} alt="" className="h-4 w-4" />
                <span>{tag.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IncidentSequenceStepNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <ModernIncidentNode data={data} selected={selected} fallbackTitle="Sequence Step" fallbackType="Sequence Step" />;
}

function IncidentOutcomeNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <ModernIncidentNode data={data} selected={selected} fallbackTitle="Outcome" fallbackType="Outcome" />;
}

function IncidentTaskConditionNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <ModernIncidentNode data={data} selected={selected} fallbackTitle="Task / Condition" fallbackType="Task / Condition" />;
}

function IncidentFactorNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <ModernIncidentNode data={data} selected={selected} fallbackTitle="Factor" fallbackType="Factor" />;
}

function IncidentSystemFactorNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <ModernIncidentNode data={data} selected={selected} fallbackTitle="System Factor" fallbackType="System Factor" />;
}

function IncidentControlBarrierNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <ModernIncidentNode data={data} selected={selected} fallbackTitle="Control / Barrier" fallbackType="Control / Barrier" />;
}

function IncidentEvidenceNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <ModernIncidentNode data={data} selected={selected} fallbackTitle="Evidence" fallbackType="Evidence" />;
}

function IncidentResponseRecoveryNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <ModernIncidentNode data={data} selected={selected} fallbackTitle="Response / Recovery" fallbackType="Response / Recovery" />;
}

function IncidentFindingNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <ModernIncidentNode data={data} selected={selected} fallbackTitle="Finding" fallbackType="Finding" />;
}

function IncidentRecommendationNode({ data, selected }: NodeProps<Node<FlowData>>) {
  return <ModernIncidentNode data={data} selected={selected} fallbackTitle="Recommendation" fallbackType="Recommendation" />;
}

export const flowNodeTypes = {
  documentTile: memo(DocumentTileNode),
  processHeading: memo(ProcessHeadingNode),
  systemCircle: memo(SystemCircleNode),
  processComponent: memo(ProcessComponentNode),
  anchorNode: memo(AnchorNode),
  groupingContainer: memo(GroupingContainerNode),
  stickyNote: memo(StickyNoteNode),
  imageAsset: memo(ImageAssetNode),
  textBox: memo(TextBoxNode),
  flowTable: memo(FlowTableNode),
  flowShapeRectangle: memo(FlowShapeRectangleNode),
  flowShapeCircle: memo(FlowShapeCircleNode),
  flowShapePill: memo(FlowShapePillNode),
  flowShapePentagon: memo(FlowShapePentagonNode),
  flowShapeChevronLeft: memo(FlowShapeChevronLeftNode),
  flowShapeArrow: memo(FlowShapeArrowNode),
  personNode: memo(PersonNode),
  equipmentNode: memo(EquipmentNode),
  environmentNode: memo(EnvironmentNode),
  bowtieHazard: memo(BowtieHazardNode),
  bowtieTopEvent: memo(BowtieTopEventNode),
  bowtieThreat: memo(BowtieThreatNode),
  bowtieConsequence: memo(BowtieConsequenceNode),
  bowtieControl: memo(BowtieControlNode),
  bowtieEscalationFactor: memo(BowtieEscalationFactorNode),
  bowtieRecoveryMeasure: memo(BowtieRecoveryMeasureNode),
  bowtieDegradationIndicator: memo(BowtieDegradationIndicatorNode),
  bowtieRiskRating: memo(BowtieRiskRatingNode),
  incidentSequenceStep: memo(IncidentSequenceStepNode),
  incidentOutcome: memo(IncidentOutcomeNode),
  incidentTaskCondition: memo(IncidentTaskConditionNode),
  incidentFactor: memo(IncidentFactorNode),
  incidentSystemFactor: memo(IncidentSystemFactorNode),
  incidentControlBarrier: memo(IncidentControlBarrierNode),
  incidentEvidence: memo(IncidentEvidenceNode),
  incidentResponseRecovery: memo(IncidentResponseRecoveryNode),
  incidentFinding: memo(IncidentFindingNode),
  incidentRecommendation: memo(IncidentRecommendationNode),
} as const;
