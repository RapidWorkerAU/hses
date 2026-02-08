"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAdmin } from "../lib/adminFetch";

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
};

const statusOptions = ["all", "draft", "published", "accepted", "rejected"];

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(value);
};

export default function QuotesListClient() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;
  const [resendModal, setResendModal] = useState<{
    open: boolean;
    quoteId?: string;
    email?: string;
    code?: string | null;
  }>({ open: false });
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [resendError, setResendError] = useState<string | null>(null);

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
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, [status, page]);

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

  const openResend = (event: React.MouseEvent, quote: QuoteRow) => {
    event.stopPropagation();
    setResendStatus("idle");
    setResendError(null);
    setResendModal({
      open: true,
      quoteId: quote.id,
      email: quote.contacts?.email ?? "",
      code: quote.latest_access_code ?? quote.quote_access_codes?.[0]?.access_code ?? null,
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
    const link = `${window.location.origin}/quote`;
    const response = await fetchAdmin(`/api/admin/quotes/${resendModal.quoteId}/send-access-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            className="mb-2 inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900"
            onClick={() => router.push("/sms-diagnostic/dashboard/business-admin")}
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">Quotes &amp; Proposals</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage client proposals and share access codes.
          </p>
        </div>
        <button
          className="rounded-lg bg-ocean px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#0b4f63]"
          type="button"
          onClick={handleCreate}
        >
          New Quote
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
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
      </div>
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Quote</th>
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
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  Loading quotes...
                </td>
              </tr>
            )}
            {!isLoading && quotes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  No quotes found.
                </td>
              </tr>
            )}
            {!isLoading &&
              quotes.map((quote) => {
                const latestVersion = quote.quote_versions?.[0];
                const latestCode =
                  quote.latest_access_code ??
                  quote.quote_access_codes?.[0]?.access_code ??
                  "-";
                return (
                  <tr
                    key={quote.id}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    onClick={() => router.push(`/admin/quotes/${quote.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {quote.quote_number ?? "-"}
                      </div>
                      <div className="text-xs text-slate-500">{quote.title}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {quote.organisations?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{quote.contacts?.full_name ?? "-"}</div>
                      <div className="text-xs text-slate-400">{quote.contacts?.email ?? ""}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{latestCode}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {quote.status ?? "draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatMoney(latestVersion?.total_inc_gst)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {quote.updated_at ? new Date(quote.updated_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        onClick={(event) => openResend(event, quote)}
                      >
                        Resend email
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, total)} of {total} quotes
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span>
              Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
            </span>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {resendModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">Resend quote email</h3>
            <p className="mt-2 text-sm text-slate-600">
              Send the existing access code to the recipient below.
            </p>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Access code</p>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {resendModal.code ?? "-"}
              </div>
              <label className="mt-3 block text-xs text-slate-500">
                Recipient email
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  value={resendModal.email ?? ""}
                  onChange={(event) =>
                    setResendModal((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </label>
              {resendError && <div className="mt-2 text-xs text-rose-600">{resendError}</div>}
              {resendStatus === "sent" && (
                <div className="mt-2 text-xs text-emerald-600">Email sent.</div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs"
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
                className="rounded-full px-4 py-2 text-xs font-semibold"
                style={{ backgroundColor: "#0b2f4a", color: "#ffffff" }}
                onClick={sendResendEmail}
                disabled={resendStatus === "sending"}
              >
                {resendStatus === "sending" ? "Sending..." : "Send email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
