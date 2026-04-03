"use client";

type SystemMapWelcomeModalProps = {
  open: boolean;
  isMobile?: boolean;
  onStartManual: () => void;
  onStartWizard: () => void;
};

const quickActions = [
  {
    title: "Add Component",
    description: "Use this to add investigation nodes, notes, images, tables, and other canvas items manually.",
    icon: "/icons/addcomponent.svg",
  },
  {
    title: "Wizard",
    description: "Start with guided questions and let Investigation Tool create grouped nodes for you.",
    icon: "/icons/wizard.svg",
  },
  {
    title: "Search",
    description: "Find linked documents and content in the investigation, then jump straight to where that item sits on the map.",
    icon: "/icons/finddocument.svg",
  },
  {
    title: "Zoom Tools",
    description: "Use zoom fit and reset zoom to quickly orient yourself on the canvas.",
    icon: "/icons/zoomfit.svg",
  },
  {
    title: "Print",
    description: "Create a PDF or print output from the current view or a selected area of the map.",
    icon: "/icons/printer.svg",
  },
  {
    title: "Map Info",
    description: "Open the information panel to review map details and access settings.",
    icon: "/icons/info.svg",
  },
] as const;

function QuickActionCard({
  title,
  description,
  icon,
  isMobile = false,
}: {
  title: string;
  description: string;
  icon: string;
  isMobile?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/90 shadow-[0_14px_28px_rgba(15,23,42,0.07)] ${
        isMobile ? "p-4" : "p-3.5"
      }`}
    >
      <div className={`flex items-start ${isMobile ? "gap-3" : "gap-2.5"}`}>
        <span
          aria-hidden="true"
          className={`mt-0.5 flex shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#dbeafe_0%,#ede9fe_52%,#fce7f3_100%)] text-[#312e81] ${
            isMobile ? "h-11 w-11" : "h-10 w-10"
          }`}
        >
          <span
            className={`bg-current ${isMobile ? "h-5 w-5" : "h-5 w-5"}`}
            style={{
              WebkitMaskImage: `url('${icon}')`,
              maskImage: `url('${icon}')`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
        </span>
        <div>
          <div className="text-sm font-semibold text-slate-950">{title}</div>
          <p className={`mt-1 text-sm text-slate-600 ${isMobile ? "leading-6" : "leading-5.5"}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export function SystemMapWelcomeModal({
  open,
  isMobile = false,
  onStartManual,
  onStartWizard,
}: SystemMapWelcomeModalProps) {
  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[122] ${isMobile ? "overflow-y-auto bg-white" : "flex items-center justify-center bg-[rgba(15,23,42,0.52)] px-4 py-6"}`}>
      <div
        className={`w-full overflow-hidden ${
          isMobile
            ? "min-h-full bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))]"
            : "max-w-[1240px] rounded-[30px] border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] shadow-[0_34px_80px_rgba(15,23,42,0.28)]"
        }`}
      >
        <div className={`border-b border-slate-200/80 px-6 sm:px-8 ${isMobile ? "py-6" : "py-5"}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Welcome</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">Your new investigation map is ready</h2>
            <p className={`max-w-none text-sm text-slate-600 ${isMobile ? "mt-3 leading-6" : "mt-2.5 leading-6"}`}>
              You can build this map manually by adding nodes yourself, or you can use the wizard to scaffold the investigation
              with grouped sections and editable nodes. Everything created by the wizard remains fully editable on the canvas.
            </p>
          </div>
        </div>

        <div className={`px-6 sm:px-8 ${isMobile ? "py-6" : "py-5"}`}>
          <div className={`grid md:grid-cols-2 xl:grid-cols-3 ${isMobile ? "gap-4" : "gap-3.5"}`}>
            {quickActions.map((action) => (
              <QuickActionCard key={action.title} isMobile={isMobile} {...action} />
            ))}
          </div>

          <div className={`border-t border-slate-200/80 ${isMobile ? "mt-6 pt-6" : "mt-5 pt-5"}`}>
            <h3 className="text-lg font-semibold text-slate-950">How would you like to start?</h3>
            <p className={`text-sm text-slate-600 ${isMobile ? "mt-2 leading-6" : "mt-1.5 leading-6"}`}>
              Choose manual if you already know what you want to place on the map. Choose wizard if you want Investigation Tool
              to guide you through the investigation sections and create the starting nodes for you.
            </p>
            {isMobile ? (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Some functions may not be available when using the investigation map on mobile. We recommend using desktop to access all functions.
              </p>
            ) : null}
            <div className={`flex flex-wrap gap-3 ${isMobile ? "mt-5" : "mt-4"}`}>
              <button
                type="button"
                onClick={onStartManual}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Start Manually
              </button>
              <button
                type="button"
                onClick={onStartWizard}
                className="rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#6d28d9_52%,#db2777_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(79,70,229,0.24)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#1d4ed8_0%,#5b21b6_52%,#be185d_100%)]"
              >
                Start With Wizard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
