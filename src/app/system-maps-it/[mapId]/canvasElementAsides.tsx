"use client";

import { useEffect, useLayoutEffect, useRef, useState, type DragEvent, type ReactNode, type RefObject } from "react";
import type { CanvasElementRow, DisciplineKey, NodeRelationRow, RelationshipCategory, RelationshipCategoryOption } from "./canvasShared";
import type { MapCategoryId } from "./mapCategories";
import { environmentFactorTypeOptions, getDisplayRelationType } from "./canvasShared";

const formatBowtieOptionLabel = (value: string) =>
  value
    .split("_")
    .map((part) => {
      const normalized = part.trim();
      if (!normalized) return "";
      if (normalized.toLowerCase() === "ppe") return "PPE";
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join(" ");

const calculateBowtieRiskLevel = (likelihoodRaw: string, consequenceRaw: string) => {
  const likelihoodScoreByKey: Record<string, number> = {
    rare: 1,
    unlikely: 2,
    possible: 3,
    likely: 4,
    almost_certain: 5,
  };
  const consequenceScoreByKey: Record<string, number> = {
    insignificant: 1,
    minor: 2,
    moderate: 3,
    major: 4,
    severe: 5,
  };
  const likelihood = likelihoodScoreByKey[likelihoodRaw] ?? 3;
  const consequence = consequenceScoreByKey[consequenceRaw] ?? 3;
  const score = likelihood * consequence;
  if (score <= 4) return "low";
  if (score <= 9) return "medium";
  if (score <= 16) return "high";
  return "extreme";
};

const squarePaletteRows = [
  ["#F7E3E3", "#F4E7DA", "#F2F1D8", "#E2EFD5", "#D7EED8", "#D2EBDD", "#D3EAEA", "#D7E4F0", "#DFDFF1", "#E8DFF1", "#F0DFF0", "#F2DFEA", "#FFFFFF"],
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

type AsideShellProps = {
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  title: string;
  onClose: () => void;
  readOnly?: boolean;
  children: ReactNode;
};

type FontSizePickerProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly number[];
};

type PaletteSwatchGridProps = {
  selectedColor: string;
  swatchKeyPrefix: string;
  onSelect: (hex: string) => void;
};

const descriptionTextareaMinLines = 3;
const descriptionTextareaMaxLines = 8;

function getTextareaBoxMetrics(textarea: HTMLTextAreaElement) {
  const computedStyle = window.getComputedStyle(textarea);
  const fontSize = Number.parseFloat(computedStyle.fontSize);
  const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight);
  const lineHeight = Number.isFinite(parsedLineHeight) && parsedLineHeight > 0
    ? parsedLineHeight
    : Number.isFinite(fontSize) && fontSize > 0
    ? fontSize * 1.5
    : 20;
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
  const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0;
  const chromeHeight = paddingTop + paddingBottom + borderTop + borderBottom;

  return {
    minHeight: Math.ceil(lineHeight * descriptionTextareaMinLines + chromeHeight),
    maxHeight: Math.ceil(lineHeight * descriptionTextareaMaxLines + chromeHeight),
  };
}

function resizeDescriptionTextarea(textarea: HTMLTextAreaElement) {
  const { minHeight, maxHeight } = getTextareaBoxMetrics(textarea);
  textarea.style.minHeight = `${minHeight}px`;
  textarea.style.maxHeight = `${maxHeight}px`;
  textarea.style.height = "auto";
  const nextHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}

function AutosizingDescriptionTextarea({
  value,
  onChange,
  placeholder,
  className = "mt-1 w-full resize-y rounded border border-slate-300 bg-white px-3 py-2 leading-5 text-black",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    if (textareaRef.current) resizeDescriptionTextarea(textareaRef.current);
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className={className}
      rows={descriptionTextareaMinLines}
      value={value}
      onChange={(event) => {
        const textarea = event.currentTarget;
        onChange(textarea.value);
        window.requestAnimationFrame(() => resizeDescriptionTextarea(textarea));
      }}
      placeholder={placeholder}
    />
  );
}

function FontSizePicker({ value, onChange, options }: FontSizePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedValue = options.find((option) => String(option) === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && rootRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left text-black shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="text-sm font-medium">{selectedValue}px</span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 text-slate-500 transition ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded border border-slate-200 bg-white py-1 shadow-[0_12px_28px_rgba(15,23,42,0.18)]">
          {options.map((size) => {
            const active = String(size) === value;
            return (
              <button
                key={size}
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  active ? "bg-sky-50 text-black" : "text-black hover:bg-slate-50"
                }`}
                onClick={() => {
                  onChange(String(size));
                  setOpen(false);
                }}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center text-sky-600">
                  {active ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path d="M5 12l4 4L19 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
                <span>{size}px</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function PaletteSwatchGrid({ selectedColor, swatchKeyPrefix, onSelect }: PaletteSwatchGridProps) {
  return (
    <div className="mt-2 w-full p-[2px]">
      {squarePaletteRows.map((row, rowIndex) => (
        <div
          key={`${swatchKeyPrefix}-row-${rowIndex}`}
          className="grid"
          style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
        >
          {row.map((hex, colIndex) => {
            const selected = selectedColor.toLowerCase() === hex.toLowerCase();
            const isTopRow = rowIndex === 0;
            const isBottomRow = rowIndex === squarePaletteRows.length - 1;
            const isFirstCol = colIndex === 0;
            const isLastCol = colIndex === row.length - 1;
            const cornerClassName =
              isTopRow && isFirstCol
                ? "rounded-tl-[10px]"
                : isTopRow && isLastCol
                ? "rounded-tr-[10px]"
                : isBottomRow && isFirstCol
                ? "rounded-bl-[10px]"
                : isBottomRow && isLastCol
                ? "rounded-br-[10px]"
                : "";
            return (
              <button
                key={`${swatchKeyPrefix}-${rowIndex}-${colIndex}`}
                type="button"
                className={`aspect-square w-full border ${cornerClassName} ${selected ? "ring-2 ring-black ring-inset" : ""} ${
                  hex.toLowerCase() === "#ffffff" ? "border-slate-300" : "border-transparent"
                }`}
                style={{ backgroundColor: hex }}
                onClick={() => onSelect(hex)}
                title={hex}
                aria-label={hex}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

type DualPaletteSelectorProps = {
  backgroundColor: string;
  outlineColor: string;
  activeTarget: "background" | "outline" | null;
  onToggleTarget: (target: "background" | "outline") => void;
  onSelect: (target: "background" | "outline", hex: string) => void;
  swatchKeyPrefix: string;
};

function DualPaletteSelector({ backgroundColor, outlineColor, activeTarget, onToggleTarget, onSelect, swatchKeyPrefix }: DualPaletteSelectorProps) {
  const activePaletteColor = activeTarget === "outline" ? outlineColor : backgroundColor;
  return (
    <div className="text-sm text-white">
      <div className="mb-2">Colours</div>
      <div className="grid grid-cols-[auto_72px_auto_72px] items-center gap-x-3 gap-y-2">
        <span>Background</span>
        <button
          type="button"
          className={`h-9 w-[72px] rounded-[8px] border transition ${activeTarget === "background" ? "border-white ring-2 ring-white/80" : "border-white/40"}`}
          style={{ backgroundColor }}
          onClick={() => onToggleTarget("background")}
          aria-label="Select background colour"
          title="Select background colour"
        />
        <span>Outline</span>
        <button
          type="button"
          className={`h-9 w-[72px] rounded-[8px] border transition ${activeTarget === "outline" ? "border-white ring-2 ring-white/80" : "border-white/40"}`}
          style={{ backgroundColor: outlineColor }}
          onClick={() => onToggleTarget("outline")}
          aria-label="Select outline colour"
          title="Select outline colour"
        />
      </div>
      {activeTarget ? (
        <div className="mt-3">
          <PaletteSwatchGrid
            selectedColor={activePaletteColor}
            swatchKeyPrefix={`${swatchKeyPrefix}-${activeTarget}-swatch`}
            onSelect={(hex) => onSelect(activeTarget, hex)}
          />
        </div>
      ) : null}
    </div>
  );
}

function OutlineWeightField({ value, onChange, label = "Outline Weight (max 12)" }: { value: string; onChange: (value: string) => void; label?: string }) {
  const outlineWeightValue = (() => {
    const parsed = Number(value.trim());
    if (!Number.isFinite(parsed)) return 1;
    return Math.max(1, Math.min(12, Math.round(parsed)));
  })();
  return (
    <label className="text-sm text-white">{label}
      <div className="mt-1 flex items-stretch">
        <input
          type="text"
          inputMode="numeric"
          className="w-full rounded-l border border-slate-300 bg-white px-3 py-2 text-black"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex w-9 flex-col">
          <button
            type="button"
            aria-label="Increase outline weight"
            className="flex h-1/2 items-center justify-center rounded-tr border border-l-0 border-slate-300 bg-white text-black hover:bg-slate-100"
            onClick={() => onChange(String(Math.min(12, outlineWeightValue + 1)))}
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
              <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Decrease outline weight"
            className="flex h-1/2 items-center justify-center rounded-br border border-l-0 border-t-0 border-slate-300 bg-white text-black hover:bg-slate-100"
            onClick={() => onChange(String(Math.max(1, outlineWeightValue - 1)))}
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
              <path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </label>
  );
}

function AsideShell({ isMobile, leftAsideSlideIn, title, onClose, readOnly = false, children }: AsideShellProps) {
  return (
    <aside
      data-read-only={readOnly ? "true" : undefined}
      className={`canvas-left-aside fixed border-r border-[#0b1f33] bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)] transition-transform duration-300 ${
        isMobile ? "inset-0 z-[98] w-full max-w-full" : "bottom-4 left-[98px] top-[82px] z-[75] w-[calc(100vw-122px)] max-w-[408px] rounded-[28px] border"
      }`}
      style={{ transform: isMobile ? "translateX(0)" : leftAsideSlideIn ? "translateX(0)" : "translateX(-100%)" }}
    >
      <div className="canvas-left-aside__body flex h-full flex-col overflow-auto p-4">
        <div className="canvas-left-aside__header flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
          <h2 className="canvas-left-aside__title text-lg font-semibold text-white">{title}</h2>
          <button className="canvas-left-aside__close w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={onClose}>Close</button>
        </div>
        <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0 disabled:opacity-100">
          {children}
        </fieldset>
      </div>
    </aside>
  );
}

const disabledAsideActionClass =
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-white disabled:hover:text-black";

function wrapWithReason(reason: string | undefined, content: ReactNode) {
  return reason ? <span title={reason}>{content}</span> : <>{content}</>;
}

type CategoryPropertiesAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  processHeadingDraft: string;
  setProcessHeadingDraft: (value: string) => void;
  processFontSizeDraft: string;
  setProcessFontSizeDraft: (value: string) => void;
  processFillModeDraft: "fill" | "outline";
  setProcessFillModeDraft: (value: "fill" | "outline") => void;
  processOutlineColorDraft: string | null;
  setProcessOutlineColorDraft: (updater: (prev: string | null) => string | null) => void;
  processOutlineWidthDraft: string;
  setProcessOutlineWidthDraft: (value: string) => void;
  categoryColorOptions: ReadonlyArray<{ name: string; value: string }>;
  processColorDraft: string | null;
  setProcessColorDraft: (updater: (prev: string | null) => string | null) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  actionDisabledReason?: string;
};

export function CategoryPropertiesAside({
  open,
  isMobile,
  leftAsideSlideIn,
  processHeadingDraft,
  setProcessHeadingDraft,
  processFontSizeDraft,
  setProcessFontSizeDraft,
  processFillModeDraft,
  setProcessFillModeDraft,
  processOutlineColorDraft,
  setProcessOutlineColorDraft,
  processOutlineWidthDraft,
  setProcessOutlineWidthDraft,
  categoryColorOptions: _categoryColorOptions,
  processColorDraft,
  setProcessColorDraft,
  onDelete,
  onSave,
  onClose,
  actionDisabledReason,
}: CategoryPropertiesAsideProps) {
  if (!open) return null;
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(processColorDraft ?? "") ? String(processColorDraft).toUpperCase() : "#249BC7";
  const safeOutlineColor = /^#[0-9a-fA-F]{6}$/.test(processOutlineColorDraft ?? "") ? String(processOutlineColorDraft).toUpperCase() : safeColor;
  const [activePaletteTarget, setActivePaletteTarget] = useState<"background" | "outline" | null>(null);
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Category Properties" onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-4 space-y-3">
        <label className="text-sm text-white">Category Label
          <input
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            value={processHeadingDraft}
            onChange={(e) => setProcessHeadingDraft(e.target.value)}
            placeholder="Enter category label"
          />
        </label>
        <label className="text-sm text-white">Text Size
          <FontSizePicker
            value={processFontSizeDraft}
            onChange={setProcessFontSizeDraft}
            options={[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 56, 72]}
          />
        </label>
        <div className="text-sm text-white">
          <div>Category Style</div>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded-none border px-2 py-2 text-sm ${processFillModeDraft === "fill" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
              onClick={() => setProcessFillModeDraft("fill")}
            >
              Infilled
            </button>
            <button
              type="button"
              className={`rounded-none border px-2 py-2 text-sm ${processFillModeDraft === "outline" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
              onClick={() => setProcessFillModeDraft("outline")}
            >
              Outlined
            </button>
          </div>
        </div>
        <DualPaletteSelector
          backgroundColor={safeColor}
          outlineColor={safeOutlineColor}
          activeTarget={activePaletteTarget}
          onToggleTarget={(target) => setActivePaletteTarget((prev) => (prev === target ? null : target))}
          onSelect={(target, hex) => {
            if (target === "outline") {
              setProcessOutlineColorDraft(() => hex);
            } else {
              setProcessColorDraft(() => hex);
            }
            setActivePaletteTarget(null);
          }}
          swatchKeyPrefix="category"
        />
        <OutlineWeightField value={processOutlineWidthDraft} onChange={setProcessOutlineWidthDraft} />
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button
          className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`}
          onClick={() => void onDelete()}
          disabled={!!actionDisabledReason}
        >
          Delete category
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button
            className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`}
            onClick={() => void onSave()}
            disabled={!!actionDisabledReason}
          >
            Save category
          </button>
        )}
      </div>
    </AsideShell>
  );
}

type SimpleLabelAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  title: string;
  fieldLabel: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  deleteButtonLabel: string;
  saveButtonLabel: string;
  topAction?: ReactNode;
  footerExtra?: ReactNode;
  actionDisabledReason?: string;
};

function SimpleLabelAside({
  open,
  isMobile,
  leftAsideSlideIn,
  title,
  fieldLabel,
  value,
  placeholder,
  onChange,
  onDelete,
  onSave,
  onClose,
  deleteButtonLabel,
  saveButtonLabel,
  topAction,
  footerExtra,
  actionDisabledReason,
}: SimpleLabelAsideProps) {
  if (!open) return null;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title={title} onClose={onClose} readOnly={!!actionDisabledReason}>
      {topAction ? <div className="mt-3">{topAction}</div> : null}
      <div className="mt-4 space-y-3">
        <label className="text-sm text-white">{fieldLabel}
          <input
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </label>
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button
          className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`}
          onClick={() => void onDelete()}
          disabled={!!actionDisabledReason}
        >
          {deleteButtonLabel}
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button
            className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`}
            onClick={() => void onSave()}
            disabled={!!actionDisabledReason}
          >
            {saveButtonLabel}
          </button>
        )}
      </div>
      {footerExtra}
    </AsideShell>
  );
}

type SystemPropertiesAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  systemNameDraft: string;
  setSystemNameDraft: (value: string) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  onAddRelationship: () => void;
  relatedRows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
  actionDisabledReason?: string;
};

export function SystemPropertiesAside(props: SystemPropertiesAsideProps) {
  return (
    <SimpleLabelAside
      open={props.open}
      isMobile={props.isMobile}
      leftAsideSlideIn={props.leftAsideSlideIn}
      title="System Properties"
      fieldLabel="System Name"
      value={props.systemNameDraft}
      placeholder="Enter system name"
      onChange={props.setSystemNameDraft}
      onDelete={props.onDelete}
      onSave={props.onSave}
      onClose={props.onClose}
      actionDisabledReason={props.actionDisabledReason}
      deleteButtonLabel="Delete system"
      saveButtonLabel="Save name"
    />
  );
}

type ProcessPropertiesAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  processComponentLabelDraft: string;
  setProcessComponentLabelDraft: (value: string) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  onAddRelationship: () => void;
  relatedRows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
  actionDisabledReason?: string;
};

export function ProcessPropertiesAside(props: ProcessPropertiesAsideProps) {
  return (
    <SimpleLabelAside
      open={props.open}
      isMobile={props.isMobile}
      leftAsideSlideIn={props.leftAsideSlideIn}
      title="Process Properties"
      fieldLabel="Process Label"
      value={props.processComponentLabelDraft}
      placeholder="Enter process label"
      onChange={props.setProcessComponentLabelDraft}
      onDelete={props.onDelete}
      onSave={props.onSave}
      onClose={props.onClose}
      actionDisabledReason={props.actionDisabledReason}
      deleteButtonLabel="Delete process"
      saveButtonLabel="Save label"
    />
  );
}

type StickyNoteAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  stickyTextDraft: string;
  setStickyTextDraft: (value: string) => void;
  stickyBackgroundColorDraft: string;
  setStickyBackgroundColorDraft: (value: string) => void;
  stickyOutlineColorDraft: string;
  setStickyOutlineColorDraft: (value: string) => void;
  stickyFillModeDraft: "fill" | "outline";
  setStickyFillModeDraft: (value: "fill" | "outline") => void;
  stickyOutlineWidthDraft: string;
  setStickyOutlineWidthDraft: (value: string) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  actionDisabledReason?: string;
};

export function StickyNoteAside({
  open,
  isMobile,
  leftAsideSlideIn,
  stickyTextDraft,
  setStickyTextDraft,
  stickyBackgroundColorDraft,
  setStickyBackgroundColorDraft,
  stickyOutlineColorDraft,
  setStickyOutlineColorDraft,
  stickyFillModeDraft,
  setStickyFillModeDraft,
  stickyOutlineWidthDraft,
  setStickyOutlineWidthDraft,
  onDelete,
  onSave,
  onClose,
  actionDisabledReason,
}: StickyNoteAsideProps) {
  if (!open) return null;
  const safeBackgroundColor = /^#[0-9a-fA-F]{6}$/.test(stickyBackgroundColorDraft) ? stickyBackgroundColorDraft.toUpperCase() : "#FEF08A";
  const safeOutlineColor = /^#[0-9a-fA-F]{6}$/.test(stickyOutlineColorDraft) ? stickyOutlineColorDraft.toUpperCase() : "#F59E0B";
  const [activePaletteTarget, setActivePaletteTarget] = useState<"background" | "outline" | null>(null);
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Sticky Note" onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-4 space-y-3">
        <label className="text-sm text-white">Note Text
          <textarea
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            rows={8}
            value={stickyTextDraft}
            onChange={(e) => setStickyTextDraft(e.target.value)}
            placeholder="Enter sticky note text"
          />
        </label>
        <div className="text-sm text-white">
          <div>Sticky Style</div>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded-none border px-2 py-2 text-sm ${stickyFillModeDraft === "fill" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
              onClick={() => setStickyFillModeDraft("fill")}
            >
              Infilled
            </button>
            <button
              type="button"
              className={`rounded-none border px-2 py-2 text-sm ${stickyFillModeDraft === "outline" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
              onClick={() => setStickyFillModeDraft("outline")}
            >
              Outlined
            </button>
          </div>
        </div>
        <DualPaletteSelector
          backgroundColor={safeBackgroundColor}
          outlineColor={safeOutlineColor}
          activeTarget={activePaletteTarget}
          onToggleTarget={(target) => setActivePaletteTarget((prev) => (prev === target ? null : target))}
          onSelect={(target, hex) => {
            if (target === "outline") {
              setStickyOutlineColorDraft(hex);
            } else {
              setStickyBackgroundColorDraft(hex);
            }
            setActivePaletteTarget(null);
          }}
          swatchKeyPrefix="sticky"
        />
        <OutlineWeightField value={stickyOutlineWidthDraft} onChange={setStickyOutlineWidthDraft} />
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button
          className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`}
          onClick={() => void onDelete()}
          disabled={!!actionDisabledReason}
        >
          Delete note
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onSave()} disabled={!!actionDisabledReason}>Save note</button>
        )}
      </div>
    </AsideShell>
  );
}

type ImageAssetAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  imageDescriptionDraft: string;
  setImageDescriptionDraft: (value: string) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  onAddRelationship: () => void;
  relatedRows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
  actionDisabledReason?: string;
};

export function ImageAssetAside({
  open,
  isMobile,
  leftAsideSlideIn,
  imageDescriptionDraft,
  setImageDescriptionDraft,
  onDelete,
  onSave,
  onClose,
  onAddRelationship,
  relatedRows,
  resolveLabels,
  relationshipSectionProps,
  actionDisabledReason,
}: ImageAssetAsideProps) {
  if (!open) return null;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Image Properties" onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-4 space-y-3">
        <label className="text-sm text-white">Image Description
          <AutosizingDescriptionTextarea
            value={imageDescriptionDraft}
            onChange={setImageDescriptionDraft}
            placeholder="Enter image description"
          />
        </label>
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button
          className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`}
          onClick={() => void onDelete()}
          disabled={!!actionDisabledReason}
        >
          Delete image
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onSave()} disabled={!!actionDisabledReason}>
            Save image
          </button>
        )}
      </div>
    </AsideShell>
  );
}

type TextBoxAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  textBoxContentDraft: string;
  setTextBoxContentDraft: (value: string) => void;
  textBoxBoldDraft: boolean;
  setTextBoxBoldDraft: (value: boolean) => void;
  textBoxItalicDraft: boolean;
  setTextBoxItalicDraft: (value: boolean) => void;
  textBoxUnderlineDraft: boolean;
  setTextBoxUnderlineDraft: (value: boolean) => void;
  textBoxAlignDraft: "left" | "center" | "right";
  setTextBoxAlignDraft: (value: "left" | "center" | "right") => void;
  textBoxFontSizeDraft: string;
  setTextBoxFontSizeDraft: (value: string) => void;
  textBoxBackgroundColorDraft: string;
  setTextBoxBackgroundColorDraft: (value: string) => void;
  textBoxOutlineDraft: boolean;
  setTextBoxOutlineDraft: (value: boolean) => void;
  textBoxOutlineColorDraft: string;
  setTextBoxOutlineColorDraft: (value: string) => void;
  textBoxOutlineWidthDraft: string;
  setTextBoxOutlineWidthDraft: (value: string) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  actionDisabledReason?: string;
};

export function TextBoxAside({
  open,
  isMobile,
  leftAsideSlideIn,
  textBoxContentDraft,
  setTextBoxContentDraft,
  textBoxBoldDraft,
  setTextBoxBoldDraft,
  textBoxItalicDraft,
  setTextBoxItalicDraft,
  textBoxUnderlineDraft,
  setTextBoxUnderlineDraft,
  textBoxAlignDraft,
  setTextBoxAlignDraft,
  textBoxFontSizeDraft,
  setTextBoxFontSizeDraft,
  textBoxBackgroundColorDraft,
  setTextBoxBackgroundColorDraft,
  textBoxOutlineDraft,
  setTextBoxOutlineDraft,
  textBoxOutlineColorDraft,
  setTextBoxOutlineColorDraft,
  textBoxOutlineWidthDraft,
  setTextBoxOutlineWidthDraft,
  onDelete,
  onSave,
  onClose,
  actionDisabledReason,
}: TextBoxAsideProps) {
  if (!open) return null;
  const textSizeOptions = [16, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 84, 96, 112, 128, 144, 168];
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(textBoxBackgroundColorDraft) ? textBoxBackgroundColorDraft.toUpperCase() : "#FFFFFF";
  const safeOutlineColor = /^#[0-9a-fA-F]{6}$/.test(textBoxOutlineColorDraft) ? textBoxOutlineColorDraft.toUpperCase() : "#111827";
  const [activePaletteTarget, setActivePaletteTarget] = useState<"background" | "outline" | null>(null);
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Text Box" onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-4 space-y-3">
        <label className="text-sm text-white">Text
          <textarea
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            rows={8}
            value={textBoxContentDraft}
            onChange={(e) => setTextBoxContentDraft(e.target.value)}
            placeholder="Enter text"
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" className={`rounded-none border px-2 py-2 text-sm ${textBoxBoldDraft ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`} onClick={() => setTextBoxBoldDraft(!textBoxBoldDraft)}>Bold</button>
          <button type="button" className={`rounded-none border px-2 py-2 text-sm ${textBoxItalicDraft ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`} onClick={() => setTextBoxItalicDraft(!textBoxItalicDraft)}>Italic</button>
          <button type="button" className={`rounded-none border px-2 py-2 text-sm ${textBoxUnderlineDraft ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`} onClick={() => setTextBoxUnderlineDraft(!textBoxUnderlineDraft)}>Underline</button>
        </div>
        <div className="text-sm text-white">
          <div>Text Alignment</div>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <button
              type="button"
              aria-label="Align left"
              className={`flex items-center justify-center rounded-none border px-2 py-2 ${textBoxAlignDraft === "left" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
              onClick={() => setTextBoxAlignDraft("left")}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M4 6h14M4 10h10M4 14h14M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Align center"
              className={`flex items-center justify-center rounded-none border px-2 py-2 ${textBoxAlignDraft === "center" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
              onClick={() => setTextBoxAlignDraft("center")}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M5 6h14M7 10h10M5 14h14M7 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Align right"
              className={`flex items-center justify-center rounded-none border px-2 py-2 ${textBoxAlignDraft === "right" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
              onClick={() => setTextBoxAlignDraft("right")}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6h14M10 10h10M6 14h14M10 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
          <label className="text-sm text-white">Text Size (16px to 168px)
            <FontSizePicker value={textBoxFontSizeDraft} onChange={setTextBoxFontSizeDraft} options={textSizeOptions} />
          </label>
          <div className="text-sm text-white">
            <div>Border</div>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                className={`rounded-none border px-3 py-2 text-sm whitespace-nowrap ${textBoxOutlineDraft ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
                onClick={() => setTextBoxOutlineDraft(!textBoxOutlineDraft)}
              >
                {textBoxOutlineDraft ? "Outline On" : "Outline Off"}
              </button>
            </div>
          </div>
        </div>
        <DualPaletteSelector
          backgroundColor={safeColor}
          outlineColor={safeOutlineColor}
          activeTarget={activePaletteTarget}
          onToggleTarget={(target) => setActivePaletteTarget((prev) => (prev === target ? null : target))}
          onSelect={(target, hex) => {
            if (target === "outline") {
              setTextBoxOutlineColorDraft(hex);
            } else {
              setTextBoxBackgroundColorDraft(hex);
            }
            setActivePaletteTarget(null);
          }}
          swatchKeyPrefix="textbox"
        />
        <OutlineWeightField value={textBoxOutlineWidthDraft} onChange={setTextBoxOutlineWidthDraft} />
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button
          className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`}
          onClick={() => void onDelete()}
          disabled={!!actionDisabledReason}
        >
          Delete text box
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onSave()} disabled={!!actionDisabledReason}>
            Save text
          </button>
        )}
      </div>
    </AsideShell>
  );
}

type FlowShapeAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  title: string;
  shapeTextDraft: string;
  setShapeTextDraft: (value: string) => void;
  shapeAlignDraft: "left" | "center" | "right";
  setShapeAlignDraft: (value: "left" | "center" | "right") => void;
  shapeBoldDraft: boolean;
  setShapeBoldDraft: (value: boolean) => void;
  shapeItalicDraft: boolean;
  setShapeItalicDraft: (value: boolean) => void;
  shapeUnderlineDraft: boolean;
  setShapeUnderlineDraft: (value: boolean) => void;
  shapeFontSizeDraft: string;
  setShapeFontSizeDraft: (value: string) => void;
  shapeColorDraft: string;
  setShapeColorDraft: (value: string) => void;
  shapeFillModeDraft: "fill" | "outline";
  setShapeFillModeDraft: (value: "fill" | "outline") => void;
  shapeOutlineColorDraft: string;
  setShapeOutlineColorDraft: (value: string) => void;
  shapeOutlineWidthDraft: string;
  setShapeOutlineWidthDraft: (value: string) => void;
  supportsText: boolean;
  canFlipDirection: boolean;
  shapeDirectionDraft: "left" | "right";
  setShapeDirectionDraft: (value: "left" | "right") => void;
  canRotate: boolean;
  shapeRotationDraft: 0 | 90 | 180 | 270;
  setShapeRotationDraft: (value: 0 | 90 | 180 | 270) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  actionDisabledReason?: string;
};

type TableAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  tableRowsDraft: string;
  setTableRowsDraft: (value: string) => void;
  tableColumnsDraft: string;
  setTableColumnsDraft: (value: string) => void;
  tableHeaderBgDraft: string;
  setTableHeaderBgDraft: (value: string) => void;
  tableBoldDraft: boolean;
  setTableBoldDraft: (value: boolean) => void;
  tableItalicDraft: boolean;
  setTableItalicDraft: (value: boolean) => void;
  tableUnderlineDraft: boolean;
  setTableUnderlineDraft: (value: boolean) => void;
  tableAlignDraft: "left" | "center" | "right";
  setTableAlignDraft: (value: "left" | "center" | "right") => void;
  tableFontSizeDraft: string;
  setTableFontSizeDraft: (value: string) => void;
  tableGridLineColorDraft: string;
  setTableGridLineColorDraft: (value: string) => void;
  tableGridLineWeightDraft: string;
  setTableGridLineWeightDraft: (value: string) => void;
  tableMinRows: number;
  tableMinColumns: number;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  actionDisabledReason?: string;
};

