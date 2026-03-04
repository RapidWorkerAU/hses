"use client";

import type { ReactNode, RefObject } from "react";
import type { CanvasElementRow, DisciplineKey, NodeRelationRow, RelationshipCategory, RelationshipCategoryOption } from "./canvasShared";
import type { MapCategoryId } from "./mapCategories";
import { getDisplayRelationType } from "./canvasShared";

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

type AsideShellProps = {
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function AsideShell({ isMobile, leftAsideSlideIn, title, onClose, children }: AsideShellProps) {
  return (
    <aside
      className={`fixed z-[75] border-r border-[#0b1f33] bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)] transition-transform duration-300 ${
        isMobile ? "inset-0 w-full max-w-full" : "bottom-0 left-0 top-[70px] w-full max-w-[420px]"
      }`}
      style={{ transform: isMobile ? "translateX(0)" : leftAsideSlideIn ? "translateX(0)" : "translateX(-100%)" }}
    >
      <div className="flex h-full flex-col overflow-auto p-4">
        <div className="flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button className="w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </aside>
  );
}

type CategoryPropertiesAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  processMinWidthSquares: number;
  processMinHeightSquares: number;
  processHeadingDraft: string;
  setProcessHeadingDraft: (value: string) => void;
  processWidthDraft: string;
  setProcessWidthDraft: (value: string) => void;
  processHeightDraft: string;
  setProcessHeightDraft: (value: string) => void;
  categoryColorOptions: ReadonlyArray<{ name: string; value: string }>;
  processColorDraft: string | null;
  setProcessColorDraft: (updater: (prev: string | null) => string | null) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
};

export function CategoryPropertiesAside({
  open,
  isMobile,
  leftAsideSlideIn,
  processMinWidthSquares,
  processMinHeightSquares,
  processHeadingDraft,
  setProcessHeadingDraft,
  processWidthDraft,
  setProcessWidthDraft,
  processHeightDraft,
  setProcessHeightDraft,
  categoryColorOptions,
  processColorDraft,
  setProcessColorDraft,
  onDelete,
  onSave,
  onClose,
}: CategoryPropertiesAsideProps) {
  if (!open) return null;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Category Properties" onClose={onClose}>
      <div className="mt-4 space-y-3">
        <label className="text-sm text-white">Category Label
          <input
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            value={processHeadingDraft}
            onChange={(e) => setProcessHeadingDraft(e.target.value)}
            placeholder="Enter category label"
          />
        </label>
        <label className="text-sm text-white">Width (small squares, min {processMinWidthSquares})
          <input
            type="text"
            inputMode="numeric"
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            value={processWidthDraft}
            onChange={(e) => setProcessWidthDraft(e.target.value)}
          />
        </label>
        <label className="text-sm text-white">Height (small squares, min {processMinHeightSquares})
          <input
            type="text"
            inputMode="numeric"
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            value={processHeightDraft}
            onChange={(e) => setProcessHeightDraft(e.target.value)}
          />
        </label>
        <div className="text-sm text-white">
          <div>Category Colour</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {categoryColorOptions.map((option) => {
              const selected = (processColorDraft ?? "").toLowerCase() === option.value.toLowerCase();
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.name}
                  aria-label={option.name}
                  className={`h-8 rounded-none border ${selected ? "border-white ring-2 ring-white/80" : "border-slate-300"} shadow-sm`}
                  style={{ backgroundColor: option.value }}
                  onClick={() =>
                    setProcessColorDraft((prev) =>
                      (prev ?? "").toLowerCase() === option.value.toLowerCase() ? null : option.value
                    )
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
          onClick={() => void onDelete()}
        >
          Delete category
        </button>
        <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={() => void onSave()}>Save category</button>
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
}: SimpleLabelAsideProps) {
  if (!open) return null;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title={title} onClose={onClose}>
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
      <div className="mt-4 flex items-center justify-between">
        <button
          className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
          onClick={() => void onDelete()}
        >
          {deleteButtonLabel}
        </button>
        <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={() => void onSave()}>{saveButtonLabel}</button>
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
      deleteButtonLabel="Delete system"
      saveButtonLabel="Save name"
      topAction={
        <button
          title="Add Relationship"
          aria-label="Add Relationship"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
          onClick={props.onAddRelationship}
        >
          <img src="/icons/relationship.svg" alt="" className="h-4 w-4" />
          <span className="truncate">Relationship</span>
        </button>
      }
      footerExtra={<RelationshipSection rows={props.relatedRows} resolveLabels={props.resolveLabels} {...props.relationshipSectionProps} />}
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
      deleteButtonLabel="Delete process"
      saveButtonLabel="Save label"
      topAction={
        <button
          title="Add Relationship"
          aria-label="Add Relationship"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
          onClick={props.onAddRelationship}
        >
          <img src="/icons/relationship.svg" alt="" className="h-4 w-4" />
          <span className="truncate">Relationship</span>
        </button>
      }
      footerExtra={<RelationshipSection rows={props.relatedRows} resolveLabels={props.resolveLabels} {...props.relationshipSectionProps} />}
    />
  );
}

type StickyNoteAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  stickyTextDraft: string;
  setStickyTextDraft: (value: string) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
};

