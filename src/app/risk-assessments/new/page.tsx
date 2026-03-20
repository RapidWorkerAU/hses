import type { Metadata } from "next";
import HsesDashboardShell from "../../sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "../../sms-diagnostic/dashboard/PortalAccessGate";
import RiskAssessmentBuilderClient from "../RiskAssessmentBuilderClient";

export const metadata: Metadata = {
  title: "New Risk Assessment",
};

export default function NewRiskAssessmentPage() {
  return (
    <HsesDashboardShell
      eyebrow="Risk Assessments"
      title="Risk Assessment Builder"
      subtitle="Create your assessment and build risk records for it."
      backHref="/risk-assessments"
      backLabel="Back"
    >
      <PortalAccessGate portalKey="risk-assessments">
        <RiskAssessmentBuilderClient />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
