"use client";

import type { ReactNode } from "react";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";

type DashboardShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  headerRight?: ReactNode;
  activeNav?: string;
};

export default function DashboardShell({
  eyebrow,
  title,
  subtitle,
  children,
  headerRight,
}: DashboardShellProps) {
  return (
    <HsesDashboardShell eyebrow={eyebrow} title={title} subtitle={subtitle}>
      {headerRight ? <div>{headerRight}</div> : null}
      {children}
    </HsesDashboardShell>
  );
}
