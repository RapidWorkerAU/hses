"use client";

import { useEffect, useState } from "react";
import { fetchAdmin } from "../lib/adminFetch";
import type { AdminMilestone } from "./types";

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(value);
};

type MilestoneRowProps = {
  milestone: AdminMilestone;
  maxHours: number;
  otherHours: number;
  deliverableUnitPrice: number;
  deliverableRate: number;
  editingMilestoneId: string | null;
  onEdit: (id: string) => void;
  onStopEdit: () => void;
  onAddAfterSave?: () => void;
  onSaved: () => void | Promise<void>;
  onDeleted: () => void | Promise<void>;
};

export default function MilestoneRow({
  milestone,
  maxHours,
  otherHours,
  deliverableUnitPrice,
  deliverableRate,
  editingMilestoneId,
  onEdit,
  onStopEdit,
  onAddAfterSave,
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
  const exceedsHours =
    form.pricing_unit === "hours" &&
    maxHours > 0 &&
    otherHours + form.estimated_hours > maxHours;
  const hoursRemaining = maxHours - otherHours;
  const milestoneUnits =
    form.pricing_unit === "hours" ? form.estimated_hours : form.quantity;
  const clientAmount = milestoneUnits * deliverableRate;
  const formattedUnitPrice = formatMoney(deliverableUnitPrice);
  const formattedClientAmount = formatMoney(clientAmount);
  const isComplete =
    form.milestone_title.trim().length > 0 &&
    milestoneUnits > 0 &&
    !exceedsHours;
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
    if (exceedsHours || isLocked || !isEditable) return;
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

  return (
    <>
      <tr className="qb-nested-row">
        <td>
          {!isEditable ? (
            <div>{form.milestone_title || "-"}</div>
          ) : (
            <input
              className="qb-input"
              value={form.milestone_title}
              onChange={(event) => setForm({ ...form, milestone_title: event.target.value })}
            />
          )}
        </td>
        <td>
          {!isEditable ? (
            <div>{form.milestone_description || "-"}</div>
          ) : (
            <input
              className="qb-input"
              value={form.milestone_description}
              onChange={(event) =>
                setForm({ ...form, milestone_description: event.target.value })
              }
            />
          )}
        </td>
        <td>
          {!isEditable ? (
            <div>{form.pricing_unit === "hours" ? "Hours" : "Each"}</div>
          ) : (
            <select
              className="qb-select"
              value={form.pricing_unit}
              onChange={(event) => setForm({ ...form, pricing_unit: event.target.value })}
            >
              <option value="hours">Hours</option>
              <option value="each">Each</option>
            </select>
          )}
        </td>
        <td>
          {!isEditable ? (
            <div>{milestoneUnits || 0}</div>
          ) : form.pricing_unit === "hours" ? (
            <div>
              <input
                type="number"
                className="qb-input"
                value={form.estimated_hours}
                onChange={(event) =>
                  setForm({ ...form, estimated_hours: Number(event.target.value) })
                }
              />
              {maxHours > 0 && (
                <div className="qb-muted text-xs">
                  {exceedsHours
                    ? `Exceeds deliverable hours (${hoursRemaining} remaining).`
                    : `${hoursRemaining} hours remaining.`}
                </div>
              )}
            </div>
          ) : (
            <input
              type="number"
              className="qb-input"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
            />
          )}
        </td>
        <td>{formattedUnitPrice}</td>
        <td>{formattedClientAmount}</td>
        <td>
          <div className="qb-row-actions">
            {!isEditable ? (
              <>
                <button
                  type="button"
                  className="qb-icon-btn qb-icon-btn--edit"
                  onClick={handleEdit}
                  title="Edit milestone"
                  aria-label="Edit milestone"
                >
                  <span className="qb-icon qb-icon--edit" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="qb-icon-btn qb-icon-btn--delete"
                  onClick={remove}
                  disabled={isDeleting}
                  aria-busy={isDeleting}
                  title={isDeleting ? "Deleting milestone" : "Delete milestone"}
                  aria-label={isDeleting ? "Deleting milestone" : "Delete milestone"}
                >
                  <span className="qb-icon qb-icon--delete" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="qb-icon-btn qb-icon-btn--delete"
                  onClick={remove}
                  disabled={isDeleting}
                  aria-busy={isDeleting}
                  title={isDeleting ? "Deleting milestone" : "Delete milestone"}
                  aria-label={isDeleting ? "Deleting milestone" : "Delete milestone"}
                >
                  <span className="qb-icon qb-icon--delete" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="qb-icon-btn qb-icon-btn--save"
                  onClick={save}
                  disabled={isSaving || exceedsHours}
                  aria-busy={isSaving}
                  title={
                    exceedsHours
                      ? "Resolve over hours before saving"
                      : isSaving
                        ? "Saving milestone"
                        : "Save milestone"
                  }
                  aria-label={
                    exceedsHours
                      ? "Resolve over hours before saving"
                      : isSaving
                        ? "Saving milestone"
                        : "Save milestone"
                  }
                >
                  <span className="qb-icon qb-icon--save" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {errorMessage ? (
        <tr className="qb-nested-row qb-nested-row--error">
          <td colSpan={7} className="qb-row-error-cell">
            {errorMessage}
          </td>
        </tr>
      ) : null}
    </>
  );
}
