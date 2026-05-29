import type { Metadata } from "next";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import SmsIntakeClient from "./SmsIntakeClient";

export const metadata: Metadata = {
  title: "System Architect Intake",
};

export default async function SystemArchitectIntakePage({
  params,
}: {
  params: Promise<{ mapId: string }>;
}) {
  const { mapId } = await params;

  return (
    <HsesDashboardShell
      eyebrow="System Architect"
      title="System Architect Intake"
      subtitle="Complete the guided questions for this system map."
      backHref="/dashboard/system-architect"
      backLabel="System Architect"
    >
      <PortalAccessGate portalKey="system-architect">
        <SmsIntakeClient mapId={mapId} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