export function TableAside({
  open,
  isMobile,
  leftAsideSlideIn,
  tableRowsDraft,
  setTableRowsDraft,
  tableColumnsDraft,
  setTableColumnsDraft,
  tableHeaderBgDraft,
  setTableHeaderBgDraft,
  tableGridLineColorDraft,
  setTableGridLineColorDraft,
  tableGridLineWeightDraft,
  setTableGridLineWeightDraft,
  tableMinRows,
  tableMinColumns,
  onDelete,
  onSave,
  onClose,
  actionDisabledReason,
}: TableAsideProps) {
  if (!open) return null;
  const parsePositiveInt = (value: string, fallback: number) => {
    const parsed = Number(value.trim());
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.floor(parsed));
  };
  const rowValue = parsePositiveInt(tableRowsDraft, tableMinRows);
  const columnValue = parsePositiveInt(tableColumnsDraft, tableMinColumns);
  const bumpRows = (delta: number) => {
    const next = Math.max(tableMinRows, rowValue + delta);
    setTableRowsDraft(String(next));
  };
  const bumpColumns = (delta: number) => {
    const next = Math.max(tableMinColumns, columnValue + delta);
    setTableColumnsDraft(String(next));
  };
  const safeGridLineColor = /^#[0-9a-fA-F]{6}$/.test(tableGridLineColorDraft) ? tableGridLineColorDraft.toUpperCase() : "#94A3B8";
  const parsedGridWeight = Number(tableGridLineWeightDraft.trim());
  const gridLineWeightValue = Number.isFinite(parsedGridWeight) ? Math.max(0.5, Math.min(6, Math.round(parsedGridWeight * 2) / 2)) : 0.5;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Table Properties" onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-white">Rows (min {tableMinRows})
            <div className="mt-1 flex items-stretch">
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded-l border border-slate-300 bg-white px-3 py-2 text-black"
                value={tableRowsDraft}
                onChange={(e) => setTableRowsDraft(e.target.value)}
              />
              <div className="flex w-9 flex-col">
                <button
                  type="button"
                  aria-label="Increase rows"
                  className="flex h-1/2 items-center justify-center rounded-tr border border-l-0 border-slate-300 bg-white text-black hover:bg-slate-100"
                  onClick={() => bumpRows(1)}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                    <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Decrease rows"
                  className="flex h-1/2 items-center justify-center rounded-br border border-l-0 border-t-0 border-slate-300 bg-white text-black hover:bg-slate-100"
                  onClick={() => bumpRows(-1)}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                    <path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </label>
          <label className="text-sm text-white">Columns (min {tableMinColumns})
            <div className="mt-1 flex items-stretch">
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded-l border border-slate-300 bg-white px-3 py-2 text-black"
                value={tableColumnsDraft}
                onChange={(e) => setTableColumnsDraft(e.target.value)}
              />
              <div className="flex w-9 flex-col">
                <button
                  type="button"
                  aria-label="Increase columns"
                  className="flex h-1/2 items-center justify-center rounded-tr border border-l-0 border-slate-300 bg-white text-black hover:bg-slate-100"
                  onClick={() => bumpColumns(1)}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                    <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Decrease columns"
                  className="flex h-1/2 items-center justify-center rounded-br border border-l-0 border-t-0 border-slate-300 bg-white text-black hover:bg-slate-100"
                  onClick={() => bumpColumns(-1)}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                    <path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </label>
        </div>
        <div className="text-sm text-white">
          <div className="mb-2">Table Line Colour</div>
          <PaletteSwatchGrid selectedColor={safeGridLineColor} swatchKeyPrefix="table-grid-line" onSelect={setTableGridLineColorDraft} />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              className="h-10 w-14 rounded-none border border-slate-300 bg-white p-1"
              value={safeGridLineColor}
              onChange={(e) => setTableGridLineColorDraft(e.target.value.toUpperCase())}
            />
            <input
              type="text"
              className="h-10 w-full rounded border border-slate-300 bg-white px-3 py-2 font-mono text-black"
              value={tableGridLineColorDraft}
              onChange={(e) => setTableGridLineColorDraft(e.target.value.toUpperCase())}
              placeholder="#94A3B8"
            />
          </div>
        </div>
        <label className="text-sm text-white">Line Weight (max 6)
          <div className="mt-1 flex items-stretch">
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-l border border-slate-300 bg-white px-3 py-2 text-black"
              value={tableGridLineWeightDraft}
              onChange={(e) => setTableGridLineWeightDraft(e.target.value)}
            />
            <div className="flex w-9 flex-col">
              <button
                type="button"
                aria-label="Increase line weight"
                className="flex h-1/2 items-center justify-center rounded-tr border border-l-0 border-slate-300 bg-white text-black hover:bg-slate-100"
                onClick={() => setTableGridLineWeightDraft(String(Math.min(6, gridLineWeightValue + 0.5)))}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                  <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Decrease line weight"
                className="flex h-1/2 items-center justify-center rounded-br border border-l-0 border-t-0 border-slate-300 bg-white text-black hover:bg-slate-100"
                onClick={() => setTableGridLineWeightDraft(String(Math.max(0.5, gridLineWeightValue - 0.5)))}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                  <path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </label>
        <button
          type="button"
          className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
          onClick={() => {
            setTableGridLineColorDraft("");
            setTableGridLineWeightDraft("0.5");
          }}
        >
          Reset table lines
        </button>
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onDelete()} disabled={!!actionDisabledReason}>
          Delete table
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onSave()} disabled={!!actionDisabledReason}>
            Save table
          </button>
        )}
      </div>
    </AsideShell>
  );
}

