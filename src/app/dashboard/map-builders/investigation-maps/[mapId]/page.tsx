import type { Metadata } from "next";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import InvestigationReportClient from "@/components/dashboard/portal/map-builders/investigation-maps/[mapId]/InvestigationReportClient";

export function generateMetadata(): Metadata {
  return {
    title: "Investigation Report",
  };
}

export default async function InvestigationReportPage({
  params,
}: {
  params: Promise<{ mapId: string }>;
}) {
  const { mapId } = await params;

  return (
    <HsesDashboardShell eyebrow="" title="" subtitle="" hidePageHeader>
      <PortalAccessGate portalKey="canvas-creator">
        <InvestigationReportClient mapId={mapId} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
