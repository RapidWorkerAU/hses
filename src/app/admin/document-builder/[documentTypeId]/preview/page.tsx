import type { Metadata } from "next";
import DocumentBuilderWorkspace from "@/app/document-builder/DocumentBuilderWorkspace";
import { formatDocumentBuilderLabel } from "@/app/document-builder/formatters";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Preview",
};

export default async function DocumentPreviewAdminPage({
  params,
}: {
  params: Promise<{ documentTypeId: string }>;
}) {
  const { documentTypeId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Preview"
      subtitle="Run a dry preview before publishing a document type version."
      backHref={`/admin/document-builder/${documentTypeId}`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <DocumentBuilderWorkspace
          eyebrow="Template Preview"
          title={`${formatDocumentBuilderLabel(documentTypeId)} Preview`}
          description="This page will run controlled sample generations against the current draft version so you can verify the questionnaire, source material, requirement mappings, and section rules before publishing it to the live module."
          metrics={[
            { label: "Preview Mode", value: "Sample answers against draft version" },
            { label: "Validation Goal", value: "Structure and localisation quality" },
            { label: "Release Gate", value: "Author review before publish" },
          ]}
          actions={[
            { href: `/admin/document-builder/${documentTypeId}/publish`, label: "Open publish controls" },
            { href: `/admin/document-builder/${documentTypeId}/template`, label: "Return to template", secondary: true },
          ]}
          sections={[
            {
              title: "Pre-publish confidence",
              body: "Previewing the draft version avoids pushing broken structure or poor localisation into the live user workflow.",
            },
            {
              title: "Section-by-section inspection",
              body: "Because generation is section-based, preview results can show exactly where a template or requirement mapping needs adjustment.",
            },
          ]}
        />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
