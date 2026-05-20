import type { Metadata } from "next";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import BusinessAdminClient from "@/components/dashboard/portal/business-admin/BusinessAdminClient";

export const metadata: Metadata = {
  title: "Business Admin",
};

export default function BusinessAdminPage() {
  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Business Admin"
      subtitle="Administer proposals, quote acceptance, and internal client management workflows."
    >
      <PortalAccessGate portalKey="business-admin">
        <BusinessAdminClient />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
