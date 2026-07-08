# Agent Workflow — persistent context across tools

The problem this solves: development switches between Claude Code, Codex, OpenCode,
Antigravity, Cursor and Gemini CLI depending on the task, and each fresh session re-reads
the repo from scratch — burning tokens and re-deriving decisions inconsistently. This doc
layers **six mechanisms** so any agent, in any tool, boots with the same context cheaply.

## The six layers (cheapest / most durable first)
1. **Instruction files (always-on)** — `AGENTS.md` is the single source of truth; every
   tool's config points to it. Small, human-curated, read every session.
2. **Graphify code graph (queryable retrieval)** — the repo (code + SQL schemas + docs)
   compiled into `graphify-out/graph.json`. Agents *query* it instead of grepping, pulling
   only the subgraph they need. Committed to git → shared by every tool.
3. **Graphify work memory (learned lessons)** — Q&A outcomes recorded per session,
   aggregated into `LESSONS.md` + a learning overlay, so mistakes aren't repeated.
4. **`PROGRESS.md` (task state)** — what's done, what's next, blockers. Prevents redoing
   work.
5. **`docs/DECISIONS.md` (ADRs)** — *why* things are the way they are, so a new agent
   doesn't "helpfully" undo a deliberate choice.
6. **`docs/*.md` (deep references)** — ARCHITECTURE, DESIGN, CONVENTIONS, AI_ML,
   DATASETS_AND_APIS, WIREFRAMES: pulled only when the task touches that area.

Layers 1, 4, 5, 6 are plain files. Layers 2–3 are Graphify — set it up once
(`docs/GRAPHIFY_SETUP.md`).

## Which file answers which question (route here before reading code)
| Question | Go to |
|---|---|
| Why is X built this way? | `docs/DECISIONS.md` |
| How is the system shaped? What owns what? | `docs/ARCHITECTURE.md` |
| How do I write/format code here? API/error/pagination rules? | `docs/CONVENTIONS.md` |
| Model contracts, score math, fairness gates? | `docs/AI_ML.md` |
| Where does data come from? Keys? Licensing? | `docs/DATASETS_AND_APIS.md` |
| What does a screen contain? Tokens? Glass rules? | `docs/WIREFRAMES.md` + `docs/DESIGN.md` |
| What's done / next? | `PROGRESS.md` |
| How is this *specifically* wired in code? | `graphify query "…"` |

**Precedence when sources conflict:** `DECISIONS.md` → `ARCHITECTURE.md` →
`database_schemas/` → code → graph → memory/assumptions. If code contradicts an accepted
ADR, the code is the bug (or write a superseding ADR first).

---

## Graphify — one-time setup
Graphify (`safishamsi/graphify`, PyPI package **`graphifyy`** — double-y — command
`graphify`) turns the folder into a knowledge graph your assistant queries. Reference:
https://github.com/safishamsi/graphify

> Note: this is a *dev-time code map*. It is unrelated to the runtime "graph database" we
> dropped from the data layer (ADR-001). Different thing, same word (ADR-006).

### 1. Install the CLI
```bash
# recommended (isolated env)
uv tool install graphifyy          # or: pipx install graphifyy
# optional extras we want:
uv tool install "graphifyy[sql,postgres,mcp,office,pdf]"
#   sql       → parse the .sql schema files into the graph
#   postgres  → introspect the LIVE database (graphify extract --postgres DSN)
#   mcp       → run the graph as an MCP server (structured tool access)
#   office/pdf→ pull the project .pdf and any .docx/.xlsx into the graph
graphify install                   # registers the /graphify skill with your assistant
```
If `graphify: command not found` after install, run `uv tool update-shell` (or
`pipx ensurepath`) and open a new terminal.

### 2. Register the skill + always-on hook for every tool you use
```bash
graphify claude install        # Claude Code — CLAUDE.md section + PreToolUse hook
graphify codex install         # Codex — AGENTS.md + .codex/hooks.json hook
graphify opencode install      # OpenCode — AGENTS.md + tool.execute.before plugin
graphify antigravity install   # Google Antigravity — .agents/rules + workflows
graphify cursor install        # Cursor — .cursor/rules/graphify.mdc (alwaysApply)
graphify gemini install        # Gemini CLI — GEMINI.md + BeforeTool hook
```
These write each tool's config so the assistant **prefers `graphify query "<question>"`
over reading files or grepping**; on tools with payload hooks (Claude Code, Codex,
Gemini) a hook fires before search/read calls and redirects to the graph.

