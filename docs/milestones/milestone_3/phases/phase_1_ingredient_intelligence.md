# M3R Phase 1 — Ingredient Intelligence Engine (Rubric Step 1)

**Branch:** `feat/m3r-p1-ingredient-intelligence` (from `dev`) · **Agents:** Backend
Agent + Data Agent (migrations/seeds) + Review Agent · **Depends:** P0 gap table +
frozen safety-score contract. May run in parallel with P3.
**Skills/plugins:** graphify (`graphify explain "ingredient"` first), superpowers TDD
loop, code-review at close.

> Scope discipline: `services/ingredients/` already exists. Extend it. Only build the
> rows P0 marked partial/missing. Everything below is stated as the rubric's literal
> requirement; skip any item P0 proved already done (cite the evidence in the ledger).

## Tasks

- **M3R-P1-T1 — Knowledge base audit & seed.** Ensure PG ingredient tables contain the
  seven rubric active classes (Retinoids, AHAs/BHAs, Vitamin C, Niacinamide, Hyaluronic
  Acid, Ceramides, Peptides) each with: attributes, irritation risk, and incompatible
  active categories. Data Agent: any schema addition = Alembic migration + same-change
  update to `database_schemas/skinlytics_postgresql_schema_v3.sql`. Seeds are
  idempotent scripts, not hand-run SQL. Real Sephora-ingest data (16,303 ingredients)
  must map onto these classes — extend mapping tables, don't fork a new catalog.
- **M3R-P1-T2 — Allergy matching engine.** Cross-reference the user's sensitivity
  profile (from `skin_profile`) against a product's INCI list, flagging direct matches
  **and known aliases** (e.g. tocopherol/Vitamin E). Alias data lives in PG, owned by
  the ingredients service; read of the user profile goes through the skin_profile
  service interface (single-writer rule) — never its tables.
- **M3R-P1-T3 — Chemical conflict matrix.** Strict rules table (PG, config-driven — the
  same philosophy as `scoring_weights`, no hard-coded pair lists in Python) detecting
  incompatible actives **within the same routine step/time** (e.g. Retinoids + strong
  AHAs/BHAs in the same evening step). Severity levels feed the score and labels.
- **M3R-P1-T4 — Safety Score endpoint.** Per the P0-frozen contract: input = product
  ingredient list + routine time; output = score **0–100**, status label
  **`Safe` / `Warning` / `Unsafe`**, allergy alerts, detailed interaction warnings.
  Role: `user` (own profile) + consultant/derm for assigned clients via
  `clinical_review` deps. Response carries `confidence`; UI surfaces the
  "not medical advice" disclaimer. Mount under `/api/v1`; rubric-literal path per the
  P0 conflict resolution. `make openapi` after.
- **M3R-P1-T5 — Tests.** Real-store fixtures (repo pattern, no mocks): each conflict
  pair triggers at the right severity · alias allergy match flags · clean list scores
  Safe · boundary scores map to the right label · role/ownership enforcement (403s).

## Verification (against running stack — paste output)

`curl` the endpoint with (a) a retinoid+AHA evening list → `Unsafe`/`Warning` with the
interaction named, (b) a list containing a seeded user allergen alias → allergy alert,
(c) a benign list → `Safe` with score ≥ threshold. `ruff`/`mypy --strict`/`pytest` green.

## Exit

Ledger rows evidenced → `/code-review` (+ security review: input is user-supplied lists)
→ merge to `dev` → delete branch → `graphify update .` → `PROGRESS.md` entry.
