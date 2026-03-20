import type { Metadata } from "next";
import HsesDashboardShell from "../../sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "../../sms-diagnostic/dashboard/PortalAccessGate";
import RiskAssessmentBuilderClient from "../RiskAssessmentBuilderClient";

export const metadata: Metadata = {
  title: "Risk Assessment",
};

export default async function RiskAssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return (
    <HsesDashboardShell
      eyebrow="Risk Assessments"
      title="Risk Assessment Builder"
      subtitle="Edit assessment details and continue building risk records."
      backHref="/risk-assessments"
      backLabel="Back"
    >
      <PortalAccessGate portalKey="risk-assessments">
        <RiskAssessmentBuilderClient initialAssessmentId={assessmentId} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
