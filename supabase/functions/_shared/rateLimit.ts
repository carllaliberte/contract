type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = Number(Deno.env.get("AI_RATE_LIMIT_WINDOW_MS") ?? 60_000);
const MAX_REQUESTS = Number(Deno.env.get("AI_RATE_LIMIT_MAX_REQUESTS") ?? 6);

function prune(bucket: Bucket, now: number): void {
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < WINDOW_MS);
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export function checkAiRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(userId) ?? { timestamps: [] };
  prune(bucket, now);

  if (bucket.timestamps.length >= MAX_REQUESTS) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterMs = WINDOW_MS - (now - oldest);
    buckets.set(userId, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(userId, bucket);
  return { allowed: true };
}
