import type { Metadata } from "next";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import ProjectsListClient from "./ProjectsListClient";

export const metadata: Metadata = {
  title: "Project Schedule Builder",
};

export default function ProjectSchedulePage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 bg-[#f7f8fa]">
        <PortalAccessGate portalKey="business-admin">
          <ProjectsListClient />
        </PortalAccessGate>
      </div>
    </div>
  );
}
