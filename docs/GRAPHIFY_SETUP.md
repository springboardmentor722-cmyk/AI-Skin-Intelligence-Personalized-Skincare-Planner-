# Graphify setup — quick start

Stand up the shared codebase graph that lets every agent (Claude Code, Codex, OpenCode,
Antigravity, Cursor, Gemini CLI…) query the repo instead of re-reading it. Strategy and
daily usage: `docs/AGENT_WORKFLOW.md`. Repo: https://github.com/safishamsi/graphify

> Reminder: this Graphify is a **dev-time code map**. It is not the runtime "graph
> database" we dropped from the data layer (ADR-001). Same word, different thing (ADR-006).

## 1. Install the CLI (PyPI package is `graphifyy` — double y; command is `graphify`)
```bash
uv tool install "graphifyy[sql,postgres,mcp,office,pdf]"   # or: pipx install "graphifyy[...]"
#   sql      → index the .sql files in database_schemas/
#   postgres → introspect the live DB (graphify extract --postgres DSN)
#   mcp      → serve the graph as an MCP server
#   office/pdf → pull the project PDF / docs into the graph
graphify install                # registers the /graphify skill with your assistant
```
If `graphify` isn't found afterward: `uv tool update-shell` (or `pipx ensurepath`), then a
new shell.

## 2. Wire up each tool you use (writes its config + a "query the graph first" hook)
```bash
graphify claude install         # Claude Code
graphify codex install          # Codex
graphify opencode install       # OpenCode
graphify antigravity install    # Google Antigravity
graphify cursor install         # Cursor
graphify gemini install         # Gemini CLI
```

## 3. Build the graph and commit it (so all tools share one map)
```bash
graphify .                      # → graphify-out/ (graph.json, GRAPH_REPORT.md, graph.html)
graphify export callflow-html   # readable architecture + call-flow page
graphify hook install           # auto-rebuild the graph on every git commit (AST, free)
git add graphify-out AGENTS.md CLAUDE.md .cursor .codex .agents 2>/dev/null
git commit -m "chore: graphify code graph + agent config"
```

## 4. Include the database schema in the graph
```bash
# option A: the .sql files in database_schemas/ are indexed by `graphify .` (needs [sql])
# option B: introspect the live database
graphify extract --postgres "postgresql://user:pass@localhost:5432/skinlytics"
```
Now `graphify query "what tables reference the user id?"` spans app code + schema.

## 5. (Optional) run it as a shared MCP server
```bash
python -m graphify.serve graphify-out/graph.json                       # local (stdio)
python -m graphify.serve graphify-out/graph.json --transport http \
       --host 0.0.0.0 --api-key "$GRAPHIFY_KEY"                        # shared (http)
```
Point each IDE's MCP config at it (read-only scope). Tools exposed: `query_graph`,
`get_node`, `get_neighbors`, `shortest_path`.

## 6. Verify (30-second smoke test)
```bash
graphify query "how does routine generation call the scoring service?"
graphify explain "SkinHealthScoringService"
git commit --allow-empty -m "chore: hook smoke test"   # confirm the post-commit rebuild fires
```
A focused subgraph back from the query + a hook log line on commit = setup is good.

## Troubleshooting
- **`graphify: command not found`** → `uv tool update-shell` / `pipx ensurepath`, new
  terminal.
- **Query results feel stale** → `graphify . --update` (re-extracts changed files only);
  check the post-commit hook wasn't disabled.
- **A tool ignores the graph and greps anyway** → re-run that tool's
  `graphify <tool> install`; confirm its config file (e.g. `.cursor/rules/graphify.mdc`)
  is committed.

## Daily use (replaces grepping)
```bash
graphify query "how does routine generation call scoring?"
graphify path "ProductRecommendationService" "PineconeClient"
graphify explain "SkinHealthScoringService"
graphify . --update             # after pulling or changing files
# end of session:
graphify save-result --question "…" --answer "…" --nodes … --outcome useful
graphify reflect --if-stale
```

## Setup definition of done
- [ ] `graphify-out/` committed and pulled clean on a second machine/tool
- [ ] Every tool you use has run its `graphify <tool> install`
- [ ] Post-commit hook rebuilds on an empty commit
- [ ] Smoke-test query returns a focused subgraph
- [ ] (If shared) MCP endpoint reachable from each IDE config

---

## Google Stitch designs — two supported paths
UI/UX is authored in Google Stitch (`stitch.withgoogle.com`) from the **v2 "Frosted Lab
Glass" prompt pack** (glassmorphism; tokens 1:1 with `docs/DESIGN.md`). Agents can't open
a private Stitch project link, so use one of:

1. **Stitch MCP server** — if you run/configure one, add it to each agent's MCP config
   (same place as the Graphify MCP), read-only scope. Treat the MCP as the *source of the
   design*; the agent still rebuilds each screen as shadcn/React components mapped to our
   tokens.
2. **Download to a folder (fallback, always works)** — export each screen from Stitch
   (export code / Figma) into `web/design/<screen>/` and point the agent at that folder in
   the task prompt.

Either way, the seven Milestone-1 screens are: **Login, Registration, User Dashboard,
Skin Profile, Skin Assessment, Product Recommendation, Progress Tracking**
(specs + acceptance criteria: `docs/WIREFRAMES.md`). The agent converts Stitch Tailwind
into our owned shadcn components (`web/components/ui`) using only DESIGN.md CSS variables
— including the `--glass-*` family and its fallbacks — and **never pastes raw exports
into production**.
