# API Specification

Base URL: `http://localhost:8000/api` · Interactive docs: `http://localhost:8000/docs`
Auth: `Authorization: Bearer <JWT>` on every endpoint except register/login/health.
Errors: `{"detail": "message"}` with 400 / 401 / 403 / 404 / 409 status codes.

## Auth
| Method | Path | Role | Body / notes |
|---|---|---|---|
| POST | /auth/register | public | `{email, password (8+), full_name, role: user\|dermatologist\|consultant}` → `{access_token, user}`. Provider accounts start unapproved. |
| POST | /auth/login | public | `{email, password}` → `{access_token, user}`. Suspended accounts get 403. |
| GET | /auth/me | any | Current user. |

## Users (self)
| Method | Path | Role | Notes |
|---|---|---|---|
| GET / PUT | /users/me | any | Update `full_name`, `password`. |
| GET / PUT | /users/me/skin-profile | user | Age, gender, skin type/tone, concerns, allergies, sensitivities, medical history, current products, goals. |
| GET / POST | /users/me/lifestyle | user | POST upserts today (or `log_date`): sleep_hours, water_intake_l, exercise_minutes, stress_level 1–10, environment_exposure, notes. GET returns last 60 days. |

## Dermatologists
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /dermatologists | user | Directory of approved, non-vacation doctors. Filters: `q, location, specialization, language, max_fee, min_experience`. |
| GET | /dermatologists/{user_id} | user | Public profile. |
| GET | /dermatologists/{user_id}/slots?on=YYYY-MM-DD | user | Concrete free slots for a date (weekly windows − booked − past times). |
| GET / PUT | /dermatologists/me/profile | dermatologist | Practice profile self-service. |
| GET / POST | /dermatologists/me/availability | dermatologist | Weekly windows: `{day_of_week 0–6, start_time, end_time, slot_minutes}`. |
| DELETE | /dermatologists/me/availability/{slot_id} | dermatologist | Remove a window. |
| POST | /dermatologists/me/vacation-mode | dermatologist | Toggle; hides doctor from directory and booking. |

## Appointments
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | /appointments | user | `{dermatologist_user_id, appt_date, appt_time, consultation_type, reason}`. 409 if the slot was taken. Notifies the doctor. |
| GET | /appointments/me | user | Patient's history (all statuses). |
| GET | /appointments/incoming | dermatologist | Doctor's queue and schedule. |
| PATCH | /appointments/{id} | owner-scoped | `{action}` — patient: `cancel`, `reschedule` (+ new date/time, re-checks conflicts); dermatologist: `accept`, `reject`, `complete` (+ `doctor_notes`), `add_notes`, `cancel`; admin: all. Each transition notifies the counterpart and is audited. |

## Consultants & routines
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /consultants | user | Approved consultant directory. |
| POST | /consultation-requests | user | `{consultant_user_id? (null = any), request_type, details, preferred_date?, preferred_time?}` — types: one_to_one, routine_planning, lifestyle, product, diet, anti_aging, sensitive_skin. |
| GET | /consultation-requests/me | user | Patient's requests. |
| GET | /consultation-requests/incoming | consultant | Requests addressed to them + open requests. |
| PATCH | /consultation-requests/{id} | scoped | `{action}` — consultant: accept / reject / complete; patient: cancel. |
| GET | /clients/{patient_id}/skin-profile | consultant | Only for patients who requested this consultant. |
| POST | /routines | consultant | `{patient_id, title, morning_steps[], night_steps[], weekly_steps[], lifestyle_advice}` — notifies the client. |
| GET | /routines/me | user | Client's routines. |

## Products & progress
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /products | any | Filters: `q, category, tier, skin_type, max_price`. Each product embeds its ingredients with benefits/cautions. |
| GET | /products/{id} · /ingredients | any | Detail / full ingredient reference. |
| GET / POST | /progress/me | user | Skin score 0–100, hydration 0–100, acne & pigmentation 0–10, notes. |
| GET | /notifications/me | any | Latest 100. |
| PATCH | /notifications/{id}/read | any (own) | Mark read. |

## Admin (administrator only)
| Method | Path | Notes |
|---|---|---|
| GET | /admin/stats | Users by role, appointments by status, requests, products, pending approvals, audit count. |
| GET | /admin/users?role=&q= | List/search. |
| POST | /admin/users | Create verified account with any role. |
| PATCH | /admin/users/{id} | `{full_name?, role?, is_active?, is_verified?}` — suspend, verify, assign role. Self-suspend/self-delete blocked. |
| DELETE | /admin/users/{id} | Hard delete (cascades profiles). |
| POST | /admin/dermatologists/{user_id}/approve?approve=bool | Provider approval; same for `/admin/consultants/...`. |
| GET | /admin/appointments | Every appointment. |
| POST / DELETE | /admin/products, /admin/products/{id} | Catalogue management; `ingredient_names[]` auto-creates missing ingredients. |
| GET | /admin/audit-logs?limit= | Full trail: actor, action, entity, old/new values, IP, status, time. |
| POST | /admin/notifications/broadcast | `{title, body, role?}` — everyone or one role. |

## Health
`GET /health` → `{"status": "ok"}` (unauthenticated, for load balancers).

## Milestone 3 — Product search (Part 3)

`GET /api/products` — fast, paginated catalogue search. All parameters optional:

- **text**: `q` (name / brand / description / key ingredients), `ingredient`
- **filters**: `brand`, `category`, `skin_type`, `concern`, `usage_time`, `tier`,
  `min_price`, `max_price`, `min_rating`
- **sorting**: `sort_by` (name|brand|price|rating|category), `order` (asc|desc)
- **pagination**: `page`, `page_size` (1–100)

Returns `{ items, total, page, page_size, total_pages, facets }`, where `facets`
supplies the distinct brands/categories/skin-types/concerns for filter UIs.
Queries are single-round-trip and backed by column indexes; ingredients are
eager-loaded to avoid N+1 lookups.

`GET /api/ingredients` — the full ingredient knowledge base.
`GET /api/products/{id}` — a single product with its linked ingredients.
