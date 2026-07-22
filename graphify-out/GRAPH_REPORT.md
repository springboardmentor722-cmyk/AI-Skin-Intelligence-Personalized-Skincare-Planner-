# Graph Report - AI-Skin-Intelligence-Personalized-Skincare-Planner-  (2026-07-22)

## Corpus Check
- 386 files · ~744,193 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2991 nodes · 6910 edges · 165 communities (141 shown, 24 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 184 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dcd80021`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- get_db
- require_user
- ingredients/service.py
- button.tsx
- call_with_resilience
- test_clinical_review_service.py
- test_admin_service.py
- cn
- Base
- lib/auth.ts
- appearance-settings.tsx
- get_elasticsearch
- test_dermatologist_profile_service.py
- sidebar.tsx
- test_routines_service.py
- recommendations/page.tsx
- test_scores_service.py
- skinlytics_postgresql_schema_v3.sql
- utils.ts
- signup/page.tsx
- glass-topbar.tsx
- test_skin_profile_service.py
- postgres.py
- append_outbox
- vector.py
- results/page.tsx
- get_mongo_db
- embeddings.py
- compilerOptions
- nav-config.ts
- routine/page.tsx
- routines/service.py
- storage.py
- test_consultant_profile_service.py
- devDependencies
- test_products_ingest.py
- (user)/dashboard/page.tsx
- dermatologist-onboarding/onboarding-shell.tsx
- test_suitability.py
- dependencies
- helpers.ts
- chart.tsx
- app/page.tsx
- consultant_profile/router.py
- assessment/context.tsx
- components.json
- scores/service.py
- consultant-onboarding/onboarding-shell.tsx
- app/main.py
- _routine_adherence_score
- field.tsx
- consultant-onboarding/context.tsx
- dermatologist-onboarding/context.tsx
- rate_limit.py
- skin_profile/service.py
- consultant/dashboard/page.tsx
- dermatologist/dashboard/page.tsx
- conftest.py
- scripts
- docker_run.py
- product-recommendation-card.tsx
- consultant-onboarding.ts
- backend_run.py
- test_rate_limit.py
- web_run.py
- get_my_progress_summary
- test_health.py
- .prettierrc.json
- package.json
- .__call__
- .__call__
- 44cfa8e6d5d4_products_routines_scoring.py
- a9c3d2f81b47_seed_reference_data.py
- proxy.ts
- test_404_uses_error_envelope
- system-reports/page.tsx
- next.config.ts
- @hookform/resolvers
- products.py
- class-variance-authority
- setup.sh
- sonner
- next-themes
- eslint.config.mjs
- tailwind-merge
- playwright.config.ts
- postcss.config.mjs
- skinlytics-backend
- {
  useSession,
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  resetPassword,
}
- tw-animate-css
- Customization & Theming
- Component Composition
- Styling & Customization
- AI / ML engine
- Wireframes — Milestone 1, Part 4
- state-card.tsx
- alert-dialog
- Tools
- Graphify setup — quick start
- toast
- popover
- shadcn/ui
- Conventions
- get_db
- get_my_progress_summary
- weather/service.py
- tooltip
- dialog
- Target wrapper shapes (golden-derived specifics)
- consultant/dashboard/page.tsx
- scroll-area
- hover-card → preview-card
- Registry Authoring and Addresses
- Base vs Radix
- Chat & Messaging
- form
- Forms & Inputs
- Critical Rules
- Identity — Better Auth (Next.js) + FastAPI JWKS validation
- Suggestions
- Class-string rewrites (layer 2)
- display-misc.md
- avatar
- Radix UI -> Base UI migration
- Schema changes — v2 → v3
- Milestone 3 — Execution Prompt for Autonomous Coding Agents
- le
- Consumer-side prop changes (call sites, not wrappers)
- Progress.Indicator → Progress.Indicator
- dermatologist/dashboard/page.tsx
- No Base UI counterpart
- (new) Fieldset.Root and Fieldset.Legend
- training_dataset/ — dataset manifest
- training_dataset/
- backend/README.md
- overlays.md
- [role]/[userId]/page.tsx
- next
- Adapter
- README.md
- use-weather-uv.ts
- web/README.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 202 edges
2. `get_db()` - 72 edges
3. `require_role()` - 68 edges
4. `create_profile()` - 64 edges
5. `SkinProfileCreate` - 58 edges
6. `get_mongo_db()` - 53 edges
7. `Button()` - 51 edges
8. `require_user()` - 43 edges
9. `get_or_generate_routines()` - 43 edges
10. `Base` - 41 edges

## Surprising Connections (you probably didn't know these)
- `test_feedback_accepts_an_optional_recommendation_id()` --indirect_call--> `require_user()`  [INFERRED]
  backend/tests/test_recommendations_router.py → backend/app/core/security.py
- `test_feedback_rejects_an_unknown_action()` --indirect_call--> `require_user()`  [INFERRED]
  backend/tests/test_recommendations_router.py → backend/app/core/security.py
- `test_feedback_round_trips_into_mongo()` --indirect_call--> `require_user()`  [INFERRED]
  backend/tests/test_recommendations_router.py → backend/app/core/security.py
- `test_require_role_allows_any_of_multiple_roles()` --calls--> `require_role()`  [EXTRACTED]
  backend/tests/test_rbac.py → backend/app/core/security.py
- `test_require_role_allows_matching_role()` --calls--> `require_role()`  [EXTRACTED]
  backend/tests/test_rbac.py → backend/app/core/security.py

## Import Cycles
- 3-file cycle: `backend/app/services/routines/service.py -> backend/app/services/scores/service.py -> backend/app/services/scores/scoring_engine.py -> backend/app/services/routines/service.py`

## Communities (165 total, 24 thin omitted)

### Community 0 - "get_db"
Cohesion: 0.06
Nodes (108): require_role(), get_db(), AsyncSession, approve_verification(), assign_consultant_client(), create_audit_log(), deactivate_professional(), get_audit_logs() (+100 more)

### Community 1 - "require_user"
Cohesion: 0.12
Nodes (41): database_schemas/skinlytics_postgresql_schema_v3.sql — extends the Better Auth, database_schemas/skinlytics_postgresql_schema_v3.sql's "APPEARANCE PREFERENCES", UserAppearancePreference, UserProfile, get_me(), get_my_appearance(), get_my_profile(), Any (+33 more)

### Community 2 - "ingredients/service.py"
Cohesion: 0.07
Nodes (59): get_interaction(), Interaction, TypedDict, Curated pairwise ingredient interaction rules (M3-B, PDF Module 5 "interaction, None means "no curated interaction documented" — never a fabricated verdict, get_ingredient(), get_interactions(), get_my_suitability() (+51 more)

### Community 3 - "button.tsx"
Cohesion: 0.06
Nodes (38): ASSIGNABLE_ROLES, BetterAuthUser, ListUsersResponse, Role, QueueItem, ROLE_OPTIONS, STATUS_OPTIONS, SEVERITIES (+30 more)

### Community 4 - "call_with_resilience"
Cohesion: 0.09
Nodes (37): AdapterError, call_with_resilience(), CircuitBreaker, Exception, Raised once an adapter's resilience policy (retries + circuit breaker) is     e, Opens after `failure_threshold` consecutive failures; half-open (one probe, 10 s timeout · 3 retries, exponential backoff + jitter · circuit breaker —, fetch_uv_index() (+29 more)

### Community 5 - "test_clinical_review_service.py"
Cohesion: 0.14
Nodes (34): ConsultantClient, ConsultantNote, One row per professional-client assignment. `status` gates whether the     prof, ClientScoreRead, A read-only projection of the client's latest real skin_assessments row (via, add_note(), create_assignment(), get_client_detail() (+26 more)

### Community 6 - "test_admin_service.py"
Cohesion: 0.11
Nodes (53): Polymorphic across ConsultantProfile/DermatologistProfile via `owner_user_id`,, VerificationDocument, apply_verification_action(), assign_client(), create_document(), delete_document(), get_document_view_url(), _get_for_model() (+45 more)

### Community 7 - "cn"
Cohesion: 0.09
Nodes (32): AppSidebar(), NavUser(), Sidebar(), SidebarContent(), SidebarContext, SidebarContextProps, SidebarFooter(), SidebarGroup() (+24 more)

### Community 8 - "Base"
Cohesion: 0.08
Nodes (62): _IngredientSeed, main(), _ProductSeed, TypedDict, Idempotent local/dev seed data — `make seed` / `python -m app.db.seed`.  Seeds, seed_ingredients(), seed_products(), load_into_database() (+54 more)

### Community 9 - "lib/auth.ts"
Cohesion: 0.06
Nodes (39): ADR-0002, ADR-0011, ADR-0015, errorResponse(), POST(), errorResponse(), GET(), ROLES (+31 more)

### Community 10 - "appearance-settings.tsx"
Cohesion: 0.07
Nodes (32): PANELS, ADR-0007, ADR-0014, geist, inter, metadata, sora, AppearanceSync() (+24 more)

### Community 11 - "get_elasticsearch"
Cohesion: 0.10
Nodes (32): AsyncElasticsearch, get_elasticsearch(), is_elasticsearch_available(), Lazy client — nothing connects until the first real call. Only     app/worker/, Absent-safe health check — callers fall back to a documented degraded path, build_ingredient_document(), ensure_indices(), project_to_elasticsearch() (+24 more)

### Community 12 - "test_dermatologist_profile_service.py"
Cohesion: 0.21
Nodes (23): delete_own_document(), get_own_profile(), list_own_documents(), AsyncSession, VerificationDocument, Insert (first-ever onboarding submission) or resubmit (after rejected/     more, Edits fields without ever touching verification_status — reachable at any     s, submit_profile() (+15 more)

### Community 13 - "sidebar.tsx"
Cohesion: 0.05
Nodes (63): firstOf(), RecommendationRead, RecommendationsPage(), SORT_ITEMS, SORT_KEY_BY_LABEL, SORT_LABEL_BY_KEY, SortKey, Breadcrumb() (+55 more)

### Community 14 - "test_routines_service.py"
Cohesion: 0.12
Nodes (57): _am_pm_categories_for_skin_type(), _current_season(), get_or_generate_routines(), ProductRead, Deterministic, `hash(user_id)`-seeded routine generation (ADR-007 spirit) — no, search_products_for_edit(), toggle_step_completion(), Taxonomy/reference table — seeded, rarely written after (Normal/Dry/Oily/     C (+49 more)

### Community 15 - "recommendations/page.tsx"
Cohesion: 0.04
Nodes (48): Arrow / Item / Group / Label / CheckboxItem / RadioGroup / RadioItem / ItemIndicator / Separator / Sub / SubTrigger / SubContent, Arrow → Menu.Arrow, Base UI only, data attributes, CSS variables, Base UI only props worth knowing (Menu), Base UI only props worth knowing (NavigationMenu), CheckboxItem → Menu.CheckboxItem, Content → ContextMenu.Portal > Positioner > Popup, Content → Menu.Portal > Menu.Positioner > Menu.Popup (+40 more)

### Community 16 - "test_scores_service.py"
Cohesion: 0.08
Nodes (42): calculate_skin_health_score(), _hydration_score(), _lifestyle_score(), Any, AsyncSession, docs/AI_ML.md: 'min(100, glasses/day / 8 * 100), 7-day average'. lifestyle_logs, mile_2.docx Step 3.1: 'Fetch the last 7 days of routine logs from MongoDB., The exact weighted equation (mile_2.docx Step 3.1 / docs/AI_ML.md):          S (+34 more)

### Community 17 - "skinlytics_postgresql_schema_v3.sql"
Cohesion: 0.11
Nodes (37): account, audit_logs, consultant_clients, consultant_notes, consultant_profiles, dermatologist_profiles, ingredient_concern_treats, ingredient_skintype_avoid (+29 more)

### Community 18 - "utils.ts"
Cohesion: 0.05
Nodes (57): AssessmentBasicsPage(), GOALS, AssessmentConcernsPage(), ALLERGY_OPTIONS, AssessmentLifestylePage(), firstOf(), SLEEP_QUALITY_ITEMS, SLEEP_QUALITY_OPTIONS (+49 more)

### Community 19 - "signup/page.tsx"
Cohesion: 0.13
Nodes (14): LoginForm(), safeRedirectTarget(), AuthSplitLayout(), GoogleIcon(), Label(), forgotPasswordSchema, ForgotPasswordValues, loginSchema (+6 more)

### Community 20 - "glass-topbar.tsx"
Cohesion: 0.15
Nodes (22): NAV_LINKS, ThemeToggle(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+14 more)

### Community 21 - "test_skin_profile_service.py"
Cohesion: 0.13
Nodes (32): Taxonomy/reference table — seeded (Acne, Hyperpigmentation, ...)., SkinConcern, SkinProfileConcern, EnvironmentalExposure, LifestyleLogCreate, BaseModel, SkinConcernRead, SkinProfileConcernRead (+24 more)

### Community 22 - "postgres.py"
Cohesion: 0.15
Nodes (17): Validate, never authenticate — Better Auth is the auth authority (ADR-002/003)., Base, Shared declarative base. Each service owns its own tables (ADR-005) — a service, do_run_migrations(), include_object(), Any, In this scenario we need to create an Engine     and associate a connection wit, Run migrations in 'online' mode. (+9 more)

### Community 23 - "append_outbox"
Cohesion: 0.12
Nodes (26): append_outbox(), Outbox, Any, AsyncSession, invalidate_recommendation_cache_for_catalog_change(), AI_ML.md's recommendation pipeline: cache "INVALIDATED on any profile/     pref, poll_outbox_tick(), WorkerSettings (+18 more)

### Community 24 - "vector.py"
Cohesion: 0.05
Nodes (72): get_embedder(), _normalize(), Deterministic, hash-seeded — same ADR-007 spirit as every other stub in this, SentenceTransformers-backed, lazy-loaded (no model load at import time — only, RealTextEmbedder, StubTextEmbedder, One embedding model per namespace, pinned (mixing versions corrupts     similar, TextEmbedder (+64 more)

### Community 25 - "results/page.tsx"
Cohesion: 0.04
Nodes (46): accordion, Accordion.Content → Accordion.Panel, Accordion.Header → Accordion.Header, Accordion.Item → Accordion.Item, Accordion.Root → Accordion.Root, Accordion.Trigger → Accordion.Trigger, Base UI only props worth knowing, Base UI only props worth knowing (+38 more)

### Community 26 - "get_mongo_db"
Cohesion: 0.12
Nodes (25): AsyncIOMotorClient, AsyncIOMotorDatabase, ingest_for_concern(), main(), Real PubMed ingestion — `make ingest-knowledge` / `python -m app.db.ingest_knowl, get_mongo_client(), get_mongo_db(), Any (+17 more)

### Community 27 - "embeddings.py"
Cohesion: 0.08
Nodes (37): ContentBasedRecommender, The stage-4 rank step (milestone_3.md §2/§8) — see app/ai/schemas.py's     `Rec, IngredientSuitability, BaseModel, Protocol, Every field here is a real, auditable claim — never a probability that just, Rule-based, not ML (M3-B) — the zero-missed-allergy hard requirement     (AI_ML, Stage-4 rank inputs (milestone_3.md §8) — every field pre-normalized to     [0, (+29 more)

### Community 28 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 29 - "nav-config.ts"
Cohesion: 0.07
Nodes (29): ADR-0005, AssessmentResultsPage(), ScoreRead, useSubmitAssessment(), getGreetingSnapshot(), GREETING_SERVER_SNAPSHOT, SkinScoreTrendChart, subscribeNever() (+21 more)

### Community 30 - "routine/page.tsx"
Cohesion: 0.11
Nodes (19): CORE_TABS, MyRoutinePage(), RoutineRead, RoutineStepCard(), RoutineStepRead, RoutineType, RoutineChecklistCard(), RoutineChecklistCardProps (+11 more)

### Community 31 - "routines/service.py"
Cohesion: 0.18
Nodes (29): Deterministic RNG for M1 AI stubs (ADR-007: 'deterministic, hash(user_id)-seeded, seeded_random(), Routine, RoutineProduct, RoutineStep, add_step(), _assert_product_is_safe(), _day_start() (+21 more)

### Community 32 - "storage.py"
Cohesion: 0.17
Nodes (25): build_key(), _client_kwargs(), delete(), FileValidationError, get_presigned_url(), Exception, S3-compatible object storage adapter (docs/ARCHITECTURE.md §7, database_schemas/, `allowed_content_types` is the caller's own allowlist for its use case (e.g. (+17 more)

### Community 33 - "test_consultant_profile_service.py"
Cohesion: 0.20
Nodes (25): AuditLog, General-purpose system audit log — Admin's "Audit Logs"/"Activity Logs"     scr, delete_own_document(), get_own_profile(), list_own_documents(), AsyncSession, VerificationDocument, Insert (first-ever onboarding submission) or resubmit (after rejected/     more (+17 more)

### Community 34 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, mongodb, @playwright/test, prettier, prettier-plugin-tailwindcss, tailwindcss, @tailwindcss/postcss (+19 more)

### Community 35 - "test_products_ingest.py"
Cohesion: 0.11
Nodes (34): download_dataset(), KaggleCredentialsError, main(), normalize_rows(), _parse_ingredients(), _parse_size_ml(), Any, AsyncSession (+26 more)

### Community 36 - "(user)/dashboard/page.tsx"
Cohesion: 0.11
Nodes (43): compare_products(), get_alternatives(), get_product_detail(), list_products(), _list_via_es(), _list_via_pg(), _product_read_from_es_source(), Any (+35 more)

### Community 37 - "dermatologist-onboarding/onboarding-shell.tsx"
Cohesion: 0.22
Nodes (7): client(), db_session(), AsyncClient, AsyncSession, Inserts a throwaway row into Better Auth's `user` table (see     app/db/postgre, A real session against the real (live, populated) Postgres, wrapped in an outer, test_user_id()

### Community 38 - "test_suitability.py"
Cohesion: 0.04
Nodes (44): Base UI only props worth knowing (checkbox), Base UI only props worth knowing (radio-group), Base UI only props worth knowing (select), Base UI only props worth knowing (slider), Base UI only props worth knowing (switch), checkbox, Checkbox.Indicator → Checkbox.Indicator, Checkbox.Root → Checkbox.Root (+36 more)

### Community 39 - "dependencies"
Cohesion: 0.08
Nodes (25): @base-ui/react, better-auth, clsx, cmdk, ioredis, lucide-react, pg, react-dom (+17 more)

### Community 40 - "helpers.ts"
Cohesion: 0.25
Nodes (13): ADR-0012, signInAsAdmin(), signIn(), signUpAndLand(), signIn(), clearRateLimits(), deleteMongoLogsForUser(), deleteTestUser() (+5 more)

### Community 41 - "chart.tsx"
Cohesion: 0.12
Nodes (20): react, SkinScoreTrendChartProps, ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent() (+12 more)

### Community 42 - "app/page.tsx"
Cohesion: 0.10
Nodes (18): FEATURES, FeaturesGrid(), FinalCtaSection(), HeroSection(), HowItWorksSection(), STEPS, FOOTER_COLUMNS, LandingFooter() (+10 more)

### Community 43 - "consultant_profile/router.py"
Cohesion: 0.20
Nodes (20): delete_my_document(), get_my_profile(), list_my_documents(), Any, AsyncSession, Depends, DocumentType, File (+12 more)

### Community 44 - "assessment/context.tsx"
Cohesion: 0.09
Nodes (23): AssessmentConcernPriority, AssessmentContext, AssessmentContextValue, AssessmentProvider(), AssessmentSensitivities, AssessmentSnapshot, AssessmentState, commit() (+15 more)

### Community 45 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 46 - "scores/service.py"
Cohesion: 0.09
Nodes (50): _decode(), _jwk_client(), Any, Gates *operational* consultant/dermatologist endpoints (M2+) on the matching, require_user(), require_verified_professional(), _as(), AsyncClient (+42 more)

### Community 47 - "consultant-onboarding/onboarding-shell.tsx"
Cohesion: 0.20
Nodes (10): scripts, build, dev, format, format:check, lint, start, test (+2 more)

### Community 48 - "app/main.py"
Cohesion: 0.09
Nodes (23): FastAPI, One error envelope everywhere (docs/CONVENTIONS.md): { "error": { "code", "mess, register_exception_handlers(), configure_logging(), get_request_id(), ASGIApp, Receive, Request (+15 more)

### Community 49 - "_routine_adherence_score"
Cohesion: 0.07
Nodes (27): 10. Theming implementation (shadcn mapping), 11. Accessibility floor, 12. Do / Don't, 1. Brand & style, 2. Color system, 2a. Alternate palettes (Theme system, Phase 3), 3. Glassmorphism — the elevation crown, 4. Typography — tri-font strategy (+19 more)

### Community 50 - "field.tsx"
Cohesion: 0.23
Nodes (19): add_client_note(), get_client(), get_client_notes(), get_my_clients(), Any, AsyncSession, Depends, ClientDetailRead (+11 more)

### Community 51 - "consultant-onboarding/context.tsx"
Cohesion: 0.19
Nodes (12): commit(), ConsultantOnboardingProvider(), ConsultantOnboardingState, ContextValue, DEFAULT_STATE, getClientSnapshot(), listeners, OnboardingContext (+4 more)

### Community 52 - "dermatologist-onboarding/context.tsx"
Cohesion: 0.19
Nodes (12): commit(), ContextValue, DEFAULT_STATE, DermatologistOnboardingProvider(), DermatologistOnboardingState, getClientSnapshot(), listeners, OnboardingContext (+4 more)

### Community 53 - "rate_limit.py"
Cohesion: 0.10
Nodes (22): get_settings(), Env vars documented in /.env.example — read from there, not invented here., Settings, error_envelope(), Request, _identity(), Receive, Request (+14 more)

### Community 54 - "skin_profile/service.py"
Cohesion: 0.08
Nodes (25): 10. Risks, 11. Definition of Done — Milestone 3, 1. Overview, 2. Architecture, 3. Deliverables — modules, 4. Folder structure (where new code belongs — no duplicates, no new layouts), 5. Database changes, 6. APIs (+17 more)

### Community 55 - "consultant/dashboard/page.tsx"
Cohesion: 0.08
Nodes (24): accordion, asChild -> render, breadcrumb / marker (Slot users), Coverage matrix, CSS custom properties, Data attributes / class hooks, dialog / alert-dialog / sheet, Doc-validation TODOs (before specs are final) (+16 more)

### Community 56 - "dermatologist/dashboard/page.tsx"
Cohesion: 0.06
Nodes (54): ConsultantBackgroundPage(), ConsultantContactPage(), ConsultantPracticePage(), ConsultantReviewPage(), FIELD_LABELS, formatValue(), SUMMARY_SECTIONS, DermatologistBackgroundPage() (+46 more)

### Community 58 - "conftest.py"
Cohesion: 0.33
Nodes (5): name, overrides, postcss, private, version

### Community 59 - "scripts"
Cohesion: 0.10
Nodes (20): ADR-001 — Drop the runtime graph database, ADR-002 — Better Auth is the single auth authority, ADR-003 — User IDs are strings (TEXT); identity tables are Better-Auth-owned, ADR-004 — Frontend: Next.js + Tailwind + shadcn/ui, Recharts, Stitch designs, ADR-005 — Modular monolith for M1–M3, containers at M4, ADR-006 — Adopt Graphify (the dev tool) for agent context persistence, ADR-007 — AI is stubbed until Milestone 2, ADR-008 — "Frosted Lab Glass" design language (glassmorphism on navy/blue/teal) (+12 more)

### Community 60 - "docker_run.py"
Cohesion: 0.42
Nodes (8): ensure_root_env(), ensure_web_env_symlink(), fail(), find_docker(), main(), NoReturn, start_docker_compose(), wait_for_postgres()

### Community 61 - "product-recommendation-card.tsx"
Cohesion: 0.15
Nodes (15): AppShell(), AppShellProps, AppSidebarProps, GlassTopbarProps, NavUserProps, authClient, EXTRA_TITLES, NavItem (+7 more)

### Community 63 - "consultant-onboarding.ts"
Cohesion: 0.20
Nodes (20): delete_my_document(), get_my_profile(), list_my_documents(), Any, AsyncSession, Depends, DocumentType, File (+12 more)

### Community 64 - "backend_run.py"
Cohesion: 0.43
Nodes (7): fail(), is_port_open(), main(), NoReturn, read_env_var(), require_on_path(), warn_if_datastores_unreachable()

### Community 65 - "test_rate_limit.py"
Cohesion: 0.10
Nodes (19): 1. Skin images, 2. Product database — Kaggle (Sephora / cosmetics sets), 3. Ingredient database — INCIDecoder, COSDNA, 4. Dermatology knowledge — DermNet, AAD, 5. Weather & UV, 6. User lifestyle — in-app forms, 7. Progress tracking — generated internally, 8. Research (+11 more)

### Community 66 - "web_run.py"
Cohesion: 0.43
Nodes (7): fail(), is_port_open(), main(), NoReturn, read_env_var(), require_on_path(), warn_if_postgres_unreachable()

### Community 68 - "test_health.py"
Cohesion: 0.53
Nodes (5): AsyncClient, test_health(), test_health_ready_checks_real_dependencies(), test_request_id_echoed(), test_security_headers_present_on_every_response()

### Community 69 - ".prettierrc.json"
Cohesion: 0.33
Nodes (5): prettier-plugin-tailwindcss, plugins, semi, singleQuote, trailingComma

### Community 70 - "package.json"
Cohesion: 0.12
Nodes (17): `add` — Add components, `apply` — Apply a preset to an existing project, `build` — Build a custom registry, Commands, Contents, `diff` — Check for updates, `docs` — Get component documentation URLs, Dry-Run Mode (+9 more)

### Community 77 - "proxy.ts"
Cohesion: 0.67
Nodes (3): config, proxy(), PUBLIC_PATHS

### Community 93 - "products.py"
Cohesion: 0.13
Nodes (14): 10. Core data flow — recommendation pipeline (M2+), 11. Frontend architecture, 12. Repository layout, 13. Milestone roadmap (8 weeks) with exit criteria, 1. Objective, audience & non-functional targets, 2. Roles, 3. High-level architecture (matches the system diagram), 4. Microservices (14) (+6 more)

### Community 116 - "tw-animate-css"
Cohesion: 0.21
Nodes (4): Icons, Icons in Button use data-icon attribute, No sizing classes on icons inside components, Pass icons as component objects, not string keys

### Community 117 - "Customization & Theming"
Cohesion: 0.14
Nodes (14): 1. Built-in variants, 2. Tailwind classes via `className`, 3. Add a new variant, 4. Wrapper components, Adding Custom Colors, Border Radius, Changing the Theme, Checking for Updates (+6 more)

### Community 118 - "Component Composition"
Cohesion: 0.15
Nodes (13): Avatar always needs AvatarFallback, Button has no isPending or isLoading prop, Callouts use Alert, Card structure, Choosing between overlay components, Component Composition, Contents, Dialog, Sheet, and Drawer always need a Title (+5 more)

### Community 119 - "Styling & Customization"
Cohesion: 0.15
Nodes (13): Built-in variants first, className for layout only, Contents, No manual dark: color overrides, No manual z-index on overlay components, No raw color values for status/state indicators, No space-x-* / space-y-*, Prefer size-* over w-* h-* when equal (+5 more)

### Community 120 - "AI / ML engine"
Cohesion: 0.15
Nodes (12): AI / ML engine, Embedding pipeline (M2–M3, rides the outbox — ADR-010), Evaluation harness (`ml/eval/`), Metrics to wire (PDF §8 → owner), Model cards (targets set with the first eval set, M2), Model interfaces (the contract services depend on), Principles, Recommendation pipeline (M2+) (+4 more)

### Community 121 - "Wireframes — Milestone 1, Part 4"
Cohesion: 0.15
Nodes (12): 1. Login, 2. Registration, 3. User dashboard, 4. Skin profile & lifestyle (PDF Module 2; M1 parts 8–9), 5. Skin assessment, 6. Product recommendations, 7. Progress tracking, App shell (screens 3–7, authenticated) (+4 more)

### Community 124 - "state-card.tsx"
Cohesion: 0.19
Nodes (13): AdminDashboardPage(), AuditLogEntry, DashboardStatsResponse, formatAction(), StateCardProps, ADR-0008, Empty(), EmptyContent() (+5 more)

### Community 125 - "alert-dialog"
Cohesion: 0.17
Nodes (12): Action → (no primitive), alert-dialog, Base UI only props worth knowing (alert-dialog), Cancel → Close, Content → Popup, CSS variables (alert-dialog), Data attributes (alert-dialog), Overlay → Backdrop (+4 more)

### Community 126 - "Tools"
Cohesion: 0.17
Nodes (11): Configuring Registries, Setup, `shadcn:get_add_command_for_items`, `shadcn:get_audit_checklist`, `shadcn:get_item_examples_from_registries`, `shadcn:get_project_registries`, `shadcn:list_items_in_registries`, shadcn MCP Server (+3 more)

### Community 127 - "Graphify setup — quick start"
Cohesion: 0.17
Nodes (11): 1. Install the CLI (PyPI package is `graphifyy` — double y; command is `graphify`), 2. Wire up each tool you use (writes its config + a "query the graph first" hook), 3. Build the graph and commit it (so all tools share one map), 4. Include the database schema in the graph, 5. (Optional) run it as a shared MCP server, 6. Verify (30-second smoke test), Daily use (replaces grepping), Google Stitch designs — two supported paths (+3 more)

### Community 128 - "toast"
Cohesion: 0.18
Nodes (11): Base UI only props worth knowing, CSS variables, Data attributes, toast, Toast.Action → Toast.Action, Toast.Close → Toast.Close, Toast.Description → Toast.Description, Toast.Provider → Toast.Provider (+3 more)

### Community 129 - "popover"
Cohesion: 0.18
Nodes (11): Anchor → Positioner `anchor` prop, Arrow → Arrow, Base UI only props worth knowing (popover), Close → Close, Content → Positioner + Popup, CSS variables (popover), Data attributes (popover), popover (+3 more)

### Community 130 - "shadcn/ui"
Cohesion: 0.18
Nodes (11): Component Docs, Examples, and Usage, Component Selection, Current Project Context, Detailed References, Key Fields, Key Patterns, Principles, Quick Reference (+3 more)

### Community 131 - "Conventions"
Cohesion: 0.18
Nodes (10): Backend (FastAPI, Python), Conventions, Database & migrations, Definition of done, Frontend (Next.js, TypeScript), Git & process, Golden rules (violating any of these is a review blocker), Makefile targets (the shared vocabulary) (+2 more)

### Community 132 - "get_db"
Cohesion: 0.29
Nodes (9): BaseModel, ScoreRead, ScoreWeightsRead, compute_and_store_score(), get_active_weights(), get_recent_scores(), AsyncSession, ScoreRead (+1 more)

### Community 133 - "get_my_progress_summary"
Cohesion: 0.18
Nodes (13): get_my_progress_summary(), Any, AsyncSession, Depends, ge, le, Query, ProgressSummaryRead (+5 more)

### Community 134 - "weather/service.py"
Cohesion: 0.24
Nodes (8): get_my_weather_uv(), Any, Depends, BaseModel, WeatherUVRead, _cache_key(), get_weather_uv(), Real OpenWeather (temp/humidity/condition) + OpenUV (uv_index) — each degrades

### Community 136 - "tooltip"
Cohesion: 0.20
Nodes (10): Arrow → Arrow, Base UI only props worth knowing (tooltip), Content → Positioner + Popup, CSS variables (tooltip), Data attributes (tooltip), Portal → Portal, Provider → Provider, Root → Root (+2 more)

### Community 137 - "dialog"
Cohesion: 0.20
Nodes (10): Base UI only props worth knowing (dialog), Content → Popup, CSS variables (dialog), Data attributes (dialog), dialog, Overlay → Backdrop, Portal → Portal, Root → Root (+2 more)

### Community 138 - "Target wrapper shapes (golden-derived specifics)"
Cohesion: 0.20
Nodes (9): Accordion animation placement, Button, Conventions, DropdownMenu / ContextMenu SubContent, Select, SubTrigger open styling, Tabs, Target wrapper shapes (golden-derived specifics) (+1 more)

### Community 139 - "consultant/dashboard/page.tsx"
Cohesion: 0.18
Nodes (9): COMING_SOON, ConsultantProfile, DOCUMENT_TYPES, DocumentType, ProfileSummaryCard(), STATUS_COPY, TONE_CLASSES, VerificationDocument (+1 more)

### Community 140 - "scroll-area"
Cohesion: 0.22
Nodes (9): Base UI only props worth knowing, CSS variables, Data attributes, scroll-area, ScrollArea.Corner → ScrollArea.Corner, ScrollArea.Root → ScrollArea.Root, ScrollArea.Viewport → ScrollArea.Viewport, ScrollAreaScrollbar → ScrollArea.Scrollbar (+1 more)

### Community 141 - "hover-card → preview-card"
Cohesion: 0.22
Nodes (9): Arrow → Arrow, Base UI only props worth knowing (preview-card), Content → Positioner + Popup, CSS variables (preview-card), Data attributes (preview-card), hover-card → preview-card, Portal → Portal, Root → Root (+1 more)

### Community 142 - "Registry Authoring and Addresses"
Cohesion: 0.22
Nodes (9): Address Schemes, Build and Verify, GitHub Registries, Include, Item Definitions, Mental Model, Registry Authoring and Addresses, Registry Dependencies (+1 more)

### Community 143 - "Base vs Radix"
Cohesion: 0.22
Nodes (9): Accordion, Base vs Radix, Button / trigger as non-button element (base only), Composition: asChild (radix) vs render (base), Contents, Select, Select — multiple selection and object values (base only), Slider (+1 more)

### Community 144 - "Chat & Messaging"
Cohesion: 0.22
Nodes (9): Attachments use Attachment, Chat & Messaging, Contents, Escape hatch: the scroller hooks, Message rows use Message, Message surfaces use Bubble, Scrollable threads use MessageScroller, Streaming, anchoring, and jump-to-latest are built in (+1 more)

### Community 145 - "form"
Cohesion: 0.25
Nodes (8): form, Form.Control → Field.Control, Form.Field → Field.Root, Form.Label → Field.Label, Form.Message → Field.Error, Form.Root → Form, Form.Submit → (none), Form.ValidityState → Field.Validity

### Community 146 - "Forms & Inputs"
Cohesion: 0.25
Nodes (8): Buttons inside inputs use InputGroup + InputGroupAddon, Contents, Field validation and disabled states, FieldSet + FieldLegend for grouping related fields, Forms & Inputs, Forms use FieldGroup + Field, InputGroup requires InputGroupInput/InputGroupTextarea, Option sets (2–7 choices) use ToggleGroup

### Community 147 - "Critical Rules"
Cohesion: 0.25
Nodes (8): Chat & Messaging → [chat.md](./rules/chat.md), CLI, Component Structure → [composition.md](./rules/composition.md), Critical Rules, Forms & Inputs → [forms.md](./rules/forms.md), Icons → [icons.md](./rules/icons.md), Styling & Tailwind → [styling.md](./rules/styling.md), Use Components, Not Custom Markup → [composition.md](./rules/composition.md)

### Community 148 - "Identity — Better Auth (Next.js) + FastAPI JWKS validation"
Cohesion: 0.25
Nodes (7): Backend — `backend/app/core/security.py` (validate, don't authenticate), Flow, Frontend — `web/lib/auth.ts`, Gotchas (from the field), Identity — Better Auth (Next.js) + FastAPI JWKS validation, Revocation / logout, Roles & permissions

### Community 149 - "Suggestions"
Cohesion: 0.25
Nodes (7): Dev workflow / agentic tooling, Frontend polish (from the frontend-design skill), P0 — Privacy, safety & trust (skin/health app with face photos), P1 — Architecture & correctness (this milestone), P2 — When the feature lands (M2–M3), P3 — Later, Suggestions

### Community 150 - "Class-string rewrites (layer 2)"
Cohesion: 0.29
Nodes (6): Animation idiom, Class-string rewrites (layer 2), CSS variables, Data-attribute selectors, Disabled-state hooks, Element changes kill pseudo-class variants

### Community 151 - "display-misc.md"
Cohesion: 0.29
Nodes (6): Base UI only props worth knowing, CSS variables, Data attributes, Radix UI → Base UI props mapping: progress, scroll-area, separator, avatar, toast, form, separator, Separator.Root → Separator

### Community 152 - "avatar"
Cohesion: 0.29
Nodes (7): avatar, Avatar.Fallback → Avatar.Fallback, Avatar.Image → Avatar.Image, Avatar.Root → Avatar.Root, Base UI only props worth knowing, CSS variables, Data attributes

### Community 153 - "Radix UI -> Base UI migration"
Cohesion: 0.29
Nodes (6): Hard rules, Modes, Preflight (always), Radix UI -> Base UI migration, Strategy: golden pair first, transformation engine second, Verify and report

### Community 154 - "Schema changes — v2 → v3"
Cohesion: 0.22
Nodes (8): 2026-07-14 — Milestone 2 literal rename, 2026-07-22 — M3-A: `outbox` table (ADR-010 made real), 2026-07-22 — M3-C: `products.rating` + `products.review_count`, 2026-07-22 — M3-D: `product_recommendations` (first writer) + Mongo `recommendation_feedback` (NEW), Files in this folder, Migration note, Schema changes — v2 → v3, What changed

### Community 155 - "Milestone 3 — Execution Prompt for Autonomous Coding Agents"
Cohesion: 0.29
Nodes (6): Definition of done, Git workflow (mandatory — matches the project owner's instruction), Master prompt (paste into a fresh agent session), Milestone 3 — Execution Prompt for Autonomous Coding Agents, Module order (from `milestone_3.md` §3 — do not reorder without cause), Standing rules (apply to every task, every session)

### Community 156 - "le"
Cohesion: 0.26
Nodes (7): RANGES, SkinScoreTrendChart, ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 157 - "Consumer-side prop changes (call sites, not wrappers)"
Cohesion: 0.33
Nodes (5): Callback signature rule, Consumer-side prop changes (call sites, not wrappers), Per component, Sweep procedure, Universal

### Community 158 - "Progress.Indicator → Progress.Indicator"
Cohesion: 0.33
Nodes (6): Base UI only props worth knowing, CSS variables, Data attributes, progress, Progress.Indicator → Progress.Indicator, Progress.Root → Progress.Root

### Community 159 - "dermatologist/dashboard/page.tsx"
Cohesion: 0.18
Nodes (9): COMING_SOON, DermatologistProfile, DOCUMENT_TYPES, DocumentType, ProfileSummaryCard(), STATUS_COPY, TONE_CLASSES, VerificationDocument (+1 more)

### Community 162 - "No Base UI counterpart"
Cohesion: 0.40
Nodes (5): AccessibleIcon (radix `AccessibleIcon.Root`: `label` required), AspectRatio (radix `AspectRatio.Root`: `asChild`, `ratio` default `1`), Label (radix `Label.Root`: `asChild`, `htmlFor`), No Base UI counterpart, VisuallyHidden (radix `VisuallyHidden.Root`: `asChild`)

### Community 164 - "(new) Fieldset.Root and Fieldset.Legend"
Cohesion: 0.50
Nodes (4): Base UI only props worth knowing (form-wide), CSS variables, Data attributes, (new) Fieldset.Root and Fieldset.Legend

### Community 165 - "training_dataset/ — dataset manifest"
Cohesion: 0.50
Nodes (3): How to actually download #1–#3, Sources this project deliberately does NOT bulk-download, training_dataset/ — dataset manifest

### Community 166 - "training_dataset/"
Cohesion: 0.50
Nodes (3): Re-running the Kaggle pipeline, Status, training_dataset/

### Community 170 - "[role]/[userId]/page.tsx"
Cohesion: 0.32
Nodes (7): Action, ACTION_LABELS, FIELD_LABELS, formatValue(), REASON_REQUIRED, Role, VerificationReviewPage()

### Community 174 - "Adapter"
Cohesion: 0.50
Nodes (3): Adapter, Any, Protocol

### Community 176 - "use-weather-uv.ts"
Cohesion: 0.50
Nodes (4): GlassTopbar(), Coords, useBrowserCoords(), useWeatherUV()

## Knowledge Gaps
- **835 isolated node(s):** `WorkerSettings`, `skinlytics-backend`, `verification`, `jwks`, `outbox` (+830 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `sidebar.tsx` to `button.tsx`, `cn`, `chart.tsx`, `appearance-settings.tsx`, `le`, `utils.ts`, `signup/page.tsx`, `glass-topbar.tsx`, `dermatologist/dashboard/page.tsx`, `state-card.tsx`, `nav-config.ts`, `routine/page.tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `sonner`, `next-themes`, `get_my_progress_summary`, `tailwind-merge`, `.__call__`, `chart.tsx`, `.__call__`, `next`, `conftest.py`, `@hookform/resolvers`, `class-variance-authority`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `react` connect `chart.tsx` to `le`, `dependencies`, `cn`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `WorkerSettings`, `skinlytics-backend`, `verification` to the rest of the system?**
  _835 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `get_db` be split into smaller, more focused modules?**
  _Cohesion score 0.055270920664493094 - nodes in this community are weakly interconnected._
- **Should `require_user` be split into smaller, more focused modules?**
  _Cohesion score 0.11980676328502415 - nodes in this community are weakly interconnected._
- **Should `ingredients/service.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07365967365967366 - nodes in this community are weakly interconnected._