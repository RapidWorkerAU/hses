"use client";

import { getAccessToken } from "./adminAuth";

export const fetchAdmin = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = await getAccessToken();
  const headers = new Headers(init?.headers ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
};
