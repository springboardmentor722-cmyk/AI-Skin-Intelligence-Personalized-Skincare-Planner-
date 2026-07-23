"use client";

import { Cell, Pie, PieChart } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  percent: number;
  /** Existing chart token (--chart-1..5) or any valid CSS colour — never a raw
   * screenshot hex (MILESTONE_2_MASTER_PROMPT.md §1a THEME OVERRIDE). */
  color: string;
}

interface DonutBreakdownProps extends WidgetStateProps {
  data?: DonutSlice[];
  centerValue?: string | number;
  centerLabel?: string;
  /** "percent" (User) or "count-percent" (consultant/derma/admin) — UI_SPEC.md §5. */
  legend?: "percent" | "count-percent";
}

// Donut with a two-line centre label and a legend that's either percent-only or
// count+percent, per role (UI_SPEC.md §4.1/§4.2/§4.3/§4.4).
export function DonutBreakdown({
  state = "ready",
  data,
  centerValue,
  centerLabel,
  legend = "percent",
  emptyIcon,
  emptyMessage = "No breakdown yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
}: DonutBreakdownProps) {
  if (state === "loading") {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="size-32 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }
  if (state === "error") return <WidgetError message={errorMessage} />;
  if (state === "empty" || !data || data.length === 0) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  const config = Object.fromEntries(
    data.map((d) => [d.key, { label: d.label, color: d.color }])
  ) satisfies ChartConfig;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <ChartContainer config={config} className="aspect-square size-32">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="65%" outerRadius="100%" strokeWidth={2}>
              {data.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {(centerValue != null || centerLabel) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-lg font-bold tabular-nums">{centerValue}</span>
            <span className="text-muted-foreground text-[11px]">{centerLabel}</span>
          </div>
        )}
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
        {data.map((slice) => (
          <li key={slice.key} className="flex items-start justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: slice.color }} />
              <span className="leading-tight">{slice.label}</span>
            </span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {legend === "count-percent" ? `${slice.value} (${slice.percent}%)` : `${slice.percent}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
