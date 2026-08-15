"use client";

import {
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { DonutBreakdown, type DonutSlice } from "@/components/charts/donut-breakdown";
import { RankedBarList, type RankedBarItem } from "@/components/charts/ranked-bar-list";
import { ScoreChip } from "@/components/charts/score-chip";
import { TrendChart } from "@/components/charts/trend-chart";
import { InsightBanner } from "@/components/dashboard/insight-banner";
import { RosterTable, type RosterColumn } from "@/components/dashboard/roster-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimelineList } from "@/components/dashboard/timeline-list";
import { api } from "@/lib/api";
import { useMyAppointmentsQuery } from "@/lib/hooks/use-appointments";
import { retryFor, widgetStateFor } from "@/lib/widget-state";
import type { components } from "@/lib/api-types";

type ClientSummary = components["schemas"]["ClientSummaryRead"];

interface ClinicalDashboardProps {
  role: "consultant" | "dermatologist";
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function toDonutSlices(
  distribution: { key: string; label: string; count: number }[],
  total: number
): DonutSlice[] {
  return distribution.map((slice, i) => ({
    key: slice.key,
    label: slice.label,
    value: slice.count,
    percent: total > 0 ? Math.round((slice.count / total) * 100) : 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

function toRankedBars(
  distribution: { key: string; label: string; count: number }[],
  total: number
): RankedBarItem[] {
  return distribution.map((slice) => ({
    key: slice.key,
    label: slice.label,
    percent: total > 0 ? Math.round((slice.count / total) * 100) : 0,
    count: slice.count,
  }));
}

// One shared layout for both clinical roles (MILESTONE_2_MASTER_PROMPT.md P5:
// "one shared layout with role-specific config ... not two copied page files").
// Structurally twins, deliberately NOT collapsed: consultant's 3-cell stat footer
// vs dermatologist's 4-cell (incl. neutral "Stable"), "Skin Concerns Guide" vs
// "Skin Conditions Guide" (lib/nav-config.ts, unchanged), "Consultant Tip" (1 line)
// vs "AI Clinical Insights" (2 lines).
//
// Milestone 2 P14 (ADR-024's deferred consequence, ADR-031's naming precedent) —
// roster and every KPI/donut/bars/trend/stat-footer/recent-assessment number below
// is real, aggregated across the professional's actual assigned clients
// (clinical_review/service.py's list_my_clients + get_portfolio_stats). The 5th
// KPI (was an honest "no scheduling system yet" empty state) is now a real
// "Next Appointment" card wired to the appointment system (Task 9's
// useMyAppointmentsQuery); the Row 3 "Upcoming Follow-ups" card below still has
// no real per-follow-up list to show, so it keeps its honest empty copy. The
// Tip/Insight banner is static educational copy, not a per-client computed
// insight — never claimed to be data-driven.
export function ClinicalDashboard({ role }: ClinicalDashboardProps) {
  const isDerma = role === "dermatologist";
  const personLabel = isDerma ? "Patient" : "Client";
  const personLabelPlural = isDerma ? "Patients" : "Clients";

  const rosterQuery = useQuery({
    queryKey: ["clinical-review", "roster", role],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/me", {
        params: { query: { page: 1, page_size: 50 } },
      });
      if (error) throw new Error("Couldn't load your roster.");
      return data;
    },
  });

  const statsQuery = useQuery({
    queryKey: ["clinical-review", "portfolio-stats", role],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/me/portfolio-stats");
      if (error) throw new Error("Couldn't load portfolio stats.");
      return data;
    },
  });

  const appointmentsQuery = useMyAppointmentsQuery();
  const nextAppointment = (appointmentsQuery.data ?? [])
    .filter((a) => ["pending", "confirmed"].includes(a.status) && new Date(a.start_time).getTime() > Date.now())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

  const roster = rosterQuery.data?.items ?? [];
  const stats = statsQuery.data;

  const skinTypeDonut = stats ? toDonutSlices(stats.skin_type_distribution, stats.total_assigned) : [];
  const concernDonut = stats ? toDonutSlices(stats.top_concerns, stats.total_assigned) : [];
  const concernBars = stats ? toRankedBars(stats.top_concerns, stats.total_assigned) : [];
  const skinTypeBars = stats ? toRankedBars(stats.skin_type_distribution, stats.total_assigned) : [];

  const trendSeries = (stats?.portfolio_score_trend ?? []).map((y, i) => ({
    x: `Assessment ${i + 1}`,
    y,
  }));

  const improvingPct =
    stats && stats.total_assigned > 0
      ? Math.round((stats.clients_improving / stats.total_assigned) * 100)
      : null;

  const statFooter = stats
    ? isDerma
      ? [
          {
            key: "avg_improvement",
            label: "Avg. Improvement",
            value: stats.avg_improvement_points != null ? `${stats.avg_improvement_points > 0 ? "+" : ""}${stats.avg_improvement_points}` : "—",
          },
          { key: "improved", label: "Patients Improved", value: String(stats.clients_improving) },
          { key: "stable", label: "Stable", value: String(stats.clients_stable) },
          { key: "need_attention", label: "Need Attention", value: String(stats.clients_need_attention) },
        ]
      : [
          {
            key: "avg_improvement",
            label: "Avg. Improvement",
            value: stats.avg_improvement_points != null ? `${stats.avg_improvement_points > 0 ? "+" : ""}${stats.avg_improvement_points}` : "—",
          },
          { key: "improved", label: "Clients Improved", value: String(stats.clients_improving) },
          { key: "need_attention", label: "Need Attention", value: String(stats.clients_need_attention) },
        ]
    : [];

  const rosterColumns: RosterColumn<ClientSummary>[] = [
    {
      key: "name",
      header: personLabel,
      sortable: true,
      sortValue: (r) => r.name ?? "",
      render: (r) => (
        <div>
          <p className="font-medium">{r.name ?? r.email}</p>
          {!isDerma && (r.age != null || r.gender) && (
            <p className="text-muted-foreground text-xs">
              {[r.age, r.gender].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      ),
    },
    ...(isDerma
      ? [
          {
            key: "age_gender",
            header: "Age / Gender",
            render: (r: ClientSummary) => [r.age, r.gender].filter(Boolean).join(", ") || "—",
          } satisfies RosterColumn<ClientSummary>,
        ]
      : []),
    { key: "skin_type", header: "Skin Type", render: (r) => r.skin_type_name ?? "—" },
    {
      key: "concern",
      header: isDerma ? "Primary Concern" : "Top Concern",
      render: (r) => r.primary_concern_name ?? "—",
    },
    {
      key: "score",
      header: "Skin Health Score",
      render: (r) => (r.overall_score != null ? <ScoreChip value={Math.round(r.overall_score)} /> : "—"),
    },
    {
      key: "last_assessment",
      header: "Last Assessment",
      render: (r) => (r.last_sync ? new Date(r.last_sync).toLocaleDateString() : "Never"),
    },
  ];

  const rosterState = rosterQuery.isLoading
    ? "loading"
    : rosterQuery.isError
      ? "error"
      : roster.length === 0
        ? "empty"
        : "ready";
  const statsState = statsQuery.isLoading ? "loading" : statsQuery.isError ? "error" : "ready";
  const retryStats = retryFor(statsQuery);
  const retryRoster = retryFor(rosterQuery);

  return (
    <div className="flex flex-col gap-6">
      {/* Row 1 — 5 KPIs, 5th is the real "Next Appointment" widget */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          state={statsState}
            onRetry={retryStats}
          label={isDerma ? "Total Patients" : "Total Clients"}
          value={stats?.total_assigned.toLocaleString("en-IN")}
          icon={TrendingUp}
          tint="primary"
          layout="icon-left-circular"
          emptyMessage={`No ${personLabelPlural.toLowerCase()} assigned yet.`}
        />
        <StatCard
          state={statsState}
            onRetry={retryStats}
          label="Assessments Done"
          value={stats?.assessments_done.toLocaleString("en-IN")}
          icon={ClipboardCheck}
          tint="success"
          layout="icon-left-circular"
        />
        <StatCard
          state={statsState}
            onRetry={retryStats}
          label="Active Routines"
          value={stats?.active_routines.toLocaleString("en-IN")}
          icon={ClipboardList}
          tint="info"
          layout="icon-left-circular"
        />
        <StatCard
          state={statsState}
            onRetry={retryStats}
          label={isDerma ? "Patients Improving" : "Avg. Improvement"}
          value={isDerma ? (improvingPct != null ? `${improvingPct}%` : undefined) : stats?.avg_improvement_points ?? undefined}
          icon={Sparkles}
          tint="tertiary"
          layout="icon-left-circular"
        />
        <StatCard
          state={widgetStateFor(appointmentsQuery, !nextAppointment)}
          onRetry={retryFor(appointmentsQuery)}
          label="Next Appointment"
          value={
            nextAppointment
              ? new Date(nextAppointment.start_time).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : undefined
          }
          icon={CalendarClock}
          tint="warning"
          layout="icon-left-circular"
          emptyMessage="No upcoming appointments."
          footerLink={{
            label: nextAppointment?.other_party_name ?? "View schedule",
            href: role === "consultant" ? "/consultant/reminders" : "/dermatologist/consultations",
          }}
        />
      </div>

      {/* Row 2 — roster (7) + distribution donut / breakdown bars (5) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="border-border bg-card rounded-2xl border p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold">
              {isDerma ? "Patients Overview" : "Client Overview"}
            </h3>
            <a
              href={`/${role}/${isDerma ? "patients" : "clients"}`}
              className="text-secondary text-sm font-medium hover:underline"
            >
              View All {personLabelPlural}
            </a>
          </div>
          <RosterTable
            state={rosterState}
            onRetry={retryRoster}
            columns={rosterColumns}
            rows={roster}
            rowKey={(r) => r.user_id}
            emptyMessage={`No ${personLabelPlural.toLowerCase()} assigned to you yet.`}
          />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="border-border bg-card rounded-2xl border p-5">
            <h3 className="font-heading mb-3 text-base font-semibold">
              {isDerma ? "Skin Concerns Distribution" : "Clients by Skin Type"}
            </h3>
            <DonutBreakdown
              state={statsState}
            onRetry={retryStats}
              data={isDerma ? concernDonut : skinTypeDonut}
              centerValue={stats?.total_assigned.toLocaleString("en-IN")}
              centerLabel={isDerma ? "Total Patients" : "Total Clients"}
              legend="count-percent"
            />
          </div>
          <div className="border-border bg-card rounded-2xl border p-5">
            <h3 className="font-heading mb-3 text-base font-semibold">
              {isDerma ? "Skin Type Breakdown" : "Top Skin Concerns"}
            </h3>
            <RankedBarList state={statsState}
            onRetry={retryStats} items={isDerma ? skinTypeBars : concernBars} showCount />
          </div>
        </div>
      </div>

      {/* Row 3 — progress + stat footer (5) · Recent Assessments (3.5) · a
          scheduling-gap notice (3.5), UI_SPEC.md §4.2/§4.3 layout. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[5fr_3.5fr_3.5fr]">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">
            {isDerma ? "Patient Progress Overview" : "Client Progress Overview"}
          </h3>
          <TrendChart
            state={statsState}
            onRetry={retryStats}
            series={trendSeries}
            seriesLabel="Avg. score"
            rangeOptions={["This Month"]}
            rangeValue="This Month"
          />
          <div
            className={`mt-4 grid gap-2 border-t pt-4 ${statFooter.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}
          >
            {statFooter.map((cell) => (
              <div key={cell.key}>
                <p className="font-mono text-lg font-bold tabular-nums">{cell.value}</p>
                <p className="text-muted-foreground text-xs">{cell.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">Recent Assessments</h3>
          <TimelineList
            state={statsState === "ready" && (stats?.recent_assessments.length ?? 0) === 0 ? "empty" : statsState}
            onRetry={retryStats}
            leading="avatar"
            trailing="chip"
            items={(stats?.recent_assessments ?? []).map((a) => ({
              key: a.user_id,
              title: a.name ?? "Unknown",
              subtitle: a.calculated_at ? new Date(a.calculated_at).toLocaleDateString() : "",
              avatarInitials: (a.name ?? "?")
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2),
              trailingLabel: a.overall_score != null ? `${Math.round(a.overall_score)}/100` : "—",
            }))}
          />
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">Upcoming Follow-ups</h3>
          <p className="text-muted-foreground font-sans text-sm">
            Scheduling isn&apos;t built yet — this app has no appointment/follow-up
            system to show real dates from.
          </p>
        </div>
      </div>

      {/* Row 4 — full-width insight banner (static educational copy, not
          per-client computed — never claimed to be data-driven). */}
      <InsightBanner
        variant={isDerma ? "clinical" : "tip"}
        title={isDerma ? "AI Clinical Insights" : "Consultant Tip"}
        lines={
          isDerma
            ? [
                "Patients with combination skin type often show faster improvement with a dual-cleanse routine.",
                "Consider niacinamide for patients reporting persistent redness.",
              ]
            : [
                "Clients who follow routines consistently tend to show better improvement — encourage daily hydration and sunscreen.",
              ]
        }
        actionLabel="View All"
        actionHref={`/${role}/${isDerma ? "patients" : "clients"}`}
      />
    </div>
  );
}
