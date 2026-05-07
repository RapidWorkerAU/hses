import type { Metadata } from "next";
import DocumentExportClient from "../DocumentExportClient";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Export",
};

export default async function DocumentExportPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Document Builder"
      title="Document Export"
      subtitle="Preview the styled PDF in-page, then print or save it from the PDF viewer."
      backHref={`/dashboard/document-builder/${documentId}/edit`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="document-builder">
        <DocumentExportClient documentId={documentId} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
