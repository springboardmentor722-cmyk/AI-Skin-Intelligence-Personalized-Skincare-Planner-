"use client";

import type { ReactNode } from "react";
import { Search, TrendingUp, Users } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api-types";

type ClientSummaryRead = components["schemas"]["ClientSummaryRead"];

interface ClientListTableProps {
  clients: ClientSummaryRead[];
  /** "Clients" (Consultant) or "Patients" (Dermatologist) — same real data/table,
   * different copy + column emphasis per role (docs/ARCHITECTURE.md §2). */
  personLabel: string;
  onSelect: (userId: string) => void;
  /** M3R Phase 5 — search is now server-side (GET /clients/me?q=), so this
   * component only renders the input and reports raw keystrokes; the page owns
   * debouncing and the query key. `hasAssignments` distinguishes "no clients at
   * all" (hide search, show the assignment empty-state) from "no matches for the
   * current search" (keep the input visible). */
  search: string;
  onSearchChange: (value: string) => void;
  hasAssignments: boolean;
}

function formatPercent(value: number | null): string {
  return value != null ? `${Math.round(value * 100)}%` : "—";
}

function complianceRisk(sevenDay: number | null): { label: string; className: string } | null {
  if (sevenDay == null) return null;
  if (sevenDay < 0.5) return { label: "High risk", className: "bg-destructive/10 text-destructive" };
  if (sevenDay < 0.75) return { label: "Watch", className: "bg-warning/10 text-warning" };
  return { label: "On track", className: "bg-success/10 text-success" };
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <span className="text-on-surface-variant text-xs">—</span>;
  }
  const max = Math.max(...values, 100);
  return (
    <div className="flex h-8 items-end gap-0.5">
      {values.slice(-8).map((v, i) => (
        <div
          key={i}
          className="bg-secondary/60 w-1.5 rounded-t-sm"
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

interface ColumnDef {
  key: string;
  header: ReactNode;
  headClassName?: string;
  cellClassName?: string;
  cell: (client: ClientSummaryRead) => ReactNode;
}

export function ClientListTable({
  clients,
  personLabel,
  onSelect,
  search,
  onSearchChange,
  hasAssignments,
}: ClientListTableProps) {
  // Dermatologist rosters use the plural "Patients" label everywhere they call this
  // component (app/dermatologist/*) — deriving from it here avoids threading a
  // separate `role` prop through 5 call sites for a purely presentational branch.
  const isDerma = personLabel === "Patients";

  if (!hasAssignments) {
    return (
      <StateCard
        icon={Users}
        title={`No ${personLabel.toLowerCase()} assigned yet`}
        description={`${personLabel} are assigned by an admin — once someone is assigned to you, they'll appear here with their real skin profile, score, and routine data.`}
      />
    );
  }

  const baseHeadClass = "px-4 py-3 font-geist text-xs font-semibold tracking-[0.05em] uppercase";

  const details: ColumnDef = {
    key: "details",
    header: `${personLabel.slice(0, -1)} details`,
    cell: (c) => (
      <>
        <p className="font-sans text-sm font-semibold">{c.name ?? c.email}</p>
        <p className="text-on-surface-variant text-xs">{c.email}</p>
      </>
    ),
  };
  const skinType: ColumnDef = {
    key: "skin_type",
    header: "Skin type",
    cell: (c) => c.skin_type_name ?? "—",
  };
  // Dermatologist scans for clinical risk first (AGENTS.md Step 2 brief) — the score
  // cell also surfaces the compliance-risk badge so it doesn't need its own column.
  const score: ColumnDef = {
    key: "score",
    header: "Skin score",
    headClassName: "text-center",
    cellClassName: "text-center",
    cell: (c) => {
      const risk = isDerma ? complianceRisk(c.compliance_seven_day) : null;
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="font-geist text-sm tabular-nums">
            {c.overall_score != null ? Math.round(c.overall_score) : "—"}
          </span>
          {risk && (
            <Badge variant="outline" className={cn("border-none px-1.5 py-0 text-[10px]", risk.className)}>
              {risk.label}
            </Badge>
          )}
        </div>
      );
    },
  };
  const concern: ColumnDef = {
    key: "concern",
    header: "Primary concern",
    cell: (c) => c.primary_concern_name ?? "—",
  };
  const adherence: ColumnDef = {
    key: "adherence",
    header: "Adherence",
    cell: (c) =>
      c.routine_adherence_score != null ? `${Math.round(c.routine_adherence_score)}%` : "—",
  };
  const compliance: ColumnDef = {
    key: "compliance",
    header: "Compliance (7d / 30d)",
    // No wireframe placement exists for compliance % (consultant-clients.html has no
    // such column) — rubric-required stat added here as the nearest fit to the
    // existing Adherence column, per AGENTS.md §8.
    cell: (c) => `${formatPercent(c.compliance_seven_day)} / ${formatPercent(c.compliance_thirty_day)}`,
  };
  const trend: ColumnDef = {
    key: "trend",
    header: "Trend",
    // Consultant: trend is secondary, sheds first on tight viewports. Dermatologist:
    // trend direction is one of the first things scanned, so it stays visible.
    headClassName: isDerma ? undefined : "hidden lg:table-cell",
    cellClassName: isDerma ? undefined : "hidden lg:table-cell",
    cell: (c) => <Sparkline values={c.score_trend} />,
  };
  const lastSync: ColumnDef = {
    key: "last_sync",
    header: "Last sync",
    headClassName: "hidden lg:table-cell",
    cellClassName: "hidden lg:table-cell text-on-surface-variant text-xs",
    cell: (c) => (c.last_sync ? new Date(c.last_sync).toLocaleDateString() : "—"),
  };

  // Consultant: adherence stays the visual anchor right after score/concern (routine-
  // adherence-focused workflow). Dermatologist: trend moves up next to score/risk,
  // concern/adherence/compliance follow (clinical-chart-style scan order).
  const columns: ColumnDef[] = isDerma
    ? [details, skinType, score, trend, concern, adherence, compliance, lastSync]
    : [details, skinType, score, concern, adherence, compliance, trend, lastSync];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="text-on-surface-variant absolute top-1/2 left-3 size-4 -translate-y-1/2" strokeWidth={1.5} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${personLabel.toLowerCase()}...`}
          aria-label={`Search ${personLabel.toLowerCase()}`}
          className="bg-muted focus:ring-secondary/40 w-full rounded-full py-2.5 pr-4 pl-10 text-sm outline-none focus:ring-2"
        />
      </div>

      <div className="border-border scroll-fade-x overflow-x-auto rounded-2xl border">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/50 border-border border-b">
              {columns.map((col) => (
                <th key={col.key} className={cn(baseHeadClass, col.headClassName)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.user_id}
                onClick={() => onSelect(client.user_id)}
                className="border-border hover:bg-muted/40 cursor-pointer border-b transition-colors last:border-b-0"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-4 font-sans text-sm", col.cellClassName)}>
                    {col.cell(client)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clients.length === 0 && (
        <p className="text-on-surface-variant flex items-center gap-2 font-sans text-sm">
          <TrendingUp className="size-4" strokeWidth={1.5} />
          No matches for &quot;{search}&quot;.
        </p>
      )}
    </div>
  );
}
