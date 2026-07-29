# Identity — Better Auth (Next.js) + FastAPI JWKS validation

How authentication actually wires together. Decisions: ADR-002 (Better Auth is the auth
authority), ADR-003 (string IDs). Verified against Better Auth docs (JWT plugin + JWKS)
and the Better Auth ↔ FastAPI JWKS pattern.

## Flow
```
User signs in (Next.js, Better Auth: email/password or OAuth2 social)
   → Better Auth creates the session + issues a JWT (JWT plugin), asymmetric (EdDSA/RS256)
   → Frontend calls FastAPI with  Authorization: Bearer <jwt>
   → FastAPI fetches+caches JWKS from /api/auth/jwks, verifies signature (by kid),
     checks iss / aud / exp / nbf, reads role claim → allows/denies
```
Better Auth owns identity; FastAPI never touches passwords and never mints tokens.

## Frontend — `web/lib/auth.ts`
```ts
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { admin } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: process.env.BETTER_AUTH_URL,           // e.g. http://localhost:3000
  emailAndPassword: { enabled: true },            // scrypt hashing built in
  socialProviders: {
    google:   { clientId: process.env.GOOGLE_CLIENT_ID!,   clientSecret: process.env.GOOGLE_CLIENT_SECRET! },
    // facebook, apple … as needed
  },
  account: {                                      // ADR-011 — no email-verification flow
    accountLinking: {                              // exists yet, so requiring the *local*
      enabled: true,                                // account to already be verified would
      trustedProviders: ["google"],                 // permanently block every email/password
      requireLocalEmailVerified: false,              // user from ever using Google sign-in.
    },
  },
  plugins: [
    jwt(),        // issues JWTs + exposes JWKS at /api/auth/jwks (creates the `jwks` table)
    admin({       // RBAC: our four roles
      // define access-control roles with createAccessControl in web/lib/permissions.ts
      // roles: user | consultant | dermatologist | admin  (stored on user.role)
    }),
  ],
  // IDs: keep Better Auth defaults (string). Do NOT set useNumberId (ADR-003).
});
```
`web/app/api/auth/[...all]/route.ts` mounts the handler; `web/lib/auth-client.ts` is the
client (`createAuthClient` + `jwtClient` + `adminClient`). Get a token for backend calls
with `authClient.token()` or read the `set-auth-jwt` header from `getSession()`.

Generate/refresh the DB tables (user, session, account, verification, jwks):
```bash
npx @better-auth/cli generate     # emits the SQL/schema — keep separate from Alembic
npx @better-auth/cli migrate      # or apply directly
```
**Confirmed against the live schema (2026-07-22, `web/tests/e2e/helpers.ts`):** the
`session` table doesn't actually exist in this deployment's Postgres — `web/lib/auth.ts`
wires a Redis-backed `secondaryStorage` (`web/lib/secondary-storage.ts`), and with no
explicit `session: { storeSessionInDatabase: true }` override, Better Auth keeps
sessions in Redis instead. The `generate`/`migrate` commands above were never run for
`session` in this environment; only `user`/`account`/`verification`/`jwks` are real
Postgres tables here. This doc's `auth.ts` code block above predates the
`secondaryStorage` + rate-limit additions — `web/lib/auth.ts` itself is the current
source of truth for the exact config.

## Backend — `backend/app/core/security.py` (validate, don't authenticate)
```python
import time, httpx, jwt
from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWKClient
from app.core.config import settings   # BETTER_AUTH_URL, JWT_ISSUER, JWT_AUDIENCE

bearer = HTTPBearer(auto_error=True)

@lru_cache(maxsize=1)
def _jwk_client() -> PyJWKClient:
    # JWKS rarely changes; cache the client. Rotate cache if an unknown `kid` appears.
    return PyJWKClient(f"{settings.BETTER_AUTH_URL}/api/auth/jwks")

def _decode(token: str) -> dict:
    try:
        signing_key = _jwk_client().get_signing_key_from_jwt(token).key
        return jwt.decode(
            token, signing_key,
            algorithms=["EdDSA", "RS256"],
            issuer=settings.JWT_ISSUER,        # = BETTER_AUTH_URL
            audience=settings.JWT_AUDIENCE,    # = BETTER_AUTH_URL by default
            options={"require": ["exp", "iss", "aud"]},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}")

async def require_user(cred: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    claims = _decode(cred.credentials)
    return {"id": claims["sub"], "role": claims.get("role", "user"), "claims": claims}

def require_role(*allowed: str):
    async def _dep(user: dict = Depends(require_user)) -> dict:
        if user["role"] not in allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role")
        return user
    return _dep
```

Usage in a service router:
```python
from fastapi import APIRouter, Depends
from app.core.security import require_user, require_role

router = APIRouter()

@router.get("/me/profile")
async def my_profile(user: dict = Depends(require_user)):
    return get_profile(user["id"])          # user["id"] is a TEXT id from Better Auth

@router.get("/admin/users", dependencies=[Depends(require_role("admin"))])
async def list_users():
    ...
```

## Roles & permissions
Defined once with `createAccessControl` (Better Auth admin plugin) in
`web/lib/permissions.ts`: `user`, `consultant`, `dermatologist`, `admin`, each mapped to
resource/action permissions. The role is stored on `user.role` and embedded in the JWT, so
FastAPI enforces it with `require_role(...)` — no separate roles table (ADR-003).

## Revocation / logout
Stateless JWTs can't be "deleted". For instant logout or ban, FastAPI checks Redis
`auth:blacklist:{jti}` (TTL = token lifetime) before accepting a token. Better Auth's admin
plugin `banned`/`banExpires` on `user` covers longer-term bans.

## Gotchas (from the field)
- `require_user` uses the `sub` claim as the user id — it's a **string**. All domain FKs
  are `TEXT` to match (ADR-003).
- Cache JWKS, but refetch if a token arrives with an unknown `kid` (key rotation).
- `iss`/`aud` must equal `BETTER_AUTH_URL` (default). Mismatch → 401; check first when debugging.
- Better Auth has no `useSession` hook — use `authClient.getSession()` in an effect.
- The JWT plugin creates the `jwks` table but does not modify `session`; run its migration.
- `account_not_linked` on an OAuth callback means a `user` row with that email already
  exists and didn't qualify for auto-linking — see ADR-011 for the exact condition and
  why `requireLocalEmailVerified: false` is required here specifically (no email
  verification flow exists, so the local account's email is never verified).
