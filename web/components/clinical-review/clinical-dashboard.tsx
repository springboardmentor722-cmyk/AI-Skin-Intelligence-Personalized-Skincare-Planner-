import { TrendingUp, ClipboardCheck, ClipboardList, CalendarClock, Sparkles } from "lucide-react";

import { DonutBreakdown } from "@/components/charts/donut-breakdown";
import { RankedBarList } from "@/components/charts/ranked-bar-list";
import { ScoreChip } from "@/components/charts/score-chip";
import { TrendChart } from "@/components/charts/trend-chart";
import { InsightBanner } from "@/components/dashboard/insight-banner";
import { RosterTable, type RosterColumn } from "@/components/dashboard/roster-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimelineList } from "@/components/dashboard/timeline-list";
import {
  CONSULTANT_KPIS,
  CONSULTANT_PROGRESS_SERIES,
  CONSULTANT_ROSTER,
  CONSULTANT_SKIN_TYPE_DONUT,
  CONSULTANT_STAT_FOOTER,
  CONSULTANT_TIP,
  DERMATOLOGIST_CONCERN_DONUT,
  DERMATOLOGIST_INSIGHT,
  DERMATOLOGIST_KPIS,
  DERMATOLOGIST_PROGRESS_SERIES,
  DERMATOLOGIST_ROSTER,
  DERMATOLOGIST_STAT_FOOTER,
  RECENT_ASSESSMENTS,
  TOP_SKIN_CONCERNS_BARS,
  UPCOMING_FOLLOW_UPS,
  type ClinicalRosterRow,
} from "@/lib/fixtures/clinical-dashboard-fixtures";

interface ClinicalDashboardProps {
  role: "consultant" | "dermatologist";
}

