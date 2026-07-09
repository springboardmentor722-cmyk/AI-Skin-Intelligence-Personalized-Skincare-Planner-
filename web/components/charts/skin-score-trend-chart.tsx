"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const CHART_CONFIG = {
  overall_score: { label: "Skin score", color: "var(--secondary)" },
} satisfies ChartConfig;

interface SkinScoreTrendChartProps {
  data: { date: string; overall_score: number | null }[];
  /** "compact" = Dashboard's mini-chart (no axes, short); "full" = Progress screen's
   * own trend chart (both axes, taller). Same underlying chart, two densities — was
   * two near-identical inline AreaChart blocks before this component existed. */
  variant?: "compact" | "full";
}

// Isolated in its own module (and dynamically imported by both consumers, see
// app/(user)/dashboard/page.tsx and app/(user)/progress/page.tsx) so recharts — this
// app's single heaviest dependency — only ever ships in the bundle for a page that
// actually renders a chart, and only compiles once per dev session instead of as part
// of Dashboard/Progress's own first-visit compile.
export function SkinScoreTrendChart({ data, variant = "full" }: SkinScoreTrendChartProps) {
  const compact = variant === "compact";
  return (
    <ChartContainer config={CHART_CONFIG} className={compact ? "h-40 w-full" : "h-64 w-full"}>
      <AreaChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" hide={compact} tickLine={!compact} axisLine={!compact} />
        {!compact && <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={28} />}
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="overall_score"
          type="monotone"
          fill="var(--color-overall_score)"
          fillOpacity={0.15}
          stroke="var(--color-overall_score)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
