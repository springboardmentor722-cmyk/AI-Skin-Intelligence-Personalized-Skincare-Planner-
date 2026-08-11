# SKINLYTICS — GITHUB / GIT WORKFLOW RULES

> Referenced by `docs/milestones/milestone_3/Master_prompt_milestone3.md` §5. This file
> is the standalone, copy-pasteable version of the same git/GitHub workflow the master
> prompt's §5 already mandates — keep the two in lockstep; §5 is the authoritative
> phase-integrated version, this file is for pasting into a fresh session or handing to
> another tool that only needs the workflow, not the whole M3 plan.

You are working on the Skinlytics repository.

You MUST follow the GitHub branching structure and Git workflow below for EVERY task. These rules are mandatory and override any assumption to work directly on shared branches.

==================================================
1. BRANCH STRUCTURE
==================================================

The repository follows this structure:

main
└── dev
    ├── feat/m3-<phase>-<slug>
    ├── fix/m3-<slug>
    ├── chore/m3-<slug>
    └── feature/product-quality-model

Branch responsibilities:

MAIN BRANCH:
    main
    - Owner-managed only.
    - NEVER commit to it.
    - NEVER merge into it.
    - NEVER delete it.
    - NEVER force-push it.

PROJECT MAIN BRANCH:
    satya-sai-tharun-skinlytics
    - Owner-managed only.
    - NEVER commit to it.
    - NEVER merge into it.
    - NEVER delete it.
    - NEVER force-push it.

INTEGRATION BRANCH:
    dev
    - This is the ONLY integration branch for development work.
    - All feature/fix/chore branches must ultimately merge into dev.
    - Do not bypass dev.

==================================================
2. BASIC DEVELOPMENT FLOW
==================================================

The mandatory workflow is:

dev
 ↓
create feature/fix/chore branch
 ↓
implement task
 ↓
test
 ↓
code review
 ↓
commit
 ↓
merge into dev
 ↓
delete feature branch

NEVER:

main → feature branch
main → development
feature branch → main
feature branch → another feature branch

The normal flow is ALWAYS:

dev → feature branch → dev

==================================================
3. BEFORE STARTING ANY TASK
==================================================

First inspect the current Git state.

Run:

git status
git branch --show-current
git fetch origin

Then determine whether the current task requires a new branch.

If starting a NEW task:

git checkout dev
git pull origin dev

Then create a new branch FROM THE UPDATED dev branch.

Example:

git checkout -b feat/m3-p1-inci-compatibility

Verify:

git branch --show-current
git status

DO NOT start implementation until you confirm that you are on the correct task branch.

==================================================
4. BRANCH NAMING
==================================================

Use these naming conventions.

FEATURE:

feat/m3-<phase>-<slug>

Examples:

feat/m3-p0-rebaseline
feat/m3-p1-inci-compatibility
feat/m3-p3-routine-set-compare
feat/m3-p4-log-entry
feat/m3-p5-dashboard-routes
feat/m3-p6-verification

BUG FIX:

fix/m3-<slug>

Examples:

fix/m3-recommendation-filter
fix/m3-dashboard-route

DOCUMENTATION / CHORE:

chore/m3-<slug>

Examples:

chore/m3-p7-docs-closeout
chore/m3-update-architecture

Use descriptive names.

==================================================
5. MILESTONE 3 PHASE BRANCHES
==================================================

The current Milestone 3 branch structure is:

P0:
feat/m3-p0-rebaseline

P1:
feat/m3-p1-inci-compatibility

P2:
feature/product-quality-model

P3:
feat/m3-p3-routine-set-compare

P4:
feat/m3-p4-log-entry

P5:
feat/m3-p5-dashboard-routes

P6:
feat/m3-p6-verification

P7:
chore/m3-p7-docs-closeout

P8 (beyond rubric, ADR-047):
feat/m3-p8-biometric-consent

P9 (beyond rubric, ADR-048):
feat/m3-p9-cf-signal

Normal dependency:

P0
 ↓
P1
P2
P3
P4
P5
 ↓
P6
 ↓
P7

P6 must not start until P1–P5 are completed and merged into dev.

==================================================
6. SPECIAL P2 EXCEPTION
==================================================

There is an existing branch:

feature/product-quality-model

This branch is an intentional exception because it already contains the in-flight ML/Product Quality Model work.

