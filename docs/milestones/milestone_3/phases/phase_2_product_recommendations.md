# M3R Phase 2 — Product Recommendation Engine (Rubric Step 2)

**Branch:** `feat/m3r-p2-recommendation-engine` (from `dev`) · **Agents:** Backend Agent
+ Data Agent + Review Agent · **Depends:** P1 (safety gate consumes the ingredient
engine's verdicts via its service interface — never re-implements them).
**Skills/plugins:** graphify, superpowers TDD, code-review.

> `services/recommendations/` v2 exists. Extend per the P0 gap table only.

## Tasks

- **M3R-P2-T1 — Catalog categories & price tiers.** Products classified into the seven
  rubric categories: **Face Wash, Moisturizer, Sunscreen, Serum, Toner, Treatment
  Products, Face Masks**, with mapped active ingredients and price tiers. Map the real
  8,464-product Sephora catalog into these (deterministic mapping table/migration —
  fabricating products is forbidden, AGENTS.md §0.2). Unmappable products get an
  explicit `uncategorized` state, not a guessed category.
- **M3R-P2-T2 — Hard-filter safety gate.** Before scoring, exclude any product whose
  INCI list hits the user's allergens or produces an unsafe clash with their current
  routine — by calling the P1 engine's interface function. Excluded products never
  appear, in any category, at any budget.
- **M3R-P2-T3 — Suitability scoring (50/35/15).** Weighted model: Target Concern Match
  **50%** · Skin Type Fit **35%** · Rating **15%**. Weights live in a config-driven PG
  row (pattern: `scoring_weights`, CHECK sum = 1.00) — retuning is a DB update, not a
  deploy. Score normalizes to a match percentage.
- **M3R-P2-T4 — Budget optimization & alternatives.** Apply the user's max price cap;
  when a top match exceeds it, return a lower-priced alternative with a similar active
  profile (similarity via existing derived stores if P0 confirmed them, else PG active-
  overlap — decide in P0, default PG overlap). Alternatives are labeled as such in the
  payload.
- **M3R-P2-T5 — Recommendation endpoint.** Per frozen contract: categorized results,
  each with match percentage (rendered as e.g. **"94% Match"**), active-ingredient tags,
  price/budget flag, and alternative linkage. Role: `user` (me) + professionals for
  assigned clients. `make openapi` after.
- **M3R-P2-T6 — Tests.** Allergen-containing product excluded even at #1 score ·
  weights sum enforced · concern/skin-type/rating weighting arithmetically exact on a
  fixture catalog · budget cap honored + alternative surfaces · match % stable/rounded
  consistently · ownership 403s.

## Verification (running stack)

Seed a fixture user (oily skin, acne concern, retinol allergy, ₹800 cap): response shows
seven categories, no allergen products anywhere, match percentages descending, at least
one over-budget top match replaced by a flagged cheaper alternative. Paste the JSON.

## Exit

`/code-review` → merge to `dev` → delete branch → `graphify update .` → `PROGRESS.md`.
