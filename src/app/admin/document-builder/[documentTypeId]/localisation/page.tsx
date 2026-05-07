import type { Metadata } from "next";
import DocumentBuilderWorkspace from "@/app/document-builder/DocumentBuilderWorkspace";
import { formatDocumentBuilderLabel } from "@/app/document-builder/formatters";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Localisation",
};

export default async function DocumentLocalisationAdminPage({
  params,
}: {
  params: Promise<{ documentTypeId: string }>;
}) {
  const { documentTypeId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Localisation"
      subtitle="Map jurisdictions, frameworks, standards, and requirements to this document type."
      backHref={`/admin/document-builder/${documentTypeId}`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <DocumentBuilderWorkspace
          eyebrow="Localisation Mapping"
          title={`${formatDocumentBuilderLabel(documentTypeId)} Localisation`}
          description="This page will manage which jurisdictions are planned, supported, or validated for the document type, and which requirement sets or individual requirements are relevant to the overall document or a specific section."
          metrics={[
            { label: "Jurisdiction Status", value: "Planned, supported, validated" },
            { label: "Requirement Source", value: "Requirement sets and library items" },
            { label: "Link Scope", value: "Whole document or section-specific" },
          ]}
          actions={[
            { href: `/admin/document-builder/${documentTypeId}/preview`, label: "Preview localisation" },
            { href: `/admin/document-builder/${documentTypeId}/publish`, label: "Open publish controls", secondary: true },
          ]}
          sections={[
            {
              title: "Jurisdiction enablement",
              body: "You can progressively support new countries and frameworks without changing the live editor or questionnaire code.",
            },
            {
              title: "Requirement reuse",
              body: "Requirements are stored once and linked where relevant, so multiple documents can reuse the same jurisdictional material later.",
            },
          ]}
        />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
