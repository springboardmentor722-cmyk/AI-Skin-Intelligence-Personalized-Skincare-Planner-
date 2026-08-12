"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileText,
  RotateCw,
  TrendingUp,
  TriangleAlert,
  Sparkles,
  ClipboardList,
} from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";

const REPORT_TYPES = [
  {
    type: "assessment" as const,
    label: "Skin Assessment",
    icon: Sparkles,
    description: "Your current score breakdown across all five weighted factors.",
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
    description: "Your current AM/PM steps and top product matches.",
  },
];

export default function Page() {
  const queryClient = useQueryClient();
  const [includeProfileHeader, setIncludeProfileHeader] = useState(true);

  const reportsQuery = useQuery({
    queryKey: ["reports", "list"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/reports");
      if (error) throw new Error("Couldn't load your reports.");
      return data;
    },
  });

  const schedulesQuery = useQuery({
    queryKey: ["reports", "schedules"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/reports/schedules");
      if (error) throw new Error("Couldn't load your scheduled reports.");
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (reportType: "assessment" | "progress" | "routine") => {
      const { data, error } = await api.POST("/api/v1/reports/generate", {
        body: { report_type: reportType, include_profile_header: includeProfileHeader },
      });
      if (error) throw new Error("Couldn't generate that report.");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports", "list"] }),
  });

  const downloadReport = async (reportId: number) => {
    const { data, error } = await api.GET("/api/v1/reports/{report_id}/download", {
      params: { path: { report_id: reportId } },
    });
    if (error || !data) return;
    window.open(data.url, "_blank");
  };

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Reports</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Generate a PDF snapshot of your skin data, or set up a recurring one.
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
            description="Couldn't load your reports."
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="mb-4 font-semibold">Scheduled Automations</h3>
          {schedulesQuery.data && schedulesQuery.data.length > 0 ? (
            <div className="space-y-3">
              {schedulesQuery.data.map((schedule) => (
                <div
                  key={schedule.schedule_id}
                  className="bg-muted flex items-center justify-between rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium capitalize">{schedule.report_type}</p>
                    <p className="text-on-surface-variant text-sm capitalize">
                      {schedule.frequency}
                    </p>
                  </div>
                  <Switch checked={schedule.is_active} disabled />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant text-sm">No scheduled reports yet.</p>
          )}
        </div>

        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="mb-4 font-semibold">Export Preferences</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm">Include profile header (name, skin type, date)</p>
            <Switch checked={includeProfileHeader} onCheckedChange={setIncludeProfileHeader} />
          </div>
        </div>
      </section>
    </div>
  );
}
