"use client";

import type { CanvasElementRow, DisciplineKey, DocumentNodeRow, OutlineItemRow, RelationshipCategory } from "./canvasShared";

type AddRelationshipAsideProps = {
  open: boolean;
  relationshipModeGrouping: boolean;
  relationshipSourceLabel: string;
  relationshipSourceNodeTitle: string;
  relationshipSourceGroupingHeading: string;
  relationshipGroupingQuery: string;
  setRelationshipGroupingQuery: (value: string) => void;
  groupingRelationCandidateIdByLabel: Map<string, string>;
  setRelationshipTargetGroupingId: (value: string) => void;
  alreadyRelatedGroupingTargetIds: Set<string>;
  showRelationshipGroupingOptions: boolean;
  setShowRelationshipGroupingOptions: (updater: (prev: boolean) => boolean) => void;
  groupingRelationCandidates: CanvasElementRow[];
  groupingRelationCandidateLabelById: Map<string, string>;
  relationshipDocumentQuery: string;
  setRelationshipDocumentQuery: (value: string) => void;
  documentRelationCandidateIdByLabel: Map<string, string>;
  setRelationshipTargetDocumentId: (value: string) => void;
  alreadyRelatedDocumentTargetIds: Set<string>;
  showRelationshipDocumentOptions: boolean;
  setShowRelationshipDocumentOptions: (updater: (prev: boolean) => boolean) => void;
  documentRelationCandidates: DocumentNodeRow[];
  documentRelationCandidateLabelById: Map<string, string>;
  relationshipSystemQuery: string;
  setRelationshipSystemQuery: (value: string) => void;
  systemRelationCandidateIdByLabel: Map<string, string>;
  setRelationshipTargetSystemId: (value: string) => void;
  alreadyRelatedSystemTargetIds: Set<string>;
  showRelationshipSystemOptions: boolean;
  setShowRelationshipSystemOptions: (updater: (prev: boolean) => boolean) => void;
  systemRelationCandidates: CanvasElementRow[];
  systemRelationCandidateLabelById: Map<string, string>;
  getElementRelationshipDisplayLabel: (el: CanvasElementRow) => string;
  relationshipDisciplineSelection: DisciplineKey[];
  disciplineLabelByKey: Map<DisciplineKey, string>;
  showRelationshipDisciplineMenu: boolean;
  setShowRelationshipDisciplineMenu: (updater: (prev: boolean) => boolean) => void;
  disciplineOptions: Array<{ key: DisciplineKey; label: string }>;
  setRelationshipDisciplineSelection: (updater: (prev: DisciplineKey[]) => DisciplineKey[]) => void;
  relationshipCategory: RelationshipCategory;
  setRelationshipCategory: (value: RelationshipCategory) => void;
  relationshipCustomType: string;
  setRelationshipCustomType: (value: string) => void;
  relationshipDescription: string;
  setRelationshipDescription: (value: string) => void;
  relationshipTargetDocumentId: string;
  relationshipTargetSystemId: string;
  relationshipTargetGroupingId: string;
  onAdd: () => Promise<void>;
  onCancel: () => void;
};

