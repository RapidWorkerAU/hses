"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      let { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) {
        const access = localStorage.getItem("hses_access_token");
        const refresh = localStorage.getItem("hses_refresh_token");
        if (access && refresh) {
          await supabaseBrowser.auth.setSession({
            access_token: access,
            refresh_token: refresh,
          });
          data = await supabaseBrowser.auth.getSession();
        }
      }
      if (!data.session) {
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
      <div className="flex min-h-screen items-center justify-center bg-mist text-sm text-slate-600">
        Checking admin access...
      </div>
    );
  }

  return <>{children}</>;
}
