interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanup();
    lastCleanup = now;
  }

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export const RATE_LIMITS = {
  aiAnalysis: { windowMs: 60_000, maxRequests: 10 },
  semanticSearch: { windowMs: 60_000, maxRequests: 30 },
  fileUpload: { windowMs: 3_600_000, maxRequests: 20 },
  serverFunction: { windowMs: 60_000, maxRequests: 60 },
} as const;
