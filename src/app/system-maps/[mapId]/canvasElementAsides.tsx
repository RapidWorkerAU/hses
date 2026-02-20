"use client";

import type { ReactNode, RefObject } from "react";
import type { CanvasElementRow, DisciplineKey, NodeRelationRow, RelationshipCategory } from "./canvasShared";

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
                        <option value="information">Information</option>
                        <option value="systems">Systems</option>
                        <option value="process">Process</option>
                        <option value="data">Data</option>
                        <option value="other">Other</option>
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
  personRoleDraft: string;
  setPersonRoleDraft: (value: string) => void;
  personDepartmentDraft: string;
  setPersonDepartmentDraft: (value: string) => void;
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
  personRoleDraft,
  setPersonRoleDraft,
  personDepartmentDraft,
  setPersonDepartmentDraft,
  onDelete,
  onSave,
  onClose,
  onAddRelationship,
  relatedRows,
  resolveLabels,
  relationshipSectionProps,
}: PersonPropertiesAsideProps) {
  if (!open) return null;
  return (
    <AsideShell isMobile={isMobile} leftAsideSlideIn={leftAsideSlideIn} title="Person Properties" onClose={onClose}>
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
