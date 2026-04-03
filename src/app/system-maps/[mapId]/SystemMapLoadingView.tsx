type SystemMapLoadingViewProps = {
  progress?: number;
  message?: string;
};

const loadingQuips = [
  { progress: 25, text: "Checking who is allowed near the whiteboard." },
  { progress: 50, text: "Unjamming the virtual sticky-note dispenser." },
  { progress: 75, text: "Convincing the map nodes to stop clustering like a toolbox drawer." },
  { progress: 100, text: "Putting the kettle on for the final render." },
];

export function SystemMapLoadingView({
  progress = 25,
  message = "Preparing the investigation canvas...",
}: SystemMapLoadingViewProps) {
  const allowedProgressSteps = new Set([25, 50, 75, 100]);
  const clampedProgress = allowedProgressSteps.has(Math.round(progress)) ? Math.round(progress) : 25;
  const quip = loadingQuips.find((item) => item.progress === clampedProgress)?.text ?? loadingQuips[0].text;

  return (
    <div className="min-h-screen bg-[#eef1f4]">
      <header
        className="fixed inset-x-0 top-0 z-20 flex h-[70px] items-center justify-between border-b border-slate-900 bg-black px-5"
        aria-hidden="true"
      >
        <div className="flex items-center gap-8">
          <div className="h-10 w-[140px] rounded-md bg-white/10" />
          <div className="h-6 w-[260px] rounded-full bg-[#05c3dd]/20" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 rounded bg-emerald-700/80" />
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="h-8 w-8 rounded border border-white/25 bg-white/5" />
        </div>
      </header>

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-[70px]">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundColor: "#f3f4f6",
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            backgroundPosition: "0 0, 0 0",
          }}
        />

        <div className="relative z-10 flex w-full max-w-xl flex-col items-center rounded-[32px] border border-white/60 bg-white/80 px-10 py-12 text-center shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#05c3dd] border-r-[#05c3dd]" />
            <div className="h-5 w-5 rounded-full bg-[#05c3dd]" />
          </div>

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Investigation Tool
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Loading map</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">{message}</p>

          <div className="mt-8 w-full max-w-md">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span>Progress</span>
              <span>{clampedProgress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#05c3dd_0%,#2563eb_50%,#0f766e_100%)] transition-[width] duration-500 ease-out"
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700">{quip}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
