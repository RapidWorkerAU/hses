import type { Metadata } from "next";
import PortalAccessGate from "@/components/dashboard/portal/PortalAccessGate";
import QuotesListClient from "./QuotesListClient";

export const metadata: Metadata = {
  title: "Quotes & Proposals",
};

export default function QuotesListPage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 bg-[#f7f8fa]">
        <PortalAccessGate portalKey="business-admin">
          <QuotesListClient />
        </PortalAccessGate>
      </div>
    </div>
  );
}
