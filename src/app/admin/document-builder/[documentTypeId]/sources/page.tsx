import type { Metadata } from "next";
import DocumentBuilderWorkspace from "@/app/document-builder/DocumentBuilderWorkspace";
import { formatDocumentBuilderLabel } from "@/app/document-builder/formatters";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Sources",
};

export default async function DocumentSourcesAdminPage({
  params,
}: {
  params: Promise<{ documentTypeId: string }>;
}) {
  const { documentTypeId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Sources"
      subtitle="Manage the uploaded reference material used to shape the document output."
      backHref={`/admin/document-builder/${documentTypeId}`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <DocumentBuilderWorkspace
          eyebrow="Reference Sources"
          title={`${formatDocumentBuilderLabel(documentTypeId)} Sources`}
          description="This page will manage uploaded tone guides, structure guides, objective requirement sources, and examples. Source files can be chunked for later AI retrieval without forcing the prompt to include whole documents."
          metrics={[
            { label: "Source Types", value: "Tone, structure, requirements, examples" },
            { label: "Storage", value: "Supabase storage + chunks" },
            { label: "Prompt Usage", value: "Selective retrieval" },
          ]}
          actions={[
            { href: `/admin/document-builder/${documentTypeId}/localisation`, label: "Open localisation" },
            { href: `/admin/document-builder/${documentTypeId}/preview`, label: "Preview draft", secondary: true },
          ]}
          sections={[
            {
              title: "Tone and structure references",
              body: "These files tell the builder how the document should sound and how the final sections should be organised.",
            },
            {
              title: "Minimum requirements references",
              body: "Objective source files can be attached without embedding one country’s implementation approach into the default template.",
            },
          ]}
        />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
