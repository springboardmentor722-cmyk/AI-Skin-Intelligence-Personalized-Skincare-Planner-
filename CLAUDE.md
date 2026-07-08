# Skinlytics — Claude Code Memory

@AGENTS.md
@.agents/rules/skinlytics-stitch.md

Everything Claude Code needs is in the two imports above — architecture, frontend/backend rules, and the Stitch extraction workflow. Nothing below duplicates them; it's Claude-Code-specific behavior only.

## Claude-Code-specific notes

- If this file or `AGENTS.md` is ever deleted, don't let `/init` regenerate a new one over them silently — both are hand-maintained; re-derive from git history instead.
- Auto memory is fine to leave on. If it ever saves a note that conflicts with `AGENTS.md` (e.g. a different DB split, a different component library), `AGENTS.md` wins — flag the conflict out loud rather than silently picking one.
- Anything about the Stitch MCP extraction specifically (project ID, phase pack location, the light/dark title quirks) lives in the imported rules file — don't re-derive it from scratch.
