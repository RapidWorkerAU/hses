"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { hasPortalAccess } from "./dashboardPortals";

type PortalAccessGateProps = {
  portalKey: string;
  children: ReactNode;
};

export default function PortalAccessGate({ portalKey, children }: PortalAccessGateProps) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(localStorage.getItem("hses_user_email"));
  }, []);

  const allowed = useMemo(() => {
    if (email === null) return null;
    return hasPortalAccess(email, portalKey);
  }, [email, portalKey]);

  useEffect(() => {
    if (allowed === false) {
      window.location.replace("/dashboard");
    }
  }, [allowed]);

  if (allowed !== true) {
    return null;
  }

  return <>{children}</>;
}
