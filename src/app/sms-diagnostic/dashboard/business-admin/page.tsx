import type { Metadata } from "next";
import HsesDashboardShell from "../HsesDashboardShell";
import PortalAccessGate from "../PortalAccessGate";
import BusinessAdminClient from "./BusinessAdminClient";

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
