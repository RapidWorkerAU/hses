import type { Metadata } from "next";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import QuoteBuilderClient from "../QuoteBuilderClient";

export const metadata: Metadata = {
  title: "Quote Builder",
};

export default async function QuoteBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <PortalAccessGate portalKey="business-admin">
          <div className="md:hidden px-6 py-8 text-[13px] text-neutral-600">
            Quote builder is not available on mobile. Please use a desktop device.
          </div>
          <div className="hidden md:flex h-full w-full">
            <QuoteBuilderClient quoteId={id} />
          </div>
        </PortalAccessGate>
      </div>
    </div>
  );
}
