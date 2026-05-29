"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAdmin } from "../lib/adminFetch";
import PortalModal from "@/components/PortalModal";
import modalStyles from "@/components/PortalModal.module.css";
import { DetailPageSkeleton } from "@/components/loading/HsesLoaders";
import {
  DEFAULT_QUOTE_EMAIL_TEMPLATE,
  QUOTE_EMAIL_PLACEHOLDERS,
  renderQuoteEmailTemplate,
} from "@/lib/quote/emailTemplate";
import { getQuoteFileTypeLabel } from "@/lib/quote/fileTypeLabel";
import ContactOrgPicker from "./ContactOrgPicker";
import DeliverableEditor, { type DeliverableEditorHandle } from "./DeliverableEditor";
import TotalsSidebar from "./TotalsSidebar";
import type {
  AdminDeliverable,
  AdminMilestone,
  AdminQuote,
  AdminQuoteAttachment,
  AdminQuoteVersion,
  Contact,
} from "./types";

type QuoteBuilderSectionKey = "info" | "items" | "notes" | "totals" | "attachments";

const quoteBuilderSections: Array<{
  key: QuoteBuilderSectionKey;
  label: string;
  description: string;
}> = [
  {
    key: "info",
    label: "Information & Contacts",
    description: "Proposal title, status, organisation, and contact details.",
  },
  {
    key: "items",
    label: "Quote Items",
    description: "Deliverables, milestone breakdowns, quantities, pricing, and line totals.",
  },
  {
    key: "notes",
    label: "Notes",
    description: "Client notes, assumptions, exclusions, and terms.",
  },
  {
    key: "totals",
    label: "Quote Totals",
    description: "Review total hours, GST settings, and proposal totals.",
  },
  {
    key: "attachments",
    label: "Attachments",
    description: "Upload, view, and remove supporting proposal files.",
  },
];

