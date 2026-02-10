"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAdmin } from "../lib/adminFetch";
import ContactOrgPicker from "./ContactOrgPicker";
import DeliverableEditor from "./DeliverableEditor";
import TotalsSidebar from "./TotalsSidebar";
import type { AdminDeliverable, AdminMilestone, AdminQuote, AdminQuoteVersion, Contact } from "./types";

type QuotePayload = {
  quote: AdminQuote;
  version: AdminQuoteVersion;
  deliverables: AdminDeliverable[];
  milestones: AdminMilestone[];
  contact?: Contact | null;
};

export default function QuoteBuilderClient({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [payload, setPayload] = useState<QuotePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSeededDeliverable, setHasSeededDeliverable] = useState(false);
  const [openDeliverableId, setOpenDeliverableId] = useState<string | null>(null);
  const [publishModal, setPublishModal] = useState<{
    open: boolean;
    code?: string;
    expiresAt?: string;
  }>({ open: false });
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishEmail, setPublishEmail] = useState("");
  const [publishCcEmail, setPublishCcEmail] = useState("");
  const [publishEmailStatus, setPublishEmailStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [publishEmailError, setPublishEmailError] = useState<string | null>(null);
  const [panelState, setPanelState] = useState({
    info: false,
    items: false,
    notes: false,
    totals: false,
  });
  const [infoStatus, setInfoStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [versionNotes, setVersionNotes] = useState({
    client_notes: "",
    assumptions: "",
    exclusions: "",
    terms: "",
  });

  const refresh = async () => {
    if (!quoteId || quoteId === "undefined") {
      setError("Missing quote id.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const response = await fetchAdmin(`/api/admin/quotes/${quoteId}`);
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to load quote.");
      setIsLoading(false);
      return;
    }
    const data = (await response.json()) as QuotePayload;
    if (data.deliverables.length === 0 && !hasSeededDeliverable) {
      setHasSeededDeliverable(true);
      await fetchAdmin("/api/admin/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote_version_id: data.version.id,
          deliverable_title: "New deliverable",
          deliverable_order: 1,
        }),
      });
      setIsLoading(false);
      await refresh();
      return;
    }

    setPayload(data);
    if (!openDeliverableId && data.deliverables.length > 0) {
      setOpenDeliverableId(data.deliverables[0].id);
    }
    setVersionNotes({
      client_notes: data.version.client_notes ?? "",
      assumptions: data.version.assumptions ?? "",
      exclusions: data.version.exclusions ?? "",
      terms: data.version.terms ?? "",
    });
    setIsLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [quoteId]);

  const syncPayload = async () => {
    const response = await fetchAdmin(`/api/admin/quotes/${quoteId}`);
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as QuotePayload;
    setPayload(data);
    setVersionNotes({
      client_notes: data.version.client_notes ?? "",
      assumptions: data.version.assumptions ?? "",
      exclusions: data.version.exclusions ?? "",
      terms: data.version.terms ?? "",
    });
  };

  const milestonesByDeliverable = useMemo(() => {
    const map: Record<string, AdminMilestone[]> = {};
    if (!payload) return map;
    payload.milestones.forEach((milestone) => {
      if (!map[milestone.deliverable_id]) {
        map[milestone.deliverable_id] = [];
      }
      map[milestone.deliverable_id].push(milestone);
    });
    return map;
  }, [payload]);

  const updateQuote = async (updates: Partial<AdminQuote>) => {
    setInfoStatus("saving");
    await fetchAdmin(`/api/admin/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setInfoStatus("saved");
    setTimeout(() => setInfoStatus("idle"), 2000);
    await syncPayload();
  };

  const updateVersion = async (updates: Partial<AdminQuoteVersion>) => {
    if (!payload) return;
    await fetchAdmin(`/api/admin/quote-versions/${payload.version.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await syncPayload();
  };

  const addDeliverable = async () => {
    if (!payload) return;
    const nextOrder = payload.deliverables.length + 1;
    const response = await fetchAdmin("/api/admin/deliverables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quote_version_id: payload.version.id,
        deliverable_title: "New deliverable",
        deliverable_order: nextOrder,
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as { deliverable?: { id?: string } };
      if (data.deliverable?.id) {
        setOpenDeliverableId(data.deliverable.id);
      }
    }
    await syncPayload();
  };

  const addMilestoneForOpen = async () => {
    if (!openDeliverableId) return;
    await fetchAdmin("/api/admin/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliverable_id: openDeliverableId,
        milestone_title: "New milestone",
      }),
    });
    await syncPayload();
  };

  const createNewVersion = async () => {
    await fetchAdmin(`/api/admin/quotes/${quoteId}/version`, { method: "POST" });
    await syncPayload();
  };

  const publishQuote = async () => {
    setPublishError(null);
    setIsPublishing(true);
    const response = await fetchAdmin(`/api/admin/quotes/${quoteId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expires_at: publishModal.expiresAt || null }),
    });
    if (response.ok) {
      const data = (await response.json()) as { access_code: string };
      setPublishModal({ open: true, code: data.access_code });
      await syncPayload();
    } else {
      const message = await response.text();
      setPublishError(message || "Unable to publish quote.");
    }
    setIsPublishing(false);
  };

  useEffect(() => {
    if (!publishModal.open) return;
    if (publishEmail) return;
    const contactEmail = payload?.contact?.email ?? "";
    if (contactEmail) {
      setPublishEmail(contactEmail);
    }
  }, [publishModal.open, payload?.contact?.email, publishEmail]);

  const sendPublishEmail = async () => {
    if (!publishModal.code) return;
    if (!publishEmail.trim()) {
      setPublishEmailStatus("error");
      setPublishEmailError("Please provide an email address.");
      return;
    }
    setPublishEmailStatus("sending");
    setPublishEmailError(null);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
    const link = `${siteUrl}/quote`;
    const response = await fetchAdmin(`/api/admin/quotes/${quoteId}/send-access-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: publishEmail.trim(),
        cc: publishCcEmail.trim() || null,
        access_code: publishModal.code,
        link,
      }),
    });
    if (!response.ok) {
      const message = await response.text();
      setPublishEmailStatus("error");
      setPublishEmailError(message || "Unable to send email.");
      return;
    }
    setPublishEmailStatus("sent");
  };

  if (isLoading || !payload) {
    return (
      <div className="text-sm text-slate-600">
        {error ? `Error: ${error}` : "Loading quote builder..."}
      </div>
    );
  }

  return (
    <div className="quote-builder">
      <div className="qb-topbar">
        <div>
          <div className="qb-title">Proposal Creator</div>
          <div className="qb-breadcrumb">
            Home / Proposal Manager / {payload.quote.quote_number}
          </div>
        </div>
        <div className="qb-actions">
          <button type="button" className="qb-btn" onClick={createNewVersion}>
            New Version
          </button>
          <button
            type="button"
            className="qb-btn qb-btn-primary"
            onClick={() => setPublishModal({ open: true })}
          >
            Save
          </button>
        </div>
      </div>

      <div className="qb-panel">
        <div className="qb-panel-header">
          <button
            type="button"
            className="qb-panel-toggle"
            aria-expanded={!panelState.info}
            onClick={() =>
              setPanelState((prev) => ({ ...prev, info: !prev.info }))
            }
          >
            <span>Information & Recipients Summary</span>
            <span className="qb-panel-toggle-icon">
              {panelState.info ? "+" : "−"}
            </span>
          </button>
        </div>
        {!panelState.info && (
          <div className="qb-panel-body qb-grid">
          <div className="qb-field">
            <label>Proposal Title</label>
            <input
              className="qb-input"
              value={payload.quote.title ?? ""}
              onChange={(event) =>
                setPayload({ ...payload, quote: { ...payload.quote, title: event.target.value } })
              }
            />
          </div>
          <div className="qb-field">
            <label>Status</label>
            <select
              className="qb-select"
              value={payload.quote.status ?? "draft"}
              onChange={(event) =>
                setPayload({
                  ...payload,
                  quote: { ...payload.quote, status: event.target.value },
                })
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="qb-field">
            <label>Version</label>
            <div className="qb-input">Version {payload.version.version_number}</div>
          </div>
          <div className="qb-field">
            <label>Actions</label>
            <button
              type="button"
              className="qb-btn"
              onClick={() =>
                updateQuote({
                  title: payload.quote.title ?? "",
                  status: payload.quote.status ?? "draft",
                })
              }
              disabled={infoStatus === "saving"}
            >
              {infoStatus === "saving"
                ? "Saving..."
                : infoStatus === "saved"
                  ? "Saved"
                  : "Save Info"}
            </button>
          </div>
        </div>
        )}
      </div>

      <ContactOrgPicker
        organisationId={payload.quote.organisation_id}
        contactId={payload.quote.contact_id}
        onOrganisationChange={(orgId) => updateQuote({ organisation_id: orgId })}
        onContactChange={(contactId) => updateQuote({ contact_id: contactId })}
      />

      <div className="qb-panel">
        <div className="qb-panel-header">
          <button
            type="button"
            className="qb-panel-toggle"
            aria-expanded={!panelState.items}
            onClick={() =>
              setPanelState((prev) => ({ ...prev, items: !prev.items }))
            }
          >
            <span>Quote Items</span>
            <span className="qb-panel-toggle-icon">
              {panelState.items ? "+" : "−"}
            </span>
          </button>
        </div>
        {!panelState.items && (
          <div className="qb-panel-body">
          <div className="qb-table-actions">
            <button
              type="button"
              className="qb-btn qb-btn-primary"
              onClick={(event) => {
                event.preventDefault();
                addDeliverable();
              }}
            >
              + Add deliverable
            </button>
          </div>
          <table className="qb-table qb-table--nested">
            <thead>
              <tr>
                <th></th>
                <th>Product name</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payload.deliverables.map((deliverable) => (
                <DeliverableEditor
                  key={deliverable.id}
                  deliverable={deliverable}
                  milestones={milestonesByDeliverable[deliverable.id] ?? []}
                  onSync={syncPayload}
                  onDelete={syncPayload}
                  isOpen={openDeliverableId === deliverable.id}
                  onToggle={() =>
                    setOpenDeliverableId((prev) =>
                      prev === deliverable.id ? null : deliverable.id
                    )
                  }
                  onOpen={() => setOpenDeliverableId(deliverable.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <div className="qb-split">
        <div className="qb-panel">
          <div className="qb-panel-header">
            <button
              type="button"
              className="qb-panel-toggle"
              aria-expanded={!panelState.notes}
              onClick={() =>
                setPanelState((prev) => ({ ...prev, notes: !prev.notes }))
              }
            >
              <span>Notes</span>
              <span className="qb-panel-toggle-icon">
                {panelState.notes ? "+" : "−"}
              </span>
            </button>
          </div>
          {!panelState.notes && (
            <div className="qb-panel-body">
            <div className="qb-field">
              <label>Client notes</label>
              <textarea
                className="qb-textarea"
                rows={4}
                value={versionNotes.client_notes}
                onChange={(event) =>
                  setVersionNotes({ ...versionNotes, client_notes: event.target.value })
                }
              />
            </div>
            <div className="qb-field">
              <label>Assumptions</label>
              <textarea
                className="qb-textarea"
                rows={3}
                value={versionNotes.assumptions}
                onChange={(event) =>
                  setVersionNotes({ ...versionNotes, assumptions: event.target.value })
                }
              />
            </div>
            <div className="qb-field">
              <label>Exclusions</label>
              <textarea
                className="qb-textarea"
                rows={3}
                value={versionNotes.exclusions}
                onChange={(event) =>
                  setVersionNotes({ ...versionNotes, exclusions: event.target.value })
                }
              />
            </div>
            <div className="qb-field">
              <label>Terms</label>
              <textarea
                className="qb-textarea"
                rows={3}
                value={versionNotes.terms}
                onChange={(event) =>
                  setVersionNotes({ ...versionNotes, terms: event.target.value })
                }
              />
            </div>
            <div className="qb-footer-actions">
              <button
                type="button"
                className="qb-btn qb-btn-primary"
                onClick={() => updateVersion(versionNotes)}
              >
                Save Notes
              </button>
            </div>
          </div>
          )}
        </div>

        <div className="qb-panel">
          <div className="qb-panel-header">
            <button
              type="button"
              className="qb-panel-toggle"
              aria-expanded={!panelState.totals}
              onClick={() =>
                setPanelState((prev) => ({ ...prev, totals: !prev.totals }))
              }
            >
              <span>Quote Totals</span>
              <span className="qb-panel-toggle-icon">
                {panelState.totals ? "+" : "−"}
              </span>
            </button>
          </div>
          {!panelState.totals && (
            <div className="qb-panel-body">
            <TotalsSidebar version={payload.version} deliverables={payload.deliverables} />
            <div className="qb-total-box">
              <div className="qb-total-row">
                <span>GST enabled</span>
                <input
                  type="checkbox"
                  checked={payload.version.gst_enabled}
                  onChange={(event) => updateVersion({ gst_enabled: event.target.checked })}
                />
              </div>
              <div className="qb-total-row qb-total-row--field">
                <span>GST rate</span>
                <input
                  type="number"
                  step="0.01"
                  className="qb-input"
                  value={payload.version.gst_rate ?? 0}
                  onChange={(event) => updateVersion({ gst_rate: Number(event.target.value) })}
                />
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {publishModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">Publish quote</h3>
            <p className="mt-2 text-sm text-slate-600">
              Generate a client access code and share the quote link.
            </p>
            {publishError && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {publishError}
              </div>
            )}
            {!publishModal.code && (
              <label className="mt-4 block text-sm text-slate-600">
                Expiry date (optional)
                <input
                  type="date"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={publishModal.expiresAt ?? ""}
                  onChange={(event) =>
                    setPublishModal((prev) => ({ ...prev, expiresAt: event.target.value }))
                  }
                />
              </label>
            )}

            {publishModal.code && (
              <>
                <div className="mt-4 space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Public link</p>
                    <div className="mt-1 text-slate-700">/quote</div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Access code</p>
                    <div className="mt-1 text-base font-semibold text-slate-900">
                      {publishModal.code}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Send access email</p>
                  <label className="mt-2 block text-xs text-slate-500">
                    Recipient email
                    <input
                      type="email"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      placeholder="client@example.com"
                      value={publishEmail}
                      onChange={(event) => {
                        setPublishEmail(event.target.value);
                        if (publishEmailStatus !== "idle") {
                          setPublishEmailStatus("idle");
                          setPublishEmailError(null);
                        }
                      }}
                    />
                  </label>
                  <label className="mt-3 block text-xs text-slate-500">
                    CC (comma separated)
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      placeholder="manager@example.com, ops@example.com"
                      value={publishCcEmail}
                      onChange={(event) => {
                        setPublishCcEmail(event.target.value);
                        if (publishEmailStatus !== "idle") {
                          setPublishEmailStatus("idle");
                          setPublishEmailError(null);
                        }
                      }}
                    />
                  </label>
                  {publishEmailError && (
                    <div className="mt-2 text-xs text-rose-600">{publishEmailError}</div>
                  )}
                  {publishEmailStatus === "sent" && (
                    <div className="mt-2 text-xs text-emerald-600">Email sent.</div>
                  )}
                  <div className="mt-3 flex items-center justify-end">
                    <button
                      type="button"
                      className="w-full rounded-full px-4 py-2 text-xs font-semibold"
                      style={{ backgroundColor: "#0b2f4a", color: "#ffffff" }}
                      onClick={sendPublishEmail}
                      disabled={publishEmailStatus === "sending"}
                    >
                      {publishEmailStatus === "sending" ? "Sending..." : "Send email"}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs"
                onClick={() => {
                  setPublishModal({ open: false });
                  setPublishEmailStatus("idle");
                  setPublishEmailError(null);
                  router.push("/admin/quotes");
                }}
              >
                Close
              </button>
              {!publishModal.code && (
                <button
                  type="button"
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                  onClick={publishQuote}
                  disabled={isPublishing}
                >
                  {isPublishing ? "Publishing..." : "Publish now"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
