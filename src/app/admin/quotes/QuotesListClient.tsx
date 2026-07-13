"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAdmin } from "../lib/adminFetch";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { IconChevronLeft, IconChevronRight, IconTrash, IconSearch, IconPlus } from "@tabler/icons-react";
import { formatMoney, formatDate } from "@/lib/formatters";

type QuoteRow = {
  id: string;
  quote_number: string | null;
  title: string | null;
  status: string | null;
  updated_at: string | null;
  organisations?: { name?: string | null } | null;
  contacts?: { full_name?: string | null; email?: string | null } | null;
  quote_access_codes?: Array<{ access_code: string | null; created_at: string | null }>;
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

const formatStatus = (value: string | null | undefined) => {
  const status = (value ?? "draft").trim();
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Draft";
};

const STATUS_PILL: Record<string, string> = {
  approved:  "bg-emerald-100 text-emerald-700",
  published: "bg-sky-100 text-sky-700",
  rejected:  "bg-rose-100 text-rose-700",
};
const getStatusPill = (value: string | null | undefined) =>
  STATUS_PILL[(value ?? "draft").trim().toLowerCase()] ?? "bg-amber-100 text-amber-700";

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
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendError, setResendError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; quote?: QuoteRow | null; isDeleting: boolean }>({
    open: false, quote: null, isDeleting: false,
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
      setSelectedQuoteIds((current) => current.filter((id) => (data.quotes ?? []).some((q) => q.id === id)));
    }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [status, page]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (page !== 1) { setPage(1); return; }
    load();
  };

  const handleCreate = async () => {
    setError(null);
    const response = await fetchAdmin("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Quote" }),
    });
    if (!response.ok) { setError((await response.text()) || "Unable to create quote."); return; }
    const data = (await response.json()) as { id?: string };
    if (!data.id) { setError("Quote created but id was missing. Please refresh and try again."); return; }
    router.push(`/admin/quotes/${data.id}`);
  };

  const deleteQuote = (event: React.MouseEvent, quote: QuoteRow) => {
    event.stopPropagation();
    if (quote.has_project) return;
    setDeleteModal({ open: true, quote, isDeleting: false });
  };

  const confirmDeleteQuote = async () => {
    if (!deleteModal.quote) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    const response = await fetchAdmin(`/api/admin/quotes/${deleteModal.quote.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError((await response.text()) || "Unable to delete quote.");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
      return;
    }
    setDeleteModal({ open: false, quote: null, isDeleting: false });
    await load();
  };

  const handleBulkDeleteQuotes = async () => {
    if (!selectedQuoteIds.length) return;
    setIsBulkDeleting(true);
    setError(null);
    try {
      const results = await Promise.all(
        selectedQuoteIds.map((id) => fetchAdmin(`/api/admin/quotes/${id}`, { method: "DELETE" }))
      );
      const failed = results.find((r) => !r.ok);
      if (failed) { setError((await failed.text()) || "Unable to delete selected quotes."); return; }
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
    if (!email) { setResendStatus("error"); setResendError("Please enter a recipient email."); return; }
    if (!code) { setResendStatus("error"); setResendError("No access code found for this quote."); return; }
    setResendStatus("sending");
    setResendError(null);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
    const response = await fetchAdmin(`/api/admin/quotes/${resendModal.quoteId}/send-access-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, cc: resendModal.cc?.trim() || null, access_code: code, link: `${siteUrl}/quote` }),
    });
    if (!response.ok) { setResendStatus("error"); setResendError((await response.text()) || "Unable to send email."); return; }
    setResendStatus("sent");
  };

  const closeResend = () => { setResendModal({ open: false }); setResendStatus("idle"); setResendError(null); };

  const deletableQuotes = quotes.filter((q) => !q.has_project);
  const allDeletableSelected = deletableQuotes.length > 0 && deletableQuotes.every((q) => selectedQuoteIds.includes(q.id));
  const toggleSelectAllDeletable = () => {
    if (allDeletableSelected) {
      setSelectedQuoteIds((current) => current.filter((id) => !deletableQuotes.some((q) => q.id === id)));
    } else {
      setSelectedQuoteIds((current) => [...new Set([...current, ...deletableQuotes.map((q) => q.id)])]);
    }
  };
  const toggleQuoteSelection = (id: string) =>
    setSelectedQuoteIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[70px]" />
                <Skeleton className="h-4 w-[130px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[70px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {selectedQuoteIds.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            iconLeft={<IconTrash size={14} />}
            onClick={() => setBulkDeleteModalOpen(true)}
            loading={isBulkDeleting}
            loadingText="Deleting..."
          >
            Delete {selectedQuoteIds.length} selected
          </Button>
        )}
        <select
          className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          ))}
        </select>
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 min-w-[200px]">
          <Input
            containerClassName="flex-1"
            className="!h-9 text-[13px]"
            iconLeft={<IconSearch size={14} />}
            placeholder="Search by quote number, title, org, or contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="neutral" size="sm">Search</Button>
        </form>
        <Button variant="primary" size="sm" iconLeft={<IconPlus size={14} />} onClick={handleCreate}>
          New Quote
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allDeletableSelected} onChange={toggleSelectAllDeletable} aria-label="Select all" />
              </th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Quote ID</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Proposal name</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Organisation</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Access code</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Updated</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {quotes.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-[13px] text-neutral-400">No quotes found.</td>
              </tr>
            )}
            {quotes.map((quote) => {
              const latestVersion = quote.quote_versions?.[0];
              const latestCode = quote.latest_access_code ?? quote.quote_access_codes?.[0]?.access_code ?? "-";
              return (
                <tr
                  key={quote.id}
                  className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/quotes/${quote.id}`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedQuoteIds.includes(quote.id)}
                      disabled={quote.has_project}
                      onChange={() => toggleQuoteSelection(quote.id)}
                      aria-label={`Select ${quote.quote_number ?? quote.title ?? "quote"}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">{quote.quote_number ?? "-"}</td>
                  <td className="px-4 py-3 text-neutral-600 max-w-[180px] truncate">{quote.title ?? "-"}</td>
                  <td className="px-4 py-3 text-neutral-600">{quote.organisations?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    <div>{quote.contacts?.full_name ?? "-"}</div>
                    <div className="text-[12px] text-neutral-400">{quote.contacts?.email ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{latestCode}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusPill(quote.status)}`}>
                      {formatStatus(quote.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{formatMoney(latestVersion?.total_inc_gst)}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(quote.updated_at)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="neutral" size="sm" onClick={(e) => openResend(e, quote)}>
                        Resend
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => deleteQuote(e, quote)}
                        disabled={quote.has_project}
                        tooltip={quote.has_project ? "Quote already converted to a project" : undefined}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[13px] text-neutral-500">
        <span>
          {total === 0
            ? "No quotes"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} quotes`}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="neutral" size="sm" iconOnly
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <IconChevronLeft size={14} />
          </Button>
          <span className="px-3 py-1 text-neutral-700">{page} / {totalPages}</span>
          <Button variant="neutral" size="sm" iconOnly
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <IconChevronRight size={14} />
          </Button>
        </div>
      </div>

      {/* Bulk delete modal */}
      <ConfirmModal
        open={bulkDeleteModalOpen}
        onClose={() => { if (!isBulkDeleting) setBulkDeleteModalOpen(false); }}
        title="Delete selected quotes?"
        description={`You are about to permanently delete ${selectedQuoteIds.length} selected quote${selectedQuoteIds.length === 1 ? "" : "s"}. This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete selected"
        cancelLabel="Cancel"
        onConfirm={() => void handleBulkDeleteQuotes()}
        loading={isBulkDeleting}
      />

      {/* Resend email modal */}
      <Modal
        open={resendModal.open}
        onClose={closeResend}
        title="Send quote access email"
        subtitle="Send the existing access code to the recipient below."
        footer={
          <>
            <Button variant="neutral" onClick={closeResend}>Close</Button>
            <Button variant="primary" onClick={sendResendEmail} loading={resendStatus === "sending"} loadingText="Sending...">
              Send email
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
            <p className="text-[12px] font-medium text-neutral-500 uppercase tracking-wider mb-1">Access code</p>
            <p className="text-[15px] font-semibold text-neutral-900">{resendModal.code ?? "-"}</p>
          </div>
          <Input
            label="Recipient email"
            type="email"
            value={resendModal.email ?? ""}
            placeholder="client@example.com"
            onChange={(e) => setResendModal((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            label="CC"
            type="text"
            value={resendModal.cc ?? ""}
            placeholder="manager@example.com, ops@example.com"
            onChange={(e) => setResendModal((prev) => ({ ...prev, cc: e.target.value }))}
          />
          {resendError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{resendError}</div>
          )}
          {resendStatus === "sent" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">Email sent successfully.</div>
          )}
        </div>
      </Modal>

      {/* Delete single quote modal */}
      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, quote: null, isDeleting: false })}
        title="Delete this quote?"
        description={`You are about to permanently delete ${deleteModal.quote?.quote_number ?? deleteModal.quote?.title ?? "this quote"}. This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete quote"
        cancelLabel="Cancel"
        onConfirm={() => void confirmDeleteQuote()}
        loading={deleteModal.isDeleting}
      />
    </div>
  );
}
