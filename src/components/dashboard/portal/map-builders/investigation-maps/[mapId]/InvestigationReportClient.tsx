"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { supabaseBrowser } from "@/lib/supabase/client";
import { parsePersonLabels, type CanvasElementRow, type SystemMap } from "@/app/system-maps/[mapId]/canvasShared";
import {
  IconChevronLeft,
  IconChevronRight,
  IconArrowLeft,
  IconExternalLink,
} from "@tabler/icons-react";

type InvestigationReportClientProps = { mapId: string };
type TabKey = "scope" | "sequence" | "people" | "factors" | "taskCondition" | "controlBarrier" | "evidence" | "finding" | "recommendation";
type SortDirection = "asc" | "desc";
type SortState = { field: string; direction: SortDirection };

type PersonCard = { id: string; title: string; subtitle: string; initials: string };
type SequenceRow = { id: string; step: string; description: string; timestamp: string; location: string };
type FactorRow = { id: string; type: string; title: string; description: string; presence: string; classification: string; category: string };
type TaskConditionRow = { id: string; title: string; description: string; state: string; context: string };
type BarrierRow = { id: string; title: string; description: string; barrierState: string; barrierRole: string; controlType: string; owner: string };
type EvidenceRow = { id: string; title: string; description: string; evidenceType: string; source: string; attachment: string };
type FindingRow = { id: string; title: string; description: string; confidence: string };
type RecommendationRow = { id: string; title: string; description: string; actionType: string; owner: string; dueDate: string };
type ScopeFormData = {
  investigationName: string;
  owner: string;
  created: string;
  incidentDateTime: string;
  incidentLocation: string;
  responsiblePersonName: string;
  investigationLeadName: string;
  itemsOfInterest: string;
  incidentLongDescription: string;
};

const PAGE_SIZE = 7;

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "scope", label: "Scope" },
  { key: "sequence", label: "Sequence" },
  { key: "people", label: "People" },
  { key: "factors", label: "Factors" },
  { key: "taskCondition", label: "Task/Condition" },
  { key: "controlBarrier", label: "Control/ Barrier" },
  { key: "evidence", label: "Evidence" },
  { key: "finding", label: "Finding" },
  { key: "recommendation", label: "Recommendation" },
];

const initialSorts: Record<TabKey, SortState> = {
  scope: { field: "createdAt", direction: "asc" },
  sequence: { field: "timestamp", direction: "asc" },
  people: { field: "title", direction: "asc" },
  factors: { field: "classification", direction: "asc" },
  taskCondition: { field: "state", direction: "asc" },
  controlBarrier: { field: "barrierState", direction: "asc" },
  evidence: { field: "evidenceType", direction: "asc" },
  finding: { field: "confidence", direction: "desc" },
  recommendation: { field: "dueDate", direction: "asc" },
};

const initialPages: Record<TabKey, number> = {
  scope: 1,
  sequence: 1,
  people: 1,
  factors: 1,
  taskCondition: 1,
  controlBarrier: 1,
  evidence: 1,
  finding: 1,
  recommendation: 1,
};

const getText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatDateOnly = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
};

const getInitials = (value: string) => {
  const parts = value.split(/\s+/).filter(Boolean);
  if (!parts.length) return "P";
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
};

function sortRows<T extends Record<string, string>>(rows: T[], sort: SortState) {
  return [...rows].sort((a, b) => {
    const left = a[sort.field] ?? "";
    const right = b[sort.field] ?? "";
    const leftDate = Date.parse(left);
    const rightDate = Date.parse(right);
    const base =
      !Number.isNaN(leftDate) && !Number.isNaN(rightDate)
        ? leftDate - rightDate
        : String(left).localeCompare(String(right), undefined, { sensitivity: "base" });
    return sort.direction === "asc" ? base : -base;
  });
}

function paginate<T>(rows: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  return { rows: rows.slice(startIndex, startIndex + PAGE_SIZE), page: safePage, totalPages, startIndex };
}

