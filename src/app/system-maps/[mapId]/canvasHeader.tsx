"use client";

import type { RefObject } from "react";
import type { SystemMap } from "./canvasShared";

type MapCanvasHeaderProps = {
  map: SystemMap;
  mapRole: "read" | "partial_write" | "full_write" | null;
  canManageMapMetadata: boolean;
  isEditingMapTitle: boolean;
  mapTitleDraft: string;
  setMapTitleDraft: (value: string) => void;
  setIsEditingMapTitle: (value: boolean) => void;
  handleSaveMapTitle: () => Promise<void>;
  savingMapTitle: boolean;
  mapTitleSavedFlash: boolean;
  mapInfoButtonRef: RefObject<HTMLButtonElement | null>;
  closeAllLeftAsides: () => void;
  setShowMapInfoAside: (updater: (prev: boolean) => boolean) => void;
  setIsEditingMapInfo: (value: boolean) => void;
  setError: (value: string | null) => void;
};

export function MapCanvasHeader({
  map,
  mapRole,
  canManageMapMetadata,
  isEditingMapTitle,
  mapTitleDraft,
  setMapTitleDraft,
  setIsEditingMapTitle,
  handleSaveMapTitle,
  savingMapTitle,
  mapTitleSavedFlash,
  mapInfoButtonRef,
  closeAllLeftAsides,
  setShowMapInfoAside,
  setIsEditingMapInfo,
  setError,
}: MapCanvasHeaderProps) {
  return (
    <header className="site-header fixed inset-x-0 top-0 z-[90] md:sticky" style={{ backgroundColor: "#000000", borderBottomColor: "#0f172a" }}>
      <div className="header-inner" style={{ paddingLeft: "12px", paddingRight: "20px", backgroundColor: "#000000" }}>
        <div className="header-left flex items-center gap-8">
          <a href="/"><img src="/images/logo-white.png" alt="HSES" className="header-logo" /></a>
          <span className="text-xl font-semibold uppercase tracking-[0.14em]" style={{ color: "#05c3dd" }}>System Map</span>
        </div>
        <div className="header-actions flex items-center">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{
                backgroundColor: mapRole === "full_write" ? "#166534" : mapRole === "partial_write" ? "#92400e" : "#1e3a8a",
                color: "#ffffff",
              }}
            >
              {mapRole === "full_write" ? "Full Write" : mapRole === "partial_write" ? "Partial Write" : "Read"}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white">Document Name:</span>
            {isEditingMapTitle ? (
              <input
                autoFocus
                className="min-w-[240px] rounded-md border border-[#a78bfa] bg-transparent px-3 py-1.5 text-sm font-semibold text-white outline-none ring-1 ring-[#a78bfa]/70"
                value={mapTitleDraft}
                onChange={(e) => setMapTitleDraft(e.target.value)}
                onBlur={() => {
                  if (!mapTitleDraft.trim()) {
                    setMapTitleDraft(map.title);
                    setIsEditingMapTitle(false);
                    return;
                  }
                  void handleSaveMapTitle();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).blur();
                  }
                  if (e.key === "Escape") {
                    setMapTitleDraft(map.title);
                    setIsEditingMapTitle(false);
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className="rounded-md border border-transparent px-2 py-1 text-sm font-semibold text-white hover:border-slate-600/60 hover:bg-slate-900/40"
                onClick={() => {
                  if (!canManageMapMetadata) {
                    setError("Only the map owner can rename this map.");
                    return;
                  }
                  setIsEditingMapTitle(true);
                }}
              >
                {map.title}
              </button>
            )}
            {savingMapTitle ? <span className="text-xs font-medium text-[#05c3dd]">Saving...</span> : null}
            {!savingMapTitle && mapTitleSavedFlash ? <span className="text-xs font-medium text-emerald-400">Saved</span> : null}
            <button
              ref={mapInfoButtonRef}
              type="button"
              aria-label="Open map information"
              title="Map information"
              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-600/60 bg-transparent text-white hover:bg-slate-900/50"
              onClick={() => {
                closeAllLeftAsides();
                setShowMapInfoAside((prev) => {
                  const next = !prev;
                  if (next) setIsEditingMapInfo(false);
                  return next;
                });
              }}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 bg-current"
                style={{ WebkitMaskImage: "url('/icons/info.svg')", maskImage: "url('/icons/info.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

