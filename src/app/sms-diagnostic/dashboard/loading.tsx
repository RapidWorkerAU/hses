import HsesDashboardShell from "./HsesDashboardShell";
import { DetailPageSkeleton } from "@/components/loading/HsesLoaders";

export default function DashboardLoading() {
  return (
    <HsesDashboardShell eyebrow="HSES Industry Tools" title="Loading workspace" subtitle="Preparing your portal content.">
      <DetailPageSkeleton />
    </HsesDashboardShell>
  );
}
