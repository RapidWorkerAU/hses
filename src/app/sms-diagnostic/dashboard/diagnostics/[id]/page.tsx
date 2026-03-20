import type { Metadata } from "next";
import HsesDashboardShell from "../../HsesDashboardShell";
import PortalAccessGate from "../../PortalAccessGate";
import DiagnosticDetailClient from "./DiagnosticDetailClient";

export function generateMetadata(): Metadata {
  return {
    title: "Diagnostic detail",
  };
}

export default async function DiagnosticDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <HsesDashboardShell
      eyebrow="Diagnostics"
      title="Diagnostic Detail"
      subtitle="Manage access codes, invitation activity, and participation for this diagnostic."
    >
      <PortalAccessGate portalKey="diagnostics">
        <DiagnosticDetailClient id={id} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
