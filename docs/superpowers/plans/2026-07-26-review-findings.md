# Whole-repo code review findings — 2026-07-26

Scope: `backend/app/**`, `web/**` (excluding `node_modules`, `.venv`, wireframe mockup HTML, Alembic autogen boilerplate). Method: targeted greps against this app's known risk patterns (RBAC coverage, N+1 cohort loops per the recovery pass's precedent, external-call isolation, secret exposure, exception swallowing, dead stub links) rather than a token-costly line-by-line pass, given two prior audit passes already ran this session.

## Checked, clean

- All 15 `router.py` files declare a role check (`require_role`/`require_user`/`require_verified_professional`) — no missing RBAC coverage.
- No cohort-scaling N+1 loops beyond the one already fixed in `clinical_review.get_portfolio_stats` (verified: that function's loop now only aggregates in-memory over pre-bulk-fetched dicts, no regression).
- External HTTP calls stay isolated to `backend/app/integrations/` (pubmed, openuv, openweather) — nothing bypasses the adapter layer.
- No `TODO`/`FIXME`/`XXX` markers in `backend/app` or `web/app`.
- No hardcoded secrets/API keys/passwords in `backend/app`.
- No bare `except Exception: pass` swallowing blocks.

## Findings

1. **`web/components/landing/landing-footer.tsx` — footer nav/social links are all `href="#"` placeholders.** Public marketing landing page only (no authenticated role). Distinct from AGENTS.md §4's "zero `href=\"#\"`" rule, which scopes specifically to the 4 role-based sidebar nav stub routes (P2, already satisfied) — this is marketing-copy footer links to pages (About/Careers/Blog) and social accounts that don't exist yet.
   **Verdict: wontfix this pass.** Cosmetic, pre-existing, no functional impact, and fixing it would mean inventing destination URLs (About/Careers/Blog pages, social handles) that don't exist — exactly the kind of invented content AGENTS.md §8 says to avoid rather than guess into existence.

## Outcome

No `fix-now` findings. The codebase's own gates (ruff, mypy --strict, pytest, tsc, eslint) are already clean, and this session's earlier recovery-pass already fixed the 6 items `M2_RECOVERY_AND_REVIEW.md` had flagged. Task 3 (fix) and Task 4 (verify+commit) have nothing new to act on.
