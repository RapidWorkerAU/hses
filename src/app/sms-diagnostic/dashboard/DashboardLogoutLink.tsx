"use client";

import { logoutPortalUser } from "@/lib/supabase/logout";

type DashboardLogoutLinkProps = {
  className?: string;
};

export default function DashboardLogoutLink({ className }: DashboardLogoutLinkProps) {
  const handleLogout = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    await logoutPortalUser();
  };

  return (
    <a className={className} href="/login" onClick={handleLogout}>
      Log out
    </a>
  );
}
