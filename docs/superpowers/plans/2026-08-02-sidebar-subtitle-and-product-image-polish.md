# Sidebar Subtitle De-emphasis + Product Image Placeholder Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink the sidebar nav-item subtitle so it reads as a quiet caption instead of competing with the label, and make the recommendation card's no-image state look like an intentional design choice rather than a broken image.

**Architecture:** Both are pure CSS/token changes to existing components — no new components, no data changes. `web/components/app-shell/app-sidebar.tsx` owns the subtitle span; `web/components/products/product-recommendation-card.tsx` owns the placeholder icon block. `docs/milestones/milestone_2/MILESTONE_2_UI_SPEC.md` §2.2 is updated in the same change per `AGENTS.md`'s docs⇄code lockstep rule, since this deliberately overrides its documented 12px/400 spec (owner sign-off given in-session, 2026-08-02).

**Tech Stack:** Next.js, Tailwind CSS v4, shadcn/ui sidebar primitives (`web/components/ui/sidebar.tsx`).

## Global Constraints

- Both light and dark themes must be checked for any UI change (`AGENTS.md` §7.6).
- No new dependencies, no new components — Tailwind utility classes only (ponytail ultra: this is a two-line diff, not a redesign).
- `docs/*.md` updated in the same change as any token/spec change (`AGENTS.md` §6).

---

### Task 1: Shrink sidebar nav-item subtitle

**Files:**
- Modify: `web/components/app-shell/app-sidebar.tsx:111-115`
- Modify: `docs/milestones/milestone_2/MILESTONE_2_UI_SPEC.md` (§2.2 nav item anatomy diagram + the "50% of visual mass" line, ~lines 156-158, 201-206)

**Interfaces:** None — self-contained JSX/className change, no props or exports change.

- [ ] **Step 1: Change the subtitle span's className**

In `web/components/app-shell/app-sidebar.tsx`, replace:

```tsx
{item.subtitle && (
  <span className="truncate text-xs font-normal opacity-70">
    {item.subtitle}
  </span>
)}
```

with:

```tsx
{item.subtitle && (
  <span className="truncate text-[10px] leading-tight font-normal opacity-60">
    {item.subtitle}
  </span>
)}
```

This drops the subtitle from 12px/70%-opacity to 10px/60%-opacity with a tighter line height, so it reads as a caption under the 14px/500 label instead of a near-equal second line.

- [ ] **Step 2: Update the spec doc to match**

In `docs/milestones/milestone_2/MILESTONE_2_UI_SPEC.md`, change the §2.2 diagram:

```
[icon 18px] Label                    ← 14px/500
            Subtitle                 ← 12px/400 muted
```

to:

```
[icon 18px] Label                    ← 14px/500
            Subtitle                 ← 10px/400 muted (owner override 2026-08-02,
                                        was 12px/50%-visual-mass; too dominant in
                                        practice — see docs/DECISIONS.md)
```

And in §1.4's "Two-line nav items" rule, append one line noting the override:

```
   (Revised 2026-08-02: subtitle shrunk to 10px/60%-opacity after owner review found
   12px too visually dominant against the label — see docs/DECISIONS.md.)
```

- [ ] **Step 3: Add an ADR row**

Append to `docs/DECISIONS.md`: a short entry recording that the sidebar subtitle size was reduced from the original 12px/400 screenshot-matched spec to 10px/60%-opacity, owner decision 2026-08-02, reason: subtitle visually dominated the nav item labels in the built app.

- [ ] **Step 4: Visual check, both themes**

Run the web dev server, open `/dashboard` (user role) sidebar in both light and dark mode. Confirm: subtitle is legible but clearly secondary to the label; no truncation/overlap at 240px sidebar width; collapsed-icon state unaffected (subtitle already hidden there via `group-data-[collapsible=icon]:hidden` on the parent span).

- [ ] **Step 5: Commit**

```bash
git add web/components/app-shell/app-sidebar.tsx docs/milestones/milestone_2/MILESTONE_2_UI_SPEC.md docs/DECISIONS.md
git commit -m "fix: de-emphasize sidebar nav-item subtitles"
```

---

### Task 2: Polish the product recommendation card's no-image placeholder

**Files:**
- Modify: `web/components/products/product-recommendation-card.tsx:36-39`

**Interfaces:** None — self-contained JSX/className change inside the existing `else` branch of the `product.image_url ? ... : ...` conditional.

**Context:** Confirmed via direct DB query that no seeded product currently has `image_url` set (0/16 rows), and the two Kaggle datasets already in the repo (`training_dataset/raw/sephora/product_info.csv`, `training_dataset/raw/cosmetics/cosmetics.csv`) have no image column at all — a researched, owner-confirmed data gap, not a rendering bug. The existing fallback (`FlaskConical` icon) is the correct behavior; this task only makes that empty state look designed rather than accidental.

- [ ] **Step 1: Replace the bare icon fallback with a labelled placeholder**

Replace:

```tsx
<div className="text-on-surface-variant/40 flex h-full w-full items-center justify-center">
  <FlaskConical className="size-8" strokeWidth={1.5} />
</div>
```

with:

```tsx
<div className="text-on-surface-variant/50 bg-surface-container-low flex h-full w-full flex-col items-center justify-center gap-1.5">
  <FlaskConical className="size-7" strokeWidth={1.5} />
  <span className="font-geist text-[10px] font-medium tracking-[0.05em] uppercase">
    No photo yet
  </span>
</div>
```

This gives the empty state its own background tint (distinct from the card's `bg-muted` wrapper) and a short caption, so it reads as "this product doesn't have a photo" rather than a missing/broken image.

- [ ] **Step 2: Visual check, both themes**

Run the web dev server, open the Dashboard's "Recommended for you" preview and the full `/products` recommendations grid in both light and dark mode (test user account has no assessment yet, so seed/demo data or a completed assessment is needed to see real recommendation cards — use the demo client data referenced in `credentials.md` if the test `user` account itself has no recommendations yet). Confirm the placeholder is legible and doesn't look broken in either theme, at both `compact` and full card density.

- [ ] **Step 3: Commit**

```bash
git add web/components/products/product-recommendation-card.tsx
git commit -m "fix: give the product recommendation card's no-image state a designed placeholder"
```

---

## Self-Review

**Spec coverage:** Task 1 covers the sidebar sub-title sizing ask; Task 2 covers "optimize the UI for that element" (the no-image state) since the underlying data gap was resolved by owner decision to keep the current catalog with no images (see conversation, 2026-08-02) rather than a dataset change.

**Placeholder scan:** No TBD/TODO; both steps show exact before/after code.

**Type consistency:** No new functions, props, or types introduced in either task.
