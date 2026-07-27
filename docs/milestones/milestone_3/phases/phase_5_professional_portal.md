# M3R Phase 5 — Consultant & Dermatologist Portal (Rubric Step 4.2)

**Branch:** `feat/m3r-p5-professional-portal` (from `dev`) · **Agents:** Frontend Agent
+ Backend Agent (only if a portal read/write surface is missing) + Review Agent ·
**Depends:** P3 (photos/adherence), P4-T2 (live checklist sync counterpart).
**Skills/plugins:** shadcn, migrate-radix-to-base, ui-ux-pro-max, frontend-design,
graphify, code-review.

> Clinical review (roster, `clinical_review` service, `_verify_assignment`) exists from
> M2; portal dashboards exist. Nav lists are FIXED (AGENTS.md §4) — everything below
> lives inside existing Consultant (Clients/…) and Dermatologist (Patients/…) nav items,
> no new sidebar entries. Both roles share the same components with role-appropriate
> wording; every read is assignment-scoped server-side.

## Tasks

- **M3R-P5-T1 — Patient roster panel.** Searchable list of *assigned* clients showing:
  primary concerns, current health score, and compliance metrics (7/30-day from the P3
  analytics surface). Search is server-side over assigned clients only. Verify against
  the earlier N+1 fix — roster must stay one bounded query path.
- **M3R-P5-T2 — Patient inspection view.** Visual timeline for one client: survey/
  assessment details, adherence trend, score timeline — all read via `clinical_review`
  + the P3 analytics endpoint with `_verify_assignment` enforced. "Not medical advice"
  disclaimer present; AI-derived values show `confidence`.
- **M3R-P5-T3 — Side-by-side photo comparison.** **Baseline vs Current** progress
  photos side by side (rubric-literal), using tags + presigned URLs from P3; selector
  to compare any two tagged photos; each photo captioned with its date + frozen
  score-at-upload. Presigned URLs fetched on view, never persisted in client state
  beyond their TTL.
- **M3R-P5-T4 — Prescription/Routine overwrite form.** Form to update the client's
  routine (add/remove/edit AM/PM steps). Backend: mutation goes through the routines
  service (single writer) with professional role + assignment check; every overwrite is
  attributable (who/when — extend the audit pattern if P0 found no trail). On save, the
  client's daily checklist reflects the change **immediately** (P4-T2's refetch
  contract) — this exact sync is rubric-graded and exercised in P6's E2E.
- **M3R-P5-T5 — States + fidelity.** Empty roster, unassigned-client 403 surfaced
  correctly (not a blank crash), loading/error states, both themes, wireframe
  side-by-side crops stored under `docs/milestones/milestone_3/build/`.

## Verification (running stack)

As admin, assign a seeded user to a consultant and a dermatologist. As each
professional: roster shows only assigned clients (and search misses others) → open
inspection view → Baseline vs Current renders with captions → edit an evening treatment
step → as the user, checklist shows the revised step without a manual reload (within
the contract's refresh window). Cross-role 403 attempts pasted. Frontend gates green.

## Exit

`/code-review` (+ security review: clinical data access) → merge to `dev` → delete
branch → `graphify update .` → `PROGRESS.md`.
