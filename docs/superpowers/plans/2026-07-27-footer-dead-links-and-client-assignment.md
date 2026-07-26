# Footer Dead Links & Client Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix bug #6 (landing page footer/legal links are all `href="#"`) and bug #5
(Consultant's "Add New Client" topbar button is a dead end) from `bugs_report.md`
(2026-07-26 full-app QA pass).

**Architecture:** Bug #6 reuses this repo's own existing, explicitly-documented "zero
`href="#"`, zero dead links" pattern (`docs/milestones/milestone_2/
MILESTONE_2_MASTER_PROMPT.md` P2, `components/app-shell/coming-soon.tsx`) — built for
the authenticated app shell, extended here with a public (no-sidebar) equivalent. One
footer link (`AI Diagnostic`) gets a real destination (the already-built `/assessment`
wizard); the rest get honest "not yet published" stub pages, never fabricated legal
text. Bug #5 finishes a "deliberate follow-up, not built this pass" the backend already
flags in two comments (`backend/app/services/admin/router.py:207`,
`backend/app/services/admin/service.py:214`) — a working, already-tested
`POST /api/v1/admin/consultant-clients` endpoint with no UI in front of it. This plan
builds that Admin UI and removes the Consultant's structurally-impossible self-service
button.

**Tech Stack:** Next.js App Router + shadcn (`Empty`, `Dialog`, `Combobox`) for the
frontend; FastAPI + SQLAlchemy for the one backend test gap; Better Auth's admin plugin
`listUsers` (already installed) for the professional/client picker's search.

## Global Constraints

- `AGENTS.md` §0: never invent a visual pattern not already in `web/designs/wireframes/`
  — confirmed the landing footer's markup (3 columns + social icons) already matches
  `landing-page.html` byte-for-byte; only link *targets* change, not the visual design.
- `AGENTS.md` §0.2 / §8: never fabricate content. Legal pages (Privacy Policy, Terms of
  Service, HIPAA Compliance) get an honest "not yet published" stub, never invented
  legal text — this is a compliance risk, not a style choice, on a health-adjacent app.
- `AGENTS.md` §4: only shadcn primitives already used in this project. `Combobox`
  (single-select, non-chips variant) and `Dialog` are both already installed and used
  elsewhere (`components/skin-profile/allergy-ingredient-select.tsx`,
  `components/ingredients/ingredient-list.tsx`) — reuse their exact composition.
- `AGENTS.md` §5: Better Auth is the only identity source; the FastAPI backend never
  reads Better Auth's tables directly. The professional/client picker must go through
  the existing `web/app/api/admin/users/route.ts` wrapper, not a new backend endpoint.
- `AGENTS.md` §6: admin mutations are audit-logged via the single `write_audit_log` path
  — `service.assign_client` already does this; don't bypass it.
- Regenerate nothing: `POST /api/v1/admin/consultant-clients` is already in
  `web/lib/api-types.ts` (confirmed, line 851) — no `make openapi` needed for bug #5.
- No `Co-Authored-By: Claude` in any commit message (owner decision, `AGENTS.md` §6).

---

## Part A — Bug #6: footer dead links

### Task A1: Build the public "not yet published" stub page component

**Files:**
- Create: `web/components/landing/public-stub-page.tsx`
- Test: `web/tests/e2e/landing-footer.spec.ts` (created fully in Task A3, referenced
  here for the component contract)

**Interfaces:**
- Produces: `PublicStubPage({ title: string; description: string; disclaimer?: string
  })` — a full-page component (own `<LandingNavbar>`/`<LandingFooter>` chrome), default
  exported from each of the 8 thin route files in Task A2.

- [ ] **Step 1: Write the component**

```tsx
import { FileQuestion } from "lucide-react";

import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface PublicStubPageProps {
  title: string;
  description: string;
  /** Legal pages only — an honest "this isn't reviewed legal text yet" notice, never
   * fabricated policy content (AGENTS.md §8). */
  disclaimer?: string;
}

// Public equivalent of components/app-shell/coming-soon.tsx's "zero href='#', zero
// dead links" pattern (docs/milestones/milestone_2/MILESTONE_2_MASTER_PROMPT.md P2) —
// that one assumes the authenticated app shell's sidebar; this wraps the same Empty
// primitives in the landing page's own navbar/footer chrome instead
// (bugs_report.md 2026-07-26, bug #6).
export function PublicStubPage({ title, description, disclaimer }: PublicStubPageProps) {
  return (
    <>
      <LandingNavbar />
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center px-6 pt-16 pb-16">
        <Empty className="w-full border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileQuestion strokeWidth={1.5} />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <p className="text-muted-foreground text-sm">Not yet published.</p>
            {disclaimer && (
              <p className="text-muted-foreground text-xs">{disclaimer}</p>
            )}
          </EmptyContent>
        </Empty>
      </main>
      <LandingFooter />
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: clean (the 8 route files that import this don't exist yet, so no consumer to
break — this step just confirms the component itself compiles).

- [ ] **Step 3: Commit**

```bash
git add web/components/landing/public-stub-page.tsx
git commit -m "feat(landing): add the public equivalent of the app shell's honest stub-page pattern"
```

---

### Task A2: Wire every footer link to a real destination — 8 stub routes + 1 real link

**Files:**
- Create: `web/app/product/routine-builder/page.tsx`
- Create: `web/app/product/pro-portal/page.tsx`
- Create: `web/app/company/our-research/page.tsx`
- Create: `web/app/company/clinical-partners/page.tsx`
- Create: `web/app/company/careers/page.tsx`
- Create: `web/app/legal/privacy-policy/page.tsx`
- Create: `web/app/legal/terms-of-service/page.tsx`
- Create: `web/app/legal/hipaa-compliance/page.tsx`
- Modify: `web/components/landing/landing-footer.tsx`

**Interfaces:**
- Consumes: `PublicStubPage` from Task A1 (exact prop names: `title`, `description`,
  `disclaimer`).

- [ ] **Step 1: Create the 8 stub route pages**

`web/app/product/routine-builder/page.tsx`:

```tsx
import { PublicStubPage } from "@/components/landing/public-stub-page";

export default function Page() {
  return (
    <PublicStubPage
      title="Routine Builder"
      description="AM/PM/weekly/seasonal skincare routine planning, generated from your skin profile."
    />
  );
}
```

`web/app/product/pro-portal/page.tsx`:

```tsx
import { PublicStubPage } from "@/components/landing/public-stub-page";

export default function Page() {
  return (
    <PublicStubPage
      title="Pro Portal"
      description="A dedicated workspace for skincare consultants and dermatologists to manage clients."
    />
  );
}
```

`web/app/company/our-research/page.tsx`:

```tsx
import { PublicStubPage } from "@/components/landing/public-stub-page";

export default function Page() {
  return (
    <PublicStubPage
      title="Our Research"
      description="The clinical and dermatological research behind Skinlytics' skin scoring model."
    />
  );
}
```

`web/app/company/clinical-partners/page.tsx`:

```tsx
import { PublicStubPage } from "@/components/landing/public-stub-page";

export default function Page() {
  return (
    <PublicStubPage
      title="Clinical Partners"
      description="Dermatology practices and clinics we work with."
    />
  );
}
```

`web/app/company/careers/page.tsx`:

```tsx
import { PublicStubPage } from "@/components/landing/public-stub-page";

export default function Page() {
  return (
    <PublicStubPage title="Careers" description="Open roles at Skinlytics." />
  );
}
```

`web/app/legal/privacy-policy/page.tsx`:

```tsx
import { PublicStubPage } from "@/components/landing/public-stub-page";

export default function Page() {
  return (
    <PublicStubPage
      title="Privacy Policy"
      description="How Skinlytics collects, stores, and uses your data."
      disclaimer="This policy is pending legal review and isn't binding yet — check back before relying on it."
    />
  );
}
```

`web/app/legal/terms-of-service/page.tsx`:

```tsx
import { PublicStubPage } from "@/components/landing/public-stub-page";

export default function Page() {
  return (
    <PublicStubPage
      title="Terms of Service"
      description="The terms governing your use of Skinlytics."
      disclaimer="These terms are pending legal review and aren't binding yet — check back before relying on them."
    />
  );
}
```

`web/app/legal/hipaa-compliance/page.tsx`:

```tsx
import { PublicStubPage } from "@/components/landing/public-stub-page";

export default function Page() {
  return (
    <PublicStubPage
      title="HIPAA Compliance"
      description="How Skinlytics handles protected health information."
      disclaimer="This page is pending legal/compliance review — it isn't a certification statement yet."
    />
  );
}
```

- [ ] **Step 2: Wire the footer to real hrefs**

Replace `web/components/landing/landing-footer.tsx` in full:

```tsx
import Link from "next/link";
import { Globe, Share2, ShieldCheck } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "AI Diagnostic", href: "/assessment" },
      { label: "Routine Builder", href: "/product/routine-builder" },
      { label: "Pro Portal", href: "/product/pro-portal" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Research", href: "/company/our-research" },
      { label: "Clinical Partners", href: "/company/clinical-partners" },
      { label: "Careers", href: "/company/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
      { label: "Terms of Service", href: "/legal/terms-of-service" },
      { label: "HIPAA Compliance", href: "/legal/hipaa-compliance" },
    ],
  },
];

// bugs_report.md 2026-07-26, bug #6 — every link here used to be href="#". AI
// Diagnostic points at the real, already-built assessment wizard (zero fabrication,
// best possible outcome); everything else routes to an honest PublicStubPage
// (Task A1/A2) rather than a dead link or invented marketing/legal content. Share
// uses the real Web Share API (Task A3) instead of linking anywhere.
export function LandingFooter() {
  return (
    <footer className="border-border bg-card border-t pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div>
            <Link href="/" className="font-heading text-on-surface mb-6 block text-xl font-bold">
              Skinlytics
            </Link>
            <p className="text-on-surface-variant max-w-xs font-sans text-sm">
              Skin intelligence and personalized skincare planning through accessible AI
              diagnostics.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-on-surface font-geist mb-6 text-xs font-semibold tracking-[0.05em] uppercase">
                {column.title}
              </h3>
              <ul className="text-on-surface-variant flex flex-col gap-4 font-sans text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-on-surface">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-on-surface/8 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-on-surface-variant font-geist text-xs">
            © 2026 Skinlytics Lab. Not medical advice.
          </p>
          <div className="flex gap-6">
            <Link href="/" aria-label="Website" className="text-on-surface-variant hover:text-on-surface">
              <Globe className="size-5" strokeWidth={1.5} />
            </Link>
            <ShareButton />
            <Link
              href="/legal/hipaa-compliance"
              aria-label="Trust & safety"
              className="text-on-surface-variant hover:text-on-surface"
            >
              <ShieldCheck className="size-5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

(`ShareButton` is added in Task A3 — this file isn't complete until that task lands;
committing here still leaves a valid build since Task A3 adds the missing piece in the
same file before the final commit of Part A.)

- [ ] **Step 3: Typecheck (expect one error, confirming the gap Task A3 fills)**

Run: `cd web && npx tsc --noEmit`
Expected: FAIL — `ShareButton` is not defined. This is the expected, deliberate state
between Task A2 and Task A3; do not commit yet.

---

### Task A3: Real Web Share API button (native platform feature, not a link)

**Files:**
- Modify: `web/components/landing/landing-footer.tsx`

**Interfaces:**
- Produces: `ShareButton` — a client component rendered inline in `LandingFooter`
  (same file, per Task A2's placeholder reference).

- [ ] **Step 1: Add the `"use client"` directive and `ShareButton`**

`LandingFooter` itself has no interactivity today (it's a server component). Add the
share button as a small client sub-component in the same file rather than converting
the whole footer to client — add this above `LandingFooter`'s own definition:

```tsx
"use client";

function ShareButton() {
  const handleShare = async () => {
    const shareData = { title: "Skinlytics", url: window.location.origin };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled the native share sheet — not an error.
      }
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    toast.success("Link copied");
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share"
      className="text-on-surface-variant hover:text-on-surface cursor-pointer"
    >
      <Share2 className="size-5" strokeWidth={1.5} />
    </button>
  );
}
```

Add the `toast` import at the top of the file, alongside the existing `lucide-react`
import:

```tsx
import { toast } from "sonner";
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `cd web && npx eslint components/landing/landing-footer.tsx`
Expected: clean. (`"use client"` at file-top affects the whole module — `LandingFooter`
itself has no hooks/handlers, so this is safe; confirm the build step in A4 also
passes, since that's the real proof a server/client boundary mistake didn't slip in.)

- [ ] **Step 4: Commit**

```bash
git add web/components/landing/landing-footer.tsx web/app/product web/app/company web/app/legal
git commit -m "fix(landing): wire every footer link to a real destination, zero href=\"#\""
```

---

### Task A4: Playwright smoke test — no dead footer links, stub pages actually render

**Files:**
- Create: `web/tests/e2e/landing-footer.spec.ts`

**Interfaces:**
- Consumes: nothing new — a black-box Playwright test against the running app, same
  convention as `web/tests/e2e/scaffold.spec.ts`.

- [ ] **Step 1: Write the test**

```typescript
import { test, expect } from "@playwright/test";

// bugs_report.md 2026-07-26, bug #6 — every footer link used to be href="#". This
// locks in the fix: no footer link points at "#" anymore, and each stub destination
// actually renders (not a 404).
test("landing footer has zero dead links", async ({ page }) => {
  await page.goto("/");

  const footerLinks = page.locator("footer a");
  const count = await footerLinks.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const href = await footerLinks.nth(i).getAttribute("href");
    expect(href).not.toBe("#");
    expect(href).not.toBeNull();
  }
});

test("a footer stub page renders its title, not a 404", async ({ page }) => {
  await page.goto("/legal/privacy-policy");
  await expect(page.getByText("Privacy Policy")).toBeVisible();
  await expect(page.getByText("Not yet published.")).toBeVisible();
});

test("AI Diagnostic footer link goes to the real assessment wizard, not a stub", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "AI Diagnostic" }).click();
  await expect(page).toHaveURL(/\/assessment/);
});
```

- [ ] **Step 2: Run it**

Run: `cd web && npx playwright test tests/e2e/landing-footer.spec.ts`
Expected: 3 passed. (Requires the dev server / whatever `playwright.config.ts` already
starts — same as running any other spec in this suite, no special setup.)

- [ ] **Step 3: Commit**

```bash
git add web/tests/e2e/landing-footer.spec.ts
git commit -m "test(landing): lock in zero dead footer links"
```

---

## Part B — Bug #5: Consultant client assignment

### Task B1: Backend test coverage for the existing (untested) assignment endpoint

**Files:**
- Modify: `backend/tests/test_admin_service.py`

**Interfaces:**
- Consumes: `app.services.admin.service.assign_client(db, *, actor_user_id: str,
  professional_id: str, user_id: str) -> None` (already exists, unchanged by this
  task), `app.services.clinical_review.models.ConsultantClient`, the existing
  `second_user_id` fixture (`test_admin_service.py:37-52`).

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/test_admin_service.py`, near the other write-path tests (after
`test_write_audit_log_persists_expected_fields` is a reasonable spot):

```python
async def test_assign_client_creates_a_real_row_and_audit_log_entry(
    db_session: AsyncSession, test_user_id: str, second_user_id: str
) -> None:
    """test_user_id plays the professional, second_user_id the client — bugs_report.md
    2026-07-26 bug #5: this endpoint existed and worked, nothing had ever called it."""
    await assign_client(
        db_session,
        actor_user_id="admin-actor",
        professional_id=test_user_id,
        user_id=second_user_id,
    )

    result = await db_session.execute(
        select(ConsultantClient).where(
            ConsultantClient.consultant_id == test_user_id,
            ConsultantClient.user_id == second_user_id,
        )
    )
    row = result.scalar_one()
    assert row.status == "active"

    logs, _total = await list_audit_logs(
        db_session, action="consultant_client_assign", page=1, page_size=20
    )
    assert any(
        log.actor_user_id == "admin-actor" and log.target_id == second_user_id
        for log in logs
    )


async def test_assign_client_is_idempotent_on_a_repeat_assignment(
    db_session: AsyncSession, test_user_id: str, second_user_id: str
) -> None:
    await assign_client(
        db_session, actor_user_id="admin-actor", professional_id=test_user_id, user_id=second_user_id
    )
    await assign_client(
        db_session, actor_user_id="admin-actor", professional_id=test_user_id, user_id=second_user_id
    )

    result = await db_session.execute(
        select(ConsultantClient).where(
            ConsultantClient.consultant_id == test_user_id,
            ConsultantClient.user_id == second_user_id,
        )
    )
    rows = result.scalars().all()
    assert len(rows) == 1
```

Add the two new imports this test needs, alongside the file's existing import block:

```python
from sqlalchemy import select

from app.services.admin.service import (
    apply_verification_action,
    assign_client,
    create_document,
    get_document_view_url,
    get_pending_verification_counts,
    get_platform_counts,
    get_profile_for_review,
    get_top_skin_concerns,
    list_audit_logs,
    list_verification_queue,
    write_audit_log,
)
from app.services.clinical_review.models import ConsultantClient
```

(`assign_client` and `list_audit_logs` join the existing `from app.services.admin.service
import (...)` block — don't create a second import line for the same module.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_admin_service.py -k assign_client -v`
Expected: FAIL — `ImportError: cannot import name 'assign_client'` if the import was
added before checking, or (if you temporarily stub the import) a real assertion
failure. Either way, confirm it fails before Step 3 — `assign_client` already exists
in `service.py`, so if this *doesn't* fail, the test itself is wrong, not the code.

Actually — `assign_client` already exists and is correct (built in a prior session,
never tested). Expected outcome here is closer to: the test *passes immediately* once
the import is correct, because there's no bug in the underlying function. That's fine —
this task's job is coverage, not a fix. If it fails on anything other than the import
line, stop and investigate before continuing (per `AGENTS.md` §0.2 — don't paper over a
real defect this task wasn't scoped to find).

- [ ] **Step 3: Run again to confirm passing**

Run: `cd backend && uv run pytest tests/test_admin_service.py -v`
Expected: PASS, full file (confirms nothing else broke).

- [ ] **Step 4: Ruff + mypy**

Run: `cd backend && uv run ruff check tests/test_admin_service.py && uv run mypy tests/test_admin_service.py`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add backend/tests/test_admin_service.py
git commit -m "test(admin): cover assign_client — real row + audit log, idempotent on repeat"
```

---

### Task B2: Extend the admin users API route with an optional role filter

**Files:**
- Modify: `web/app/api/admin/users/route.ts`

**Interfaces:**
- Produces: `GET /api/admin/users?role=consultant,dermatologist` (comma-separated,
  optional) — same `ListUsersResponse` shape as today, just pre-filtered server-side.
  `GET /api/admin/users` (no `role` param) behaves exactly as before — this is
  additive, not a breaking change to the existing `/admin/users` page.

- [ ] **Step 1: Add the role filter**

Replace `web/app/api/admin/users/route.ts` in full:

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Read-only passthrough to Better Auth's admin-plugin `list-users` action (Branch 6)
// — no audit log needed (a read isn't a mutation), but still routed through this
// server-side wrapper rather than calling `authClient.admin.listUsers()` directly
// from the browser, matching every other /api/admin/* route's shape.
//
// `role` (bugs_report.md 2026-07-26, bug #5) — optional, comma-separated
// (e.g. "consultant,dermatologist") — reuses Better Auth's own filterField/
// filterValue/filterOperator ("in" for multiple roles, "eq" for one), so the
// admin "Assign client" dialog (web/components/admin/assign-client-dialog.tsx)
// can search professionals and clients separately without a new backend endpoint.
export async function GET(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || session.user.role !== "admin") {
    return errorResponse(403, "forbidden", "Admin role required");
  }

  const { searchParams } = new URL(request.url);
  const searchValue = searchParams.get("search") ?? undefined;
  const roleParam = searchParams.get("role");
  const roles = roleParam ? roleParam.split(",").filter(Boolean) : [];
  const limit = searchParams.get("limit") ?? "20";
  const offset = searchParams.get("offset") ?? "0";

  const result = await auth.api.listUsers({
    query: {
      searchValue,
      searchField: searchValue ? "email" : undefined,
      searchOperator: searchValue ? "contains" : undefined,
      filterField: roles.length > 0 ? "role" : undefined,
      filterValue: roles.length > 0 ? (roles.length === 1 ? roles[0] : roles) : undefined,
      filterOperator: roles.length > 0 ? (roles.length === 1 ? "eq" : "in") : undefined,
      limit,
      offset,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    headers: requestHeaders,
  });

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Manual check against the running app**

With the backend + `npm run dev` running and logged in as an admin:
`curl -s "http://localhost:3000/api/admin/users?role=consultant,dermatologist" -H
"Cookie: <your session cookie>"` (or just load `/admin/users` in the browser first —
unchanged, confirms the no-`role` path still works) — then confirm
`http://localhost:3000/api/admin/users?role=consultant` (typed directly while logged in
as admin, in a browser tab) returns only `role: "consultant"` rows in its JSON.

- [ ] **Step 4: Commit**

```bash
git add web/app/api/admin/users/route.ts
git commit -m "feat(admin): add an optional role filter to GET /api/admin/users"
```

---

### Task B3: Build the "Assign client" dialog on the admin Users page

**Files:**
- Create: `web/components/admin/assign-client-dialog.tsx`
- Modify: `web/app/admin/users/page.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/users?role=...&search=...` (Task B2), `api.POST(
  "/api/v1/admin/consultant-clients", { body: { professional_id, user_id } })` (already
  typed in `web/lib/api-types.ts`, confirmed present).
- Produces: `AssignClientDialog` — a self-contained trigger + dialog, no props needed
  (owns its own open state), rendered once in `AdminUsersPage`'s header row.

- [ ] **Step 1: Write the dialog component**

Create `web/components/admin/assign-client-dialog.tsx`:

```tsx
"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface PickerUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
}

// bugs_report.md 2026-07-26, bug #5 — the Consultant topbar's "Add New Client" button
// linked to a page a consultant has no way to act on (clients are admin-assigned
// only, per consultant_clients' own schema). Backend already had a working, audited
// POST /api/v1/admin/consultant-clients with two comments calling this exact UI "a
// deliberate follow-up, not built this pass" (admin/router.py:207, admin/service.py:
// 214) — this closes that loop instead of just hiding the broken button.
function usePickerUsers(roleParam: string, search: string) {
  const deferredSearch = useDeferredValue(search);
  return useQuery({
    queryKey: ["admin", "users", "picker", roleParam, deferredSearch],
    queryFn: async (): Promise<PickerUser[]> => {
      const params = new URLSearchParams({ role: roleParam, limit: "20" });
      if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to load users");
      const data = await response.json();
      return data.users.map((u: { id: string; name: string; email: string; role: string | null }) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
      }));
    },
  });
}

export function AssignClientDialog() {
  const [open, setOpen] = useState(false);
  const [professionalSearch, setProfessionalSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [professional, setProfessional] = useState<PickerUser | null>(null);
  const [client, setClient] = useState<PickerUser | null>(null);
  const queryClient = useQueryClient();

  const professionalsQuery = usePickerUsers("consultant,dermatologist", professionalSearch);
  const clientsQuery = usePickerUsers("user", clientSearch);

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!professional || !client) throw new Error("Pick both a professional and a client");
      const { error } = await api.POST("/api/v1/admin/consultant-clients", {
        body: { professional_id: professional.id, user_id: client.id },
      });
      if (error) throw new Error("Failed to assign client");
    },
    onSuccess: () => {
      toast.success("Client assigned");
      setOpen(false);
      setProfessional(null);
      setClient(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
    onError: () => toast.error("Couldn't assign that client. Please try again."),
  });

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" strokeWidth={1.5} />
        Assign client
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a client</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Consultant or dermatologist</Label>
              <Combobox
                items={professionalsQuery.data ?? []}
                value={professional}
                onValueChange={setProfessional}
                inputValue={professionalSearch}
                onInputValueChange={setProfessionalSearch}
                itemToStringLabel={(item: PickerUser) => `${item.name} — ${item.email}`}
                isItemEqualToValue={(a: PickerUser, b: PickerUser) => a.id === b.id}
              >
                <ComboboxInput placeholder="Search by email..." />
                <ComboboxContent>
                  <ComboboxEmpty>No professionals found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item: PickerUser) => (
                      <ComboboxItem key={item.id} value={item}>
                        {item.name} — {item.email} ({item.role})
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Client</Label>
              <Combobox
                items={clientsQuery.data ?? []}
                value={client}
                onValueChange={setClient}
                inputValue={clientSearch}
                onInputValueChange={setClientSearch}
                itemToStringLabel={(item: PickerUser) => `${item.name} — ${item.email}`}
                isItemEqualToValue={(a: PickerUser, b: PickerUser) => a.id === b.id}
              >
                <ComboboxInput placeholder="Search by email..." />
                <ComboboxContent>
                  <ComboboxEmpty>No users found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item: PickerUser) => (
                      <ComboboxItem key={item.id} value={item}>
                        {item.name} — {item.email}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <Button
              onClick={() => assignMutation.mutate()}
              disabled={!professional || !client || assignMutation.isPending}
            >
              {assignMutation.isPending && (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
              )}
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Render it on the admin Users page**

In `web/app/admin/users/page.tsx`, add the import near the other component imports:

```tsx
import { AssignClientDialog } from "@/components/admin/assign-client-dialog";
```

In the header row (the `<div className="flex items-center justify-between">` block
that currently only has the "Verification queue" `Button`), add `AssignClientDialog`
next to it:

```tsx
        <div className="flex gap-2">
          <AssignClientDialog />
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href="/admin/users/verification">
                <ClipboardCheck className="size-4" strokeWidth={1.5} />
                Verification queue
              </Link>
            }
          />
        </div>
```

(This replaces the single `Button` that was there — wrap both in one `flex gap-2` div
so they sit side by side, matching the header row's existing `justify-between` layout.)

- [ ] **Step 3: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Lint**

Run: `cd web && npx eslint components/admin/assign-client-dialog.tsx app/admin/users/page.tsx`
Expected: clean.

- [ ] **Step 5: Manual check against the running app**

Log in as admin, go to `/admin/users`, click "Assign client". Search the first
combobox for a known consultant's email (e.g. the one created in the earlier QA pass,
`qa.consultant.skinlytics@example.com` if it still exists), pick it; search the second
for a known plain-user account, pick it; click "Assign". Expected: "Client assigned"
toast, dialog closes. Confirm via
`docker exec -i $(docker ps -qf name=postgres) psql -U skinlytics -d skinlytics -c
"SELECT * FROM consultant_clients ORDER BY assigned_at DESC LIMIT 1;"` that a real row
landed, and that logging in as that consultant now shows the client on
`/consultant/clients` instead of the empty state.

- [ ] **Step 6: Commit**

```bash
git add web/components/admin/assign-client-dialog.tsx web/app/admin/users/page.tsx
git commit -m "feat(admin): build the client-assignment dialog the backend already supported"
```

---

### Task B4: Remove the Consultant's dead-end "Add New Client" topbar button

**Files:**
- Modify: `web/lib/nav-config.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `ROLE_TOPBAR.consultant.primaryActionLabel`/`primaryActionHref` become
  `null`, matching the other 3 roles' existing shape exactly.

- [ ] **Step 1: Remove the button config**

In `web/lib/nav-config.ts`, the `consultant` entry in `ROLE_TOPBAR` currently reads:

```typescript
  consultant: {
    searchPlaceholder: "Search clients, assessments…",
    avatarCaption: "Skincare Consultant",
    primaryActionLabel: "Add New Client",
    primaryActionHref: "/consultant/clients",
  },
```

Change to:

```typescript
  // primaryActionLabel/Href are null here now, same as every other role
  // (bugs_report.md 2026-07-26, bug #5) — a consultant has no self-service way to
  // add a client (consultant_clients rows are admin-assigned only, Task B3's
  // AssignClientDialog), so a CTA promising that action was the actual bug, not a
  // missing destination for it to link to.
  consultant: {
    searchPlaceholder: "Search clients, assessments…",
    avatarCaption: "Skincare Consultant",
    primaryActionLabel: null,
    primaryActionHref: null,
  },
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Manual check against the running app**

Log in as a consultant. Expected: the topbar no longer shows an "Add New Client"
button (the `{topbar.primaryActionLabel && topbar.primaryActionHref && (...)}` guard
in `glass-topbar.tsx` already handles `null` correctly — no change needed there).

- [ ] **Step 4: Commit**

```bash
git add web/lib/nav-config.ts
git commit -m "fix(consultant): drop the Add New Client button consultants can't act on"
```

---

## Self-review notes (from the plan author, not a task)

- Bug #6 leaves 2 of 9 original footer destinations (`AI Diagnostic` → real link,
  `Share` icon → real native feature) genuinely non-fabricated *and* fully functional,
  not just "not a dead link" — better than the minimum bar the bug asked for, at no
  extra cost, so kept in.
- Bug #5's `Combobox` `value`/`onValueChange` types use `PickerUser | null`, matching
  `AllergyIngredientSelect`'s established `isItemEqualToValue`/`itemToStringLabel`
  pattern exactly (single-select here, that file's is multi-select — same primitive,
  different `multiple` prop, confirmed via the official single-select example).
- Not fixed here, unchanged from the last pass's assessment: whether an *unverified*
  consultant/dermatologist should be assignable via this dialog. The backend places no
  such gate on `assign_client` today (confirmed by reading `create_assignment`), and
  adding one is a product-policy call, not part of closing this specific dead-end-button
  bug — flag it if it comes up, don't silently add a gate that wasn't asked for.
