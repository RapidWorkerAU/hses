import type { Metadata } from "next";
import HsesDashboardShell from "../HsesDashboardShell";
import PortalAccessGate from "../PortalAccessGate";
import MapBuilderLandingClient from "../MapBuilderLandingClient";

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
