# Stitch → Wireframes Extraction Rules (Skinlytics)

Applies whenever this workspace talks to the Stitch MCP server. Loaded automatically into every chat in this project — no need to restate this context session to session.

## Project

- Stitch project: **Skinlytics AI Interface System**
- Project ID: `933192060480910018`
- URL: https://stitch.withgoogle.com/projects/933192060480910018
- Always use this project for Stitch MCP calls in this workspace unless explicitly told otherwise. The project ID isn't something that lives in the `StitchMCP` server config (that config only handles auth via the API key) — so it's pinned here instead, once, rather than being repeated or guessed at the start of every conversation.

## Where extracted designs live

- All wireframe exports go in `web/designs/wireframes/`
- Downloaded images go in `web/designs/wireframes/source/images/<page-slug>/`
- Reference screenshots go in `web/designs/wireframes/source/reference-screenshots/`
- `web/designs/wireframes/index.html` is a hand-built gallery page linking to every extracted screen — it is new scaffolding, not a Stitch export, and should stay simple

## How to handle any screen pulled from this Stitch project

1. Fetch the real generated code (e.g. `get_screen_code` / `fetch_screen_code`) by exact screen title. Never write or reconstruct a screen's HTML from memory of the Skinlytics design spec, even for a screen you recognize.
2. Never use a Stitch tool that generates or regenerates a screen (`generate_screen_from_text`, `build_site`, "extract design context and rebuild") when the goal is extracting an *existing* screen — those produce new interpretations, not exports.
3. Preserve fetched markup byte-for-byte: same classes, inline styles, structure, attributes. The only addition allowed is a `<!DOCTYPE html>`/`<head>`/`<body>` wrapper if one is needed to open the file standalone in a browser.
4. Download every image a screen references and rewrite its `src`/`href` to a local relative path under `source/images/...`. Never leave a live `stitch.withgoogle.com` or `googleusercontent.com` URL in a saved file — those expire.
5. Save a full reference screenshot of each screen into `source/reference-screenshots/` alongside its code — this is the visual ground truth for spotting drift later.
6. If an expected screen title can't be found, or a screen doesn't visually match what it's supposed to be, stop and ask — don't substitute the closest-sounding match or invent the page.
7. Ignore anything titled **"Shader"** — these are WebGL background-animation artifacts for the aurora effect, not pages, and aren't part of any extraction task in this workspace.

## Reference

Full 40-page / 80-screen phase-by-phase extraction map, including the exact light/dark Stitch screen titles for each page: `Skinlytics_Antigravity_Stitch_Extraction_Prompt_Pack.md` in the project root.
