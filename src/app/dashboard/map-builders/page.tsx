import type { Metadata } from "next";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import MapBuilderLandingClient from "@/components/dashboard/portal/MapBuilderLandingClient";

export const metadata: Metadata = {
  title: "Canvas Creator",
};

export default function CanvasCreatorPage() {
  return (
    <HsesDashboardShell
      eyebrow="Canvas Creator"
      title="Canvas Creator"
      subtitle="Access every canvas map from one workspace and choose the map category when creating a new one."
    >
      <PortalAccessGate portalKey="canvas-creator">
        <MapBuilderLandingClient />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
