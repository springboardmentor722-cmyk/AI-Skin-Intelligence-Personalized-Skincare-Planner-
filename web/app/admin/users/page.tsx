"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardCheck, Loader2, RotateCw, Search, ShieldBan, ShieldCheck, TriangleAlert } from "lucide-react";

import { AssignClientDialog } from "@/components/admin/assign-client-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";

type Role = "user" | "consultant" | "dermatologist" | "admin";
const ASSIGNABLE_ROLES: Role[] = ["user", "consultant", "dermatologist", "admin"];

interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: string;
}

interface ListUsersResponse {
  users: BetterAuthUser[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  // Prefilled from the topbar command palette (glass-topbar.tsx), which links here
  // with ?search=<query> since there's no per-user detail route to deep-link into.
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(searchParam);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Re-sync when the command palette navigates here from an already-open
  // /admin/users tab (same route, new ?search=) — a same-route client
  // navigation doesn't remount the page, so the useState initializer above
  // only fires once and would otherwise miss the new value.
  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", search, page],
    queryFn: async (): Promise<ListUsersResponse> => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      });
      if (search.trim()) params.set("search", search.trim());
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to load users");
      return response.json();
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const setRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      const response = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!response.ok) throw new Error("Failed to change role");
    },
    onSuccess: () => {
      toast.success("Role updated");
      invalidate();
    },
    onError: () => toast.error("Couldn't update that user's role."),
  });

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("Failed to ban user");
    },
    onSuccess: () => {
      toast.success("User banned");
      invalidate();
    },
    onError: () => toast.error("Couldn't ban that user."),
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch("/api/admin/unban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("Failed to unban user");
    },
    onSuccess: () => {
      toast.success("User unbanned");
      invalidate();
    },
    onError: () => toast.error("Couldn't unban that user."),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-on-surface text-2xl font-bold">Users</h1>
          <p className="text-on-surface-variant mt-1 font-sans text-sm">
            Search, manage roles, and moderate accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <AssignClientDialog />
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href="/admin/users/verification">
                <ClipboardCheck className="size-4" strokeWidth={1.5} />
                Verification queue
              </Link>
            }
          />
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search
          className="text-on-surface-variant absolute top-1/2 left-4 size-4 -translate-y-1/2"
          strokeWidth={1.5}
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by email"
          className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full rounded-full border-none py-2.5 pr-4 pl-11 font-sans text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      {usersQuery.isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : usersQuery.isError || !usersQuery.data ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't load users."
          action={
            <Button variant="outline" onClick={() => usersQuery.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-border text-on-surface-variant border-b font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.users.map((u) => (
                  <tr key={u.id} className="border-border border-b last:border-0">
                    <td className="text-on-surface px-4 py-3 font-sans text-sm">{u.name}</td>
                    <td className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role ?? "user"}
                        onChange={(e) =>
                          setRoleMutation.mutate({ userId: u.id, role: e.target.value as Role })
                        }
                        disabled={setRoleMutation.isPending}
                        className="bg-muted text-on-surface rounded-full border-none px-3 py-1.5 font-sans text-xs focus:ring-2 focus:ring-secondary/40 focus:outline-none"
                      >
                        {ASSIGNABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {u.banned ? (
                        <span className="bg-destructive/10 text-destructive rounded-full px-2.5 py-0.5 font-sans text-xs">
                          Banned
                        </span>
                      ) : (
                        <span className="bg-success/10 text-success rounded-full px-2.5 py-0.5 font-sans text-xs">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.banned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unbanMutation.mutate(u.id)}
                          disabled={unbanMutation.isPending}
                        >
                          {unbanMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="size-3.5" strokeWidth={1.5} />
                          )}
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => banMutation.mutate(u.id)}
                          disabled={banMutation.isPending}
                        >
                          {banMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ShieldBan className="size-3.5" strokeWidth={1.5} />
                          )}
                          Ban
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-border flex items-center justify-between border-t px-4 py-3">
            <p className="text-on-surface-variant font-sans text-xs">
              {usersQuery.data.total} user{usersQuery.data.total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * PAGE_SIZE >= usersQuery.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