function SortHeader({ label, active, direction, onClick }: { label: string; active: boolean; direction: SortDirection; onClick: () => void }) {
  return (
    <button type="button" className="inline-flex items-center gap-1 font-medium text-neutral-500 hover:text-neutral-700 transition-colors" onClick={onClick}>
      <span>{label}</span>
      <span className="text-[10px] text-neutral-400">{active ? (direction === "asc" ? "↑" : "↓") : "↕"}</span>
    </button>
  );
}

const TONE_CLASS: Record<"Green" | "Red" | "Amber" | "Slate" | "Neutral", string> = {
  Green: "bg-[#2d9692]/10 text-[#2d9692] border border-[#2d9692]/20",
  Red: "bg-red-50 text-red-600 border border-red-200",
  Amber: "bg-amber-50 text-amber-700 border border-amber-200",
  Slate: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  Neutral: "bg-neutral-100 text-neutral-500 border border-neutral-200",
};

function TonePill({ children, tone }: { children: ReactNode; tone: "Green" | "Red" | "Amber" | "Slate" | "Neutral" }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${TONE_CLASS[tone]}`}>{children}</span>;
}

function ScopeField({
  label,
  value,
  isEditing,
  multiline = false,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  isEditing: boolean;
  multiline?: boolean;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-4 ${className}`.trim()}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">{label}</span>
      {isEditing ? (
        multiline ? (
          <textarea className="w-full text-[13px] text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#2d9692]/20 focus:border-[#2d9692] resize-none" value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
        ) : (
          <input className="w-full text-[13px] text-neutral-900 border border-neutral-200 rounded-md px-3 h-8 outline-none focus:ring-2 focus:ring-[#2d9692]/20 focus:border-[#2d9692]" value={value} onChange={(event) => onChange(event.target.value)} />
        )
      ) : (
        <strong className="text-[14px] text-neutral-900 font-medium">{value || "-"}</strong>
      )}
    </div>
  );
}

