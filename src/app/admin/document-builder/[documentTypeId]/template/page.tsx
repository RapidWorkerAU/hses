import type { Metadata } from "next";
import DocumentBuilderWorkspace from "@/app/document-builder/DocumentBuilderWorkspace";
import { formatDocumentBuilderLabel } from "@/app/document-builder/formatters";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Template",
};

export default async function DocumentTemplateAdminPage({
  params,
}: {
  params: Promise<{ documentTypeId: string }>;
}) {
  const { documentTypeId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Template"
      subtitle="Define the structure and baseline content for one document type."
      backHref={`/admin/document-builder/${documentTypeId}`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <DocumentBuilderWorkspace
          eyebrow="Template Builder"
          title={`${formatDocumentBuilderLabel(documentTypeId)} Template`}
          description="This page will manage document sections, ordering, default section content, minimum requirements, placeholders, and section rules. The stored structure here will drive the live tabbed editor."
          metrics={[
            { label: "Section Source", value: "Supabase template tables" },
            { label: "Baseline Content", value: "Objective default wording" },
            { label: "Rewrite Behaviour", value: "Per-section rules" },
          ]}
          actions={[
            { href: `/admin/document-builder/${documentTypeId}/questionnaire`, label: "Open questionnaire" },
            { href: `/admin/document-builder/${documentTypeId}/preview`, label: "Preview draft", secondary: true },
          ]}
          sections={[
            {
              title: "Section design",
              body: "Each section will define what the document must say before the AI localises it for the end user.",
            },
            {
              title: "Prompt-safe structure",
              body: "Storing section rules separately gives you control over what the AI may and may not change in each section.",
            },
          ]}
        />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
