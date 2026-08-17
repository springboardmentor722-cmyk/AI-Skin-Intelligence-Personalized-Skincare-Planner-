"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  FileText,
  RotateCw,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";

const REPORT_TYPES = [
  {
    type: "assessment" as const,
    label: "Skin Assessment",
    icon: Sparkles,
    description: "Score breakdown across all five weighted factors.",
  },
  {
    type: "progress" as const,
    label: "Progress",
    icon: TrendingUp,
    description: "7/30/90-day routine compliance trend.",
  },
  {
    type: "routine" as const,
    label: "Routine & Recommendations",
    icon: ClipboardList,
    description: "Current AM/PM steps and top product matches.",
  },
];

// Read/generate report view shared by consultant and dermatologist — both
// roles read/write the same assignment-gated /clients/{user_id}/reports*
// endpoints (clinical_review/router.py), which write into the same
// progress_reports row the client's own Reports page also lists. No
// schedule management here — Scheduled Automations stays a user-only
// self-service feature (reports/router.py never exposes it to a professional).
export function ClientReportsView({ userId, backHref }: { userId: string; backHref: string }) {
  const queryClient = useQueryClient();

  const clientQuery = useQuery({
    queryKey: ["clinical-review", "client", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}", {
        params: { path: { user_id: userId } },
      });
      if (error) throw new Error("Couldn't load client.");
      return data;
    },
  });

  const reportsQuery = useQuery({
    queryKey: ["clinical-review", "reports", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}/reports", {
        params: { path: { user_id: userId } },
      });
      if (error) throw new Error("Couldn't load reports.");
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (reportType: "assessment" | "progress" | "routine") => {
      const { data, error } = await api.POST("/api/v1/clients/{user_id}/reports/generate", {
        params: { path: { user_id: userId } },
        body: { report_type: reportType, include_profile_header: true },
      });
      if (error) throw new Error("Couldn't generate that report.");
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["clinical-review", "reports", userId] }),
    onError: () => toast.error("Couldn't generate that report."),
  });

  const downloadReport = async (reportId: number) => {
    const tab = window.open("", "_blank");
    const { data, error } = await api.GET(
      "/api/v1/clients/{user_id}/reports/{report_id}/download",
      { params: { path: { user_id: userId, report_id: reportId } } }
    );
    if (error || !data) {
      tab?.close();
      toast.error("Couldn't download that report.");
      return;
    }
    if (tab) tab.location.href = data.url;
    else window.location.assign(data.url);
  };

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Reports
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">
          {clientQuery.data?.name ?? clientQuery.data?.email ?? "Client"} — Reports
        </h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Generate a PDF snapshot of this client&apos;s skin data.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {REPORT_TYPES.map(({ type, label, icon: Icon, description }) => (
          <div
            key={type}
            className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5"
          >
            <Icon className="text-secondary size-6" strokeWidth={1.5} />
            <h3 className="font-semibold">{label}</h3>
            <p className="text-on-surface-variant flex-1 text-sm">{description}</p>
            <Button
              onClick={() => generateMutation.mutate(type)}
              disabled={generateMutation.isPending}
            >
              <FileText data-icon="inline-start" />
              Generate Report
            </Button>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent Reports</h2>
        {reportsQuery.isLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : reportsQuery.isError ? (
          <StateCard
            tone="destructive"
            icon={TriangleAlert}
            description="Couldn't load reports."
            action={
              <Button variant="outline" onClick={() => reportsQuery.refetch()}>
                <RotateCw className="size-4" strokeWidth={1.5} />
                Retry
              </Button>
            }
          />
        ) : reportsQuery.data && reportsQuery.data.length === 0 ? (
          <StateCard
            icon={FileText}
            title="No reports yet"
            description="Generate one above to see it here."
          />
        ) : (
          <div className="border-border overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsQuery.data?.map((report) => (
                  <TableRow key={report.report_id}>
                    <TableCell className="font-medium capitalize">{report.report_type}</TableCell>
                    <TableCell className="text-on-surface-variant">{report.summary}</TableCell>
                    <TableCell className="text-on-surface-variant">
                      {report.generated_at ? new Date(report.generated_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Download ${report.report_type} report`}
                        onClick={() => downloadReport(report.report_id)}
                      >
                        <Download className="size-4" strokeWidth={1.5} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
