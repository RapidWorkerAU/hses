"use client";

import type { RefObject } from "react";
import type { MapMemberProfileRow, SystemMap } from "./canvasShared";
import type { NodePaletteKind } from "./mapCategories";

type CanvasActionButtonsProps = {
  showMapInfoAside: boolean;
  rf: {
    fitView: (opts?: { duration?: number; padding?: number }) => void;
    setViewport: (v: { x: number; y: number; zoom: number }, opts?: { duration?: number }) => void;
  } | null;
  setShowAddMenu: (updater: (prev: boolean) => boolean) => void;
  showAddMenu: boolean;
  addMenuRef: RefObject<HTMLDivElement | null>;
  showSearchMenu: boolean;
  setShowSearchMenu: (updater: (prev: boolean) => boolean) => void;
  searchMenuRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchResults: Array<{ id: string; label: string; documentNumber: string | null; kind: string }>;
  onSelectSearchResult: (id: string) => void;
  canWriteMap: boolean;
  canCreateSticky: boolean;
  handleAddBlankDocument: () => void;
  handleAddSystemCircle: () => void;
  handleAddProcessComponent: () => void;
  handleAddPerson: () => void;
  handleAddProcessHeading: () => void;
  handleAddGroupingContainer: () => void;
  handleAddStickyNote: () => void;
  allowedNodeKinds: NodePaletteKind[];
};

