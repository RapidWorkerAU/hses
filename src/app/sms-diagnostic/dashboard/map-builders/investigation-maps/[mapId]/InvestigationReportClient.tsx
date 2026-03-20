"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { supabaseBrowser } from "@/lib/supabase/client";
import { parsePersonLabels, type CanvasElementRow, type SystemMap } from "@/app/system-maps/[mapId]/canvasShared";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import PortalTableFooter from "@/components/table/PortalTableFooter";
import styles from "./InvestigationReport.module.css";

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
    <button type="button" className={styles.sortHeader} onClick={onClick}>
      <span>{label}</span>
      <span className={styles.sortHeaderMeta}>{active ? (direction === "asc" ? "Asc" : "Desc") : "v"}</span>
    </button>
  );
}

function TonePill({ children, tone }: { children: ReactNode; tone: "Green" | "Red" | "Amber" | "Slate" | "Neutral" }) {
  return <span className={`${styles.pill} ${styles[`pill${tone}` as keyof typeof styles]}`}>{children}</span>;
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
    <div className={`${styles.scopeCard} ${className}`.trim()}>
      <span>{label}</span>
      {isEditing ? (
        multiline ? (
          <textarea className={`${styles.scopeInput} ${styles.scopeTextarea}`} value={value} onChange={(event) => onChange(event.target.value)} />
        ) : (
          <input className={styles.scopeInput} value={value} onChange={(event) => onChange(event.target.value)} />
        )
      ) : (
        <strong>{value}</strong>
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
      <div className={styles.wrap}>
        <div className={styles.headerBlock}>
          <div className={styles.loadingBack} />
          <div className={styles.loadingTitleBlock}>
            <div className={styles.loadingEyebrow} />
            <div className={styles.loadingTitle} />
            <div className={styles.loadingSubtitle} />
          </div>
        </div>

        <div className={styles.topRail}>
          <div className={styles.loadingTabRail} />
          <div className={styles.loadingOpenButton} />
        </div>

        <TableSkeleton rows={7} columns="12% 16% 34% 14% 12% 12%" showToolbar={false} />
      </div>
    );
  }
  if (error) return <div className={styles.error}>{error}</div>;
  if (!map) return <div className={styles.empty}>Investigation not found.</div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.headerBlock}>
        <Link href="/dashboard/map-builders/investigation-maps" className={styles.backLink}>
          <span className={styles.backIcon} aria-hidden="true">&lt;</span>
          <span>Back</span>
        </Link>

        <div className={styles.titleBlock}>
          <p className={styles.eyebrow}>Investigation Tool</p>
          <h1>{map.title}</h1>
          <p>Review the investigation record before opening the incident map.</p>
        </div>
      </div>

      <div className={styles.topRail}>
        <div className={styles.tabRail}>
          {tabs.map((tab) => (
            <button key={tab.key} type="button" className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ""}`} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        <Link href={`/system-maps/${map.id}`} className={styles.openMapButton}>Open Incident Map</Link>
      </div>

      {activeTab === "scope" && scopeDraft ? (
        <>
          <div className={styles.scopeGrid}>
            <ScopeField label="Investigation Name" value={scopeDraft.investigationName} isEditing={isEditingScope} onChange={(value) => updateScopeField("investigationName", value)} className={styles.scopeCardThird} />
            <ScopeField label="Owner" value={scopeDraft.owner} isEditing={isEditingScope} onChange={(value) => updateScopeField("owner", value)} className={styles.scopeCardThird} />
            <ScopeField label="Created" value={scopeDraft.created} isEditing={isEditingScope} onChange={(value) => updateScopeField("created", value)} className={styles.scopeCardThird} />
            <ScopeField label="Incident Date & Time" value={scopeDraft.incidentDateTime} isEditing={isEditingScope} onChange={(value) => updateScopeField("incidentDateTime", value)} className={styles.scopeCardHalf} />
            <ScopeField label="Incident Location" value={scopeDraft.incidentLocation} isEditing={isEditingScope} onChange={(value) => updateScopeField("incidentLocation", value)} className={styles.scopeCardHalf} />
            <ScopeField label="Responsible Person Name" value={scopeDraft.responsiblePersonName} isEditing={isEditingScope} onChange={(value) => updateScopeField("responsiblePersonName", value)} className={styles.scopeCardHalf} />
            <ScopeField label="Investigation Lead Name" value={scopeDraft.investigationLeadName} isEditing={isEditingScope} onChange={(value) => updateScopeField("investigationLeadName", value)} className={styles.scopeCardHalf} />
            <ScopeField label="Items of Interest" value={scopeDraft.itemsOfInterest} isEditing={isEditingScope} multiline onChange={(value) => updateScopeField("itemsOfInterest", value)} className={styles.scopeCardFull} />
            <ScopeField label="Incident Long Description" value={scopeDraft.incidentLongDescription} isEditing={isEditingScope} multiline onChange={(value) => updateScopeField("incidentLongDescription", value)} className={styles.scopeCardFull} />
          </div>
          {isEditingScope ? (
            <div className={styles.scopeActions}>
              <button type="button" className={styles.scopeSecondaryButton} onClick={handleCancelScopeEdit}>
                Cancel
              </button>
              <button type="button" className={styles.scopePrimaryButton} onClick={handleSaveScope}>
                Save Scope
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {activeTab === "people" ? (
        <div className={styles.peopleSection}>
          {peopleRows.length ? peopleRows.map((person) => (
            <article key={person.id} className={styles.personCard}>
              <div className={styles.personAvatar}>{person.initials}</div>
              <h3>{person.title}</h3>
              <p>{person.subtitle}</p>
            </article>
          )) : (
            <div className={styles.peopleEmpty}>
              <div className={styles.peopleEmptyBody}>
                <h3>No people have been added yet</h3>
                <p>Add people on the incident map to capture roles, departments, and ownership for this investigation.</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "sequence" ? (
        <section className={styles.tablePanel}>
          <div className={`${styles.tableShell} portal-table-shell`}>
            <table className={`${styles.table} portal-table`}>
              <thead>
                <tr>
                  <th className={styles.numberCol}>No.</th>
                  <th>Sequence Step</th>
                  <th>Description</th>
                  <th><SortHeader label="Timestamp" active={sorts.sequence.field === "timestamp"} direction={sorts.sequence.direction} onClick={() => applySort("sequence", "timestamp")} /></th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {pagedSequence.rows.length ? pagedSequence.rows.map((row, index) => (
                  <tr key={row.id} className="portal-table-row">
                    <td>{pagedSequence.startIndex + index + 1}</td>
                    <td>{row.step}</td>
                    <td>{row.description}</td>
                    <td>{formatDateTime(row.timestamp)}</td>
                    <td>{row.location}</td>
                  </tr>
                )) : (
                  <tr className="portal-table-empty-row">
                    <td colSpan={5}>No sequence items have been added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PortalTableFooter total={sequenceRows.length} page={pagedSequence.page} pageSize={PAGE_SIZE} onPageChange={(next) => setPages((current) => ({ ...current, sequence: next }))} label="sequence items" />
        </section>
      ) : null}

      {activeTab === "factors" ? (
        <section className={styles.tablePanel}>
          <div className={`${styles.tableShell} portal-table-shell`}>
            <table className={`${styles.table} portal-table`}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th><SortHeader label="Presence" active={sorts.factors.field === "presence"} direction={sorts.factors.direction} onClick={() => applySort("factors", "presence")} /></th>
                  <th><SortHeader label="Classification" active={sorts.factors.field === "classification"} direction={sorts.factors.direction} onClick={() => applySort("factors", "classification")} /></th>
                  <th><SortHeader label="Category" active={sorts.factors.field === "category"} direction={sorts.factors.direction} onClick={() => applySort("factors", "category")} /></th>
                </tr>
              </thead>
              <tbody>
                {pagedFactors.rows.length ? pagedFactors.rows.map((row) => (
                  <tr key={row.id} className="portal-table-row">
                    <td>{row.type}</td>
                    <td>{row.title}</td>
                    <td>{row.description}</td>
                    <td><TonePill tone="Green">{row.presence}</TonePill></td>
                    <td><TonePill tone={row.classification.toLowerCase().includes("essential") ? "Red" : "Amber"}>{row.classification}</TonePill></td>
                    <td>{row.category}</td>
                  </tr>
                )) : (
                  <tr className="portal-table-empty-row">
                    <td colSpan={6}>No factors have been added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PortalTableFooter total={factorRows.length} page={pagedFactors.page} pageSize={PAGE_SIZE} onPageChange={(next) => setPages((current) => ({ ...current, factors: next }))} label="factors" />
        </section>
      ) : null}

      {activeTab === "taskCondition" ? (
        <section className={styles.tablePanel}>
          <div className={`${styles.tableShell} portal-table-shell`}>
          <table className={`${styles.table} portal-table`}>
            <thead>
              <tr>
                <th>Task/Condition</th>
                <th>Description</th>
                <th><SortHeader label="State" active={sorts.taskCondition.field === "state"} direction={sorts.taskCondition.direction} onClick={() => applySort("taskCondition", "state")} /></th>
                <th>Environmental Context</th>
              </tr>
            </thead>
            <tbody>
              {pagedTaskConditions.rows.length ? pagedTaskConditions.rows.map((row) => (
                <tr key={row.id} className="portal-table-row">
                  <td>{row.title}</td>
                  <td>{row.description}</td>
                  <td><TonePill tone={row.state.toLowerCase() === "abnormal" ? "Red" : "Green"}>{row.state}</TonePill></td>
                  <td>{row.context}</td>
                </tr>
              )) : (
                <tr className="portal-table-empty-row">
                  <td colSpan={4}>No task or condition items have been added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <PortalTableFooter total={taskConditionRows.length} page={pagedTaskConditions.page} pageSize={PAGE_SIZE} onPageChange={(next) => setPages((current) => ({ ...current, taskCondition: next }))} label="task conditions" />
        </section>
      ) : null}

      {activeTab === "controlBarrier" ? (
        <section className={styles.tablePanel}>
          <div className={`${styles.tableShell} portal-table-shell`}>
          <table className={`${styles.table} portal-table`}>
            <thead>
              <tr>
                <th>Control/Barrier</th>
                <th>Description</th>
                <th><SortHeader label="Barrier State" active={sorts.controlBarrier.field === "barrierState"} direction={sorts.controlBarrier.direction} onClick={() => applySort("controlBarrier", "barrierState")} /></th>
                <th><SortHeader label="Barrier Role" active={sorts.controlBarrier.field === "barrierRole"} direction={sorts.controlBarrier.direction} onClick={() => applySort("controlBarrier", "barrierRole")} /></th>
                <th>Control Type</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {pagedBarriers.rows.length ? pagedBarriers.rows.map((row) => (
                <tr key={row.id} className="portal-table-row">
                  <td>{row.title}</td>
                  <td>{row.description}</td>
                  <td><TonePill tone={row.barrierState.toLowerCase().includes("missing") ? "Red" : row.barrierState.toLowerCase().includes("ineffective") ? "Slate" : "Green"}>{row.barrierState}</TonePill></td>
                  <td><TonePill tone="Green">{row.barrierRole}</TonePill></td>
                  <td>{row.controlType}</td>
                  <td>{row.owner}</td>
                </tr>
              )) : (
                <tr className="portal-table-empty-row">
                  <td colSpan={6}>No controls or barriers have been added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <PortalTableFooter total={barrierRows.length} page={pagedBarriers.page} pageSize={PAGE_SIZE} onPageChange={(next) => setPages((current) => ({ ...current, controlBarrier: next }))} label="controls and barriers" />
        </section>
      ) : null}

      {activeTab === "evidence" ? (
        <section className={styles.tablePanel}>
          <div className={`${styles.tableShell} portal-table-shell`}>
          <table className={`${styles.table} portal-table`}>
            <thead>
              <tr>
                <th>Evidence</th>
                <th>Description</th>
                <th><SortHeader label="Type" active={sorts.evidence.field === "evidenceType"} direction={sorts.evidence.direction} onClick={() => applySort("evidence", "evidenceType")} /></th>
                <th>Source</th>
                <th>Attachment</th>
              </tr>
            </thead>
            <tbody>
              {pagedEvidence.rows.length ? pagedEvidence.rows.map((row) => (
                <tr key={row.id} className="portal-table-row">
                  <td>{row.title}</td>
                  <td>{row.description}</td>
                  <td>{row.evidenceType}</td>
                  <td>{row.source}</td>
                  <td>{row.attachment}</td>
                </tr>
              )) : (
                <tr className="portal-table-empty-row">
                  <td colSpan={5}>No evidence items have been added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <PortalTableFooter total={evidenceRows.length} page={pagedEvidence.page} pageSize={PAGE_SIZE} onPageChange={(next) => setPages((current) => ({ ...current, evidence: next }))} label="evidence items" />
        </section>
      ) : null}

      {activeTab === "finding" ? (
        <section className={styles.tablePanel}>
          <div className={`${styles.tableShell} portal-table-shell`}>
          <table className={`${styles.table} portal-table`}>
            <thead>
              <tr>
                <th className={styles.numberCol}>No.</th>
                <th>Finding</th>
                <th>Description</th>
                <th><SortHeader label="Confidence Level" active={sorts.finding.field === "confidence"} direction={sorts.finding.direction} onClick={() => applySort("finding", "confidence")} /></th>
              </tr>
            </thead>
            <tbody>
              {pagedFindings.rows.length ? pagedFindings.rows.map((row, index) => (
                <tr key={row.id} className="portal-table-row">
                  <td>{pagedFindings.startIndex + index + 1}</td>
                  <td>{row.title}</td>
                  <td>{row.description}</td>
                  <td><TonePill tone={row.confidence.toLowerCase() === "high" ? "Green" : row.confidence.toLowerCase() === "medium" ? "Amber" : "Red"}>{row.confidence}</TonePill></td>
                </tr>
              )) : (
                <tr className="portal-table-empty-row">
                  <td colSpan={4}>No findings have been added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <PortalTableFooter total={findingRows.length} page={pagedFindings.page} pageSize={PAGE_SIZE} onPageChange={(next) => setPages((current) => ({ ...current, finding: next }))} label="findings" />
        </section>
      ) : null}

      {activeTab === "recommendation" ? (
        <section className={styles.tablePanel}>
          <div className={`${styles.tableShell} portal-table-shell`}>
          <table className={`${styles.table} portal-table`}>
            <thead>
              <tr>
                <th className={styles.numberCol}>No.</th>
                <th>Recommendation</th>
                <th>Description</th>
                <th><SortHeader label="Action Type" active={sorts.recommendation.field === "actionType"} direction={sorts.recommendation.direction} onClick={() => applySort("recommendation", "actionType")} /></th>
                <th>Owner</th>
                <th><SortHeader label="Due Date" active={sorts.recommendation.field === "dueDate"} direction={sorts.recommendation.direction} onClick={() => applySort("recommendation", "dueDate")} /></th>
              </tr>
            </thead>
            <tbody>
              {pagedRecommendations.rows.length ? pagedRecommendations.rows.map((row, index) => (
                <tr key={row.id} className="portal-table-row">
                  <td>{pagedRecommendations.startIndex + index + 1}</td>
                  <td>{row.title}</td>
                  <td>{row.description}</td>
                  <td><TonePill tone={row.actionType.toLowerCase() === "preventive" ? "Green" : "Amber"}>{row.actionType}</TonePill></td>
                  <td>{row.owner}</td>
                  <td>{formatDateOnly(row.dueDate)}</td>
                </tr>
              )) : (
                <tr className="portal-table-empty-row">
                  <td colSpan={6}>No recommendations have been added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <PortalTableFooter total={recommendationRows.length} page={pagedRecommendations.page} pageSize={PAGE_SIZE} onPageChange={(next) => setPages((current) => ({ ...current, recommendation: next }))} label="recommendations" />
        </section>
      ) : null}
    </div>
  );
}
