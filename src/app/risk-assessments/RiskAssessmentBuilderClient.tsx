"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { DetailPageSkeleton } from "@/components/loading/HsesLoaders";

type LookupOption = { id: string; label: string };
type RiskMatrixCell = { likelihood_id: string; consequence_id: number; ranking_code: string; ranking_label: string };
type RiskRecordFormState = {
  project_phase_id: string;
  hazard_type_id: string;
  hazard_subtype_id: string;
  risk_status_id: string;
  scenario_description: string;
  cause_description: string;
  impact_category_id: string;
  impact_subcategory_id: string;
  impact_description: string;
  current_controls: string;
  preferred_control_type_id: string;
  consequence_inherent_id: string;
  likelihood_inherent_id: string;
  new_controls: string;
  consequence_residual_id: string;
  likelihood_residual_id: string;
  is_public: boolean;
};

type RiskRecordRow = {
  id: string;
  risk_code: string;
  project_phase_id: string | null;
  hazard_type_id: string | null;
  hazard_subtype_id: string | null;
  risk_status_id: string | null;
  scenario_description: string | null;
  cause_description: string | null;
  impact_category_id: string | null;
  impact_subcategory_id: string | null;
  impact_description: string | null;
  current_controls: string | null;
  preferred_control_type_id: string | null;
  consequence_inherent_id: number | null;
  likelihood_inherent_id: string | null;
  risk_ranking_inherent_code: string | null;
  new_controls: string | null;
  consequence_residual_id: number | null;
  likelihood_residual_id: string | null;
  risk_ranking_residual_code: string | null;
  is_public: boolean;
};

