import type { Metadata } from "next";
import "../../quotes/quote-builder.css";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import ProjectDetailClient from "../ProjectDetailClient";

export const metadata: Metadata = {
  title: "Project Schedule Builder",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;

  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Project Schedule Builder"
      subtitle="Review project milestones, delivery status, and logged time inside the shared admin workspace."
      backHref="/admin/projects"
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        {id ? <ProjectDetailClient projectId={id} /> : <div className="dashboard-panel">Missing project id.</div>}
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
