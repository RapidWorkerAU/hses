import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import { DetailPageSkeleton } from "@/components/loading/HsesLoaders";

export default function AdminLoading() {
  return (
    <HsesDashboardShell eyebrow="Business Admin" title="Loading admin workspace" subtitle="Preparing your quotes and project tools.">
      <DetailPageSkeleton />
    </HsesDashboardShell>
  );
}
