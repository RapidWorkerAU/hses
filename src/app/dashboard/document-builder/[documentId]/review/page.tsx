import type { Metadata } from "next";
import DocumentBuilderWorkspace from "@/app/document-builder/DocumentBuilderWorkspace";
import { formatDocumentBuilderLabel } from "@/app/document-builder/formatters";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Review",
};

export default async function DocumentReviewPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Document Builder"
      title="Review"
      subtitle="Validate readiness before export."
      backHref={`/dashboard/document-builder/${documentId}/edit`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="document-builder">
        <DocumentBuilderWorkspace
          eyebrow="Quality Review"
          title={`${formatDocumentBuilderLabel(documentId)} Review`}
          description="This page will gather completeness checks across the whole document, including unanswered required questions, sections still pending approval, unresolved placeholders, and jurisdiction or standards gaps."
          metrics={[
            { label: "Review Scope", value: "Document-wide validation" },
            { label: "Checks", value: "Structure, answers, placeholders, localisation" },
            { label: "Outcome", value: "Ready for export or revision" },
          ]}
          actions={[
            { href: `/dashboard/document-builder/${documentId}/export`, label: "Open export" },
            { href: `/dashboard/document-builder/${documentId}/edit`, label: "Return to editor", secondary: true },
          ]}
          sections={[
            {
              title: "Completeness",
              body: "The review stage will confirm that every required section and answer dependency has been addressed.",
            },
            {
              title: "Localisation confidence",
              body: "Warnings can flag where the selected jurisdiction has limited requirement library support or needs manual confirmation.",
            },
          ]}
        />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
