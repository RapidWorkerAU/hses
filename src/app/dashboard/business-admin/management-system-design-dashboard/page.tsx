import type { Metadata } from "next";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";

export const metadata: Metadata = {
  title: "Management System Design Dashboard",
};

export default function ManagementSystemDesignDashboardPage() {
  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Management System Design Dashboard"
      subtitle="Content for this dashboard will be added next."
    >
      <PortalAccessGate portalKey="business-admin">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2>Coming next</h2>
            <p>This workspace is reserved for management system design dashboard content.</p>
          </div>
        </section>
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
