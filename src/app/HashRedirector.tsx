"use client";

import { useEffect } from "react";

export default function HashRedirector() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash.includes("access_token")) return;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const type = params.get("type");
    const onSetPassword = window.location.pathname.startsWith("/auth/set-password");

    if (type === "recovery" && !onSetPassword) {
      window.location.replace("/auth/set-password" + window.location.hash);
    }
  }, []);

  return null;
}

