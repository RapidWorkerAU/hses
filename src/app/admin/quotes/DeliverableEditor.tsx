"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { fetchAdmin } from "../lib/adminFetch";
import type { AdminDeliverable, AdminMilestone } from "./types";
import MilestoneRow from "./MilestoneRow";

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(value);
};

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

const DeliverableEditor = forwardRef<DeliverableEditorHandle, DeliverableEditorProps>(function DeliverableEditor({
  deliverable,
  milestones,
  onSync,
  onDelete,
  isOpen,
  onToggle,
  onOpen,
  onBeforeEdit,
}, ref) {
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
    if (unit === "hours") {
      return sum + (entry.estimated_hours ?? 0);
    }
    return sum + (entry.quantity ?? 0);
  }, 0);
  const isEditable = !isLocked;
  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem(lockKey) : null;
    if (stored === "true") {
      setIsLocked(true);
    }
  }, [lockKey]);

  const saveDeliverable = useCallback(async ({ sync = true }: { sync?: boolean } = {}) => {
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
      if (sync) {
        await onSync();
      }
    } finally {
      setIsSaving(false);
    }
  }, [deliverable.id, derivedTotalHours, form, lockKey, onSync]);

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
        if (data.milestone?.id) {
          setEditingMilestoneId(data.milestone.id);
        }
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

  const quantityValue = derivedTotalHours;
  const unitPriceValue =
    form.pricing_mode === "fixed_price"
      ? form.fixed_price_ex_gst
      : form.default_client_rate;
  const deliverableSubtotal =
    form.pricing_mode === "fixed_price"
      ? form.fixed_price_ex_gst
      : form.default_client_rate * derivedTotalHours;
  const formattedSubtotal = formatMoney(deliverableSubtotal);

  const showMilestones = isOpen;

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

  return (
    <>
      <tr className={showMilestones ? "qb-deliverable-row is-open" : "qb-deliverable-row"}>
        <td>
          <button
            type="button"
            className={`qb-toggle-btn ${showMilestones ? "is-open" : ""}`}
            onClick={onToggle}
            title={showMilestones ? "Collapse milestones" : "Expand milestones"}
            aria-label={showMilestones ? "Collapse milestones" : "Expand milestones"}
            aria-expanded={showMilestones}
          >
            <span className="qb-toggle-chevron" aria-hidden="true" />
          </button>
        </td>
        <td>
          {!isEditable ? (
            <div>{form.deliverable_title || "-"}</div>
          ) : (
            <input
              className="qb-input"
              value={form.deliverable_title}
              onChange={(event) => setForm({ ...form, deliverable_title: event.target.value })}
            />
          )}
        </td>
        <td>
          {!isEditable ? (
            <div>{form.deliverable_description || "-"}</div>
          ) : (
            <textarea
              className="qb-textarea"
              rows={1}
              value={form.deliverable_description}
              onChange={(event) =>
                setForm({ ...form, deliverable_description: event.target.value })
              }
            />
          )}
        </td>
        <td>
          {!isEditable ? (
            <div>{form.pricing_mode === "fixed_price" ? "Fixed" : "Hours"}</div>
          ) : (
            <select
              className="qb-select"
              value={form.pricing_mode}
              onChange={(event) => setForm({ ...form, pricing_mode: event.target.value })}
            >
              <option value="rolled_up_hours">Hours</option>
              <option value="fixed_price">Fixed</option>
            </select>
          )}
        </td>
        <td>
          <input
            type="number"
            className="qb-input"
            value={quantityValue}
            readOnly
            disabled
          />
        </td>
        <td>
          {!isEditable ? (
            <div>{formatMoney(unitPriceValue)}</div>
          ) : (
            <input
              type="number"
              className="qb-input"
              value={unitPriceValue}
              onChange={(event) =>
                setForm({
                  ...form,
                  ...(form.pricing_mode === "fixed_price"
                    ? { fixed_price_ex_gst: Number(event.target.value) }
                    : { default_client_rate: Number(event.target.value) }),
                })
              }
            />
          )}
        </td>
        <td>{formattedSubtotal}</td>
        <td>
          <div className="qb-row-actions">
            {!isEditable ? (
              <>
                <button
                  type="button"
                  className="qb-icon-btn qb-icon-btn--edit"
                  onClick={() => void handleEdit()}
                  disabled={isPreparingEdit}
                  aria-busy={isPreparingEdit}
                  title={isPreparingEdit ? "Opening deliverable editor" : "Edit deliverable"}
                  aria-label={isPreparingEdit ? "Opening deliverable editor" : "Edit deliverable"}
                >
                  <span className="qb-icon qb-icon--edit" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="qb-icon-btn qb-icon-btn--add"
                  onClick={addMilestone}
                  disabled={isAddingMilestone}
                  aria-busy={isAddingMilestone}
                  title={isAddingMilestone ? "Adding milestone" : "Add milestone"}
                  aria-label={isAddingMilestone ? "Adding milestone" : "Add milestone"}
                >
                  <span className="qb-icon qb-icon--add" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="qb-icon-btn qb-icon-btn--delete"
                  onClick={remove}
                  disabled={isDeleting}
                  aria-busy={isDeleting}
                  title={isDeleting ? "Deleting deliverable" : "Delete deliverable"}
                  aria-label={isDeleting ? "Deleting deliverable" : "Delete deliverable"}
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
                  title={isDeleting ? "Deleting deliverable" : "Delete deliverable"}
                  aria-label={isDeleting ? "Deleting deliverable" : "Delete deliverable"}
                >
                  <span className="qb-icon qb-icon--delete" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="qb-icon-btn qb-icon-btn--save"
                  onClick={() => void saveDeliverable()}
                  disabled={isSaving}
                  aria-busy={isSaving}
                  title={isSaving ? "Saving deliverable" : "Save deliverable"}
                  aria-label={isSaving ? "Saving deliverable" : "Save deliverable"}
                >
                  <span className="qb-icon qb-icon--save" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {showMilestones && (
        <tr className="qb-milestone-subtable-row">
          <td></td>
          <td colSpan={7} className="qb-milestone-subtable-cell">
            <div className="qb-milestone-subtable-wrap">
              <table className="qb-milestone-subtable">
                <thead>
                  <tr>
                    <th>Milestone</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th>Qty/Hrs</th>
                    <th>Unit price</th>
                    <th>Line total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.length === 0 ? (
                    <tr className="qb-empty-row qb-empty-row--milestones">
                      <td colSpan={7} className="qb-empty-cell">
                        <strong>No milestones yet.</strong>
                        <span>
                          Select the edit action for this deliverable, then use the blue plus action to add a
                          milestone row.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    milestones.map((milestone) => {
                      const totalMilestoneHours = milestones.reduce((sum, entry) => {
                        const unit = entry.pricing_unit ?? "hours";
                        if (unit !== "hours") return sum;
                        return sum + (entry.estimated_hours ?? 0);
                      }, 0);
                      const milestoneHours =
                        (milestone.pricing_unit ?? "hours") === "hours"
                          ? milestone.estimated_hours ?? 0
                          : 0;
                      const otherHours = totalMilestoneHours - milestoneHours;
                      return (
                        <MilestoneRow
                          key={milestone.id}
                          milestone={milestone}
                          maxHours={0}
                          otherHours={otherHours}
                          deliverableUnitPrice={unitPriceValue}
                          deliverableRate={form.default_client_rate}
                          editingMilestoneId={editingMilestoneId}
                          onEdit={(id) => setEditingMilestoneId(id)}
                          onStopEdit={() => setEditingMilestoneId(null)}
                          onAddAfterSave={addMilestone}
                          onSaved={onSync}
                          onDeleted={onSync}
                        />
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

export default DeliverableEditor;


