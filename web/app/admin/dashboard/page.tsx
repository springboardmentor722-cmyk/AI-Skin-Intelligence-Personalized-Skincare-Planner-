"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  RotateCw,
  Server,
  ShoppingBag,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";

import { QuickActionGrid, type QuickAction } from "@/components/dashboard/quick-action-grid";
import { RankedBarList, type RankedBarItem } from "@/components/charts/ranked-bar-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusTileGrid } from "@/components/dashboard/status-tile-grid";
import { TimelineList, type TimelineItem } from "@/components/dashboard/timeline-list";
import { DonutBreakdown, type DonutSlice } from "@/components/charts/donut-breakdown";
import { TrendChart } from "@/components/charts/trend-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import { computePercent, formatPrice } from "@/lib/utils";
import { retryFor, widgetStateFor } from "@/lib/widget-state";
import {
  ASSESSMENTS_OVERVIEW_FIXTURE,
  PLATFORM_ANALYTICS_FIXTURE,
  PLATFORM_REVENUE_FIXTURE,
  SYSTEM_UPTIME_FIXTURE,
  USER_GROWTH_FIXTURE,
} from "@/lib/fixtures/dashboard-fixtures";

// docs/DECISIONS.md ADR-023: rebuilds MILESTONE_2_UI_SPEC.md §4.4's 4-row layout
// from the P3 widget kit. Real: user-role counts, assessments/routines/products
// counts, top skin concerns, recent activity, quick actions, system health (P14 —
// wired to the real /health/ready checks). Still fixture (individually justified
// in ADR-023, not invented): platform revenue, system uptime, user growth trend,
// assessments-workflow donut, platform web-analytics — none of these correspond
// to a system this app actually has.

interface HealthReadyResponse {
  status: "ok" | "degraded";
  checks: Record<string, string>;
}

interface AuditLogEntry {
  audit_log_id: number;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string | null;
}

interface PlatformCounts {
  total_assessments: number;
  active_routines: number;
  total_products: number;
}

interface TopConcernStat {
  concern_name: string;
  count: number;
}

interface DashboardStatsResponse {
  userCountsByRole: Record<"user" | "consultant" | "dermatologist" | "admin", number>;
  pending_consultant_count: number;
  pending_dermatologist_count: number;
  recent_activity: AuditLogEntry[];
  platform_counts: PlatformCounts;
  top_concerns: TopConcernStat[];
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