For P2:

DO NOT create another ML branch.

DO NOT create:

feat/m3-p2-ml

DO NOT fork another branch from:

feature/product-quality-model

Instead:

1. Checkout feature/product-quality-model.
2. Inspect all committed and uncommitted changes.
3. Complete the existing ML work.
4. Run all required tests.
5. Commit the remaining work.
6. Run /code-review.
7. Merge feature/product-quality-model into dev.
8. Delete feature/product-quality-model after successful merge.

The branch is temporary and must not remain after P2 is merged.

==================================================
7. ONE BRANCH PER WORKSTREAM
==================================================

Each independent feature/workstream must have its own branch.

Examples:

Backend:
    feat/m3-p1-inci-compatibility

Frontend:
    feat/m3-p5-dashboard-routes

QA:
    feat/m3-p6-verification

Documentation:
    chore/m3-p7-docs-closeout

DO NOT have multiple agents independently modifying the same service directory at the same time.

If multiple agents are required, coordinate their scopes first.

==================================================
8. NEVER WORK DIRECTLY ON DEV
==================================================

Do not implement feature work directly on dev.

If you discover that you are currently on dev and need to modify code:

STOP.

Create the appropriate task branch from dev first.

The only operations allowed directly on dev are integration/merge operations and explicitly authorized maintenance.

==================================================
9. OTHER DEVELOPERS' BRANCHES
==================================================

The following types of branches belong to other developers:

Niranjan--*
Pravallika-*
hemalatha-*
manvitha-*
samridh-*
shristi-*
chore/repo-recovery
and any other branch that you did not create for the current task.

NEVER:

- delete them
- merge them
- rebase them
- force-push them
- rename them
- modify them
- reset them

Only manage branches belonging to the current task/workstream.

==================================================
10. WORKING TREE SAFETY
==================================================

Before making changes:

git status

If there are existing uncommitted changes:

DO NOT automatically:

git reset --hard
git clean -fd
git checkout -- .
git restore .
git stash

First inspect what the changes are.

Never destroy existing work.

If the changes belong to another task or another agent, preserve them and ask for clarification if necessary.

==================================================
11. REBASE RULE
==================================================

If dev has changed while your feature branch is being developed, update your feature branch before merging.

Example:

git fetch origin
git checkout <feature-branch>
git rebase origin/dev

Resolve conflicts ON THE FEATURE BRANCH.

NEVER resolve feature conflicts by modifying dev directly.

After resolving conflicts:

Run the complete relevant test suite again.

Then continue with code review and merge.

==================================================
12. COMMIT RULES
==================================================

Use Conventional Commits.

Examples:

feat(ingredients): add INCI compatibility analysis

feat(recommendations): add routine budget solver

feat(progress): add log entry endpoint

fix(recommendations): prevent allergen products

test(milestone3): extend recommendation coverage

docs(milestone3): update completion report

Avoid vague commits such as:

update
changes
fix
final
done
work
test

Commits must describe the actual change.

==================================================
13. REQUIRED GIT AUTHOR
==================================================

Before committing, verify:

git config user.name
git config user.email

Expected identity:

Name:
Satya Sai tharun Jekkamsetti

Email:
satya.saitharun02@gmail.com

If the identity is incorrect, STOP before committing and correct it.

NEVER add AI co-author trailers.

DO NOT add:

Co-authored-by: Claude
Co-authored-by: Anthropic
Co-authored-by: AI

==================================================
14. TESTING BEFORE MERGE
==================================================

A branch is NOT ready to merge merely because the code works locally.

Before merging, run all applicable project gates.

Backend:

ruff
mypy --strict
pytest

Frontend:

npm run lint
npm run typecheck
npm run build

When applicable:

Playwright / E2E tests
Docker Compose live-stack verification

Use the exact verification requirements defined by the current Milestone phase.

Do not claim tests are passing unless they were actually executed.

==================================================
15. CODE REVIEW BEFORE MERGE
==================================================

Before merging ANY feature branch:

Run:

/code-review

Fix all actionable findings.

The branch is mergeable only when:

- implementation is complete
- tests pass
- code review is clean
- documentation is updated
- working tree is clean
- no unintended files are included

==================================================
16. DOCUMENTATION
==================================================

When the task requires documentation changes, update the appropriate files in the SAME feature branch.

Possible files include:

