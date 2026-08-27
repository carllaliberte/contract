import { env } from "../env.js";

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket, windowMs: number, now: number): void {
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Sliding-window burst limit per user before LLM calls.
 * Monthly quotas remain the primary enforcement layer.
 */
export function checkAiRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const windowMs = env.aiRateLimitWindowMs;
  const maxRequests = env.aiRateLimitMaxRequests;
  const key = userId;

  const bucket = buckets.get(key) ?? { timestamps: [] };
  prune(bucket, windowMs, now);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterMs = windowMs - (now - oldest);
    buckets.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true };
}

export function clearRateLimitStore(): void {
  buckets.clear();
}