  // Milestone 2 P14 — real /health/ready checks (postgres/redis/mongo), not the
  // fixture's fictional Database/API Services/Storage/Email Service tiles (no S3
  // healthcheck or email service exists anywhere in this app to back those two).
  // Plain fetch, not the typed `api` client — FastAPI's health_ready returns a raw
  // JSONResponse with no response_model, so its openapi.json schema is `unknown`,
  // and it returns a real 503 (not a network error) when degraded, which `fetch`
  // surfaces as a normal non-ok response body to parse, not a thrown exception.
  const healthQuery = useQuery({
    queryKey: ["admin", "health-ready"],
    queryFn: async (): Promise<HealthReadyResponse> => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health/ready`);
      return response.json();
    },
  });

  if (statsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
  const totalUsers = Object.values(stats.userCountsByRole).reduce((a, b) => a + b, 0);
  const totalPendingVerification =
    stats.pending_consultant_count + stats.pending_dermatologist_count;

  const userOverviewData: DonutSlice[] = [
    { key: "user", label: "Users", value: stats.userCountsByRole.user, percent: computePercent(stats.userCountsByRole.user, totalUsers), color: "var(--chart-1)" },
    { key: "consultant", label: "Consultants", value: stats.userCountsByRole.consultant, percent: computePercent(stats.userCountsByRole.consultant, totalUsers), color: "var(--chart-2)" },
    { key: "dermatologist", label: "Dermatologists", value: stats.userCountsByRole.dermatologist, percent: computePercent(stats.userCountsByRole.dermatologist, totalUsers), color: "var(--chart-3)" },
    { key: "admin", label: "Admins", value: stats.userCountsByRole.admin, percent: computePercent(stats.userCountsByRole.admin, totalUsers), color: "var(--chart-4)" },
  ];

  const assessmentsOverviewData: DonutSlice[] = ASSESSMENTS_OVERVIEW_FIXTURE.map((s, i) => ({
    key: s.key,
    label: s.label,
    value: s.value,
    percent: s.percent,
    color: [`var(--chart-1)`, `var(--chart-2)`, `var(--chart-3)`][i],
  }));

  const topConcernsTotal = stats.top_concerns.reduce((sum, c) => sum + c.count, 0);
  const topConcernsData: RankedBarItem[] = stats.top_concerns.map((c) => ({
    key: c.concern_name,
    label: c.concern_name,
    count: c.count,
    percent: computePercent(c.count, topConcernsTotal),
  }));

  const activityItems: TimelineItem[] = stats.recent_activity.map((entry) => ({
    key: entry.audit_log_id,
    title: formatAction(entry.action),
    subtitle:
      entry.target_type && entry.target_id
        ? `${entry.target_type} ${entry.target_id}`
        : (entry.created_at ? new Date(entry.created_at).toLocaleString() : ""),
    calendarLabel: entry.created_at
      ? new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "—",
  }));

  const quickActions: QuickAction[] = [
    { key: "add-user", icon: Users, label: "Add New User", href: "/admin/users" },
    { key: "add-product", icon: ShoppingBag, label: "Add Product", href: "/admin/products" },
    { key: "create-routine", icon: ClipboardList, label: "Create Routine", href: "/admin/routines" },
    { key: "generate-report", icon: FileBarChart, label: "Generate Report", href: "/admin/system-reports" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Welcome back, Admin! 👋</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Here&apos;s what&apos;s happening on your platform today.
        </p>
      </div>

      {/* Row 1 — 6 KPI cards, UI_SPEC.md §4.4 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Total Users" value={totalUsers.toLocaleString("en-IN")} icon={Users} tint="primary" layout="icon-left-circular" footerLink={{ label: "View All Users", href: "/admin/users" }} />
        <StatCard label="Assessments Completed" value={stats.platform_counts.total_assessments.toLocaleString("en-IN")} icon={ClipboardCheck} tint="success" layout="icon-left-circular" footerLink={{ label: "View All Assessments", href: "/admin/assessments" }} />
        <StatCard label="Active Routines" value={stats.platform_counts.active_routines.toLocaleString("en-IN")} icon={ClipboardList} tint="info" layout="icon-left-circular" />
        <StatCard label="Total Products" value={stats.platform_counts.total_products.toLocaleString("en-IN")} icon={ShoppingBag} tint="tertiary" layout="icon-left-circular" />
        <StatCard label="Platform Revenue" value={formatPrice(PLATFORM_REVENUE_FIXTURE.amountInr, "INR")} icon={Wallet} tint="warning" layout="icon-left-circular" delta={{ label: PLATFORM_REVENUE_FIXTURE.deltaLabel, direction: PLATFORM_REVENUE_FIXTURE.deltaDirection }} />
        <StatCard label="System Uptime" value={`${SYSTEM_UPTIME_FIXTURE.percent}%`} icon={Server} tint="success" layout="icon-left-circular" delta={{ label: SYSTEM_UPTIME_FIXTURE.statusLabel, direction: "neutral" }} />
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

      {/* Row 2 — User Overview · User Growth · Assessments Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">User Overview</h3>
          <DonutBreakdown data={userOverviewData} centerValue={totalUsers.toLocaleString("en-IN")} centerLabel="Total Users" legend="count-percent" />
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">User Growth</h3>
          <TrendChart series={[...USER_GROWTH_FIXTURE]} seriesLabel="Users" yDomain={[0, 14000]} footerNote="↑ 18% growth compared to last month" />
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">Assessments Overview</h3>
          <DonutBreakdown data={assessmentsOverviewData} centerValue={stats.platform_counts.total_assessments.toLocaleString("en-IN")} centerLabel="Total Assessments" legend="count-percent" />
        </div>
      </div>

      {/* Row 3 — Top Skin Concerns · Revenue Overview · Recent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">Top Skin Concerns</h3>
          <RankedBarList state={topConcernsData.length === 0 ? "empty" : "ready"} items={topConcernsData} showCount emptyMessage="No concerns logged platform-wide yet." />
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">Revenue Overview</h3>
          <p className="font-mono text-2xl font-bold tabular-nums">{formatPrice(PLATFORM_REVENUE_FIXTURE.amountInr, "INR")}</p>
          <p className="text-success mt-1 text-xs font-medium">↑ {PLATFORM_REVENUE_FIXTURE.deltaLabel}</p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold">Recent Activity</h3>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/monitoring">View All</Link>} />
          </div>
          <TimelineList state={activityItems.length === 0 ? "empty" : "ready"} leading="calendar-tile" trailing="chevron" items={activityItems} emptyMessage="No activity yet." />
        </div>
      </div>

      {/* Row 4 — System Health · Quick Actions · Platform Analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">System Health</h3>
          <StatusTileGrid
            state={widgetStateFor(healthQuery, false)}
            onRetry={retryFor(healthQuery)}
            errorMessage="Couldn't reach the health check."
            tiles={
              healthQuery.data && [
                { key: "api", label: "API", status: "Reachable", healthy: true, icon: Server },
                {
                  key: "postgres",
                  label: "Database",
                  status: healthQuery.data.checks.postgres === "ok" ? "Healthy" : "Unreachable",
                  healthy: healthQuery.data.checks.postgres === "ok",
                  icon: Server,
                },
                {
                  key: "redis",
                  label: "Cache",
                  status: healthQuery.data.checks.redis === "ok" ? "Healthy" : "Unreachable",
                  healthy: healthQuery.data.checks.redis === "ok",
                  icon: Activity,
                },
                {
                  key: "mongo",
                  label: "Document Store",
                  status: healthQuery.data.checks.mongo === "ok" ? "Healthy" : "Unreachable",
                  healthy: healthQuery.data.checks.mongo === "ok",
                  icon: FileBarChart,
                },
              ]
            }
          />
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">Quick Actions</h3>
          <QuickActionGrid actions={quickActions} />
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">Platform Analytics</h3>
          <div className="grid grid-cols-2 gap-3">
            {PLATFORM_ANALYTICS_FIXTURE.map((m) => (
              <div key={m.key} className="flex items-center gap-2">
                <BarChart3 className="text-muted-foreground size-4 shrink-0" strokeWidth={1.75} />
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="font-mono text-sm font-semibold tabular-nums">{m.value}</p>
                  <p className={`text-[11px] ${m.direction === "up" ? "text-success" : "text-error"}`}>
                    {m.direction === "up" ? "↑" : "↓"} {m.deltaLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
