import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

// Roles/permissions defined once — database_schemas/skinlytics_identity_betterauth.md,
// ARCHITECTURE.md §6. This governs the Better Auth admin plugin's own user-management
// actions (ban/set-role/impersonate/etc.) — it is NOT where domain RBAC (e.g. "can this
// consultant see this client's profile") lives. Domain authorization is enforced
// backend-side via ownership checks in each service's deps.py (CONVENTIONS.md), keyed off
// the role claim FastAPI reads from the JWT. A fine-grained per-resource permission
// matrix is the dedicated RBAC milestone task, not this one — this file only declares
// the four roles and gives `admin` the platform-management permissions Better Auth's
// admin plugin already ships by default.
const statement = { ...defaultStatements } as const;

export const accessControl = createAccessControl(statement);

export const userRole = accessControl.newRole({
  user: [],
  session: [],
});

export const consultantRole = accessControl.newRole({
  user: [],
  session: [],
});

export const dermatologistRole = accessControl.newRole({
  user: [],
  session: [],
});

export const adminRole = accessControl.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});
