# M3R Phase 3 — Progress Tracking & Cloud Photo Pipeline (Rubric Step 3)

**Branch:** `feat/m3r-p3-progress-photo-pipeline` (from `dev`) · **Agents:** Backend
Agent + Data Agent + Review Agent (security review mandatory — user photos) ·
**Depends:** P0 contracts. May run in parallel with P1.
**Skills/plugins:** graphify, superpowers TDD, code-review.

> `services/progress/` + `core/storage.py` (MinIO/S3, EXIF-strip, presigned URLs) are
> real and live-verified. This phase closes rubric-literal gaps only — expected hot
> spots from P0: the **90-day** window, **score-at-upload + tag** metadata, and the
> analytics payload shape.

## Tasks

- **M3R-P3-T1 — AM/PM check-in logging (MongoDB).** Verify/extend the Mongo
  `routine_logs` flow so each completed AM/PM routine-step check-in is an individual
  recorded event (user, routine step ref, AM/PM, timestamp). Mongo is the owner of this
  fact (schema mirror: `database_schemas/` Mongo v3 doc — update in the same change if
  the document shape grows).
- **M3R-P3-T2 — Adherence math engine (7/30/90).** Rolling **7-day, 30-day, and 90-day**
  compliance = completed steps ÷ assigned steps in the window. Handle: routine changed
  mid-window (assigned counts follow what was assigned each day, not today's routine),
  day-boundary/timezone (reuse the M1 day-boundary fix in `scores/service.py` — same
  convention, one implementation), zero-assigned days excluded from the denominator.
  Pure functions, exhaustively unit-tested.
- **M3R-P3-T3 — Photo pipeline metadata.** Upload keeps streaming through
  `core/storage.py` (private bucket, presigned URLs, EXIF stripped, content-type
  sniffed). PG metadata row must literally include: **cloud URL (or object key), upload
  timestamp, skin-health score at time of upload** (read from the scores service
  interface at upload time), **and a tag** (`Baseline`, `Week 4`, …; default: first
  photo auto-tags `Baseline`, others computed from weeks-since-baseline, user-editable
  label). Alembic migration + canonical SQL mirror for any new columns.
- **M3R-P3-T4 — Analytics endpoint.** Per frozen contract: historical score timeline,
  7/30/90 compliance percentages, and progress-photo entries (presigned links + tags +
  score-at-upload) shaped for charting and Baseline-vs-Current comparison. Roles: user
  (me) + assigned professionals. This is the single read surface P4/P5 charts consume —
  no dashboard-side recomputation. `make openapi` after.
- **M3R-P3-T5 — Tests.** Adherence fixtures: full/partial/zero completion per window ·
  mid-window routine change · 89-vs-90-day boundary · photo upload writes exact
  metadata (score snapshot frozen even after the live score changes) · presigned URL
  expiry · non-image upload rejected · cross-user photo access 403.

## Verification (running stack)

Check off routine steps across seeded days, upload two photos (one Baseline, one later)
→ hit the analytics endpoint → paste JSON showing all three windows, the timeline, and
both photos with tags + frozen scores. Confirm the raw bucket object is NOT publicly
fetchable and the presigned link works once.

## Exit

Security review (photo handling) + `/code-review` → merge to `dev` → delete branch →
`graphify update .` → `PROGRESS.md`.
