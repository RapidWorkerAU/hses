"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { hasAdminEmail } from "@/lib/access/admin";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      let sessionResult = await supabaseBrowser.auth.getSession();
      let session = sessionResult.data.session;
      if (!session) {
        const access = localStorage.getItem("hses_access_token");
        const refresh = localStorage.getItem("hses_refresh_token");
        if (access && refresh) {
          await supabaseBrowser.auth.setSession({
            access_token: access,
            refresh_token: refresh,
          });
          sessionResult = await supabaseBrowser.auth.getSession();
          session = sessionResult.data.session;
        }
      }
      if (!session || !hasAdminEmail(session.user.email)) {
        const redirectTo = pathname ? `?returnTo=${encodeURIComponent(pathname)}` : "";
        router.replace(`/login${redirectTo}`);
        return;
      }
      setChecking(false);
    };
    check();
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center p-12 text-[13px] text-neutral-500">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}
