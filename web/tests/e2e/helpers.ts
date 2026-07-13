import { Pool } from "pg";
import Redis from "ioredis";
import { MongoClient } from "mongodb";
import type { APIRequestContext } from "@playwright/test";

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
    // M2 (Milestone 2 e2e journey) — routines/scores/skin_profiles weren't created by
    // any e2e spec before this, so nothing cleaned these up. FK-safe order: children
    // before parents (routine_products/routine_steps -> routines,
    // skin_profile_concerns -> skin_profiles).
    await db.query(
      "delete from routine_products where routine_id in (select routine_id from routines where user_id = $1)",
      [userId]
    );
    await db.query(
      "delete from routine_steps where routine_id in (select routine_id from routines where user_id = $1)",
      [userId]
    );
    await db.query("delete from routines where user_id = $1", [userId]);
    await db.query(
      "delete from skin_profile_concerns where skin_profile_id in (select skin_profile_id from skin_profiles where user_id = $1)",
      [userId]
    );
    await db.query("delete from skin_profiles where user_id = $1", [userId]);
    await db.query("delete from skin_scores where user_id = $1", [userId]);
    await db.query('delete from session where "userId" = $1', [userId]);
    await db.query('delete from account where "userId" = $1', [userId]);
    await db.query('delete from "user" where id = $1', [userId]);
  } finally {
    await db.end();
  }
  await deleteMongoLogsForUser(userId);
}

// M2 — lifestyle_logs (assessment wizard's lifestyle save) and routine_logs
// (checklist completion) live in Mongo, not Postgres — same real-cleanup discipline
// as the Postgres deletes above, not left to accumulate in the shared dev database.
export async function deleteMongoLogsForUser(userId: string): Promise<void> {
  const client = new MongoClient(process.env.MONGO_URI ?? "mongodb://localhost:27017/skinlytics");
  try {
    await client.connect();
    const db = client.db();
    await db.collection("lifestyle_logs").deleteMany({ user_id: userId });
    await db.collection("routine_logs").deleteMany({ user_id: userId });
  } finally {
    await client.close();
  }
}

// Every spec file that needed a real server-side sign-out (to test switching
// accounts, or confirming a session is actually invalidated, not just hidden
// client-side) called `page.request.post("/api/auth/sign-out")` bare — no body, no
// Origin header. Better Auth 403s that ("Missing or null Origin"), so the call was
// silently a no-op everywhere it was used; nothing surfaced it because /login and
// /signup never used to check session state at all, so a still-signed-in visitor
// landing back on either page looked identical to a genuinely signed-out one. Once
// those pages started redirecting an authenticated visitor away (login/signup
// session-awareness), the stale session became observable: tests expecting a clean
// /login form landed back on their old dashboard instead. Found via a real dev-log
// 403, not a guess.
export async function signOut(request: APIRequestContext): Promise<void> {
  await request.post("/api/auth/sign-out", {
    headers: { Origin: "http://localhost:3000" },
    data: {},
  });
}

export async function promoteRole(userId: string, role: string): Promise<void> {
  const db = pool();
  try {
    await db.query('update "user" set role = $1 where id = $2', [role, userId]);
  } finally {
    await db.end();
  }
}
