"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type QueueItem = components["schemas"]["VerificationQueueItem"];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "more_info_requested", label: "More info requested" },
  { value: "suspended", label: "Suspended" },
  { value: "deactivated", label: "Deactivated" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "consultant", label: "Consultant" },
  { value: "dermatologist", label: "Dermatologist" },
];

export default function VerificationQueuePage() {
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("pending");

  const queueQuery = useQuery({
    queryKey: ["admin", "verification-queue", role, status],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/verification-queue", {
        params: {
          query: {
            role: role ? (role as "consultant" | "dermatologist") : undefined,
            status: status || undefined,
          },
        },
      });
      if (error) throw new Error("Failed to load verification queue");
      return data;
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">
          Verification queue
        </h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Review consultant and dermatologist applications.
        </p>
      </div>

      <div className="flex gap-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-muted text-on-surface rounded-full border-none px-4 py-2 font-sans text-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-muted text-on-surface rounded-full border-none px-4 py-2 font-sans text-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {queueQuery.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : queueQuery.isError || !queueQuery.data ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't load the verification queue."
          action={
            <Button variant="outline" onClick={() => queueQuery.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : queueQuery.data.items.length === 0 ? (
        <StateCard
          icon={ClipboardCheck}
          description="Nothing matches these filters."
        />
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-border text-on-surface-variant border-b font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {(queueQuery.data.items as QueueItem[]).map((item) => (
                  <tr key={`${item.role}-${item.user_id}`} className="border-border border-b last:border-0">
                    <td className="text-on-surface px-4 py-3 font-sans text-sm">
                      {item.user_id}
                    </td>
                    <td className="text-on-surface px-4 py-3 font-sans text-sm capitalize">
                      {item.role}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-warning/10 text-warning rounded-full px-2.5 py-0.5 font-sans text-xs capitalize">
                        {item.verification_status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                      {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link href={`/admin/users/verification/${item.role}/${item.user_id}`}>
                            Review
                          </Link>
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
