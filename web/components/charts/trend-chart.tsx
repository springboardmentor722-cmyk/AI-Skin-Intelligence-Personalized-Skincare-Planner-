"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

interface TrendPoint {
  x: string;
  y: number;
}

interface TrendChartProps extends WidgetStateProps {
  series?: TrendPoint[];
  seriesLabel?: string;
  yDomain?: [number, number];
  rangeOptions?: string[];
  rangeValue?: string;
  onRangeChange?: (range: string) => void;
  footerNote?: string;
}

const CONFIG = { y: { label: "Value", color: "var(--secondary)" } } satisfies ChartConfig;

// Generic area trend chart (UI_SPEC.md §5's TrendChart) — one shared component
// behind every "This Month ▾" line/area chart across all four roles. Existing
// components/charts/skin-score-trend-chart.tsx stays as-is (a real, already-wired
// dashboard consumer); this is the general-purpose widget-kit version future
// screens compose against, per master prompt §12's fixtures-first sequencing.
export function TrendChart({
  state = "ready",
  series,
  seriesLabel = "Value",
  yDomain = [0, 100],
  rangeOptions,
  rangeValue,
  onRangeChange,
  footerNote,
  emptyIcon,
  emptyMessage = "No trend data yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
  onRetry,
}: TrendChartProps) {
  if (state === "loading") return <Skeleton className="h-48 w-full" />;
  if (state === "error") return <WidgetError message={errorMessage} onRetry={onRetry} />;
  if (state === "empty" || !series || series.length === 0) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  const config = { ...CONFIG, y: { ...CONFIG.y, label: seriesLabel } } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-2">
      {rangeOptions && rangeOptions.length > 0 && (
        <div className="flex justify-end">
          <Select value={rangeValue} onValueChange={(value) => value && onRangeChange?.(value)}>
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <ChartContainer config={config} className="h-48 w-full">
        <AreaChart data={series}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="x" tickLine={false} axisLine={false} />
          <YAxis domain={yDomain} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            dataKey="y"
            type="monotone"
            fill="var(--color-y)"
            fillOpacity={0.15}
            stroke="var(--color-y)"
            dot={{ r: 2, strokeWidth: 1 }}
          />
        </AreaChart>
      </ChartContainer>
      {footerNote && <p className="text-muted-foreground text-xs">{footerNote}</p>}
    </div>
  );
}
