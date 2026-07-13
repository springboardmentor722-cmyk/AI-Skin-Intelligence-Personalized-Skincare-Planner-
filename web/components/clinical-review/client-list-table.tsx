"use client";

import { useState } from "react";
import { Search, TrendingUp, Users } from "lucide-react";

import { StateCard } from "@/components/state-card";
import type { components } from "@/lib/api-types";

type ClientSummaryRead = components["schemas"]["ClientSummaryRead"];

interface ClientListTableProps {
  clients: ClientSummaryRead[];
  /** "Clients" (Consultant) or "Patients" (Dermatologist) — same real data/table,
   * different copy per role (docs/ARCHITECTURE.md §2). */
  personLabel: string;
  onSelect: (userId: string) => void;
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

export function ClientListTable({ clients, personLabel, onSelect }: ClientListTableProps) {
  const [query, setQuery] = useState("");

  const filtered = clients.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (c.name ?? "").toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  if (clients.length === 0) {
    return (
      <StateCard
        icon={Users}
        title={`No ${personLabel.toLowerCase()} assigned yet`}
        description={`${personLabel} are assigned by an admin — once someone is assigned to you, they'll appear here with their real skin profile, score, and routine data.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="text-on-surface-variant absolute top-1/2 left-3 size-4 -translate-y-1/2" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${personLabel.toLowerCase()}...`}
          className="bg-muted focus:ring-secondary/40 w-full rounded-full py-2.5 pr-4 pl-10 text-sm outline-none focus:ring-2"
        />
      </div>

      <div className="border-border overflow-x-auto rounded-2xl border">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/50 border-border border-b">
              <th className="px-4 py-3 font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                {personLabel.slice(0, -1)} details
              </th>
              <th className="px-4 py-3 font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                Skin type
              </th>
              <th className="px-4 py-3 text-center font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                Skin score
              </th>
              <th className="px-4 py-3 font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                Primary concern
              </th>
              <th className="px-4 py-3 font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                Adherence
              </th>
              <th className="px-4 py-3 font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                Trend
              </th>
              <th className="px-4 py-3 font-geist text-xs font-semibold tracking-[0.05em] uppercase">
                Last sync
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr
                key={client.user_id}
                onClick={() => onSelect(client.user_id)}
                className="border-border hover:bg-muted/40 cursor-pointer border-b transition-colors last:border-b-0"
              >
                <td className="px-4 py-4">
                  <p className="font-sans text-sm font-semibold">{client.name ?? client.email}</p>
                  <p className="text-on-surface-variant text-xs">{client.email}</p>
                </td>
                <td className="px-4 py-4 font-sans text-sm">{client.skin_type_name ?? "—"}</td>
                <td className="px-4 py-4 text-center font-geist text-sm tabular-nums">
                  {client.overall_score != null ? Math.round(client.overall_score) : "—"}
                </td>
                <td className="px-4 py-4 font-sans text-sm">{client.primary_concern_name ?? "—"}</td>
                <td className="px-4 py-4 font-geist text-sm tabular-nums">
                  {client.routine_adherence_score != null
                    ? `${Math.round(client.routine_adherence_score)}%`
                    : "—"}
                </td>
                <td className="px-4 py-4">
                  <Sparkline values={client.score_trend} />
                </td>
                <td className="text-on-surface-variant px-4 py-4 font-sans text-xs">
                  {client.last_sync ? new Date(client.last_sync).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-on-surface-variant flex items-center gap-2 font-sans text-sm">
          <TrendingUp className="size-4" strokeWidth={1.5} />
          No matches for &quot;{query}&quot;.
        </p>
      )}
    </div>
  );
}
