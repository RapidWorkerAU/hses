import type { Metadata } from "next";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import InvestigationReportClient from "@/components/dashboard/portal/map-builders/investigation-maps/[mapId]/InvestigationReportClient";

export function generateMetadata(): Metadata {
  return { title: "Investigation Report" };
}

export default async function InvestigationReportPage({
  params,
}: {
  params: Promise<{ mapId: string }>;
}) {
  const { mapId } = await params;

  return (
    <PortalAccessGate portalKey="canvas-creator">
      <InvestigationReportClient mapId={mapId} />
    </PortalAccessGate>
  );
}
