"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { fetchAdmin } from "../lib/adminFetch";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight, IconArrowUp, IconArrowDown, IconSelector, IconSearch } from "@tabler/icons-react";
import { formatMoney, formatDate } from "@/lib/formatters";

// ── Constants ─────────────────────────────────────────────────────────────────

const TIME_ENTRIES_PER_PAGE = 10;
const MONTH_OPTIONS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type ProjectSectionKey = "deliverables" | "time";
const projectSections: Array<{ key: ProjectSectionKey; label: string }> = [
  { key: "deliverables", label: "Deliverables & Milestones" },
  { key: "time",         label: "Time Log" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type ProjectDetail = {
  id: string;
  quote_id: string;
  name: string | null;
  status: string | null;
  accepted_at: string | null;
  created_at: string | null;
  latest_access_code?: string | null;
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
  estimated_completion_date?: string | null;
};

type ProjectMilestone = {
  id: string;
  project_deliverable_id: string;
  title: string | null;
  description: string | null;
  planned_hours: number | null;
  status: string | null;
  estimated_completion_date?: string | null;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatStatus = (value: string | null | undefined) => {
  const s = (value ?? "active").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Active";
};

const getTodayIsoDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const getYearMonth = (value: string | null | undefined) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) return { year: Number(match[1]), month: Number(match[2]) - 1 };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { year: date.getFullYear(), month: date.getMonth() };
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FormSelect({ label, value, onChange, disabled, children }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-neutral-700">{label}</span>
      <select
        className="mt-1.5 w-full h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 disabled:opacity-50"
        value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      >
        {children}
      </select>
    </label>
  );
}

// ── Sidebar button styles ─────────────────────────────────────────────────────

const sidebarSecondaryActionClass =
  "inline-flex h-8 w-full items-center justify-center gap-[6px] rounded-md border-[0.5px] border-neutral-200 bg-neutral-100 px-3 text-[13px] font-medium text-neutral-700 transition-all duration-150 hover:bg-neutral-200 active:scale-[0.98]";
const sidebarPrimaryActionClass =
  "inline-flex h-8 w-full items-center justify-center gap-[6px] rounded-md border-[0.5px] border-neutral-900 bg-neutral-900 px-3 text-[13px] font-medium text-white transition-all duration-150 hover:bg-neutral-800 active:scale-[0.98]";

// ── Sort button ───────────────────────────────────────────────────────────────

function SortBtn({ label, active, dir, onClick }: {
  label: string; active: boolean; dir: 'asc' | 'desc'; onClick: () => void;
}) {
  const Icon = active ? (dir === 'asc' ? IconArrowUp : IconArrowDown) : IconSelector;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-800 transition-colors"
    >
      {label}
      <Icon size={11} className={active ? "text-accent-500" : "opacity-30"} />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProjectDetailClient({ projectId }: { projectId: string }) {
  const today = new Date();
  const [payload, setPayload] = useState<ProjectPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ProjectSectionKey>("deliverables");

  // Milestones modal
  const [milestonesModal, setMilestonesModal] = useState<{ open: boolean; deliverableId: string | null }>({ open: false, deliverableId: null });
  const [milestoneDateDrafts, setMilestoneDateDrafts] = useState<Record<string, string>>({});
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [isSavingMilestoneDate, setIsSavingMilestoneDate] = useState<Record<string, boolean>>({});

  // Time log
  const [timeLogPage, setTimeLogPage] = useState(1);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [logModalError, setLogModalError] = useState<string | null>(null);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [logForm, setLogForm] = useState({ deliverableId: "", milestoneId: "", hours: "", note: "", entryDate: getTodayIsoDate() });
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ deliverableId: "", milestoneId: "", hours: "", note: "", entryDate: getTodayIsoDate() });
  const [deleteEntryModal, setDeleteEntryModal] = useState<{ open: boolean; entryId: string | null; isDeleting: boolean }>({ open: false, entryId: null, isDeleting: false });
  const [overHoursWarning, setOverHoursWarning] = useState({ show: false, planned: 0, remaining: 0, requested: 0, overBy: 0 });
  const [allowOverHours, setAllowOverHours] = useState(false);
  const [editOverHoursWarning, setEditOverHoursWarning] = useState({ show: false, planned: 0, remaining: 0, requested: 0, overBy: 0 });
  const [allowOverHoursEdit, setAllowOverHoursEdit] = useState(false);
  const [timesheetMonth, setTimesheetMonth] = useState(today.getMonth());
  const [timesheetYear, setTimesheetYear] = useState(today.getFullYear());
  const [openTimesheetDeliverableId, setOpenTimesheetDeliverableId] = useState<string | null>(null);

  // Send email modal
  const [emailModal, setEmailModal] = useState<{ open: boolean; email: string; cc: string }>({ open: false, email: "", cc: "" });
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  // Deliverables table sort/filter
  const [dvSort, setDvSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: '', dir: 'asc' });
  const [dvSearch, setDvSearch] = useState('');

  // Time log sort/filter
  const [tlSort, setTlSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'date', dir: 'desc' });
  const [tlSearch, setTlSearch] = useState('');
  const [tlDeliverableFilter, setTlDeliverableFilter] = useState('');

  // ── Data loading ─────────────────────────────────────────────────────────────

  const load = async () => {
    if (!projectId) { setError("Missing project id."); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    const response = await fetchAdmin(`/api/admin/projects/${projectId}`);
    if (!response.ok) {
      setError((await response.text()) || "Unable to load project.");
    } else {
      setPayload((await response.json()) as ProjectPayload);
    }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const milestoneHours = useMemo(() => {
    const map: Record<string, number> = {};
    payload?.time_entries.forEach((e) => { map[e.project_milestone_id] = (map[e.project_milestone_id] ?? 0) + e.hours; });
    return map;
  }, [payload]);

  const deliverableById = useMemo(() => {
    const map: Record<string, ProjectDeliverable> = {};
    payload?.deliverables.forEach((d) => { map[d.id] = d; });
    return map;
  }, [payload]);

  const milestoneById = useMemo(() => {
    const map: Record<string, ProjectMilestone> = {};
    payload?.milestones.forEach((m) => { map[m.id] = m; });
    return map;
  }, [payload]);

  const milestonesByDeliverable = useMemo(() => {
    const map: Record<string, ProjectMilestone[]> = {};
    payload?.milestones.forEach((m) => {
      if (!map[m.project_deliverable_id]) map[m.project_deliverable_id] = [];
      map[m.project_deliverable_id].push(m);
    });
    return map;
  }, [payload]);

  const sortedFilteredDeliverables = useMemo(() => {
    const rows = [...(payload?.deliverables ?? [])];
    const q = dvSearch.trim().toLowerCase();
    const filtered = q
      ? rows.filter(d => (d.title ?? '').toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q))
      : rows;
    if (!dvSort.col) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (dvSort.col === 'title') {
        cmp = (a.title ?? '').localeCompare(b.title ?? '');
      } else if (dvSort.col === 'budget') {
        cmp = (a.budget_ex_gst ?? 0) - (b.budget_ex_gst ?? 0);
      } else if (dvSort.col === 'planned') {
        cmp = (a.planned_hours ?? 0) - (b.planned_hours ?? 0);
      } else if (dvSort.col === 'used') {
        const aL = (milestonesByDeliverable[a.id] ?? []).reduce((s, m) => s + (milestoneHours[m.id] ?? 0), 0);
        const bL = (milestonesByDeliverable[b.id] ?? []).reduce((s, m) => s + (milestoneHours[m.id] ?? 0), 0);
        cmp = aL - bL;
      } else if (dvSort.col === 'progress') {
        const aPl = a.planned_hours ?? 0;
        const bPl = b.planned_hours ?? 0;
        const aL = (milestonesByDeliverable[a.id] ?? []).reduce((s, m) => s + (milestoneHours[m.id] ?? 0), 0);
        const bL = (milestonesByDeliverable[b.id] ?? []).reduce((s, m) => s + (milestoneHours[m.id] ?? 0), 0);
        cmp = (aPl > 0 ? aL / aPl : 0) - (bPl > 0 ? bL / bPl : 0);
      } else if (dvSort.col === 'milestones') {
        cmp = (milestonesByDeliverable[a.id]?.length ?? 0) - (milestonesByDeliverable[b.id]?.length ?? 0);
      }
      return dvSort.dir === 'asc' ? cmp : -cmp;
    });
  }, [payload?.deliverables, dvSearch, dvSort, milestonesByDeliverable, milestoneHours]);

  const sortedFilteredTimeEntries = useMemo(() => {
    const rows = [...(payload?.time_entries ?? [])];
    const q = tlSearch.trim().toLowerCase();
    const filtered = rows.filter(entry => {
      const ms = milestoneById[entry.project_milestone_id];
      const dv = ms ? deliverableById[ms.project_deliverable_id] : undefined;
      if (tlDeliverableFilter && dv?.id !== tlDeliverableFilter) return false;
      if (q && !((dv?.title ?? '').toLowerCase().includes(q) || (ms?.title ?? '').toLowerCase().includes(q) || (entry.note ?? '').toLowerCase().includes(q))) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (tlSort.col === 'date') {
        cmp = (a.entry_date ?? a.created_at ?? '').localeCompare(b.entry_date ?? b.created_at ?? '');
      } else if (tlSort.col === 'deliverable') {
        const aMs = milestoneById[a.project_milestone_id];
        const aDv = aMs ? deliverableById[aMs.project_deliverable_id] : undefined;
        const bMs = milestoneById[b.project_milestone_id];
        const bDv = bMs ? deliverableById[bMs.project_deliverable_id] : undefined;
        cmp = (aDv?.title ?? '').localeCompare(bDv?.title ?? '');
      } else if (tlSort.col === 'hours') {
        cmp = a.hours - b.hours;
      }
      return tlSort.dir === 'asc' ? cmp : -cmp;
    });
  }, [payload?.time_entries, tlSearch, tlSort, tlDeliverableFilter, milestoneById, deliverableById]);

  useEffect(() => { setTimeLogPage(1); }, [tlSearch, tlSort, tlDeliverableFilter]);

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (isLoading || !payload) {
    if (error && !payload) {
      return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">{error}</div>;
    }
    return (
      <div className="flex min-h-full w-full">
        <aside className="w-[220px] flex-shrink-0 border-r border-neutral-100 bg-white hidden md:block">
          <div className="p-4 flex flex-col gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-3 w-16 mt-4" />
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
            <Skeleton className="h-3 w-20 mt-4" />
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5" />)}
          </div>
        </aside>
        <div className="flex-1 p-6 flex flex-col gap-4">
          <Skeleton className="h-5 w-48" />
          <div className="rounded-xl border border-neutral-200 bg-white p-5 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        </div>
      </div>
    );
  }

  // ── Computed values ───────────────────────────────────────────────────────────

  const { project, deliverables, milestones, time_entries } = payload;
  const milestoneList = milestones ?? [];

  // Raw time entries (unfiltered) — used for timesheet and sidebar totals
  const timeEntries = time_entries ?? [];

  const projectPlannedHours = deliverables.reduce((s, d) => s + (d.planned_hours ?? 0), 0);
  const projectLoggedHours = deliverables.reduce((s, d) => {
    const ms = milestonesByDeliverable[d.id] ?? [];
    return s + ms.reduce((s2, m) => s2 + (milestoneHours[m.id] ?? 0), 0);
  }, 0);
  const projectProgress = projectPlannedHours > 0 ? Math.min(100, Math.round((projectLoggedHours / projectPlannedHours) * 100)) : 0;

  const totalBudgetExGst = deliverables.reduce((s, d) => s + (d.budget_ex_gst ?? 0), 0);
  const gstAmount = totalBudgetExGst * 0.1;
  const totalIncGst = totalBudgetExGst + gstAmount;

  const totalTimeLogPages = Math.max(1, Math.ceil(sortedFilteredTimeEntries.length / TIME_ENTRIES_PER_PAGE));
  const currentTimeLogPage = Math.min(timeLogPage, totalTimeLogPages);
  const paginatedTimeEntries = sortedFilteredTimeEntries.slice((currentTimeLogPage - 1) * TIME_ENTRIES_PER_PAGE, currentTimeLogPage * TIME_ENTRIES_PER_PAGE);

  const timesheetYears = Array.from(new Set([
    today.getFullYear(),
    ...timeEntries.map((e) => getYearMonth(e.entry_date ?? e.created_at)?.year).filter((y): y is number => Boolean(y)),
  ])).sort((a, b) => b - a);

  const timesheetDeliverables = Array.from(
    timeEntries.reduce<Map<string, { deliverableId: string; deliverableName: string; totalHours: number; milestones: Array<{ key: string; milestoneName: string; hours: number }> }>>((map, entry) => {
      const ym = getYearMonth(entry.entry_date ?? entry.created_at);
      if (!ym || ym.year !== timesheetYear || ym.month !== timesheetMonth) return map;
      const ms = milestoneById[entry.project_milestone_id];
      const dv = ms ? deliverableById[ms.project_deliverable_id] : undefined;
      const dvId = dv?.id ?? "unknown";
      const msKey = `${dvId}:${entry.project_milestone_id}`;
      let grouped = map.get(dvId);
      if (!grouped) { grouped = { deliverableId: dvId, deliverableName: dv?.title ?? "Deliverable", totalHours: 0, milestones: [] }; map.set(dvId, grouped); }
      grouped.totalHours += entry.hours;
      const em = grouped.milestones.find((x) => x.key === msKey);
      if (em) em.hours += entry.hours; else grouped.milestones.push({ key: msKey, milestoneName: ms?.title ?? "Milestone", hours: entry.hours });
      return map;
    }, new Map()).values()
  ).sort((a, b) => a.deliverableName.localeCompare(b.deliverableName));
  const timesheetTotalHours = timesheetDeliverables.reduce((s, d) => s + d.totalHours, 0);

  const selectedLogMilestone = logForm.milestoneId ? milestoneById[logForm.milestoneId] : undefined;
  const selectedLogMilestoneRemaining = selectedLogMilestone
    ? (selectedLogMilestone.planned_hours ?? 0) - (milestoneHours[selectedLogMilestone.id] ?? 0)
    : null;

  const milestonesDeliverable = milestonesModal.deliverableId ? deliverableById[milestonesModal.deliverableId] : undefined;
  const modalMilestones = milestonesModal.deliverableId ? (milestonesByDeliverable[milestonesModal.deliverableId] ?? []) : [];

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const saveMilestoneEstimatedDate = async (milestoneId: string) => {
    const draft = milestoneDateDrafts[milestoneId] ?? "";
    setIsSavingMilestoneDate((prev) => ({ ...prev, [milestoneId]: true }));
    const response = await fetchAdmin(`/api/admin/projects/milestones/${milestoneId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimated_completion_date: draft || null }),
    });
    if (!response.ok) {
      setError((await response.text()) || "Unable to update milestone date.");
      setIsSavingMilestoneDate((prev) => ({ ...prev, [milestoneId]: false }));
      return;
    }
    const data = (await response.json()) as { milestone?: { id: string; estimated_completion_date?: string | null } };
    if (data.milestone) {
      setPayload((prev) => prev ? {
        ...prev,
        milestones: prev.milestones.map((m) => m.id === data.milestone?.id ? { ...m, estimated_completion_date: data.milestone?.estimated_completion_date ?? null } : m),
      } : prev);
    }
    setEditingMilestoneId(null);
    setIsSavingMilestoneDate((prev) => ({ ...prev, [milestoneId]: false }));
  };

  const handleLogSubmit = async () => {
    if (!logForm.milestoneId) { setLogModalError("Please select a milestone."); return; }
    if (!logForm.entryDate) { setLogModalError("Please select a date."); return; }
    const hoursValue = Number(logForm.hours ?? 0);
    if (!hoursValue || hoursValue <= 0) { setLogModalError("Please enter hours greater than 0."); return; }
    if (hoursValue > 12) { setLogModalError("Hours cannot be greater than 12."); return; }
    setLogModalError(null);
    if (!allowOverHours && logForm.deliverableId) {
      const dv = deliverables.find((d) => d.id === logForm.deliverableId);
      const dvPlanned = dv?.planned_hours ?? 0;
      const dvLogged = (milestonesByDeliverable[logForm.deliverableId] ?? []).reduce((s, m) => s + (milestoneHours[m.id] ?? 0), 0);
      if (dvPlanned > 0 && dvLogged + hoursValue > dvPlanned) {
        const remaining = Math.max(0, dvPlanned - dvLogged);
        setOverHoursWarning({ show: true, planned: dvPlanned, remaining, requested: hoursValue, overBy: dvLogged + hoursValue - dvPlanned });
        return;
      }
    }
    setIsSaving((prev) => ({ ...prev, modal: true }));
    const response = await fetchAdmin(`/api/admin/projects/milestones/${logForm.milestoneId}/time`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: hoursValue, note: logForm.note || null, entry_date: logForm.entryDate || null }),
    });
    if (!response.ok) {
      setLogModalError((await response.text()) || "Unable to log time.");
    } else {
      const data = (await response.json()) as { entry?: TimeEntry };
      if (data.entry) setPayload((prev) => prev ? { ...prev, time_entries: [data.entry!, ...prev.time_entries] } : prev);
      setLogForm({ deliverableId: "", milestoneId: "", hours: "", note: "", entryDate: getTodayIsoDate() });
      setLogModalError(null);
      setOverHoursWarning({ show: false, planned: 0, remaining: 0, requested: 0, overBy: 0 });
      setAllowOverHours(false);
      setShowLogModal(false);
    }
    setIsSaving((prev) => ({ ...prev, modal: false }));
  };

  const handleEditSubmit = async () => {
    if (!editEntryId) return;
    if (!editForm.milestoneId) { setEditModalError("Please select a milestone."); return; }
    if (!editForm.entryDate) { setEditModalError("Please select a date."); return; }
    const hoursValue = Number(editForm.hours ?? 0);
    if (!hoursValue || hoursValue <= 0) { setEditModalError("Please enter hours greater than 0."); return; }
    if (hoursValue > 12) { setEditModalError("Hours cannot be greater than 12."); return; }
    setEditModalError(null);
    if (!allowOverHoursEdit && editForm.deliverableId) {
      const dv = deliverables.find((d) => d.id === editForm.deliverableId);
      const dvPlanned = dv?.planned_hours ?? 0;
      const dvLogged = (milestonesByDeliverable[editForm.deliverableId] ?? []).reduce((s, m) => s + (milestoneHours[m.id] ?? 0), 0);
      const currentEntry = timeEntries.find((e) => e.id === editEntryId);
      const adjustedLogged = dvLogged - (currentEntry?.hours ?? 0) + hoursValue;
      if (dvPlanned > 0 && adjustedLogged > dvPlanned) {
        const remaining = Math.max(0, dvPlanned - (dvLogged - (currentEntry?.hours ?? 0)));
        setEditOverHoursWarning({ show: true, planned: dvPlanned, remaining, requested: hoursValue, overBy: adjustedLogged - dvPlanned });
        return;
      }
    }
    setIsSaving((prev) => ({ ...prev, edit: true }));
    const response = await fetchAdmin(`/api/admin/projects/time/${editEntryId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: hoursValue, note: editForm.note || null, entry_date: editForm.entryDate, project_milestone_id: editForm.milestoneId }),
    });
    if (!response.ok) {
      setEditModalError((await response.text()) || "Unable to update time entry.");
    } else {
      const data = (await response.json()) as { entry?: TimeEntry };
      if (data.entry) setPayload((prev) => prev ? { ...prev, time_entries: prev.time_entries.map((e) => e.id === data.entry?.id ? data.entry! : e) } : prev);
      setShowEditModal(false); setEditEntryId(null); setEditModalError(null);
      setEditOverHoursWarning({ show: false, planned: 0, remaining: 0, requested: 0, overBy: 0 });
      setAllowOverHoursEdit(false);
    }
    setIsSaving((prev) => ({ ...prev, edit: false }));
  };

  const confirmDeleteEntry = async () => {
    if (!deleteEntryModal.entryId) return;
    const entryId = deleteEntryModal.entryId;
    setDeleteEntryModal((prev) => ({ ...prev, isDeleting: true }));
    const response = await fetchAdmin(`/api/admin/projects/time/${entryId}`, { method: "DELETE" });
    if (!response.ok) {
      setError((await response.text()) || "Unable to delete time entry.");
      setDeleteEntryModal((prev) => ({ ...prev, isDeleting: false }));
      return;
    }
    setPayload((prev) => prev ? { ...prev, time_entries: prev.time_entries.filter((e) => e.id !== entryId) } : prev);
    setDeleteEntryModal({ open: false, entryId: null, isDeleting: false });
  };

  const sendAccessEmail = async () => {
    const email = emailModal.email.trim();
    const code = project.latest_access_code?.trim() ?? "";
    if (!email) { setEmailStatus("error"); setEmailError("Please enter a recipient email."); return; }
    if (!code) { setEmailStatus("error"); setEmailError("No access code found for this project."); return; }
    setEmailStatus("sending"); setEmailError(null);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
    const response = await fetchAdmin(`/api/admin/projects/${project.id}/send-access-email`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, cc: emailModal.cc.trim() || null, access_code: code, link: `${siteUrl}/project` }),
    });
    if (!response.ok) { setEmailStatus("error"); setEmailError((await response.text()) || "Unable to send email."); return; }
    setEmailStatus("sent");
  };

  // ── Shared time form ─────────────────────────────────────────────────────────

  const renderTimeForm = (
    form: typeof logForm,
    setForm: React.Dispatch<React.SetStateAction<typeof logForm>>,
    setModalError: (v: string | null) => void,
    remainingHours: number | null,
    warning: typeof overHoursWarning,
    modalError: string | null,
  ) => (
    <div className="space-y-4">
      <FormSelect label="Deliverable" value={form.deliverableId}
        onChange={(v) => { setModalError(null); setForm((prev) => ({ ...prev, deliverableId: v, milestoneId: "" })); }}>
        <option value="">Select deliverable</option>
        {deliverables.map((d) => <option key={d.id} value={d.id}>{d.title ?? "Deliverable"}</option>)}
      </FormSelect>
      <FormSelect label="Milestone" value={form.milestoneId}
        onChange={(v) => { setModalError(null); setForm((prev) => ({ ...prev, milestoneId: v })); }}
        disabled={!form.deliverableId}>
        <option value="">{form.deliverableId ? "Select milestone" : "Select deliverable first"}</option>
        {milestoneList.filter((m) => m.project_deliverable_id === form.deliverableId).map((m) => (
          <option key={m.id} value={m.id}>{m.title ?? "Milestone"}</option>
        ))}
      </FormSelect>
      <div>
        <Input
          label="Hours (max 12)"
          type="number"
          step={0.25}
          min={0}
          max={12}
          className="!h-9 text-[13px]"
          value={form.hours}
          onChange={(e) => { setModalError(null); setForm((prev) => ({ ...prev, hours: e.target.value })); }}
        />
        {remainingHours !== null && (
          <p className={`mt-1 text-[12px] ${remainingHours < 0 ? "font-semibold text-rose-600" : "text-neutral-500"}`}>
            Hours remaining on milestone: {remainingHours}
          </p>
        )}
      </div>
      <Input
        label="Date"
        type="date"
        required
        className="!h-9 text-[13px]"
        value={form.entryDate}
        onChange={(e) => { setModalError(null); setForm((prev) => ({ ...prev, entryDate: e.target.value })); }}
      />
      <label className="block">
        <span className="text-[13px] font-medium text-neutral-700">Note</span>
        <textarea rows={3}
          className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 resize-none"
          value={form.note}
          onChange={(e) => { setModalError(null); setForm((prev) => ({ ...prev, note: e.target.value })); }} />
      </label>
      {modalError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{modalError}</div>
      )}
      {warning.show && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          <p className="font-semibold">Over hours allocation</p>
          <p className="mt-0.5">Requested {warning.requested}h, only {warning.remaining}h remaining. This will exceed the deliverable by {warning.overBy}h.</p>
        </div>
      )}
    </div>
  );

  // ── Sort helpers ──────────────────────────────────────────────────────────────

  const toggleDvSort = (col: string) =>
    setDvSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const toggleTlSort = (col: string) =>
    setTlSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }));

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-full w-full">

      {/* ── White sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-[220px] flex-shrink-0 border-r border-neutral-100 bg-white hidden md:block overflow-y-auto">
        <div className="p-4">

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className={sidebarPrimaryActionClass}
              onClick={() => {
                setEmailStatus("idle"); setEmailError(null);
                setEmailModal({ open: true, email: project.quotes?.contacts?.email ?? "", cc: "" });
              }}
            >
              Send access email
            </button>
          </div>

          {/* Section nav */}
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Sections</p>
            <p className="text-[13px] font-semibold text-neutral-700 mb-3 leading-tight truncate">
              {project.quotes?.quote_number ?? project.name ?? "Project"}
            </p>
            <nav className="flex flex-col gap-0.5">
              {projectSections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-[13px] text-left transition-colors",
                    activeSection === section.key
                      ? "bg-neutral-100 text-neutral-900 font-medium"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Project details */}
          <div className="mt-3 border-t border-neutral-100 pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Project details</p>
            <div className="space-y-1.5 text-[12px] text-neutral-600">
              <div className="flex justify-between gap-2">
                <span className="text-neutral-400">Status</span>
                <span className="font-medium text-neutral-900">{formatStatus(project.status)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-400">Accepted</span>
                <span className="font-medium text-neutral-900">{formatDate(project.accepted_at)}</span>
              </div>
              {project.quotes?.organisations?.name && (
                <div className="flex justify-between gap-2">
                  <span className="text-neutral-400">Org</span>
                  <span className="font-medium text-neutral-900 text-right leading-tight">{project.quotes.organisations.name}</span>
                </div>
              )}
              {project.quotes?.contacts?.full_name && (
                <div className="flex justify-between gap-2">
                  <span className="text-neutral-400">Contact</span>
                  <span className="font-medium text-neutral-900 text-right leading-tight">{project.quotes.contacts.full_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quote financial totals */}
          <div className="mt-3 border-t border-neutral-100 pt-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Quote totals</p>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50/70 px-2.5 py-1">
              {[
                { label: "Planned hrs", value: String(projectPlannedHours) },
                { label: "Subtotal (ex GST)", value: formatMoney(totalBudgetExGst) },
                { label: "GST (10%)", value: formatMoney(gstAmount) },
                { label: "Total (inc GST)", value: formatMoney(totalIncGst), bold: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0">
                  <span className="text-[11px] text-neutral-500">{row.label}</span>
                  <span className={row.bold ? "text-[11px] font-semibold text-neutral-900" : "text-[11px] font-medium text-neutral-900"}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hours progress */}
          <div className="mt-3 border-t border-neutral-100 pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Hours progress</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>{projectLoggedHours}h used</span>
                <span>{projectPlannedHours}h planned</span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-neutral-100">
                <div
                  className={`absolute left-0 top-0 h-2 rounded-full transition-all ${projectLoggedHours > projectPlannedHours ? "bg-rose-500" : "bg-accent-500"}`}
                  style={{ width: `${projectProgress}%` }}
                />
              </div>
              <p className={`text-right text-[11px] font-semibold ${projectLoggedHours > projectPlannedHours ? "text-rose-600" : "text-neutral-700"}`}>
                {projectProgress}%
              </p>
            </div>
          </div>

        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-[#f7f8fa] p-6 flex flex-col gap-3">
        <div className="w-full max-w-[1500px] self-stretch flex flex-col items-stretch gap-3">

          {/* Section header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">Project Section</p>
              <h2 className="text-[18px] font-semibold text-neutral-900">
                {projectSections.find((s) => s.key === activeSection)?.label}
              </h2>
              <p className="text-[13px] text-neutral-500 mt-0.5">
                {project.name ?? project.quotes?.title ?? "Project"} · {project.quotes?.organisations?.name ?? ""}
              </p>
            </div>
            {activeSection === "time" && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="neutral" size="sm" onClick={() => setShowTimesheetModal(true)}>View Timesheet</Button>
                <Button variant="primary" size="sm" onClick={() => { setLogModalError(null); setShowLogModal(true); }}>
                  Add time entry
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">{error}</div>
          )}

          {/* ── Deliverables tab ──────────────────────────────────────────────── */}
          {activeSection === "deliverables" && (
            <div className="rounded-xl border border-neutral-200 bg-white overflow-x-auto">
              {/* Filter bar */}
              <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center gap-3">
                <div className="relative">
                  <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input
                    className="h-7 w-52 rounded-lg border border-neutral-200 bg-white pl-8 pr-3 text-[12px] placeholder:text-neutral-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                    placeholder="Search deliverables..."
                    value={dvSearch}
                    onChange={(e) => setDvSearch(e.target.value)}
                  />
                </div>
                {dvSearch && (
                  <>
                    <button type="button" onClick={() => setDvSearch('')} className="text-[12px] text-neutral-400 hover:text-neutral-700 transition-colors">Clear</button>
                    <span className="text-[12px] text-neutral-400">{sortedFilteredDeliverables.length} result{sortedFilteredDeliverables.length !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3"><SortBtn label="Deliverable" active={dvSort.col === 'title'} dir={dvSort.dir} onClick={() => toggleDvSort('title')} /></th>
                    <th className="px-4 py-3"><div className="flex justify-end"><SortBtn label="Budget" active={dvSort.col === 'budget'} dir={dvSort.dir} onClick={() => toggleDvSort('budget')} /></div></th>
                    <th className="px-4 py-3"><div className="flex justify-end"><SortBtn label="Planned hrs" active={dvSort.col === 'planned'} dir={dvSort.dir} onClick={() => toggleDvSort('planned')} /></div></th>
                    <th className="px-4 py-3"><div className="flex justify-end"><SortBtn label="Used hrs" active={dvSort.col === 'used'} dir={dvSort.dir} onClick={() => toggleDvSort('used')} /></div></th>
                    <th className="px-4 py-3"><SortBtn label="Progress" active={dvSort.col === 'progress'} dir={dvSort.dir} onClick={() => toggleDvSort('progress')} /></th>
                    <th className="px-4 py-3"><div className="flex justify-center"><SortBtn label="Milestones" active={dvSort.col === 'milestones'} dir={dvSort.dir} onClick={() => toggleDvSort('milestones')} /></div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {deliverables.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">No deliverables on this project.</td>
                    </tr>
                  )}
                  {deliverables.length > 0 && sortedFilteredDeliverables.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">No deliverables match &ldquo;{dvSearch}&rdquo;.</td>
                    </tr>
                  )}
                  {sortedFilteredDeliverables.map((d) => {
                    const dvMs = milestonesByDeliverable[d.id] ?? [];
                    const dvPlanned = d.planned_hours ?? 0;
                    const dvLogged = dvMs.reduce((s, m) => s + (milestoneHours[m.id] ?? 0), 0);
                    const dvProgress = dvPlanned > 0 ? Math.min(100, Math.round((dvLogged / dvPlanned) * 100)) : 0;
                    const dvOver = dvPlanned > 0 && dvLogged > dvPlanned;
                    return (
                      <tr key={d.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-4 py-3 max-w-[280px]">
                          <p className="font-medium text-neutral-900 leading-snug">{d.title ?? "-"}</p>
                          {d.description && <p className="text-neutral-500 mt-0.5">{d.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-neutral-700 text-right">{formatMoney(d.budget_ex_gst)}</td>
                        <td className="px-4 py-3 text-neutral-600 text-right">{dvPlanned}</td>
                        <td className={`px-4 py-3 text-right font-medium ${dvOver ? "text-rose-700" : "text-neutral-700"}`}>{dvLogged}</td>
                        <td className="px-4 py-3 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1 h-2 rounded-full bg-neutral-100">
                              <div
                                className={`absolute left-0 top-0 h-2 rounded-full ${dvOver ? "bg-rose-500" : "bg-accent-500"}`}
                                style={{ width: `${dvProgress}%` }}
                              />
                            </div>
                            <span className={`font-medium w-8 text-right ${dvOver ? "text-rose-700" : "text-neutral-600"}`}>{dvProgress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMilestoneId(null);
                              setMilestonesModal({ open: true, deliverableId: d.id });
                            }}
                            className="whitespace-nowrap font-medium text-accent-500 hover:underline"
                          >
                            {dvMs.length} milestone{dvMs.length === 1 ? "" : "s"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {deliverables.length > 0 && (
                    <tr className="bg-neutral-50 border-t border-neutral-200">
                      <td className="px-4 py-3 font-semibold text-neutral-700">Project total</td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-700">{formatMoney(totalBudgetExGst)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-700">{projectPlannedHours}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${projectLoggedHours > projectPlannedHours ? "text-rose-700" : "text-neutral-700"}`}>{projectLoggedHours}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 h-2 rounded-full bg-neutral-100">
                            <div
                              className={`absolute left-0 top-0 h-2 rounded-full ${projectLoggedHours > projectPlannedHours ? "bg-rose-500" : "bg-accent-500"}`}
                              style={{ width: `${projectProgress}%` }}
                            />
                          </div>
                          <span className={`font-semibold w-8 text-right ${projectLoggedHours > projectPlannedHours ? "text-rose-700" : "text-neutral-700"}`}>{projectProgress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Time log tab ──────────────────────────────────────────────────── */}
          {activeSection === "time" && (
            <>
              <div className="rounded-xl border border-neutral-200 bg-white overflow-x-auto">
                {/* Filter bar */}
                <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <input
                      className="h-7 w-52 rounded-lg border border-neutral-200 bg-white pl-8 pr-3 text-[12px] placeholder:text-neutral-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                      placeholder="Search entries..."
                      value={tlSearch}
                      onChange={(e) => setTlSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="h-7 rounded-lg border border-neutral-200 bg-white px-2.5 text-[12px] text-neutral-600 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                    value={tlDeliverableFilter}
                    onChange={(e) => setTlDeliverableFilter(e.target.value)}
                  >
                    <option value="">All deliverables</option>
                    {deliverables.map(d => (
                      <option key={d.id} value={d.id}>{d.title ?? d.id}</option>
                    ))}
                  </select>
                  {(tlSearch || tlDeliverableFilter) && (
                    <>
                      <button type="button" onClick={() => { setTlSearch(''); setTlDeliverableFilter(''); }} className="text-[12px] text-neutral-400 hover:text-neutral-700 transition-colors">Clear</button>
                      <span className="text-[12px] text-neutral-400">{sortedFilteredTimeEntries.length} result{sortedFilteredTimeEntries.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-4 py-3"><SortBtn label="Date" active={tlSort.col === 'date'} dir={tlSort.dir} onClick={() => toggleTlSort('date')} /></th>
                      <th className="px-4 py-3"><SortBtn label="Deliverable" active={tlSort.col === 'deliverable'} dir={tlSort.dir} onClick={() => toggleTlSort('deliverable')} /></th>
                      <th className="px-4 py-3"><div className="flex justify-end"><SortBtn label="Hours" active={tlSort.col === 'hours'} dir={tlSort.dir} onClick={() => toggleTlSort('hours')} /></div></th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Note</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {timeEntries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">No time entries yet. Use &quot;Add time entry&quot; to get started.</td>
                      </tr>
                    )}
                    {timeEntries.length > 0 && sortedFilteredTimeEntries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">No entries match the current filters.</td>
                      </tr>
                    )}
                    {paginatedTimeEntries.map((entry) => {
                      const ms = milestoneById[entry.project_milestone_id];
                      const dv = ms ? deliverableById[ms.project_deliverable_id] : undefined;
                      const dvId = dv?.id ?? "";
                      return (
                        <tr key={entry.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">{formatDate(entry.entry_date)}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-neutral-900 leading-snug">{dv?.title ?? "-"}</p>
                            {ms?.title && <p className="text-neutral-500 mt-0.5">{ms.title}</p>}
                          </td>
                          <td className="px-4 py-3 text-neutral-700 text-right font-medium whitespace-nowrap">{entry.hours}</td>
                          <td className="px-4 py-3 text-neutral-500 w-[35%] max-w-[400px]">{entry.note ?? "-"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="neutral" size="sm" onClick={() => {
                                setEditModalError(null); setEditEntryId(entry.id);
                                setEditForm({ deliverableId: dvId, milestoneId: entry.project_milestone_id, hours: String(entry.hours ?? ""), note: entry.note ?? "", entryDate: entry.entry_date ?? getTodayIsoDate() });
                                setEditOverHoursWarning({ show: false, planned: 0, remaining: 0, requested: 0, overBy: 0 });
                                setAllowOverHoursEdit(false); setShowEditModal(true);
                              }}>Edit</Button>
                              <Button variant="danger" size="sm" onClick={() => setDeleteEntryModal({ open: true, entryId: entry.id, isDeleting: false })}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-[12px] text-neutral-500">
                <span>
                  {sortedFilteredTimeEntries.length === 0
                    ? (timeEntries.length === 0 ? "No time entries" : "No entries match the current filters")
                    : `Showing ${(currentTimeLogPage - 1) * TIME_ENTRIES_PER_PAGE + 1}–${Math.min(currentTimeLogPage * TIME_ENTRIES_PER_PAGE, sortedFilteredTimeEntries.length)} of ${sortedFilteredTimeEntries.length}${sortedFilteredTimeEntries.length < timeEntries.length ? ` (filtered from ${timeEntries.length})` : ''} entries`}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="neutral" size="sm" iconOnly
                    onClick={() => setTimeLogPage((p) => Math.max(1, p - 1))} disabled={currentTimeLogPage === 1}>
                    <IconChevronLeft size={14} />
                  </Button>
                  <span className="px-3 py-1 text-neutral-700">{currentTimeLogPage} / {totalTimeLogPages}</span>
                  <Button variant="neutral" size="sm" iconOnly
                    onClick={() => setTimeLogPage((p) => Math.min(totalTimeLogPages, p + 1))} disabled={currentTimeLogPage === totalTimeLogPages}>
                    <IconChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ── Milestones modal ──────────────────────────────────────────────────── */}
      <Modal
        open={milestonesModal.open}
        onClose={() => { setMilestonesModal({ open: false, deliverableId: null }); setEditingMilestoneId(null); }}
        title="Milestones"
        subtitle={milestonesDeliverable?.title ?? "Deliverable milestones"}
        size="lg"
        className="md:max-w-[1176px]"
        footer={
          <Button
            variant="neutral"
            size="sm"
            onClick={() => { setMilestonesModal({ open: false, deliverableId: null }); setEditingMilestoneId(null); }}
          >
            Close
          </Button>
        }
      >
        {/* Summary bar */}
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-neutral-900">{formatMoney(milestonesDeliverable?.budget_ex_gst)}</p>
              <p className="mt-0.5 text-[12px] text-neutral-500">
                {milestonesDeliverable?.planned_hours ?? 0} planned hrs · {
                  (() => {
                    const dvMs = milestonesModal.deliverableId ? (milestonesByDeliverable[milestonesModal.deliverableId] ?? []) : [];
                    return dvMs.reduce((s, m) => s + (milestoneHours[m.id] ?? 0), 0);
                  })()
                } used
              </p>
            </div>
            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[12px] font-medium text-neutral-600">
              {modalMilestones.length} milestone{modalMilestones.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {modalMilestones.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 bg-white px-4 py-8 text-center">
            <p className="text-[13px] font-medium text-neutral-800">No milestones on this deliverable.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Milestone</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Description</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Planned hrs</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Used hrs</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Est. completion</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {modalMilestones.map((m) => {
                  const mPlanned = m.planned_hours ?? 0;
                  const mLogged = milestoneHours[m.id] ?? 0;
                  const mProgress = mPlanned > 0 ? Math.min(100, Math.round((mLogged / mPlanned) * 100)) : 0;
                  const mOver = mPlanned > 0 && mLogged > mPlanned;
                  return (
                    <tr key={m.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-neutral-900">{m.title ?? "-"}</td>
                      <td className="px-4 py-3 text-neutral-600 max-w-[180px]">{m.description ?? "-"}</td>
                      <td className="px-4 py-3 text-neutral-600 text-right">{mPlanned}</td>
                      <td className={`px-4 py-3 text-right font-medium ${mOver ? "text-rose-700" : "text-neutral-700"}`}>{mLogged}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {editingMilestoneId === m.id ? (
                            <input
                              type="date"
                              className="rounded-md border border-neutral-200 px-2 py-1 text-[12px] focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
                              value={milestoneDateDrafts[m.id] ?? ""}
                              onChange={(e) => setMilestoneDateDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            />
                          ) : (
                            <span className="text-neutral-600">{formatDate(m.estimated_completion_date)}</span>
                          )}
                          <Button
                            variant="neutral" size="sm"
                            onClick={() => {
                              if (editingMilestoneId === m.id) { saveMilestoneEstimatedDate(m.id); return; }
                              setEditingMilestoneId(m.id);
                              setMilestoneDateDrafts((prev) => ({ ...prev, [m.id]: m.estimated_completion_date ?? "" }));
                            }}
                            loading={isSavingMilestoneDate[m.id]}
                            loadingText="Saving..."
                          >
                            {editingMilestoneId === m.id ? "Save" : "Edit"}
                          </Button>
                          {editingMilestoneId === m.id && (
                            <Button variant="neutral" size="sm" onClick={() => setEditingMilestoneId(null)}>Cancel</Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 h-2 rounded-full bg-neutral-100">
                            <div
                              className={`absolute left-0 top-0 h-2 rounded-full ${mOver ? "bg-rose-500" : "bg-accent-500"}`}
                              style={{ width: `${mProgress}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-medium w-8 text-right ${mOver ? "text-rose-700" : "text-neutral-600"}`}>{mProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* ── Send access email modal ───────────────────────────────────────────── */}
      <Modal
        open={emailModal.open}
        onClose={() => { setEmailModal({ open: false, email: "", cc: "" }); setEmailStatus("idle"); setEmailError(null); }}
        title="Send project access email"
        subtitle="Send the client access code to the recipient below."
        footer={
          <>
            <Button variant="neutral" onClick={() => { setEmailModal({ open: false, email: "", cc: "" }); setEmailStatus("idle"); setEmailError(null); }}>Close</Button>
            <Button variant="primary" onClick={sendAccessEmail} loading={emailStatus === "sending"} loadingText="Sending...">Send email</Button>
          </>
        }
      >
        <div className="space-y-4">
          {project.latest_access_code && (
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
              <p className="text-[12px] font-medium text-neutral-500 uppercase tracking-wider mb-1">Access code</p>
              <p className="text-[15px] font-semibold text-neutral-900">{project.latest_access_code}</p>
            </div>
          )}
          <Input label="Recipient email" type="email" value={emailModal.email} placeholder="client@example.com"
            onChange={(e) => setEmailModal((prev) => ({ ...prev, email: e.target.value }))} />
          <Input label="CC" type="text" value={emailModal.cc} placeholder="manager@example.com, ops@example.com"
            onChange={(e) => setEmailModal((prev) => ({ ...prev, cc: e.target.value }))} />
          {emailError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{emailError}</div>}
          {emailStatus === "sent" && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">Email sent successfully.</div>}
        </div>
      </Modal>

      {/* ── Log time modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={showLogModal}
        onClose={() => { setLogModalError(null); setShowLogModal(false); }}
        title="Log time entry"
        subtitle="Add a time entry against a milestone."
        footer={
          <>
            <Button variant="neutral" onClick={() => { setLogModalError(null); setShowLogModal(false); }}>Cancel</Button>
            {overHoursWarning.show && !allowOverHours ? (
              <Button variant="danger" onClick={() => { setAllowOverHours(true); setOverHoursWarning((prev) => ({ ...prev, show: false })); }}>
                Confirm over hours
              </Button>
            ) : (
              <Button variant="primary" onClick={handleLogSubmit} loading={!!isSaving.modal} loadingText="Saving...">Save entry</Button>
            )}
          </>
        }
      >
        {renderTimeForm(logForm, setLogForm, setLogModalError, selectedLogMilestoneRemaining, overHoursWarning, logModalError)}
      </Modal>

      {/* ── Edit time modal ────────────────────────────────────────────────────── */}
      <Modal
        open={showEditModal}
        onClose={() => { setEditModalError(null); setShowEditModal(false); }}
        title="Edit time entry"
        subtitle="Update hours, date, or milestone."
        footer={
          <>
            <Button variant="neutral" onClick={() => { setEditModalError(null); setShowEditModal(false); }}>Cancel</Button>
            {editOverHoursWarning.show && !allowOverHoursEdit ? (
              <Button variant="danger" onClick={() => { setAllowOverHoursEdit(true); setEditOverHoursWarning((prev) => ({ ...prev, show: false })); }}>
                Confirm over hours
              </Button>
            ) : (
              <Button variant="primary" onClick={handleEditSubmit} loading={!!isSaving.edit} loadingText="Saving...">Save changes</Button>
            )}
          </>
        }
      >
        {renderTimeForm(editForm, setEditForm, setEditModalError, null, editOverHoursWarning, editModalError)}
      </Modal>

      {/* ── Delete time entry modal ────────────────────────────────────────────── */}
      <ConfirmModal
        open={deleteEntryModal.open}
        onClose={() => setDeleteEntryModal({ open: false, entryId: null, isDeleting: false })}
        title="Delete this time entry?"
        description="This entry will be permanently removed from the project time log. This cannot be undone."
        variant="danger"
        confirmLabel="Delete entry"
        cancelLabel="Cancel"
        onConfirm={() => void confirmDeleteEntry()}
        loading={deleteEntryModal.isDeleting}
      />

      {/* ── Timesheet modal ────────────────────────────────────────────────────── */}
      <Modal
        open={showTimesheetModal}
        onClose={() => setShowTimesheetModal(false)}
        title="Timesheet"
        subtitle="Review hours logged by deliverable and milestone for the selected month."
        size="lg"
        footer={<Button variant="neutral" onClick={() => setShowTimesheetModal(false)}>Close</Button>}
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <FormSelect label="Month" value={String(timesheetMonth)} onChange={(v) => setTimesheetMonth(Number(v))}>
              {MONTH_OPTIONS.map((label, i) => <option key={label} value={i}>{label}</option>)}
            </FormSelect>
            <FormSelect label="Year" value={String(timesheetYear)} onChange={(v) => setTimesheetYear(Number(v))}>
              {timesheetYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </FormSelect>
          </div>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Deliverable / Milestone</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Total hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {timesheetDeliverables.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-[13px] text-neutral-400">
                      No hours logged for {MONTH_OPTIONS[timesheetMonth]} {timesheetYear}.
                    </td>
                  </tr>
                ) : (
                  <>
                    {timesheetDeliverables.map((d) => {
                      const isOpen = openTimesheetDeliverableId === d.deliverableId;
                      return (
                        <Fragment key={d.deliverableId}>
                          <tr className="bg-neutral-50/70">
                            <td className="px-4 py-3 font-semibold text-neutral-900">
                              <button type="button" className="inline-flex items-center gap-2 text-left"
                                onClick={() => setOpenTimesheetDeliverableId((prev) => prev === d.deliverableId ? null : d.deliverableId)}>
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-neutral-300 bg-white text-[11px] font-semibold text-neutral-600">
                                  {isOpen ? "−" : "+"}
                                </span>
                                {d.deliverableName}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-semibold text-neutral-900 text-right">{d.totalHours}</td>
                          </tr>
                          {isOpen && d.milestones.map((m) => (
                            <tr key={m.key} className="bg-white">
                              <td className="px-4 py-3 pl-14 text-neutral-700">{m.milestoneName}</td>
                              <td className="px-4 py-3 text-neutral-700 text-right">{m.hours}</td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                    <tr className="border-t border-neutral-200 bg-neutral-50">
                      <td className="px-4 py-3 font-semibold text-neutral-900">Total</td>
                      <td className="px-4 py-3 font-semibold text-neutral-900 text-right">{timesheetTotalHours}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

    </div>
  );
}
