import type { Metadata } from "next";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import MapBuilderLandingClient from "@/components/dashboard/portal/MapBuilderLandingClient";
import { MAP_BUILDER_CATEGORY_BY_ID } from "@/components/dashboard/portal/mapBuilderCategories";

export const metadata: Metadata = {
  title: "System Architect",
};

const systemMapCategory = MAP_BUILDER_CATEGORY_BY_ID.get("system_map");

export default function SystemArchitectPage() {
  if (!systemMapCategory) {
    throw new Error("System map category is not configured.");
  }

  return (
    <HsesDashboardShell
      eyebrow="System Architect"
      title="System Architect"
      subtitle="Create, link, duplicate, and manage system maps for your management system architecture."
    >
      <PortalAccessGate portalKey="system-architect">
        <MapBuilderLandingClient category={systemMapCategory} returnToPath="/dashboard/system-architect" />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