export function StickyNoteAside({
  open,
  isMobile,
  leftAsideSlideIn,
  stickyTextDraft,
  setStickyTextDraft,
  onDelete,
  onSave,
  onClose,
}: StickyNoteAsideProps) {
  if (!open) return null;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Sticky Note" onClose={onClose}>
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
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
          onClick={() => void onDelete()}
        >
          Delete note
        </button>
        <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={() => void onSave()}>Save note</button>
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
}: ImageAssetAsideProps) {
  if (!open) return null;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Image Properties" onClose={onClose}>
      <div className="mt-3">
        <button
          title="Add Relationship"
          aria-label="Add Relationship"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
          onClick={onAddRelationship}
        >
          <img src="/icons/relationship.svg" alt="" className="h-4 w-4" />
          <span className="truncate">Relationship</span>
        </button>
      </div>
      <div className="mt-4 space-y-3">
        <label className="text-sm text-white">Image Description
          <textarea
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            rows={5}
            value={imageDescriptionDraft}
            onChange={(e) => setImageDescriptionDraft(e.target.value)}
            placeholder="Enter image description"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
          onClick={() => void onDelete()}
        >
          Delete image
        </button>
        <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={() => void onSave()}>
          Save image
        </button>
      </div>
      <RelationshipSection rows={relatedRows} resolveLabels={resolveLabels} {...relationshipSectionProps} />
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
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
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
  onDelete,
  onSave,
  onClose,
}: TextBoxAsideProps) {
  if (!open) return null;
  const textSizeOptions = [16, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 84, 96, 112, 128, 144, 168];
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Text Box" onClose={onClose}>
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
        <label className="text-sm text-white">Text Size (16px to 168px)
          <select
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            value={textBoxFontSizeDraft}
            onChange={(e) => setTextBoxFontSizeDraft(e.target.value)}
          >
            {textSizeOptions.map((size) => (
              <option key={size} value={String(size)} style={{ fontSize: `${size}px` }}>
                {size}px
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
          onClick={() => void onDelete()}
        >
          Delete text box
        </button>
        <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={() => void onSave()}>
          Save text
        </button>
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
                <div className="text-sm font-medium">
                  {labels.sourceLabel} {"->"} {labels.targetLabel} <span className="font-normal text-slate-500">({labels.targetType})</span>
                  <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
                    Relation: {getDisplayRelationType(r.relation_type)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    title="Edit relationship definition"
                    aria-label="Edit relationship definition"
                    className="rounded-none border border-slate-300 bg-white p-1 hover:bg-slate-100"
                    onClick={() => onStartEdit(r)}
                  >
                    <img src="/icons/edit.svg" alt="" className="h-4 w-4" />
                  </button>
                  <button
                    title="Delete relationship"
                    aria-label="Delete relationship"
                    className="rounded-none border border-slate-300 bg-white p-1 hover:bg-slate-100"
                    onClick={() => onDelete(r.id)}
                  >
                    <img src="/icons/delete.svg" alt="" className="h-4 w-4" />
                  </button>
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
                    <button
                      className="rounded-none border border-black bg-white px-2 py-1 text-xs font-semibold text-black hover:bg-slate-100"
                      onClick={() => onSave(r.id)}
                    >
                      Save
                    </button>
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

type PersonPropertiesAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  mapCategoryId: MapCategoryId;
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
  orgChartDepartmentOptions: readonly string[];
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  onAddRelationship: () => void;
  relatedRows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
};

export function PersonPropertiesAside({
  open,
  isMobile,
  leftAsideSlideIn,
  mapCategoryId,
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
  orgChartDepartmentOptions,
  onDelete,
  onSave,
  onClose,
  onAddRelationship,
  relatedRows,
  resolveLabels,
  relationshipSectionProps,
}: PersonPropertiesAsideProps) {
  if (!open) return null;
  const isOrgChart = mapCategoryId === "org_chart";
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Person Properties" onClose={onClose}>
      <div className="mt-3">
        <button
          title={isOrgChart ? "Link Direct Report" : "Add Relationship"}
          aria-label={isOrgChart ? "Link Direct Report" : "Add Relationship"}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
          onClick={onAddRelationship}
        >
          <img src="/icons/relationship.svg" alt="" className="h-4 w-4" />
          <span className="truncate">{isOrgChart ? "Link Direct Report" : "Relationship"}</span>
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {isOrgChart ? (
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
          </>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
          onClick={() => void onDelete()}
        >
          Delete person
        </button>
        <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={() => void onSave()}>Save person</button>
      </div>
      <RelationshipSection rows={relatedRows} resolveLabels={resolveLabels} {...relationshipSectionProps} />
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
    | "incident_finding"
    | "incident_recommendation"
    | null;
  bowtieHeadingDraft: string;
  setBowtieHeadingDraft: (value: string) => void;
  bowtieDraft: Record<string, string | boolean>;
  setBowtieDraft: React.Dispatch<React.SetStateAction<Record<string, string | boolean>>>;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  onAddRelationship: () => void;
  relatedRows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
};

export function BowtiePropertiesAside({
  open,
  isMobile,
  leftAsideSlideIn,
  bowtieElementType,
  bowtieHeadingDraft,
  setBowtieHeadingDraft,
  bowtieDraft,
  setBowtieDraft,
  onDelete,
  onSave,
  onClose,
  onAddRelationship,
  relatedRows,
  resolveLabels,
  relationshipSectionProps,
}: BowtiePropertiesAsideProps) {
  if (!open || !bowtieElementType) return null;
  const isRiskRating = bowtieElementType === "bowtie_risk_rating";
  const isIncidentElement = bowtieElementType.startsWith("incident_");
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
    incident_finding: "Finding",
    incident_recommendation: "Recommendation",
  } as const)[bowtieElementType] || "Node";

  const setField = (key: string, value: string | boolean) =>
    setBowtieDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title={`${title} Properties`} onClose={onClose}>
      <div className="mt-3">
        <button
          title="Add Relationship"
          aria-label="Add Relationship"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
          onClick={onAddRelationship}
        >
          <img src="/icons/relationship.svg" alt="" className="h-4 w-4" />
          <span className="truncate">Relationship</span>
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {!isIncidentElement ? (
          <label className="text-sm text-white">Label
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
              value={bowtieHeadingDraft}
              onChange={(e) => setBowtieHeadingDraft(e.target.value)}
            />
          </label>
        ) : (
          <div className="text-sm text-white">Label
            <div className="mt-1 rounded border border-slate-300 bg-[#0f2942] px-3 py-2 text-white">{bowtieHeadingDraft || title}</div>
          </div>
        )}
        {!isRiskRating ? (
          <label className="text-sm text-white">Description
            <textarea
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
              rows={3}
              value={String(bowtieDraft.description ?? "")}
              onChange={(e) => setField("description", e.target.value)}
            />
          </label>
        ) : null}

        {bowtieElementType === "bowtie_hazard" ? (
          <>
            <label className="text-sm text-white">Energy / Source Type
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.energy_source_type ?? "")} onChange={(e) => setField("energy_source_type", e.target.value)}>
                <option value="">Select type</option>
                {["mechanical", "electrical", "pressure", "chemical", "biological", "human", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <label className="text-sm text-white">Scope / Asset
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.scope_asset ?? "")} onChange={(e) => setField("scope_asset", e.target.value)} />
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
              <div className="mt-1 rounded border border-slate-300 bg-white px-3 py-2 text-black">{formatBowtieOptionLabel(String(bowtieDraft.risk_level ?? "medium"))}</div>
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
          <label className="text-sm text-white">Impact Type
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
              value={String(bowtieDraft.impact_type ?? "")}
              onChange={(e) => setField("impact_type", e.target.value)}
            >
              <option value="">Select impact type</option>
              {["injury", "damage", "loss", "environmental_impact", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
            </select>
          </label>
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
          </>
        ) : null}

        {bowtieElementType === "incident_system_factor" ? (
          <>
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
            <label className="text-sm text-white">Cause Level
              <select
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={String(bowtieDraft.cause_level ?? "contributing")}
                onChange={(e) => setField("cause_level", e.target.value)}
              >
                <option value="immediate">Immediate</option>
                <option value="contributing">Contributing</option>
                <option value="root">Root</option>
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
                {["engineering", "administrative", "ppe", "other"].map((v) => <option key={v} value={v}>{formatBowtieOptionLabel(v)}</option>)}
              </select>
            </label>
            <label className="text-sm text-white">Owner
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.owner_text ?? "")} onChange={(e) => setField("owner_text", e.target.value)} />
            </label>
            <label className="text-sm text-white">Verification Method
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.verification_method ?? "")} onChange={(e) => setField("verification_method", e.target.value)} />
            </label>
            <label className="text-sm text-white">Verification Frequency
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={String(bowtieDraft.verification_frequency ?? "")} onChange={(e) => setField("verification_frequency", e.target.value)} />
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
          </>
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
      <div className="mt-4 flex items-center justify-between">
        <button
          className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
          onClick={() => void onDelete()}
        >
          Delete {title.toLowerCase()}
        </button>
        <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={() => void onSave()}>
          Save {title.toLowerCase()}
        </button>
      </div>
      <RelationshipSection rows={relatedRows} resolveLabels={resolveLabels} {...relationshipSectionProps} />
    </AsideShell>
  );
}

type GroupingContainerAsideProps = {
  open: boolean;
  isMobile: boolean;
  leftAsideSlideIn: boolean;
  groupingLabelDraft: string;
  setGroupingLabelDraft: (value: string) => void;
  groupingWidthDraft: string;
  setGroupingWidthDraft: (value: string) => void;
  groupingHeightDraft: string;
  setGroupingHeightDraft: (value: string) => void;
  onDelete: () => Promise<void>;
  onSave: () => Promise<void>;
  onClose: () => void;
  onAddRelationship: () => void;
  relatedRows: NodeRelationRow[];
  resolveLabels: (row: NodeRelationRow) => RelationLabels;
  relationshipSectionProps: Omit<RelationshipSectionProps, "rows" | "resolveLabels">;
};

export function GroupingContainerAside({
  open,
  isMobile,
  leftAsideSlideIn,
  groupingLabelDraft,
  setGroupingLabelDraft,
  groupingWidthDraft,
  setGroupingWidthDraft,
  groupingHeightDraft,
  setGroupingHeightDraft,
  onDelete,
  onSave,
  onClose,
  onAddRelationship,
  relatedRows,
  resolveLabels,
  relationshipSectionProps,
}: GroupingContainerAsideProps) {
  if (!open) return null;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Grouping Container" onClose={onClose}>
      <div className="mt-3">
        <button
          title="Add Relationship"
          aria-label="Add Relationship"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
          onClick={onAddRelationship}
        >
          <img src="/icons/relationship.svg" alt="" className="h-4 w-4" />
          <span className="truncate">Relationship</span>
        </button>
      </div>
      <div className="mt-4 space-y-3">
        <label className="text-sm text-white">Group Label
          <input
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            value={groupingLabelDraft}
            onChange={(e) => setGroupingLabelDraft(e.target.value)}
            placeholder="Enter group label"
          />
        </label>
        <label className="text-sm text-white">Width (small squares)
          <input
            type="text"
            inputMode="numeric"
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            value={groupingWidthDraft}
            onChange={(e) => setGroupingWidthDraft(e.target.value)}
          />
        </label>
        <label className="text-sm text-white">Height (small squares)
          <input
            type="text"
            inputMode="numeric"
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
            value={groupingHeightDraft}
            onChange={(e) => setGroupingHeightDraft(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100"
          onClick={() => void onDelete()}
        >
          Delete container
        </button>
        <button className="ml-2 w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={() => void onSave()}>Save container</button>
      </div>
      <RelationshipSection rows={relatedRows} resolveLabels={resolveLabels} {...relationshipSectionProps} />
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
}: DocumentPropertiesAsideProps) {
  if (!open) return null;
  return (
    <aside
      className="fixed bottom-0 left-0 top-[70px] z-[75] w-full max-w-[420px] border-r border-[#0b1f33] bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)] transition-transform duration-300"
      style={{ transform: leftAsideSlideIn ? "translateX(0)" : "translateX(-100%)" }}
    >
      <div className="flex h-full flex-col overflow-auto p-4">
        <div className="flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
          <h2 className="text-lg font-semibold text-white">Document Properties</h2>
          <button className="w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={onClose}>Close</button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            title="Add Relationship"
            aria-label="Add Relationship"
            className="flex h-11 items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
            onClick={() => void onOpenRelationship()}
          >
            <img src="/icons/relationship.svg" alt="" className="h-4 w-4" />
            <span className="truncate">Relationship</span>
          </button>
          <button
            title="Document Structure"
            aria-label="Document Structure"
            className="flex h-11 items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
            onClick={() => void onOpenStructure()}
          >
            <img src="/icons/structure.svg" alt="" className="h-4 w-4" />
            <span className="truncate">Structure</span>
          </button>
          <button
            title="Delete Document"
            aria-label="Delete Document"
            className="flex h-11 items-center justify-center gap-2 rounded-none border border-black bg-white px-2 text-[11px] font-medium text-black hover:bg-slate-100"
            onClick={onOpenDelete}
          >
            <img src="/icons/deletecomponent.svg" alt="" className="h-4 w-4" />
            <span className="truncate">Delete</span>
          </button>
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
          <button className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={() => void onSaveNode()}>Save properties</button>
        </div>
        <RelationshipSection rows={relatedRows} resolveLabels={resolveLabels} {...relationshipSectionProps} />
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
}: MobileDocumentPropertiesModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/45 p-4 pt-16 md:items-center md:pt-4">
      <div className="max-h-[calc(100svh-2rem)] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70 md:max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Document Properties</h2>
          <button className="text-sm text-slate-500" onClick={onClose}>Close</button>
        </div>

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

        <div className="mt-4 flex justify-end"><button className="btn btn-primary" onClick={() => void onSaveNode()}>Save properties</button></div>

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
      </div>
    </div>
  );
}
