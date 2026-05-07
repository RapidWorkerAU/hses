import type { Metadata } from "next";
import DocumentBuilderWorkspace from "@/app/document-builder/DocumentBuilderWorkspace";
import { formatDocumentBuilderLabel } from "@/app/document-builder/formatters";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";

export const metadata: Metadata = {
  title: "Document Questionnaire Admin",
};

export default async function DocumentQuestionnaireAdminPage({
  params,
}: {
  params: Promise<{ documentTypeId: string }>;
}) {
  const { documentTypeId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Questionnaire"
      subtitle="Define the intake questions and section mappings for one template version."
      backHref={`/admin/document-builder/${documentTypeId}`}
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <DocumentBuilderWorkspace
          eyebrow="Questionnaire Builder"
          title={`${formatDocumentBuilderLabel(documentTypeId)} Questionnaire`}
          description="This page will author grouped questions, conditional display logic, validation rules, and section influence mappings so the AI only receives relevant context for each section."
          metrics={[
            { label: "Question Logic", value: "Grouped and conditional" },
            { label: "Storage", value: "Structured answers" },
            { label: "Section Mapping", value: "Primary and contextual links" },
          ]}
          actions={[
            { href: `/admin/document-builder/${documentTypeId}/sources`, label: "Open sources" },
            { href: `/admin/document-builder/${documentTypeId}/template`, label: "Return to template", secondary: true },
          ]}
          sections={[
            {
              title: "Operational context",
              body: "Questions can gather the business inputs the template does not know yet, such as ownership, permit categories, approval chains, and review intervals.",
            },
            {
              title: "Jurisdiction and standards",
              body: "Questions can also capture country, framework, and standards choices so localisation can stay objective until the jurisdiction is known.",
            },
          ]}
        />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
