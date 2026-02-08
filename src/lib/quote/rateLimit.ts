type RateEntry = { count: number; resetAt: number };

const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 8;

const store = new Map<string, RateEntry>();

export const rateLimit = (key: string) => {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  store.set(key, entry);
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
};
