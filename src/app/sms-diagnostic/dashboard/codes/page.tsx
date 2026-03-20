import type { Metadata } from "next";
import HsesDashboardShell from "../HsesDashboardShell";
import PortalAccessGate from "../PortalAccessGate";
import CodesRegisterClient from "./CodesRegisterClient";

export const metadata: Metadata = {
  title: "Diagnostic Code Register",
};

export default function CodesRegisterPage() {
  return (
    <HsesDashboardShell
      eyebrow="Diagnostics"
      title="Code Register"
      subtitle="A complete table of every diagnostic code issued to your account across domains, modules, and diagnostics."
    >
      <PortalAccessGate portalKey="diagnostics">
        <CodesRegisterClient />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
