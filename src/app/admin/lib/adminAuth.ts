"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

export const getAccessToken = async () => {
  const { data } = await supabaseBrowser.auth.getSession();
  return data.session?.access_token ?? null;
};
