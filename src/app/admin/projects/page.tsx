import type { Metadata } from "next";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import ProjectsListClient from "./ProjectsListClient";

export const metadata: Metadata = {
  title: "Project Schedule Builder",
};

export default function ProjectSchedulePage() {
  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Project Schedule Builder"
      subtitle="Track accepted work, allocate hours to milestones, and manage delivery progress from the shared admin workspace."
      backHref="/dashboard/business-admin"
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <ProjectsListClient />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
