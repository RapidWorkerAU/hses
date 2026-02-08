import crypto from "crypto";

const COOKIE_TTL_MS = 2 * 60 * 60 * 1000;
const COOKIE_NAME = "quote_session";

type QuoteSessionPayload = {
  quoteId: string;
  exp: number;
};

const getSecretKey = () => {
  const raw = process.env.QUOTE_SESSION_SECRET ?? "";
  if (!raw) {
    throw new Error("Missing QUOTE_SESSION_SECRET.");
  }
  return crypto.createHash("sha256").update(raw).digest();
};

export const createQuoteSessionToken = (quoteId: string) => {
  const payload: QuoteSessionPayload = {
    quoteId,
    exp: Date.now() + COOKIE_TTL_MS,
  };
  const iv = crypto.randomBytes(12);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
};

export const readQuoteSessionToken = (token?: string | null) => {
  if (!token) return null;
  try {
    const raw = Buffer.from(token, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const key = getSecretKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
      "utf8"
    );
    const payload = JSON.parse(decrypted) as QuoteSessionPayload;
    if (!payload.quoteId || Date.now() > payload.exp) return null;
    return payload.quoteId;
  } catch {
    return null;
  }
};

export const quoteSessionCookie = {
  name: COOKIE_NAME,
  maxAge: COOKIE_TTL_MS / 1000,
};
