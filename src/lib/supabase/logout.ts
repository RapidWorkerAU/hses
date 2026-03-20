"use client";

import { supabaseBrowser } from "./client";

export async function logoutPortalUser(redirectTo = "/login") {
  localStorage.removeItem("hses_access_token");
  localStorage.removeItem("hses_refresh_token");
  localStorage.removeItem("hses_user_email");
  localStorage.removeItem("hses_user_id");
  localStorage.removeItem("hses_dashboard_sidebar_collapsed");
  sessionStorage.removeItem("hses_session_only");

  try {
    await supabaseBrowser.auth.signOut();
  } catch {
    // Clearing local state is enough to continue to the login page.
  }

  window.location.assign(redirectTo);
}
