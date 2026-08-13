# RBAC Permission Matrix

The single source of truth is `backend/app/permissions.py`. Every protected endpoint declares one permission via the `require("<permission>")` dependency; a request succeeds only when the caller's role holds it. **The administrator implicitly holds every permission and cannot be restricted.** The frontend mirrors this matrix in its navigation and protected routes, so pages a role does not own are never rendered — but the API check is the real boundary.

Legend: ✅ allowed · — denied. `User` = Patient.

## Account & profile

| Permission | User | Dermatologist | Consultant | Admin |
|---|:-:|:-:|:-:|:-:|
| profile.read_own / update_own | ✅ | ✅ | ✅ | ✅ |
| skin_profile.read_own / update_own | ✅ | — | — | ✅ |
| lifestyle.read_own / create_own | ✅ | — | — | ✅ |
| progress.read_own / create_own | ✅ | — | — | ✅ |
| notifications.read_own / update_own | ✅ | ✅ | ✅ | ✅ |

## Catalogue & directories

| Permission | User | Dermatologist | Consultant | Admin |
|---|:-:|:-:|:-:|:-:|
| products.read / ingredients.read | ✅ | ✅ | ✅ | ✅ |
| dermatologists.read (directory) | ✅ | — | — | ✅ |
| dermatologist_slots.read | ✅ | — | — | ✅ |
| consultants.read (directory) | ✅ | — | — | ✅ |

## Appointments

| Permission | User | Dermatologist | Consultant | Admin |
|---|:-:|:-:|:-:|:-:|
| appointments.create (book) | ✅ | — | — | ✅ |
| appointments.read_own | ✅ | — | — | ✅ |
| appointments.cancel_own / reschedule_own | ✅ | — | — | ✅ |
| appointments.read_incoming | — | ✅ | — | ✅ |
| appointments.manage (accept/reject/complete/notes) | — | ✅ | — | ✅ |
| availability.manage (+ vacation mode) | — | ✅ | — | ✅ |
| derm_profile.update_own | — | ✅ | — | ✅ |
| patients.read_assigned | — | ✅ | — | ✅ |

Ownership checks apply on top of role: a patient can only modify their own appointment, a dermatologist only appointments addressed to them.

## Consultations & routines

| Permission | User | Dermatologist | Consultant | Admin |
|---|:-:|:-:|:-:|:-:|
| consultation_requests.create | ✅ | — | — | ✅ |
| consultation_requests.read_own / cancel_own | ✅ | — | — | ✅ |
| consultation_requests.read_incoming | — | — | ✅ | ✅ |
| consultation_requests.manage (accept/reject/complete) | — | — | ✅ | ✅ |
| routines.read_own | ✅ | — | — | ✅ |
| routines.create (publish to client) | — | — | ✅ | ✅ |
| clients.read_assigned (client skin details) | — | — | ✅ | ✅ |
| consultant_profile.update_own | — | — | ✅ | ✅ |

`clients.read_assigned` is further scoped: a consultant may only read the skin profile of a patient who has a consultation request addressed to them (or an open request).

## Administration (admin only)

| Permission | Action |
|---|---|
| admin.stats | Platform-wide real-time statistics |
| admin.users.read / create / update / delete / suspend | Full user management |
| admin.roles.assign | Change any account's role |
| admin.dermatologists.approve / admin.consultants.approve | Provider verification workflow |
| admin.appointments.read_all / manage | Every appointment on the platform |
| admin.products.create / update / delete | Product catalogue management |
| admin.audit_logs.read | Full audit trail (actor, old/new values, IP, time) |
| admin.notifications.broadcast | Broadcast to everyone or one role |
| admin.settings.manage · admin.export | Reserved for later milestones |

## Adding a permission

1. Add the string to `PERMISSIONS` and the relevant role sets in `permissions.py`.
2. Guard the endpoint: `user: User = Depends(require("my.permission"))`.
3. If it has a page, add it to the role's `NAV` map and a `<Protected roles={[…]}>` route in the frontend.
