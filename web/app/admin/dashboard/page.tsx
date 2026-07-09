"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ClipboardCheck,
  RotateCw,
  Stethoscope,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";

interface AuditLogEntry {
  audit_log_id: number;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string | null;
}

interface DashboardStatsResponse {
  userCountsByRole: Record<"user" | "consultant" | "dermatologist" | "admin", number>;
  pending_consultant_count: number;
  pending_dermatologist_count: number;
  recent_activity: AuditLogEntry[];
}

function formatAction(action: string): string {
  return action
    .replace(/^verification_/, "")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function AdminDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: async (): Promise<DashboardStatsResponse> => {
      const response = await fetch("/api/admin/dashboard-stats");
      if (!response.ok) throw new Error("Failed to load dashboard stats");
      return response.json();
    },
  });

  if (statsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <StateCard
        tone="destructive"
        icon={TriangleAlert}
        description="Couldn't load dashboard stats."
        action={
          <Button variant="outline" onClick={() => statsQuery.refetch()}>
            <RotateCw className="size-4" strokeWidth={1.5} />
            Retry
          </Button>
        }
      />
    );
  }

  const stats = statsQuery.data;
  const totalPendingVerification =
    stats.pending_consultant_count + stats.pending_dermatologist_count;

  const kpis = [
    {
      icon: UserRound,
      label: "Users",
      value: stats.userCountsByRole.user ?? 0,
    },
    {
      icon: Stethoscope,
      label: "Consultants",
      value: stats.userCountsByRole.consultant ?? 0,
    },
    {
      icon: Users,
      label: "Dermatologists",
      value: stats.userCountsByRole.dermatologist ?? 0,
    },
    {
      icon: ClipboardCheck,
      label: "Pending verification",
      value: totalPendingVerification,
      highlight: totalPendingVerification > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Admin dashboard</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Platform overview — real counts, no placeholders.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="border-border bg-card flex flex-col justify-between rounded-2xl border p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-on-surface-variant font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
                {kpi.label}
              </p>
              <kpi.icon
                className={kpi.highlight ? "text-warning size-5" : "text-secondary/40 size-5"}
                strokeWidth={1.5}
              />
            </div>
            <p className="font-geist text-on-surface mt-4 text-3xl font-bold tabular-nums">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {totalPendingVerification > 0 && (
        <div className="border-border bg-card flex items-center justify-between rounded-2xl border p-4">
          <p className="text-on-surface font-sans text-sm">
            {totalPendingVerification} professional application
            {totalPendingVerification === 1 ? "" : "s"} awaiting review.
          </p>
          <Button size="sm" nativeButton={false} render={<Link href="/admin/users/verification">Review now</Link>} />
        </div>
      )}

      <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-on-surface text-base font-semibold">
            Recent activity
          </h2>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/monitoring">View all</Link>}
          />
        </div>
        {stats.recent_activity.length === 0 ? (
          <p className="text-on-surface-variant font-sans text-sm">No activity yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {stats.recent_activity.map((entry) => (
              <li key={entry.audit_log_id} className="flex items-start gap-3">
                <Activity className="text-secondary mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-on-surface font-sans text-sm">
                    {formatAction(entry.action)}
                    {entry.target_type && entry.target_id
                      ? ` — ${entry.target_type} ${entry.target_id}`
                      : ""}
                  </p>
                  {entry.created_at && (
                    <p className="text-on-surface-variant font-sans text-xs">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
