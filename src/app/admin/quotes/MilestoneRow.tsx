"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconPencil, IconTrash } from "@tabler/icons-react";
import { fetchAdmin } from "../lib/adminFetch";
import type { AdminMilestone } from "./types";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/formatters";

const inputCls = "w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition";
const selectCls = "w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition";

type MilestoneRowProps = {
  milestone: AdminMilestone;
  deliverableUnitPrice: number;
  deliverableRate: number;
  editingMilestoneId: string | null;
  onEdit: (id: string) => void;
  onStopEdit: () => void;
  onSaved: () => void | Promise<void>;
  onDeleted: () => void | Promise<void>;
};

export default function MilestoneRow({
  milestone,
  deliverableUnitPrice,
  deliverableRate,
  editingMilestoneId,
  onEdit,
  onStopEdit,
  onSaved,
  onDeleted,
}: MilestoneRowProps) {
  const lockKey = `milestone-locked-${milestone.id}`;
  const [isLocked, setIsLocked] = useState(false);
  const [form, setForm] = useState({
    milestone_title: milestone.milestone_title ?? "",
    milestone_description: milestone.milestone_description ?? "",
    pricing_unit: milestone.pricing_unit ?? "hours",
    quantity: milestone.quantity ?? 1,
    estimated_hours: milestone.estimated_hours ?? 1,
    billable: milestone.billable ?? true,
    delivery_mode: milestone.delivery_mode ?? "in_house",
    supplier_name: milestone.supplier_name ?? "",
    cost_rate: milestone.cost_rate ?? 0,
    milestone_order: milestone.milestone_order ?? 1,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const milestoneUnits = form.pricing_unit === "hours" ? form.estimated_hours : form.quantity;
  const clientAmount = milestoneUnits * deliverableRate;
  const formattedUnitPrice = formatMoney(deliverableUnitPrice);
  const formattedClientAmount = formatMoney(clientAmount);
  const isComplete = form.milestone_title.trim().length > 0 && milestoneUnits > 0;
  const isEditable = !isLocked && editingMilestoneId === milestone.id;

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem(lockKey) : null;
    if (stored === "true") {
      setIsLocked(true);
      return;
    }
    if (!editingMilestoneId && milestone.milestone_title === "New milestone") {
      onEdit(milestone.id);
    }
  }, [editingMilestoneId, lockKey, milestone.id, milestone.milestone_title, onEdit]);

  const save = async () => {
    if (isLocked || !isEditable) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await fetchAdmin(`/api/admin/milestones/${milestone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, client_rate: deliverableRate }),
      });
      if (!response.ok) {
        const message = await response.text();
        setErrorMessage(message || "Unable to save milestone.");
        return;
      }
      await onSaved();
      if (isComplete) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(lockKey, "true");
        }
        setIsLocked(true);
        onStopEdit();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setErrorMessage(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(lockKey);
    }
    setIsLocked(false);
    onEdit(milestone.id);
  };

  const remove = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const response = await fetchAdmin(`/api/admin/milestones/${milestone.id}`, { method: "DELETE" });
      if (!response.ok) {
        const message = await response.text();
        setErrorMessage(message || "Unable to delete milestone.");
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(lockKey);
      }
      await onDeleted();
    } finally {
      setIsDeleting(false);
    }
  };

  const iconBtn = (title: string, variant: "edit" | "delete" | "save", onClick: () => void, disabled = false) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md border bg-white transition disabled:cursor-not-allowed disabled:opacity-40",
        variant === "delete" ? "border-red-100 text-red-500 hover:bg-red-50" :
        variant === "save"   ? "border-accent-500/25 text-accent-500 hover:bg-accent-500/10" :
                               "border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
      )}
    >
      {variant === "edit"   && <IconPencil size={13} />}
      {variant === "delete" && <IconTrash  size={13} />}
      {variant === "save"   && <IconCheck  size={13} />}
    </button>
  );

  return (
    <tr
      className={cn(
        "border-b border-neutral-100 last:border-b-0 transition-colors",
        isEditable ? "bg-accent-500/[3%]" : "hover:bg-neutral-50/60"
      )}
    >
      {/* ── Title ── */}
      <td className="px-4 py-3 align-top">
        {!isEditable ? (
          <p className="break-words text-[10px] font-medium text-neutral-900">
            {form.milestone_title || "-"}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <input
              className={cn(inputCls, "h-8 py-1 !text-[10px]")}
              value={form.milestone_title}
              onChange={(e) => setForm({ ...form, milestone_title: e.target.value })}
            />
            {errorMessage && (
              <p className="text-[10px] text-red-600">{errorMessage}</p>
            )}
          </div>
        )}
      </td>

      {/* ── Description ── */}
      <td className="px-4 py-3 align-top">
        {!isEditable ? (
          <p
            className={cn(
              "break-words text-[10px] leading-4",
              form.milestone_description ? "text-neutral-500" : "italic text-neutral-300"
            )}
          >
            {form.milestone_description || "No description"}
          </p>
        ) : (
          <textarea
            rows={2}
            className={cn(inputCls, "resize-none py-1 !text-[10px]")}
            value={form.milestone_description}
            placeholder="Milestone description"
            onChange={(e) => setForm({ ...form, milestone_description: e.target.value })}
          />
        )}
      </td>

      {/* ── Unit ── */}
      <td className="px-4 py-3 align-top">
        {!isEditable ? (
          <span className="inline-block whitespace-nowrap rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
            {form.pricing_unit === "hours" ? "Hours" : "Each"}
          </span>
        ) : (
          <select
            className={cn(selectCls, "h-8 py-1 !text-[10px]")}
            value={form.pricing_unit}
            onChange={(e) => setForm({ ...form, pricing_unit: e.target.value })}
          >
            <option value="hours">Hours</option>
            <option value="each">Each</option>
          </select>
        )}
      </td>

      {/* ── Qty ── */}
      <td className="px-4 py-3 align-top text-right">
        {!isEditable ? (
          <span className="text-[10px] text-neutral-700">{milestoneUnits || 0}</span>
        ) : (
          <input
            type="number"
            className={cn(inputCls, "h-8 py-1 text-right !text-[10px]")}
            value={form.pricing_unit === "hours" ? form.estimated_hours : form.quantity}
            onChange={(e) =>
              setForm({
                ...form,
                ...(form.pricing_unit === "hours"
                  ? { estimated_hours: Number(e.target.value) }
                  : { quantity: Number(e.target.value) }),
              })
            }
          />
        )}
      </td>

      {/* ── Rate ── */}
      <td className="px-4 py-3 align-top text-right">
        <span className="whitespace-nowrap text-[10px] text-neutral-500">{formattedUnitPrice}</span>
      </td>

      {/* ── Total ── */}
      <td className="px-4 py-3 align-top text-right">
        <span className="whitespace-nowrap text-[10px] font-semibold text-neutral-900">
          {formattedClientAmount}
        </span>
      </td>

      {/* ── Actions ── */}
      <td className="px-4 py-3 align-top">
        <div className="flex items-center justify-end gap-1">
          {!isEditable ? (
            <>
              {iconBtn("Edit milestone", "edit", handleEdit)}
              {iconBtn(isDeleting ? "Deleting..." : "Delete milestone", "delete", () => void remove(), isDeleting)}
            </>
          ) : (
            <>
              {iconBtn(isDeleting ? "Deleting..." : "Delete milestone", "delete", () => void remove(), isDeleting)}
              {iconBtn(isSaving ? "Saving..." : "Save milestone", "save", () => void save(), isSaving)}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
