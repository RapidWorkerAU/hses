"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";

type RiskAssessmentRow = {
  id: string;
  title: string;
  description: string | null;
  statusLabel: string;
  isPublic: boolean;
  updatedAt: string;
  createdAt: string;
};
type LookupOption = { id: string; label: string };

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function RiskAssessmentsListClient() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLabel, setUserLabel] = useState("Current User");
  const [rows, setRows] = useState<RiskAssessmentRow[]>([]);
  const [statuses, setStatuses] = useState<LookupOption[]>([]);
  const [industries, setIndustries] = useState<LookupOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatusId, setNewStatusId] = useState("");
  const [newIndustryId, setNewIndustryId] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);

  const rowCountLabel = useMemo(() => `${rows.length} record${rows.length === 1 ? "" : "s"}`, [rows.length]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          window.location.assign(`/login?returnTo=${encodeURIComponent("/risk-assessments")}`);
          return;
        }
        setCurrentUserId(user.id);

        const email = localStorage.getItem("hses_user_email")?.trim() ?? "";
        setUserLabel(email || user.email || "Current User");

        const [
          { data: assessmentsData, error: assessmentsError },
          { data: statusesData, error: statusesError },
          { data: industriesData, error: industriesError },
        ] = await Promise.all([
          supabaseBrowser
            .schema("risk")
            .from("risk_assessments")
            .select("id,title,description,is_public,updated_at,created_at,status_id")
            .order("updated_at", { ascending: false }),
          supabaseBrowser.schema("risk").from("risk_statuses").select("id,label"),
          supabaseBrowser.schema("risk").from("industries").select("id,label").eq("is_active", true).order("sort_order"),
        ]);

        if (assessmentsError || statusesError || industriesError) {
          setError(assessmentsError?.message || statusesError?.message || industriesError?.message || "Unable to load risk assessments.");
          return;
        }

        const statusLabelById = new Map<string, string>();
        (statusesData ?? []).forEach((status) => {
          statusLabelById.set(status.id as string, status.label as string);
        });
        setStatuses(((statusesData ?? []) as LookupOption[]) || []);
        setIndustries(((industriesData ?? []) as LookupOption[]) || []);
        const defaultStatus = (statusesData?.[0]?.id as string | undefined) ?? "";
        setNewStatusId((prev) => prev || defaultStatus);

        const mapped = (assessmentsData ?? []).map((row) => {
          return {
            id: row.id as string,
            title: (row.title as string) ?? "Untitled",
            description: (row.description as string | null) ?? null,
            statusLabel: statusLabelById.get((row.status_id as string) ?? "") ?? "Draft",
            isPublic: Boolean(row.is_public),
            updatedAt: row.updated_at as string,
            createdAt: row.created_at as string,
          };
        });

        setRows(mapped);
      } catch {
        setError("Unable to load risk assessments.");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  const formatLabel = (label: string) =>
    (label || "")
      .replace(/_/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const openCreateModal = () => {
    setCreateError(null);
    setNewTitle("");
    setNewDescription("");
    setNewIndustryId("");
    setNewIsPublic(false);
    setIsCreateModalOpen(true);
  };

  const createRiskAssessment = async () => {
    if (!currentUserId) return;
    if (!newTitle.trim()) {
      setCreateError("Risk assessment title is required.");
      return;
    }
    setCreateError(null);
    setIsCreating(true);
    try {
      const { data, error: insertError } = await supabaseBrowser
        .schema("risk")
        .from("risk_assessments")
        .insert({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          status_id: newStatusId || null,
          industry_id: newIndustryId || null,
          owner_user_id: currentUserId,
          is_public: newIsPublic,
        })
        .select("id")
        .single();
      if (insertError || !data?.id) {
        setCreateError(insertError?.message || "Unable to create risk assessment.");
        return;
      }
      window.location.assign(`/risk-assessments/${data.id as string}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="dashboard-panel">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Your risk assessments</h2>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-outline">
              Search Risk Records
            </button>
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              Add New Risk Assessment
            </button>
          </div>
        </div>
        {error ? (
          <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
      </div>

      <div className="dashboard-panel mt-4" style={{ overflowX: "auto" }}>
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Description</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Owner</th>
              <th className="px-3 py-3">Updated</th>
              <th className="px-3 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-3 py-5 text-slate-600" colSpan={6}>
                  Loading risk assessments...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-3 py-5 text-slate-600" colSpan={6}>
                  No risk assessments have been added yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                  onClick={() => {
                    window.location.assign(`/risk-assessments/${row.id}`);
                  }}
                >
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    {row.title}
                    {row.isPublic ? (
                      <span className="ml-2 rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        Public
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-[260px] truncate px-3 py-3 text-slate-600" title={row.description ?? undefined}>
                    {row.description || "-"}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{row.statusLabel}</td>
                  <td className="px-3 py-3 text-slate-600">{userLabel}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(row.updatedAt)}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Showing {rowCountLabel} for <strong>{userLabel}</strong>.
      </p>

      <button
        type="button"
        aria-label="Close create risk assessment modal"
        className={`fixed inset-0 z-[72] bg-slate-900/35 transition-opacity duration-200 ${
          isCreateModalOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsCreateModalOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create risk assessment"
        className={`fixed left-1/2 top-1/2 z-[73] w-full max-w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-none border border-slate-300 bg-white p-5 shadow-xl transition-all duration-200 ${
          isCreateModalOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-xl font-semibold text-slate-900">Create New Risk Assessment</h3>
          <p className="mt-1 text-sm text-slate-600">Enter assessment details, then select Create or Cancel.</p>
        </div>
        <div className="mt-4 dashboard-input-stack">
          <label className="dashboard-field">
            <span>Risk Assessment Title</span>
            <input className="dashboard-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </label>
          <label className="dashboard-field">
            <span>Description</span>
            <textarea className="dashboard-textarea" rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          </label>
          <div className="dashboard-input-row">
            <label className="dashboard-field">
              <span>Status</span>
              <select className="dashboard-input" value={newStatusId} onChange={(e) => setNewStatusId(e.target.value)}>
                <option value="">Select status</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatLabel(s.label)}
                  </option>
                ))}
              </select>
            </label>
            <label className="dashboard-field">
              <span>Industry</span>
              <select className="dashboard-input" value={newIndustryId} onChange={(e) => setNewIndustryId(e.target.value)}>
                <option value="">Select industry</option>
                {industries.map((i) => (
                  <option key={i.id} value={i.id}>
                    {formatLabel(i.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="dashboard-checkbox">
            <input type="checkbox" checked={newIsPublic} onChange={(e) => setNewIsPublic(e.target.checked)} />
            <span>Public risk assessment</span>
          </label>
          {createError ? <p className="dashboard-form-error">{createError}</p> : null}
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-primary" onClick={() => void createRiskAssessment()} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
