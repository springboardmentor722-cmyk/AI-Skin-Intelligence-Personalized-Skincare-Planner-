"use client";

import {
  Activity,
  BarChart3,
  Bell,
  Droplet,
  FileText,
  ShoppingBag,
  Sparkles,
  Sun,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getScoreBand } from "@/lib/score-components";

import { ChecklistStrip } from "@/components/dashboard/checklist-strip";
import { InsightBanner } from "@/components/dashboard/insight-banner";
import { ProductCarousel } from "@/components/dashboard/product-carousel";
import { QuickActionGrid } from "@/components/dashboard/quick-action-grid";
import { RosterTable } from "@/components/dashboard/roster-table";
import { RoutineChain } from "@/components/dashboard/routine-chain";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusTileGrid } from "@/components/dashboard/status-tile-grid";
import { TimelineList } from "@/components/dashboard/timeline-list";
import { DonutBreakdown } from "@/components/charts/donut-breakdown";
import { RankedBarList } from "@/components/charts/ranked-bar-list";
import { ScoreChip } from "@/components/charts/score-chip";
import { ScoreRing } from "@/components/charts/score-ring";
import { TrendChart } from "@/components/charts/trend-chart";

// Milestone 2 P1+P3 deliverable (MILESTONE_2_MASTER_PROMPT.md P1 step 6 / P3):
// every token, ramp, primitive, and widget rendered in one place — loading/empty/
// error states included — so drift is visible at a glance. Dev-only route, not
// part of any role's nav (web/lib/nav-config.ts).

const SEMANTIC_SWATCHES = [
  { name: "background", varName: "--background" },
  { name: "card", varName: "--card" },
  { name: "border", varName: "--border" },
  { name: "foreground", varName: "--foreground" },
  { name: "muted-foreground", varName: "--muted-foreground" },
  { name: "primary", varName: "--primary" },
  { name: "secondary (info)", varName: "--secondary" },
  { name: "tertiary", varName: "--tertiary" },
  { name: "success", varName: "--success" },
  { name: "warning", varName: "--warning" },
  { name: "error (danger)", varName: "--error" },
] as const;

const CHART_SWATCHES = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
] as const;

const SCORE_BAND_EXAMPLES = [82, 67, 41] as const;

const TYPE_SCALE = [
  { label: "Page greeting", className: "font-heading text-[27px] font-bold" },
  { label: "Card title", className: "text-[16px] font-semibold" },
  { label: "KPI value", className: "font-mono text-[32px] font-bold tabular-nums" },
  { label: "Body / subtitle", className: "text-sm text-muted-foreground" },
  {
    label: "Section label",
    className: "text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground",
  },
] as const;

const RADIUS_SWATCHES = [
  { label: "sm", className: "rounded-sm" },
  { label: "default (card)", className: "rounded-[var(--radius)]" },
  { label: "lg", className: "rounded-lg" },
  { label: "full (pill)", className: "rounded-full" },
] as const;

function WidgetShowcase({
  name,
  consumedBy,
  children,
}: {
  name: string;
  consumedBy: string;
  children: [React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode];
}) {
  const [ready, loading, empty, error] = children;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{consumedBy}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">Ready</p>
          {ready}
        </div>
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">Loading</p>
          {loading}
        </div>
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">Empty</p>
          {empty}
        </div>
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">Error</p>
          {error}
        </div>
      </CardContent>
    </Card>
  );
}

const ROSTER_COLUMNS = [
  {
    key: "name",
    header: "Client",
    sortable: true,
    sortValue: (r: { name: string }) => r.name,
    render: (r: { name: string }) => r.name,
  },
  {
    key: "score",
    header: "Score",
    render: (r: { score: number }) => <ScoreChip value={r.score} />,
  },
];
const ROSTER_ROWS = [
  { id: 1, name: "Ananya Verma", score: 78 },
  { id: 2, name: "Riya Singh", score: 65 },
];

