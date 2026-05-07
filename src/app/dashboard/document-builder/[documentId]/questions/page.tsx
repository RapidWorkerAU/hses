import type { Metadata } from "next";
import DocumentQuestionnaireClient from "../DocumentQuestionnaireClient";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Questionnaire",
};

export default async function DocumentQuestionnairePage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Document Builder"
      title="Questionnaire"
      subtitle="Collect the operating context that AI needs before rewriting any section."
      backHref={`/dashboard/document-builder/${documentId}`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="document-builder">
        <DocumentQuestionnaireClient documentId={documentId} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
