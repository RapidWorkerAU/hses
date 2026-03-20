import type { Metadata } from "next";
import HsesDashboardShell from "../sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "../sms-diagnostic/dashboard/PortalAccessGate";
import RiskAssessmentsListClient from "./RiskAssessmentsListClient";

export const metadata: Metadata = {
  title: "Risk Assessments",
};

export default function RiskAssessmentsPage() {
  return (
    <HsesDashboardShell
      eyebrow="Risk Assessments"
      title="Risk Assessments"
      subtitle="View and manage risk assessments associated with your account."
    >
      <PortalAccessGate portalKey="risk-assessments">
        <RiskAssessmentsListClient />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
