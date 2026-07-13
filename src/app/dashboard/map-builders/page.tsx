import type { Metadata } from "next";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import MapBuilderLandingClient from "@/components/dashboard/portal/MapBuilderLandingClient";

export const metadata: Metadata = {
  title: "Canvas Creator",
};

export default function CanvasCreatorPage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 bg-[#f7f8fa]">
        <PortalAccessGate portalKey="canvas-creator">
          <MapBuilderLandingClient />
        </PortalAccessGate>
      </div>
    </div>
  );
}
