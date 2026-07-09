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
export async function GET(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || session.user.role !== "admin") {
    return errorResponse(403, "forbidden", "Admin role required");
  }

  const { searchParams } = new URL(request.url);
  const searchValue = searchParams.get("search") ?? undefined;
  const limit = searchParams.get("limit") ?? "20";
  const offset = searchParams.get("offset") ?? "0";

  const result = await auth.api.listUsers({
    query: {
      searchValue,
      searchField: searchValue ? "email" : undefined,
      searchOperator: searchValue ? "contains" : undefined,
      limit,
      offset,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    headers: requestHeaders,
  });

  return NextResponse.json(result);
}