// One shared layout for both clinical roles (MILESTONE_2_MASTER_PROMPT.md P5:
// "one shared layout with role-specific config ... not two copied page files").
// Structurally twins, deliberately NOT collapsed: consultant's 3-cell stat footer
// vs dermatologist's 4-cell (incl. neutral "Stable"), "Skin Concerns Guide" vs
// "Skin Conditions Guide" (lib/nav-config.ts, unchanged), "Consultant Tip" (1 line)
// vs "AI Clinical Insights" (2 lines), and an all-female vs mixed-gender roster.
export function ClinicalDashboard({ role }: ClinicalDashboardProps) {
  const isDerma = role === "dermatologist";
  const roster = isDerma ? DERMATOLOGIST_ROSTER : CONSULTANT_ROSTER;
  const donutData = isDerma ? DERMATOLOGIST_CONCERN_DONUT : CONSULTANT_SKIN_TYPE_DONUT;
  const donutTotal = isDerma ? DERMATOLOGIST_KPIS.totalPatients : CONSULTANT_KPIS.totalClients;
  const progressSeries = isDerma ? DERMATOLOGIST_PROGRESS_SERIES : CONSULTANT_PROGRESS_SERIES;
  const statFooter = isDerma ? DERMATOLOGIST_STAT_FOOTER : CONSULTANT_STAT_FOOTER;
  const personLabel = isDerma ? "Patient" : "Client";

  const rosterColumns: RosterColumn<ClinicalRosterRow>[] = [
    {
      key: "name",
      header: personLabel,
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          {!isDerma && (
            <p className="text-muted-foreground text-xs">
              {r.age}, {r.gender}
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
            render: (r: ClinicalRosterRow) => `${r.age}, ${r.gender}`,
          } satisfies RosterColumn<ClinicalRosterRow>,
        ]
      : []),
    { key: "skin_type", header: "Skin Type", render: (r) => r.skinType },
    { key: "concern", header: isDerma ? "Primary Concern" : "Top Concern", render: (r) => r.topConcern },
    { key: "score", header: "Skin Health Score", render: (r) => <ScoreChip value={r.score} /> },
    { key: "last_assessment", header: "Last Assessment", render: (r) => r.lastAssessment },
    { key: "status", header: "Status", render: (r) => r.status },
    { key: "next_follow_up", header: "Next Follow-up", render: (r) => r.nextFollowUp },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Row 1 — 5 KPIs, 5th is a link card (UI_SPEC.md §4.2/§4.3) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={isDerma ? "Total Patients" : "Total Clients"}
          value={(isDerma ? DERMATOLOGIST_KPIS.totalPatients : CONSULTANT_KPIS.totalClients).toLocaleString("en-IN")}
          icon={TrendingUp}
          tint="primary"
          layout="icon-left-circular"
          delta={{ label: isDerma ? "14% this month" : "12% this month", direction: "up" }}
        />
        <StatCard
          label="Assessments Done"
          value={(isDerma ? DERMATOLOGIST_KPIS.assessmentsDone : CONSULTANT_KPIS.assessmentsDone).toLocaleString("en-IN")}
          icon={ClipboardCheck}
          tint="success"
          layout="icon-left-circular"
          delta={{ label: "18% this month", direction: "up" }}
        />
        <StatCard
          label={isDerma ? "Active Treatment Plans" : "Active Routines"}
          value={(isDerma ? DERMATOLOGIST_KPIS.activeTreatmentPlans : CONSULTANT_KPIS.activeRoutines).toLocaleString("en-IN")}
          icon={ClipboardList}
          tint="info"
          layout="icon-left-circular"
          delta={{ label: isDerma ? "16% this month" : "15% this month", direction: "up" }}
        />
        <StatCard
          label={isDerma ? "Patients Improving" : "Avg. Improvement"}
          value={isDerma ? `${DERMATOLOGIST_KPIS.patientsImproving}%` : `${CONSULTANT_KPIS.avgImprovement}%`}
          icon={Sparkles}
          tint="tertiary"
          layout="icon-left-circular"
          delta={{ label: isDerma ? "8% this month" : "6% this month", direction: "up" }}
        />
        <StatCard
          label={isDerma ? "Follow-ups Due" : "Upcoming Follow-ups"}
          value={(isDerma ? DERMATOLOGIST_KPIS.followUpsDue : CONSULTANT_KPIS.upcomingFollowUps).toLocaleString("en-IN")}
          icon={CalendarClock}
          tint="warning"
          layout="icon-left-circular"
          footerLink={{ label: isDerma ? "View all follow-ups" : "View Calendar", href: `/${role}/reminders` }}
        />
      </div>

      {/* Row 2 — roster (7) + distribution donut / top concerns bars (5) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="border-border bg-card rounded-2xl border p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold">
              {isDerma ? "Patients Overview" : "Client Overview"}
            </h3>
            <a href={`/${role}/${isDerma ? "patients" : "clients"}`} className="text-secondary text-sm font-medium hover:underline">
              View All {isDerma ? "Patients" : "Clients"}
            </a>
          </div>
          <RosterTable columns={rosterColumns} rows={roster} rowKey={(r) => r.key} />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="border-border bg-card rounded-2xl border p-5">
            <h3 className="font-heading mb-3 text-base font-semibold">
              {isDerma ? "Skin Concerns Distribution" : "Clients by Skin Type"}
            </h3>
            <DonutBreakdown
              data={donutData}
              centerValue={donutTotal.toLocaleString("en-IN")}
              centerLabel={isDerma ? "Total Patients" : "Total Clients"}
              legend="count-percent"
            />
          </div>
          <div className="border-border bg-card rounded-2xl border p-5">
            <h3 className="font-heading mb-3 text-base font-semibold">Top Skin Concerns</h3>
            <RankedBarList items={TOP_SKIN_CONCERNS_BARS} showCount={false} />
          </div>
        </div>
      </div>

      {/* Row 3 — progress + stat footer (5) · Recent Assessments (3.5) · Upcoming
          Follow-ups (3.5), UI_SPEC.md §4.2/§4.3 — CSS Grid spans must be integers,
          so this row uses an explicit 5fr/3.5fr/3.5fr template instead of the
          12-column grid the other rows use. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[5fr_3.5fr_3.5fr]">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">
            {isDerma ? "Patient Progress Overview" : "Client Progress Overview"}
          </h3>
          <TrendChart series={progressSeries} seriesLabel="Avg. score" rangeOptions={["This Month"]} rangeValue="This Month" />
          <div className={`mt-4 grid gap-2 border-t pt-4 ${statFooter.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
            {statFooter.map((cell) => (
              <div key={cell.key}>
                <p className="font-mono text-lg font-bold tabular-nums">{cell.value}</p>
                <p className="text-muted-foreground text-xs">{cell.label}</p>
                <p className={`text-xs font-medium ${cell.deltaLabel.startsWith("↓") ? "text-error" : cell.deltaLabel === "—" ? "text-muted-foreground" : "text-success"}`}>
                  {cell.deltaLabel}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">Recent Assessments</h3>
          <TimelineList
            leading="avatar"
            trailing="chip"
            items={RECENT_ASSESSMENTS.map((a) => ({
              key: a.key,
              title: a.name,
              subtitle: a.when,
              avatarInitials: a.initials,
              trailingLabel: `${a.score}/100`,
            }))}
          />
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="font-heading mb-3 text-base font-semibold">Upcoming Follow-ups</h3>
          <TimelineList
            leading="calendar-tile"
            trailing="pill"
            items={UPCOMING_FOLLOW_UPS.map((f) => ({
              key: f.key,
              title: f.name,
              subtitle: f.when,
              calendarLabel: f.when.split(",")[0],
              trailingLabel: f.daysLeft,
              trailingTone: f.daysLeft === "Tomorrow" ? "warning" : "neutral",
            }))}
          />
        </div>
      </div>

      {/* Row 4 — full-width insight banner */}
      <InsightBanner
        variant={isDerma ? "clinical" : "tip"}
        title={isDerma ? DERMATOLOGIST_INSIGHT.title : CONSULTANT_TIP.title}
        lines={isDerma ? DERMATOLOGIST_INSIGHT.lines : CONSULTANT_TIP.lines}
        actionLabel="View AI Insights ✨"
        actionHref={`/${role}/dashboard`}
      />
    </div>
  );
}
