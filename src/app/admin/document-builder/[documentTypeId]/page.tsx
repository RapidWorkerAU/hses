import type { Metadata } from "next";
import DocumentBuilderWorkspace from "@/app/document-builder/DocumentBuilderWorkspace";
import { formatDocumentBuilderLabel } from "@/app/document-builder/formatters";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Type Admin",
};

export default async function DocumentTypeAdminPage({
  params,
}: {
  params: Promise<{ documentTypeId: string }>;
}) {
  const { documentTypeId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Document Type"
      subtitle="Manage one document type across template structure, questionnaire, references, localisation, and publishing."
      backHref="/admin/document-builder"
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <DocumentBuilderWorkspace
          eyebrow="Document Type Overview"
          title={formatDocumentBuilderLabel(documentTypeId)}
          description="This overview is the control point for one document type. It will summarise draft and published versions, supported jurisdictions, question counts, source files, and last publish details."
          metrics={[
            { label: "Document Type Id", value: documentTypeId },
            { label: "Versioning", value: "Template versions" },
            { label: "Publishing", value: "Draft until explicitly published" },
          ]}
          actions={[
            { href: `/admin/document-builder/${documentTypeId}/template`, label: "Edit template" },
            { href: `/admin/document-builder/${documentTypeId}/questionnaire`, label: "Edit questionnaire", secondary: true },
            { href: `/admin/document-builder/${documentTypeId}/publish`, label: "Open publish controls", secondary: true },
          ]}
          sections={[
            {
              title: "Template composition",
              body: "Sections, objectives, default content, prompt rules, and placeholders all sit under the template definition for this document type.",
            },
            {
              title: "Localisation support",
              body: "Jurisdictions and requirement sets are linked here so the live generator can localise content without changing the underlying template structure.",
            },
          ]}
        />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
