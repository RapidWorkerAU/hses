import type { Metadata } from "next";
import HsesDashboardShell from "@/app/sms-diagnostic/dashboard/HsesDashboardShell";
import PortalAccessGate from "@/app/sms-diagnostic/dashboard/PortalAccessGate";
import QuotesListClient from "./QuotesListClient";

export const metadata: Metadata = {
  title: "Quotes & Proposals",
};

export default function QuotesListPage() {
  return (
    <HsesDashboardShell
      eyebrow="Business Admin"
      title="Quotes & Proposals"
      subtitle="Create, manage, and resend proposal access from the same business administration workspace."
      backHref="/dashboard/business-admin"
      backLabel="Back"
    >
      <PortalAccessGate portalKey="business-admin">
        <QuotesListClient />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
