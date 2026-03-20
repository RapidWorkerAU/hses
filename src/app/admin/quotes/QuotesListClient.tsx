"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAdmin } from "../lib/adminFetch";
import PortalModal from "@/components/PortalModal";
import modalStyles from "@/components/PortalModal.module.css";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import PortalTableFooter from "@/components/table/PortalTableFooter";

type QuoteRow = {
  id: string;
  quote_number: string | null;
  title: string | null;
  status: string | null;
  updated_at: string | null;
  organisations?: { name?: string | null } | null;
  contacts?: { full_name?: string | null; email?: string | null } | null;
  quote_access_codes?: Array<{
    access_code: string | null;
    created_at: string | null;
  }>;
  latest_access_code?: string | null;
  quote_versions?: Array<{
    id: string;
    version_number: number;
    subtotal_ex_gst: number | null;
    gst_amount: number | null;
    total_inc_gst: number | null;
  }>;
  has_project?: boolean;
};

const statusOptions = ["all", "draft", "published", "approved", "rejected"];

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-AU");
};

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(value);
};

const formatStatus = (value: string | null | undefined) => {
  const status = (value ?? "draft").trim();
  if (!status) return "Draft";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusPillClassName = (value: string | null | undefined) => {
  const status = (value ?? "draft").trim().toLowerCase();
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "published") {
    return "bg-sky-100 text-sky-700";
  }
  if (status === "rejected") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-amber-100 text-amber-700";
};