PROGRESS.md
docs/milestones/milestone_3/M3R_TASK_LEDGER.md
docs/ARCHITECTURE.md
docs/CONVENTIONS.md
docs/AI_ML.md
docs/DECISIONS.md
database_schemas/

Do not postpone required documentation until after merging.

==================================================
17. MERGE WORKFLOW
==================================================

Before merging:

git status
git branch --show-current
git fetch origin

Confirm:

1. Current branch is the intended feature branch.
2. dev is up to date.
3. Feature branch contains only intended changes.
4. Tests are green.
5. /code-review is complete.
6. Documentation is synchronized.

Then merge into dev.

The target is ALWAYS:

dev

NEVER:

main
satya-sai-tharun-skinlytics

==================================================
18. AFTER SUCCESSFUL MERGE
==================================================

After the feature branch has successfully merged into dev:

Delete the local branch:

git branch -d <branch-name>

Delete the remote branch:

git push origin --delete <branch-name>

Then verify:

git branch
git branch -r
git status

The completed feature branch should no longer remain.

==================================================
19. FINAL MILESTONE 3 BRANCH STATE
==================================================

At the end of Milestone 3:

main
    untouched

satya-sai-tharun-skinlytics
    untouched

dev
    contains all verified Milestone 3 work

All temporary Milestone 3 branches:
    merged into dev
    deleted locally
    deleted remotely

This includes:

feat/m3-p0-rebaseline
feat/m3-p1-inci-compatibility
feature/product-quality-model
feat/m3-p3-routine-set-compare
feat/m3-p4-log-entry
feat/m3-p5-dashboard-routes
feat/m3-p6-verification
chore/m3-p7-docs-closeout
feat/m3-p8-biometric-consent (beyond rubric)
feat/m3-p9-cf-signal (beyond rubric)

==================================================
20. MANDATORY PRE-TASK CHECK
==================================================

Before every task, report:

Current branch:
Base branch:
Task:
Required branch:
Branch status:
Existing related implementation:
Files/services affected:
Tests required:
Documentation required:
Merge target:

Example:

Current branch: dev
Base branch: dev
Task: INCI compatibility
Required branch: feat/m3-p1-inci-compatibility
Branch status: clean
Existing related implementation: safety-score exists
Files/services affected: backend/app/ai, services/ingredients
Tests required: parser + router + RBAC + compatibility tests
Documentation required: API contract + progress + ledger
Merge target: dev

==================================================
21. NON-NEGOTIABLE RULES
==================================================

RULE 1:
Never commit directly to main.

RULE 2:
Never commit directly to satya-sai-tharun-skinlytics.

RULE 3:
dev is the integration branch.

RULE 4:
Every new task starts from the latest dev.

RULE 5:
Create a dedicated branch for each feature/fix/chore.

RULE 6:
Never create a feature branch from another feature branch.

RULE 7:
Never modify another developer's branch.

RULE 8:
Never force-push shared branches.

RULE 9:
Never destroy uncommitted work.

RULE 10:
Run required tests before merging.

RULE 11:
Run /code-review before merging.

RULE 12:
Merge completed work into dev.

RULE 13:
Delete the feature branch after successful merge.

RULE 14:
Use Conventional Commits.

RULE 15:
Use the required Git author.

RULE 16:
Never add AI co-author trailers.

RULE 17:
If dev changes, rebase your feature branch onto dev before merging.

RULE 18:
Resolve conflicts on the feature branch, never on dev.

RULE 19:
Never mark a task DONE without actual verification.

RULE 20:
Do not bypass this workflow for small changes unless the repository owner explicitly instructs you to do so.

==================================================
22. EXECUTION PRINCIPLE
==================================================

When I give you a task:

1. Inspect Git state.
2. Identify the correct base branch.
3. Update dev if necessary.
4. Create the correct task branch.
5. Verify the branch.
6. Inspect existing implementation.
7. Implement the task.
8. Test thoroughly.
9. Update required documentation.
10. Run /code-review.
11. Commit using Conventional Commits.
12. Re-check the working tree.
13. Merge into dev.
14. Delete the completed branch.
15. Verify the final Git state.

NEVER skip the branch workflow.

The final development state must always be:

dev = latest verified integration state
feature branch = merged
feature branch = deleted
working tree = clean
tests = verified
code review = completed
documentation = synchronized
