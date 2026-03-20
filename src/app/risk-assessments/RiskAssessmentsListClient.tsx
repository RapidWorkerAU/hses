"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import PortalModal from "@/components/PortalModal";
import modalStyles from "@/components/PortalModal.module.css";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import PortalTableFooter from "@/components/table/PortalTableFooter";

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
  const pageSize = 7;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLabel, setUserLabel] = useState("Current User");
  const [rows, setRows] = useState<RiskAssessmentRow[]>([]);
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<LookupOption[]>([]);
  const [industries, setIndustries] = useState<LookupOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatusId, setNewStatusId] = useState("");
  const [newIndustryId, setNewIndustryId] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [page, setPage] = useState(1);

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
        setSelectedAssessmentIds((current) => current.filter((id) => mapped.some((row) => row.id === id)));
      } catch {
        setError("Unable to load risk assessments.");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    setPage((current) => Math.min(current, totalPages));
  }, [rows.length]);

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

  const allSelected = rows.length > 0 && rows.every((row) => selectedAssessmentIds.includes(row.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedAssessmentIds([]);
      return;
    }
    setSelectedAssessmentIds(rows.map((row) => row.id));
  };

  const toggleAssessmentSelection = (assessmentId: string) => {
    setSelectedAssessmentIds((current) =>
      current.includes(assessmentId)
        ? current.filter((id) => id !== assessmentId)
        : [...current, assessmentId]
    );
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

  const handleBulkDelete = async () => {
    if (!currentUserId || selectedAssessmentIds.length === 0) return;
    setIsBulkDeleting(true);
    setError(null);
    try {
      const { error: deleteError } = await supabaseBrowser
        .schema("risk")
        .from("risk_assessments")
        .delete()
        .in("id", selectedAssessmentIds)
        .eq("owner_user_id", currentUserId);

      if (deleteError) {
        setError(deleteError.message || "Unable to delete selected risk assessments.");
        return;
      }

      setRows((current) => current.filter((row) => !selectedAssessmentIds.includes(row.id)));
      setSelectedAssessmentIds([]);
      setIsDeleteModalOpen(false);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={pageSize} columns="22% 26% 12% 12% 14% 14%" showToolbar />;
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <>
      <div className="risk-assessments-toolbar">
        <div className="management-table-toolbar">
          <button
            type="button"
            className="management-bulk-delete-button"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={!selectedAssessmentIds.length || isBulkDeleting}
          >
            <img src="/icons/delete.svg" alt="" className="management-bulk-delete-button-icon" />
            <span>{isBulkDeleting ? "Deleting..." : "Bulk Delete"}</span>
          </button>
          <div className="management-table-toolbar-actions">
          <button type="button" className="risk-assessments-toolbar-button risk-assessments-toolbar-button--secondary">
            Search Risk Records
          </button>
          <button
            type="button"
            className="risk-assessments-toolbar-button risk-assessments-toolbar-button--primary"
            onClick={openCreateModal}
          >
            Add New Risk Assessment
          </button>
          </div>
        </div>
        {error ? (
          <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
      </div>

      <div className="dashboard-table-wrap risk-assessments-table-wrap" role="region" aria-label="Risk assessments table">
        <table className="dashboard-table w-full min-w-[760px] text-left text-sm">
          <colgroup>
            <col style={{ width: "5%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "21%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "16.5%" }} />
            <col style={{ width: "16.5%" }} />
          </colgroup>
          <thead>
            <tr>
              <th className="management-checkbox-header">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all risk assessments" />
              </th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Updated</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="dashboard-table-empty-row">
                <td colSpan={7}>
                  No risk assessments have been added yet.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  className="dashboard-row-link"
                  onClick={() => {
                    window.location.assign(`/risk-assessments/${row.id}`);
                  }}
                >
                  <td className="management-checkbox-cell" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedAssessmentIds.includes(row.id)}
                      onChange={() => toggleAssessmentSelection(row.id)}
                      aria-label={`Select ${row.title}`}
                    />
                  </td>
                  <td className="font-semibold text-slate-900 management-cell-wrap">
                    {row.title}
                    {row.isPublic ? (
                      <span className="ml-2 rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        Public
                      </span>
                    ) : null}
                  </td>
                  <td className="text-slate-600 management-cell-wrap">
                    {row.description || "-"}
                  </td>
                  <td className="text-slate-600">{row.statusLabel}</td>
                  <td className="text-slate-600">{userLabel}</td>
                  <td className="text-slate-600">{formatDateTime(row.updatedAt)}</td>
                  <td className="text-slate-600">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PortalTableFooter
        total={rows.length}
        page={safePage}
        pageSize={pageSize}
        onPageChange={setPage}
        label="risk assessments"
      />

      <PortalModal
        open={isDeleteModalOpen}
        ariaLabel="Delete selected risk assessments"
        eyebrow="Bulk Delete"
        title="Delete selected risk assessments?"
        description={`You are about to permanently delete ${selectedAssessmentIds.length} selected risk assessment${selectedAssessmentIds.length === 1 ? "" : "s"}.`}
        onClose={() => {
          if (isBulkDeleting) return;
          setIsDeleteModalOpen(false);
        }}
        footer={
          <>
            <button
              type="button"
              className={modalStyles.secondaryButton}
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isBulkDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={modalStyles.dangerButton}
              onClick={() => void handleBulkDelete()}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? "Deleting..." : "Delete selected"}
            </button>
          </>
        }
      >
        <div className={modalStyles.stack}>
          <div className={modalStyles.noticeError}>This cannot be undone.</div>
        </div>
      </PortalModal>

      <PortalModal
        open={isCreateModalOpen}
        ariaLabel="Create risk assessment"
        eyebrow="New Risk Assessment"
        title="Create your risk assessment"
        description="Add the core assessment details, then create the record."
        onClose={() => setIsCreateModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className={modalStyles.secondaryButton}
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="button"
              className={modalStyles.primaryButton}
              onClick={() => void createRiskAssessment()}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create new"}
            </button>
          </>
        }
      >
        <div className={modalStyles.stack}>
          <div className={modalStyles.field}>
            <span className={modalStyles.fieldLabel}>Title</span>
            <input
              className={modalStyles.input}
              placeholder="Example: Construction site mobilisation risk assessment"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className={modalStyles.field}>
            <span className={modalStyles.fieldLabel}>Description</span>
            <textarea
              className={modalStyles.textarea}
              rows={4}
              placeholder="Describe the scope, work area, or purpose of this assessment."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <div className={modalStyles.row}>
            <div className={modalStyles.field}>
              <span className={modalStyles.fieldLabel}>Status</span>
              <select className={modalStyles.select} value={newStatusId} onChange={(e) => setNewStatusId(e.target.value)}>
                <option value="">Select status</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatLabel(s.label)}
                  </option>
                ))}
              </select>
            </div>
            <div className={modalStyles.field}>
              <span className={modalStyles.fieldLabel}>Industry</span>
              <select className={modalStyles.select} value={newIndustryId} onChange={(e) => setNewIndustryId(e.target.value)}>
                <option value="">Select industry</option>
                {industries.map((i) => (
                  <option key={i.id} value={i.id}>
                    {formatLabel(i.label)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className={modalStyles.checkboxRow}>
            <input type="checkbox" checked={newIsPublic} onChange={(e) => setNewIsPublic(e.target.checked)} />
            <span>Public risk assessment</span>
          </label>
          {createError ? <div className={modalStyles.noticeError}>{createError}</div> : null}
        </div>
      </PortalModal>
    </>
  );
}
