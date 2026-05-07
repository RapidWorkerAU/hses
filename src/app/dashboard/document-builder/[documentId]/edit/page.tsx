import type { Metadata } from "next";
import DocumentSectionEditorClient from "../DocumentSectionEditorClient";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Editor",
};

export default async function DocumentEditPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Document Builder"
      title="Document Editor"
      subtitle="Review generated section content, refine the draft, and inspect any generated artifacts below the editor."
      backHref={`/dashboard/document-builder/${documentId}/questions`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="document-builder">
        <DocumentSectionEditorClient documentId={documentId} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