export function FlowShapeAside({
  open,
  isMobile,
  leftAsideSlideIn,
  title,
  shapeTextDraft,
  setShapeTextDraft,
  shapeAlignDraft,
  setShapeAlignDraft,
  shapeBoldDraft,
  setShapeBoldDraft,
  shapeItalicDraft,
  setShapeItalicDraft,
  shapeUnderlineDraft,
  setShapeUnderlineDraft,
  shapeFontSizeDraft,
  setShapeFontSizeDraft,
  shapeColorDraft,
  setShapeColorDraft,
  shapeFillModeDraft,
  setShapeFillModeDraft,
  shapeOutlineColorDraft,
  setShapeOutlineColorDraft,
  shapeOutlineWidthDraft,
  setShapeOutlineWidthDraft,
  supportsText,
  canFlipDirection,
  shapeDirectionDraft,
  setShapeDirectionDraft,
  canRotate,
  shapeRotationDraft,
  setShapeRotationDraft,
  onDelete,
  onSave,
  onClose,
  actionDisabledReason,
}: FlowShapeAsideProps) {
  if (!open) return null;
  const textSizeOptions = [16, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 84, 96, 112, 128, 144, 168];
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(shapeColorDraft) ? shapeColorDraft : "#249BC7";
  const safeOutlineColor = /^#[0-9a-fA-F]{6}$/.test(shapeOutlineColorDraft) ? shapeOutlineColorDraft.toUpperCase() : safeColor.toUpperCase();
  const [activePaletteTarget, setActivePaletteTarget] = useState<"background" | "outline" | null>(null);
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title={title} onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-4 space-y-3">
        {supportsText ? (
          <>
            <label className="text-sm text-white">Shape Text
              <textarea
                className="mt-1 min-h-[90px] w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={shapeTextDraft}
                onChange={(e) => setShapeTextDraft(e.target.value)}
                placeholder="Enter shape text"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
                <button type="button" className={`rounded-none border px-2 py-2 text-sm ${shapeBoldDraft ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`} onClick={() => setShapeBoldDraft(!shapeBoldDraft)}>Bold</button>
                <button type="button" className={`rounded-none border px-2 py-2 text-sm ${shapeItalicDraft ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`} onClick={() => setShapeItalicDraft(!shapeItalicDraft)}>Italic</button>
                <button type="button" className={`rounded-none border px-2 py-2 text-sm ${shapeUnderlineDraft ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`} onClick={() => setShapeUnderlineDraft(!shapeUnderlineDraft)}>Underline</button>
            </div>
            <div className="text-sm text-white">
              <div>Text Alignment</div>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  aria-label="Align left"
                  className={`flex items-center justify-center rounded-none border px-2 py-2 ${shapeAlignDraft === "left" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
                  onClick={() => setShapeAlignDraft("left")}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path d="M4 6h14M4 10h10M4 14h14M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Align center"
                  className={`flex items-center justify-center rounded-none border px-2 py-2 ${shapeAlignDraft === "center" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
                  onClick={() => setShapeAlignDraft("center")}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path d="M5 6h14M7 10h10M5 14h14M7 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Align right"
                  className={`flex items-center justify-center rounded-none border px-2 py-2 ${shapeAlignDraft === "right" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
                  onClick={() => setShapeAlignDraft("right")}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path d="M6 6h14M10 10h10M6 14h14M10 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <label className="text-sm text-white">Text Size (16px to 168px)
              <FontSizePicker value={shapeFontSizeDraft} onChange={setShapeFontSizeDraft} options={textSizeOptions} />
            </label>
          </>
        ) : null}
        <div className="text-sm text-white">
          <div>Shape Style</div>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded-none border px-2 py-2 text-sm ${shapeFillModeDraft === "fill" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
              onClick={() => setShapeFillModeDraft("fill")}
            >
              Infilled
            </button>
            <button
              type="button"
              className={`rounded-none border px-2 py-2 text-sm ${shapeFillModeDraft === "outline" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
              onClick={() => setShapeFillModeDraft("outline")}
            >
              Outlined
            </button>
          </div>
        </div>
        {canFlipDirection ? (
          <div className="text-sm text-white">
            <div>Direction</div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded-none border px-2 py-2 text-sm ${shapeDirectionDraft === "left" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
                onClick={() => setShapeDirectionDraft("left")}
              >
                Left
              </button>
              <button
                type="button"
                className={`rounded-none border px-2 py-2 text-sm ${shapeDirectionDraft === "right" ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`}
                onClick={() => setShapeDirectionDraft("right")}
              >
                Right
              </button>
            </div>
          </div>
        ) : null}
        {canRotate ? (
          <div className="text-sm text-white">
            <div>Rotation</div>
            <div className="mt-1 grid grid-cols-4 gap-2">
              <button type="button" className={`rounded-none border px-2 py-2 text-sm ${shapeRotationDraft === 0 ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`} onClick={() => setShapeRotationDraft(0)}>0°</button>
              <button type="button" className={`rounded-none border px-2 py-2 text-sm ${shapeRotationDraft === 90 ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`} onClick={() => setShapeRotationDraft(90)}>90°</button>
              <button type="button" className={`rounded-none border px-2 py-2 text-sm ${shapeRotationDraft === 180 ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`} onClick={() => setShapeRotationDraft(180)}>180°</button>
              <button type="button" className={`rounded-none border px-2 py-2 text-sm ${shapeRotationDraft === 270 ? "border-white bg-white text-black" : "border-white bg-transparent text-white"}`} onClick={() => setShapeRotationDraft(270)}>270°</button>
            </div>
          </div>
        ) : null}
        <DualPaletteSelector
          backgroundColor={safeColor.toUpperCase()}
          outlineColor={safeOutlineColor}
          activeTarget={activePaletteTarget}
          onToggleTarget={(target) => setActivePaletteTarget((prev) => (prev === target ? null : target))}
          onSelect={(target, hex) => {
            if (target === "outline") {
              setShapeOutlineColorDraft(hex);
            } else {
              setShapeColorDraft(hex);
            }
            setActivePaletteTarget(null);
          }}
          swatchKeyPrefix="shape"
        />
        <OutlineWeightField value={shapeOutlineWidthDraft} onChange={setShapeOutlineWidthDraft} />
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onDelete()} disabled={!!actionDisabledReason}>
          Delete shape
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onSave()} disabled={!!actionDisabledReason}>
            Save shape
          </button>
        )}
      </div>
    </AsideShell>
  );
}

type RelationLabels = {
  sourceLabel: string;
  targetLabel: string;
  targetType: string;
};

type RelationshipSectionProps = {
  rows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  editingRelationId: string | null;
  editingRelationDescription: string;
  setEditingRelationDescription: (value: string) => void;
  editingRelationCategory: RelationshipCategory;
  setEditingRelationCategory: (value: RelationshipCategory) => void;
  relationshipCategoryOptions: RelationshipCategoryOption[];
  editingRelationCustomType: string;
  setEditingRelationCustomType: (value: string) => void;
  editingRelationDisciplines: DisciplineKey[];
  setEditingRelationDisciplines: (updater: (prev: DisciplineKey[]) => DisciplineKey[]) => void;
  showEditingRelationDisciplineMenu: boolean;
  setShowEditingRelationDisciplineMenu: (updater: (prev: boolean) => boolean) => void;
  disciplineOptions: Array<{ key: DisciplineKey; label: string }>;
  getDisciplineLabel: (key: DisciplineKey) => string | undefined;
  onStartEdit: (row: NodeRelationRow) => void;
  onDelete: (relationId: string) => void;
  onSave: (relationId: string) => void;
  onCancelEdit: () => void;
  actionDisabledReason?: string;
};

function RelationshipSection({
  rows,
  resolveLabels,
  editingRelationId,
  editingRelationDescription,
  setEditingRelationDescription,
  editingRelationCategory,
  setEditingRelationCategory,
  relationshipCategoryOptions,
  editingRelationCustomType,
  setEditingRelationCustomType,
  editingRelationDisciplines,
  setEditingRelationDisciplines,
  showEditingRelationDisciplineMenu,
  setShowEditingRelationDisciplineMenu,
  disciplineOptions,
  getDisciplineLabel,
  onStartEdit,
  onDelete,
  onSave,
  onCancelEdit,
  actionDisabledReason,
}: RelationshipSectionProps) {
  return (
    <div className="mt-6 border-t border-[#5f7894]/70 pt-4">
      <h3 className="font-semibold text-white">Relationships</h3>
      <div className="mt-3 space-y-2">
        {rows.map((r) => {
          const labels = resolveLabels(r);
          const isEditing = editingRelationId === r.id;
          return (
            <div key={r.id} className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 pr-2 text-sm font-medium">
                  <div className="break-words">
                  {labels.sourceLabel} {"->"} {labels.targetLabel} <span className="font-normal text-slate-500">({labels.targetType})</span>
                </div>
                <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
                  Relation: {getDisplayRelationType(r.relation_type)}
                </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {wrapWithReason(
                    actionDisabledReason,
                    <button
                      title={undefined}
                      aria-label="Edit relationship definition"
                      className={`flex h-7 w-7 items-center justify-center border border-slate-300 bg-white hover:bg-slate-100 ${disabledAsideActionClass}`}
                      onClick={() => onStartEdit(r)}
                      disabled={!!actionDisabledReason}
                    >
                      <img src="/icons/edit.svg" alt="" className="h-4 w-4" />
                    </button>
                  )}
                  {wrapWithReason(
                    actionDisabledReason,
                    <button
                      title={undefined}
                      aria-label="Delete relationship"
                      className={`flex h-7 w-7 items-center justify-center border border-slate-300 bg-white hover:bg-slate-100 ${disabledAsideActionClass}`}
                      onClick={() => onDelete(r.id)}
                      disabled={!!actionDisabledReason}
                    >
                      <img src="/icons/delete.svg" alt="" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <div className="text-[11px]">
                    <div className="font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Type</div>
                    <div className="relative mt-1">
                      <select
                        className="w-full appearance-none rounded-none border border-slate-300 bg-white px-2 py-1 text-xs text-black"
                        value={editingRelationCategory}
                        onChange={(e) => setEditingRelationCategory(e.target.value as RelationshipCategory)}
                      >
                        {relationshipCategoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-black">▼</span>
                    </div>
                  </div>
                  {editingRelationCategory === "other" && (
                    <div className="text-[11px]">
                      <div className="font-semibold uppercase tracking-[0.05em] text-slate-500">Custom Type</div>
                      <input
                        className="mt-1 w-full rounded-none border border-slate-300 px-2 py-1 text-xs text-black"
                        value={editingRelationCustomType}
                        onChange={(e) => setEditingRelationCustomType(e.target.value)}
                        placeholder="Enter custom relationship type"
                      />
                    </div>
                  )}
                  <div className="text-[11px]">
                    <div className="font-semibold uppercase tracking-[0.05em] text-slate-500">Disciplines</div>
                    <div className="relative mt-1">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-none border border-slate-300 bg-white px-2 py-1 text-left text-xs text-black"
                        onClick={() => setShowEditingRelationDisciplineMenu((prev) => !prev)}
                      >
                        <span className="truncate">
                          {editingRelationDisciplines.length
                            ? editingRelationDisciplines.map((key) => getDisciplineLabel(key)).filter(Boolean).join(", ")
                            : "Select disciplines"}
                        </span>
                        <span className="text-[10px] text-black">{showEditingRelationDisciplineMenu ? "▲" : "▼"}</span>
                      </button>
                      {showEditingRelationDisciplineMenu && (
                        <div className="absolute z-30 mt-1 w-full rounded-none border border-slate-300 bg-white p-2 shadow-lg">
                          {disciplineOptions.map((option) => {
                            const checked = editingRelationDisciplines.includes(option.key);
                            return (
                              <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs text-black hover:bg-slate-50">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setEditingRelationDisciplines((prev) =>
                                      prev.includes(option.key)
                                        ? prev.filter((key) => key !== option.key)
                                        : [...prev, option.key]
                                    )
                                  }
                                />
                                <span>{option.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Definition</div>
                  <textarea
                    className="w-full rounded-none border border-slate-300 px-2 py-1 text-xs text-black"
                    rows={3}
                    value={editingRelationDescription}
                    onChange={(e) => setEditingRelationDescription(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    {wrapWithReason(
                      actionDisabledReason,
                      <button
                        className={`rounded-none border border-black bg-white px-2 py-1 text-xs font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`}
                        onClick={() => onSave(r.id)}
                        disabled={!!actionDisabledReason}
                      >
                        Save
                      </button>
                    )}
                    <button
                      className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Definition</div>
                  <div className="mt-1 text-xs text-slate-600">{r.relationship_description?.trim() || "No relationship context added by user"}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type RelationshipManagerAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  title?: string;
  addButtonLabel?: string;
  onAddRelationship: () => void;
  onClose: () => void;
  rows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
  actionDisabledReason?: string;
};

export function RelationshipManagerAside({
  open,
  isMobile,
  leftAsideSlideIn,
  title = "Relationships",
  addButtonLabel = "Add Relationship",
  onAddRelationship,
  onClose,
  rows,
  resolveLabels,
  relationshipSectionProps,
  actionDisabledReason,
}: RelationshipManagerAsideProps) {
  if (!open) return null;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title={title} onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-3">
        {wrapWithReason(
          actionDisabledReason,
          <button
            title={undefined}
            aria-label={addButtonLabel}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100 ${disabledAsideActionClass}`}
            onClick={onAddRelationship}
            disabled={!!actionDisabledReason}
          >
            <img src="/icons/relationship.svg" alt="" className="h-4 w-4" />
            <span className="truncate">{addButtonLabel}</span>
          </button>
        )}
      </div>
      <RelationshipSection rows={rows} resolveLabels={resolveLabels} {...relationshipSectionProps} />
    </AsideShell>
  );
}

type PersonPropertiesAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  mapCategoryId: MapCategoryId;
  selectedElementType: "person" | "equipment" | "environment" | null;
  personTypeDraft: string;
  setPersonTypeDraft: (value: string) => void;
  personRoleDraft: string;
  setPersonRoleDraft: (value: string) => void;
  personRoleIdDraft: string;
  setPersonRoleIdDraft: (value: string) => void;
  personDepartmentDraft: string;
  setPersonDepartmentDraft: (value: string) => void;
  personOccupantNameDraft: string;
  setPersonOccupantNameDraft: (value: string) => void;
  personStartDateDraft: string;
  setPersonStartDateDraft: (value: string) => void;
  personEmploymentTypeDraft: "fte" | "contractor";
  setPersonEmploymentTypeDraft: (value: "fte" | "contractor") => void;
  personActingNameDraft: string;
  setPersonActingNameDraft: (value: string) => void;
  personActingStartDateDraft: string;
  setPersonActingStartDateDraft: (value: string) => void;
  personRecruitingDraft: boolean;
  setPersonRecruitingDraft: (value: boolean) => void;
  personProposedRoleDraft: boolean;
  setPersonProposedRoleDraft: (value: boolean) => void;
  equipmentTypeDraft: string;
  setEquipmentTypeDraft: (value: string) => void;
  equipmentIdentifierDraft: string;
  setEquipmentIdentifierDraft: (value: string) => void;
  environmentDetailDraft: string;
  setEnvironmentDetailDraft: (value: string) => void;
  environmentFactorTypeDraft: string;
  setEnvironmentFactorTypeDraft: (value: string) => void;
  orgChartDepartmentOptions: readonly string[];
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  onAddRelationship: () => void;
  relatedRows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
  actionDisabledReason?: string;
};

export function PersonPropertiesAside({
  open,
  isMobile,
  leftAsideSlideIn,
  mapCategoryId,
  selectedElementType,
  personTypeDraft,
  setPersonTypeDraft,
  personRoleDraft,
  setPersonRoleDraft,
  personRoleIdDraft,
  setPersonRoleIdDraft,
  personDepartmentDraft,
  setPersonDepartmentDraft,
  personOccupantNameDraft,
  setPersonOccupantNameDraft,
  personStartDateDraft,
  setPersonStartDateDraft,
  personEmploymentTypeDraft,
  setPersonEmploymentTypeDraft,
  personActingNameDraft,
  setPersonActingNameDraft,
  personActingStartDateDraft,
  setPersonActingStartDateDraft,
  personRecruitingDraft,
  setPersonRecruitingDraft,
  personProposedRoleDraft,
  setPersonProposedRoleDraft,
  equipmentTypeDraft,
  setEquipmentTypeDraft,
  equipmentIdentifierDraft,
  setEquipmentIdentifierDraft,
  environmentDetailDraft,
  setEnvironmentDetailDraft,
  environmentFactorTypeDraft,
  setEnvironmentFactorTypeDraft,
  orgChartDepartmentOptions,
  onDelete,
  onSave,
  onClose,
  onAddRelationship,
  relatedRows,
  resolveLabels,
  relationshipSectionProps,
  actionDisabledReason,
}: PersonPropertiesAsideProps) {
  if (!open) return null;
  const isEquipment = selectedElementType === "equipment";
  const isEnvironment = selectedElementType === "environment";
  const isOrgChart = selectedElementType === "person" && mapCategoryId === "org_chart";
  const asideTitle = isEquipment ? "Equipment Properties" : isEnvironment ? "Environment Properties" : "Person Properties";
  const nodeNoun = isEquipment ? "equipment" : isEnvironment ? "environment" : "person";
  const investigationPersonTypeOptions = [
    "Injured Person",
    "Witness",
    "Reported Incident",
    "Involved - Direct",
    "Involved - Indirect",
    "Responder",
    "Responsible Leader",
    "Other",
  ] as const;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title={asideTitle} onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-4 space-y-3">
        {isEquipment ? (
          <>
            <label className="text-sm text-white">Equipment Type
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={equipmentTypeDraft}
                onChange={(e) => setEquipmentTypeDraft(e.target.value)}
                placeholder="Enter equipment type"
              />
            </label>
            <label className="text-sm text-white">Brand / Type / Asset ID
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={equipmentIdentifierDraft}
                onChange={(e) => setEquipmentIdentifierDraft(e.target.value)}
                placeholder="Enter brand, model, asset ID or identifier"
              />
            </label>
          </>
        ) : isEnvironment ? (
          <>
            <label className="text-sm text-white">Environment Detail
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={environmentDetailDraft}
                onChange={(e) => setEnvironmentDetailDraft(e.target.value)}
                placeholder="Enter environment detail"
              />
            </label>
            <label className="text-sm text-white">Environment Factor Type
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={environmentFactorTypeDraft}
                onChange={(e) => setEnvironmentFactorTypeDraft(e.target.value)}
              >
                {environmentFactorTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : isOrgChart ? (
          <>
            <label className="text-sm text-white">Position Title
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personRoleDraft}
                onChange={(e) => setPersonRoleDraft(e.target.value)}
                placeholder="Enter position title"
              />
            </label>
            <label className="text-sm text-white">Role ID
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personRoleIdDraft}
                onChange={(e) => setPersonRoleIdDraft(e.target.value)}
                placeholder="Optional role ID"
              />
            </label>
            <label className="text-sm text-white">Department
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personDepartmentDraft}
                onChange={(e) => setPersonDepartmentDraft(e.target.value)}
              >
                <option value="">Select department</option>
                {orgChartDepartmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-white">Occupant Name
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personOccupantNameDraft}
                onChange={(e) => setPersonOccupantNameDraft(e.target.value)}
                placeholder="Optional occupant name"
              />
            </label>
            <label className="text-sm text-white">Start Date
              <input
                type="date"
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personStartDateDraft}
                onChange={(e) => setPersonStartDateDraft(e.target.value)}
              />
            </label>
            <label className="text-sm text-white">Employment Type
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personEmploymentTypeDraft}
                onChange={(e) => setPersonEmploymentTypeDraft(e.target.value === "contractor" ? "contractor" : "fte")}
              >
                <option value="fte">FTE</option>
                <option value="contractor">Contractor</option>
              </select>
            </label>
            <label className="text-sm text-white">Acting Name
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personActingNameDraft}
                onChange={(e) => setPersonActingNameDraft(e.target.value)}
                placeholder="Optional acting name"
              />
            </label>
            <label className="text-sm text-white">Acting Start Date
              <input
                type="date"
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personActingStartDateDraft}
                onChange={(e) => setPersonActingStartDateDraft(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={personRecruitingDraft} onChange={(e) => setPersonRecruitingDraft(e.target.checked)} />
              Recruiting
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={personProposedRoleDraft} onChange={(e) => setPersonProposedRoleDraft(e.target.checked)} />
              Proposed Role
            </label>
          </>
        ) : (
          <>
            <label className="text-sm text-white">Role Name
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personRoleDraft}
                onChange={(e) => setPersonRoleDraft(e.target.value)}
                placeholder="Enter role name"
              />
            </label>
            <label className="text-sm text-white">Department
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personDepartmentDraft}
                onChange={(e) => setPersonDepartmentDraft(e.target.value)}
                placeholder="Enter department"
              />
            </label>
            <label className="text-sm text-white">Person Type
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
                value={personTypeDraft}
                onChange={(e) => setPersonTypeDraft(e.target.value)}
              >
                <option value="">Select person type</option>
                {investigationPersonTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button
          className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`}
          onClick={() => void onDelete()}
          disabled={!!actionDisabledReason}
        >
          Delete {nodeNoun}
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onSave()} disabled={!!actionDisabledReason}>Save {nodeNoun}</button>
        )}
      </div>
    </AsideShell>
  );
}

type BowtiePropertiesAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  bowtieElementType:
    | "bowtie_hazard"
    | "bowtie_top_event"
    | "bowtie_threat"
    | "bowtie_consequence"
    | "bowtie_control"
    | "bowtie_escalation_factor"
    | "bowtie_recovery_measure"
    | "bowtie_degradation_indicator"
    | "bowtie_risk_rating"
    | "incident_sequence_step"
    | "incident_outcome"
    | "incident_task_condition"
    | "incident_factor"
    | "incident_system_factor"
    | "incident_control_barrier"
    | "incident_evidence"
    | "incident_response_recovery"
    | "incident_finding"
    | "incident_recommendation"
    | null;
  bowtieDraft: Record<string, string | boolean | string[]>;
  setBowtieDraft: React.Dispatch<React.SetStateAction<Record<string, string | boolean | string[]>>>;
  availableFactorPeople: Array<{ id: string; label: string }>;
  evidenceUploadPreviewUrl: string | null;
  evidenceUploadFileName: string;
  evidenceUploadFileMime: string;
  evidenceCurrentMediaName: string;
  evidenceCurrentMediaMime: string;
  evidenceCurrentMediaUrl: string | null;
  onSelectEvidenceUploadFile: (file: File | null) => void;
  onClearEvidenceUploadFile: () => void;
  onDeleteEvidenceAttachment: () => Promise<void>;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  onAddRelationship: () => void;
  relatedRows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
  actionDisabledReason?: string;
};

export function BowtiePropertiesAside({
  open,
  isMobile,
  leftAsideSlideIn,
  bowtieElementType,
  bowtieDraft,
  setBowtieDraft,
  availableFactorPeople,
  evidenceUploadPreviewUrl,
  evidenceUploadFileName,
  evidenceUploadFileMime,
  evidenceCurrentMediaName,
  evidenceCurrentMediaMime,
  evidenceCurrentMediaUrl,
  onSelectEvidenceUploadFile,
  onClearEvidenceUploadFile,
  onDeleteEvidenceAttachment,
  onDelete,
  onSave,
  onClose,
  onAddRelationship,
  relatedRows,
  resolveLabels,
  relationshipSectionProps,
  actionDisabledReason,
}: BowtiePropertiesAsideProps) {
  if (!open || !bowtieElementType) return null;
  const isRiskRating = bowtieElementType === "bowtie_risk_rating";
  const isIncidentElement = bowtieElementType.startsWith("incident_");
  const [peopleDropdownOpen, setPeopleDropdownOpen] = useState(false);
  const title = ({
    bowtie_hazard: "Hazard",
    bowtie_top_event: "Top Event",
    bowtie_threat: "Threat",
    bowtie_consequence: "Consequence",
    bowtie_control: "Control",
    bowtie_escalation_factor: "Escalation Factor",
    bowtie_recovery_measure: "Recovery Measure",
    bowtie_degradation_indicator: "Degradation Indicator",
    bowtie_risk_rating: "Risk Rating",
    incident_sequence_step: "Sequence Step",
    incident_outcome: "Outcome",
    incident_task_condition: "Task / Condition",
    incident_factor: "Factor",
    incident_system_factor: "System Factor",
    incident_control_barrier: "Control / Barrier",
    incident_evidence: "Evidence",
    incident_response_recovery: "Response / Recovery",
    incident_finding: "Finding",
    incident_recommendation: "Recommendation",
  } as const)[bowtieElementType] || "Node";

  const setField = (key: string, value: string | boolean | string[]) =>
    setBowtieDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (bowtieElementType === "bowtie_risk_rating" && (key === "likelihood" || key === "consequence")) {
        const likelihood = String(next.likelihood ?? "possible");
        const consequence = String(next.consequence ?? "moderate");
        next.risk_level = calculateBowtieRiskLevel(likelihood, consequence);
      }
      return next;
    });

  const riskLevelLabel =
    bowtieElementType === "bowtie_risk_rating"
      ? formatBowtieOptionLabel(
          calculateBowtieRiskLevel(
            String(bowtieDraft.likelihood ?? "possible"),
            String(bowtieDraft.consequence ?? "moderate")
          )
        )
      : "";
  const labelDraft = String(bowtieDraft.label ?? "").trim();
  const descriptionDraft = String(bowtieDraft.description ?? "").trim();
  const bodyDisplayMode =
    bowtieDraft.body_display_mode === "label" || bowtieDraft.body_display_mode === "description"
      ? bowtieDraft.body_display_mode
      : descriptionDraft
      ? "description"
      : labelDraft
      ? "label"
      : "description";
  const uploadNameLower = String(evidenceUploadFileName || "").toLowerCase();
  const currentNameLower = String(evidenceCurrentMediaName || "").toLowerCase();
  const uploadIsPdf = evidenceUploadFileMime.toLowerCase().includes("pdf") || uploadNameLower.endsWith(".pdf");
  const currentIsPdf = evidenceCurrentMediaMime.toLowerCase().includes("pdf") || currentNameLower.endsWith(".pdf");
  const uploadIsHeic = uploadNameLower.endsWith(".heic") || uploadNameLower.endsWith(".heif") || evidenceUploadFileMime.toLowerCase().includes("heic") || evidenceUploadFileMime.toLowerCase().includes("heif");
  const currentIsHeic = (currentNameLower.endsWith(".heic") || currentNameLower.endsWith(".heif") || evidenceCurrentMediaMime.toLowerCase().includes("heic") || evidenceCurrentMediaMime.toLowerCase().includes("heif")) && !String(evidenceCurrentMediaUrl || "").startsWith("blob:");
  const selectedFactorPeople = Array.isArray(bowtieDraft.people_involved)
    ? bowtieDraft.people_involved.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  const selectedFactorPeopleCount = selectedFactorPeople.length;
  const selectedFactorPeopleLabel =
    selectedFactorPeopleCount === 0
      ? "Select people"
      : selectedFactorPeopleCount === 1
      ? "1 person selected"
      : `${selectedFactorPeopleCount} people selected`;
  const toggleFactorPerson = (personId: string) => {
    setBowtieDraft((prev) => {
      const current = Array.isArray(prev.people_involved)
        ? prev.people_involved.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : [];
      const exists = current.includes(personId);
      return {
        ...prev,
        people_involved: exists ? current.filter((value) => value !== personId) : [...current, personId],
      };
    });
  };

  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title={`${title} Properties`} onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-4 space-y-3">
        {isRiskRating ? (
          <div className="text-sm text-white">Label
            <div className="mt-1 rounded border border-slate-300 bg-[#0f2942] px-3 py-2 text-white">{riskLevelLabel}</div>
          </div>
        ) : (
          <>
            <label className="text-sm text-white">Label / Heading
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.label ?? "")}
                onChange={(e) => setField("label", e.target.value)}
                placeholder="Enter node label"
              />
            </label>
            <label className="text-sm text-white">Description
              <AutosizingDescriptionTextarea
                value={String(bowtieDraft.description ?? "")}
                onChange={(value) => setField("description", value)}
              />
            </label>
            <fieldset className="text-sm text-white">
              <legend className="mb-2">Show In Node Body</legend>
                <div className="space-y-2 rounded border border-slate-300 bg-white p-3 text-black">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`${bowtieElementType}-body-display`}
                    checked={bodyDisplayMode === "label"}
                    onChange={() => setField("body_display_mode", "label")}
                  />
                  <span>Label / Heading</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`${bowtieElementType}-body-display`}
                    checked={bodyDisplayMode === "description"}
                    onChange={() => setField("body_display_mode", "description")}
                  />
                  <span>Description</span>
                </label>
              </div>
            </fieldset>
          </>
        )}

        {bowtieElementType === "bowtie_hazard" ? (
          <>
            <label className="text-sm text-white">Energy / Source Type
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.energy_source_type ?? "")} onChange={(e) => setField("energy_source_type", e.target.value)}>
                <option value="">Select type</option>
                {["mechanical", "electrical", "pressure", "chemical", "biological", "human", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
          </>
        ) : null}

        {bowtieElementType === "bowtie_top_event" ? (
          <label className="text-sm text-white">Loss of Control Type
            <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.loss_of_control_type ?? "")} onChange={(e) => setField("loss_of_control_type", e.target.value)}>
              <option value="">Select type</option>
               {["containment", "stability", "condition", "process", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
            </select>
          </label>
        ) : null}

        {bowtieElementType === "bowtie_threat" ? (
          <label className="text-sm text-white">Threat Category
            <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.threat_category ?? "")} onChange={(e) => setField("threat_category", e.target.value)}>
              <option value="">Select category</option>
               {["people", "process", "plant", "environment", "external", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
            </select>
          </label>
        ) : null}

        {bowtieElementType === "bowtie_consequence" ? (
          <label className="text-sm text-white">Impact Category
            <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.impact_category ?? "")} onChange={(e) => setField("impact_category", e.target.value)}>
              <option value="">Select category</option>
               {["safety", "health", "environment", "community", "financial", "reputation", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
            </select>
          </label>
        ) : null}

        {bowtieElementType === "bowtie_control" ? (
          <>
            <label className="text-sm text-white">Control Category
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.control_category ?? "preventive")} onChange={(e) => setField("control_category", e.target.value)}>
                {["preventive", "mitigative", "escalation", "recovery"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <label className="text-sm text-white">Control Type
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.control_type ?? "")} onChange={(e) => setField("control_type", e.target.value)}>
                <option value="">Select type</option>
                {["elimination", "substitution", "isolation", "engineering", "administrative", "procedural", "behavioural", "detection", "ppe"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <label className="text-sm text-white">Owner
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.owner_text ?? "")} onChange={(e) => setField("owner_text", e.target.value)} />
            </label>
            <label className="text-sm text-white">Verification Method
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.verification_method ?? "")} onChange={(e) => setField("verification_method", e.target.value)}>
                <option value="">Select method</option>
                {["inspection", "test", "monitoring", "audit", "review", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <label className="text-sm text-white">Verification Frequency
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.verification_frequency ?? "")} onChange={(e) => setField("verification_frequency", e.target.value)}>
                <option value="">Select frequency</option>
                {["per_shift", "daily", "weekly", "monthly", "quarterly", "annual", "triggered"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={Boolean(bowtieDraft.is_critical_control)} onChange={(e) => setField("is_critical_control", e.target.checked)} />
              <span>Critical Control</span>
            </label>
            <label className="text-sm text-white">Performance Standard
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.performance_standard ?? "")} onChange={(e) => setField("performance_standard", e.target.value)} />
            </label>
          </>
        ) : null}

        {bowtieElementType === "bowtie_escalation_factor" ? (
          <label className="text-sm text-white">Factor Type
            <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.factor_type ?? "")} onChange={(e) => setField("factor_type", e.target.value)}>
              <option value="">Select type</option>
              {["human", "environmental", "equipment", "system", "process", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
            </select>
          </label>
        ) : null}

        {bowtieElementType === "bowtie_recovery_measure" ? (
          <>
            <label className="text-sm text-white">Trigger
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.trigger ?? "")} onChange={(e) => setField("trigger", e.target.value)} />
            </label>
            <label className="text-sm text-white">Owner
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.owner_text ?? "")} onChange={(e) => setField("owner_text", e.target.value)} />
            </label>
            <label className="text-sm text-white">Time Requirement
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.time_requirement ?? "")} onChange={(e) => setField("time_requirement", e.target.value)}>
                <option value="">Select requirement</option>
                {["immediate", "within_15m", "within_1h", "within_shift", "within_24h", "planned"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
          </>
        ) : null}

        {bowtieElementType === "bowtie_degradation_indicator" ? (
          <>
            <label className="text-sm text-white">Monitoring Method
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.monitoring_method ?? "")} onChange={(e) => setField("monitoring_method", e.target.value)}>
                <option value="">Select method</option>
                {["inspection", "sensor", "test", "observation", "audit", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <label className="text-sm text-white">Trigger Threshold
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.trigger_threshold ?? "")} onChange={(e) => setField("trigger_threshold", e.target.value)} />
            </label>
          </>
        ) : null}

        {bowtieElementType === "bowtie_risk_rating" ? (
          <>
            <label className="text-sm text-white">Likelihood
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.likelihood ?? "possible")} onChange={(e) => setField("likelihood", e.target.value)}>
                {["rare", "unlikely", "possible", "likely", "almost_certain"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <label className="text-sm text-white">Consequence
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.consequence ?? "moderate")} onChange={(e) => setField("consequence", e.target.value)}>
                {["insignificant", "minor", "moderate", "major", "severe"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <div className="text-sm text-white">Risk Level
              <div className="mt-1 rounded border border-slate-300 bg-white px-3 py-2 text-black">{riskLevelLabel}</div>
            </div>
          </>
        ) : null}

        {bowtieElementType === "incident_sequence_step" ? (
          <>
            <label className="text-sm text-white">Timestamp
              <input
                type="datetime-local"
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.timestamp ?? "")}
                onChange={(e) => setField("timestamp", e.target.value)}
              />
            </label>
            <label className="text-sm text-white">Location
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.location ?? "")}
                onChange={(e) => setField("location", e.target.value)}
              />
            </label>
          </>
        ) : null}

        {bowtieElementType === "incident_outcome" ? (
          <>
            <label className="text-sm text-white">Outcome Category
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.consequence_category ?? "actual")}
                onChange={(e) => setField("consequence_category", e.target.value)}
              >
                <option value="maximum_reasonable">Maximum Reasonable Outcome</option>
                <option value="actual">Actual Outcome</option>
                <option value="reporting">Reporting Outcome</option>
              </select>
            </label>
            {String(bowtieDraft.consequence_category ?? "actual") === "reporting" ? (
              <label className="text-sm text-white">Reporting Outcome
                <select
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                  value={String(bowtieDraft.reporting_consequence ?? "")}
                  onChange={(e) => setField("reporting_consequence", e.target.value)}
                >
                  <option value="">Select reporting outcome</option>
                  <option value="internally_reported">Internal Report</option>
                  <option value="externally_reported">External Report</option>
                  <option value="reported_to_regulator">Regulator Report</option>
                  <option value="reported_elsewhere">Reported Elsewhere</option>
                </select>
              </label>
            ) : (
              <>
                <label className="text-sm text-white">Likelihood
                  <select
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={String(bowtieDraft.likelihood ?? "possible")}
                    onChange={(e) => setField("likelihood", e.target.value)}
                  >
                    {["rare", "unlikely", "possible", "likely", "almost_certain"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
                  </select>
                </label>
                <label className="text-sm text-white">Consequence
                  <select
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={String(bowtieDraft.consequence ?? "moderate")}
                    onChange={(e) => setField("consequence", e.target.value)}
                  >
                    {["insignificant", "minor", "moderate", "major", "severe"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
                  </select>
                </label>
                <div className="text-sm text-white">Risk Level
                  {(() => {
                    const riskLevel = formatBowtieOptionLabel(
                      calculateBowtieRiskLevel(
                        String(bowtieDraft.likelihood ?? "possible"),
                        String(bowtieDraft.consequence ?? "moderate")
                      )
                    );
                    const riskLevelKey = calculateBowtieRiskLevel(
                      String(bowtieDraft.likelihood ?? "possible"),
                      String(bowtieDraft.consequence ?? "moderate")
                    );
                    const riskBg =
                      riskLevelKey === "low"
                        ? "#86efac"
                        : riskLevelKey === "medium"
                        ? "#fde68a"
                        : riskLevelKey === "high"
                        ? "#fdba74"
                        : "#fca5a5";
                    return (
                      <div className="mt-1 rounded border border-slate-300 px-3 py-2 font-semibold text-black" style={{ backgroundColor: riskBg }}>
                        {riskLevel}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </>
        ) : null}

        {bowtieElementType === "incident_task_condition" ? (
          <>
            <label className="text-sm text-white">State
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.state ?? "normal")}
                onChange={(e) => setField("state", e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
              </select>
            </label>
            <label className="text-sm text-white">Environmental Context
              <textarea
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                rows={4}
                value={String(bowtieDraft.environmental_context ?? "")}
                onChange={(e) => setField("environmental_context", e.target.value)}
              />
            </label>
          </>
        ) : null}

        {bowtieElementType === "incident_factor" ? (
          <>
            <label className="text-sm text-white">Factor Presence
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.factor_presence ?? "present")}
                onChange={(e) => setField("factor_presence", e.target.value)}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </label>
            <label className="text-sm text-white">Factor Classification
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.factor_classification ?? "contributing")}
                onChange={(e) => setField("factor_classification", e.target.value)}
              >
                <option value="essential">Essential</option>
                <option value="contributing">Contributing</option>
                <option value="predisposing">Predisposing</option>
                <option value="neutral">Neutral</option>
              </select>
            </label>
            <label className="text-sm text-white">Influence Type
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.influence_type ?? "human")}
                onChange={(e) => setField("influence_type", e.target.value)}
              >
                <option value="human">Human</option>
                <option value="equipment">Equipment</option>
                <option value="process">Process</option>
                <option value="environment">Environment</option>
                <option value="organisation">Organisation</option>
              </select>
            </label>
            <div className="text-sm text-white">
              <div>People Involved</div>
              {availableFactorPeople.length === 0 ? (
                <div className="mt-1 rounded border border-slate-300 bg-[#0f2942] px-3 py-2 text-sm text-slate-200">
                  Add person nodes to complete this field
                </div>
              ) : (
                <div className="relative mt-1">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left text-black shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                    onClick={() => setPeopleDropdownOpen((current) => !current)}
                  >
                    <span className="text-sm font-medium">{selectedFactorPeopleLabel}</span>
                    <svg viewBox="0 0 24 24" className={`h-4 w-4 text-slate-500 transition ${peopleDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true">
                      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {peopleDropdownOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]">
                      <div className="max-h-56 overflow-y-auto py-1">
                        {availableFactorPeople.map((person) => {
                          const checked = selectedFactorPeople.includes(person.id);
                          return (
                            <label
                              key={person.id}
                              className={`flex cursor-pointer items-start gap-3 px-3 py-2 text-sm ${checked ? "bg-sky-50 text-black" : "text-black hover:bg-slate-50"}`}
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600"
                                checked={checked}
                                onChange={() => toggleFactorPerson(person.id)}
                              />
                              <span className="leading-5">{person.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </>
        ) : null}

        {bowtieElementType === "incident_system_factor" ? (
          <>
            <label className="text-sm text-white">Factor Presence
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.factor_presence ?? "present")}
                onChange={(e) => setField("factor_presence", e.target.value)}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </label>
            <label className="text-sm text-white">Factor Classification
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.factor_classification ?? "contributing")}
                onChange={(e) => setField("factor_classification", e.target.value)}
              >
                <option value="essential">Essential</option>
                <option value="contributing">Contributing</option>
                <option value="predisposing">Predisposing</option>
                <option value="neutral">Neutral</option>
              </select>
            </label>
            <label className="text-sm text-white">Category
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.category ?? "")}
                onChange={(e) => setField("category", e.target.value)}
              >
                <option value="">Select category</option>
                {["training", "supervision", "planning", "design", "culture", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
          </>
        ) : null}

        {bowtieElementType === "incident_control_barrier" ? (
          <>
            <label className="text-sm text-white">Barrier State
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.barrier_state ?? "effective")}
                onChange={(e) => setField("barrier_state", e.target.value)}
              >
                <option value="effective">Effective</option>
                <option value="failed">Failed</option>
                <option value="missing">Missing</option>
              </select>
            </label>
            <label className="text-sm text-white">Barrier Role
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.barrier_role ?? "preventive")}
                onChange={(e) => setField("barrier_role", e.target.value)}
              >
                <option value="preventive">Preventive</option>
                <option value="mitigative">Mitigative</option>
                <option value="recovery">Recovery</option>
              </select>
            </label>
            <label className="text-sm text-white">Control Type
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.control_type ?? "")}
                onChange={(e) => setField("control_type", e.target.value)}
              >
                <option value="">Select control type</option>
                {["engineering", "substitution", "elimination", "administrative", "ppe", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <label className="text-sm text-white">Owner
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.owner_text ?? "")} onChange={(e) => setField("owner_text", e.target.value)} />
            </label>
          </>
        ) : null}

        {bowtieElementType === "incident_evidence" ? (
          <>
            <label className="text-sm text-white">Evidence Type
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.evidence_type ?? "")}
                onChange={(e) => setField("evidence_type", e.target.value)}
              >
                <option value="">Select evidence type</option>
                {["photo", "statement", "record", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <label className="text-sm text-white">Source
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.source ?? "")}
                onChange={(e) => setField("source", e.target.value)}
              />
            </label>
            <div className="text-sm text-white">
              <div>Upload Evidence (Image or PDF)</div>
              <div className="mt-1 rounded-none border border-dashed border-slate-300 p-4">
                <label className="flex cursor-pointer flex-col items-center justify-center text-center">
                  <div className="text-xs text-slate-200">Drag and drop file or click to browse</div>
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    className="mt-3 block w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-black file:mr-2 file:rounded-none file:border file:border-black file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold file:text-black hover:file:bg-slate-100"
                    style={{ color: "#111827", backgroundColor: "#ffffff" }}
                    onChange={(e) => onSelectEvidenceUploadFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {String(evidenceUploadFileName || evidenceCurrentMediaName).trim() ? (
                  <div
                    className="mt-2 rounded border border-slate-200 bg-white px-2 py-2 text-[12px] break-all"
                    style={{ color: "#0f172a", fontWeight: 600 }}
                  >
                    File: {String(evidenceUploadFileName || evidenceCurrentMediaName).trim()}
                  </div>
                ) : null}
                {!evidenceUploadPreviewUrl && evidenceCurrentMediaUrl ? (
                  <div className="mt-3 overflow-hidden rounded border border-slate-200 bg-white p-2">
                    {currentIsPdf ? (
                      <iframe
                        title={evidenceCurrentMediaName || "Current evidence PDF preview"}
                        src={`${evidenceCurrentMediaUrl}#page=1&view=FitH&toolbar=0&navpanes=0`}
                        className="h-44 w-full border-0 bg-white"
                      />
                    ) : currentIsHeic ? (
                      <div className="flex h-44 w-full items-center justify-center rounded border border-slate-200 bg-slate-50 px-3 text-center text-xs text-slate-700">
                        Preview unavailable for HEIC/HEIF in this panel.
                      </div>
                    ) : (
                      <img src={evidenceCurrentMediaUrl} alt="Current evidence preview" className="max-h-44 w-full object-contain" />
                    )}
                  </div>
                ) : null}
                {evidenceUploadPreviewUrl ? (
                  <div className="mt-3 overflow-hidden rounded border border-slate-200 bg-slate-50 p-2">
                    {uploadIsPdf ? (
                      <iframe
                        title={evidenceUploadFileName || "Evidence upload PDF preview"}
                        src={`${evidenceUploadPreviewUrl}#page=1&view=FitH&toolbar=0&navpanes=0`}
                        className="h-40 w-full border-0 bg-white"
                      />
                    ) : uploadIsHeic ? (
                      <div className="flex h-40 w-full items-center justify-center rounded border border-slate-200 bg-white px-3 text-center text-xs text-slate-700">
                        Preview unavailable for HEIC/HEIF. Save to upload the file.
                      </div>
                    ) : (
                      <img src={evidenceUploadPreviewUrl} alt="Evidence upload preview" className="max-h-40 w-full object-contain" />
                    )}
                  </div>
                ) : null}
                {evidenceUploadPreviewUrl || evidenceUploadFileName ? (
                  <button
                    type="button"
                    className={`mt-2 rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100 ${disabledAsideActionClass}`}
                    onClick={onClearEvidenceUploadFile}
                    disabled={!!actionDisabledReason}
                  >
                    Clear selected file
                  </button>
                ) : null}
                {evidenceCurrentMediaUrl || String(evidenceCurrentMediaName).trim() ? (
                  <button
                    type="button"
                    className={`mt-2 w-full rounded-none border border-black bg-white px-2 py-1 text-xs text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`}
                    onClick={() => void onDeleteEvidenceAttachment()}
                    disabled={!!actionDisabledReason}
                  >
                    Delete attachment
                  </button>
                ) : null}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={Boolean(bowtieDraft.show_canvas_preview)}
                onChange={(e) => setField("show_canvas_preview", e.target.checked)}
              />
              <span>Show image/PDF preview on canvas</span>
            </label>
          </>
        ) : null}

        {bowtieElementType === "incident_response_recovery" ? (
          <label className="text-sm text-white">Category
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
              value={String(bowtieDraft.category ?? "")}
              onChange={(e) => setField("category", e.target.value)}
            >
              <option value="">Select category</option>
              <option value="emergency_response">Emergency Response</option>
              <option value="medical_treatment">Medical Treatment</option>
              <option value="scene_preservation">Scene Preservation</option>
              <option value="make_area_safe">Make Area Safe</option>
            </select>
          </label>
        ) : null}

        {bowtieElementType === "incident_finding" ? (
          <label className="text-sm text-white">Confidence Level
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
              value={String(bowtieDraft.confidence_level ?? "medium")}
              onChange={(e) => setField("confidence_level", e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        ) : null}

        {bowtieElementType === "incident_recommendation" ? (
          <>
            <label className="text-sm text-white">Action Type
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.action_type ?? "corrective")}
                onChange={(e) => setField("action_type", e.target.value)}
              >
                <option value="corrective">Corrective</option>
                <option value="preventive">Preventive</option>
              </select>
            </label>
            <label className="text-sm text-white">Owner
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.owner_text ?? "")} onChange={(e) => setField("owner_text", e.target.value)} />
            </label>
            <label className="text-sm text-white">Due Date
              <input
                type="date"
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.due_date ?? "")}
                onChange={(e) => setField("due_date", e.target.value)}
              />
            </label>
          </>
        ) : null}
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button
          className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`}
          onClick={() => void onDelete()}
          disabled={!!actionDisabledReason}
        >
          Delete {title.toLowerCase()}
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onSave()} disabled={!!actionDisabledReason}>
            Save {title.toLowerCase()}
          </button>
        )}
      </div>
    </AsideShell>
  );
}

type GroupingContainerAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  groupingLabelDraft: string;
  setGroupingLabelDraft: (value: string) => void;
  groupingHeaderColorDraft: string;
  setGroupingHeaderColorDraft: (value: string) => void;
  groupingHeaderFontSizeDraft: string;
  setGroupingHeaderFontSizeDraft: (value: string) => void;
  groupingOutlineWidthDraft: string;
  setGroupingOutlineWidthDraft: (value: string) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  onAddRelationship: () => void;
  relatedRows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
  actionDisabledReason?: string;
};

export function GroupingContainerAside({
  open,
  isMobile,
  leftAsideSlideIn,
  groupingLabelDraft,
  setGroupingLabelDraft,
  groupingHeaderColorDraft,
  setGroupingHeaderColorDraft,
  groupingHeaderFontSizeDraft,
  setGroupingHeaderFontSizeDraft,
  groupingOutlineWidthDraft,
  setGroupingOutlineWidthDraft,
  onDelete,
  onSave,
  onClose,
  onAddRelationship,
  relatedRows,
  resolveLabels,
  relationshipSectionProps,
  actionDisabledReason,
}: GroupingContainerAsideProps) {
  if (!open) return null;
  const safeHeaderColor = /^#[0-9a-fA-F]{6}$/.test(groupingHeaderColorDraft) ? groupingHeaderColorDraft.toUpperCase() : "#FFFFFF";
  const groupingTextSizeOptions = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48] as const;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Grouping Container" onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-4 space-y-3">
        <label className="text-sm text-white">Group Label
          <input
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            value={groupingLabelDraft}
            onChange={(e) => setGroupingLabelDraft(e.target.value)}
            placeholder="Enter group label"
          />
        </label>
        <div className="text-sm text-white">
          <div>Header Colour</div>
          <PaletteSwatchGrid selectedColor={safeHeaderColor} swatchKeyPrefix="grouping-header" onSelect={setGroupingHeaderColorDraft} />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              className="h-10 w-14 rounded-none border border-slate-300 bg-white p-1"
              value={safeHeaderColor}
              onChange={(e) => setGroupingHeaderColorDraft(e.target.value.toUpperCase())}
            />
            <input
              type="text"
              className="h-10 w-full rounded border border-slate-300 bg-white px-3 py-2 font-mono text-black"
              value={groupingHeaderColorDraft}
              onChange={(e) => setGroupingHeaderColorDraft(e.target.value.toUpperCase())}
              placeholder="#FFFFFF"
            />
          </div>
        </div>
        <label className="text-sm text-white">Text Size
          <FontSizePicker value={groupingHeaderFontSizeDraft} onChange={setGroupingHeaderFontSizeDraft} options={groupingTextSizeOptions} />
        </label>
        <OutlineWeightField value={groupingOutlineWidthDraft} onChange={setGroupingOutlineWidthDraft} label="Container Outline Weight (max 12)" />
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button
          className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`}
          onClick={() => void onDelete()}
          disabled={!!actionDisabledReason}
        >
          Delete container
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onSave()} disabled={!!actionDisabledReason}>Save container</button>
        )}
      </div>
    </AsideShell>
  );
}