export default function DesignSystemShowcasePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Design System Showcase</h1>
        <p className="text-sm text-muted-foreground">
          Milestone 2 P1/P3 — every token, ramp, primitive, and widget in one place.
          Not part of any role&apos;s navigation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semantic colour tokens</CardTitle>
          <CardDescription>
            Every Milestone 2 screenshot role maps onto one of these — see{" "}
            <code>UI_EXTRACTION.md §1</code>. No new tokens were added.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {SEMANTIC_SWATCHES.map((s) => (
            <div key={s.varName} className="flex items-center gap-2">
              <div
                className="size-8 shrink-0 rounded-lg border border-border"
                style={{ background: `var(${s.varName})` }}
              />
              <div className="text-xs">
                <div className="font-medium">{s.name}</div>
                <div className="text-muted-foreground">{s.varName}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorical chart palette</CardTitle>
          <CardDescription>--chart-1 through --chart-5, reused for donuts and bars</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          {CHART_SWATCHES.map((v) => (
            <div key={v} className="flex flex-col items-center gap-1">
              <div className="size-10 rounded-full" style={{ background: `var(${v})` }} />
              <span className="text-xs text-muted-foreground">{v}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score ramp (Good / Fair / Poor)</CardTitle>
          <CardDescription>
            <code>getScoreBand()</code>, web/lib/score-components.ts — success/warning/error
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-6">
          {SCORE_BAND_EXAMPLES.map((value) => {
            const band = getScoreBand(value);
            return (
              <div key={value} className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold tabular-nums">{value}</span>
                <Badge
                  style={{ background: band.colorVar, color: "var(--on-primary)" }}
                  className="border-transparent"
                >
                  {band.label}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography scale</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {TYPE_SCALE.map((t) => (
            <div key={t.label} className="flex items-baseline gap-4">
              <span className={t.className}>{t.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Radius</CardTitle>
          <CardDescription>Card radius resolves to the existing --radius (16px) token</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          {RADIUS_SWATCHES.map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-1">
              <div className={`size-14 border border-border bg-muted ${r.className}`} />
              <span className="text-xs text-muted-foreground">{r.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <h2 className="font-heading text-xl font-bold">Widget kit (P3) — 14 widgets, 3 states each</h2>

      <WidgetShowcase name="StatCard" consumedBy="All 4 roles">
        <StatCard label="Skin Health Score" value="78" icon={TrendingUp} tint="success" delta={{ label: "8% this week", direction: "up" }} />
        <StatCard label="Skin Health Score" icon={TrendingUp} state="loading" />
        <StatCard label="Skin Health Score" icon={TrendingUp} state="empty" emptyMessage="Complete an assessment first." />
        <StatCard label="Skin Health Score" icon={TrendingUp} state="error" errorMessage="Couldn't load your score." />
      </WidgetShowcase>

      <WidgetShowcase name="ScoreRing" consumedBy="User hero, table cells, chips">
        <ScoreRing value={78} showFace size={96} />
        <ScoreRing state="loading" size={96} />
        <ScoreRing state="empty" size={96} emptyMessage="No score yet." />
        <ScoreRing state="error" size={96} errorMessage="Failed to load." />
      </WidgetShowcase>

      <WidgetShowcase name="ScoreChip" consumedBy="Recent-assessment lists">
        <div className="flex gap-2"><ScoreChip value={82} /><ScoreChip value={65} /><ScoreChip value={41} /></div>
        <ScoreChip state="loading" />
        <span className="text-muted-foreground text-sm">— (omitted when absent)</span>
        <span className="text-muted-foreground text-sm">— (omitted when absent)</span>
      </WidgetShowcase>

      <WidgetShowcase name="DonutBreakdown" consumedBy="All 4 roles ×2">
        <DonutBreakdown
          centerValue={128}
          centerLabel="Total Clients"
          legend="count-percent"
          data={[
            { key: "combo", label: "Combination", value: 45, percent: 35, color: "var(--chart-1)" },
            { key: "oily", label: "Oily", value: 32, percent: 25, color: "var(--chart-2)" },
            { key: "dry", label: "Dry", value: 26, percent: 20, color: "var(--chart-3)" },
          ]}
        />
        <DonutBreakdown state="loading" />
        <DonutBreakdown state="empty" emptyMessage="No breakdown yet." />
        <DonutBreakdown state="error" errorMessage="Failed to load breakdown." />
      </WidgetShowcase>

      <WidgetShowcase name="TrendChart" consumedBy="All 4 roles">
        <TrendChart
          series={[{ x: "May 1", y: 60 }, { x: "May 7", y: 68 }, { x: "May 14", y: 74 }, { x: "May 21", y: 78 }]}
          rangeOptions={["This Month", "Last 3 Months"]}
          rangeValue="This Month"
          footerNote="Your skin health has improved by 12% this month."
        />
        <TrendChart state="loading" />
        <TrendChart state="empty" emptyMessage="Log a few days to see your trend." />
        <TrendChart state="error" errorMessage="Failed to load trend." />
      </WidgetShowcase>

      <WidgetShowcase name="RankedBarList" consumedBy="Consultant, Derma, Admin">
        <RankedBarList
          showCount
          items={[
            { key: "acne", label: "Acne & Post Acne Marks", percent: 42, count: 54 },
            { key: "hyper", label: "Hyperpigmentation", percent: 24, count: 31 },
          ]}
        />
        <RankedBarList state="loading" />
        <RankedBarList state="empty" emptyMessage="No concerns logged yet." />
        <RankedBarList state="error" errorMessage="Failed to load concerns." />
      </WidgetShowcase>

      <WidgetShowcase name="RosterTable" consumedBy="Consultant, Dermatologist">
        <RosterTable
          columns={ROSTER_COLUMNS}
          rows={ROSTER_ROWS}
          rowKey={(r) => r.id}
          rowMenuItems={() => [{ label: "View profile", onClick: () => {} }]}
          headerActionLabel="View All"
          headerActionHref="#"
        />
        <RosterTable state="loading" rowKey={(r: { id: number }) => r.id} />
        <RosterTable state="empty" emptyMessage="No clients yet." rowKey={(r: { id: number }) => r.id} />
        <RosterTable state="error" errorMessage="Failed to load roster." rowKey={(r: { id: number }) => r.id} />
      </WidgetShowcase>

      <WidgetShowcase name="TimelineList" consumedBy="Recent assessments, follow-ups, activity feed">
        <TimelineList
          leading="avatar"
          trailing="chip"
          items={[
            { key: 1, title: "Ananya Verma", subtitle: "May 18, 2025 · 10:30 AM", avatarInitials: "AV", trailingLabel: "78/100" },
          ]}
        />
        <TimelineList leading="avatar" trailing="chip" state="loading" />
        <TimelineList leading="avatar" trailing="chip" state="empty" emptyMessage="Nothing recent." />
        <TimelineList leading="avatar" trailing="chip" state="error" errorMessage="Failed to load activity." />
      </WidgetShowcase>

      <WidgetShowcase name="ChecklistStrip" consumedBy="User dashboard">
        <ChecklistStrip
          tasks={[
            { key: 1, label: "Morning Routine", done: true },
            { key: 2, label: "Drink Water", done: true },
            { key: 3, label: "Night Routine", done: false },
          ]}
        />
        <ChecklistStrip state="loading" />
        <ChecklistStrip state="empty" emptyMessage="No tasks for today." />
        <ChecklistStrip state="error" errorMessage="Failed to load checklist." />
      </WidgetShowcase>

      <WidgetShowcase name="RoutineChain" consumedBy="User dashboard">
        <RoutineChain
          period="AM"
          steps={[
            { key: 1, icon: Droplet, label: "Cleanser", done: true },
            { key: 2, icon: Sun, label: "SPF", done: false },
          ]}
        />
        <RoutineChain period="AM" state="loading" />
        <RoutineChain period="AM" state="empty" emptyMessage="Generate a routine first." />
        <RoutineChain period="AM" state="error" errorMessage="Failed to load routine." />
      </WidgetShowcase>

      <WidgetShowcase name="ProductCarousel" consumedBy="User dashboard">
        <ProductCarousel
          products={[
            {
              key: 1,
              name: "Hyaluronic Acid Serum",
              price: 349,
              currency: "INR",
              rating: 4.6,
              matchPercentage: 94,
              activeIngredientTags: ["Hyaluronic Acid", "Niacinamide"],
              overBudget: false,
            },
          ]}
        />
        <ProductCarousel state="loading" />
        <ProductCarousel state="empty" emptyMessage="No recommendations yet." />
        <ProductCarousel state="error" errorMessage="Failed to load products." />
      </WidgetShowcase>

      <WidgetShowcase name="InsightBanner" consumedBy="User, Consultant, Dermatologist">
        <InsightBanner variant="tip" title="Consultant Tip" lines={["Clients who follow routines consistently show 2x better improvement."]} actionLabel="View AI Insights" actionHref="#" />
        <InsightBanner variant="tip" title="Consultant Tip" state="loading" />
        <InsightBanner variant="tip" title="Consultant Tip" state="empty" emptyMessage="No insights yet." />
        <InsightBanner variant="tip" title="Consultant Tip" state="error" errorMessage="Failed to load insights." />
      </WidgetShowcase>

      <WidgetShowcase name="StatusTileGrid" consumedBy="Admin dashboard">
        <StatusTileGrid
          tiles={[
            { key: "db", icon: Activity, label: "Database", status: "Healthy", healthy: true },
            { key: "api", icon: Bell, label: "API Services", status: "Healthy", healthy: true },
          ]}
        />
        <StatusTileGrid state="loading" />
        <StatusTileGrid state="empty" emptyMessage="No status data yet." />
        <StatusTileGrid state="error" errorMessage="Failed to load system health." />
      </WidgetShowcase>

      <WidgetShowcase name="QuickActionGrid" consumedBy="Admin, User quick actions">
        <QuickActionGrid
          actions={[
            { key: "add-user", icon: ShoppingBag, label: "Add New User", href: "#" },
            { key: "report", icon: FileText, label: "Generate Report", href: "#" },
            { key: "insights", icon: Sparkles, label: "View Insights", href: "#" },
            { key: "growth", icon: BarChart3, label: "Growth", href: "#" },
          ]}
        />
        <QuickActionGrid state="loading" />
        <QuickActionGrid state="empty" emptyMessage="No quick actions configured." />
        <QuickActionGrid state="error" errorMessage="Failed to load actions." />
      </WidgetShowcase>

      <Card>
        <CardHeader>
          <CardTitle>Base primitives</CardTitle>
          <CardDescription>Skeleton + Progress, reused across every widget&apos;s loading state</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Progress value={72} />
        </CardContent>
      </Card>
    </div>
  );
}
