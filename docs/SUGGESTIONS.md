# Suggestions

Recommendations beyond what was asked — things a senior engineer bakes in early because
they're painful to retrofit. Prioritized: **P0** before more feature code · **P1** this
milestone · **P2** when the feature lands (M2–M3) · **P3** later. Items promoted into
accepted decisions are marked → ADR.

## P0 — Privacy, safety & trust (skin/health app with face photos)
- **Treat skin photos as sensitive data.** Explicit consent at capture (checkbox already
  required at registration — `WIREFRAMES.md` §2); per-user **"delete my data"** that
  purges S3 + Mongo + Postgres + vector namespaces; documented retention (raw weather
  already TTLs at 90 days — add a photo retention policy); encrypt at rest; signed URLs
  only; strip EXIF/GPS on upload. Get a legal review for your jurisdictions (India DPDP;
  GDPR if EU users) — this doc is engineering guidance, not legal advice.
- **Consent ledger.** Store *which* policy version each user accepted and when; re-prompt
  on material changes. Cheap now, impossible to reconstruct later.
- **Clinical-access audit log.** Every consultant/dermatologist/admin read of a user's
  skin data writes an immutable row (who, whose, what, when). Health data needs an access
  trail; also what makes the consultant/derm dashboards defensible.
- **"Not medical advice" everywhere it matters.** The product suggests routines/products;
  it does not diagnose. Keep dermatologist clinical outputs visually distinct from AI
  suggestions ("Clinical" tag vs confidence label — `DESIGN.md` §9).
- **Model fairness gate.** Image models must pass the skin-tone (Fitzpatrick/Monk) slice
  evaluation before release — wired as a blocking check in `AI_ML.md`. For a skin product
  this is a correctness issue, not a nice-to-have.

## P1 — Architecture & correctness (this milestone)
- **API versioning from day one** → **ADR-009 (accepted).** Everything under `/api/v1`.
- **Background workers + transactional outbox** → **ADR-010 (accepted).** arq on the
  existing Redis for embeddings, PDF/Excel rendering, notification delivery, weather
  polling; PG→ES/vector projection through the outbox so "derived stores are never
  authored" survives failures. Outbox table exists from M1.
- **Idempotent seeds & migrations.** `make seed` safe to run twice (upserts); Alembic for
  domain tables, Better Auth CLI for identity tables — never mix streams.
- **Contract-first AI stubs** (already ADR-007): request/response shapes frozen in M1 so
  the frontend and M2 models meet in the middle; stubs seeded by `hash(user_id)` for
  stable demos/tests.
- **Structured observability now, dashboards later.** JSON logs with a propagated
  `request_id` (frontend → gateway → services → worker), Sentry-class error tracking, and
  basic OpenTelemetry traces from M1; the PDF's performance metrics become real dashboards
  in M3–M4, surfaced on `/admin/monitoring`.
- **Security hygiene in CI:** dependency scanning (Dependabot), secret scanning, security
  headers/CSP on the web app. A PII-holding skincare app shouldn't ship known-vulnerable
  packages.

## P2 — When the feature lands (M2–M3)
- **Payments hardening (with Stripe/Razorpay):** verify webhook signatures, idempotency
  keys on charge creation, a daily reconciliation job, and a manual-refund runbook.
- **Image pipeline:** max dimensions + recompression, HEIC→JPEG, EXIF strip (P0),
  face-crop guide client-side, and a quality gate (blur/exposure) before an assessment
  runs — bad inputs are the top source of bad AI outputs.
- **Cost & performance for models/vectors:** batch embeddings; re-embed only on source
  change (the outbox gives you this); FAISS in dev keeps M1–M2 free — Pinecone bills per
  vector + query; cache recommendation output (done) and JWKS (done); per-endpoint rate
  limits on the AI/vector path.
- **Load-test the recommendation path** (k6) against the §1 budgets in
  `ARCHITECTURE.md` before M4; fix the slowest stage, not the average.
- **Feature flags** to roll models on per-cohort in M2 without redeploys (pairs with the
  canary plan in `AI_ML.md`).
- **a11y in CI:** axe checks on the 7 M1 screens, including a
  `prefers-reduced-transparency` pass — glass must degrade correctly (ADR-008).

## P3 — Later
- **Backup restore drills** quarterly against the RPO ≤ 24 h / RTO ≤ 4 h targets — a
  backup that's never been restored is a hypothesis.
- **SLOs & error budgets** once traffic exists; alert on budget burn, not raw spikes.
- **Monorepo tooling** (pnpm workspaces / Turborepo) if web + backend + ml grow tangled.
- **`/health` + `/ready` per service** ahead of the M4 container split (trivial to add to
  each router now, valuable at split time).
- **Demo personas:** seeded accounts for all four roles with realistic histories — makes
  every demo, screenshot, and e2e test better.

## Dev workflow / agentic tooling
- **Match the tool to the task:** Claude Code for backend logic and multi-file refactors;
  Antigravity for UI iteration against Stitch designs; Codex/OpenCode where they fit.
  `AGENTS.md` + the committed Graphify graph keep them consistent
  (`docs/AGENT_WORKFLOW.md`).
- **Run Graphify as a shared MCP server** when more than one person/agent works the repo
  (`docs/GRAPHIFY_SETUP.md`).
- **CI (GitHub Actions):** lint + typecheck + tests on PR; nightly `graphify . --update`
  so the committed graph never drifts; `make eval` gate on model-version bumps.
- **Keep PRs small; update `PROGRESS.md` + `docs/DECISIONS.md` in the same PR** — this is
  what makes the next agent session cheap.

## Frontend polish (from the frontend-design skill)
- Own the shadcn components; theme via CSS variables only (incl. `--glass-*` with its
  `@supports` / reduced-transparency fallbacks — ADR-008).
- Sentence-case, active-voice copy; an action keeps its name through its flow.
- Empty states invite action; errors say what went wrong and how to fix it.
- Skeletons (solid, never glass) on dashboard reads; optimistic UI on profile/lifestyle
  saves; one orchestrated motion moment per flow (the score reveal), quiet everywhere else.
