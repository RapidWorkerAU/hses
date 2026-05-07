import type { Metadata } from "next";
import DocumentBuilderWorkspace from "@/app/document-builder/DocumentBuilderWorkspace";
import { formatDocumentBuilderLabel } from "@/app/document-builder/formatters";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Publish",
};

export default async function DocumentPublishAdminPage({
  params,
}: {
  params: Promise<{ documentTypeId: string }>;
}) {
  const { documentTypeId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Publish"
      subtitle="Control which template version is available to live users."
      backHref={`/admin/document-builder/${documentTypeId}`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <DocumentBuilderWorkspace
          eyebrow="Publishing"
          title={`${formatDocumentBuilderLabel(documentTypeId)} Publish`}
          description="This page will manage draft and published versions, activate the live template version, and protect end users from incomplete configuration while you continue authoring future versions in parallel."
          metrics={[
            { label: "Version State", value: "Draft or published" },
            { label: "Live Control", value: "One active version at a time" },
            { label: "Parallel Authoring", value: "Future drafts stay hidden" },
          ]}
          actions={[
            { href: `/admin/document-builder/${documentTypeId}/preview`, label: "Open preview" },
            { href: "/dashboard/document-builder", label: "Open live module", secondary: true },
          ]}
          sections={[
            {
              title: "Safe release control",
              body: "Publishing is the boundary between admin experimentation and end-user production work.",
            },
            {
              title: "Version continuity",
              body: "Existing projects can keep their originating template version while new projects start from the next published version.",
            },
          ]}
        />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
