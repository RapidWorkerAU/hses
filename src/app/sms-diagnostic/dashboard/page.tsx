import type { Metadata } from "next";
import HsesDashboardShell from "./HsesDashboardShell";
import DashboardPortalTiles from "./DashboardPortalTiles";

export const metadata: Metadata = {
  title: "Portal Dashboard",
};

export default function DiagnosticDashboardPage() {
  return (
    <HsesDashboardShell
      eyebrow="HSES Industry Tools"
      title="Dashboard"
      subtitle="Access and manage a variety of industry leading solutions from one central workspace."
    >
      <DashboardPortalTiles />
    </HsesDashboardShell>
  );
}
