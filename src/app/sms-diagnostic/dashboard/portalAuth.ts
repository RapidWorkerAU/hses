"use client";

type RefreshPayload = {
  access_token?: string;
  refresh_token?: string;
  user?: { email?: string; id?: string };
};

const getStoredToken = () => {
  const rawToken = localStorage.getItem("hses_access_token");
  if (!rawToken || rawToken === "undefined" || rawToken === "null") return null;
  if (rawToken.length < 20) return null;
  return rawToken;
};

const storeTokens = (payload: RefreshPayload) => {
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

export const refreshSession = async () => {
  const refreshToken = localStorage.getItem("hses_refresh_token");
  if (!refreshToken) return null;

  const response = await fetch("/api/portal/session/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as RefreshPayload;
  if (!payload.access_token) {
    return null;
  }

  storeTokens(payload);
  return payload.access_token;
};

export const fetchWithSession = async (url: string, init?: RequestInit) => {
  let token = getStoredToken();
  if (!token) {
    token = await refreshSession();
  }

  if (!token) {
    return { response: null, error: "Missing session token." };
  }

  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    const errorText = await response.text();
    if (errorText.includes("bad_jwt") || errorText.includes("expired")) {
      const refreshedToken = await refreshSession();
      if (!refreshedToken) {
        return { response: null, error: errorText || "Session expired." };
      }

      const retryHeaders = new Headers(init?.headers ?? {});
      retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

      const retryResponse = await fetch(url, {
        ...init,
        headers: retryHeaders,
      });

      return { response: retryResponse, error: null };
    }

    return { response: null, error: errorText || "Unauthorized." };
  }

  return { response, error: null };
};