### 3. Build the graph and commit it
```bash
graphify .                     # build graph for the repo → graphify-out/
graphify export callflow-html  # readable architecture + Mermaid call-flow page
graphify hook install          # auto-rebuild graph on every git commit (AST only, free)
git add graphify-out AGENTS.md CLAUDE.md .cursor .codex   # commit the shared map
git commit -m "chore: add graphify code graph + agent config"
```
`graphify-out/` (graph.json, GRAPH_REPORT.md, graph.html) is **meant to be committed** —
anyone pulling the repo, in any tool, starts with the same map.

### 4. (Optional) run the graph as a shared MCP server
```bash
# local, per-dev (stdio)
python -m graphify.serve graphify-out/graph.json
# shared over HTTP (point every IDE's MCP config at http://host:8080/mcp)
python -m graphify.serve graphify-out/graph.json --transport http --host 0.0.0.0 --api-key "$SECRET"
```
Exposes: `query_graph`, `get_node`, `get_neighbors`, `shortest_path`, plus PR tools.

### 5. Index the live database schema too
```bash
graphify extract --postgres "postgresql://user:pass@localhost:5432/skinlytics"
# or just let the .sql files in database_schemas/ be indexed by `graphify .`
```
Now `graphify query "what tables reference the user id?"` spans app code *and* schema —
exactly the cross-cutting question that used to cost a full file sweep.

---

## Daily use — queries that replace grepping
```bash
graphify query "how does routine generation call the scoring service?"
graphify query "what connects the product recommendation flow to the vector DB?"
graphify path "ProductRecommendationService" "PineconeClient"
graphify explain "SkinHealthScoringService"
```
These return a focused subgraph (hundreds of tokens) instead of whole files (thousands).

## Work memory — teach the next session
```bash
graphify save-result --question "How is the skin score computed?" \
  --answer "Weighted sum from scoring_weights; sleep_quality is 15%." \
  --nodes SkinHealthScoringService scoring_weights --outcome useful   # or dead_end | corrected
graphify reflect --if-stale     # aggregates outcomes → reflections/LESSONS.md (no-op if fresh)
```

---

## Tool-switching protocol (run whenever you change agents)
1. **Pull.** `git pull` — latest `graphify-out/`, `PROGRESS.md`, `docs/`.
2. **Refresh if needed.** Code changed since last commit → `graphify . --update`
   (re-extracts changed files only).
3. **Orient from files, not by re-reading code.** `AGENTS.md` → `PROGRESS.md` → the one
   `docs/*.md` for your task (routing table above). Query the graph for specifics.
4. **Work.** Small diffs; check the graph before assuming how something is wired.
5. **Hand off.** End-of-session ritual below — the next tool inherits everything.

## Start-of-session checklist
- [ ] `git pull` → read `AGENTS.md`, `PROGRESS.md`
- [ ] `graphify . --update` if the tree changed upstream
- [ ] Query the graph for the area you're about to touch

## End-of-session checklist
- [ ] `PROGRESS.md` updated (done / next / blockers)
- [ ] New structural choice → ADR appended to `docs/DECISIONS.md` *before it's forgotten*
- [ ] `graphify save-result … --outcome …` then `graphify reflect --if-stale`
- [ ] Conventional commit (`feat:`/`fix:`/`docs:`/`chore:`) — the post-commit hook
      re-indexes the graph

## Guardrails for agents
- Never hand-edit `graphify-out/` — it's generated; rebuild instead.
- Never disable the post-commit hook or the tool hooks.
- Prefer one graph query over opening three files; open files only for the lines you'll
  change.
- Don't paste large file contents into `AGENTS.md` — it's a router, not a warehouse.
- CI runs a nightly `graphify . --update` so the committed graph never drifts far
  (`SUGGESTIONS.md`).

## Why this beats "just a big context file"
- **Progressive disclosure.** `AGENTS.md` is a short router; deep docs and the graph load
  only when relevant — a mega-prompt would re-spend those tokens every turn.
- **Shared across tools.** `graphify-out/` + `AGENTS.md` live in git, so every tool reads
  identical context — no per-tool drift.
- **Queryable, not linear.** "What calls X?" is a cheap traversal, not a repo scan.
- **Self-improving.** The second time anyone hits a gotcha, the answer is already in
  `LESSONS.md`.
