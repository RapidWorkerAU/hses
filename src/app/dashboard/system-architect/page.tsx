import type { Metadata } from "next";
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
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 bg-[#f7f8fa]">
        <PortalAccessGate portalKey="system-architect">
          <MapBuilderLandingClient category={systemMapCategory} returnToPath="/dashboard/system-architect" />
        </PortalAccessGate>
      </div>
    </div>
  );
}
