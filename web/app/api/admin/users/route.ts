import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Read-only passthrough to Better Auth's admin-plugin `list-users` action (Branch 6)
// — no audit log needed (a read isn't a mutation), but still routed through this
// server-side wrapper rather than calling `authClient.admin.listUsers()` directly
// from the browser, matching every other /api/admin/* route's shape.
//
// `role` (bugs_report.md 2026-07-26, bug #5) — optional, comma-separated
// (e.g. "consultant,dermatologist") — reuses Better Auth's own filterField/
// filterValue/filterOperator ("in" for multiple roles, "eq" for one), so the
// admin "Assign client" dialog (web/components/admin/assign-client-dialog.tsx)
// can search professionals and clients separately without a new backend endpoint.
export async function GET(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || session.user.role !== "admin") {
    return errorResponse(403, "forbidden", "Admin role required");
  }

  const { searchParams } = new URL(request.url);
  const searchValue = searchParams.get("search") ?? undefined;
  const roleParam = searchParams.get("role");
  const roles = roleParam ? roleParam.split(",").filter(Boolean) : [];
  const limit = searchParams.get("limit") ?? "20";
  const offset = searchParams.get("offset") ?? "0";

  const result = await auth.api.listUsers({
    query: {
      searchValue,
      searchField: searchValue ? "email" : undefined,
      searchOperator: searchValue ? "contains" : undefined,
      filterField: roles.length > 0 ? "role" : undefined,
      filterValue: roles.length > 0 ? (roles.length === 1 ? roles[0] : roles) : undefined,
      filterOperator: roles.length > 0 ? (roles.length === 1 ? "eq" : "in") : undefined,
      limit,
      offset,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    headers: requestHeaders,
  });

  return NextResponse.json(result);
}