export function AddRelationshipAside({
  open,
  relationshipModeGrouping,
  relationshipSourceLabel,
  relationshipSourceNodeTitle,
  relationshipSourceGroupingHeading,
  relationshipGroupingQuery,
  setRelationshipGroupingQuery,
  groupingRelationCandidateIdByLabel,
  setRelationshipTargetGroupingId,
  alreadyRelatedGroupingTargetIds,
  showRelationshipGroupingOptions,
  setShowRelationshipGroupingOptions,
  groupingRelationCandidates,
  groupingRelationCandidateLabelById,
  relationshipDocumentQuery,
  setRelationshipDocumentQuery,
  documentRelationCandidateIdByLabel,
  setRelationshipTargetDocumentId,
  alreadyRelatedDocumentTargetIds,
  showRelationshipDocumentOptions,
  setShowRelationshipDocumentOptions,
  documentRelationCandidates,
  documentRelationCandidateLabelById,
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
  relationshipCustomType,
  setRelationshipCustomType,
  relationshipDescription,
  setRelationshipDescription,
  relationshipTargetDocumentId,
  relationshipTargetSystemId,
  relationshipTargetGroupingId,
  onAdd,
  onCancel,
}: AddRelationshipAsideProps) {
  if (!open) return null;
  return (
    <aside className="fixed bottom-0 left-[420px] top-[70px] z-[74] w-full max-w-[420px] border-l border-r border-slate-300 bg-white shadow-[-14px_0_28px_rgba(15,23,42,0.24),0_8px_22px_rgba(15,23,42,0.12)] transition-transform">
      <div className="flex h-full flex-col overflow-auto p-4">
        <div className="flex items-center justify-between border-b border-slate-300 pb-3">
          <h2 className="text-base font-semibold">Add Relationship</h2>
          <button className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={onCancel}>Close</button>
        </div>
        <p className="mt-3 text-sm text-slate-600">From: {relationshipSourceLabel || relationshipSourceNodeTitle || relationshipSourceGroupingHeading || "Unknown source"}</p>
        <div className="mt-3 grid gap-3">
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
                          setShowRelationshipGroupingOptions(() => false);
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
              <div className="relative">
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
                      setShowRelationshipSystemOptions(() => false);
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
                            setShowRelationshipDocumentOptions(() => false);
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
              <div className="relative">
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
                      setShowRelationshipDocumentOptions(() => false);
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
                      setShowRelationshipSystemOptions(() => false);
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
                <option value="information">Information</option>
                <option value="systems">Systems</option>
                <option value="process">Process</option>
                <option value="data">Data</option>
                <option value="other">Other</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black">▼</span>
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
          <div className="mt-4 flex justify-end gap-2">
            <button
              className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                (!relationshipModeGrouping && !relationshipTargetDocumentId && !relationshipTargetSystemId) ||
                (relationshipModeGrouping && !relationshipTargetGroupingId) ||
                (relationshipCategory === "other" && !relationshipCustomType.trim())
              }
              onClick={() => void onAdd()}
            >
              Add relationship
            </button>
            <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

type DeleteDocumentAsideProps = {
  open: boolean;
  onDelete: () => Promise<void>;
  onCancel: () => void;
};

export function DeleteDocumentAside({ open, onDelete, onCancel }: DeleteDocumentAsideProps) {
  if (!open) return null;
  return (
    <aside className="fixed bottom-0 left-[420px] top-[70px] z-[74] w-full max-w-[420px] border-l border-r border-slate-300 bg-white shadow-[-14px_0_28px_rgba(15,23,42,0.24),0_8px_22px_rgba(15,23,42,0.12)] transition-transform">
      <div className="flex h-full flex-col overflow-auto p-4">
        <div className="flex items-center justify-between border-b border-slate-300 pb-3">
          <h2 className="text-base font-semibold">Delete Document</h2>
          <button className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={onCancel}>Close</button>
        </div>
        <p className="mt-3 text-sm text-slate-700">This will permanently remove the document from the map.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100" onClick={() => void onDelete()}>Delete</button>
          <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </aside>
  );
}

type OutlineCreateMode = "heading" | "content" | null;

type DocumentStructureAsideProps = {
  open: boolean;
  isMobile: boolean;
  outlineNodeId: string | null;
  shouldShowDesktopStructurePanel: boolean;
  onClose: () => void;
  setOutlineCreateMode: (value: OutlineCreateMode) => void;
  closeOutlineEditor: () => void;
  setNewHeadingTitle: (value: string) => void;
  setNewHeadingLevel: (value: 1 | 2 | 3) => void;
  setNewHeadingParentId: (value: string) => void;
  setNewContentText: (value: string) => void;
  setNewContentHeadingId: (value: string) => void;
  headingItems: OutlineItemRow[];
  outlineCreateMode: OutlineCreateMode;
  newHeadingTitle: string;
  newHeadingLevel: 1 | 2 | 3;
  newHeadingParentId: string;
  level1Headings: OutlineItemRow[];
  level2Headings: OutlineItemRow[];
  handleCreateHeading: () => void;
  newContentHeadingId: string;
  newContentText: string;
  handleCreateContent: () => void;
  outlineEditItem: OutlineItemRow | null;
  editHeadingTitle: string;
  setEditHeadingTitle: (value: string) => void;
  editHeadingLevel: 1 | 2 | 3;
  setEditHeadingLevel: (value: 1 | 2 | 3) => void;
  editHeadingParentId: string;
  setEditHeadingParentId: (value: string) => void;
  editContentHeadingId: string;
  setEditContentHeadingId: (value: string) => void;
  editContentText: string;
  setEditContentText: (value: string) => void;
  handleSaveOutlineEdit: () => void;
  visibleOutlineItems: OutlineItemRow[];
  outlineItems: OutlineItemRow[];
  collapsedHeadingIds: Set<string>;
  setCollapsedHeadingIds: (updater: (prev: Set<string>) => Set<string>) => void;
  openOutlineEditor: (item: OutlineItemRow) => void;
  setConfirmDeleteOutlineItemId: (value: string | null) => void;
};

export function DocumentStructureAside({
  open,
  isMobile,
  outlineNodeId,
  shouldShowDesktopStructurePanel,
  onClose,
  setOutlineCreateMode,
  closeOutlineEditor,
  setNewHeadingTitle,
  setNewHeadingLevel,
  setNewHeadingParentId,
  setNewContentText,
  setNewContentHeadingId,
  headingItems,
  outlineCreateMode,
  newHeadingTitle,
  newHeadingLevel,
  newHeadingParentId,
  level1Headings,
  level2Headings,
  handleCreateHeading,
  newContentHeadingId,
  newContentText,
  handleCreateContent,
  outlineEditItem,
  editHeadingTitle,
  setEditHeadingTitle,
  editHeadingLevel,
  setEditHeadingLevel,
  editHeadingParentId,
  setEditHeadingParentId,
  editContentHeadingId,
  setEditContentHeadingId,
  editContentText,
  setEditContentText,
  handleSaveOutlineEdit,
  visibleOutlineItems,
  outlineItems,
  collapsedHeadingIds,
  setCollapsedHeadingIds,
  openOutlineEditor,
  setConfirmDeleteOutlineItemId,
}: DocumentStructureAsideProps) {
  if (!open) return null;
  return (
    <aside
      className={`fixed z-[74] border-l border-r border-slate-300 shadow-[-14px_0_28px_rgba(15,23,42,0.24),0_8px_22px_rgba(15,23,42,0.12)] transition-transform ${
        isMobile
          ? "inset-0 w-full max-w-full bg-white md:inset-y-0 md:left-0 md:max-w-[420px]"
          : "bottom-0 left-[420px] top-[70px] w-full max-w-[420px] bg-white"
      }`}
      style={{
        transform: isMobile ? (outlineNodeId ? "translateX(0)" : "translateX(-100%)") : (shouldShowDesktopStructurePanel ? "translateX(0)" : "translateX(-100%)"),
      }}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Open Document Structure</h2><button className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100" onClick={onClose}>Close</button></div>
        </div>
        <div className="space-y-3 overflow-auto px-4 py-4">
          <div className="mt-2 rounded border border-slate-200 p-3">
            <div className="text-sm font-semibold">Actions</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={() => {
                closeOutlineEditor();
                setOutlineCreateMode("heading");
                setNewHeadingTitle("");
                setNewHeadingLevel(1);
                setNewHeadingParentId("");
              }}>Add Heading</button>
              <button className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={() => {
                closeOutlineEditor();
                setOutlineCreateMode("content");
                setNewContentText("");
                setNewContentHeadingId(headingItems[0]?.id ?? "");
              }}>Add Content</button>
            </div>
          </div>

          {outlineCreateMode === "heading" && (
            <div className="rounded border border-slate-200 p-3">
              <div className="text-sm font-semibold">New Heading</div>
              <label className="mt-2 block text-xs text-slate-600">Title</label>
              <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={newHeadingTitle} onChange={(e) => setNewHeadingTitle(e.target.value)} placeholder="Enter heading title" />
              <label className="mt-2 block text-xs text-slate-600">Level</label>
              <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={newHeadingLevel} onChange={(e) => { const next = Number(e.target.value) as 1 | 2 | 3; setNewHeadingLevel(next); setNewHeadingParentId(""); }}>
                <option value={1}>Level 1</option>
                <option value={2}>Level 2</option>
                <option value={3}>Level 3</option>
              </select>
              {newHeadingLevel === 2 && (
                <>
                  <label className="mt-2 block text-xs text-slate-600">Parent L1 Heading</label>
                  <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={newHeadingParentId} onChange={(e) => setNewHeadingParentId(e.target.value)}>
                    <option value="">Select parent...</option>
                    {level1Headings.map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                  </select>
                </>
              )}
              {newHeadingLevel === 3 && (
                <>
                  <label className="mt-2 block text-xs text-slate-600">Parent L2 Heading</label>
                  <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={newHeadingParentId} onChange={(e) => setNewHeadingParentId(e.target.value)}>
                    <option value="">Select parent...</option>
                    {level2Headings.map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                  </select>
                </>
              )}
              <div className="mt-3 flex justify-end gap-2">
                <button className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={handleCreateHeading}>Add Heading</button>
                <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={() => setOutlineCreateMode(null)}>Cancel</button>
              </div>
            </div>
          )}

          {outlineCreateMode === "content" && (
            <div className="rounded border border-slate-200 p-3">
              <div className="text-sm font-semibold">New Content</div>
              <label className="mt-2 block text-xs text-slate-600">Heading</label>
              <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={newContentHeadingId} onChange={(e) => setNewContentHeadingId(e.target.value)}>
                <option value="">Select heading...</option>
                {headingItems.map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
              </select>
              <label className="mt-2 block text-xs text-slate-600">Content</label>
              <textarea className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" rows={4} value={newContentText} onChange={(e) => setNewContentText(e.target.value)} placeholder="Enter content text" />
              <div className="mt-3 flex justify-end gap-2">
                <button className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={!headingItems.length} onClick={handleCreateContent}>Add Content</button>
                <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={() => setOutlineCreateMode(null)}>Cancel</button>
              </div>
            </div>
          )}

          {outlineCreateMode === "content" && !headingItems.length && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Add a heading first before adding content.</div>
          )}

          {outlineEditItem && (
            <div className="rounded border border-slate-200 p-3">
              <div className="text-sm font-semibold">Edit {outlineEditItem.kind === "heading" ? "Heading" : "Content"}</div>
              {outlineEditItem.kind === "heading" ? (
                <>
                  <label className="mt-2 block text-xs text-slate-600">Title</label>
                  <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={editHeadingTitle} onChange={(e) => setEditHeadingTitle(e.target.value)} placeholder="Heading title" />
                  <label className="mt-2 block text-xs text-slate-600">Level</label>
                  <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={editHeadingLevel} onChange={(e) => { const next = Number(e.target.value) as 1 | 2 | 3; setEditHeadingLevel(next); setEditHeadingParentId(""); }}>
                    <option value={1}>Level 1</option>
                    <option value={2}>Level 2</option>
                    <option value={3}>Level 3</option>
                  </select>
                  {editHeadingLevel === 2 && (
                    <>
                      <label className="mt-2 block text-xs text-slate-600">Parent L1 Heading</label>
                      <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={editHeadingParentId} onChange={(e) => setEditHeadingParentId(e.target.value)}>
                        <option value="">Select parent...</option>
                        {level1Headings.filter((h) => h.id !== outlineEditItem.id).map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                      </select>
                    </>
                  )}
                  {editHeadingLevel === 3 && (
                    <>
                      <label className="mt-2 block text-xs text-slate-600">Parent L2 Heading</label>
                      <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={editHeadingParentId} onChange={(e) => setEditHeadingParentId(e.target.value)}>
                        <option value="">Select parent...</option>
                        {level2Headings.filter((h) => h.id !== outlineEditItem.id).map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                      </select>
                    </>
                  )}
                </>
              ) : (
                <>
                  <label className="mt-2 block text-xs text-slate-600">Heading</label>
                  <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={editContentHeadingId} onChange={(e) => setEditContentHeadingId(e.target.value)}>
                    <option value="">Select heading...</option>
                    {headingItems.map((h) => <option key={h.id} value={h.id}>{h.title || "(Untitled)"}</option>)}
                  </select>
                  <label className="mt-2 block text-xs text-slate-600">Content</label>
                  <textarea className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" rows={4} value={editContentText} onChange={(e) => setEditContentText(e.target.value)} placeholder="Content text" />
                </>
              )}
              <div className="mt-3 flex justify-end gap-2">
                <button className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100" onClick={handleSaveOutlineEdit}>Save</button>
                <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={closeOutlineEditor}>Cancel</button>
              </div>
            </div>
          )}

          <div className="rounded border border-slate-200 p-3">
            <div className="text-sm font-semibold">Outline</div>
            <div className="mt-2 space-y-2">
              {visibleOutlineItems.map((item) => {
                const indent = item.kind === "heading" ? item.heading_level === 2 ? 16 : item.heading_level === 3 ? 32 : 0 : (() => {
                  const heading = outlineItems.find((h) => h.id === item.heading_id);
                  return heading?.heading_level === 2 ? 16 : heading?.heading_level === 3 ? 32 : 0;
                })();
                const isHeading = item.kind === "heading";
                const isCollapsed = isHeading && collapsedHeadingIds.has(item.id);
                return (
                  <div key={item.id} className="rounded border border-slate-200 px-3 py-2" style={{ marginLeft: indent }}>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <div className="flex items-start gap-2">
                        {isHeading ? (
                          <button className="mt-[1px] h-4 w-4 rounded border border-slate-300 text-[10px] leading-none text-slate-600" onClick={() => {
                            setCollapsedHeadingIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            });
                          }} aria-label={isCollapsed ? "Expand heading" : "Collapse heading"}>
                            {isCollapsed ? "+" : "-"}
                          </button>
                        ) : <span className="inline-block h-4 w-4" />}
                        <div>{isHeading ? <strong>H{item.heading_level}: {item.title || "(Untitled heading)"}</strong> : <span>{item.content_text || "(Empty content)"}</span>}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-xs" onClick={() => openOutlineEditor(item)}>Edit</button>
                        <button className="text-xs text-rose-700" onClick={() => setConfirmDeleteOutlineItemId(item.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

