"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CanvasElementRow, DisciplineKey, DocumentNodeRow, RelationshipCategory } from "./canvasShared";

type MobileNodeActionSheetProps = {
  open: boolean;
  title: string;
  onEditProperties: () => void;
  onAddRelationship: () => void;
  onOpenStructure: () => void;
  onDeleteDocument: () => void;
  onClose: () => void;
};

export function MobileNodeActionSheet({
  open,
  title,
  onEditProperties,
  onAddRelationship,
  onOpenStructure,
  onDeleteDocument,
  onClose,
}: MobileNodeActionSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:p-4">
      <div className="w-full rounded-t-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200/70 sm:max-w-md sm:rounded-xl">
        <div className="mb-2 text-sm font-semibold text-slate-900">{title || "Document"}</div>
        <div className="grid gap-2">
          <button className="btn btn-outline justify-start" onClick={onEditProperties}>Edit Properties</button>
          <button className="btn btn-outline justify-start" onClick={onAddRelationship}>Add Relationship</button>
          <button className="btn btn-outline justify-start" onClick={onOpenStructure}>Open Document Structure</button>
          <button className="btn btn-outline justify-start text-rose-700" onClick={onDeleteDocument}>Delete Document</button>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

type RelationshipCategoryOption = {
  value: RelationshipCategory;
  label: string;
};

type DisciplineOption = {
  key: DisciplineKey;
  label: string;
};

type MobileAddRelationshipModalProps = {
  open: boolean;
  sourceLabel: string;
  relationshipModeGrouping: boolean;
  relationshipGroupingQuery: string;
  setRelationshipGroupingQuery: (value: string) => void;
  groupingRelationCandidateIdByLabel: Map<string, string>;
  setRelationshipTargetGroupingId: (value: string) => void;
  alreadyRelatedGroupingTargetIds: Set<string>;
  showRelationshipGroupingOptions: boolean;
  setShowRelationshipGroupingOptions: Dispatch<SetStateAction<boolean>>;
  groupingRelationCandidates: CanvasElementRow[];
  groupingRelationCandidateLabelById: Map<string, string>;
  allowDocumentTargets: boolean;
  relationshipDocumentQuery: string;
  setRelationshipDocumentQuery: (value: string) => void;
  documentRelationCandidateIdByLabel: Map<string, string>;
  setRelationshipTargetDocumentId: (value: string) => void;
  alreadyRelatedDocumentTargetIds: Set<string>;
  showRelationshipDocumentOptions: boolean;
  setShowRelationshipDocumentOptions: Dispatch<SetStateAction<boolean>>;
  documentRelationCandidates: DocumentNodeRow[];
  documentRelationCandidateLabelById: Map<string, string>;
  allowSystemTargets: boolean;
  relationshipSystemQuery: string;
  setRelationshipSystemQuery: (value: string) => void;
  systemRelationCandidateIdByLabel: Map<string, string>;
  setRelationshipTargetSystemId: (value: string) => void;
  alreadyRelatedSystemTargetIds: Set<string>;
  showRelationshipSystemOptions: boolean;
  setShowRelationshipSystemOptions: Dispatch<SetStateAction<boolean>>;
  systemRelationCandidates: CanvasElementRow[];
  systemRelationCandidateLabelById: Map<string, string>;
  getElementRelationshipDisplayLabel: (element: CanvasElementRow) => string;
  relationshipDisciplineSelection: DisciplineKey[];
  disciplineLabelByKey: Map<DisciplineKey, string>;
  showRelationshipDisciplineMenu: boolean;
  setShowRelationshipDisciplineMenu: Dispatch<SetStateAction<boolean>>;
  disciplineOptions: DisciplineOption[];
  setRelationshipDisciplineSelection: Dispatch<SetStateAction<DisciplineKey[]>>;
  relationshipCategory: RelationshipCategory;
  setRelationshipCategory: (value: RelationshipCategory) => void;
  relationshipCategoryOptions: RelationshipCategoryOption[];
  relationshipCustomType: string;
  setRelationshipCustomType: (value: string) => void;
  relationshipDescription: string;
  setRelationshipDescription: (value: string) => void;
  relationshipTargetDocumentId: string;
  relationshipTargetSystemId: string;
  relationshipTargetGroupingId: string;
  onCancel: () => void;
  onAdd: () => void;
};

export function MobileAddRelationshipModal({
  open,
  sourceLabel,
  relationshipModeGrouping,
  relationshipGroupingQuery,
  setRelationshipGroupingQuery,
  groupingRelationCandidateIdByLabel,
  setRelationshipTargetGroupingId,
  alreadyRelatedGroupingTargetIds,
  showRelationshipGroupingOptions,
  setShowRelationshipGroupingOptions,
  groupingRelationCandidates,
  groupingRelationCandidateLabelById,
  allowDocumentTargets,
  relationshipDocumentQuery,
  setRelationshipDocumentQuery,
  documentRelationCandidateIdByLabel,
  setRelationshipTargetDocumentId,
  alreadyRelatedDocumentTargetIds,
  showRelationshipDocumentOptions,
  setShowRelationshipDocumentOptions,
  documentRelationCandidates,
  documentRelationCandidateLabelById,
  allowSystemTargets,
  relationshipSystemQuery,
  setRelationshipSystemQuery,
  systemRelationCandidateIdByLabel,
  setRelationshipTargetSystemId,
  alreadyRelatedSystemTargetIds,
  showRelationshipSystemOptions,
  setShowRelationshipSystemOptions,
  systemRelationCandidates,
  systemRelationCandidateLabelById,
  getElementRelationshipDisplayLabel,
  relationshipDisciplineSelection,
  disciplineLabelByKey,
  showRelationshipDisciplineMenu,
  setShowRelationshipDisciplineMenu,
  disciplineOptions,
  setRelationshipDisciplineSelection,
  relationshipCategory,
  setRelationshipCategory,
  relationshipCategoryOptions,
  relationshipCustomType,
  setRelationshipCustomType,
  relationshipDescription,
  setRelationshipDescription,
  relationshipTargetDocumentId,
  relationshipTargetSystemId,
  relationshipTargetGroupingId,
  onCancel,
  onAdd,
}: MobileAddRelationshipModalProps) {
  if (!open) return null;

  const disableAddButton =
    (!relationshipModeGrouping && (!allowDocumentTargets && !allowSystemTargets)) ||
    (!relationshipModeGrouping && !relationshipTargetDocumentId && !relationshipTargetSystemId) ||
    (relationshipModeGrouping && !relationshipTargetGroupingId) ||
    (relationshipCategory === "other" && !relationshipCustomType.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70">
        <h2 className="text-lg font-semibold">Add Relationship</h2>
        <p className="mt-1 text-sm text-slate-600">From: {sourceLabel || "Unknown source"}</p>
        <div className="mt-4 grid gap-3">
          {relationshipModeGrouping ? (
            <div className="relative">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Grouping Containers</div>
              <div className="relative flex">
                <input
                  className="w-full rounded-l border border-slate-300 bg-white px-3 py-2"
                  placeholder="Search grouping containers..."
                  value={relationshipGroupingQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setRelationshipGroupingQuery(query);
                    const candidateId = groupingRelationCandidateIdByLabel.get(query) ?? "";
                    setRelationshipTargetGroupingId(candidateId && !alreadyRelatedGroupingTargetIds.has(candidateId) ? candidateId : "");
                  }}
                />
                <button
                  type="button"
                  className="rounded-r border border-l-0 border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowRelationshipGroupingOptions((prev) => !prev)}
                >
                  {showRelationshipGroupingOptions ? "▲" : "▼"}
                </button>
              </div>
              {showRelationshipGroupingOptions && (
                <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                  {groupingRelationCandidates.length > 0 ? groupingRelationCandidates.map((el) => {
                    const optionLabel = groupingRelationCandidateLabelById.get(el.id) ?? (el.heading || "Group label");
                    const isDisabled = alreadyRelatedGroupingTargetIds.has(el.id);
                    return (
                      <button
                        key={el.id}
                        type="button"
                        className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                          isDisabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-800 hover:bg-slate-50"
                        }`}
                        disabled={isDisabled}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (isDisabled) return;
                          setRelationshipTargetGroupingId(el.id);
                          setRelationshipGroupingQuery(optionLabel);
                          setShowRelationshipGroupingOptions(false);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{optionLabel}</span>
                          {isDisabled && <span className="text-[10px] uppercase tracking-[0.06em]">Relationship already exists</span>}
                        </div>
                      </button>
                    );
                  }) : (
                    <div className="px-3 py-2 text-sm text-slate-500">No search results found</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {allowDocumentTargets ? <div className="relative">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Documents</div>
                <div className="relative flex">
                  <input
                    className="w-full rounded-l border border-slate-300 bg-white px-3 py-2"
                    placeholder="Search documents..."
                    value={relationshipDocumentQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setRelationshipDocumentQuery(query);
                      const candidateId = documentRelationCandidateIdByLabel.get(query) ?? "";
                      setRelationshipTargetDocumentId(candidateId && !alreadyRelatedDocumentTargetIds.has(candidateId) ? candidateId : "");
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-r border border-l-0 border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setShowRelationshipDocumentOptions((prev) => !prev);
                      setShowRelationshipSystemOptions(false);
                    }}
                  >
                    {showRelationshipDocumentOptions ? "▲" : "▼"}
                  </button>
                </div>
                {showRelationshipDocumentOptions && (
                  <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                    {documentRelationCandidates.length > 0 ? documentRelationCandidates.map((n) => {
                      const optionLabel = documentRelationCandidateLabelById.get(n.id) ?? n.title;
                      const isDisabled = alreadyRelatedDocumentTargetIds.has(n.id);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                            isDisabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-800 hover:bg-slate-50"
                          }`}
                          disabled={isDisabled}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (isDisabled) return;
                            setRelationshipTargetDocumentId(n.id);
                            setRelationshipTargetSystemId("");
                            setRelationshipDocumentQuery(optionLabel);
                            setShowRelationshipDocumentOptions(false);
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{optionLabel}</span>
                            {isDisabled && <span className="text-[10px] uppercase tracking-[0.06em]">Relationship already exists</span>}
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="px-3 py-2 text-sm text-slate-500">No search results found</div>
                    )}
                  </div>
                )}
              </div> : null}
              {allowSystemTargets ? <div className="relative">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Components (Systems, Processes, People)</div>
                <div className="relative flex">
                  <input
                    className="w-full rounded-l border border-slate-300 bg-white px-3 py-2"
                    placeholder="Search components..."
                    value={relationshipSystemQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setRelationshipSystemQuery(query);
                      const candidateId = systemRelationCandidateIdByLabel.get(query) ?? "";
                      setRelationshipTargetSystemId(candidateId && !alreadyRelatedSystemTargetIds.has(candidateId) ? candidateId : "");
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-r border border-l-0 border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setShowRelationshipSystemOptions((prev) => !prev);
                      setShowRelationshipDocumentOptions(false);
                    }}
                  >
                    {showRelationshipSystemOptions ? "▲" : "▼"}
                  </button>
                </div>
                {showRelationshipSystemOptions && (
                  <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded border border-slate-300 bg-white shadow-xl">
                    {systemRelationCandidates.length > 0 ? systemRelationCandidates.map((el) => {
                      const optionLabel = systemRelationCandidateLabelById.get(el.id) ?? getElementRelationshipDisplayLabel(el);
                      const isDisabled = alreadyRelatedSystemTargetIds.has(el.id);
                      return (
                        <button
                          key={el.id}
                          type="button"
                          className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                            isDisabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : "text-slate-800 hover:bg-slate-50"
                          }`}
                          disabled={isDisabled}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (isDisabled) return;
                            setRelationshipTargetSystemId(el.id);
                            setRelationshipTargetDocumentId("");
                            setRelationshipSystemQuery(optionLabel);
                            setShowRelationshipSystemOptions(false);
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{optionLabel}</span>
                            {isDisabled && <span className="text-[10px] uppercase tracking-[0.06em]">Relationship already exists</span>}
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="px-3 py-2 text-sm text-slate-500">No search results found</div>
                    )}
                  </div>
                )}
              </div> : null}
              {!allowDocumentTargets && !allowSystemTargets ? (
                <div className="rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  No valid target component types are available for this source in Bow Tie mode.
                </div>
              ) : null}
            </>
          )}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Disciplines</div>
            <div className="relative">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 text-left text-slate-700"
                onClick={() => setShowRelationshipDisciplineMenu((prev) => !prev)}
              >
                <span className="truncate text-sm">
                  {relationshipDisciplineSelection.length
                    ? relationshipDisciplineSelection.map((key) => disciplineLabelByKey.get(key)).filter(Boolean).join(", ")
                    : "Select disciplines"}
                </span>
                <span className="text-xs text-slate-500">{showRelationshipDisciplineMenu ? "▲" : "▼"}</span>
              </button>
              {showRelationshipDisciplineMenu && (
                <div className="absolute z-20 mt-1 w-full rounded border border-slate-300 bg-white p-2 shadow-lg">
                  {disciplineOptions.map((option) => {
                    const checked = relationshipDisciplineSelection.includes(option.key);
                    return (
                      <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-black hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setRelationshipDisciplineSelection((prev) =>
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
          <label className="text-sm">Relationship Type
            <div className="relative mt-1">
              <select
                className="w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-black"
                value={relationshipCategory}
                onChange={(e) => setRelationshipCategory(e.target.value as RelationshipCategory)}
              >
                {relationshipCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black">?</span>
            </div>
          </label>
          {relationshipCategory === "other" && (
            <label className="text-sm">Custom Relationship Type
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                placeholder="Enter relationship type for this link only"
                value={relationshipCustomType}
                onChange={(e) => setRelationshipCustomType(e.target.value)}
              />
            </label>
          )}
          <textarea
            className="rounded border border-slate-300 px-3 py-2"
            rows={3}
            placeholder="Relationship description (optional)"
            value={relationshipDescription}
            onChange={(e) => setRelationshipDescription(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={disableAddButton} onClick={onAdd}>
            Add relationship
          </button>
        </div>
      </div>
    </div>
  );
}
