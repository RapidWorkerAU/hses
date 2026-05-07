import type { Metadata } from "next";
import DocumentQuestionnaireClient from "../DocumentQuestionnaireClient";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";
import { createServiceRoleClient } from "@/lib/supabase/server";

type ProjectPageRecord = {
  title: string | null;
  document_types:
    | {
        title: string | null;
      }
    | Array<{
        title: string | null;
      }>
    | null;
};

export const metadata: Metadata = {
  title: "Document Questionnaire",
};

export default async function DocumentQuestionnairePage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .schema("docbuilder")
    .from("document_projects")
    .select("title,document_types(title)")
    .eq("id", documentId)
    .maybeSingle();

  const project = data as ProjectPageRecord | null;
  const documentTypeValue = project?.document_types;
  const documentTypeTitle = Array.isArray(documentTypeValue)
    ? (documentTypeValue[0]?.title ?? "Questionnaire")
    : (documentTypeValue?.title ?? "Questionnaire");
  const projectTitle = project?.title?.trim();
  const pageTitle = projectTitle ? `${documentTypeTitle} (${projectTitle})` : documentTypeTitle;

  return (
    <HsesDashboardShell
      eyebrow="Document Builder"
      title={pageTitle}
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
