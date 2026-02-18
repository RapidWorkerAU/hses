"use client";

import { supabaseBrowser } from "./client";

type RefreshPayload = {
  access_token?: string;
  refresh_token?: string;
  user?: { email?: string; id?: string };
};

const setStoredSession = (payload: RefreshPayload) => {
  if (payload.access_token) {
    localStorage.setItem("hses_access_token", payload.access_token);
  }
  if (payload.refresh_token) {
    localStorage.setItem("hses_refresh_token", payload.refresh_token);
  }
  if (payload.user?.email) {
    localStorage.setItem("hses_user_email", payload.user.email);
  }
  if (payload.user?.id) {
    localStorage.setItem("hses_user_id", payload.user.id);
  }
};

const refreshSessionFromApi = async () => {
  const refreshToken = localStorage.getItem("hses_refresh_token");
  if (!refreshToken) return null;

  const response = await fetch("/api/portal/session/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as RefreshPayload;
  if (!payload.access_token || !payload.refresh_token) return null;
  setStoredSession(payload);
  return payload;
};

export const ensurePortalSupabaseUser = async () => {
  let { data: sessionData } = await supabaseBrowser.auth.getSession();
  let session = sessionData.session;

  if (!session) {
    const accessToken = localStorage.getItem("hses_access_token");
    const refreshToken = localStorage.getItem("hses_refresh_token");

    if (accessToken && refreshToken) {
      const { error } = await supabaseBrowser.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (!error) {
        const next = await supabaseBrowser.auth.getSession();
        session = next.data.session;
      }
    }
  }

  if (!session) {
    const refreshed = await refreshSessionFromApi();
    if (refreshed?.access_token && refreshed.refresh_token) {
      const { error } = await supabaseBrowser.auth.setSession({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
      });
      if (!error) {
        const next = await supabaseBrowser.auth.getSession();
        session = next.data.session;
      }
    }
  }

  if (!session) return null;

  const { data, error } = await supabaseBrowser.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user;
};

