# Graph Report - AI-Skin-Intelligence-Personalized-Skincare-Planner-  (2026-07-23)

## Corpus Check
- 419 files · ~759,108 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3247 nodes · 7627 edges · 185 communities (159 shown, 26 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 203 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `100557f3`
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
- [routineId]/page.tsx
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
- security.py
- .__call__
- .__call__
- 44cfa8e6d5d4_products_routines_scoring.py
- a9c3d2f81b47_seed_reference_data.py
- proxy.ts
- test_404_uses_error_envelope
- system-reports/page.tsx
- next.config.ts
- test_suitability.py
- @hookform/resolvers
- products.py
- fetch_uv_index
- class-variance-authority
- test_ingredients_router.py
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
- test_products_router.py
- dermatologist-onboarding/review/page.tsx
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
- .__call__
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
- get_my_recommendations
- get_redis
- No Base UI counterpart
- ingest_knowledge.py
- (new) Fieldset.Root and Fieldset.Legend
- training_dataset/ — dataset manifest
- training_dataset/
- backend/README.md
- overlays.md
- test_analytics_router.py
- [role]/[userId]/page.tsx
- next
- Adapter
- cmdk
- test_instrumentation_router.py
- README.md
- test_instrumentation_router.py
- web/README.md
- skin-lesion-screener-0.1.0
- test_users.py
- skinlytics-ml

## God Nodes (most connected - your core abstractions)
1. `cn()` - 206 edges
2. `get_db()` - 78 edges
3. `require_role()` - 75 edges
4. `create_profile()` - 71 edges
5. `get_mongo_db()` - 70 edges
6. `SkinProfileCreate` - 65 edges
7. `require_user()` - 57 edges
8. `Button()` - 53 edges
9. `get_or_generate_routines()` - 47 edges
10. `Base` - 43 edges

## Surprising Connections (you probably didn't know these)
- `SuitabilityCase` --uses--> `RealIngredientSuitability`  [INFERRED]
  ml/eval/suitability_eval.py → backend/app/ai/suitability.py
- `SuitabilityEvalReport` --uses--> `RealIngredientSuitability`  [INFERRED]
  ml/eval/suitability_eval.py → backend/app/ai/suitability.py
- `_build_suitability_golden_set()` --indirect_call--> `Ingredient`  [INFERRED]
  ml/eval/run.py → backend/app/services/ingredients/models.py
- `run_suitability_eval()` --calls--> `RealIngredientSuitability`  [EXTRACTED]
  ml/eval/suitability_eval.py → backend/app/ai/suitability.py
- `RealTextEmbedder` --uses--> `TextEmbedder`  [INFERRED]
  backend/app/ai/embedder.py → backend/app/ai/schemas.py

## Import Cycles
- 3-file cycle: `backend/app/services/routines/service.py -> backend/app/services/scores/service.py -> backend/app/services/scores/scoring_engine.py -> backend/app/services/routines/service.py`

## Communities (185 total, 26 thin omitted)

### Community 0 - "get_db"
Cohesion: 0.07
Nodes (89): require_role(), get_db(), AsyncSession, approve_verification(), assign_consultant_client(), create_audit_log(), deactivate_professional(), get_audit_logs() (+81 more)

### Community 1 - "require_user"
Cohesion: 0.22
Nodes (23): delete_own_document(), get_own_profile(), list_own_documents(), AsyncSession, VerificationDocument, Insert (first-ever onboarding submission) or resubmit (after rejected/     more, Edits fields without ever touching verification_status — reachable at any     s, submit_profile() (+15 more)

### Community 2 - "ingredients/service.py"
Cohesion: 0.17
Nodes (32): Ingredient, get_ingredient(), get_interactions(), get_my_suitability(), list_ingredients(), Any, _ANY_SIGNED_IN, AsyncSession (+24 more)

### Community 3 - "button.tsx"
Cohesion: 0.06
Nodes (53): AdminDashboardPage(), AuditLogEntry, DashboardStatsResponse, formatAction(), ASSIGNABLE_ROLES, BetterAuthUser, ListUsersResponse, Role (+45 more)

### Community 4 - "call_with_resilience"
Cohesion: 0.07
Nodes (43): Adapter, AdapterError, call_with_resilience(), CircuitBreaker, Any, Exception, Protocol, Raised once an adapter's resilience policy (retries + circuit breaker) is     e (+35 more)

### Community 5 - "test_clinical_review_service.py"
Cohesion: 0.10
Nodes (53): ConsultantClient, ConsultantNote, One row per professional-client assignment. `status` gates whether the     prof, add_client_note(), get_client(), get_client_notes(), get_my_clients(), Any (+45 more)

### Community 6 - "test_admin_service.py"
Cohesion: 0.10
Nodes (53): Polymorphic across ConsultantProfile/DermatologistProfile via `owner_user_id`,, VerificationDocument, apply_verification_action(), assign_client(), create_document(), delete_document(), get_document_view_url(), _get_for_model() (+45 more)

### Community 7 - "cn"
Cohesion: 0.05
Nodes (61): Receive, Scope, Send, get_latency_stats(), LatencyStats, _percentile(), NamedTuple, Best-effort — a Redis outage degrades this rolling metric, it must never     ta (+53 more)

### Community 8 - "Base"
Cohesion: 0.10
Nodes (40): ProductIngredient, evaluate_products_suitability(), get_products_by_ids(), get_recommendations(), list_all_products(), list_avoided_ingredient_product_ids(), list_concern_ids_for_products(), list_products_for_skin_type() (+32 more)

### Community 9 - "lib/auth.ts"
Cohesion: 0.06
Nodes (39): ADR-0002, ADR-0011, ADR-0015, errorResponse(), POST(), errorResponse(), GET(), ROLES (+31 more)

### Community 10 - "appearance-settings.tsx"
Cohesion: 0.07
Nodes (34): PANELS, ADR-0007, ADR-0014, geist, inter, metadata, sora, AppearanceSync() (+26 more)

### Community 11 - "get_elasticsearch"
Cohesion: 0.11
Nodes (35): AsyncElasticsearch, get_elasticsearch(), is_elasticsearch_available(), Lazy client — nothing connects until the first real call. Only     app/worker/, Absent-safe health check — callers fall back to a documented degraded path, ProductConcern, build_article_document(), build_ingredient_document() (+27 more)

### Community 12 - "test_dermatologist_profile_service.py"
Cohesion: 0.11
Nodes (33): append_outbox(), Outbox, Any, AsyncSession, _IngredientSeed, main(), _ProductSeed, TypedDict (+25 more)

### Community 13 - "sidebar.tsx"
Cohesion: 0.04
Nodes (87): react, InsightsPage(), AppSidebar(), AppSidebarProps, AvatarBadge(), AvatarGroupCount(), Breadcrumb(), BreadcrumbEllipsis() (+79 more)

### Community 14 - "test_routines_service.py"
Cohesion: 0.14
Nodes (51): _am_pm_categories_for_skin_type(), get_or_generate_routines(), ProductRead, Deterministic, `hash(user_id)`-seeded routine generation (ADR-007 spirit) — no, search_products_for_edit(), toggle_step_completion(), Taxonomy/reference table — seeded, rarely written after (Normal/Dry/Oily/     C, SkinType (+43 more)

### Community 15 - "recommendations/page.tsx"
Cohesion: 0.04
Nodes (48): Arrow / Item / Group / Label / CheckboxItem / RadioGroup / RadioItem / ItemIndicator / Separator / Sub / SubTrigger / SubContent, Arrow → Menu.Arrow, Base UI only, data attributes, CSS variables, Base UI only props worth knowing (Menu), Base UI only props worth knowing (NavigationMenu), CheckboxItem → Menu.CheckboxItem, Content → ContextMenu.Portal > Positioner > Popup, Content → Menu.Portal > Menu.Positioner > Menu.Popup (+40 more)

### Community 16 - "test_scores_service.py"
Cohesion: 0.07
Nodes (61): ScoringWeights, SkinScore, BaseModel, ScoreRead, ScoreWeightsRead, calculate_skin_health_score(), _hydration_score(), _lifestyle_score() (+53 more)

### Community 17 - "skinlytics_postgresql_schema_v3.sql"
Cohesion: 0.11
Nodes (37): account, audit_logs, consultant_clients, consultant_notes, consultant_profiles, dermatologist_profiles, ingredient_concern_treats, ingredient_skintype_avoid (+29 more)

### Community 18 - "utils.ts"
Cohesion: 0.05
Nodes (52): ALLERGY_OPTIONS, AssessmentLifestylePage(), firstOf(), SLEEP_QUALITY_ITEMS, SLEEP_QUALITY_OPTIONS, STRESS_LABELS, SUN_EXPOSURE_OPTIONS, CATEGORIES (+44 more)

### Community 19 - "signup/page.tsx"
Cohesion: 0.10
Nodes (21): LoginForm(), safeRedirectTarget(), ROLE_CARDS, SignupPage(), STRENGTH_COLORS, AuthSplitLayout(), GoogleIcon(), FieldDescription() (+13 more)

### Community 20 - "glass-topbar.tsx"
Cohesion: 0.09
Nodes (22): CATEGORIES, VERDICT_LABEL, VERDICT_STYLE, firstOf(), RecommendationRead, RecommendationsPage(), SORT_ITEMS, SORT_KEY_BY_LABEL (+14 more)

### Community 21 - "test_skin_profile_service.py"
Cohesion: 0.09
Nodes (43): _pearson(), EnvironmentalExposure, LifestyleLogCreate, BaseModel, SkinConcernRead, SkinProfileConcernInput, SkinProfileConcernRead, SkinProfileRead (+35 more)

### Community 22 - "postgres.py"
Cohesion: 0.08
Nodes (32): get_settings(), Env vars documented in /.env.example — read from there, not invented here., Settings, Validate, never authenticate — Better Auth is the auth authority (ADR-002/003)., Base, Shared declarative base. Each service owns its own tables (ADR-005) — a service, do_run_migrations(), include_object() (+24 more)

### Community 23 - "append_outbox"
Cohesion: 0.10
Nodes (26): AsyncIOMotorClient, AsyncIOMotorDatabase, get_mongo_client(), get_mongo_db(), Any, Collections per database_schemas/skinlytics_mongodb_schema_v3.txt — created, _get_budget_preference(), Mongo `user_preferences` (schema #4) — a real documented collection with no (+18 more)

### Community 24 - "vector.py"
Cohesion: 0.10
Nodes (47): clear(), count(), _dir(), _faiss_id(), get_metadata(), get_vector(), _index_path(), _load_index() (+39 more)

### Community 25 - "results/page.tsx"
Cohesion: 0.04
Nodes (46): accordion, Accordion.Content → Accordion.Panel, Accordion.Header → Accordion.Header, Accordion.Item → Accordion.Item, Accordion.Root → Accordion.Root, Accordion.Trigger → Accordion.Trigger, Base UI only props worth knowing, Base UI only props worth knowing (+38 more)

### Community 26 - "get_mongo_db"
Cohesion: 0.57
Nodes (6): _as(), AsyncClient, app/services/recommendations/router.py's POST /recommendations/feedback (M3-D) —, test_feedback_accepts_an_optional_recommendation_id(), test_feedback_rejects_an_unknown_action(), test_feedback_round_trips_into_mongo()

### Community 27 - "embeddings.py"
Cohesion: 0.17
Nodes (10): IngredientSuitability, ProgressTrendAnalyzer, date, Protocol, Rule-based, not ML (M3-B) — the zero-missed-allergy hard requirement     (AI_ML, Every field here is a real, computed claim, same discipline as     `Suitability, Deterministic linear-trend + moving-average, not ML (M3-E) — same "no stub/, The stage-4 rank step (milestone_3.md §2/§8). Deliberately no stub/real     `AI (+2 more)

### Community 28 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 29 - "nav-config.ts"
Cohesion: 0.07
Nodes (31): AssessmentBasicsPage(), GOALS, AssessmentConcernsPage(), AssessmentResultsPage(), ScoreRead, useSubmitAssessment(), AssessmentSkinTypePage(), REQUIREMENTS (+23 more)

### Community 30 - "routine/page.tsx"
Cohesion: 0.07
Nodes (31): ADR-0005, LatencyStatsRead, CheckInPage(), firstOf(), HydrationRestForm(), HydrationRestFormProps, todayIso(), CORE_TABS (+23 more)

### Community 31 - "routines/service.py"
Cohesion: 0.14
Nodes (36): Deterministic RNG for M1 AI stubs (ADR-007: 'deterministic, hash(user_id)-seeded, seeded_random(), Routine, RoutineProduct, RoutineStep, add_step(), _assert_product_is_safe(), count_completed_steps_by_user() (+28 more)

### Community 32 - "storage.py"
Cohesion: 0.13
Nodes (33): build_key(), _client_kwargs(), delete(), FileValidationError, get_presigned_url(), Exception, S3-compatible object storage adapter (docs/ARCHITECTURE.md §7, database_schemas/, `{prefix}/user_{id}/{uuid}_{filename}` — matches the infra doc's     `{entity_t (+25 more)

### Community 33 - "test_consultant_profile_service.py"
Cohesion: 0.11
Nodes (45): AuditLog, General-purpose system audit log — Admin's "Audit Logs"/"Activity Logs"     scr, delete_my_document(), get_my_profile(), list_my_documents(), Any, AsyncSession, Depends (+37 more)

### Community 34 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, mongodb, @playwright/test, prettier, prettier-plugin-tailwindcss, tailwindcss, @tailwindcss/postcss (+19 more)

### Community 35 - "test_products_ingest.py"
Cohesion: 0.11
Nodes (36): download_dataset(), KaggleCredentialsError, load_into_database(), main(), normalize_rows(), _parse_ingredients(), _parse_size_ml(), Any (+28 more)

### Community 36 - "(user)/dashboard/page.tsx"
Cohesion: 0.08
Nodes (62): compare_products(), get_alternatives(), get_product(), list_products(), _parse_ids(), Any, _ANY_SIGNED_IN, AsyncSession (+54 more)

### Community 37 - "dermatologist-onboarding/onboarding-shell.tsx"
Cohesion: 0.12
Nodes (41): database_schemas/skinlytics_postgresql_schema_v3.sql — extends the Better Auth, database_schemas/skinlytics_postgresql_schema_v3.sql's "APPEARANCE PREFERENCES", UserAppearancePreference, UserProfile, get_me(), get_my_appearance(), get_my_profile(), Any (+33 more)

### Community 38 - "test_suitability.py"
Cohesion: 0.04
Nodes (44): Base UI only props worth knowing (checkbox), Base UI only props worth knowing (radio-group), Base UI only props worth knowing (select), Base UI only props worth knowing (slider), Base UI only props worth knowing (switch), checkbox, Checkbox.Indicator → Checkbox.Indicator, Checkbox.Root → Checkbox.Root (+36 more)

### Community 39 - "dependencies"
Cohesion: 0.08
Nodes (25): @base-ui/react, better-auth, class-variance-authority, clsx, ioredis, lucide-react, pg, react-dom (+17 more)

### Community 40 - "helpers.ts"
Cohesion: 0.25
Nodes (13): ADR-0012, signInAsAdmin(), signIn(), signUpAndLand(), signIn(), clearRateLimits(), deleteMongoLogsForUser(), deleteTestUser() (+5 more)

### Community 41 - "chart.tsx"
Cohesion: 0.18
Nodes (12): SkinScoreTrendChartProps, ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload() (+4 more)

### Community 42 - "app/page.tsx"
Cohesion: 0.11
Nodes (15): FEATURES, FeaturesGrid(), FinalCtaSection(), HeroSection(), HowItWorksSection(), STEPS, FOOTER_COLUMNS, LandingFooter() (+7 more)

### Community 43 - "consultant_profile/router.py"
Cohesion: 0.21
Nodes (17): list_all_ingredients(), First real function this service ever had (models.py's own docstring). A     na, _create_profile(), _create_test_user(), AsyncSession, Branch 6 (feature/admin-panel) — `list_all_ingredients` (Admin's read-only Ingr, test_get_ingredient_detail_includes_real_treats_and_avoid_data(), test_get_ingredient_detail_returns_none_for_a_missing_id() (+9 more)

### Community 44 - "assessment/context.tsx"
Cohesion: 0.09
Nodes (23): AssessmentConcernPriority, AssessmentContext, AssessmentContextValue, AssessmentProvider(), AssessmentSensitivities, AssessmentSnapshot, AssessmentState, commit() (+15 more)

### Community 45 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 46 - "scores/service.py"
Cohesion: 0.18
Nodes (23): _decode(), _jwk_client(), Any, require_user(), Any, AsyncClient, RBAC — `require_role`/`require_verified_professional` unit coverage plus a repr, test_admin_only_routes_reject_non_admin_roles() (+15 more)

### Community 47 - "consultant-onboarding/onboarding-shell.tsx"
Cohesion: 0.20
Nodes (10): scripts, build, dev, format, format:check, lint, start, test (+2 more)

### Community 48 - "app/main.py"
Cohesion: 0.11
Nodes (22): error_envelope(), FastAPI, Request, One error envelope everywhere (docs/CONVENTIONS.md): { "error": { "code", "mess, register_exception_handlers(), configure_logging(), get_request_id(), ASGIApp (+14 more)

### Community 49 - "_routine_adherence_score"
Cohesion: 0.07
Nodes (27): 10. Theming implementation (shadcn mapping), 11. Accessibility floor, 12. Do / Don't, 1. Brand & style, 2. Color system, 2a. Alternate palettes (Theme system, Phase 3), 3. Glassmorphism — the elevation crown, 4. Typography — tri-font strategy (+19 more)

### Community 50 - "field.tsx"
Cohesion: 0.09
Nodes (57): ProgressImage, `image_url` is the DDL's literal column name, but stores the S3-compatible, get_my_progress_logs(), get_my_progress_photos(), get_my_progress_summary(), Any, AsyncSession, Depends (+49 more)

### Community 51 - "consultant-onboarding/context.tsx"
Cohesion: 0.19
Nodes (12): commit(), ConsultantOnboardingProvider(), ConsultantOnboardingState, ContextValue, DEFAULT_STATE, getClientSnapshot(), listeners, OnboardingContext (+4 more)

### Community 52 - "dermatologist-onboarding/context.tsx"
Cohesion: 0.19
Nodes (12): commit(), ContextValue, DEFAULT_STATE, DermatologistOnboardingProvider(), DermatologistOnboardingState, getClientSnapshot(), listeners, OnboardingContext (+4 more)

### Community 53 - "rate_limit.py"
Cohesion: 0.17
Nodes (13): build_splits(), class_counts(), Real, downloaded ISIC 2019 images only (training_dataset/raw/isic-2019/, traini, Stratified-by-construction only in expectation (a plain random split, not a, Reads `ImageFolder.targets` directly (no image decode) — counting via     `subs, _build_model(), _git_commit(), main() (+5 more)

### Community 54 - "skin_profile/service.py"
Cohesion: 0.08
Nodes (25): 10. Risks, 11. Definition of Done — Milestone 3, 1. Overview, 2. Architecture, 3. Deliverables — modules, 4. Folder structure (where new code belongs — no duplicates, no new layouts), 5. Database changes, 6. APIs (+17 more)

### Community 55 - "consultant/dashboard/page.tsx"
Cohesion: 0.08
Nodes (24): accordion, asChild -> render, breadcrumb / marker (Slot users), Coverage matrix, CSS custom properties, Data attributes / class hooks, dialog / alert-dialog / sheet, Doc-validation TODOs (before specs are final) (+16 more)

### Community 56 - "dermatologist/dashboard/page.tsx"
Cohesion: 0.14
Nodes (18): ConsultantBackgroundPage(), ConsultantContactPage(), ConsultantPracticePage(), ConsultantReviewPage(), FIELD_LABELS, formatValue(), SUMMARY_SECTIONS, OnboardingShell() (+10 more)

### Community 57 - "[routineId]/page.tsx"
Cohesion: 0.24
Nodes (11): get_interaction(), Interaction, TypedDict, Curated pairwise ingredient interaction rules (M3-B, PDF Module 5 "interaction, None means "no curated interaction documented" — never a fabricated verdict, app/ai/interactions.py — curated pairwise ingredient interaction rules (M3-B)., test_known_conflicting_pair_returns_avoid_verdict(), test_known_synergistic_pair_returns_synergy_verdict() (+3 more)

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
Cohesion: 0.08
Nodes (40): AppShell(), AppShellProps, GlassTopbar(), GlassTopbarProps, NavUser(), NavUserProps, LandingNavbar(), NAV_LINKS (+32 more)

### Community 63 - "consultant-onboarding.ts"
Cohesion: 0.20
Nodes (12): get_embedder(), _normalize(), Deterministic, hash-seeded — same ADR-007 spirit as every other stub in this, StubTextEmbedder, One embedding model per namespace, pinned (mixing versions corrupts     similar, TextEmbedder, app/ai/embedder.py — TextEmbedder (ADR-007, config-selected AI_IMPL_EMBEDDER)., test_get_embedder_returns_stub_by_default() (+4 more)

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

### Community 71 - "security.py"
Cohesion: 0.16
Nodes (18): DermatologistBackgroundPage(), DermatologistContactPage(), REQUIREMENTS, DermatologistPracticePage(), OnboardingShell(), OnboardingShellProps, STEPS, Field() (+10 more)

### Community 77 - "proxy.ts"
Cohesion: 0.67
Nodes (3): config, proxy(), PUBLIC_PATHS

### Community 91 - "test_suitability.py"
Cohesion: 0.18
Nodes (9): COMING_SOON, ConsultantProfile, DOCUMENT_TYPES, DocumentType, ProfileSummaryCard(), STATUS_COPY, TONE_CLASSES, VerificationDocument (+1 more)

### Community 93 - "products.py"
Cohesion: 0.13
Nodes (14): 10. Core data flow — recommendation pipeline (M2+), 11. Frontend architecture, 12. Repository layout, 13. Milestone roadmap (8 weeks) with exit criteria, 1. Objective, audience & non-functional targets, 2. Roles, 3. High-level architecture (matches the system diagram), 4. Microservices (14) (+6 more)

### Community 94 - "fetch_uv_index"
Cohesion: 0.47
Nodes (9): _as(), AsyncClient, app/services/ingredients/router.py (M3-B) — HTTP-layer contract: interactions a, test_get_ingredient_404s_for_a_missing_id(), test_interactions_accepts_a_valid_id_range(), test_interactions_rejects_a_single_id(), test_interactions_rejects_more_than_five_ids(), test_interactions_rejects_non_integer_ids() (+1 more)

### Community 95 - "class-variance-authority"
Cohesion: 0.18
Nodes (9): COMING_SOON, DermatologistProfile, DOCUMENT_TYPES, DocumentType, ProfileSummaryCard(), STATUS_COPY, TONE_CLASSES, VerificationDocument (+1 more)

### Community 96 - "test_ingredients_router.py"
Cohesion: 0.47
Nodes (9): _as(), AsyncClient, app/services/recommendations/products_router.py (M3-C) — HTTP-layer contract: c, test_alternatives_returns_200_with_an_empty_list_for_a_missing_product(), test_compare_404s_when_any_id_is_missing(), test_compare_accepts_a_valid_pair(), test_compare_rejects_a_single_id(), test_compare_rejects_more_than_three_ids() (+1 more)

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

### Community 122 - "test_products_router.py"
Cohesion: 0.29
Nodes (11): _evaluate(), app/ai/suitability.py — RealIngredientSuitability (M3-B). Rule-based, not ML: th, Allergy is the hard requirement — it must never be shadowed by a lower-priority, test_allergy_check_wins_over_an_avoid_flag(), test_allergy_exact_match_has_the_documented_confidence(), test_allergy_hit_is_never_missed(), test_allergy_substring_match_has_the_documented_confidence(), test_avoid_flag_when_a_curated_avoid_record_exists() (+3 more)

### Community 123 - "dermatologist-onboarding/review/page.tsx"
Cohesion: 0.50
Nodes (7): _as(), AsyncClient, app/services/progress/router.py (M3-E) — HTTP-layer contract: multipart photo u, _real_jpeg_bytes(), test_progress_log_round_trips_and_is_idempotent_per_week(), test_uploading_a_non_image_is_rejected(), test_uploading_a_progress_photo_round_trips_into_the_photos_list()

### Community 124 - "state-card.tsx"
Cohesion: 0.29
Nodes (11): Pure scoring logic for the IngredientSuitability model card (docs/AI_ML.md's "p, One golden-set row. `expected_allergy_flag` is never a human label here —     i, run_suitability_eval(), SuitabilityCase, SuitabilityEvalReport, M3-H's own testing requirement: "eval-runner unit test on a tiny fixture set.", Retin" is a substring of "Retinol" — app/ai/suitability.py's own documented, test_a_clean_profile_never_flags_an_allergy() (+3 more)

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
Cohesion: 0.10
Nodes (19): get_redis(), Key patterns per database_schemas/skinlytics_infrastructure_layer_v2.txt —, invalidate_recommendation_cache_for_catalog_change(), AI_ML.md's recommendation pipeline: cache "INVALIDATED on any profile/     pref, client(), db_session(), AsyncClient, AsyncSession (+11 more)

### Community 133 - "get_my_progress_summary"
Cohesion: 0.26
Nodes (9): firstOf(), ProgressPage(), RANGES, SkinScoreTrendChart, ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle() (+1 more)

### Community 134 - "weather/service.py"
Cohesion: 0.16
Nodes (12): DermatologistReviewPage(), FIELD_LABELS, formatValue(), SUMMARY_SECTIONS, dermatologistBackgroundSchema, DermatologistBackgroundValues, dermatologistContactSchema, DermatologistContactValues (+4 more)

### Community 135 - ".__call__"
Cohesion: 0.27
Nodes (8): ingest_for_concern(), main(), Real PubMed ingestion — `make ingest-knowledge` / `python -m app.db.ingest_knowl, _extract_article(), PubMedArticle, esearch for PMIDs matching `query`, then efetch the full records. Returns [], search_and_fetch(), Element

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
Cohesion: 0.67
Nodes (3): AsyncClient, test_me_requires_auth(), test_me_returns_validated_claims()

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
Cohesion: 0.40
Nodes (5): Base UI only props worth knowing, CSS variables, Data attributes, separator, Separator.Root → Separator

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
Cohesion: 0.27
Nodes (6): SentenceTransformers-backed, lazy-loaded (no model load at import time — only, RealTextEmbedder, Real SentenceTransformers-backed TextEmbedder — separate from test_embedder.py, The actual point of a real embedder over the stub: genuine semantic     similar, test_real_embedder_produces_unit_normalized_384d_vectors(), test_real_embedder_ranks_semantically_similar_text_closer()

### Community 157 - "Consumer-side prop changes (call sites, not wrappers)"
Cohesion: 0.33
Nodes (5): Callback signature rule, Consumer-side prop changes (call sites, not wrappers), Per component, Sweep procedure, Universal

### Community 158 - "Progress.Indicator → Progress.Indicator"
Cohesion: 0.33
Nodes (6): Base UI only props worth knowing, CSS variables, Data attributes, progress, Progress.Indicator → Progress.Indicator, Progress.Root → Progress.Root

### Community 159 - "dermatologist/dashboard/page.tsx"
Cohesion: 0.21
Nodes (14): ContentBasedRecommender, The stage-4 rank step (milestone_3.md §2/§8) — see app/ai/schemas.py's     `Rec, Stage-4 rank inputs (milestone_3.md §8) — every field pre-normalized to     [0,, RecommendationFeatures, NamedTuple, Bulk sibling of products_service.py's get_product_detail per-ingredient     eva, SuitabilityAggregate, app/ai/recommender.py — the stage-4 rank formula (milestone_3.md §8): match = 0 (+6 more)

### Community 160 - "get_my_recommendations"
Cohesion: 0.20
Nodes (20): delete_my_document(), get_my_profile(), list_my_documents(), Any, AsyncSession, Depends, DocumentType, File (+12 more)

### Community 161 - "get_redis"
Cohesion: 0.22
Nodes (6): ASGIApp, Receive, Scope, Send, Production-readiness audit finding: the browser calls this API directly (`NEXT_, SecurityHeadersMiddleware

### Community 162 - "No Base UI counterpart"
Cohesion: 0.29
Nodes (6): AccessibleIcon (radix `AccessibleIcon.Root`: `label` required), AspectRatio (radix `AspectRatio.Root`: `asChild`, `ratio` default `1`), Label (radix `Label.Root`: `asChild`, `htmlFor`), No Base UI counterpart, Radix UI → Base UI props mapping: progress, scroll-area, separator, avatar, toast, form, VisuallyHidden (radix `VisuallyHidden.Root`: `asChild`)

### Community 163 - "ingest_knowledge.py"
Cohesion: 0.25
Nodes (12): date, Deterministic linear-trend (ordinary least squares) over the series' values, RealProgressTrendAnalyzer, _dates(), date, app/ai/trend.py — deterministic linear-trend + moving-average insight (mileston, test_a_clean_downward_line_is_declining(), test_a_clean_upward_line_is_improving_with_high_confidence() (+4 more)

### Community 164 - "(new) Fieldset.Root and Fieldset.Legend"
Cohesion: 0.50
Nodes (4): Base UI only props worth knowing (form-wide), CSS variables, Data attributes, (new) Fieldset.Root and Fieldset.Legend

### Community 165 - "training_dataset/ — dataset manifest"
Cohesion: 0.50
Nodes (3): How to actually download #1–#3, Sources this project deliberately does NOT bulk-download, training_dataset/ — dataset manifest

### Community 166 - "training_dataset/"
Cohesion: 0.50
Nodes (3): Re-running the Kaggle pipeline, Status, training_dataset/

### Community 169 - "test_analytics_router.py"
Cohesion: 0.60
Nodes (5): _as(), AsyncClient, app/services/analytics/router.py (M3-F) — HTTP-layer contract: real requests re, test_get_admin_analytics_returns_the_documented_shape(), test_get_my_analytics_returns_the_documented_shape()

### Community 170 - "[role]/[userId]/page.tsx"
Cohesion: 0.43
Nodes (7): Gates *operational* consultant/dermatologist endpoints (M2+) on the matching, require_verified_professional(), AsyncSession, test_require_verified_professional_allows_approved_consultant(), test_require_verified_professional_rejects_missing_profile(), test_require_verified_professional_rejects_unapproved_status(), test_require_verified_professional_rejects_wrong_role()

### Community 171 - "next"
Cohesion: 0.33
Nodes (5): Fairness gap — real, not silently worked around, Not medical advice, skin-lesion-screener-0.1.0, What this is — and isn't, Why it isn't wired into the backend yet

### Community 172 - "Adapter"
Cohesion: 0.31
Nodes (7): BaseModel, Every field here is a real, auditable claim — never a probability that just, SuitabilityResult, (exact, substring) — free_text is a comma-separated list of user-entered     ta, Rule-based, not ML — see app/ai/schemas.py's IngredientSuitability Protocol, RealIngredientSuitability, _tag_match()

### Community 174 - "test_instrumentation_router.py"
Cohesion: 0.57
Nodes (6): _as(), AsyncClient, app/services/instrumentation/router.py (M3-G) — the dashboard-TTI reporting end, test_report_dashboard_tti_accepts_any_signed_in_role(), test_report_dashboard_tti_rejects_a_nonsensical_negative_duration(), test_report_dashboard_tti_round_trips_into_the_latency_store()

### Community 176 - "test_instrumentation_router.py"
Cohesion: 0.50
Nodes (3): Running things directly, Skinlytics — `ml/`, Two different dependency stories, on purpose

## Knowledge Gaps
- **845 isolated node(s):** `WorkerSettings`, `skinlytics-backend`, `verification`, `jwks`, `outbox` (+840 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `sidebar.tsx` to `button.tsx`, `get_my_progress_summary`, `security.py`, `chart.tsx`, `appearance-settings.tsx`, `utils.ts`, `signup/page.tsx`, `glass-topbar.tsx`, `product-recommendation-card.tsx`, `dermatologist/dashboard/page.tsx`, `nav-config.ts`, `routine/page.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `get_db()` connect `get_db` to `get_my_recommendations`, `test_consultant_profile_service.py`, `ingredients/service.py`, `(user)/dashboard/page.tsx`, `test_clinical_review_service.py`, `dermatologist-onboarding/onboarding-shell.tsx`, `cn`, `test_scores_service.py`, `field.tsx`, `postgres.py`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `get_redis()` connect `get_db` to `call_with_resilience`, `cn`, `Base`, `test_dermatologist_profile_service.py`, `scores/service.py`, `test_routines_service.py`, `app/main.py`, `test_instrumentation_router.py`, `postgres.py`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `WorkerSettings`, `skinlytics-backend`, `verification` to the rest of the system?**
  _845 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `get_db` be split into smaller, more focused modules?**
  _Cohesion score 0.07137954701441318 - nodes in this community are weakly interconnected._
- **Should `button.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057195149851292613 - nodes in this community are weakly interconnected._
- **Should `call_with_resilience` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._