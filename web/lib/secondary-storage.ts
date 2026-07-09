import { getRedis } from "@/lib/redis";

// Better Auth's SecondaryStorage interface (@better-auth/core/db/type) — wiring this
// makes rate limiting (lib/auth.ts's `rateLimit` config) Redis-backed instead of
// in-memory, which matters here specifically because in-memory rate-limit state
// doesn't survive a dev-server restart and can't be shared across multiple server
// instances in prod. `increment` mirrors the exact fixed-window pattern already used
// server-side in backend/app/core/rate_limit.py (INCR, then EXPIRE only on the
// creation call) for the same reason: one Redis round trip per request, TTL applied
// once, not renewed on every subsequent hit.
export const secondaryStorage = {
  async get(key: string) {
    return getRedis().get(key);
  },
  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await getRedis().set(key, value, "EX", ttl);
    } else {
      await getRedis().set(key, value);
    }
  },
  async delete(key: string) {
    await getRedis().del(key);
  },
  async increment(key: string, ttl: number) {
    const count = await getRedis().incr(key);
    if (count === 1) {
      await getRedis().expire(key, ttl);
    }
    return count;
  },
};