export default function RiskAssessmentBuilderClient({ initialAssessmentId }: { initialAssessmentId?: string }) {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState<string | null>(initialAssessmentId ?? null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recordNotice, setRecordNotice] = useState<string | null>(null);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [isAssessmentDrawerOpen, setIsAssessmentDrawerOpen] = useState(false);
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [assessmentSnapshot, setAssessmentSnapshot] = useState<{
    title: string;
    description: string;
    statusId: string;
    industryId: string;
    isPublic: boolean;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [isAssessmentPublic, setIsAssessmentPublic] = useState(false);

  const [records, setRecords] = useState<RiskRecordRow[]>([]);
  const [newRecord, setNewRecord] = useState<RiskRecordFormState>({
    project_phase_id: "",
    hazard_type_id: "",
    hazard_subtype_id: "",
    risk_status_id: "",
    scenario_description: "",
    cause_description: "",
    impact_category_id: "",
    impact_subcategory_id: "",
    impact_description: "",
    current_controls: "",
    preferred_control_type_id: "",
    consequence_inherent_id: "",
    likelihood_inherent_id: "",
    new_controls: "",
    consequence_residual_id: "",
    likelihood_residual_id: "",
    is_public: false,
  });

  const [industries, setIndustries] = useState<LookupOption[]>([]);
  const [statuses, setStatuses] = useState<LookupOption[]>([]);
  const [phases, setPhases] = useState<LookupOption[]>([]);
  const [hazardTypes, setHazardTypes] = useState<LookupOption[]>([]);
  const [hazardSubtypes, setHazardSubtypes] = useState<Array<LookupOption & { hazard_type_id: string }>>([]);
  const [impactCategories, setImpactCategories] = useState<LookupOption[]>([]);
  const [impactSubcategories, setImpactSubcategories] = useState<Array<LookupOption & { impact_category_id: string }>>([]);
  const [controlTypes, setControlTypes] = useState<LookupOption[]>([]);
  const [consequenceLevels, setConsequenceLevels] = useState<Array<{ id: number; label: string }>>([]);
  const [likelihoodLevels, setLikelihoodLevels] = useState<Array<{ id: string; label: string }>>([]);
  const [riskMatrix, setRiskMatrix] = useState<RiskMatrixCell[]>([]);

  const labels = useMemo(() => {
    const m = new Map<string, string>();
    [...industries, ...statuses, ...phases, ...hazardTypes, ...impactCategories, ...controlTypes].forEach((v) => m.set(v.id, v.label));
    hazardSubtypes.forEach((v) => m.set(v.id, v.label));
    impactSubcategories.forEach((v) => m.set(v.id, v.label));
    return m;
  }, [industries, statuses, phases, hazardTypes, impactCategories, controlTypes, hazardSubtypes, impactSubcategories]);

  const statusLabel = useMemo(() => statuses.find((s) => s.id === statusId)?.label ?? "-", [statuses, statusId]);
  const industryLabel = useMemo(() => industries.find((s) => s.id === industryId)?.label ?? "-", [industries, industryId]);
  const filteredHazardSubtypes = useMemo(
    () => hazardSubtypes.filter((s) => !newRecord.hazard_type_id || s.hazard_type_id === newRecord.hazard_type_id),
    [hazardSubtypes, newRecord.hazard_type_id]
  );
  const filteredImpactSubcategories = useMemo(
    () => impactSubcategories.filter((s) => !newRecord.impact_category_id || s.impact_category_id === newRecord.impact_category_id),
    [impactSubcategories, newRecord.impact_category_id]
  );
  const inherentRankingCode = useMemo(() => {
    if (!newRecord.likelihood_inherent_id || !newRecord.consequence_inherent_id) return "-";
    const consequenceId = Number(newRecord.consequence_inherent_id);
    return (
      riskMatrix.find(
        (cell) => cell.likelihood_id === newRecord.likelihood_inherent_id && cell.consequence_id === consequenceId
      )?.ranking_code ?? "-"
    );
  }, [riskMatrix, newRecord.likelihood_inherent_id, newRecord.consequence_inherent_id]);
  const residualRankingCode = useMemo(() => {
    if (!newRecord.likelihood_residual_id || !newRecord.consequence_residual_id) return "-";
    const consequenceId = Number(newRecord.consequence_residual_id);
    return (
      riskMatrix.find(
        (cell) => cell.likelihood_id === newRecord.likelihood_residual_id && cell.consequence_id === consequenceId
      )?.ranking_code ?? "-"
    );
  }, [riskMatrix, newRecord.likelihood_residual_id, newRecord.consequence_residual_id]);
  const consequenceLabelById = useMemo(() => {
    const map = new Map<number, string>();
    for (const level of consequenceLevels) map.set(level.id, level.label);
    return map;
  }, [consequenceLevels]);
  const likelihoodLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const level of likelihoodLevels) map.set(level.id, level.label);
    return map;
  }, [likelihoodLevels]);
  const rankingLabelByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const cell of riskMatrix) map.set(cell.ranking_code, cell.ranking_label);
    return map;
  }, [riskMatrix]);

  const getRiskRatingPillClassName = (label: string) => {
    const normalized = label.toLowerCase();
    if (normalized.includes("low")) return "risk-rating-band--low";
    if (normalized.includes("medium") || normalized.includes("moderate")) return "risk-rating-band--medium";
    if (normalized.includes("significant")) return "risk-rating-band--significant";
    if (normalized.includes("high") || normalized.includes("critical")) return "risk-rating-band--high";
    return "risk-rating-band--default";
  };

  const formatDropdownLabel = (label: string, options?: { stripControlPrefix?: boolean }) => {
    let value = label ?? "";
    if (options?.stripControlPrefix) {
      value = value.replace(/^\s*\d+\s*-\s*/, "");
    }
    value = value.replace(/_/g, " ").trim();
    if (!value) return "-";
    return value
      .split(/\s+/)
      .map((word) => {
        if (!word) return "";
        if (word.length <= 4 && word === word.toUpperCase()) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  };
  const renderControlLines = (value: string | null) => {
    const lines = (value ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return "-";
    return (
      <ul className="list-disc pl-4">
        {lines.map((line, idx) => (
          <li key={`${line}-${idx}`}>{line}</li>
        ))}
      </ul>
    );
  };
  const nextRiskCode = useMemo(() => {
    let maxValue = 0;
    for (const row of records) {
      const match = /^RA(\d+)$/i.exec((row.risk_code || "").trim());
      if (!match) continue;
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > maxValue) maxValue = parsed;
    }
    const next = maxValue + 1;
    return `RA${String(next).padStart(2, "0")}`;
  }, [records]);
  const recordsByPhase = useMemo(() => {
    const buckets = new Map<string, RiskRecordRow[]>();
    for (const record of records) {
      const key = record.project_phase_id ?? "__unassigned__";
      const existing = buckets.get(key);
      if (existing) existing.push(record);
      else buckets.set(key, [record]);
    }

    const result: Array<{ phaseKey: string; phaseLabel: string; records: RiskRecordRow[] }> = [];
    for (const phase of phases) {
      const phaseRecords = buckets.get(phase.id);
      if (!phaseRecords || phaseRecords.length === 0) continue;
      result.push({ phaseKey: phase.id, phaseLabel: phase.label, records: phaseRecords });
      buckets.delete(phase.id);
    }

    const unassigned = buckets.get("__unassigned__");
    if (unassigned && unassigned.length > 0) {
      result.push({ phaseKey: "__unassigned__", phaseLabel: "Unassigned Phase", records: unassigned });
      buckets.delete("__unassigned__");
    }

    for (const [phaseKey, phaseRecords] of buckets.entries()) {
      result.push({
        phaseKey,
        phaseLabel: labels.get(phaseKey) ?? phaseKey,
        records: phaseRecords,
      });
    }
    return result;
  }, [records, phases, labels]);

  const loadRecords = async (id: string) => {
    const { data, error: fetchError } = await supabaseBrowser
      .schema("risk")
      .from("risk_records")
      .select(
        "id,risk_code,project_phase_id,hazard_type_id,hazard_subtype_id,risk_status_id,scenario_description,cause_description,impact_category_id,impact_subcategory_id,impact_description,current_controls,preferred_control_type_id,consequence_inherent_id,likelihood_inherent_id,risk_ranking_inherent_code,new_controls,consequence_residual_id,likelihood_residual_id,risk_ranking_residual_code,is_public"
      )
      .eq("assessment_id", id)
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError(fetchError.message || "Unable to load risk records.");
      return;
    }
    setRecords((data ?? []) as RiskRecordRow[]);
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          const returnTo = assessmentId ? `/risk-assessments/${assessmentId}` : "/risk-assessments";
          window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }
        setUserId(user.id);

        const results = await Promise.all([
          supabaseBrowser.schema("risk").from("industries").select("id,label").eq("is_active", true).order("sort_order"),
          supabaseBrowser.schema("risk").from("risk_statuses").select("id,label").eq("is_active", true).order("sort_order"),
          supabaseBrowser.schema("risk").from("project_phases").select("id,label").eq("is_active", true).order("sort_order"),
          supabaseBrowser.schema("risk").from("hazard_types").select("id,label").eq("is_active", true).order("sort_order"),
          supabaseBrowser.schema("risk").from("hazard_subtypes").select("id,label,hazard_type_id").order("sort_order"),
          supabaseBrowser.schema("risk").from("impact_categories").select("id,label").eq("is_active", true).order("sort_order"),
          supabaseBrowser.schema("risk").from("impact_subcategories").select("id,label,impact_category_id").order("sort_order"),
          supabaseBrowser.schema("risk").from("control_types").select("id,label").eq("is_active", true).order("sort_order"),
          supabaseBrowser.schema("risk").from("consequence_levels").select("id,label").order("sort_order"),
          supabaseBrowser.schema("risk").from("likelihood_levels").select("id,label").order("sort_order"),
          supabaseBrowser.schema("risk").from("risk_matrix").select("likelihood_id,consequence_id,ranking_code,ranking_label"),
        ]);

        const firstError = results.map((x) => x.error).find(Boolean);
        if (firstError) {
          setError(firstError.message || "Unable to load lookup data.");
          return;
        }

        setIndustries((results[0].data ?? []) as LookupOption[]);
        setStatuses((results[1].data ?? []) as LookupOption[]);
        setPhases((results[2].data ?? []) as LookupOption[]);
        setHazardTypes((results[3].data ?? []) as LookupOption[]);
        setHazardSubtypes((results[4].data ?? []) as Array<LookupOption & { hazard_type_id: string }>);
        setImpactCategories((results[5].data ?? []) as LookupOption[]);
        setImpactSubcategories((results[6].data ?? []) as Array<LookupOption & { impact_category_id: string }>);
        setControlTypes((results[7].data ?? []) as LookupOption[]);
        setConsequenceLevels((results[8].data ?? []) as Array<{ id: number; label: string }>);
        setLikelihoodLevels((results[9].data ?? []) as Array<{ id: string; label: string }>);
        setRiskMatrix((results[10].data ?? []) as RiskMatrixCell[]);

        const defaultStatus = results[1].data?.[0]?.id as string | undefined;
        if (defaultStatus) setStatusId((v) => v || defaultStatus);

        if (assessmentId) {
          const { data: assessment, error: assessmentError } = await supabaseBrowser
            .schema("risk")
            .from("risk_assessments")
            .select("id,title,description,status_id,industry_id,is_public")
            .eq("id", assessmentId)
            .single();
          if (assessmentError) {
            setError(assessmentError.message || "Unable to load risk assessment.");
            return;
          }
          setTitle((assessment?.title as string) ?? "");
          setDescription((assessment?.description as string) ?? "");
          setStatusId((assessment?.status_id as string) ?? "");
          setIndustryId((assessment?.industry_id as string) ?? "");
          setIsAssessmentPublic(Boolean(assessment?.is_public));
          setAssessmentSnapshot({
            title: (assessment?.title as string) ?? "",
            description: (assessment?.description as string) ?? "",
            statusId: (assessment?.status_id as string) ?? "",
            industryId: (assessment?.industry_id as string) ?? "",
            isPublic: Boolean(assessment?.is_public),
          });
          await loadRecords(assessmentId);
        }
      } catch {
        setError("Unable to load risk assessment builder.");
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [assessmentId]);

  useEffect(() => {
    if (!newRecord.hazard_subtype_id) return;
    const existsInSelectedType = hazardSubtypes.some(
      (s) => s.id === newRecord.hazard_subtype_id && s.hazard_type_id === newRecord.hazard_type_id
    );
    if (!existsInSelectedType) {
      setNewRecord((prev) => ({ ...prev, hazard_subtype_id: "" }));
    }
  }, [newRecord.hazard_subtype_id, newRecord.hazard_type_id, hazardSubtypes]);

  useEffect(() => {
    if (!newRecord.impact_subcategory_id) return;
    const existsInSelectedCategory = impactSubcategories.some(
      (s) => s.id === newRecord.impact_subcategory_id && s.impact_category_id === newRecord.impact_category_id
    );
    if (!existsInSelectedCategory) {
      setNewRecord((prev) => ({ ...prev, impact_subcategory_id: "" }));
    }
  }, [newRecord.impact_subcategory_id, newRecord.impact_category_id, impactSubcategories]);

  const saveAssessment = async () => {
    if (!userId) return;
    if (!title.trim()) {
      setError("Risk assessment title is required.");
      return;
    }
      setIsSavingAssessment(true);
      setError(null);
      setSuccess(null);
      setRecordNotice(null);
    try {
      if (!assessmentId) {
        const { data, error: createError } = await supabaseBrowser
          .schema("risk")
          .from("risk_assessments")
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            status_id: statusId || null,
            industry_id: industryId || null,
            owner_user_id: userId,
            is_public: isAssessmentPublic,
          })
          .select("id")
          .single();
        if (createError || !data?.id) {
          setError(createError?.message || "Unable to create risk assessment.");
          return;
        }
        const newId = data.id as string;
        setAssessmentId(newId);
        setSuccess("Risk assessment created.");
        router.replace(`/risk-assessments/${newId}`);
        return;
      }

      const { error: updateError } = await supabaseBrowser
        .schema("risk")
        .from("risk_assessments")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          status_id: statusId || null,
          industry_id: industryId || null,
          is_public: isAssessmentPublic,
        })
        .eq("id", assessmentId);
      if (updateError) {
        setError(updateError.message || "Unable to save risk assessment.");
        return;
      }
      setAssessmentSnapshot({
        title: title.trim(),
        description: description.trim(),
        statusId: statusId || "",
        industryId: industryId || "",
        isPublic: isAssessmentPublic,
      });
      setSuccess("Risk assessment saved.");
      setIsAssessmentDrawerOpen(false);
    } finally {
      setIsSavingAssessment(false);
    }
  };

  const resetNewRecord = () => {
    setNewRecord({
      project_phase_id: "",
      hazard_type_id: "",
      hazard_subtype_id: "",
      risk_status_id: "",
      scenario_description: "",
      cause_description: "",
      impact_category_id: "",
      impact_subcategory_id: "",
      impact_description: "",
      current_controls: "",
      preferred_control_type_id: "",
      consequence_inherent_id: "",
      likelihood_inherent_id: "",
      new_controls: "",
      consequence_residual_id: "",
      likelihood_residual_id: "",
      is_public: false,
    });
  };

  const cancelAssessmentEdit = () => {
    if (assessmentSnapshot) {
      setTitle(assessmentSnapshot.title);
      setDescription(assessmentSnapshot.description);
      setStatusId(assessmentSnapshot.statusId);
      setIndustryId(assessmentSnapshot.industryId);
      setIsAssessmentPublic(assessmentSnapshot.isPublic);
    }
    setIsAssessmentDrawerOpen(false);
  };

  const saveRiskRecord = async () => {
    if (!assessmentId || !userId) return;
    setIsSavingRecord(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: createError } = await supabaseBrowser
        .schema("risk")
        .from("risk_records")
        .insert({
          assessment_id: assessmentId,
          owner_user_id: userId,
          risk_code: nextRiskCode,
          project_phase_id: newRecord.project_phase_id || null,
          hazard_type_id: newRecord.hazard_type_id || null,
          hazard_subtype_id: newRecord.hazard_subtype_id || null,
          risk_status_id: newRecord.risk_status_id || null,
          scenario_description: newRecord.scenario_description.trim() || null,
          cause_description: newRecord.cause_description.trim() || null,
          impact_category_id: newRecord.impact_category_id || null,
          impact_subcategory_id: newRecord.impact_subcategory_id || null,
          impact_description: newRecord.impact_description.trim() || null,
          current_controls: newRecord.current_controls.trim() || null,
          preferred_control_type_id: newRecord.preferred_control_type_id || null,
          consequence_inherent_id: newRecord.consequence_inherent_id ? Number(newRecord.consequence_inherent_id) : null,
          likelihood_inherent_id: newRecord.likelihood_inherent_id || null,
          risk_ranking_inherent_code: inherentRankingCode !== "-" ? inherentRankingCode : null,
          new_controls: newRecord.new_controls.trim() || null,
          consequence_residual_id: newRecord.consequence_residual_id ? Number(newRecord.consequence_residual_id) : null,
          likelihood_residual_id: newRecord.likelihood_residual_id || null,
          risk_ranking_residual_code: residualRankingCode !== "-" ? residualRankingCode : null,
          is_public: newRecord.is_public,
        });
      if (createError) {
        setError(createError.message || "Unable to create risk record.");
        return;
      }
      await loadRecords(assessmentId);
      setSuccess("Risk record added.");
      setIsRecordDrawerOpen(false);
      resetNewRecord();
    } finally {
      setIsSavingRecord(false);
    }
  };

  if (isLoading) return <DetailPageSkeleton />;

  return (
    <>
      {!assessmentId ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="font-bold">Create New Risk Assessment</h2>
            <p>Add assessment details, then build the risk records table.</p>
          </div>
          <div className="dashboard-input-stack">
            <label className="dashboard-field">
              <span>Risk Assessment Title</span>
              <input className="dashboard-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="dashboard-field">
              <span>Description</span>
              <textarea className="dashboard-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <div className="dashboard-input-row">
              <label className="dashboard-field">
                <span>Status</span>
                <select className="dashboard-input" value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                  <option value="">Select status</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDropdownLabel(s.label)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-field">
                <span>Industry</span>
                <select className="dashboard-input" value={industryId} onChange={(e) => setIndustryId(e.target.value)}>
                  <option value="">Select industry</option>
                  {industries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDropdownLabel(s.label)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="dashboard-checkbox">
              <input type="checkbox" checked={isAssessmentPublic} onChange={(e) => setIsAssessmentPublic(e.target.checked)} />
              <span>Public risk assessment</span>
            </label>
            <div>
              <button type="button" className="btn btn-primary" onClick={() => void saveAssessment()} disabled={isSavingAssessment}>
                {isSavingAssessment ? "Saving..." : "Create Assessment"}
              </button>
            </div>
            {error ? <p className="dashboard-form-error">{error}</p> : null}
            {success ? <p className="dashboard-form-success">{success}</p> : null}
          </div>
        </section>
      ) : (
        <div className="rounded-none border border-slate-300 bg-white px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Risk Assessment</p>
              <h3 className="text-2xl font-semibold text-slate-900">{title || "Untitled"}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                {formatDropdownLabel(statusLabel)}
              </span>
              <span className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                {isAssessmentPublic ? "Public" : "Private"}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-small"
                onClick={() => {
                  setAssessmentSnapshot({
                    title,
                    description,
                    statusId,
                    industryId,
                    isPublic: isAssessmentPublic,
                  });
                  setIsAssessmentDrawerOpen(true);
                }}
              >
                Edit
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-700">{description || "No description provided."}</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <div className="rounded border border-slate-200 bg-white px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Industry</span>
              <div className="mt-1 font-medium text-slate-900">{formatDropdownLabel(industryLabel)}</div>
            </div>
            <div className="rounded border border-slate-200 bg-white px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Visibility</span>
              <div className="mt-1 font-medium text-slate-900">{isAssessmentPublic ? "Public" : "Private"}</div>
            </div>
          </div>
          {error ? <p className="dashboard-form-error mt-3">{error}</p> : null}
          {success ? <p className="dashboard-form-success mt-3">{success}</p> : null}
        </div>
      )}

      <section className="dashboard-panel mt-4">
        <div className="dashboard-panel-header">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Risk Records Table</h2>
            {assessmentId ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setRecordNotice(null);
                  setIsRecordDrawerOpen(true);
                }}
              >
                Add Risk Record
              </button>
            ) : null}
          </div>
        </div>
        {!assessmentId ? (
          <div className="dashboard-empty">Create the risk assessment first.</div>
        ) : (
          <>
            {recordNotice ? <p className="mb-3 text-sm text-slate-600">{recordNotice}</p> : null}
            <div className="dashboard-table-wrap mt-4" role="region" aria-label="Risk records table">
              <table className="dashboard-table risk-records-table">
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "7.5%" }} />
                  <col style={{ width: "17.5%" }} />
                  <col style={{ width: "17.5%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "7.5%" }} />
                  <col style={{ width: "7.5%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "7.5%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="text-center align-middle text-xs">ID</th>
                    <th className="text-center align-middle text-xs">Hazard</th>
                    <th className="text-left align-middle text-xs">Scenario</th>
                    <th className="text-left align-middle text-xs">Impact</th>
                    <th className="text-left align-middle text-xs">Controls</th>
                    <th className="text-center align-middle text-xs">Control Type</th>
                    <th className="text-center align-middle text-xs">Inherent Rating</th>
                    <th className="text-left align-middle text-xs">New Controls</th>
                    <th className="text-center align-middle text-xs">Residual Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={9}>No risk records added yet.</td>
                    </tr>
                  ) : (
                    recordsByPhase.map((group) => (
                      <Fragment key={group.phaseKey}>
                        <tr>
                          <td colSpan={9} className="risk-records-phase-row text-left font-semibold">
                            {formatDropdownLabel(group.phaseLabel)}
                          </td>
                        </tr>
                        {group.records.map((r) => (
                          <tr key={r.id}>
                            <td className="text-center align-middle">{r.risk_code}</td>
                            <td className="text-center align-middle">
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Type</div>
                                <div className="font-medium">
                                  {formatDropdownLabel((r.hazard_type_id && labels.get(r.hazard_type_id)) || "-")}
                                </div>
                              </div>
                              <div className="mt-2">
                                <div className="text-xs italic text-slate-500">
                                  {formatDropdownLabel((r.hazard_subtype_id && labels.get(r.hazard_subtype_id)) || "-")}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Scenario</div>
                                <div>{r.scenario_description || "-"}</div>
                              </div>
                              <div className="mt-2">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Cause</div>
                                <div>{r.cause_description || "-"}</div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Description</div>
                                <div className="text-sm text-slate-800">{r.impact_description || "-"}</div>
                              </div>
                              <div className="mt-2">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Category</div>
                                <div className="font-medium">
                                  {formatDropdownLabel((r.impact_category_id && labels.get(r.impact_category_id)) || "-")}
                                </div>
                              </div>
                              <div className="mt-2">
                                <div className="text-xs italic text-slate-500">
                                  {formatDropdownLabel((r.impact_subcategory_id && labels.get(r.impact_subcategory_id)) || "-")}
                                </div>
                              </div>
                            </td>
                            <td>{renderControlLines(r.current_controls)}</td>
                            <td className="text-center align-middle">
                              {formatDropdownLabel(
                                (r.preferred_control_type_id && labels.get(r.preferred_control_type_id)) || "-",
                                { stripControlPrefix: true }
                              )}
                            </td>
                            <td className="text-center align-middle">
                              {(() => {
                                const ratingLabel = r.risk_ranking_inherent_code
                                  ? (rankingLabelByCode.get(r.risk_ranking_inherent_code) ?? r.risk_ranking_inherent_code)
                                  : "-";
                                const consequenceLabel = r.consequence_inherent_id
                                  ? (consequenceLabelById.get(r.consequence_inherent_id) ?? String(r.consequence_inherent_id))
                                  : "-";
                                const likelihoodLabel = r.likelihood_inherent_id
                                  ? (likelihoodLabelById.get(r.likelihood_inherent_id) ?? r.likelihood_inherent_id)
                                  : "-";
                                return (
                                  <div className="risk-rating-cell">
                                    <div className={`risk-rating-band ${getRiskRatingPillClassName(ratingLabel)}`}>{ratingLabel}</div>
                                    <div className="risk-rating-body">
                                      <div className="text-xs text-slate-700">{consequenceLabel}</div>
                                      <div className="text-xs text-slate-700">{likelihoodLabel}</div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                            <td>{renderControlLines(r.new_controls)}</td>
                            <td className="text-center align-middle">
                              {(() => {
                                const ratingLabel = r.risk_ranking_residual_code
                                  ? (rankingLabelByCode.get(r.risk_ranking_residual_code) ?? r.risk_ranking_residual_code)
                                  : "-";
                                const consequenceLabel = r.consequence_residual_id
                                  ? (consequenceLabelById.get(r.consequence_residual_id) ?? String(r.consequence_residual_id))
                                  : "-";
                                const likelihoodLabel = r.likelihood_residual_id
                                  ? (likelihoodLabelById.get(r.likelihood_residual_id) ?? r.likelihood_residual_id)
                                  : "-";
                                return (
                                  <div className="risk-rating-cell">
                                    <div className={`risk-rating-band ${getRiskRatingPillClassName(ratingLabel)}`}>{ratingLabel}</div>
                                    <div className="risk-rating-body">
                                      <div className="text-xs text-slate-700">{consequenceLabel}</div>
                                      <div className="text-xs text-slate-700">{likelihoodLabel}</div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {assessmentId ? (
        <>
          <button
            type="button"
            aria-label="Close assessment editor drawer"
            className={`fixed inset-0 z-[71] bg-slate-900/30 transition-opacity duration-300 ${
              isAssessmentDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={cancelAssessmentEdit}
          />
          <aside
            className="fixed bottom-0 left-0 top-0 z-[72] w-full max-w-[420px] border-r border-[#0b1f33] bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)] transition-transform duration-300"
            style={{ transform: isAssessmentDrawerOpen ? "translateX(0)" : "translateX(-100%)" }}
          >
            <div className="flex h-full flex-col overflow-auto p-4">
              <div className="flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
                <h2 className="text-lg font-semibold text-white">Edit Risk Assessment</h2>
                <button
                  type="button"
                  className="w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100"
                  onClick={cancelAssessmentEdit}
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="text-sm text-white">
                  Risk Assessment Title
                  <input
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label className="text-sm text-white">
                  Description
                  <textarea
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                <label className="text-sm text-white">
                  Status
                  <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                    <option value="">Select status</option>
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {formatDropdownLabel(s.label)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-white">
                  Industry
                  <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black" value={industryId} onChange={(e) => setIndustryId(e.target.value)}>
                    <option value="">Select industry</option>
                    {industries.map((s) => (
                      <option key={s.id} value={s.id}>
                        {formatDropdownLabel(s.label)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-white">
                  <input type="checkbox" checked={isAssessmentPublic} onChange={(e) => setIsAssessmentPublic(e.target.checked)} />
                  <span>Public risk assessment</span>
                </label>
                {error ? <p className="text-sm text-rose-200">{error}</p> : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#5f7894]/70 pt-3">
                <button
                  type="button"
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                  onClick={cancelAssessmentEdit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100"
                  onClick={() => void saveAssessment()}
                  disabled={isSavingAssessment}
                >
                  {isSavingAssessment ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </aside>

          <button
            type="button"
            aria-label="Close risk record drawer"
            className={`fixed inset-0 z-[73] bg-slate-900/30 transition-opacity duration-300 ${
              isRecordDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={() => setIsRecordDrawerOpen(false)}
          />
          <aside
            className="fixed bottom-0 left-0 top-0 z-[74] w-full max-w-[420px] border-r border-[#0b1f33] bg-[#102a43] text-slate-100 shadow-[12px_0_30px_rgba(2,12,27,0.45)] transition-transform duration-300"
            style={{ transform: isRecordDrawerOpen ? "translateX(0)" : "translateX(-100%)" }}
          >
            <div className="flex h-full flex-col overflow-auto p-4">
              <div className="flex items-center justify-between border-b border-[#5f7894]/70 pb-3">
                <h2 className="text-lg font-semibold text-white">Add Risk Record</h2>
                <button
                  type="button"
                  className="w-full max-w-[110px] rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100"
                  onClick={() => setIsRecordDrawerOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="text-sm text-white">
                  Risk ID
                  <input
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={nextRiskCode}
                    disabled
                    readOnly
                  />
                </label>

                <label className="text-sm text-white">
                  Project Phase
                  <select
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={newRecord.project_phase_id}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, project_phase_id: e.target.value }))}
                  >
                    <option value="">Select project phase</option>
                    {phases.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {formatDropdownLabel(opt.label)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-white">
                  Risk Status
                  <select
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={newRecord.risk_status_id}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, risk_status_id: e.target.value }))}
                  >
                    <option value="">Select risk status</option>
                    {statuses.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {formatDropdownLabel(opt.label)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-white">
                  Hazard Type
                  <select
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={newRecord.hazard_type_id}
                    onChange={(e) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        hazard_type_id: e.target.value,
                        hazard_subtype_id: "",
                      }))
                    }
                  >
                    <option value="">Select hazard type</option>
                    {hazardTypes.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {formatDropdownLabel(opt.label)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-white">
                  Hazard Sub-type
                  <select
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={newRecord.hazard_subtype_id}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, hazard_subtype_id: e.target.value }))}
                  >
                    <option value="">Select hazard sub-type</option>
                    {filteredHazardSubtypes.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {formatDropdownLabel(opt.label)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-white">
                  Scenario Description
                  <textarea
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    rows={3}
                    value={newRecord.scenario_description}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, scenario_description: e.target.value }))}
                  />
                </label>

                <label className="text-sm text-white">
                  Cause Description
                  <textarea
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    rows={3}
                    value={newRecord.cause_description}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, cause_description: e.target.value }))}
                  />
                </label>

                <label className="text-sm text-white">
                  Impact Category
                  <select
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={newRecord.impact_category_id}
                    onChange={(e) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        impact_category_id: e.target.value,
                        impact_subcategory_id: "",
                      }))
                    }
                  >
                    <option value="">Select impact category</option>
                    {impactCategories.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {formatDropdownLabel(opt.label)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-white">
                  Impact Sub-category
                  <select
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={newRecord.impact_subcategory_id}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, impact_subcategory_id: e.target.value }))}
                  >
                    <option value="">Select impact sub-category</option>
                    {filteredImpactSubcategories.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {formatDropdownLabel(opt.label)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-white">
                  Impact Description
                  <textarea
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    rows={3}
                    value={newRecord.impact_description}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, impact_description: e.target.value }))}
                  />
                </label>

                <label className="text-sm text-white">
                  Current Controls
                  <textarea
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    rows={3}
                    value={newRecord.current_controls}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, current_controls: e.target.value }))}
                  />
                </label>

                <label className="text-sm text-white">
                  Preferred Control Type
                  <select
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    value={newRecord.preferred_control_type_id}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, preferred_control_type_id: e.target.value }))}
                  >
                    <option value="">Select preferred control type</option>
                    {controlTypes.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {formatDropdownLabel(opt.label, { stripControlPrefix: true })}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded border border-[#5f7894]/70 bg-[#0d2237] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-200">Inherent Risk</div>
                  <label className="mt-2 block text-sm text-white">
                    Consequence
                    <select
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                      value={newRecord.consequence_inherent_id}
                      onChange={(e) => setNewRecord((prev) => ({ ...prev, consequence_inherent_id: e.target.value }))}
                    >
                      <option value="">Select consequence</option>
                      {consequenceLevels.map((opt) => (
                        <option key={opt.id} value={String(opt.id)}>
                          {formatDropdownLabel(opt.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-2 block text-sm text-white">
                    Likelihood
                    <select
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                      value={newRecord.likelihood_inherent_id}
                      onChange={(e) => setNewRecord((prev) => ({ ...prev, likelihood_inherent_id: e.target.value }))}
                    >
                      <option value="">Select likelihood</option>
                      {likelihoodLevels.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {formatDropdownLabel(opt.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="mt-2 text-xs text-slate-200">Calculated Rating: {inherentRankingCode}</p>
                </div>

                <label className="text-sm text-white">
                  New Controls
                  <textarea
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                    rows={3}
                    value={newRecord.new_controls}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, new_controls: e.target.value }))}
                  />
                </label>

                <div className="rounded border border-[#5f7894]/70 bg-[#0d2237] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-200">Residual Risk</div>
                  <label className="mt-2 block text-sm text-white">
                    Consequence
                    <select
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                      value={newRecord.consequence_residual_id}
                      onChange={(e) => setNewRecord((prev) => ({ ...prev, consequence_residual_id: e.target.value }))}
                    >
                      <option value="">Select consequence</option>
                      {consequenceLevels.map((opt) => (
                        <option key={opt.id} value={String(opt.id)}>
                          {formatDropdownLabel(opt.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-2 block text-sm text-white">
                    Likelihood
                    <select
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                      value={newRecord.likelihood_residual_id}
                      onChange={(e) => setNewRecord((prev) => ({ ...prev, likelihood_residual_id: e.target.value }))}
                    >
                      <option value="">Select likelihood</option>
                      {likelihoodLevels.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {formatDropdownLabel(opt.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="mt-2 text-xs text-slate-200">Calculated Rating: {residualRankingCode}</p>
                </div>

                <label className="flex items-center gap-2 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={newRecord.is_public}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, is_public: e.target.checked }))}
                  />
                  <span>Public risk record</span>
                </label>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#5f7894]/70 pt-3">
                <button
                  type="button"
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                  onClick={() => {
                    setIsRecordDrawerOpen(false);
                    resetNewRecord();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100"
                  onClick={() => void saveRiskRecord()}
                  disabled={isSavingRecord}
                >
                  {isSavingRecord ? "Saving..." : "Add Record"}
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
