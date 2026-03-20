import HsesDashboardShell from "../../HsesDashboardShell";
import { TableSkeleton } from "@/components/loading/HsesLoaders";

export default function MapBuilderCategoryLoading() {
  return (
    <HsesDashboardShell eyebrow="Map Builders" title="Loading maps" subtitle="Preparing your map builder workspace.">
      <TableSkeleton rows={7} columns="5% 20% 15% 10% 15% 12.5% 12.5% 10%" showToolbar />
    </HsesDashboardShell>
  );
}
