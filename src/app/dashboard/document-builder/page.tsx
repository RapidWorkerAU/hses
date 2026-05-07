import type { Metadata } from "next";
import DocumentBuilderListClient from "./DocumentBuilderListClient";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Builder",
};

export default function DocumentBuilderPage() {
  return (
    <HsesDashboardShell
      eyebrow="Document Builder"
      title="Document Builder"
      subtitle="Create structured documents from approved templates, guided answers, AI localisation, and styled exports."
    >
      <PortalAccessGate portalKey="document-builder">
        <DocumentBuilderListClient />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
