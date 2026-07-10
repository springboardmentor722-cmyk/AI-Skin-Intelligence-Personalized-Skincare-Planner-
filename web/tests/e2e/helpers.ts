import { Pool } from "pg";
import Redis from "ioredis";

// Branch 8 (feature/testing) — shared by every e2e file that signs a real account
// up or in. This suite hits a real, shared backend (Postgres, Redis, MinIO) rather
// than mocks; nearly every spec file independently reinvented a `pool()`/
// `deleteTestUser()`/rate-limit-clearing helper, and several never cleared the
// *general* rate limit at all (only ADR-013's `/sign-in/email`-specific one),
// which meant the full suite could still trip Better Auth's general default
// ceiling even running fully sequential (playwright.config.ts's `workers: 1`) —
// found while adding this file's own new specs. One shared module now, not eight
// slightly-different copies.

export function pool(): Pool {
  return new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgresql://skinlytics:skinlytics@localhost:5432/skinlytics",
  });
}

export async function clearRateLimits(): Promise<void> {
  // Better Auth's rate-limit keys are always `{ip}|{path}` (createRateLimitKey,
  // @better-auth/core/utils/ip) — never used for anything else (sessions/caches
  // don't contain "|") — so clearing every `*|*` key is safe and general, covering
  // both the per-path default ceiling and ADR-013's `/sign-in/email`-specific rule.
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379/0");
  try {
    const keys = await redis.keys("*|*");
    if (keys.length > 0) await redis.del(...keys);
  } finally {
    await redis.quit();
  }
}

export async function deleteTestUser(userId: string): Promise<void> {
  const db = pool();
  try {
    await db.query("delete from audit_logs where actor_user_id = $1 or target_id = $1", [
      userId,
    ]);
    await db.query("delete from verification_documents where owner_user_id = $1", [userId]);
    await db.query("delete from consultant_profiles where user_id = $1", [userId]);
    await db.query("delete from dermatologist_profiles where user_id = $1", [userId]);
    await db.query("delete from user_appearance_preferences where user_id = $1", [userId]);
    await db.query('delete from session where "userId" = $1', [userId]);
    await db.query('delete from account where "userId" = $1', [userId]);
    await db.query('delete from "user" where id = $1', [userId]);
  } finally {
    await db.end();
  }
}

export async function promoteRole(userId: string, role: string): Promise<void> {
  const db = pool();
  try {
    await db.query('update "user" set role = $1 where id = $2', [role, userId]);
  } finally {
    await db.end();
  }
}
