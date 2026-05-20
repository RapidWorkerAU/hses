import type { Metadata } from "next";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
import DashboardPortalTiles from "@/components/dashboard/portal/DashboardPortalTiles";

export const metadata: Metadata = {
  title: "Portal Dashboard",
};

export default function DashboardPage() {
  return (
    <HsesDashboardShell
      eyebrow="HSES Industry Tools"
      title="Dashboard"
      subtitle="Access and manage your HSES workspaces from one central dashboard."
    >
      <DashboardPortalTiles />
    </HsesDashboardShell>
  );
}
