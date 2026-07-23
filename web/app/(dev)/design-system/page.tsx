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

// Milestone 2 P1 deliverable (MILESTONE_2_MASTER_PROMPT.md P1 step 6): every token,
// ramp, and primitive rendered in one place so drift from docs/DESIGN.md is visible
// at a glance. Dev-only route, not part of any role's nav (web/lib/nav-config.ts).

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

export default function DesignSystemShowcasePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Design System Showcase</h1>
        <p className="text-sm text-muted-foreground">
          Milestone 2 P1 — every token, ramp, and primitive in one place. Not part of
          any role&apos;s navigation.
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

      <Card>
        <CardHeader>
          <CardTitle>Widget states preview</CardTitle>
          <CardDescription>Loading skeleton + progress, reused by the P3 widget kit</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Progress value={72} />
        </CardContent>
      </Card>
    </div>
  );
}
