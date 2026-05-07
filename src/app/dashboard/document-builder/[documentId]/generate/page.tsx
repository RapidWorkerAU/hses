import type { Metadata } from "next";
import DocumentGenerationClient from "../DocumentGenerationClient";
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
  title: "Document Generation",
};

export default async function DocumentGenerationPage({
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
    ? (documentTypeValue[0]?.title ?? "Document Generation")
    : (documentTypeValue?.title ?? "Document Generation");
  const projectTitle = project?.title?.trim();
  const pageTitle = projectTitle ? `${documentTypeTitle} (${projectTitle})` : documentTypeTitle;

  return (
    <HsesDashboardShell
      eyebrow="Document Builder"
      title={pageTitle}
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
