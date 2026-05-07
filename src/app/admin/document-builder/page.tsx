import type { Metadata } from "next";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";
import DocumentTypeListClient from "./DocumentTypeListClient";

export const metadata: Metadata = {
  title: "Document Builder Admin",
};

export default function DocumentBuilderAdminPage() {
  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Document Builder Admin"
      subtitle="Author template versions, questions, source material, localisation links, and publishing controls."
      backHref="/dashboard/business-admin"
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <DocumentTypeListClient />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