export function CanvasActionButtons({
  showMapInfoAside,
  rf,
  setShowAddMenu,
  showAddMenu,
  addMenuRef,
  showSearchMenu,
  setShowSearchMenu,
  searchMenuRef,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSelectSearchResult,
  canWriteMap,
  canCreateSticky,
  handleAddBlankDocument,
  handleAddSystemCircle,
  handleAddProcessComponent,
  handleAddPerson,
  handleAddProcessHeading,
  handleAddGroupingContainer,
  handleAddStickyNote,
  allowedNodeKinds,
}: CanvasActionButtonsProps) {
  const allowed = new Set<NodePaletteKind>(allowedNodeKinds);
  return (
    <div
      className="fixed top-[82px] z-[88] transition-[right] duration-300 ease-out"
      style={{ right: showMapInfoAside ? "315px" : "20px" }}
    >
      <div className="relative flex items-center gap-3">
        <button
          type="button"
          aria-label="Search components"
          title="Search components"
          onClick={() => setShowSearchMenu((prev) => !prev)}
          className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/finddocument.svg')", maskImage: "url('/icons/finddocument.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </button>
        <a
          href="/system-maps"
          aria-label="Back to all system maps"
          title="All system maps"
          className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/back.svg')", maskImage: "url('/icons/back.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </a>
        <button
          type="button"
          aria-label="Zoom to fit"
          title="Zoom to fit"
          onClick={() => rf?.fitView({ duration: 300, padding: 0.2 })}
          className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/zoomfit.svg')", maskImage: "url('/icons/zoomfit.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          title="Reset zoom"
          onClick={() => rf?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })}
          className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/resetzoom.svg')", maskImage: "url('/icons/resetzoom.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </button>
        <button
          type="button"
          aria-label="Add component"
          title="Add component"
          onClick={() => setShowAddMenu((prev) => !prev)}
          disabled={!canWriteMap && !canCreateSticky}
          className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/addcomponent.svg')", maskImage: "url('/icons/addcomponent.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </button>
        {showAddMenu && (canWriteMap || canCreateSticky) && (
          <div ref={addMenuRef} className="absolute right-0 top-full z-[70] mt-2 min-w-[180px] rounded-none border border-slate-300 bg-white p-1 text-sm shadow-xl">
            {canWriteMap ? (
              <>
                {allowed.has("document") ? <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddBlankDocument}>Document</button> : null}
                {allowed.has("system") ? <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddSystemCircle}>System</button> : null}
                {allowed.has("process") ? <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddProcessComponent}>Process</button> : null}
                {allowed.has("person") ? <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddPerson}>Person</button> : null}
                {allowed.has("category") ? <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddProcessHeading}>Category</button> : null}
                {allowed.has("grouping_container") ? <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddGroupingContainer}>Grouping Container</button> : null}
              </>
            ) : null}
            {canCreateSticky && allowed.has("sticky_note") ? (
              <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100" onClick={handleAddStickyNote}>Sticky Note</button>
            ) : null}
          </div>
        )}
        {showSearchMenu && (
          <div
            ref={searchMenuRef}
            className="absolute left-0 top-full z-[70] mt-2 w-[358px] rounded-none border border-slate-300 bg-white p-2 text-sm shadow-xl"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start typing to search documents"
              className="w-full bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery.trim().length > 0 && (
              <div className="mt-1 max-h-56 overflow-auto rounded-none border border-slate-300 bg-white">
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                      onClick={() => onSelectSearchResult(result.id)}
                    >
                      <div className="font-semibold text-slate-900">{result.label}</div>
                      <div className="text-xs text-slate-500">
                        {result.documentNumber ? `${result.documentNumber} · ` : ""}
                        {result.kind}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-500">No results found</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type MapInfoAsideProps = {
  showMapInfoAside: boolean;
  mapInfoAsideRef: RefObject<HTMLDivElement | null>;
  handleCloseMapInfoAside: () => void;
  canManageMapMetadata: boolean;
  isEditingMapInfo: boolean;
  mapInfoNameDraft: string;
  setMapInfoNameDraft: (value: string) => void;
  mapCodeDraft: string;
  setMapCodeDraft: (value: string) => void;
  mapInfoDescriptionDraft: string;
  setMapInfoDescriptionDraft: (value: string) => void;
  map: SystemMap;
  savingMapInfo: boolean;
  handleSaveMapInfo: () => Promise<void>;
  setIsEditingMapInfo: (value: boolean) => void;
  setMapInfoDescriptionDraftFromMap: () => void;
  setMapCodeDraftFromMap: () => void;
  mapMembers: MapMemberProfileRow[];
  userId: string | null;
  userEmail: string;
  savingMemberRoleUserId: string | null;
  handleUpdateMapMemberRole: (userId: string, role: "read" | "partial_write" | "full_write") => Promise<void>;
  mapRoleLabel: (role: string) => string;
};

export function MapInfoAside({
  showMapInfoAside,
  mapInfoAsideRef,
  handleCloseMapInfoAside,
  canManageMapMetadata,
  isEditingMapInfo,
  mapInfoNameDraft,
  setMapInfoNameDraft,
  mapCodeDraft,
  setMapCodeDraft,
  mapInfoDescriptionDraft,
  setMapInfoDescriptionDraft,
  map,
  savingMapInfo,
  handleSaveMapInfo,
  setIsEditingMapInfo,
  setMapInfoDescriptionDraftFromMap,
  setMapCodeDraftFromMap,
  mapMembers,
  userId,
  userEmail,
  savingMemberRoleUserId,
  handleUpdateMapMemberRole,
  mapRoleLabel,
}: MapInfoAsideProps) {
  if (!showMapInfoAside) return null;
  return (
    <aside
      ref={mapInfoAsideRef}
      className="fixed bottom-0 right-0 top-[70px] z-[79] w-full max-w-[294px] border-l border-slate-300 bg-white shadow-[-16px_0_30px_rgba(15,23,42,0.26),0_8px_22px_rgba(15,23,42,0.14)]"
    >
      <div className="flex h-full flex-col overflow-auto p-4">
        <div className="flex items-center justify-between border-b border-slate-300 pb-3">
          <h2 className="text-base font-semibold text-slate-900">Map Information</h2>
          <button
            className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100"
            onClick={handleCloseMapInfoAside}
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="text-sm text-slate-700">System Map Name
            {isEditingMapInfo ? (
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={mapInfoNameDraft}
                onChange={(e) => setMapInfoNameDraft(e.target.value)}
              />
            ) : (
              <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">{map.title}</div>
            )}
          </label>
          {canManageMapMetadata ? (
            <label className="text-sm text-slate-700">Map Code
              {isEditingMapInfo ? (
                <input
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-semibold uppercase tracking-[0.08em] text-black"
                  value={mapCodeDraft}
                  onChange={(e) => setMapCodeDraft(e.target.value.toUpperCase())}
                  placeholder="Enter map code"
                />
              ) : (
                <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-900">
                  {map.map_code || "-"}
                </div>
              )}
            </label>
          ) : null}

          <label className="text-sm text-slate-700">Description
            {isEditingMapInfo ? (
              <textarea
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                rows={6}
                value={mapInfoDescriptionDraft}
                onChange={(e) => setMapInfoDescriptionDraft(e.target.value)}
              />
            ) : (
              <div className="mt-1 min-h-[132px] rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                {map.description?.trim() || "No description"}
              </div>
            )}
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {isEditingMapInfo ? (
            <>
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100"
                onClick={() => void handleSaveMapInfo()}
                disabled={savingMapInfo}
              >
                {savingMapInfo ? "Saving..." : "Save"}
              </button>
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={() => {
                  setIsEditingMapInfo(false);
                  setMapInfoNameDraft(map.title);
                  setMapInfoDescriptionDraftFromMap();
                  setMapCodeDraftFromMap();
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            canManageMapMetadata ? (
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={() => setIsEditingMapInfo(true)}
              >
                Edit
              </button>
            ) : null
          )}
        </div>

        <div className="mt-5 border-t border-slate-300 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Map Access</h3>
          <div className="mt-2 space-y-2">
            {mapMembers.length ? (
              mapMembers.map((member) => {
                const canEditMemberRole = canManageMapMetadata && member.user_id !== map.owner_id;
                const displayName = member.full_name?.trim() || (member.user_id === map.owner_id ? "Map Owner" : "User");
                const displayEmail = member.email?.trim() || (member.user_id === userId ? userEmail : "");
                return (
                  <div key={member.user_id} className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                    <div className="text-xs text-slate-600">{displayEmail || member.user_id}</div>
                    <div className="mt-2">
                      {canEditMemberRole ? (
                        <select
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                          value={member.role}
                          disabled={savingMemberRoleUserId === member.user_id}
                          onChange={(e) =>
                            void handleUpdateMapMemberRole(
                              member.user_id,
                              e.target.value as "read" | "partial_write" | "full_write"
                            )
                          }
                        >
                          <option value="read">Read</option>
                          <option value="partial_write">Partial write</option>
                          <option value="full_write">Full write</option>
                        </select>
                      ) : (
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
                          {member.user_id === map.owner_id ? "Owner (Full write)" : mapRoleLabel(member.role)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">No linked users</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
