import type { Metadata } from "next";
import HsesDashboardShell from "../../../HsesDashboardShell";
import PortalAccessGate from "../../../PortalAccessGate";
import InvestigationReportClient from "./InvestigationReportClient";

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
    <HsesDashboardShell
      eyebrow=""
      title=""
      subtitle=""
      hidePageHeader
    >
      <PortalAccessGate portalKey="canvas-creator">
        <InvestigationReportClient mapId={mapId} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