export default function InvestigationReportClient({ mapId }: InvestigationReportClientProps) {
  const [map, setMap] = useState<SystemMap | null>(null);
  const [elements, setElements] = useState<CanvasElementRow[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("scope");
  const [sorts, setSorts] = useState<Record<TabKey, SortState>>(initialSorts);
  const [pages, setPages] = useState<Record<TabKey, number>>(initialPages);
  const [isEditingScope, setIsEditingScope] = useState(false);
  const [scopeDraft, setScopeDraft] = useState<ScopeFormData | null>(null);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/map-builders/investigation-maps/${mapId}`)}`);
          return;
        }
        setCurrentUserEmail(user.email ?? localStorage.getItem("hses_user_email") ?? "");

        const [memberRes, mapRes, elementRes] = await Promise.all([
          supabaseBrowser.schema("ms").from("map_members").select("role").eq("map_id", mapId).eq("user_id", user.id).maybeSingle(),
          supabaseBrowser.schema("ms").from("system_maps").select("id,title,description,owner_id,map_code,map_category,updated_at,created_at").eq("id", mapId).eq("map_category", "incident_investigation").maybeSingle(),
          supabaseBrowser.schema("ms").from("canvas_elements").select("id,map_id,element_type,heading,color_hex,created_by_user_id,element_config,pos_x,pos_y,width,height,created_at,updated_at").eq("map_id", mapId).order("created_at", { ascending: true }),
        ]);

        if (memberRes.error || !memberRes.data?.role) {
          setError("Unable to load this investigation. You may not have access.");
          return;
        }
        if (mapRes.error || !mapRes.data) {
          setError("Unable to load this investigation.");
          return;
        }
        if (elementRes.error) {
          setError(elementRes.error.message || "Unable to load investigation elements.");
          return;
        }

        setMap(mapRes.data as SystemMap);
        setElements((elementRes.data ?? []) as CanvasElementRow[]);
      } catch {
        setError("Unable to load this investigation.");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [mapId]);

  const ownerLabel = useMemo(() => {
    if (!map) return "-";
    if (map.owner_id && map.owner_id === localStorage.getItem("hses_user_id")) return currentUserEmail || "You";
    return currentUserEmail || map.owner_id || "-";
  }, [currentUserEmail, map]);

  const peopleRows = useMemo<PersonCard[]>(() => {
    return elements.filter((item) => item.element_type === "person").map((item) => {
      const labels = parsePersonLabels(item.heading);
      const title = labels.role || "Person";
      const subtitle = labels.department || "Team";
      return { id: item.id, title, subtitle, initials: getInitials(title) };
    });
  }, [elements]);

  const sequenceRows = useMemo<SequenceRow[]>(() => {
    return elements.filter((item) => item.element_type === "incident_sequence_step").map((item) => {
      const cfg = (item.element_config as Record<string, unknown> | null) ?? {};
      return {
        id: item.id,
        step: item.heading || "Sequence Step",
        description: getText(cfg.description) || "-",
        timestamp: getText(cfg.timestamp) || item.created_at,
        location: getText(cfg.location) || "-",
      };
    });
  }, [elements]);

  const factorRows = useMemo<FactorRow[]>(() => {
    return elements.filter((item) => item.element_type === "incident_factor" || item.element_type === "incident_system_factor").map((item) => {
      const cfg = (item.element_config as Record<string, unknown> | null) ?? {};
      const isSystem = item.element_type === "incident_system_factor";
      return {
        id: item.id,
        type: isSystem ? "System Factor" : "Factor",
        title: item.heading || (isSystem ? "System Factor" : "Factor"),
        description: getText(cfg.description) || "-",
        presence: isSystem ? "Present" : getText(cfg.factor_presence) || "Present",
        classification: isSystem ? getText(cfg.cause_level) || "-" : getText(cfg.factor_classification) || "-",
        category: isSystem ? getText(cfg.category) || "-" : getText(cfg.influence_type) || "-",
      };
    });
  }, [elements]);

  const taskConditionRows = useMemo<TaskConditionRow[]>(() => {
    return elements.filter((item) => item.element_type === "incident_task_condition").map((item) => {
      const cfg = (item.element_config as Record<string, unknown> | null) ?? {};
      return {
        id: item.id,
        title: item.heading || "Task / Condition",
        description: getText(cfg.description) || "-",
        state: getText(cfg.state) || "-",
        context: getText(cfg.environmental_context) || "-",
      };
    });
  }, [elements]);

  const barrierRows = useMemo<BarrierRow[]>(() => {
    return elements.filter((item) => item.element_type === "incident_control_barrier").map((item) => {
      const cfg = (item.element_config as Record<string, unknown> | null) ?? {};
      return {
        id: item.id,
        title: item.heading || "Control / Barrier",
        description: getText(cfg.description) || "-",
        barrierState: getText(cfg.barrier_state) || "-",
        barrierRole: getText(cfg.barrier_role) || "-",
        controlType: getText(cfg.control_type) || "-",
        owner: getText(cfg.owner_text) || "-",
      };
    });
  }, [elements]);

  const evidenceRows = useMemo<EvidenceRow[]>(() => {
    return elements.filter((item) => item.element_type === "incident_evidence").map((item) => {
      const cfg = (item.element_config as Record<string, unknown> | null) ?? {};
      return {
        id: item.id,
        title: item.heading || "Evidence",
        description: getText(cfg.description) || "-",
        evidenceType: getText(cfg.evidence_type) || "-",
        source: getText(cfg.source) || "-",
        attachment: getText(cfg.media_name) || "-",
      };
    });
  }, [elements]);

  const findingRows = useMemo<FindingRow[]>(() => {
    return elements.filter((item) => item.element_type === "incident_finding").map((item) => {
      const cfg = (item.element_config as Record<string, unknown> | null) ?? {};
      return {
        id: item.id,
        title: item.heading || "Finding",
        description: getText(cfg.description) || "-",
        confidence: getText(cfg.confidence_level) || "-",
      };
    });
  }, [elements]);

  const recommendationRows = useMemo<RecommendationRow[]>(() => {
    return elements.filter((item) => item.element_type === "incident_recommendation").map((item) => {
      const cfg = (item.element_config as Record<string, unknown> | null) ?? {};
      return {
        id: item.id,
        title: item.heading || "Recommendation",
        description: getText(cfg.description) || "-",
        actionType: getText(cfg.action_type) || "-",
        owner: getText(cfg.owner_text) || "-",
        dueDate: getText(cfg.due_date) || "",
      };
    });
  }, [elements]);

  const scopeData = useMemo<ScopeFormData>(() => {
    const firstSequence = sortRows(sequenceRows, { field: "timestamp", direction: "asc" })[0];
    return {
      investigationName: map?.title || "-",
      owner: ownerLabel,
      created: formatDateTime(map?.created_at),
      incidentDateTime: firstSequence ? formatDateTime(firstSequence.timestamp) : "-",
      incidentLocation: firstSequence?.location || "-",
      responsiblePersonName: peopleRows[0]?.title || "-",
      investigationLeadName: peopleRows[1]?.title || "-",
      itemsOfInterest: evidenceRows.length ? evidenceRows.map((row) => row.title).join(", ") : "-",
      incidentLongDescription: map?.description?.trim() || "-",
    };
  }, [evidenceRows, map, ownerLabel, peopleRows, sequenceRows]);

  useEffect(() => {
    const storageKey = `hses_investigation_scope_${mapId}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      setScopeDraft(scopeData);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<ScopeFormData>;
      setScopeDraft({
        ...scopeData,
        ...parsed,
      });
    } catch {
      setScopeDraft(scopeData);
    }
  }, [mapId, scopeData]);

  const applySort = (tab: TabKey, field: string) => {
    setSorts((current) => {
      const previous = current[tab];
      return {
        ...current,
        [tab]: {
          field,
          direction: previous.field === field && previous.direction === "asc" ? "desc" : "asc",
        },
      };
    });
    setPages((current) => ({ ...current, [tab]: 1 }));
  };

  const pagedSequence = paginate(sortRows(sequenceRows, sorts.sequence), pages.sequence);
  const pagedFactors = paginate(sortRows(factorRows, sorts.factors), pages.factors);
  const pagedTaskConditions = paginate(sortRows(taskConditionRows, sorts.taskCondition), pages.taskCondition);
  const pagedBarriers = paginate(sortRows(barrierRows, sorts.controlBarrier), pages.controlBarrier);
  const pagedEvidence = paginate(sortRows(evidenceRows, sorts.evidence), pages.evidence);
  const pagedFindings = paginate(sortRows(findingRows, sorts.finding), pages.finding);
  const pagedRecommendations = paginate(sortRows(recommendationRows, sorts.recommendation), pages.recommendation);

  const updateScopeField = (field: keyof ScopeFormData, value: string) => {
    setScopeDraft((current) => ({
      ...(current ?? scopeData),
      [field]: value,
    }));
  };

  const handleSaveScope = () => {
    const next = scopeDraft ?? scopeData;
    localStorage.setItem(`hses_investigation_scope_${mapId}`, JSON.stringify(next));
    setScopeDraft(next);
    setIsEditingScope(false);
  };

  const handleCancelScopeEdit = () => {
    const raw = localStorage.getItem(`hses_investigation_scope_${mapId}`);
    if (!raw) {
      setScopeDraft(scopeData);
      setIsEditingScope(false);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<ScopeFormData>;
      setScopeDraft({
        ...scopeData,
        ...parsed,
      });
    } catch {
      setScopeDraft(scopeData);
    }
    setIsEditingScope(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100 bg-white flex-shrink-0">
          <div className="h-4 w-24 rounded bg-neutral-100 animate-pulse mb-2" />
          <div className="h-6 w-48 rounded bg-neutral-100 animate-pulse mb-1" />
          <div className="h-4 w-80 rounded bg-neutral-100 animate-pulse" />
        </div>
        <div className="border-b border-neutral-200 bg-white flex-shrink-0 px-6 py-2">
          <div className="flex gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-5 w-16 rounded bg-neutral-100 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6 bg-[#f7f8fa]">
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-4 w-[120px] rounded bg-neutral-100 animate-pulse" />
                  <div className="h-4 w-[180px] rounded bg-neutral-100 animate-pulse" />
                  <div className="h-4 flex-1 rounded bg-neutral-100 animate-pulse" />
                  <div className="h-4 w-[80px] rounded bg-neutral-100 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div className="flex items-center justify-center p-12 text-[13px] text-red-600">{error}</div>;
  if (!map) return <div className="flex items-center justify-center p-12 text-[13px] text-neutral-500">Investigation not found.</div>;

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-5 pb-4 border-b border-neutral-100 bg-white flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/dashboard/map-builders" className="inline-flex items-center gap-1 text-[12px] text-neutral-400 hover:text-neutral-600 transition-colors mb-2">
              <IconArrowLeft size={12} />Back to Map Builders
            </Link>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Investigation Tool</p>
            <h1 className="text-[20px] font-semibold text-neutral-900">{map.title}</h1>
            <p className="text-[13px] text-neutral-500 mt-[2px]">Review the investigation record before opening the incident map.</p>
          </div>
          <Link
            href={`/system-maps/${map.id}`}
            className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-md bg-[#2d9692] text-white text-[13px] font-medium px-4 h-9 hover:bg-[#267d78] transition-colors"
          >
            Open Incident Map
            <IconExternalLink size={14} />
          </Link>
        </div>
      </div>

      <div className="border-b border-neutral-200 bg-white flex-shrink-0 px-6">
        <div className="flex items-center overflow-x-auto -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-3 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "text-[#2d9692] border-[#2d9692]"
                  : "text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 bg-[#f7f8fa] flex flex-col gap-4">

      {activeTab === "scope" && scopeDraft ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <ScopeField label="Investigation Name" value={scopeDraft.investigationName} isEditing={isEditingScope} onChange={(value) => updateScopeField("investigationName", value)} className="md:col-span-2" />
            <ScopeField label="Owner" value={scopeDraft.owner} isEditing={isEditingScope} onChange={(value) => updateScopeField("owner", value)} className="md:col-span-2" />
            <ScopeField label="Created" value={scopeDraft.created} isEditing={isEditingScope} onChange={(value) => updateScopeField("created", value)} className="md:col-span-2" />
            <ScopeField label="Incident Date & Time" value={scopeDraft.incidentDateTime} isEditing={isEditingScope} onChange={(value) => updateScopeField("incidentDateTime", value)} className="md:col-span-3" />
            <ScopeField label="Incident Location" value={scopeDraft.incidentLocation} isEditing={isEditingScope} onChange={(value) => updateScopeField("incidentLocation", value)} className="md:col-span-3" />
            <ScopeField label="Responsible Person Name" value={scopeDraft.responsiblePersonName} isEditing={isEditingScope} onChange={(value) => updateScopeField("responsiblePersonName", value)} className="md:col-span-3" />
            <ScopeField label="Investigation Lead Name" value={scopeDraft.investigationLeadName} isEditing={isEditingScope} onChange={(value) => updateScopeField("investigationLeadName", value)} className="md:col-span-3" />
            <ScopeField label="Items of Interest" value={scopeDraft.itemsOfInterest} isEditing={isEditingScope} multiline onChange={(value) => updateScopeField("itemsOfInterest", value)} className="md:col-span-6" />
            <ScopeField label="Incident Long Description" value={scopeDraft.incidentLongDescription} isEditing={isEditingScope} multiline onChange={(value) => updateScopeField("incidentLongDescription", value)} className="md:col-span-6" />
          </div>
          <div className="flex items-center justify-end gap-2">
            {isEditingScope ? (
              <>
                <button type="button" className="h-8 px-3 rounded-md border border-neutral-200 bg-white text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors" onClick={handleCancelScopeEdit}>
                  Cancel
                </button>
                <button type="button" className="h-8 px-3 rounded-md bg-[#2d9692] text-white text-[13px] font-medium hover:bg-[#267d78] transition-colors" onClick={handleSaveScope}>
                  Save Scope
                </button>
              </>
            ) : (
              <button type="button" className="h-8 px-3 rounded-md border border-neutral-200 bg-white text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors" onClick={() => setIsEditingScope(true)}>
                Edit Scope
              </button>
            )}
          </div>
        </>
      ) : null}

      {activeTab === "people" ? (
        <div>
          {peopleRows.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {peopleRows.map((person) => (
                <article key={person.id} className="rounded-xl border border-neutral-200 bg-white p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-[#2d9692]/10 text-[#2d9692] flex items-center justify-center text-[13px] font-semibold mb-3">
                    {person.initials}
                  </div>
                  <h3 className="text-[14px] font-semibold text-neutral-900">{person.title}</h3>
                  <p className="text-[12px] text-neutral-500 mt-0.5">{person.subtitle}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
              <h3 className="text-[15px] font-semibold text-neutral-700 mb-1">No people have been added yet</h3>
              <p className="text-[13px] text-neutral-500">Add people on the incident map to capture roles, departments, and ownership for this investigation.</p>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "sequence" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-neutral-700">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="w-10 px-4 py-3 text-left font-medium text-neutral-500">No.</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Sequence Step</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="Timestamp" active={sorts.sequence.field === "timestamp"} direction={sorts.sequence.direction} onClick={() => applySort("sequence", "timestamp")} /></th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pagedSequence.rows.length ? pagedSequence.rows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-neutral-400">{pagedSequence.startIndex + index + 1}</td>
                      <td className="px-4 py-3">{row.step}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.description}</td>
                      <td className="px-4 py-3 text-neutral-600">{formatDateTime(row.timestamp)}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.location}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-[13px] text-neutral-400">No sequence items have been added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {sequenceRows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between text-[13px] text-neutral-500">
              <span>Showing {(pagedSequence.page - 1) * PAGE_SIZE + 1}–{Math.min(pagedSequence.page * PAGE_SIZE, sequenceRows.length)} of {sequenceRows.length} sequence items</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPages((c) => ({ ...c, sequence: Math.max(1, c.sequence - 1) }))} disabled={pagedSequence.page <= 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><IconChevronLeft size={14} /></button>
                <button type="button" onClick={() => setPages((c) => ({ ...c, sequence: Math.min(pagedSequence.totalPages, c.sequence + 1) }))} disabled={pagedSequence.page >= pagedSequence.totalPages} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page"><IconChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "factors" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-neutral-700">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="Presence" active={sorts.factors.field === "presence"} direction={sorts.factors.direction} onClick={() => applySort("factors", "presence")} /></th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="Classification" active={sorts.factors.field === "classification"} direction={sorts.factors.direction} onClick={() => applySort("factors", "classification")} /></th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="Category" active={sorts.factors.field === "category"} direction={sorts.factors.direction} onClick={() => applySort("factors", "category")} /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pagedFactors.rows.length ? pagedFactors.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">{row.type}</td>
                      <td className="px-4 py-3">{row.title}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.description}</td>
                      <td className="px-4 py-3"><TonePill tone="Green">{row.presence}</TonePill></td>
                      <td className="px-4 py-3"><TonePill tone={row.classification.toLowerCase().includes("essential") ? "Red" : "Amber"}>{row.classification}</TonePill></td>
                      <td className="px-4 py-3 text-neutral-600">{row.category}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-neutral-400">No factors have been added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {factorRows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between text-[13px] text-neutral-500">
              <span>Showing {(pagedFactors.page - 1) * PAGE_SIZE + 1}–{Math.min(pagedFactors.page * PAGE_SIZE, factorRows.length)} of {factorRows.length} factors</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPages((c) => ({ ...c, factors: Math.max(1, c.factors - 1) }))} disabled={pagedFactors.page <= 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><IconChevronLeft size={14} /></button>
                <button type="button" onClick={() => setPages((c) => ({ ...c, factors: Math.min(pagedFactors.totalPages, c.factors + 1) }))} disabled={pagedFactors.page >= pagedFactors.totalPages} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page"><IconChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "taskCondition" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-neutral-700">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Task/Condition</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="State" active={sorts.taskCondition.field === "state"} direction={sorts.taskCondition.direction} onClick={() => applySort("taskCondition", "state")} /></th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Environmental Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pagedTaskConditions.rows.length ? pagedTaskConditions.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">{row.title}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.description}</td>
                      <td className="px-4 py-3"><TonePill tone={row.state.toLowerCase() === "abnormal" ? "Red" : "Green"}>{row.state}</TonePill></td>
                      <td className="px-4 py-3 text-neutral-600">{row.context}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-4 py-12 text-center text-[13px] text-neutral-400">No task or condition items have been added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {taskConditionRows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between text-[13px] text-neutral-500">
              <span>Showing {(pagedTaskConditions.page - 1) * PAGE_SIZE + 1}–{Math.min(pagedTaskConditions.page * PAGE_SIZE, taskConditionRows.length)} of {taskConditionRows.length} task conditions</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPages((c) => ({ ...c, taskCondition: Math.max(1, c.taskCondition - 1) }))} disabled={pagedTaskConditions.page <= 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><IconChevronLeft size={14} /></button>
                <button type="button" onClick={() => setPages((c) => ({ ...c, taskCondition: Math.min(pagedTaskConditions.totalPages, c.taskCondition + 1) }))} disabled={pagedTaskConditions.page >= pagedTaskConditions.totalPages} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page"><IconChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "controlBarrier" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-neutral-700">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Control/Barrier</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="Barrier State" active={sorts.controlBarrier.field === "barrierState"} direction={sorts.controlBarrier.direction} onClick={() => applySort("controlBarrier", "barrierState")} /></th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="Barrier Role" active={sorts.controlBarrier.field === "barrierRole"} direction={sorts.controlBarrier.direction} onClick={() => applySort("controlBarrier", "barrierRole")} /></th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Control Type</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pagedBarriers.rows.length ? pagedBarriers.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">{row.title}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.description}</td>
                      <td className="px-4 py-3"><TonePill tone={row.barrierState.toLowerCase().includes("missing") ? "Red" : row.barrierState.toLowerCase().includes("ineffective") ? "Slate" : "Green"}>{row.barrierState}</TonePill></td>
                      <td className="px-4 py-3"><TonePill tone="Green">{row.barrierRole}</TonePill></td>
                      <td className="px-4 py-3 text-neutral-600">{row.controlType}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.owner}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-neutral-400">No controls or barriers have been added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {barrierRows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between text-[13px] text-neutral-500">
              <span>Showing {(pagedBarriers.page - 1) * PAGE_SIZE + 1}–{Math.min(pagedBarriers.page * PAGE_SIZE, barrierRows.length)} of {barrierRows.length} controls and barriers</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPages((c) => ({ ...c, controlBarrier: Math.max(1, c.controlBarrier - 1) }))} disabled={pagedBarriers.page <= 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><IconChevronLeft size={14} /></button>
                <button type="button" onClick={() => setPages((c) => ({ ...c, controlBarrier: Math.min(pagedBarriers.totalPages, c.controlBarrier + 1) }))} disabled={pagedBarriers.page >= pagedBarriers.totalPages} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page"><IconChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "evidence" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-neutral-700">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Evidence</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="Type" active={sorts.evidence.field === "evidenceType"} direction={sorts.evidence.direction} onClick={() => applySort("evidence", "evidenceType")} /></th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Source</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pagedEvidence.rows.length ? pagedEvidence.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">{row.title}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.description}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.evidenceType}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.source}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.attachment}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-[13px] text-neutral-400">No evidence items have been added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {evidenceRows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between text-[13px] text-neutral-500">
              <span>Showing {(pagedEvidence.page - 1) * PAGE_SIZE + 1}–{Math.min(pagedEvidence.page * PAGE_SIZE, evidenceRows.length)} of {evidenceRows.length} evidence items</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPages((c) => ({ ...c, evidence: Math.max(1, c.evidence - 1) }))} disabled={pagedEvidence.page <= 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><IconChevronLeft size={14} /></button>
                <button type="button" onClick={() => setPages((c) => ({ ...c, evidence: Math.min(pagedEvidence.totalPages, c.evidence + 1) }))} disabled={pagedEvidence.page >= pagedEvidence.totalPages} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page"><IconChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "finding" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-neutral-700">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="w-10 px-4 py-3 text-left font-medium text-neutral-500">No.</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Finding</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="Confidence Level" active={sorts.finding.field === "confidence"} direction={sorts.finding.direction} onClick={() => applySort("finding", "confidence")} /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pagedFindings.rows.length ? pagedFindings.rows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-neutral-400">{pagedFindings.startIndex + index + 1}</td>
                      <td className="px-4 py-3">{row.title}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.description}</td>
                      <td className="px-4 py-3"><TonePill tone={row.confidence.toLowerCase() === "high" ? "Green" : row.confidence.toLowerCase() === "medium" ? "Amber" : "Red"}>{row.confidence}</TonePill></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-4 py-12 text-center text-[13px] text-neutral-400">No findings have been added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {findingRows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between text-[13px] text-neutral-500">
              <span>Showing {(pagedFindings.page - 1) * PAGE_SIZE + 1}–{Math.min(pagedFindings.page * PAGE_SIZE, findingRows.length)} of {findingRows.length} findings</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPages((c) => ({ ...c, finding: Math.max(1, c.finding - 1) }))} disabled={pagedFindings.page <= 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><IconChevronLeft size={14} /></button>
                <button type="button" onClick={() => setPages((c) => ({ ...c, finding: Math.min(pagedFindings.totalPages, c.finding + 1) }))} disabled={pagedFindings.page >= pagedFindings.totalPages} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page"><IconChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "recommendation" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-neutral-700">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="w-10 px-4 py-3 text-left font-medium text-neutral-500">No.</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Recommendation</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="Action Type" active={sorts.recommendation.field === "actionType"} direction={sorts.recommendation.direction} onClick={() => applySort("recommendation", "actionType")} /></th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Owner</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500"><SortHeader label="Due Date" active={sorts.recommendation.field === "dueDate"} direction={sorts.recommendation.direction} onClick={() => applySort("recommendation", "dueDate")} /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pagedRecommendations.rows.length ? pagedRecommendations.rows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-neutral-400">{pagedRecommendations.startIndex + index + 1}</td>
                      <td className="px-4 py-3">{row.title}</td>
                      <td className="px-4 py-3 text-neutral-600">{row.description}</td>
                      <td className="px-4 py-3"><TonePill tone={row.actionType.toLowerCase() === "preventive" ? "Green" : "Amber"}>{row.actionType}</TonePill></td>
                      <td className="px-4 py-3 text-neutral-600">{row.owner}</td>
                      <td className="px-4 py-3 text-neutral-600">{formatDateOnly(row.dueDate)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-neutral-400">No recommendations have been added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {recommendationRows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between text-[13px] text-neutral-500">
              <span>Showing {(pagedRecommendations.page - 1) * PAGE_SIZE + 1}–{Math.min(pagedRecommendations.page * PAGE_SIZE, recommendationRows.length)} of {recommendationRows.length} recommendations</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPages((c) => ({ ...c, recommendation: Math.max(1, c.recommendation - 1) }))} disabled={pagedRecommendations.page <= 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><IconChevronLeft size={14} /></button>
                <button type="button" onClick={() => setPages((c) => ({ ...c, recommendation: Math.min(pagedRecommendations.totalPages, c.recommendation + 1) }))} disabled={pagedRecommendations.page >= pagedRecommendations.totalPages} className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page"><IconChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      </div>
    </div>
  );
}
