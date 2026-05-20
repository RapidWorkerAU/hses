import type { Metadata } from "next";
import "../quote-builder.css";
import HsesDashboardShell from "@/components/dashboard/portal/HsesDashboardShell";
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
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Quote Builder"
      subtitle="Build, revise, and publish detailed client proposals from the shared admin workspace."
      backHref="/admin/quotes"
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <div className="mobile-blocked-message" role="status" aria-live="polite">
          Quote builder is not available on mobile. Please use a desktop device.
        </div>
        <QuoteBuilderClient quoteId={id} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
