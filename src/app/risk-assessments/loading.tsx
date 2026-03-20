import HsesDashboardShell from "../sms-diagnostic/dashboard/HsesDashboardShell";
import { DetailPageSkeleton } from "@/components/loading/HsesLoaders";

export default function RiskAssessmentsLoading() {
  return (
    <HsesDashboardShell eyebrow="Risk Assessments" title="Loading risk assessments" subtitle="Preparing your assessments and records.">
      <DetailPageSkeleton />
    </HsesDashboardShell>
  );
}
