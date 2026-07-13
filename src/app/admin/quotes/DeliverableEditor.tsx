"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { IconCheck, IconListDetails, IconLock, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { fetchAdmin } from "../lib/adminFetch";
import { Modal } from "@/components/ui/Modal";
import type { AdminDeliverable, AdminMilestone } from "./types";
import MilestoneRow from "./MilestoneRow";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/formatters";

const inputCls = "w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition";
const selectCls = "w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition";

type DeliverableEditorProps = {
  deliverable: AdminDeliverable;
  milestones: AdminMilestone[];
  onSync: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onBeforeEdit?: (deliverableId: string) => Promise<void>;
};

export type DeliverableEditorHandle = {
  saveIfEditing: () => Promise<boolean>;
};

const DeliverableEditor = forwardRef<DeliverableEditorHandle, DeliverableEditorProps>(
  function DeliverableEditor(
    { deliverable, milestones, onSync, onDelete, isOpen, onToggle, onOpen, onBeforeEdit },
    ref
  ) {
    const lockKey = `deliverable-locked-${deliverable.id}`;
    const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [form, setForm] = useState({
      deliverable_title: deliverable.deliverable_title ?? "",
      deliverable_description: deliverable.deliverable_description ?? "",
      deliverable_status: deliverable.deliverable_status ?? "draft",
      pricing_mode: deliverable.pricing_mode ?? "rolled_up_hours",
      fixed_price_ex_gst: deliverable.fixed_price_ex_gst ?? 150,
      total_hours: deliverable.total_hours ?? 1,
      default_client_rate: deliverable.default_client_rate ?? 150,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingMilestone, setIsAddingMilestone] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPreparingEdit, setIsPreparingEdit] = useState(false);

    const derivedTotalHours = milestones.reduce((sum, entry) => {
      const unit = entry.pricing_unit ?? "hours";
      if (unit === "hours") return sum + (entry.estimated_hours ?? 0);
      return sum + (entry.quantity ?? 0);
    }, 0);

    const isEditable = !isLocked;

    useEffect(() => {
      const stored =
        typeof window !== "undefined" ? window.localStorage.getItem(lockKey) : null;
      if (stored === "true") setIsLocked(true);
    }, [lockKey]);

    const saveDeliverable = useCallback(
      async ({ sync = true }: { sync?: boolean } = {}) => {
        setIsSaving(true);
        try {
          await fetchAdmin(`/api/admin/deliverables/${deliverable.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, total_hours: derivedTotalHours }),
          });
          if (typeof window !== "undefined") {
            window.localStorage.setItem(lockKey, "true");
          }
          setIsLocked(true);
          if (sync) await onSync();
        } finally {
          setIsSaving(false);
        }
      },
      [deliverable.id, derivedTotalHours, form, lockKey, onSync]
    );

    useImperativeHandle(
      ref,
      () => ({
        saveIfEditing: async () => {
          if (!isEditable) return false;
          await saveDeliverable({ sync: false });
          return true;
        },
      }),
      [isEditable, saveDeliverable]
    );

    const addMilestone = async () => {
      if (isAddingMilestone) return;
      setIsAddingMilestone(true);
      onOpen();
      try {
        const nextOrder = milestones.length + 1;
        const response = await fetchAdmin("/api/admin/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliverable_id: deliverable.id,
            milestone_title: "New milestone",
            milestone_order: nextOrder,
          }),
        });
        if (response.ok) {
          const data = (await response.json()) as { milestone?: { id?: string } };
          if (data.milestone?.id) setEditingMilestoneId(data.milestone.id);
        }
        await onSync();
      } finally {
        setIsAddingMilestone(false);
      }
    };

    const remove = async () => {
      if (isDeleting) return;
      setIsDeleting(true);
      try {
        await fetchAdmin(`/api/admin/deliverables/${deliverable.id}`, { method: "DELETE" });
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(lockKey);
        }
        await onDelete();
      } finally {
        setIsDeleting(false);
      }
    };

    const handleEdit = async () => {
      if (isPreparingEdit) return;
      setIsPreparingEdit(true);
      try {
        await onBeforeEdit?.(deliverable.id);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(lockKey);
        }
        setIsLocked(false);
      } finally {
        setIsPreparingEdit(false);
      }
    };

    const unitPriceValue =
      form.pricing_mode === "fixed_price" ? form.fixed_price_ex_gst : form.default_client_rate;
    const deliverableSubtotal =
      form.pricing_mode === "fixed_price"
        ? form.fixed_price_ex_gst
        : form.default_client_rate * derivedTotalHours;
    const formattedSubtotal = formatMoney(deliverableSubtotal);
    const formattedUnitPrice = formatMoney(unitPriceValue);
    const isFixedPrice = form.pricing_mode === "fixed_price";

    const iconBtn = (
      title: string,
      variant: "edit" | "milestones" | "delete" | "save",
      onClick: () => void,
      disabled = false
    ) => (
      <button
        type="button"
        title={title}
        aria-label={title}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md border bg-white transition disabled:cursor-not-allowed disabled:opacity-40",
          variant === "delete"     ? "border-red-100 text-red-500 hover:bg-red-50" :
          variant === "save"       ? "border-accent-500/25 text-accent-500 hover:bg-accent-500/10" :
          variant === "milestones" ? "border-accent-500/25 text-accent-500 hover:bg-accent-500/10" :
                                      "border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
        )}
      >
        {variant === "edit"       && <IconPencil      size={14} />}
        {variant === "milestones" && <IconListDetails size={14} />}
        {variant === "delete"     && <IconTrash       size={14} />}
        {variant === "save"       && <IconCheck       size={14} />}
      </button>
    );

    return (
      <>
        <tr
          className={cn(
            "border-b border-neutral-100 last:border-b-0 transition-colors",
            isEditable ? "bg-accent-500/[3%]" : "hover:bg-neutral-50/60"
          )}
        >
          {/* ── Title ── */}
          <td className="px-4 py-3 align-top">
            {!isEditable ? (
              <div>
                <p className="break-words text-[13px] font-medium text-neutral-900">
                  {form.deliverable_title || "-"}
                </p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                  <IconLock size={10} />
                  Saved
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <input
                  className={cn(inputCls, "h-8 py-1")}
                  value={form.deliverable_title}
                  onChange={(e) => setForm({ ...form, deliverable_title: e.target.value })}
                />
                <span className="self-start rounded-full border border-accent-500/20 bg-white px-2 py-0.5 text-[11px] font-medium text-accent-500">
                  Editing
                </span>
              </div>
            )}
          </td>

          {/* ── Description ── */}
          <td className="px-4 py-3 align-top">
            {!isEditable ? (
              <p
                className={cn(
                  "break-words text-[12px] leading-5",
                  form.deliverable_description ? "text-neutral-500" : "italic text-neutral-300"
                )}
              >
                {form.deliverable_description || "No description"}
              </p>
            ) : (
              <textarea
                rows={2}
                className={cn(inputCls, "resize-none py-1 text-[12px]")}
                value={form.deliverable_description}
                placeholder="Deliverable description"
                onChange={(e) => setForm({ ...form, deliverable_description: e.target.value })}
              />
            )}
          </td>

          {/* ── Type ── */}
          <td className="px-4 py-3 align-top">
            {!isEditable ? (
              <span
                className={cn(
                  "inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  isFixedPrice
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-accent-500/20 bg-accent-500/10 text-accent-600"
                )}
              >
                {isFixedPrice ? "Fixed" : "Hours"}
              </span>
            ) : (
              <select
                className={cn(selectCls, "h-8 py-1")}
                value={form.pricing_mode}
                onChange={(e) => setForm({ ...form, pricing_mode: e.target.value })}
              >
                <option value="rolled_up_hours">Hours</option>
                <option value="fixed_price">Fixed</option>
              </select>
            )}
          </td>

          {/* ── Rate ── */}
          <td className="px-4 py-3 align-top text-right">
            {!isEditable ? (
              <p className="whitespace-nowrap text-[13px] text-neutral-700">{formattedUnitPrice}</p>
            ) : (
              <input
                type="number"
                className={cn(inputCls, "h-8 py-1 text-right")}
                value={unitPriceValue}
                onChange={(e) =>
                  setForm({
                    ...form,
                    ...(form.pricing_mode === "fixed_price"
                      ? { fixed_price_ex_gst: Number(e.target.value) }
                      : { default_client_rate: Number(e.target.value) }),
                  })
                }
              />
            )}
          </td>

          {/* ── Hrs ── */}
          <td className="px-4 py-3 align-top text-right">
            {isFixedPrice ? (
              <span className="text-[13px] text-neutral-300">—</span>
            ) : (
              <span className="text-[13px] text-neutral-700">{derivedTotalHours}</span>
            )}
          </td>

          {/* ── Subtotal ── */}
          <td className="px-4 py-3 align-top text-right">
            <p className="whitespace-nowrap text-[13px] font-semibold text-neutral-900">
              {formattedSubtotal}
            </p>
          </td>

          {/* ── Milestones ── */}
          <td className="px-4 py-3 align-top text-center">
            <button
              type="button"
              onClick={onOpen}
              className="whitespace-nowrap text-[12px] font-medium text-accent-500 hover:underline"
            >
              {milestones.length} milestone{milestones.length === 1 ? "" : "s"}
            </button>
          </td>

          {/* ── Actions ── */}
          <td className="px-4 py-3 align-top">
            <div className="flex items-center justify-end gap-1">
              {!isEditable ? (
                <>
                  {iconBtn(isPreparingEdit ? "Opening editor..." : "Edit deliverable", "edit", () => void handleEdit(), isPreparingEdit)}
                  {iconBtn(isDeleting ? "Deleting..." : "Delete deliverable", "delete", () => void remove(), isDeleting)}
                </>
              ) : (
                <>
                  {iconBtn(isDeleting ? "Deleting..." : "Delete deliverable", "delete", () => void remove(), isDeleting)}
                  {iconBtn(isSaving ? "Saving..." : "Save deliverable", "save", () => void saveDeliverable(), isSaving)}
                </>
              )}
            </div>
          </td>
        </tr>

        {isOpen && (
          <Modal
            open={isOpen}
            onClose={onToggle}
            title="Manage milestones"
            subtitle={form.deliverable_title || "Deliverable milestones"}
            size="lg"
            className="md:max-w-[1176px]"
            footer={
              <>
                <button
                  type="button"
                  onClick={onToggle}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 px-4 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-200"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => void addMilestone()}
                  disabled={isAddingMilestone}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-accent-500/35 bg-white px-4 text-[13px] font-medium text-accent-500 transition hover:bg-accent-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <IconPlus size={14} />
                  {isAddingMilestone ? "Adding..." : "Add milestone"}
                </button>
              </>
            }
          >
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-neutral-900">{formattedSubtotal}</p>
                  <p className="mt-0.5 text-[12px] text-neutral-500">
                    {isFixedPrice ? "Fixed price" : `${derivedTotalHours} hrs at ${formattedUnitPrice}`}
                  </p>
                </div>
                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[12px] font-medium text-neutral-600">
                  {milestones.length} milestone{milestones.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {milestones.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-200 bg-white px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-neutral-800">Add milestones to show the work breakdown.</p>
                <p className="mt-1 text-[12px] text-neutral-500">
                  Use Add milestone below to create the first entry for this deliverable.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                <table className="w-full text-[13px]">
                  <colgroup>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "28%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "13%" }} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Title</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Description</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Unit</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Qty</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Rate</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Total</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((milestone) => (
                      <MilestoneRow
                        key={milestone.id}
                        milestone={milestone}
                        deliverableUnitPrice={unitPriceValue}
                        deliverableRate={form.default_client_rate}
                        editingMilestoneId={editingMilestoneId}
                        onEdit={(id) => setEditingMilestoneId(id)}
                        onStopEdit={() => setEditingMilestoneId(null)}
                        onSaved={onSync}
                        onDeleted={onSync}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Modal>
        )}
      </>
    );
  }
);

export default DeliverableEditor;
