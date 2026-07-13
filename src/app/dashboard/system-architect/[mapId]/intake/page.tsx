import type { Metadata } from "next";
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
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-5 pb-4 border-b border-neutral-100 bg-white flex-shrink-0">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">System Architect</p>
        <h1 className="text-[20px] font-semibold text-neutral-900">System Architect Intake</h1>
        <p className="text-[13px] text-neutral-500 mt-[2px]">Complete the guided questions for this system map.</p>
      </div>
      <div className="flex-1 p-6 bg-[#f7f8fa]">
        <PortalAccessGate portalKey="system-architect">
          <SmsIntakeClient mapId={mapId} />
        </PortalAccessGate>
      </div>
    </div>
  );
}
