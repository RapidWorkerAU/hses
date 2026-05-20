type CanvasNodeSelectionToolbarProps = {
  open: boolean;
  showRelationships: boolean;
  relationshipsDisabled?: boolean;
  deleteDisabled?: boolean;
  deleteDisabledReason?: string;
  onConfigure: () => void;
  onRelationships: () => void;
  onDelete: () => void;
};

export function CanvasNodeSelectionToolbar({
  open,
  showRelationships,
  relationshipsDisabled = false,
  deleteDisabled = false,
  deleteDisabledReason,
  onConfigure,
  onRelationships,
  onDelete,
}: CanvasNodeSelectionToolbarProps) {
  if (!open) return null;
  const textButtonClass =
    "flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-[15px] font-medium text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent";
  const dividerClass = "mx-1 h-[29px] w-px shrink-0 bg-white/20";
  const iconButtonClass =
    "flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-white/80";
  return (
    <div className="pointer-events-none fixed left-1/2 top-[82px] z-[86] -translate-x-1/2">
      <div className="pointer-events-auto flex items-center rounded-[18px] border border-[#27496b] bg-[#102a43] px-2 py-1.5 text-white shadow-[0_14px_32px_rgba(15,23,42,0.34)]">
        <button type="button" className={textButtonClass} onClick={onConfigure}>
          <span
            aria-hidden="true"
            className="h-5 w-5 shrink-0 bg-current"
            style={{ WebkitMaskImage: "url('/icons/configure.svg')", maskImage: "url('/icons/configure.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
          Configure
        </button>
        {showRelationships ? <div className={dividerClass} aria-hidden="true" /> : null}
        {showRelationships ? (
          <button
            type="button"
            className={textButtonClass}
            onClick={onRelationships}
            disabled={relationshipsDisabled}
          >
            <span
              aria-hidden="true"
              className="h-5 w-5 shrink-0 bg-current"
              style={{ WebkitMaskImage: "url('/icons/related.svg')", maskImage: "url('/icons/related.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
            />
            Relationships
          </button>
        ) : null}
        <div className={dividerClass} aria-hidden="true" />
        <button
          type="button"
          className={iconButtonClass}
          onClick={onDelete}
          aria-label="Delete"
          title={deleteDisabledReason || "Delete"}
          disabled={deleteDisabled}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M9 3.75h6m-9 3h12m-1.5 0-.53 10.07A2.25 2.25 0 0 1 13.72 19H10.3a2.25 2.25 0 0 1-2.25-2.13L7.5 6.75m3 3.25v5.5m3-5.5v5.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
