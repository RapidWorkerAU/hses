export const ADMIN_EMAIL = "ashleigh.phillips@hses.com.au";

export const normalizeEmail = (email: string | null | undefined) =>
  (email ?? "").trim().toLowerCase();

export const hasAdminEmail = (email: string | null | undefined) =>
  normalizeEmail(email) === ADMIN_EMAIL;
