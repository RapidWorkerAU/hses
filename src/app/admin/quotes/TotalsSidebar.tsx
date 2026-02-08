"use client";

import type { AdminDeliverable, AdminQuoteVersion } from "./types";

type TotalsSidebarProps = {
  version: AdminQuoteVersion;
  deliverables: AdminDeliverable[];
};

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(value);
};

export default function TotalsSidebar({ version, deliverables }: TotalsSidebarProps) {
  const totalHours = deliverables.reduce(
    (sum, deliverable) => sum + (deliverable.total_hours ?? 0),
    0
  );
  const formatHours = new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 2,
  }).format(totalHours);
  return (
    <div className="qb-total-box">
      <div className="qb-total-row">
        <span>Total hours</span>
        <strong>{formatHours}</strong>
      </div>
      <div className="qb-total-row">
        <span>Subtotal (ex GST)</span>
        <strong>{formatMoney(version.subtotal_ex_gst)}</strong>
      </div>
      <div className="qb-total-row">
        <span>GST</span>
        <strong>{formatMoney(version.gst_amount)}</strong>
      </div>
      <div className="qb-total-row">
        <span>Total</span>
        <strong>{formatMoney(version.total_inc_gst)}</strong>
      </div>
    </div>
  );
}
