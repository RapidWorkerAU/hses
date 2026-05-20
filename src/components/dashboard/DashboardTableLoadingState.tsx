"use client";

import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
import { TableSkeleton } from "@/components/loading/HsesLoaders";

type DashboardPageSkeletonProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  rows?: number;
  columns?: string;
  activeNav?: string;
};

export function DashboardPageSkeleton({
  eyebrow,
  title,
  subtitle,
  rows = 7,
  columns,
}: DashboardPageSkeletonProps) {
  return (
    <HsesDashboardShell eyebrow={eyebrow} title={title} subtitle={subtitle}>
      <TableSkeleton rows={rows} columns={columns} showToolbar />
    </HsesDashboardShell>
  );
}
