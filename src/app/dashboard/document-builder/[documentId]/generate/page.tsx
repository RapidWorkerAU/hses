import type { Metadata } from "next";
import DocumentGenerationClient from "../DocumentGenerationClient";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Generation",
};

export default async function DocumentGenerationPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Document Builder"
      title="Document Generation"
      subtitle="Generating section drafts from your questionnaire responses."
      backHref={`/dashboard/document-builder/${documentId}/questions`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="document-builder">
        <DocumentGenerationClient documentId={documentId} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
