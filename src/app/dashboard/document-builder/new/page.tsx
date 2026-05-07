import type { Metadata } from "next";
import DocumentBuilderWorkspace from "@/app/document-builder/DocumentBuilderWorkspace";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "New Document Project",
};

export default function NewDocumentBuilderPage() {
  return (
    <HsesDashboardShell
      eyebrow="Document Builder"
      title="Start New Document"
      subtitle="Create a new document project from a published template version and choose the target jurisdiction profile."
      backHref="/dashboard/document-builder"
      backLabel="Back"
    >
      <PortalAccessGate portalKey="document-builder">
        <DocumentBuilderWorkspace
          eyebrow="Project Setup"
          title="New document intake will start with template and context selection"
          description="This page is reserved for the project creation form. It will eventually create a document project from a published template version, assign the owner, set the jurisdiction, and capture the initial context before the questionnaire begins."
          metrics={[
            { label: "Document Type", value: "Published template version" },
            { label: "Jurisdiction", value: "Country + framework profile" },
            { label: "Owner", value: "Current portal user" },
          ]}
          actions={[
            { href: "/dashboard/document-builder", label: "Return to document library", secondary: true },
            { href: "/admin/document-builder", label: "Prepare template content", secondary: true },
          ]}
          sections={[
            {
              title: "Template selection",
              body: "Users will choose from published document types only, so incomplete admin drafts never leak into production.",
            },
            {
              title: "Context capture",
              body: "Country, jurisdiction, language, standards, organisation, and project context will be captured before generation starts.",
            },
          ]}
          notes={[
            "This route is scaffolded and ready for the project creation form and server actions.",
          ]}
        />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
