"use client";

import type { AdminDeliverable, AdminQuoteVersion } from "./types";
import { formatMoney } from "@/lib/formatters";

type TotalsSidebarProps = {
  version: AdminQuoteVersion;
  deliverables: AdminDeliverable[];
};

export default function TotalsSidebar({ version, deliverables }: TotalsSidebarProps) {
  const totalHours = deliverables.reduce((sum, d) => sum + (d.total_hours ?? 0), 0);
  const formatHours = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 2 }).format(totalHours);

  const rows = [
    { label: "Total hours", value: formatHours },
    { label: "Subtotal (ex GST)", value: formatMoney(version.subtotal_ex_gst) },
    { label: "GST", value: formatMoney(version.gst_amount) },
    { label: "Total (inc GST)", value: formatMoney(version.total_inc_gst), bold: true },
  ];

  return (
    <div className="divide-y divide-neutral-100">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between py-2.5">
          <span className="text-[13px] text-neutral-600">{row.label}</span>
          <strong className={row.bold ? "text-[14px] font-semibold text-neutral-900" : "text-[13px] font-medium text-neutral-900"}>
            {row.value}
          </strong>
        </div>
      ))}
    </div>
  );
}