export default function QuotesListClient() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 7;
  const [resendModal, setResendModal] = useState<{
    open: boolean;
    quoteId?: string;
    email?: string;
    code?: string | null;
    cc?: string;
  }>({ open: false });
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [resendError, setResendError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; quote?: QuoteRow | null; isDeleting: boolean }>({
    open: false,
    quote: null,
    isDeleting: false,
  });
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    const response = await fetchAdmin(`/api/admin/quotes?${params.toString()}`);
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to load quotes.");
    } else {
      const data = (await response.json()) as { quotes: QuoteRow[]; total: number };
      setQuotes(data.quotes ?? []);
      setTotal(data.total ?? 0);
      setSelectedQuoteIds((current) => current.filter((id) => (data.quotes ?? []).some((quote) => quote.id === id)));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, [status, page]);

  if (isLoading) {
    return <TableSkeleton rows={pageSize} columns="10% 18% 14% 14% 10% 10% 8% 8% 8%" showToolbar />;
  }

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (page !== 1) {
      setPage(1);
      return;
    }
    load();
  };

  const handleCreate = async () => {
    setError(null);
    const response = await fetchAdmin("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Quote" }),
    });
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to create quote.");
      return;
    }
    const data = (await response.json()) as { id?: string };
    if (!data.id) {
      setError("Quote created but id was missing. Please refresh and try again.");
      return;
    }
    router.push(`/admin/quotes/${data.id}`);
  };

  const deleteQuote = async (event: React.MouseEvent, quote: QuoteRow) => {
    event.stopPropagation();
    if (quote.has_project) return;
    setDeleteModal({ open: true, quote, isDeleting: false });
  };

  const confirmDeleteQuote = async () => {
    if (!deleteModal.quote) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    setError(null);
    const response = await fetchAdmin(`/api/admin/quotes/${deleteModal.quote.id}`, { method: "DELETE" });
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to delete quote.");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
      return;
    }
    setDeleteModal({ open: false, quote: null, isDeleting: false });
    await load();
  };

  const deletableQuotes = quotes.filter((quote) => !quote.has_project);
  const allDeletableSelected =
    deletableQuotes.length > 0 && deletableQuotes.every((quote) => selectedQuoteIds.includes(quote.id));

  const toggleSelectAllDeletable = () => {
    if (allDeletableSelected) {
      setSelectedQuoteIds((current) => current.filter((id) => !deletableQuotes.some((quote) => quote.id === id)));
      return;
    }
    setSelectedQuoteIds((current) => {
      const next = new Set(current);
      deletableQuotes.forEach((quote) => next.add(quote.id));
      return [...next];
    });
  };

  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuoteIds((current) =>
      current.includes(quoteId) ? current.filter((id) => id !== quoteId) : [...current, quoteId]
    );
  };

  const handleBulkDeleteQuotes = async () => {
    if (!selectedQuoteIds.length) return;
    setIsBulkDeleting(true);
    setError(null);
    try {
      const results = await Promise.all(
        selectedQuoteIds.map((quoteId) => fetchAdmin(`/api/admin/quotes/${quoteId}`, { method: "DELETE" }))
      );
      const failed = results.find((response) => !response.ok);
      if (failed) {
        const message = await failed.text();
        setError(message || "Unable to delete selected quotes.");
        return;
      }
      setBulkDeleteModalOpen(false);
      setSelectedQuoteIds([]);
      await load();
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const openResend = (event: React.MouseEvent, quote: QuoteRow) => {
    event.stopPropagation();
    setResendStatus("idle");
    setResendError(null);
    setResendModal({
      open: true,
      quoteId: quote.id,
      email: quote.contacts?.email ?? "",
      code: quote.latest_access_code ?? quote.quote_access_codes?.[0]?.access_code ?? null,
      cc: "",
    });
  };

  const sendResendEmail = async () => {
    if (!resendModal.quoteId) return;
    const email = resendModal.email?.trim() ?? "";
    const code = resendModal.code?.trim() ?? "";
    if (!email) {
      setResendStatus("error");
      setResendError("Please enter a recipient email.");
      return;
    }
    if (!code) {
      setResendStatus("error");
      setResendError("No access code found for this quote.");
      return;
    }
    setResendStatus("sending");
    setResendError(null);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
    const link = `${siteUrl}/quote`;
    const response = await fetchAdmin(`/api/admin/quotes/${resendModal.quoteId}/send-access-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        cc: resendModal.cc?.trim() || null,
        access_code: code,
        link,
      }),
    });
    if (!response.ok) {
      const message = await response.text();
      setResendStatus("error");
      setResendError(message || "Unable to send email.");
      return;
    }
    setResendStatus("sent");
  };

  return (
    <div className="space-y-6">
      <div className="management-table-toolbar">
        <button
          type="button"
          className="management-bulk-delete-button"
          onClick={() => setBulkDeleteModalOpen(true)}
          disabled={!selectedQuoteIds.length || isBulkDeleting}
        >
          <img src="/icons/delete.svg" alt="" className="management-bulk-delete-button-icon" />
          <span>{isBulkDeleting ? "Deleting..." : "Bulk Delete"}</span>
        </button>
        <div className="admin-quotes-filters management-table-toolbar-actions flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
        <form onSubmit={handleSearch} className="admin-quotes-search flex flex-1 items-center gap-2">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            placeholder="Search by quote number, title, org, or contact..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Search
          </button>
        </form>
        <button
          className="rounded-lg bg-ocean px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#0b4f63]"
          type="button"
          onClick={handleCreate}
        >
          New Quote
        </button>
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="portal-table-shell">
        <table className="admin-quotes-table portal-table w-full text-left text-sm">
          <colgroup>
            <col style={{ width: "5%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr>
              <th className="management-checkbox-header">
                <input type="checkbox" checked={allDeletableSelected} onChange={toggleSelectAllDeletable} aria-label="Select all deletable quotes" />
              </th>
              <th className="px-4 py-3">Quote ID</th>
              <th className="px-4 py-3">Proposal name</th>
              <th className="px-4 py-3">Organisation</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Access code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && (
              <tr className="portal-table-empty-row">
                <td colSpan={10}>
                  No quotes found.
                </td>
              </tr>
            )}
            {quotes.map((quote) => {
                const latestVersion = quote.quote_versions?.[0];
                const latestCode =
                  quote.latest_access_code ??
                  quote.quote_access_codes?.[0]?.access_code ??
                  "-";
                return (
                  <tr
                    key={quote.id}
                    className="admin-quotes-row portal-table-row cursor-pointer"
                    onClick={() => router.push(`/admin/quotes/${quote.id}`)}
                  >
                    <td className="management-checkbox-cell" onClick={(event) => event.stopPropagation()} data-label="">
                      <input
                        type="checkbox"
                        checked={selectedQuoteIds.includes(quote.id)}
                        disabled={quote.has_project}
                        onChange={() => toggleQuoteSelection(quote.id)}
                        aria-label={`Select ${quote.quote_number ?? quote.title ?? "quote"}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900" data-label="Quote ID">
                      {quote.quote_number ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 management-cell-wrap" data-label="Proposal name">
                      {quote.title ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 management-cell-wrap" data-label="Organisation">
                      {quote.organisations?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 management-cell-wrap" data-label="Contact">
                      <div>{quote.contacts?.full_name ?? "-"}</div>
                      <div className="text-xs text-slate-400">{quote.contacts?.email ?? ""}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600" data-label="Access code">
                      {latestCode}
                    </td>
                    <td className="px-4 py-3" data-label="Status">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusPillClassName(
                          quote.status
                        )}`}
                      >
                        {formatStatus(quote.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700" data-label="Total">
                      {formatMoney(latestVersion?.total_inc_gst)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500" data-label="Updated">
                      {formatDate(quote.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right" data-label="Actions">
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        onClick={(event) => openResend(event, quote)}
                      >
                        Resend email
                      </button>
                      <button
                        type="button"
                        className={`ml-2 rounded-full border px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                          quote.has_project
                            ? "border-slate-200 text-slate-400"
                            : "border-rose-200 text-rose-700 hover:bg-rose-50"
                        }`}
                        onClick={(event) => deleteQuote(event, quote)}
                        disabled={quote.has_project}
                        title={
                          quote.has_project
                            ? "Quote already converted to a project."
                            : "Delete quote"
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>
      <PortalTableFooter
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        label="quotes"
      />

      <PortalModal
        open={bulkDeleteModalOpen}
        ariaLabel="Delete selected quotes"
        eyebrow="Bulk Delete"
        title="Delete selected quotes?"
        description={`You are about to permanently delete ${selectedQuoteIds.length} selected quote${selectedQuoteIds.length === 1 ? "" : "s"}.`}
        onClose={() => {
          if (isBulkDeleting) return;
          setBulkDeleteModalOpen(false);
        }}
        footer={
          <>
            <button
              type="button"
              className={modalStyles.secondaryButton}
              onClick={() => setBulkDeleteModalOpen(false)}
              disabled={isBulkDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={modalStyles.dangerButton}
              onClick={() => void handleBulkDeleteQuotes()}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? "Deleting..." : "Delete selected"}
            </button>
          </>
        }
      >
        <div className={modalStyles.noticeError}>This cannot be undone.</div>
      </PortalModal>

      {resendModal.open && (
        <PortalModal
          open={resendModal.open}
          ariaLabel="Resend quote email"
          eyebrow="Quote Access"
          title="Send quote access email"
          description="Send the existing access code to the recipient below."
          onClose={() => {
            setResendModal({ open: false });
            setResendStatus("idle");
            setResendError(null);
          }}
          footer={
            <>
              <button
                type="button"
                className={modalStyles.secondaryButton}
                onClick={() => {
                  setResendModal({ open: false });
                  setResendStatus("idle");
                  setResendError(null);
                }}
              >
                Close
              </button>
              <button
                type="button"
                className={modalStyles.primaryButton}
                onClick={sendResendEmail}
                disabled={resendStatus === "sending"}
              >
                {resendStatus === "sending" ? "Sending..." : "Send email"}
              </button>
            </>
          }
        >
          <div className={modalStyles.stack}>
            <div className={modalStyles.surface}>
              <p className={modalStyles.fieldLabel}>Access code</p>
              <div className="mt-2 text-base font-semibold text-slate-900">{resendModal.code ?? "-"}</div>
            </div>
            <div className={modalStyles.field}>
              <span className={modalStyles.fieldLabel}>Recipient email</span>
              <input
                type="email"
                className={modalStyles.input}
                value={resendModal.email ?? ""}
                placeholder="client@example.com"
                onChange={(event) => setResendModal((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className={modalStyles.field}>
              <span className={modalStyles.fieldLabel}>CC</span>
              <input
                type="text"
                className={modalStyles.input}
                value={resendModal.cc ?? ""}
                placeholder="manager@example.com, ops@example.com"
                onChange={(event) => setResendModal((prev) => ({ ...prev, cc: event.target.value }))}
              />
            </div>
            {resendError ? <div className={modalStyles.noticeError}>{resendError}</div> : null}
            {resendStatus === "sent" ? <div className={modalStyles.noticeSuccess}>Email sent.</div> : null}
          </div>
        </PortalModal>
      )}

      <PortalModal
        open={deleteModal.open}
        ariaLabel="Delete quote"
        eyebrow="Delete Quote"
        title="Delete this quote?"
        description={
          deleteModal.quote
            ? `You are about to permanently delete ${deleteModal.quote.quote_number ?? deleteModal.quote.title ?? "this quote"}.`
            : "You are about to permanently delete this quote."
        }
        onClose={() => setDeleteModal({ open: false, quote: null, isDeleting: false })}
        footer={
          <>
            <button
              type="button"
              className={modalStyles.secondaryButton}
              onClick={() => setDeleteModal({ open: false, quote: null, isDeleting: false })}
              disabled={deleteModal.isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={modalStyles.dangerButton}
              onClick={() => void confirmDeleteQuote()}
              disabled={deleteModal.isDeleting}
            >
              {deleteModal.isDeleting ? "Deleting..." : "Delete quote"}
            </button>
          </>
        }
      >
        <div className={modalStyles.noticeError}>This cannot be undone.</div>
      </PortalModal>
    </div>
  );
}

