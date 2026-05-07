"use client";

import { useEffect, useMemo, useState } from "react";
import PortalModal from "@/components/PortalModal";
import modalStyles from "@/components/PortalModal.module.css";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import PortalTableFooter from "@/components/table/PortalTableFooter";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";

type DocumentProjectRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  updated_at: string;
  created_at: string;
  country_code: string | null;
  document_types: { title: string | null } | null;
};

type DocumentTypeOption = {
  id: string;
  title: string;
  active_version_id: string;
};

const PAGE_SIZE = 7;

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatStatus = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const resolveDocumentProjectHref = (row: Pick<DocumentProjectRow, "id" | "status">) => {
  if (row.status === "exported") {
    return `/dashboard/document-builder/${row.id}/export`;
  }

  if (["editing", "generating", "review", "ready"].includes(row.status)) {
    return `/dashboard/document-builder/${row.id}/edit`;
  }

  return `/dashboard/document-builder/${row.id}/questions`;
};

export default function DocumentBuilderListClient() {
  const [rows, setRows] = useState<DocumentProjectRow[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newDocumentTypeId, setNewDocumentTypeId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(`/login?returnTo=${encodeURIComponent("/dashboard/document-builder")}`);
        return;
      }

      const [{ data: projectData, error: projectError }, { data: typeData, error: typeError }] = await Promise.all([
        supabaseBrowser
          .schema("docbuilder")
          .from("document_projects")
          .select("id,title,description,status,updated_at,created_at,country_code,document_types(title)")
          .order("updated_at", { ascending: false }),
        supabaseBrowser
          .schema("docbuilder")
          .from("document_types")
          .select("id,title,active_version_id")
          .eq("status", "active")
          .not("active_version_id", "is", null)
          .order("title", { ascending: true }),
      ]);

      if (projectError || typeError) {
        setError(projectError?.message || typeError?.message || "Unable to load document builder records.");
        return;
      }

      setRows(
        ((projectData ?? []) as Array<{
          id: string;
          title: string;
          description: string | null;
          status: string;
          updated_at: string;
          created_at: string;
          country_code: string | null;
          document_types: Array<{ title: string | null }> | { title: string | null } | null;
        }>).map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          updated_at: item.updated_at,
          created_at: item.created_at,
          country_code: item.country_code,
          document_types: Array.isArray(item.document_types)
            ? (item.document_types[0] ?? null)
            : item.document_types,
        }))
      );
      setDocumentTypes(
        ((typeData ?? []) as Array<{ id: string; title: string; active_version_id: string | null }>)
          .filter((item) => !!item.active_version_id)
          .map((item) => ({
            id: item.id,
            title: item.title,
            active_version_id: item.active_version_id as string,
          }))
      );
    } catch {
      setError("Unable to load document builder records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    setPage((current) => Math.min(current, totalPages));
  }, [rows.length]);

  const pagedRows = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    return {
      rows: rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
      totalPages,
      safePage,
    };
  }, [page, rows]);

  const openCreateModal = () => {
    setCreateError(null);
    setNewDocumentTypeId(documentTypes[0]?.id ?? "");
    setNewTitle("");
    setNewDescription("");
    setIsCreateModalOpen(true);
  };

  const createDocumentProject = async () => {
    const selectedType = documentTypes.find((item) => item.id === newDocumentTypeId);
    if (!selectedType) {
      setCreateError("Select a document type to continue.");
      return;
    }
    if (!newTitle.trim()) {
      setCreateError("Document name is required.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(`/login?returnTo=${encodeURIComponent("/dashboard/document-builder")}`);
        return;
      }

      const { data, error: insertError } = await supabaseBrowser
        .schema("docbuilder")
        .from("document_projects")
        .insert({
          document_type_id: selectedType.id,
          document_type_version_id: selectedType.active_version_id,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          status: "questionnaire",
          language_code: "en",
        })
        .select("id")
        .single();

      if (insertError || !data?.id) {
        setCreateError(insertError?.message || "Unable to create document project.");
        return;
      }

      window.location.assign(`/dashboard/document-builder/${data.id as string}/questions`);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={PAGE_SIZE} columns="22% 18% 22% 12% 13% 13%" showToolbar />;
  }

  return (
    <>
      <div className="management-table-toolbar">
        <div />
        <div className="management-table-toolbar-actions">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={() => void load()}
          >
            Refresh
          </button>
          <button
            type="button"
            className="rounded-lg bg-ocean px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#0b4f63]"
            onClick={openCreateModal}
          >
            Create New Document
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="portal-table-shell">
        <table className="portal-table w-full text-left text-sm">
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
          </colgroup>
          <thead>
            <tr>
              <th className="px-4 py-3">Document Name</th>
              <th className="px-4 py-3">Document Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="portal-table-empty-row">
                <td colSpan={6}>
                  No document projects have been created yet.
                </td>
              </tr>
            ) : (
              pagedRows.rows.map((row) => (
                <tr
                  key={row.id}
                  className="portal-table-row cursor-pointer"
                  onClick={() => window.location.assign(resolveDocumentProjectHref(row))}
                >
                  <td className="px-4 py-3 font-semibold text-slate-900 management-cell-wrap" data-label="Document Name">
                    {row.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600 management-cell-wrap" data-label="Document Type">
                    {row.document_types?.title ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 management-cell-wrap" data-label="Description">
                    {row.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600" data-label="Status">
                    {formatStatus(row.status)}
                  </td>
                  <td className="px-4 py-3 text-slate-600" data-label="Updated">
                    {formatDateTime(row.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-600" data-label="Created">
                    {formatDateTime(row.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PortalTableFooter
        total={rows.length}
        page={pagedRows.safePage}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        label="documents"
      />

      <PortalModal
        open={isCreateModalOpen}
        ariaLabel="Create document project"
        eyebrow="New Document"
        title="Create your document"
        description="Choose a published document type, then add the working name and description for this document project."
        onClose={() => {
          if (isCreating) return;
          setIsCreateModalOpen(false);
        }}
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
              onClick={() => void createDocumentProject()}
              disabled={isCreating || documentTypes.length === 0}
            >
              {isCreating ? "Creating..." : "Create and continue"}
            </button>
          </>
        }
      >
        <div className={modalStyles.stack}>
          <div className={modalStyles.field}>
            <span className={modalStyles.fieldLabel}>Document Type</span>
            <select
              className={modalStyles.select}
              value={newDocumentTypeId}
              onChange={(event) => setNewDocumentTypeId(event.target.value)}
              disabled={documentTypes.length === 0}
            >
              {documentTypes.length === 0 ? (
                <option value="">No published document types available</option>
              ) : null}
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.title}
                </option>
              ))}
            </select>
          </div>

          <div className={modalStyles.field}>
            <span className={modalStyles.fieldLabel}>Document Name</span>
            <input
              className={modalStyles.input}
              placeholder="Example: Dampier operations permit to work procedure"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
          </div>

          <div className={modalStyles.field}>
            <span className={modalStyles.fieldLabel}>Description</span>
            <textarea
              className={modalStyles.textarea}
              rows={4}
              placeholder="Add a short description so the user can identify this document later."
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
            />
          </div>

          {documentTypes.length === 0 ? (
            <div className={modalStyles.noticeError}>
              No published document types are available yet. Publish a document type in the admin document builder before creating live document projects.
            </div>
          ) : null}

          {createError ? <div className={modalStyles.noticeError}>{createError}</div> : null}
        </div>
      </PortalModal>
    </>
  );
}
