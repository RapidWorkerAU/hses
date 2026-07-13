import type { Metadata } from "next";
import "../../quotes/quote-builder.css";
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
    <PortalAccessGate portalKey="business-admin">
      {id ? (
        <ProjectDetailClient projectId={id} />
      ) : (
        <div className="p-6 text-[13px] text-neutral-500">Missing project id.</div>
      )}
    </PortalAccessGate>
  );
}
