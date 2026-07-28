"use client";

import { useMemo } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTheme } from "next-themes";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface ScoreAdherencePoint {
  date: string;
  score: number | null;
  adherence: number | null; // 0-1
}

interface ScoreAdherenceChartProps extends WidgetStateProps {
  points?: ScoreAdherencePoint[];
  rangeOptions?: readonly string[]; // "7" | "30" | "90"
  rangeValue?: string;
  onRangeChange?: (range: string) => void;
  footerNote?: string;
}

const FALLBACK_COLORS = {
  secondary: "#2f5fd6",
  tertiary: "#14b8a6",
  mutedForeground: "#71717a",
  border: "#d4d4d8",
};

// Chart.js paints to <canvas>, whose 2D context parses fillStyle/strokeStyle
// as plain CSS <color> strings with no cascade — it does not resolve `var()`
// the way components/ui/chart.tsx's Recharts SVG output does (SVG presentation
// attributes/styles go through normal DOM style resolution). Read the actual
// token values from the cascade instead. Computed in render (not an effect)
// so there's no setState-after-mount cascade; `resolvedTheme` as a dependency
// still forces a re-read whenever the theme (or one of the 8 accent palettes)
// changes, since next-themes toggling re-renders every `useTheme()` consumer.
function useThemeColors() {
  const { resolvedTheme } = useTheme();
  return useMemo(() => {
    if (typeof document === "undefined") return FALLBACK_COLORS;
    const style = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    return {
      secondary: read("--secondary", FALLBACK_COLORS.secondary),
      tertiary: read("--tertiary", FALLBACK_COLORS.tertiary),
      mutedForeground: read("--muted-foreground", FALLBACK_COLORS.mutedForeground),
      border: read("--border", FALLBACK_COLORS.border),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolvedTheme is a re-render trigger, not a value read inside
  }, [resolvedTheme]);
}

// Dashboard-only "score + adherence, 7/30/90" trend widget, fed exclusively by
// GET /api/v1/analytics/me's score_vs_adherence series. Deliberately NOT a
// rebuild of components/charts/trend-chart.tsx's generic single-series
// `TrendChart` — that component is shared by check-in, admin dashboard, and
// the clinical-review dashboard with a different prop shape (`series`/
// `seriesLabel`/`yDomain`, relative range labels); repurposing it here would
// break those four call sites for a milestone task scoped to the user
// dashboard only.
export function ScoreAdherenceChart({
  state = "ready",
  points,
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
}: ScoreAdherenceChartProps) {
  const colors = useThemeColors();

  if (state === "loading") return <Skeleton className="h-48 w-full" />;
  if (state === "error") return <WidgetError message={errorMessage} onRetry={onRetry} />;
  if (state === "empty" || !points || points.length === 0) {
    return (
      <WidgetEmpty
        icon={emptyIcon}
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
      />
    );
  }

  const data = {
    labels: points.map((p) => p.date),
    datasets: [
      {
        label: "Skin score",
        data: points.map((p) => p.score),
        borderColor: colors.secondary,
        backgroundColor: `${colors.secondary}26`,
        yAxisID: "y",
        tension: 0.35,
        pointRadius: 2,
      },
      {
        label: "Adherence",
        data: points.map((p) => (p.adherence == null ? null : Math.round(p.adherence * 100))),
        borderColor: colors.tertiary,
        backgroundColor: `${colors.tertiary}26`,
        yAxisID: "y",
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-2">
      {rangeOptions && rangeOptions.length > 0 && (
        <div className="flex justify-end">
          <Select value={rangeValue} onValueChange={(v) => v && onRangeChange?.(v)}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="h-48 w-full">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                min: 0,
                max: 100,
                ticks: { stepSize: 25, color: colors.mutedForeground },
                grid: { color: colors.border },
              },
              x: {
                ticks: { color: colors.mutedForeground },
                grid: { display: false },
              },
            },
            plugins: { legend: { position: "bottom", labels: { color: colors.mutedForeground } } },
          }}
        />
      </div>
      {footerNote && <p className="text-muted-foreground text-xs">{footerNote}</p>}
    </div>
  );
}
