"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import { api } from "@/lib/api";

const PAGE_SIZE = 20;

export default function AdminMonitoringPage() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin", "audit-logs", action, page],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/audit-logs", {
        params: { query: { action: action || undefined, page, page_size: PAGE_SIZE } },
      });
      if (error) throw new Error("Failed to load audit logs");
      return data;
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Monitoring</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Full audit trail — every verification action and role change, filterable.
        </p>
      </div>

      <input
        value={action}
        onChange={(e) => {
          setAction(e.target.value);
          setPage(1);
        }}
        placeholder="Filter by action (e.g. verification_approve, role_changed)"
        className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full max-w-md rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
      />

      {query.isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : query.isError || !query.data ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't load the audit trail."
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : query.data.items.length === 0 ? (
        <StateCard icon={Activity} description="No activity matches this filter." />
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-border text-on-surface-variant border-b font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((entry) => (
                  <tr key={entry.audit_log_id} className="border-border border-b last:border-0">
                    <td className="text-on-surface px-4 py-3 font-sans text-sm">
                      {entry.action}
                    </td>
                    <td className="text-on-surface-variant px-4 py-3 font-mono text-xs">
                      {entry.actor_user_id ?? "—"}
                    </td>
                    <td className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                      {entry.target_type && entry.target_id
                        ? `${entry.target_type} · ${entry.target_id}`
                        : "—"}
                    </td>
                    <td className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-border flex items-center justify-between border-t px-4 py-3">
            <p className="text-on-surface-variant font-sans text-xs">
              {query.data.meta.total} entr{query.data.meta.total === 1 ? "y" : "ies"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * PAGE_SIZE >= query.data.meta.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
