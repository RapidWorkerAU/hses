"use client";

import { useEffect, useState } from "react";

const ADMIN_EMAIL = "ashleigh.phillips@hses.com.au";

export default function BusinessAdminClient() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem("hses_user_email")?.toLowerCase() ?? "";
    setEmail(storedEmail);
  }, []);

  if (email === null) {
    return <div className="dashboard-panel">Checking access...</div>;
  }

  if (email !== ADMIN_EMAIL) {
    return (
      <div className="dashboard-panel">
        <h2>Access restricted</h2>
        <p className="dashboard-page-helper">
          This page is only available to approved business administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <a
        href="/admin/quotes"
        className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>Quotes &amp; Proposals</span>
          <span className="rounded-full border border-emerald-200 px-2 py-1 text-[10px] text-emerald-600">
            Admin
          </span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          Proposal Builder
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Create, price, and publish client proposals with milestone breakdowns and
          approval tracking.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 group-hover:border-ocean group-hover:text-ocean">
          Open builder
          <span aria-hidden="true">→</span>
        </div>
      </a>
      <a
        href="/admin/projects"
        className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>Project Schedule</span>
          <span className="rounded-full border border-indigo-200 px-2 py-1 text-[10px] text-indigo-600">
            Coming soon
          </span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">Schedule Builder</h3>
        <p className="mt-2 text-sm text-slate-600">
          Track accepted deliverables, allocate hours to milestones, and monitor
          progress over time.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 group-hover:border-ocean group-hover:text-ocean">
          Open schedule
          <span aria-hidden="true">â†’</span>
        </div>
      </a>
    </div>
  );
}
