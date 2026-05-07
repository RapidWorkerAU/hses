"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import PortalTableFooter from "@/components/table/PortalTableFooter";

type DocumentTypeRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  updated_at: string;
  active_version_id: string | null;
  document_type_versions: Array<{
    id: string;
    version_no: number;
    status: string;
    published_at: string | null;
  }>;
};

const PAGE_SIZE = 7;

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function DocumentTypeListClient() {
  const [rows, setRows] = useState<DocumentTypeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: loadError } = await supabaseBrowser
      .schema("docbuilder")
      .from("document_types")
      .select(
        "id,slug,title,description,status,updated_at,active_version_id,document_type_versions!document_type_versions_document_type_id_fkey(id,version_no,status,published_at)",
      )
      .order("updated_at", { ascending: false });

    if (loadError) {
      setError(loadError.message || "Unable to load document types.");
      setIsLoading(false);
      return;
    }

    setRows((data ?? []) as DocumentTypeRow[]);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    setPage((current) => Math.min(current, totalPages));
  }, [rows.length]);

  const paged = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    return {
      safePage,
      rows: rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    };
  }, [page, rows]);

  if (isLoading) {
    return <TableSkeleton rows={PAGE_SIZE} columns="20% 16% 24% 12% 10% 18%" showToolbar />;
  }

  return (
    <div className="space-y-6">
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
            <col style={{ width: "20%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "18%" }} />
          </colgroup>
          <thead>
            <tr>
              <th className="px-4 py-3">Document Type</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Versions</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="portal-table-empty-row">
                <td colSpan={6}>No document types have been created yet.</td>
              </tr>
            ) : (
              paged.rows.map((row) => (
                <tr
                  key={row.id}
                  className="portal-table-row cursor-pointer"
                  onClick={() => window.location.assign(`/admin/document-builder/${row.slug}`)}
                >
                  <td className="px-4 py-3 font-semibold text-slate-900 management-cell-wrap">{row.title}</td>
                  <td className="px-4 py-3 text-slate-600">{row.slug}</td>
                  <td className="px-4 py-3 text-slate-600 management-cell-wrap">{row.description || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatStatus(row.status)}</td>
                  <td className="px-4 py-3 text-slate-600">{row.document_type_versions?.length ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(row.updated_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PortalTableFooter
        total={rows.length}
        page={paged.safePage}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        label="document types"
      />
    </div>
  );
}
