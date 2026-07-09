import Redis from "ioredis";

// Same Redis instance the backend already uses (REDIS_URL, docker-compose.yml's
// `redis` service) — cross-cutting infra per docs/ARCHITECTURE.md §7 ("sessions/
// blacklist, OTP, rate limits, ... caches"), shared by both sides rather than a
// second Redis just for the frontend. Server-side only (lib/auth.ts, a Node
// context) — never imported from a client component.
let client: Redis | null = null;

export function getRedis(): Redis {
  client ??= new Redis(process.env.REDIS_URL ?? "redis://localhost:6379/0");
  return client;
}
