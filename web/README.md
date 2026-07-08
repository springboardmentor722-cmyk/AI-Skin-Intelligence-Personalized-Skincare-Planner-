# Skinlytics — web

Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui. Package manager: npm.

Read `/AGENTS.md` and `/docs/CONVENTIONS.md` before adding code here — folder layout,
design-token rules, and screen-build workflow are defined there, not in this file.

```bash
npm run dev         # http://localhost:3000
npm run lint
npm run typecheck
npm test            # Playwright e2e (installs browsers separately: npx playwright install)
```

Design tokens (`app/globals.css`) are wired 1:1 from `docs/DESIGN.md` — do not hand-edit
color/radius/font values there without updating `docs/DESIGN.md` first.