type AnchorListItem = {
  id: string;
  title: string;
  creatorName: string;
  sequenceNumber: number;
  isCurrent?: boolean;
  isDirectLink?: boolean;
};

type AnchorAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  anchorTitleDraft: string;
  setAnchorTitleDraft: (value: string) => void;
  anchorColorDraft: string;
  setAnchorColorDraft: (value: string) => void;
  anchorSearchDraft: string;
  setAnchorSearchDraft: (value: string) => void;
  selectedAnchorSequenceNumber: number;
  anchorGroupSize: number;
  linkedAnchors: AnchorListItem[];
  searchResults: AnchorListItem[];
  onAddLink: (anchorId: string) => Promise<void>;
  onRemoveLink: (anchorId: string) => Promise<void>;
  onReorderLinkedAnchors: (orderedIds: string[]) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  actionDisabledReason?: string;
};

const getReorderedAnchorIds = (
  ids: string[],
  draggedId: string,
  targetId: string,
  placement: "before" | "after"
) => {
  if (draggedId === targetId) return ids;
  const withoutDragged = ids.filter((id) => id !== draggedId);
  const targetIndex = withoutDragged.indexOf(targetId);
  if (targetIndex < 0) return ids;
  const insertIndex = placement === "after" ? targetIndex + 1 : targetIndex;
  const nextIds = [...withoutDragged];
  nextIds.splice(insertIndex, 0, draggedId);
  return nextIds;
};

const anchorIdArraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((id, index) => id === right[index]);

export function AnchorAside({
  open,
  isMobile,
  leftAsideSlideIn,
  anchorTitleDraft,
  setAnchorTitleDraft,
  anchorColorDraft,
  setAnchorColorDraft,
  anchorSearchDraft,
  setAnchorSearchDraft,
  selectedAnchorSequenceNumber,
  anchorGroupSize,
  linkedAnchors,
  searchResults,
  onAddLink,
  onRemoveLink,
  onReorderLinkedAnchors,
  onDelete,
  onSave,
  onClose,
  actionDisabledReason,
}: AnchorAsideProps) {
  const [draggedAnchorId, setDraggedAnchorId] = useState<string | null>(null);
  const [dragPreviewIds, setDragPreviewIds] = useState<string[] | null>(null);
  const [dragOverAnchorId, setDragOverAnchorId] = useState<string | null>(null);
  const [anchorColourPickerOpen, setAnchorColourPickerOpen] = useState(false);
  useEffect(() => {
    if (!draggedAnchorId) return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "grabbing";
    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [draggedAnchorId]);
  if (!open) return null;
  const safeAnchorColor = /^#[0-9a-fA-F]{6}$/.test(anchorColorDraft) ? anchorColorDraft.toUpperCase() : "#0F766E";
  const linkedAnchorIds = linkedAnchors.map((anchor) => anchor.id);
  const linkedAnchorById = new Map(linkedAnchors.map((anchor) => [anchor.id, anchor]));
  const displayedLinkedAnchors = (dragPreviewIds ?? linkedAnchorIds)
    .map((id) => linkedAnchorById.get(id))
    .filter((anchor): anchor is AnchorListItem => Boolean(anchor));

  const resetAnchorDragState = () => {
    setDraggedAnchorId(null);
    setDragPreviewIds(null);
    setDragOverAnchorId(null);
  };
  const handleAnchorDragStart = (anchorId: string, event: DragEvent<HTMLDivElement>) => {
    if (actionDisabledReason) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", anchorId);
    event.dataTransfer.setDragImage(event.currentTarget, 24, Math.round(event.currentTarget.offsetHeight / 2));
    setDraggedAnchorId(anchorId);
    setDragPreviewIds(linkedAnchorIds);
    setDragOverAnchorId(anchorId);
  };
  const handleAnchorDragOver = (targetAnchorId: string, event: DragEvent<HTMLDivElement>) => {
    if (actionDisabledReason || !draggedAnchorId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const placement = event.clientY > rect.top + rect.height / 2 ? "after" : "before";
    setDragOverAnchorId(targetAnchorId);
    setDragPreviewIds((currentPreviewIds) => {
      const currentIds = currentPreviewIds?.length ? currentPreviewIds : linkedAnchorIds;
      const nextIds = getReorderedAnchorIds(currentIds, draggedAnchorId, targetAnchorId, placement);
      return anchorIdArraysEqual(currentIds, nextIds) ? currentIds : nextIds;
    });
  };
  const handleAnchorDrop = (event: DragEvent<HTMLDivElement>) => {
    if (actionDisabledReason) return;
    event.preventDefault();
    const nextIds = dragPreviewIds?.length ? dragPreviewIds : linkedAnchorIds;
    if (draggedAnchorId && !anchorIdArraysEqual(linkedAnchorIds, nextIds)) {
      onReorderLinkedAnchors(nextIds);
    }
    resetAnchorDragState();
  };
  const trimmedAnchorSearch = anchorSearchDraft.trim();

  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Anchor" onClose={onClose} readOnly={!!actionDisabledReason}>
      <div className="mt-4 space-y-3">
        <label className="text-sm text-white">Sequence Number
          <input
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
            value={String(selectedAnchorSequenceNumber)}
            readOnly
          />
        </label>
        <label className="text-sm text-white">Title
          <input
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
            value={anchorTitleDraft}
            onChange={(e) => setAnchorTitleDraft(e.target.value)}
            placeholder="Enter anchor title"
            disabled={!!actionDisabledReason}
          />
        </label>
        <div className="text-sm text-slate-100">
          <div>Anchor Group Colour</div>
          <div className="mt-1.5 grid grid-cols-[auto_72px] items-center gap-3">
            <span>Colour</span>
            <button
              type="button"
              className={`h-9 w-[72px] rounded-[8px] border transition ${
                anchorColourPickerOpen ? "border-white ring-2 ring-white/80" : "border-white/40"
              } ${actionDisabledReason ? "cursor-not-allowed opacity-60" : ""}`}
              style={{ backgroundColor: safeAnchorColor }}
              onClick={() => setAnchorColourPickerOpen((current) => !current)}
              aria-label="Select anchor group colour"
              title="Select anchor group colour"
              disabled={!!actionDisabledReason}
            />
          </div>
          <p className="mt-1 text-xs leading-snug text-slate-300">
            Updates all {Math.max(1, anchorGroupSize)} anchor{Math.max(1, anchorGroupSize) === 1 ? "" : "s"} in this linked anchor group.
          </p>
          {anchorColourPickerOpen ? (
            <div className="mt-3">
              <PaletteSwatchGrid
                selectedColor={safeAnchorColor}
                swatchKeyPrefix="anchor-group-swatch"
                onSelect={(hex) => {
                  setAnchorColorDraft(hex);
                  setAnchorColourPickerOpen(false);
                }}
              />
            </div>
          ) : null}
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Anchor Sequence</div>
          <div className="mt-2 space-y-2">
            {displayedLinkedAnchors.length ? (
              displayedLinkedAnchors.map((anchor, index) => {
                const isDragging = draggedAnchorId === anchor.id;
                const isDragTarget = dragOverAnchorId === anchor.id && draggedAnchorId !== anchor.id;
                return (
                  <div
                    key={anchor.id}
                    draggable={!actionDisabledReason}
                    onDragStart={(event) => handleAnchorDragStart(anchor.id, event)}
                    onDragEnd={resetAnchorDragState}
                    onDragOver={(event) => handleAnchorDragOver(anchor.id, event)}
                    onDrop={handleAnchorDrop}
                    aria-grabbed={isDragging}
                    className={`flex select-none items-center gap-2 rounded border bg-white px-2 py-2 text-black shadow-sm transition duration-150 ${
                      actionDisabledReason ? "" : "cursor-grab active:cursor-grabbing"
                    } ${
                      isDragging ? "cursor-grabbing border-[#0f766e] bg-[#ecfdf5] opacity-80 shadow-lg ring-2 ring-teal-400/40 scale-[0.98]" : "border-slate-500/60"
                    } ${
                      isDragTarget ? "border-[#0f766e] ring-2 ring-teal-400/30" : ""
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center border border-slate-300 text-xs font-bold text-slate-600 ${
                        actionDisabledReason ? "" : isDragging ? "cursor-grabbing" : "cursor-grab"
                      }`}
                      title="Drag to reorder"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="truncate text-sm font-semibold">{anchor.title}</div>
                        {anchor.isCurrent ? (
                          <span className="shrink-0 border border-[#0f766e]/25 bg-[#ccfbf1] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-[#0f766e]">
                            Current
                          </span>
                        ) : null}
                      </div>
                      <div className="truncate text-[11px] text-slate-500">{anchor.creatorName}</div>
                    </div>
                    {anchor.isCurrent ? (
                      <span className="h-8 w-8 shrink-0" aria-hidden="true" />
                    ) : anchor.isDirectLink ? (
                      <button
                        type="button"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center border border-slate-300 hover:bg-slate-100 ${disabledAsideActionClass}`}
                        onClick={() => void onRemoveLink(anchor.id)}
                        disabled={!!actionDisabledReason}
                        aria-label={`Delink ${anchor.title}`}
                        title="Delink anchor"
                      >
                        <img src="/icons/delink.svg" alt="" className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="h-8 w-8 shrink-0" title="Linked through this anchor group" aria-hidden="true" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded border border-slate-300 bg-white px-3 py-3 text-sm text-slate-600">
                No linked anchors yet.
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-white">Search Anchors
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal text-black"
              value={anchorSearchDraft}
              onChange={(e) => setAnchorSearchDraft(e.target.value)}
              placeholder="Search by anchor name or user"
              disabled={!!actionDisabledReason}
            />
          </label>
          {trimmedAnchorSearch ? (
            <>
              <p className="mt-2 text-xs text-white/70">
                {searchResults.length} result{searchResults.length === 1 ? "" : "s"} found for &quot;{trimmedAnchorSearch}&quot;
              </p>
              <div className="mt-3 max-h-56 overflow-y-auto rounded border border-slate-300 bg-white">
                {searchResults.length ? (
                  searchResults.map((anchor) => (
                    <button
                      key={anchor.id}
                      type="button"
                      className={`flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-left text-slate-800 last:border-b-0 hover:bg-slate-50 ${disabledAsideActionClass}`}
                      onClick={() => void onAddLink(anchor.id)}
                      disabled={!!actionDisabledReason}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-slate-300 text-xs font-bold text-[#0f766e]">
                        {anchor.sequenceNumber}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{anchor.title}</span>
                        <span className="block truncate text-[11px] text-slate-500">{anchor.creatorName}</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2.5 text-sm text-slate-500">No available anchors match that search.</div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <button
          className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 ${disabledAsideActionClass}`}
          onClick={() => void onDelete()}
          disabled={!!actionDisabledReason}
        >
          Delete anchor
        </button>
        {wrapWithReason(
          actionDisabledReason,
          <button className={`flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onSave()} disabled={!!actionDisabledReason}>Save anchor</button>
        )}
      </div>
    </AsideShell>
  );
}

type DocumentTypeOption = { id: string; name: string };

type DocumentPropertiesAsideProps = {
  open: boolean;
  leftAsideSlideIn: boolean;
  onClose: () => void;
  onOpenRelationship: () => void | Promise<void>;
  onOpenStructure: () => void | Promise<void>;
  onOpenDelete: () => void;
  selectedTypeId: string;
  setSelectedTypeId: (value: string) => void;
  showTypeSelectArrowUp: boolean;
  setShowTypeSelectArrowUp: (value: boolean) => void;
  addDocumentTypes: DocumentTypeOption[];
  getDisplayTypeName: (name: string) => string;
  title: string;
  setTitle: (value: string) => void;
  documentNumber: string;
  setDocumentNumber: (value: string) => void;
  disciplineMenuRef: RefObject<HTMLDivElement | null>;
  showDisciplineMenu: boolean;
  setShowDisciplineMenu: (updater: (prev: boolean) => boolean) => void;
  disciplineSelection: DisciplineKey[];
  setDisciplineSelection: (updater: (prev: DisciplineKey[]) => DisciplineKey[]) => void;
  disciplineOptions: Array<{ key: DisciplineKey; label: string }>;
  getDisciplineLabel: (key: DisciplineKey) => string | undefined;
  userGroup: string;
  setUserGroup: (value: string) => void;
  showUserGroupSelectArrowUp: boolean;
  setShowUserGroupSelectArrowUp: (value: boolean) => void;
  userGroupOptions: readonly string[];
  ownerName: string;
  setOwnerName: (value: string) => void;
  onSaveNode: () => Promise<void>;
  relatedRows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
  actionDisabledReason?: string;
};

export function DocumentPropertiesAside({
  open,
  leftAsideSlideIn,
  onClose,
  onOpenRelationship,
  onOpenStructure,
  onOpenDelete,
  selectedTypeId,
  setSelectedTypeId,
  showTypeSelectArrowUp,
  setShowTypeSelectArrowUp,
  addDocumentTypes,
  getDisplayTypeName,
  title,
  setTitle,
  documentNumber,
  setDocumentNumber,
  disciplineMenuRef,
  showDisciplineMenu,
  setShowDisciplineMenu,
  disciplineSelection,
  setDisciplineSelection,
  disciplineOptions,
  getDisciplineLabel,
  userGroup,
  setUserGroup,
  showUserGroupSelectArrowUp,
  setShowUserGroupSelectArrowUp,
  userGroupOptions,
  ownerName,
  setOwnerName,
  onSaveNode,
  relatedRows,
  resolveLabels,
  relationshipSectionProps,
  actionDisabledReason,
}: DocumentPropertiesAsideProps) {
  if (!open) return null;
  return (
    <aside
      data-read-only={actionDisabledReason ? "true" : undefined}
      className="canvas-left-aside fixed bottom-4 left-[98px] top-[82px] z-[75] w-[calc(100vw-122px)] max-w-[408px] rounded-[28px] border bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)] transition-transform duration-300"
      style={{ transform: leftAsideSlideIn ? "translateX(0)" : "translateX(-100%)" }}
    >
      <div className="canvas-left-aside__body flex h-full flex-col overflow-auto p-4">
        <div className="canvas-left-aside__header flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
          <h2 className="canvas-left-aside__title text-lg font-semibold text-white">Document Properties</h2>
          <button className="canvas-left-aside__close w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={onClose}>Close</button>
        </div>
        <fieldset disabled={!!actionDisabledReason} className="m-0 min-w-0 border-0 p-0 disabled:opacity-100">
        <div className="mt-3 grid grid-cols-3 gap-2">
          {wrapWithReason(
            actionDisabledReason,
            <button
              title={undefined}
              aria-label="Document Structure"
              className={`flex h-11 items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100 ${disabledAsideActionClass}`}
              onClick={() => void onOpenStructure()}
              disabled={!!actionDisabledReason}
            >
              <img src="/icons/structure.svg" alt="" className="h-4 w-4" />
              <span className="truncate">Structure</span>
            </button>
          )}
          {wrapWithReason(
            actionDisabledReason,
            <button
              title={undefined}
              aria-label="Delete Document"
              className={`flex h-11 items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100 ${disabledAsideActionClass}`}
              onClick={onOpenDelete}
              disabled={!!actionDisabledReason}
            >
              <img src="/icons/deletecomponent.svg" alt="" className="h-4 w-4" />
              <span className="truncate">Delete</span>
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <label className="text-sm text-white">Document Type
            <div className="relative mt-1">
              <select
                className="w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-black"
                value={selectedTypeId}
                onChange={(e) => {
                  setSelectedTypeId(e.target.value);
                  setShowTypeSelectArrowUp(false);
                }}
                onFocus={() => setShowTypeSelectArrowUp(true)}
                onBlur={() => setShowTypeSelectArrowUp(false)}
                onMouseDown={() => setShowTypeSelectArrowUp(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" || e.key === "Tab") setShowTypeSelectArrowUp(false);
                }}
              >
                {addDocumentTypes.map((t) => <option key={t.id} value={t.id}>{getDisplayTypeName(t.name)}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black">
                {showTypeSelectArrowUp ? "▲" : "▼"}
              </span>
            </div>
          </label>
          <label className="text-sm text-white">Name<input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="text-sm text-white">Document Number<input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Enter document number" /></label>
          <div className="text-sm text-white">
            <div className="text-white">Discipline</div>
            <div ref={disciplineMenuRef} className="relative mt-1">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left text-black"
                onClick={() => setShowDisciplineMenu((prev) => !prev)}
              >
                <span className="truncate text-sm text-black">
                  {disciplineSelection.length
                    ? disciplineSelection.map((key) => getDisciplineLabel(key)).filter(Boolean).join(", ")
                    : "Select disciplines"}
                </span>
                <span className="text-xs text-black">{showDisciplineMenu ? "▲" : "▼"}</span>
              </button>
              {showDisciplineMenu && (
                <div className="absolute z-30 mt-1 w-full rounded border border-slate-300 bg-white p-2 shadow-lg">
                  {disciplineOptions.map((option) => {
                    const checked = disciplineSelection.includes(option.key);
                    return (
                      <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-black hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setDisciplineSelection((prev) =>
                              prev.includes(option.key)
                                ? prev.filter((key) => key !== option.key)
                                : [...prev, option.key]
                            )
                          }
                        />
                        <span className="text-black">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <label className="text-sm text-white">User Group
            <div className="relative mt-1">
              <select
                className="w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-black"
                value={userGroup}
                onChange={(e) => {
                  setUserGroup(e.target.value);
                  setShowUserGroupSelectArrowUp(false);
                }}
                onFocus={() => setShowUserGroupSelectArrowUp(true)}
                onBlur={() => setShowUserGroupSelectArrowUp(false)}
                onMouseDown={() => setShowUserGroupSelectArrowUp(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" || e.key === "Tab") setShowUserGroupSelectArrowUp(false);
                }}
              >
                <option value="">Select user group</option>
                {userGroup && !userGroupOptions.includes(userGroup) ? (
                  <option value={userGroup}>{userGroup}</option>
                ) : null}
                {userGroupOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black">
                {showUserGroupSelectArrowUp ? "▲" : "▼"}
              </span>
            </div>
          </label>
          <label className="text-sm text-white">Owner<input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Enter owner name" /></label>
        </div>

        <div className="mt-4">
          {wrapWithReason(
            actionDisabledReason,
            <button className={`w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 ${disabledAsideActionClass}`} onClick={() => void onSaveNode()} disabled={!!actionDisabledReason}>Save properties</button>
          )}
        </div>
        </fieldset>
      </div>
    </aside>
  );
}

type MobileRelationshipListItem = {
  id: string;
  label: string;
  type: string;
};

type MobileDocumentPropertiesModalProps = {
  open: boolean;
  onClose: () => void;
  selectedTypeId: string;
  setSelectedTypeId: (value: string) => void;
  addDocumentTypes: DocumentTypeOption[];
  getDisplayTypeName: (name: string) => string;
  title: string;
  setTitle: (value: string) => void;
  documentNumber: string;
  setDocumentNumber: (value: string) => void;
  showDisciplineMenu: boolean;
  setShowDisciplineMenu: (updater: (prev: boolean) => boolean) => void;
  disciplineMenuRef: RefObject<HTMLDivElement | null>;
  disciplineSelection: DisciplineKey[];
  setDisciplineSelection: (updater: (prev: DisciplineKey[]) => DisciplineKey[]) => void;
  disciplineOptions: Array<{ key: DisciplineKey; label: string }>;
  getDisciplineLabel: (key: DisciplineKey) => string | undefined;
  userGroup: string;
  setUserGroup: (value: string) => void;
  userGroupOptions: readonly string[];
  ownerName: string;
  setOwnerName: (value: string) => void;
  onSaveNode: () => Promise<void>;
  relatedItems: MobileRelationshipListItem[];
  onDeleteRelation: (relationId: string) => void;
  actionDisabledReason?: string;
};

export function MobileDocumentPropertiesModal({
  open,
  onClose,
  selectedTypeId,
  setSelectedTypeId,
  addDocumentTypes,
  getDisplayTypeName,
  title,
  setTitle,
  documentNumber,
  setDocumentNumber,
  showDisciplineMenu,
  setShowDisciplineMenu,
  disciplineMenuRef,
  disciplineSelection,
  setDisciplineSelection,
  disciplineOptions,
  getDisciplineLabel,
  userGroup,
  setUserGroup,
  userGroupOptions,
  ownerName,
  setOwnerName,
  onSaveNode,
  relatedItems,
  onDeleteRelation,
  actionDisabledReason,
}: MobileDocumentPropertiesModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[98] overflow-y-auto bg-white text-slate-900" data-read-only={actionDisabledReason ? "true" : undefined}>
      <div className="min-h-full px-5 pb-28 pt-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-semibold">Document Properties</h2>
          <button
            type="button"
            className="canvas-left-aside__close inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-900"
            onClick={onClose}
          >
            <span className="text-xl leading-none">x</span>
          </button>
        </div>

        <fieldset disabled={!!actionDisabledReason} className="m-0 min-w-0 border-0 p-0 disabled:opacity-100">
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">Document Type
            <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)}>
              {addDocumentTypes.map((t) => <option key={t.id} value={t.id}>{getDisplayTypeName(t.name)}</option>)}
            </select>
          </label>
          <label className="text-sm">Name<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="text-sm">Document Number<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Enter document number" /></label>
          <div className="text-sm">
            <div>Discipline</div>
            <div ref={disciplineMenuRef} className="relative mt-1">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left"
                onClick={() => setShowDisciplineMenu((prev) => !prev)}
              >
                <span className="truncate text-sm text-slate-700">
                  {disciplineSelection.length
                    ? disciplineSelection.map((key) => getDisciplineLabel(key)).filter(Boolean).join(", ")
                    : "Select disciplines"}
                </span>
                <span className="text-xs text-slate-500">{showDisciplineMenu ? "▲" : "▼"}</span>
              </button>
              {showDisciplineMenu && (
                <div className="absolute z-30 mt-1 w-full rounded border border-slate-300 bg-white p-2 shadow-lg">
                  {disciplineOptions.map((option) => {
                    const checked = disciplineSelection.includes(option.key);
                    return (
                      <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setDisciplineSelection((prev) =>
                              prev.includes(option.key)
                                ? prev.filter((key) => key !== option.key)
                                : [...prev, option.key]
                            )
                          }
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <label className="text-sm">User Group
            <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={userGroup} onChange={(e) => setUserGroup(e.target.value)}>
              <option value="">Select user group</option>
              {userGroup && !userGroupOptions.includes(userGroup as (typeof userGroupOptions)[number]) ? (
                <option value={userGroup}>{userGroup}</option>
              ) : null}
              {userGroupOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="text-sm">Owner<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Enter owner name" /></label>
        </div>

        <div className="mt-4 flex justify-end"><button className="dashboardButton dashboardButtonPrimary" onClick={() => void onSaveNode()} disabled={!!actionDisabledReason}>Save properties</button></div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="font-semibold">Relationships</h3>
          <div className="mt-3 space-y-2">
            {relatedItems.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm">
                <span>{r.label} ({r.type})</span>
                <button className="text-rose-700" onClick={() => onDeleteRelation(r.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
        </fieldset>
      </div>
    </div>
  );
}

