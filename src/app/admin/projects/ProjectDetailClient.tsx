"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAdmin } from "../lib/adminFetch";

type ProjectDetail = {
  id: string;
  quote_id: string;
  name: string | null;
  status: string | null;
  accepted_at: string | null;
  created_at: string | null;
  quotes?: {
    quote_number?: string | null;
    title?: string | null;
    organisations?: { name?: string | null } | null;
    contacts?: { full_name?: string | null; email?: string | null } | null;
  } | null;
};

type ProjectDeliverable = {
  id: string;
  project_id: string;
  title: string | null;
  description: string | null;
  pricing_mode: string | null;
  planned_hours: number | null;
  unit_rate: number | null;
  budget_ex_gst: number | null;
  status: string | null;
};

type ProjectMilestone = {
  id: string;
  project_deliverable_id: string;
  title: string | null;
  description: string | null;
  planned_hours: number | null;
  status: string | null;
};

type TimeEntry = {
  id: string;
  project_milestone_id: string;
  entry_date: string | null;
  hours: number;
  note: string | null;
  created_at: string | null;
};

type ProjectPayload = {
  project: ProjectDetail;
  deliverables: ProjectDeliverable[];
  milestones: ProjectMilestone[];
  time_entries: TimeEntry[];
};

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(value);
};

const getTodayIsoDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export default function ProjectDetailClient({ projectId }: { projectId: string }) {
  const [payload, setPayload] = useState<ProjectPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logState, setLogState] = useState<Record<string, { hours: string; note: string }>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [showLogModal, setShowLogModal] = useState(false);
  const [openDeliverableId, setOpenDeliverableId] = useState<string | null>(null);
  const [overHoursWarning, setOverHoursWarning] = useState<{
    show: boolean;
    planned: number;
    remaining: number;
    requested: number;
    overBy: number;
  }>({ show: false, planned: 0, remaining: 0, requested: 0, overBy: 0 });
  const [allowOverHours, setAllowOverHours] = useState(false);
  const [editOverHoursWarning, setEditOverHoursWarning] = useState<{
    show: boolean;
    planned: number;
    remaining: number;
    requested: number;
    overBy: number;
  }>({ show: false, planned: 0, remaining: 0, requested: 0, overBy: 0 });
  const [allowOverHoursEdit, setAllowOverHoursEdit] = useState(false);
  const [logForm, setLogForm] = useState({
    deliverableId: "",
    milestoneId: "",
    hours: "",
    note: "",
    entryDate: getTodayIsoDate(),
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    deliverableId: "",
    milestoneId: "",
    hours: "",
    note: "",
    entryDate: getTodayIsoDate(),
  });

  const load = async () => {
    if (!projectId) {
      setError("Missing project id.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const response = await fetchAdmin(`/api/admin/projects/${projectId}`);
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to load project.");
    } else {
      const data = (await response.json()) as ProjectPayload;
      setPayload(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!projectId) {
      setError("Missing project id.");
      setIsLoading(false);
      return;
    }
    load();
  }, [projectId]);

  const milestoneHours = useMemo(() => {
    const map: Record<string, number> = {};
    if (!payload) return map;
    payload.time_entries.forEach((entry) => {
      map[entry.project_milestone_id] = (map[entry.project_milestone_id] ?? 0) + entry.hours;
    });
    return map;
  }, [payload]);

  const milestonesByDeliverable = useMemo(() => {
    const map: Record<string, ProjectMilestone[]> = {};
    if (!payload) return map;
    payload.milestones.forEach((milestone) => {
      if (!map[milestone.project_deliverable_id]) {
        map[milestone.project_deliverable_id] = [];
      }
      map[milestone.project_deliverable_id].push(milestone);
    });
    return map;
  }, [payload]);

  const handleLogChange = (milestoneId: string, field: "hours" | "note", value: string) => {
    setLogState((prev) => ({
      ...prev,
      [milestoneId]: { ...prev[milestoneId], [field]: value },
    }));
  };

  const logTime = async (milestoneId: string) => {
    const hoursValue = Number(logState[milestoneId]?.hours ?? 0);
    if (!hoursValue || hoursValue <= 0) {
      setError("Please enter hours greater than 0.");
      return;
    }
    setError(null);
    setIsSaving((prev) => ({ ...prev, [milestoneId]: true }));
    const response = await fetchAdmin(`/api/admin/projects/milestones/${milestoneId}/time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hours: hoursValue,
        note: logState[milestoneId]?.note ?? null,
      }),
    });
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to log time.");
    } else {
      setLogState((prev) => ({ ...prev, [milestoneId]: { hours: "", note: "" } }));
      await load();
    }
    setIsSaving((prev) => ({ ...prev, [milestoneId]: false }));
  };

  if (isLoading || !payload) {
    return <div className="dashboard-panel">Loading project...</div>;
  }

  const { project, deliverables, milestones, time_entries } = payload;
  const milestoneList = milestones ?? [];
  const timeEntries = [...(time_entries ?? [])].sort((a, b) => {
    const left = a.created_at ? new Date(a.created_at).getTime() : 0;
    const right = b.created_at ? new Date(b.created_at).getTime() : 0;
    return right - left;
  });
  const projectPlannedHours = deliverables.reduce(
    (sum, deliverable) => sum + (deliverable.planned_hours ?? 0),
    0
  );
  const projectLoggedHours = deliverables.reduce((sum, deliverable) => {
    const deliverableMilestones = milestonesByDeliverable[deliverable.id] ?? [];
    const deliverableLogged = deliverableMilestones.reduce(
      (milestoneSum, milestone) => milestoneSum + (milestoneHours[milestone.id] ?? 0),
      0
    );
    return sum + deliverableLogged;
  }, 0);
  const projectProgress =
    projectPlannedHours > 0
      ? Math.min(100, Math.round((projectLoggedHours / projectPlannedHours) * 100))
      : 0;

  const handleLogSubmit = async () => {
    if (!logForm.milestoneId) {
      setError("Please select a milestone.");
      return;
    }
    if (!logForm.entryDate) {
      setError("Please select a date.");
      return;
    }
    const hoursValue = Number(logForm.hours ?? 0);
    if (!hoursValue || hoursValue <= 0) {
      setError("Please enter hours greater than 0.");
      return;
    }
    if (hoursValue > 12) {
      setError("Hours cannot be greater than 12.");
      return;
    }
    setError(null);

    if (!allowOverHours && logForm.deliverableId) {
      const deliverable = deliverables.find((item) => item.id === logForm.deliverableId);
      const deliverablePlanned = deliverable?.planned_hours ?? 0;
      const deliverableLogged =
        (milestonesByDeliverable[logForm.deliverableId] ?? []).reduce(
          (sum, milestone) => sum + (milestoneHours[milestone.id] ?? 0),
          0
        ) ?? 0;
      const remaining = deliverablePlanned - deliverableLogged;
      const after = deliverableLogged + hoursValue;

      if (deliverablePlanned > 0 && after > deliverablePlanned) {
        setOverHoursWarning({
          show: true,
          planned: deliverablePlanned,
          remaining: Math.max(0, remaining),
          requested: hoursValue,
          overBy: after - deliverablePlanned,
        });
        return;
      }
    }

    setIsSaving((prev) => ({ ...prev, modal: true as unknown as boolean }));
    const response = await fetchAdmin(
      `/api/admin/projects/milestones/${logForm.milestoneId}/time`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: hoursValue,
          note: logForm.note || null,
          entry_date: logForm.entryDate || null,
        }),
      }
    );
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to log time.");
    } else {
      const data = (await response.json()) as { entry?: TimeEntry };
      if (data.entry) {
        setPayload((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            time_entries: [data.entry, ...prev.time_entries],
          };
        });
      }
      setLogForm({
        deliverableId: "",
        milestoneId: "",
        hours: "",
        note: "",
        entryDate: getTodayIsoDate(),
      });
      setOverHoursWarning({ show: false, planned: 0, remaining: 0, requested: 0, overBy: 0 });
      setAllowOverHours(false);
      setShowLogModal(false);
    }
    setIsSaving((prev) => ({ ...prev, modal: false as unknown as boolean }));
  };

  const handleEditSubmit = async () => {
    if (!editEntryId) return;
    if (!editForm.milestoneId) {
      setError("Please select a milestone.");
      return;
    }
    if (!editForm.entryDate) {
      setError("Please select a date.");
      return;
    }
    const hoursValue = Number(editForm.hours ?? 0);
    if (!hoursValue || hoursValue <= 0) {
      setError("Please enter hours greater than 0.");
      return;
    }
    if (hoursValue > 12) {
      setError("Hours cannot be greater than 12.");
      return;
    }

    if (!allowOverHoursEdit && editForm.deliverableId) {
      const deliverable = deliverables.find((item) => item.id === editForm.deliverableId);
      const deliverablePlanned = deliverable?.planned_hours ?? 0;
      const deliverableLogged =
        (milestonesByDeliverable[editForm.deliverableId] ?? []).reduce(
          (sum, milestone) => sum + (milestoneHours[milestone.id] ?? 0),
          0
        ) ?? 0;
      const currentEntry = timeEntries.find((entry) => entry.id === editEntryId);
      const adjustedLogged = deliverableLogged - (currentEntry?.hours ?? 0) + hoursValue;
      const remaining = deliverablePlanned - (deliverableLogged - (currentEntry?.hours ?? 0));
      if (deliverablePlanned > 0 && adjustedLogged > deliverablePlanned) {
        setEditOverHoursWarning({
          show: true,
          planned: deliverablePlanned,
          remaining: Math.max(0, remaining),
          requested: hoursValue,
          overBy: adjustedLogged - deliverablePlanned,
        });
        return;
      }
    }

    setError(null);
    setIsSaving((prev) => ({ ...prev, edit: true as unknown as boolean }));
    const response = await fetchAdmin(`/api/admin/projects/time/${editEntryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hours: hoursValue,
        note: editForm.note || null,
        entry_date: editForm.entryDate,
        project_milestone_id: editForm.milestoneId,
      }),
    });
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to update time entry.");
    } else {
      const data = (await response.json()) as { entry?: TimeEntry };
      if (data.entry) {
        setPayload((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            time_entries: prev.time_entries.map((entry) =>
              entry.id === data.entry?.id ? data.entry : entry
            ),
          };
        });
      }
      setShowEditModal(false);
      setEditEntryId(null);
      setEditOverHoursWarning({ show: false, planned: 0, remaining: 0, requested: 0, overBy: 0 });
      setAllowOverHoursEdit(false);
    }
    setIsSaving((prev) => ({ ...prev, edit: false as unknown as boolean }));
  };

  const handleDeleteEntry = async (entryId: string) => {
    const confirmed = window.confirm("Delete this time entry?");
    if (!confirmed) return;
    const response = await fetchAdmin(`/api/admin/projects/time/${entryId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to delete time entry.");
      return;
    }
    setPayload((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        time_entries: prev.time_entries.filter((entry) => entry.id !== entryId),
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {project.name ?? project.quotes?.title ?? "Project"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Quote {project.quotes?.quote_number ?? "-"} Â·{" "}
          {project.quotes?.organisations?.name ?? "Unknown organisation"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Deliverables &amp; Milestones
          </h2>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "12.5%" }} />
              <col style={{ width: "12.5%" }} />
              <col style={{ width: "12.5%" }} />
              <col style={{ width: "12.5%" }} />
            </colgroup>
            <thead
              className="text-xs uppercase tracking-wide text-white"
              style={{ background: "#0f4b66" }}
            >
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Planned hrs</th>
                <th className="px-4 py-3">Hours used</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">%</th>
              </tr>
            </thead>
            <tbody>
              {deliverables.map((deliverable) => {
                const deliverableMilestones = milestonesByDeliverable[deliverable.id] ?? [];
                const deliverablePlanned = deliverable.planned_hours ?? 0;
                const deliverableLogged = deliverableMilestones.reduce(
                  (sum, milestone) => sum + (milestoneHours[milestone.id] ?? 0),
                  0
                );
                const deliverableProgress =
                  deliverablePlanned > 0
                    ? Math.min(100, Math.round((deliverableLogged / deliverablePlanned) * 100))
                    : 0;
                const isExpanded = openDeliverableId === deliverable.id;
                const deliverableOver = deliverablePlanned > 0 && deliverableLogged > deliverablePlanned;

                return (
                  <>
                    <tr
                      key={deliverable.id}
                      className="border-t border-slate-100 text-slate-900"
                      style={{ background: "#d8ebfb" }}
                    >
                      <td className="px-4 py-3 font-semibold">
                        <button
                          type="button"
                          className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-600"
                          onClick={() =>
                            setOpenDeliverableId((prev) =>
                              prev === deliverable.id ? null : deliverable.id
                            )
                          }
                          aria-label={
                            isExpanded ? "Collapse deliverable" : "Expand deliverable"
                          }
                        >
                          {isExpanded ? "-" : "+"}
                        </button>
                        {deliverable.title ?? "Deliverable"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {deliverable.description ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {deliverablePlanned}
                      </td>
                      <td
                        className={`px-4 py-3 ${deliverableOver ? "text-rose-700 font-semibold" : "text-slate-600"}`}
                      >
                        {deliverableLogged}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-full">
                            <div className="flex items-center text-[10px] font-semibold text-slate-400">
                              <span>{deliverableProgress}%</span>
                            </div>
                            <div className="relative mt-1 h-3 w-full rounded-full border border-slate-400 bg-white shadow-sm">
                              <div
                                className={`absolute left-0 top-0 h-3 rounded-full ${
                                  deliverableOver ? "bg-rose-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${deliverableProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-4 py-3 ${deliverableOver ? "text-rose-700 font-semibold" : "text-slate-600"}`}
                      >
                        {deliverableProgress}%
                      </td>
                    </tr>
                    {isExpanded && deliverableMilestones.map((milestone) => {
                      const planned = milestone.planned_hours ?? 0;
                      const logged = milestoneHours[milestone.id] ?? 0;
                      const progress =
                        planned > 0
                          ? Math.min(100, Math.round((logged / planned) * 100))
                          : 0;
                      return (
                        <tr key={milestone.id} className="border-t border-slate-100 bg-white">
                          <td className="px-4 py-3 text-slate-700">
                            <span className="mr-2 text-slate-400">-&gt;</span>
                            {milestone.title ?? "Milestone"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {milestone.description ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{planned}</td>
                          <td className="px-4 py-3 text-slate-600">{logged}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-full">
                                  <div className="flex items-center text-[10px] font-semibold text-slate-400">
                                    <span>{progress}%</span>
                                  </div>
                                  <div className="relative mt-1 h-2.5 w-full rounded-full border border-slate-300 bg-white shadow-sm">
                                    <div
                                      className="absolute left-0 top-0 h-2.5 rounded-full bg-ocean"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          <td className="px-4 py-3 text-slate-600">{progress}%</td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-700">Project total</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 font-semibold text-slate-700">
                  {projectPlannedHours}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700">
                  {projectLoggedHours}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-full">
                      <div className="flex items-center text-[10px] font-semibold text-slate-400">
                        <span>{projectProgress}%</span>
                      </div>
                      <div className="relative mt-1 h-3 w-full rounded-full border border-slate-400 bg-white shadow-sm">
                        <div
                          className="absolute left-0 top-0 h-3 rounded-full bg-emerald-500"
                          style={{ width: `${projectProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700">
                  {projectProgress}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Time log</h2>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
            onClick={() => setShowLogModal(true)}
          >
            Add time entry
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead
              className="text-xs uppercase tracking-wide text-white"
              style={{ background: "#0f4b66" }}
            >
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Milestone</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No time entries yet.
                  </td>
                </tr>
              )}
              {timeEntries.map((entry) => {
                const milestone = milestoneList.find(
                  (item) => item.id === entry.project_milestone_id
                );
                const deliverableId =
                  milestone?.project_deliverable_id ??
                  deliverables.find((item) =>
                    milestonesByDeliverable[item.id]?.some(
                      (m) => m.id === entry.project_milestone_id
                    )
                  )?.id ??
                  "";
                return (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-600">
                      {entry.entry_date ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {milestone?.title ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.hours}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.note ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                          onClick={() => {
                            setEditEntryId(entry.id);
                            setEditForm({
                              deliverableId,
                              milestoneId: entry.project_milestone_id,
                              hours: String(entry.hours ?? ""),
                              note: entry.note ?? "",
                              entryDate: entry.entry_date ?? getTodayIsoDate(),
                            });
                            setEditOverHoursWarning({
                              show: false,
                              planned: 0,
                              remaining: 0,
                              requested: 0,
                              overBy: 0,
                            });
                            setAllowOverHoursEdit(false);
                            setShowEditModal(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">Log time entry</h3>
            <p className="mt-2 text-sm text-slate-600">
              Add a time entry against a milestone.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-600">
                Deliverable
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={logForm.deliverableId}
                  onChange={(event) =>
                    setLogForm((prev) => ({
                      ...prev,
                      deliverableId: event.target.value,
                      milestoneId: "",
                    }))
                  }
                >
                  <option value="">Select deliverable</option>
                  {deliverables.map((deliverable) => (
                    <option key={deliverable.id} value={deliverable.id}>
                      {deliverable.title ?? "Deliverable"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                Milestone
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={logForm.milestoneId}
                  onChange={(event) =>
                    setLogForm((prev) => ({ ...prev, milestoneId: event.target.value }))
                  }
                  disabled={!logForm.deliverableId}
                >
                  <option value="">
                    {logForm.deliverableId ? "Select milestone" : "Select deliverable first"}
                  </option>
                  {milestoneList
                    .filter(
                      (milestone) => milestone.project_deliverable_id === logForm.deliverableId
                    )
                    .map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.title ?? "Milestone"}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                Hours (max 12)
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="12"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={logForm.hours}
                  onChange={(event) =>
                    setLogForm((prev) => ({ ...prev, hours: event.target.value }))
                  }
                />
              </label>
              <label className="block text-sm text-slate-600">
                Date
                <input
                  type="date"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={logForm.entryDate}
                  onChange={(event) =>
                    setLogForm((prev) => ({ ...prev, entryDate: event.target.value }))
                  }
                />
              </label>
              <label className="block text-sm text-slate-600">
                Note
                <textarea
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={logForm.note}
                  onChange={(event) =>
                    setLogForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                />
              </label>
            </div>
            {overHoursWarning.show && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <div className="font-semibold">Over hours allocation</div>
                <div className="mt-1">
                  Requested {overHoursWarning.requested}h, only {overHoursWarning.remaining}h remaining.
                  This will exceed the deliverable by {overHoursWarning.overBy}h.
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs"
                onClick={() => setShowLogModal(false)}
              >
                Cancel
              </button>
              {overHoursWarning.show && !allowOverHours ? (
                <button
                  type="button"
                  className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
                  onClick={() => {
                    setAllowOverHours(true);
                    setOverHoursWarning((prev) => ({ ...prev, show: false }));
                  }}
                >
                  Confirm over hours
                </button>
              ) : (
              <button
                type="button"
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                onClick={handleLogSubmit}
                disabled={isSaving.modal as unknown as boolean}
              >
                {isSaving.modal ? "Saving..." : "Save entry"}
              </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">Edit time entry</h3>
            <p className="mt-2 text-sm text-slate-600">
              Update hours, date, or milestone.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-600">
                Deliverable
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.deliverableId}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      deliverableId: event.target.value,
                      milestoneId: "",
                    }))
                  }
                >
                  <option value="">Select deliverable</option>
                  {deliverables.map((deliverable) => (
                    <option key={deliverable.id} value={deliverable.id}>
                      {deliverable.title ?? "Deliverable"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                Milestone
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.milestoneId}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, milestoneId: event.target.value }))
                  }
                  disabled={!editForm.deliverableId}
                >
                  <option value="">
                    {editForm.deliverableId ? "Select milestone" : "Select deliverable first"}
                  </option>
                  {milestoneList
                    .filter(
                      (milestone) =>
                        milestone.project_deliverable_id === editForm.deliverableId
                    )
                    .map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.title ?? "Milestone"}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                Hours (max 12)
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="12"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.hours}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, hours: event.target.value }))
                  }
                />
              </label>
              <label className="block text-sm text-slate-600">
                Date
                <input
                  type="date"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.entryDate}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, entryDate: event.target.value }))
                  }
                />
              </label>
              <label className="block text-sm text-slate-600">
                Note
                <textarea
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.note}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                />
              </label>
            </div>
            {editOverHoursWarning.show && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <div className="font-semibold">Over hours allocation</div>
                <div className="mt-1">
                  Requested {editOverHoursWarning.requested}h, only{" "}
                  {editOverHoursWarning.remaining}h remaining. This will exceed the
                  deliverable by {editOverHoursWarning.overBy}h.
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              {editOverHoursWarning.show && !allowOverHoursEdit ? (
                <button
                  type="button"
                  className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
                  onClick={() => {
                    setAllowOverHoursEdit(true);
                    setEditOverHoursWarning((prev) => ({ ...prev, show: false }));
                  }}
                >
                  Confirm over hours
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                  onClick={handleEditSubmit}
                  disabled={isSaving.edit as unknown as boolean}
                >
                  {isSaving.edit ? "Saving..." : "Save changes"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

