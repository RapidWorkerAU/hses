"use client";

import { useEffect, useState } from "react";
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
  onSync: () => void;
  onDelete: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpen: () => void;
};

export default function DeliverableEditor({
  deliverable,
  milestones,
  onSync,
  onDelete,
  isOpen,
  onToggle,
  onOpen,
}: DeliverableEditorProps) {
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

  const save = async () => {
    setIsSaving(true);
    await fetchAdmin(`/api/admin/deliverables/${deliverable.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, total_hours: derivedTotalHours }),
    });
    setIsSaving(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(lockKey, "true");
    }
    setIsLocked(true);
    onSync();
  };

  const addMilestone = async () => {
    onOpen();
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
    onSync();
  };

  const remove = async () => {
    await fetchAdmin(`/api/admin/deliverables/${deliverable.id}`, { method: "DELETE" });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(lockKey);
    }
    onDelete();
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

  const handleEdit = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(lockKey);
    }
    setIsLocked(false);
  };

  return (
    <>
      <tr className={showMilestones ? "qb-deliverable-row is-open" : "qb-deliverable-row"}>
        <td>
          <button
            type="button"
            className="qb-toggle-btn"
            onClick={onToggle}
          >
            {showMilestones ? "–" : "+"}
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
              rows={2}
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
                <button type="button" className="qb-btn" onClick={handleEdit}>
                  Edit
                </button>
                <button type="button" className="qb-btn" onClick={remove}>
                  Delete
                </button>
              </>
            ) : (
              <>
                <button type="button" className="qb-btn" onClick={remove}>
                  Delete
                </button>
                <button
                  type="button"
                  className="qb-btn qb-btn-secondary"
                  onClick={addMilestone}
                >
                  + Milestone
                </button>
                <button
                  type="button"
                  className="qb-btn qb-btn-primary"
                  onClick={save}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {showMilestones && (
        <>
          <tr className="qb-nested-header">
            <td></td>
            <td>Milestone</td>
            <td>Description</td>
            <td>Unit</td>
            <td>Qty/Hrs</td>
            <td>Unit price</td>
            <td>Line total</td>
            <td></td>
          </tr>
          {milestones.map((milestone) => {
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
          })}
        </>
      )}
    </>
  );
}


