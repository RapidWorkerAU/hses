import type { Metadata } from "next";
import HsesDashboardShell from "../HsesDashboardShell";
import PortalAccessGate from "../PortalAccessGate";
import DiagnosticsListClient from "./DiagnosticsListClient";

export const metadata: Metadata = {
  title: "Your Diagnostics",
};

export default function DiagnosticsListPage() {
  return (
    <HsesDashboardShell
      eyebrow="Diagnostics"
      title="Your Diagnostics"
      subtitle="View purchased diagnostics, track rollout progress, and open each diagnostic to manage access codes and participation."
    >
      <PortalAccessGate portalKey="diagnostics">
        <DiagnosticsListClient />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