const formatFileSize = (value: number | null | undefined) => {
  if (!value || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

type QuotePayload = {
  quote: AdminQuote;
  version: AdminQuoteVersion;
  deliverables: AdminDeliverable[];
  milestones: AdminMilestone[];
  contact?: Contact | null;
  attachments: AdminQuoteAttachment[];
};

export default function QuoteBuilderClient({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const deliverableEditorRefs = useRef(new Map<string, DeliverableEditorHandle>());
  const [payload, setPayload] = useState<QuotePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [publishEmailTemplate, setPublishEmailTemplate] = useState(DEFAULT_QUOTE_EMAIL_TEMPLATE);
  const [showPublishEmailPreview, setShowPublishEmailPreview] = useState(false);
  const [activeSection, setActiveSection] = useState<QuoteBuilderSectionKey>("info");
  const [infoStatus, setInfoStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [notesStatus, setNotesStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [versionNotes, setVersionNotes] = useState({
    client_notes: "",
    assumptions: "",
    exclusions: "",
    terms: "",
  });
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentStatus, setAttachmentStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [attachmentInputKey, setAttachmentInputKey] = useState(0);
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false);
  const panelState = {
    info: activeSection !== "info",
    items: activeSection !== "items",
    notes: activeSection !== "notes",
    totals: activeSection !== "totals",
    attachments: activeSection !== "attachments",
  };
  const setPanelState = (updater: (previous: typeof panelState) => typeof panelState) => {
    const nextState = updater(panelState);
    const nextActiveSection = (Object.keys(nextState) as Array<keyof typeof nextState>).find(
      (key) => !nextState[key]
    );

    if (nextActiveSection) {
      setActiveSection(nextActiveSection);
    }
  };

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

  const saveNotes = async () => {
    setNotesStatus("saving");
    await updateVersion(versionNotes);
    setNotesStatus("saved");
    setTimeout(() => setNotesStatus("idle"), 2000);
  };

  const saveOtherEditableDeliverables = async (deliverableId: string) => {
    if (!payload) return;
    const saveResults = await Promise.all(
      payload.deliverables
        .filter((deliverable) => deliverable.id !== deliverableId)
        .map((deliverable) =>
          deliverableEditorRefs.current.get(deliverable.id)?.saveIfEditing() ?? Promise.resolve(false)
        )
    );

    if (saveResults.some(Boolean)) {
      await syncPayload();
    }
  };

  const addDeliverable = async () => {
    if (!payload || isAddingDeliverable) return;
    setIsAddingDeliverable(true);
    try {
      const saveResults = await Promise.all(
        payload.deliverables.map((deliverable) =>
          deliverableEditorRefs.current.get(deliverable.id)?.saveIfEditing() ?? Promise.resolve(false)
        )
      );
      if (saveResults.some(Boolean)) {
        await syncPayload();
      }

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
    } finally {
      setIsAddingDeliverable(false);
    }
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

  useEffect(() => {
    if (!publishModal.open) return;
    setPublishEmailTemplate(DEFAULT_QUOTE_EMAIL_TEMPLATE);
    setShowPublishEmailPreview(false);
  }, [publishModal.open, publishModal.code]);

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
        message_template: publishEmailTemplate,
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

  const uploadAttachments = async () => {
    if (!attachmentFiles.length) {
      setAttachmentStatus("error");
      setAttachmentError("Select at least one attachment.");
      return;
    }

    setAttachmentStatus("uploading");
    setAttachmentError(null);
    const formData = new FormData();
    attachmentFiles.forEach((file) => formData.append("files", file));
    const response = await fetchAdmin(`/api/admin/quotes/${quoteId}/attachments`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      setAttachmentStatus("error");
      setAttachmentError(message || "Unable to upload attachments.");
      return;
    }

    setAttachmentFiles([]);
    setAttachmentInputKey((value) => value + 1);
    setAttachmentStatus("idle");
    await syncPayload();
  };

  const deleteAttachment = async (attachmentId: string) => {
    setDeletingAttachmentId(attachmentId);
    setAttachmentError(null);
    const response = await fetchAdmin(`/api/admin/quote-attachments/${attachmentId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const message = await response.text();
      setAttachmentError(message || "Unable to delete attachment.");
    } else {
      await syncPayload();
    }
    setDeletingAttachmentId(null);
  };

  if (isLoading || !payload) {
    if (error) {
      return <div className="text-sm text-slate-600">Error: {error}</div>;
    }
    return <DetailPageSkeleton />;
  }

  const previewDate = new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const previewLink = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "/quote").replace(/\/$/, "")}/quote`.replace(
    /^\/quote\/quote$/,
    "/quote"
  );
  const publishEmailPreview = renderQuoteEmailTemplate(publishEmailTemplate, {
    organisationName: null,
    proposalTitle: payload.quote.title ?? "Proposal",
    proposalDate: previewDate,
    accessCode: publishModal.code ?? "ACCESS-CODE",
    link: previewLink,
  });
  const activeSectionMeta =
    quoteBuilderSections.find((section) => section.key === activeSection) ?? quoteBuilderSections[0];

  return (
    <div className="quote-builder">
      <div className="qb-builder-layout">
        <aside className="qb-section-menu" aria-label="Quote builder sections">
          <div className="qb-section-menu-label">Sections</div>
          <div className="qb-section-menu-title">Quote Builder</div>
          <div className="qb-section-menu-list">
            {quoteBuilderSections.map((section) => (
              <button
                key={section.key}
                type="button"
                className={`qb-section-menu-item ${activeSection === section.key ? "is-active" : ""}`}
                onClick={() => setActiveSection(section.key)}
              >
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="qb-builder-content">
          <div className="qb-section-content-header">
            <div className="qb-section-content-copy">
              <p className="qb-section-eyebrow">Proposal Section</p>
              <h2>{activeSectionMeta.label}</h2>
              <p>Home / Proposal Manager / {payload.quote.quote_number}</p>
            </div>
            <div className="qb-section-header-actions">
              {activeSection === "items" ? (
                <button
                  type="button"
                  className="qb-btn qb-btn-outline-dark qb-add-deliverable-header-btn"
                  onClick={() => void addDeliverable()}
                  disabled={isAddingDeliverable}
                  aria-busy={isAddingDeliverable}
                >
                  <span className="qb-add-deliverable-plus" aria-hidden="true">
                    +
                  </span>
                  <span>{isAddingDeliverable ? "Adding..." : "Add deliverable"}</span>
                </button>
              ) : null}
              <button
                type="button"
                className="qb-btn qb-btn-primary qb-publish-header-btn"
                onClick={() => setPublishModal({ open: true })}
              >
                Publish quote
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
            <span>Information & Contacts</span>
            <span className="qb-panel-toggle-icon">
              {panelState.info ? "+" : "−"}
            </span>
          </button>
        </div>
        {!panelState.info && (
          <div className="qb-panel-body qb-info-form">
            <div className="qb-info-grid">
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
              <ContactOrgPicker
                organisationId={payload.quote.organisation_id}
                contactId={payload.quote.contact_id}
                onOrganisationChange={(orgId) =>
                  setPayload((current) =>
                    current
                      ? { ...current, quote: { ...current.quote, organisation_id: orgId } }
                      : current
                  )
                }
                onContactChange={(contactId) =>
                  setPayload((current) =>
                    current
                      ? { ...current, quote: { ...current.quote, contact_id: contactId } }
                      : current
                  )
                }
                embedded
                inline
              />
            </div>
            <div className="qb-info-actions">
              <button
                type="button"
                className="qb-btn qb-btn-primary qb-info-save-btn"
                onClick={() =>
                  updateQuote({
                    title: payload.quote.title ?? "",
                    status: payload.quote.status ?? "draft",
                    organisation_id: payload.quote.organisation_id,
                    contact_id: payload.quote.contact_id,
                  })
                }
                disabled={infoStatus === "saving"}
                aria-busy={infoStatus === "saving"}
              >
                {infoStatus === "saving"
                  ? "Saving..."
                  : infoStatus === "saved"
                    ? "Saved"
                    : "Save Information"}
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
          <div className="qb-panel-body qb-panel-body--quote-items">
          <table className="qb-table qb-table--nested qb-table--quote-items">
            <thead>
              <tr>
                <th>#</th>
                <th>Deliverable</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payload.deliverables.length === 0 ? (
                <tr className="qb-empty-row qb-empty-row--deliverables">
                  <td colSpan={8} className="qb-empty-cell">
                    <strong>No deliverables yet.</strong>
                    <span>Use Add deliverable in the header to add your first deliverable row.</span>
                  </td>
                </tr>
              ) : (
                payload.deliverables.map((deliverable) => (
                  <DeliverableEditor
                    key={deliverable.id}
                    ref={(editor) => {
                      if (editor) {
                        deliverableEditorRefs.current.set(deliverable.id, editor);
                      } else {
                        deliverableEditorRefs.current.delete(deliverable.id);
                      }
                    }}
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
                    onBeforeEdit={saveOtherEditableDeliverables}
                  />
                ))
              )}
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
                onClick={() => void saveNotes()}
                disabled={notesStatus === "saving"}
                aria-busy={notesStatus === "saving"}
              >
                {notesStatus === "saving" ? "Saving..." : notesStatus === "saved" ? "Saved" : "Save Notes"}
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

      <div className="qb-panel">
        <div className="qb-panel-header">
          <button
            type="button"
            className="qb-panel-toggle"
            aria-expanded={!panelState.attachments}
            onClick={() =>
              setPanelState((prev) => ({ ...prev, attachments: !prev.attachments }))
            }
          >
            <span>Attachments</span>
            <span className="qb-panel-toggle-icon">
              {panelState.attachments ? "+" : "−"}
            </span>
          </button>
        </div>
        {!panelState.attachments && (
          <div className="qb-panel-body">
            <div className="qb-field">
              <label>Upload attachments</label>
              <div className="qb-field-row qb-field-row--stack">
                <input
                  key={attachmentInputKey}
                  type="file"
                  className="qb-input"
                  multiple
                  onChange={(event) => {
                    setAttachmentFiles(Array.from(event.target.files ?? []));
                    setAttachmentStatus("idle");
                    setAttachmentError(null);
                  }}
                />
                <button
                  type="button"
                  className="qb-btn qb-btn-primary qb-btn--fixed"
                  onClick={() => void uploadAttachments()}
                  disabled={attachmentStatus === "uploading"}
                  aria-busy={attachmentStatus === "uploading"}
                >
                  {attachmentStatus === "uploading" ? "Uploading..." : "Upload attachments"}
                </button>
              </div>
              {attachmentFiles.length > 0 ? (
                <div className="qb-muted mt-2">
                  {attachmentFiles.length} file{attachmentFiles.length === 1 ? "" : "s"} selected
                </div>
              ) : null}
              {attachmentError ? <div className="qb-error-note">{attachmentError}</div> : null}
            </div>

            <table className="qb-table qb-table--attachments">
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payload.attachments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="qb-empty-cell">
                      No attachments added yet.
                    </td>
                  </tr>
                ) : (
                  payload.attachments.map((attachment) => (
                    <tr key={attachment.id}>
                      <td>{attachment.file_name}</td>
                      <td>{getQuoteFileTypeLabel(attachment.content_type, attachment.file_name)}</td>
                      <td>{formatFileSize(attachment.file_size)}</td>
                      <td>{new Date(attachment.created_at).toLocaleString()}</td>
                      <td>
                        <div className="qb-row-actions">
                          <a
                            className="qb-btn"
                            href={attachment.public_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            className="qb-btn"
                            onClick={() => void deleteAttachment(attachment.id)}
                            disabled={deletingAttachmentId === attachment.id}
                            aria-busy={deletingAttachmentId === attachment.id}
                          >
                            {deletingAttachmentId === attachment.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </div>
      </div>

      {publishModal.open && (
        <PortalModal
          open={publishModal.open}
          ariaLabel="Publish quote"
          eyebrow="Quote Publish"
          title="Publish quote"
          description="Generate a client access code and share the quote link."
          onClose={() => {
            setPublishModal({ open: false });
            setPublishEmailStatus("idle");
            setPublishEmailError(null);
            router.push("/admin/quotes");
          }}
          footer={
            <>
              <button
                type="button"
                className={modalStyles.secondaryButton}
                onClick={() => {
                  setPublishModal({ open: false });
                  setPublishEmailStatus("idle");
                  setPublishEmailError(null);
                  router.push("/admin/quotes");
                }}
              >
                Close
              </button>
              {!publishModal.code ? (
                <button
                  type="button"
                  className={`${modalStyles.primaryButton} qb-button-loading`}
                  onClick={publishQuote}
                  disabled={isPublishing}
                  aria-busy={isPublishing}
                >
                  {isPublishing ? "Publishing..." : "Publish now"}
                </button>
              ) : null}
            </>
          }
        >
          <div className={modalStyles.stack}>
            {publishError ? <div className={modalStyles.noticeError}>{publishError}</div> : null}
            {!publishModal.code ? (
              <div className={modalStyles.field}>
                <span className={modalStyles.fieldLabel}>Expiry date</span>
                <input
                  type="date"
                  className={modalStyles.input}
                  value={publishModal.expiresAt ?? ""}
                  onChange={(event) => setPublishModal((prev) => ({ ...prev, expiresAt: event.target.value }))}
                />
              </div>
            ) : null}

            {publishModal.code ? (
              <>
                <div className={modalStyles.surface}>
                  <div className={modalStyles.stack}>
                    <div>
                      <p className={modalStyles.fieldLabel}>Public link</p>
                      <div className="mt-2 text-slate-700">/quote</div>
                    </div>
                    <div>
                      <p className={modalStyles.fieldLabel}>Access code</p>
                      <div className="mt-2 text-base font-semibold text-slate-900">{publishModal.code}</div>
                    </div>
                  </div>
                </div>
                <div className={modalStyles.stack}>
                  <div className={modalStyles.field}>
                    <span className={modalStyles.fieldLabel}>Recipient email</span>
                    <input
                      type="email"
                      className={modalStyles.input}
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
                  </div>
                  <div className={modalStyles.field}>
                    <span className={modalStyles.fieldLabel}>CC</span>
                    <input
                      type="text"
                      className={modalStyles.input}
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
                  </div>
                  <div className={modalStyles.field}>
                    <div className="qb-inline-header">
                      <span className={modalStyles.fieldLabel}>Email message</span>
                      <button
                        type="button"
                        className="qb-btn qb-btn--outline"
                        onClick={() => setShowPublishEmailPreview((prev) => !prev)}
                      >
                        {showPublishEmailPreview ? "Edit" : "Preview"}
                      </button>
                    </div>
                    {showPublishEmailPreview ? (
                      <div
                        className={`${modalStyles.surface} qb-email-preview`}
                        dangerouslySetInnerHTML={{ __html: publishEmailPreview.html }}
                      />
                    ) : (
                      <textarea
                        className={modalStyles.textarea}
                        rows={12}
                        value={publishEmailTemplate}
                        onChange={(event) => {
                          setPublishEmailTemplate(event.target.value);
                          if (publishEmailStatus !== "idle") {
                            setPublishEmailStatus("idle");
                            setPublishEmailError(null);
                          }
                        }}
                      />
                    )}
                    <div className="qb-placeholder-list">
                      {QUOTE_EMAIL_PLACEHOLDERS.map((placeholder) => (
                        <span key={placeholder} className="qb-placeholder-chip">
                          {placeholder}
                        </span>
                      ))}
                    </div>
                    <div className="qb-muted">
                      This edit only applies to this email. Keep <code>{"{{access_code}}"}</code> and{" "}
                      <code>{"{{quote_link}}"}</code> in the message.
                    </div>
                  </div>
                  {publishEmailError ? <div className={modalStyles.noticeError}>{publishEmailError}</div> : null}
                  {publishEmailStatus === "sent" ? <div className={modalStyles.noticeSuccess}>Email sent.</div> : null}
                  <button
                    type="button"
                    className={`${modalStyles.primaryButton} qb-button-loading`}
                    onClick={sendPublishEmail}
                    disabled={publishEmailStatus === "sending"}
                    aria-busy={publishEmailStatus === "sending"}
                  >
                    {publishEmailStatus === "sending" ? "Sending..." : "Send email"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </PortalModal>
      )}
    </div>
  );
}
