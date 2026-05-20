"use client";

import type { RefObject } from "react";
import type { SystemMap } from "./canvasShared";
import type { BillingAccessState } from "@/lib/access";

type MapCanvasHeaderProps = {
  map: SystemMap;
  isTemplateEditor: boolean;
  mapRole: "read" | "partial_write" | "full_write" | null;
  accessState: BillingAccessState | null;
  brandHref?: string | null;
  showMapInfoButton?: boolean;
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
  onOpenHelp: () => void;
};

export function MapCanvasHeader({
  map,
  isTemplateEditor,
  mapRole,
  accessState,
  brandHref = "/",
  showMapInfoButton = true,
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
  onOpenHelp,
}: MapCanvasHeaderProps) {
  const mapCategoryHeaderLabel = (() => {
    if (isTemplateEditor) return "Create / Edit Template Canvas";
    const category = (map.map_category || "").toLowerCase();
    if (category === "document_map") return "Document Map";
    if (category === "bow_tie") return "Bow Tie Builder";
    if (category === "incident_investigation") return "Investigation Map";
    if (category === "org_chart") return "Org Chart Builder";
    if (category === "process_flow") return "Process Flow Builder";
    return "System Map";
  })();

  const accessBadge = (() => {
    if (accessState && !accessState.canEditMaps) {
      if (accessState.currentAccessStatus === "payment_failed") {
        return {
          label: "Payment Failed",
          backgroundColor: "#9a3412",
          title: accessState.readOnlyReason || "Payment failed. This map is read only until billing is updated.",
        };
      }

      if (accessState.currentAccessStatus === "expired" || accessState.currentAccessStatus === "cancelled") {
        return {
          label: "Read Only",
          backgroundColor: "#991b1b",
          title: accessState.readOnlyReason || "This map is read only for your current access.",
        };
      }
    }

    return {
      label: mapRole === "full_write" ? "Full Write" : mapRole === "partial_write" ? "Partial Write" : "Read",
      backgroundColor: mapRole === "full_write" ? "#166534" : mapRole === "partial_write" ? "#92400e" : "#1e3a8a",
      title: undefined,
    };
  })();

  return (
    <header className="dashboardCanvasHeader fixed inset-x-0 top-0 z-[90] bg-black md:sticky md:h-[64px]">
      <div
        className="dashboardCanvasHeaderInner flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between"
        style={{ paddingLeft: "26px", paddingRight: "16px", backgroundColor: "#000000", paddingTop: "8px", paddingBottom: "8px", height: "auto", minHeight: "0" }}
      >
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:contents">
          <div className="dashboardCanvasHeaderLeft flex min-w-0 items-center justify-start gap-3 justify-self-start text-left md:gap-5">
            {brandHref ? (
              <a href={brandHref}>
                <img src="/images/investigation-tool.png" alt="Investigation Tool" className="block h-[34px] w-auto md:h-[48px]" />
              </a>
            ) : (
              <img src="/images/investigation-tool.png" alt="Investigation Tool" className="block h-[34px] w-auto md:h-[48px]" />
            )}
            <span
              className="min-w-0 rounded-full border px-4 py-1.5 text-center text-[14px] font-semibold tracking-[0.02em] md:text-left md:text-[16px]"
              style={{
                color: "#e2e8f0",
                backgroundColor: "rgba(148, 163, 184, 0.14)",
                borderColor: "rgba(148, 163, 184, 0.26)",
              }}
            >
              {mapCategoryHeaderLabel}
            </span>
          </div>
          <div className="flex shrink-0 justify-self-end items-center gap-2 md:hidden">
            {showMapInfoButton ? (
              <button
                ref={mapInfoButtonRef}
                type="button"
                aria-label="Open map information"
                title="Map information"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-600/60 bg-transparent text-white hover:bg-slate-900/50"
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
            ) : null}
            <button
              type="button"
              aria-label="Open canvas help"
              title="Canvas help"
              onClick={onOpenHelp}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-600/60 bg-transparent text-white hover:bg-slate-900/50"
            >
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-current text-[10px] font-bold leading-none text-white"
              >
                ?
              </span>
            </button>
          </div>
        </div>
        <div className="dashboardCanvasHeaderActions flex w-full items-center justify-center md:w-auto md:justify-end">
          <div className="flex w-full flex-wrap items-center justify-center gap-2 overflow-hidden md:w-auto md:flex-nowrap md:justify-end">
            <span
              className="shrink-0 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
              title={accessBadge.title}
              style={{
                backgroundColor: accessBadge.backgroundColor,
                color: "#ffffff",
              }}
            >
              {accessBadge.label}
            </span>
            {isEditingMapTitle ? (
              <input
                autoFocus
                className="min-w-0 flex-1 rounded-md border border-[#a78bfa] bg-transparent px-3 py-1.5 text-center text-[0.95rem] font-semibold text-white outline-none ring-1 ring-[#a78bfa]/70 md:min-w-[240px] md:flex-none md:text-left md:text-sm"
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
                className="min-w-0 flex-1 truncate rounded-md border border-transparent px-2 py-1 text-center text-[0.95rem] font-semibold text-white hover:border-slate-600/60 hover:bg-slate-900/40 md:flex-none md:text-left md:text-sm"
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
            {showMapInfoButton ? (
              <button
                ref={mapInfoButtonRef}
                type="button"
                aria-label="Open map information"
                title="Map information"
                className="ml-1 hidden h-8 w-8 items-center justify-center rounded-md border border-slate-600/60 bg-transparent text-white hover:bg-slate-900/50 md:inline-flex"
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
            ) : null}
            <button
              type="button"
              aria-label="Open canvas help"
              title="Canvas help"
              onClick={onOpenHelp}
              className="hidden h-8 w-8 items-center justify-center rounded-md border border-slate-600/60 bg-transparent text-white hover:bg-slate-900/50 md:inline-flex"
            >
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-current text-[10px] font-bold leading-none text-white"
              >
                ?
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
