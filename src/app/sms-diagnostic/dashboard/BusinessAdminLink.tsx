"use client";

import { useEffect, useState } from "react";

const ADMIN_EMAIL = "ashleigh.phillips@hses.com.au";

type BusinessAdminLinkProps = {
  className?: string;
};

export default function BusinessAdminLink({ className }: BusinessAdminLinkProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("hses_user_email")?.toLowerCase() ?? "";
    setIsVisible(storedEmail === ADMIN_EMAIL);
  }, []);

  if (!isVisible) return null;

  return (
    <a
      className={className ? `${className} dashboard-sidebar-link--outline` : "dashboard-sidebar-link--outline"}
      href="/sms-diagnostic/dashboard/business-admin"
    >
      Business Admin
    </a>
  );
}
