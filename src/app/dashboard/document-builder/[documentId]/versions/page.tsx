import type { Metadata } from "next";
import DocumentBuilderWorkspace from "@/app/document-builder/DocumentBuilderWorkspace";
import { formatDocumentBuilderLabel } from "@/app/document-builder/formatters";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Versions",
};

export default async function DocumentVersionsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Document Builder"
      title="Versions"
      subtitle="Review document snapshots and historical exports."
      backHref={`/dashboard/document-builder/${documentId}`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="document-builder">
        <DocumentBuilderWorkspace
          eyebrow="Snapshots"
          title={`${formatDocumentBuilderLabel(documentId)} Versions`}
          description="This page will list document snapshots and export artifacts so each issue can be traced back to the exact content that generated it."
          metrics={[
            { label: "Snapshot Type", value: "Structured JSON" },
            { label: "Export History", value: "Stored by version label" },
            { label: "Audit Goal", value: "Reproducible outputs" },
          ]}
          actions={[
            { href: `/dashboard/document-builder/${documentId}/export`, label: "Open export stage" },
            { href: `/dashboard/document-builder/${documentId}/review`, label: "Open review", secondary: true },
          ]}
          sections={[
            {
              title: "Document snapshots",
              body: "Snapshots will preserve the document state at meaningful milestones such as generation complete, review complete, and export issued.",
            },
            {
              title: "Export artefacts",
              body: "PDF issues will be listed separately from editable snapshots so released outputs remain immutable.",
            },
          ]}
        />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
