"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAdmin } from "../lib/adminFetch";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  DEFAULT_QUOTE_EMAIL_TEMPLATE,
  QUOTE_EMAIL_PLACEHOLDERS,
  renderQuoteEmailTemplate,
} from "@/lib/quote/emailTemplate";
import { getQuoteFileTypeLabel } from "@/lib/quote/fileTypeLabel";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { formatFileSize } from "@/lib/formatters";
import ContactOrgPicker from "./ContactOrgPicker";
import DeliverableEditor, { type DeliverableEditorHandle } from "./DeliverableEditor";
import TotalsSidebar from "./TotalsSidebar";
import { cn } from "@/lib/utils";
import type {
  AdminDeliverable,
  AdminMilestone,
  AdminQuote,
  AdminQuoteAttachment,
  AdminQuoteVersion,
  Contact,
} from "./types";

type QuoteBuilderSectionKey = "info" | "items" | "notes" | "totals" | "attachments";

const quoteBuilderSections: Array<{ key: QuoteBuilderSectionKey; label: string }> = [
  { key: "info",        label: "Information & Contacts" },
  { key: "items",       label: "Quote Items" },
  { key: "notes",       label: "Notes" },
  { key: "totals",      label: "Quote Totals" },
  { key: "attachments", label: "Attachments" },
];

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
  const [publishModal, setPublishModal] = useState<{ open: boolean; code?: string; expiresAt?: string }>({ open: false });
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishEmail, setPublishEmail] = useState("");
  const [publishCcEmail, setPublishCcEmail] = useState("");
  const [publishEmailStatus, setPublishEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [publishEmailError, setPublishEmailError] = useState<string | null>(null);
  const [publishEmailTemplate, setPublishEmailTemplate] = useState(DEFAULT_QUOTE_EMAIL_TEMPLATE);
  const [showPublishEmailPreview, setShowPublishEmailPreview] = useState(false);
  const [activeSection, setActiveSection] = useState<QuoteBuilderSectionKey>("info");
  const [infoStatus, setInfoStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [notesStatus, setNotesStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [versionNotes, setVersionNotes] = useState({ client_notes: "", assumptions: "", exclusions: "", terms: "" });
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentStatus, setAttachmentStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [attachmentInputKey, setAttachmentInputKey] = useState(0);
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false);
  const [activeSaveStatus, setActiveSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

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
    setVersionNotes({
      client_notes: data.version.client_notes ?? "",
      assumptions: data.version.assumptions ?? "",
      exclusions: data.version.exclusions ?? "",
      terms: data.version.terms ?? "",
    });
    setIsLoading(false);
  };

  useEffect(() => { refresh(); }, [quoteId]);

  const syncPayload = async () => {
    const response = await fetchAdmin(`/api/admin/quotes/${quoteId}`);
    if (!response.ok) return;
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
      if (!map[milestone.deliverable_id]) map[milestone.deliverable_id] = [];
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
        .filter((d) => d.id !== deliverableId)
        .map((d) => deliverableEditorRefs.current.get(d.id)?.saveIfEditing() ?? Promise.resolve(false))
    );
    if (saveResults.some(Boolean)) await syncPayload();
  };

  const addDeliverable = async () => {
    if (!payload || isAddingDeliverable) return;
    setIsAddingDeliverable(true);
    try {
      const saveResults = await Promise.all(
        payload.deliverables.map((d) => deliverableEditorRefs.current.get(d.id)?.saveIfEditing() ?? Promise.resolve(false))
      );
      if (saveResults.some(Boolean)) await syncPayload();

      const nextOrder = payload.deliverables.length + 1;
      const response = await fetchAdmin("/api/admin/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_version_id: payload.version.id, deliverable_title: "New deliverable", deliverable_order: nextOrder }),
      });
      if (response.ok) setOpenDeliverableId(null);
      await syncPayload();
    } finally {
      setIsAddingDeliverable(false);
    }
  };

  const saveAllEditableDeliverables = async () => {
    if (!payload) return;
    const saveResults = await Promise.all(
      payload.deliverables.map((d) => deliverableEditorRefs.current.get(d.id)?.saveIfEditing() ?? Promise.resolve(false))
    );
    if (saveResults.some(Boolean)) await syncPayload();
  };

  const saveActiveSection = async () => {
    if (!payload || activeSaveStatus === "saving") return;
    if (activeSection === "totals" || activeSection === "attachments") return;

    setActiveSaveStatus("saving");
    try {
      if (activeSection === "info") {
        await updateQuote({
          title: payload.quote.title ?? "",
          status: payload.quote.status ?? "draft",
          organisation_id: payload.quote.organisation_id,
          contact_id: payload.quote.contact_id,
        });
      } else if (activeSection === "notes") {
        await saveNotes();
      } else if (activeSection === "items") {
        await saveAllEditableDeliverables();
      }
      setActiveSaveStatus("saved");
      setTimeout(() => setActiveSaveStatus("idle"), 2000);
    } finally {
      setActiveSaveStatus((current) => (current === "saving" ? "idle" : current));
    }
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
    if (!publishModal.open || publishEmail) return;
    const contactEmail = payload?.contact?.email ?? "";
    if (contactEmail) setPublishEmail(contactEmail);
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
      body: JSON.stringify({ to: publishEmail.trim(), cc: publishCcEmail.trim() || null, access_code: publishModal.code, link, message_template: publishEmailTemplate }),
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
    const response = await fetchAdmin(`/api/admin/quotes/${quoteId}/attachments`, { method: "POST", body: formData });
    if (!response.ok) {
      const message = await response.text();
      setAttachmentStatus("error");
      setAttachmentError(message || "Unable to upload attachments.");
      return;
    }
    setAttachmentFiles([]);
    setAttachmentInputKey((v) => v + 1);
    setAttachmentStatus("idle");
    await syncPayload();
  };

  const deleteAttachment = async (attachmentId: string) => {
    setDeletingAttachmentId(attachmentId);
    setAttachmentError(null);
    const response = await fetchAdmin(`/api/admin/quote-attachments/${attachmentId}`, { method: "DELETE" });
    if (!response.ok) {
      const message = await response.text();
      setAttachmentError(message || "Unable to delete attachment.");
    } else {
      await syncPayload();
    }
    setDeletingAttachmentId(null);
  };

  if (isLoading || !payload) {
    return (
      <div className="flex h-full w-full">
        <aside className="w-[220px] flex-shrink-0 border-r border-neutral-100 bg-white hidden md:block">
          <div className="p-4 flex flex-col gap-2">
            <Skeleton className="h-3 w-16 mb-2" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        </aside>
        <div className="flex-1 p-6 flex flex-col gap-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
          ) : (
            <>
              <Skeleton className="h-5 w-48" />
              <div className="rounded-xl border border-neutral-200 bg-white p-5 flex flex-col gap-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9" />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const previewDate = new Intl.DateTimeFormat("en-AU", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
  const previewLink = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "/quote").replace(/\/$/, "")}/quote`.replace(/^\/quote\/quote$/, "/quote");
  const canViewPublicQuote = payload.quote.status === "published" && Boolean(payload.quote.access_code);
  const publicQuoteHref = payload.quote.access_code
    ? `/quote?code=${encodeURIComponent(payload.quote.access_code)}`
    : "/quote";
  const publicQuoteTooltip =
    payload.quote.status !== "published"
      ? "Publish this quote first"
      : payload.quote.access_code
        ? undefined
        : "No access code found";
  const canSaveActiveSection = activeSection !== "totals" && activeSection !== "attachments";
  const saveTooltip =
    activeSection === "totals"
      ? "Totals autosave"
      : activeSection === "attachments"
        ? "Use the attachment actions"
        : undefined;
  const publishEmailPreview = renderQuoteEmailTemplate(publishEmailTemplate, {
    organisationName: null,
    proposalTitle: payload.quote.title ?? "Proposal",
    proposalDate: previewDate,
    accessCode: publishModal.code ?? "ACCESS-CODE",
    link: previewLink,
  });

  const sidebarSecondaryActionClass =
    "inline-flex h-8 w-full items-center justify-center gap-[6px] rounded-md border-[0.5px] border-neutral-200 bg-neutral-100 px-3 text-[13px] font-medium text-neutral-700 transition-all duration-150 hover:bg-neutral-200 active:scale-[0.98]";
  const sidebarSecondaryDisabledClass =
    "inline-flex h-8 w-full cursor-not-allowed items-center justify-center gap-[6px] rounded-md border-[0.5px] border-neutral-200 bg-neutral-50 px-3 text-[13px] font-medium text-neutral-500 opacity-80";
  const sidebarPrimaryActionClass =
    "inline-flex h-8 w-full items-center justify-center gap-[6px] rounded-md border-[0.5px] border-neutral-900 bg-neutral-900 px-3 text-[13px] font-medium text-white transition-all duration-150 hover:bg-neutral-800 active:scale-[0.98]";

  return (
    <div className="flex min-h-full w-full">
      {/* White secondary sidebar */}
      <aside className="w-[220px] flex-shrink-0 border-r border-neutral-100 bg-white hidden md:block overflow-y-auto">
        <div className="p-4">
          <div className="flex flex-col gap-2">
            {canViewPublicQuote ? (
              <a
                href={publicQuoteHref}
                className={sidebarSecondaryActionClass}
              >
                View public quote
              </a>
            ) : (
              <button
                type="button"
                disabled
                title={publicQuoteTooltip}
                className={sidebarSecondaryDisabledClass}
              >
                View public quote
              </button>
            )}
            <button
              type="button"
              className={cn(
                sidebarSecondaryActionClass,
                (!canSaveActiveSection || activeSaveStatus === "saving") && "cursor-not-allowed bg-neutral-50 text-neutral-500 hover:bg-neutral-50"
              )}
              onClick={() => void saveActiveSection()}
              disabled={!canSaveActiveSection || activeSaveStatus === "saving"}
              title={saveTooltip}
            >
              {activeSaveStatus === "saving" ? "Saving..." : activeSaveStatus === "saved" ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              className={sidebarPrimaryActionClass}
              onClick={() => setPublishModal({ open: true })}
            >
              Publish quote
            </button>
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Sections</p>
            <p className="text-[13px] font-semibold text-neutral-700 mb-3">{payload.quote.quote_number ?? "Quote Builder"}</p>
            <nav className="flex flex-col gap-0.5">
              {quoteBuilderSections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-[13px] text-left transition-colors",
                    activeSection === section.key
                      ? "bg-neutral-100 text-neutral-900 font-medium"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-3 border-t border-neutral-100 pt-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Live totals</p>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50/70 px-2.5 py-1.5 [&_.flex]:py-1.5 [&_span]:text-[11px] [&_strong]:text-[11px]">
              <TotalsSidebar version={payload.version} deliverables={payload.deliverables} />
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 bg-[#f7f8fa] p-6 flex flex-col gap-3">
        <div className="w-full max-w-[1500px] self-stretch flex flex-col items-stretch gap-3">
        {/* Section header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">Proposal Section</p>
            <h2 className="text-[18px] font-semibold text-neutral-900">
              {quoteBuilderSections.find((s) => s.key === activeSection)?.label}
            </h2>
            <p className="text-[13px] text-neutral-500 mt-0.5">{payload.quote.quote_number}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeSection === "items" && (
              <Button
                variant="neutral"
                onClick={() => void addDeliverable()}
                disabled={isAddingDeliverable}
                loading={isAddingDeliverable}
                loadingText="Adding..."
              >
                <IconPlus size={14} />
                Add deliverable
              </Button>
            )}
          </div>
        </div>

        {/* ── Information & Contacts ── */}
        {activeSection === "info" && (
          <div className="w-full min-w-0 self-stretch rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="p-5 flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Input
                    label="Proposal title"
                    value={payload.quote.title ?? ""}
                    onChange={(e) => setPayload({ ...payload, quote: { ...payload.quote, title: e.target.value } })}
                  />
                </div>
                <div>
                  <Select
                    label="Status"
                    value={payload.quote.status ?? "draft"}
                    onChange={(e) => setPayload({ ...payload, quote: { ...payload.quote, status: e.target.value } })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                </div>
              </div>
              <div className="pt-1">
                <ContactOrgPicker
                  organisationId={payload.quote.organisation_id}
                  contactId={payload.quote.contact_id}
                  onOrganisationChange={(orgId) =>
                    setPayload((current) =>
                      current ? { ...current, quote: { ...current.quote, organisation_id: orgId } } : current
                    )
                  }
                  onContactChange={(contactId) =>
                    setPayload((current) =>
                      current ? { ...current, quote: { ...current.quote, contact_id: contactId } } : current
                    )
                  }
                  embedded
                  inline
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end gap-3">
              {infoStatus === "saved" && <span className="text-[13px] text-accent-500">Saved</span>}
              <Button
                variant="primary"
                onClick={() => void updateQuote({ title: payload.quote.title ?? "", status: payload.quote.status ?? "draft", organisation_id: payload.quote.organisation_id, contact_id: payload.quote.contact_id })}
                disabled={infoStatus === "saving"}
                loading={infoStatus === "saving"}
                loadingText="Saving..."
              >
                Save information
              </Button>
            </div>
          </div>
        )}

        {/* ── Quote Items ── */}
        {activeSection === "items" && (
          <div className="w-full">
            {payload.deliverables.length === 0 ? (
              <div className="w-full rounded-xl border border-dashed border-neutral-200 bg-white px-5 py-10 text-center">
                <p className="text-[14px] font-medium text-neutral-800">Start with your first deliverable.</p>
                <p className="mt-1 text-[13px] text-neutral-500">Use the &quot;Add deliverable&quot; button above to build the proposal items.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                <table className="w-full text-[13px]">
                  <colgroup>
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "27%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Title</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Description</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Type</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Rate</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Hrs</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Subtotal</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Milestones</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {payload.deliverables.map((deliverable) => (
                      <DeliverableEditor
                        key={deliverable.id}
                        ref={(editor) => {
                          if (editor) deliverableEditorRefs.current.set(deliverable.id, editor);
                          else deliverableEditorRefs.current.delete(deliverable.id);
                        }}
                        deliverable={deliverable}
                        milestones={milestonesByDeliverable[deliverable.id] ?? []}
                        onSync={syncPayload}
                        onDelete={syncPayload}
                        isOpen={openDeliverableId === deliverable.id}
                        onToggle={() => setOpenDeliverableId((prev) => prev === deliverable.id ? null : deliverable.id)}
                        onOpen={() => setOpenDeliverableId(deliverable.id)}
                        onBeforeEdit={saveOtherEditableDeliverables}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Notes ── */}
        {activeSection === "notes" && (
          <div className="w-full rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="p-5 flex flex-col gap-4">
              {(["client_notes", "assumptions", "exclusions", "terms"] as const).map((field) => (
                <Textarea
                  key={field}
                  label={field === "client_notes" ? "Client notes" : field.charAt(0).toUpperCase() + field.slice(1)}
                  rows={field === "client_notes" ? 4 : 3}
                  value={versionNotes[field]}
                  onChange={(e) => setVersionNotes({ ...versionNotes, [field]: e.target.value })}
                />
              ))}
            </div>
            <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end gap-3">
              {notesStatus === "saved" && <span className="text-[13px] text-accent-500">Saved</span>}
              <Button
                variant="primary"
                onClick={() => void saveNotes()}
                disabled={notesStatus === "saving"}
                loading={notesStatus === "saving"}
                loadingText="Saving..."
              >
                Save notes
              </Button>
            </div>
          </div>
        )}

        {/* ── Quote Totals ── */}
        {activeSection === "totals" && (
          <div className="w-full grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h3 className="text-[14px] font-semibold text-neutral-900">Summary</h3>
              </div>
              <div className="px-5 py-4">
                <TotalsSidebar version={payload.version} deliverables={payload.deliverables} />
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h3 className="text-[14px] font-semibold text-neutral-900">GST Settings</h3>
              </div>
              <div className="px-5 py-4 flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payload.version.gst_enabled}
                    onChange={(e) => void updateVersion({ gst_enabled: e.target.checked })}
                    className="w-4 h-4 accent-[#2d9692]"
                  />
                  <span className="text-[13px] text-neutral-900">GST enabled</span>
                </label>
                <div>
                  <Input
                    label="GST rate"
                    type="number"
                    step={0.01}
                    value={payload.version.gst_rate ?? 0}
                    onChange={(e) => void updateVersion({ gst_rate: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Attachments ── */}
        {activeSection === "attachments" && (
          <div className="w-full flex flex-col gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">Upload attachments</label>
                <div className="flex gap-3 items-start">
                  <input
                    key={attachmentInputKey}
                    type="file"
                    multiple
                    className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-[12px] file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
                    onChange={(e) => {
                      setAttachmentFiles(Array.from(e.target.files ?? []));
                      setAttachmentStatus("idle");
                      setAttachmentError(null);
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={() => void uploadAttachments()}
                    disabled={attachmentStatus === "uploading"}
                    loading={attachmentStatus === "uploading"}
                    loadingText="Uploading..."
                  >
                    Upload
                  </Button>
                </div>
                {attachmentFiles.length > 0 && (
                  <p className="mt-1.5 text-[12px] text-neutral-500">{attachmentFiles.length} file{attachmentFiles.length !== 1 ? "s" : ""} selected</p>
                )}
                {attachmentError && (
                  <p className="mt-1.5 text-[12px] text-red-600">{attachmentError}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <colgroup>
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "25%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "15%" }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      {["File", "Type", "Size", "Uploaded", ""].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {payload.attachments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-neutral-400">
                          No attachments added yet.
                        </td>
                      </tr>
                    ) : (
                      payload.attachments.map((attachment) => (
                        <tr key={attachment.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 font-medium text-neutral-900">{attachment.file_name}</td>
                          <td className="px-4 py-3 text-neutral-600">{getQuoteFileTypeLabel(attachment.content_type, attachment.file_name)}</td>
                          <td className="px-4 py-3 text-neutral-600">{formatFileSize(attachment.file_size)}</td>
                          <td className="px-4 py-3 text-neutral-500 text-[12px]">{new Date(attachment.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <a
                                className="text-[12px] font-medium text-accent-500 hover:underline"
                                href={attachment.public_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View
                              </a>
                              <button
                                type="button"
                                className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                onClick={() => void deleteAttachment(attachment.id)}
                                disabled={deletingAttachmentId === attachment.id}
                                title="Delete attachment"
                              >
                                <IconTrash size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Publish modal */}
      {publishModal.open && (
        <Modal
          open={publishModal.open}
          title="Publish quote"
          subtitle="Generate a client access code and share the quote link."
          onClose={() => {
            setPublishModal({ open: false });
            setPublishEmailStatus("idle");
            setPublishEmailError(null);
            router.push("/admin/quotes");
          }}
          footer={
            <>
              <Button
                variant="neutral"
                onClick={() => {
                  setPublishModal({ open: false });
                  setPublishEmailStatus("idle");
                  setPublishEmailError(null);
                  router.push("/admin/quotes");
                }}
              >
                Close
              </Button>
              {!publishModal.code && (
                <Button variant="primary" onClick={publishQuote} disabled={isPublishing} loading={isPublishing} loadingText="Publishing...">
                  Publish now
                </Button>
              )}
            </>
          }
        >
          <div className="flex flex-col gap-3.5">
            {publishError && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">{publishError}</div>}
            {!publishModal.code && (
              <Input
                label="Expiry date"
                type="date"
                value={publishModal.expiresAt ?? ""}
                onChange={(e) => setPublishModal((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
            )}
            {publishModal.code && (
              <>
                <div className="rounded-xl border border-neutral-100 bg-[#fbfcfe] p-3.5 flex flex-col gap-3.5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Public link</p>
                    <div className="mt-1 text-[13px] text-neutral-700">/quote</div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Access code</p>
                    <div className="mt-1 text-[15px] font-semibold text-neutral-900">{publishModal.code}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-3.5">
                  <Input
                    label="Recipient email"
                    type="email"
                    placeholder="client@example.com"
                    value={publishEmail}
                    onChange={(e) => { setPublishEmail(e.target.value); if (publishEmailStatus !== "idle") { setPublishEmailStatus("idle"); setPublishEmailError(null); } }}
                  />
                  <Input
                    label="CC"
                    type="text"
                    placeholder="manager@example.com"
                    value={publishCcEmail}
                    onChange={(e) => { setPublishCcEmail(e.target.value); if (publishEmailStatus !== "idle") { setPublishEmailStatus("idle"); setPublishEmailError(null); } }}
                  />
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Email message</span>
                      <button type="button" className="text-[12px] font-medium text-accent-500 hover:underline" onClick={() => setShowPublishEmailPreview((prev) => !prev)}>
                        {showPublishEmailPreview ? "Edit" : "Preview"}
                      </button>
                    </div>
                    {showPublishEmailPreview ? (
                      <div className="rounded-xl border border-neutral-100 bg-[#fbfcfe] p-3.5 text-[13px]" dangerouslySetInnerHTML={{ __html: publishEmailPreview.html }} />
                    ) : (
                      <Textarea rows={12} value={publishEmailTemplate} onChange={(e) => { setPublishEmailTemplate(e.target.value); if (publishEmailStatus !== "idle") { setPublishEmailStatus("idle"); setPublishEmailError(null); } }} />
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {QUOTE_EMAIL_PLACEHOLDERS.map((placeholder) => (
                        <span key={placeholder} className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-mono text-neutral-600">{placeholder}</span>
                      ))}
                    </div>
                    <p className="text-[12px] text-neutral-500">
                      This edit only applies to this email. Keep <code className="font-mono">{"{{access_code}}"}</code> and <code className="font-mono">{"{{quote_link}}"}</code> in the message.
                    </p>
                  </div>
                  {publishEmailError && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">{publishEmailError}</div>}
                  {publishEmailStatus === "sent" && <div className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-[13px] text-green-700">Email sent.</div>}
                  <Button variant="primary" onClick={sendPublishEmail} disabled={publishEmailStatus === "sending"} loading={publishEmailStatus === "sending"} loadingText="Sending...">
                    Send email
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
