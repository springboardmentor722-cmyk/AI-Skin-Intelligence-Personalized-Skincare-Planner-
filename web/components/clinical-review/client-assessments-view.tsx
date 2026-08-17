"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardCheck, RotateCw, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type ClientScoreRead = components["schemas"]["ClientScoreRead"];
type ScoreRead = components["schemas"]["ScoreRead"];

const COMPONENT_ROWS: { key: keyof ClientScoreRead & keyof ScoreRead; label: string }[] = [
  { key: "skin_condition_score", label: "Skin condition" },
  { key: "lifestyle_score", label: "Lifestyle" },
  { key: "sleep_quality_score", label: "Sleep quality" },
  { key: "hydration_score", label: "Hydration" },
  { key: "routine_adherence_score", label: "Routine adherence" },
  { key: "overall_score", label: "Overall" },
];

function fmt(v: number | null | undefined): string {
  return v != null ? Math.round(v).toString() : "—";
}

function bandTone(band: string | null | undefined): "default" | "secondary" | "destructive" {
  if (band === "Good") return "default";
  if (band === "Fair") return "secondary";
  return "destructive";
}

// Read-only assessment history/compare view shared by consultant and
// dermatologist — both roles read the same assignment-gated
// /clients/{user_id}/assessments* endpoints (clinical_review/router.py).
export function ClientAssessmentsView({
  userId,
  backHref,
}: {
  userId: string;
  backHref: string;
}) {
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [openScoreId, setOpenScoreId] = useState<number | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

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

  const historyQuery = useQuery({
    queryKey: ["clinical-review", "assessments", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}/assessments", {
        params: { path: { user_id: userId }, query: { days: 1825 } },
      });
      if (error) throw new Error("Couldn't load assessment history.");
      return data;
    },
    enabled: !!userId,
  });

  // Oldest -> newest from the API; history table reads best newest first.
  const history = useMemo(() => [...(historyQuery.data ?? [])].reverse(), [historyQuery.data]);

  const detailQuery = useQuery({
    queryKey: ["clinical-review", "assessment-detail", userId, openScoreId],
    queryFn: async () => {
      if (openScoreId == null) return null;
      const { data, error } = await api.GET(
        "/api/v1/clients/{user_id}/assessments/{score_id}",
        { params: { path: { user_id: userId, score_id: openScoreId } } }
      );
      if (error) throw new Error("Couldn't load assessment.");
      return data;
    },
    enabled: openScoreId != null,
  });

  const compareIds = useMemo(() => selectedForCompare.slice(-2), [selectedForCompare]);
  const compareA = useQuery({
    queryKey: ["clinical-review", "assessment-detail", userId, compareIds[0]],
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/api/v1/clients/{user_id}/assessments/{score_id}",
        { params: { path: { user_id: userId, score_id: compareIds[0] } } }
      );
      if (error) throw new Error("Couldn't load assessment.");
      return data;
    },
    enabled: compareOpen && compareIds.length === 2,
  });
  const compareB = useQuery({
    queryKey: ["clinical-review", "assessment-detail", userId, compareIds[1]],
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/api/v1/clients/{user_id}/assessments/{score_id}",
        { params: { path: { user_id: userId, score_id: compareIds[1] } } }
      );
      if (error) throw new Error("Couldn't load assessment.");
      return data;
    },
    enabled: compareOpen && compareIds.length === 2,
  });

  function toggleCompare(scoreId: number) {
    setSelectedForCompare((prev) =>
      prev.includes(scoreId) ? prev.filter((id) => id !== scoreId) : [...prev, scoreId].slice(-2)
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Assessments
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">
          {clientQuery.data?.name ?? clientQuery.data?.email ?? "Client"} — Assessment history
        </h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Every skin health score computed for this client, oldest to newest. Select two rows to
          compare.
        </p>
      </div>

      {historyQuery.isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : historyQuery.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Unable to load assessments."
          action={
            <Button variant="outline" onClick={() => historyQuery.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : history.length === 0 ? (
        <StateCard icon={ClipboardCheck} description="No assessments found for this client yet." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-on-surface-variant font-sans text-xs">
              {selectedForCompare.length}/2 selected for comparison
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedForCompare.length !== 2}
              onClick={() => setCompareOpen(true)}
            >
              Compare selected
            </Button>
          </div>

          <div className="border-border overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Overall</TableHead>
                  <TableHead className="text-center">Skin condition</TableHead>
                  <TableHead className="text-center">Lifestyle</TableHead>
                  <TableHead className="text-center">Sleep</TableHead>
                  <TableHead className="text-center">Hydration</TableHead>
                  <TableHead className="text-center">Adherence</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((score) => (
                  <TableRow key={score.score_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedForCompare.includes(score.score_id)}
                        onCheckedChange={() => toggleCompare(score.score_id)}
                      />
                    </TableCell>
                    <TableCell className="font-sans text-sm">
                      {score.calculated_at ? new Date(score.calculated_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-center font-geist text-sm tabular-nums">
                      {fmt(score.overall_score)}
                    </TableCell>
                    <TableCell className="text-center font-geist text-sm tabular-nums">
                      {fmt(score.skin_condition_score)}
                    </TableCell>
                    <TableCell className="text-center font-geist text-sm tabular-nums">
                      {fmt(score.lifestyle_score)}
                    </TableCell>
                    <TableCell className="text-center font-geist text-sm tabular-nums">
                      {fmt(score.sleep_quality_score)}
                    </TableCell>
                    <TableCell className="text-center font-geist text-sm tabular-nums">
                      {fmt(score.hydration_score)}
                    </TableCell>
                    <TableCell className="text-center font-geist text-sm tabular-nums">
                      {fmt(score.routine_adherence_score)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setOpenScoreId(score.score_id)}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Assessment detail dialog — full ScoreRead: skin age, band, weights. */}
      <Dialog open={openScoreId != null} onOpenChange={(open) => !open && setOpenScoreId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assessment detail</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : detailQuery.isError || !detailQuery.data ? (
            <p className="text-destructive text-sm">Unable to load this assessment.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-geist text-3xl font-bold tabular-nums">
                  {fmt(detailQuery.data.overall_score)}
                </span>
                <Badge variant={bandTone(detailQuery.data.band)}>{detailQuery.data.band ?? "—"}</Badge>
              </div>
              {detailQuery.data.skin_age != null && (
                <p className="text-on-surface-variant text-sm">
                  Estimated skin age: {Math.round(detailQuery.data.skin_age)}
                </p>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {COMPONENT_ROWS.filter((r) => r.key !== "overall_score").map((row) => (
                  <div key={row.key} className="flex items-center justify-between">
                    <span className="text-on-surface-variant">{row.label}</span>
                    <span className="font-geist tabular-nums">{fmt(detailQuery.data![row.key] as number | null)}</span>
                  </div>
                ))}
              </div>
              <p className="text-on-surface-variant text-xs">
                Weights: condition {Math.round(detailQuery.data.weights.skin_condition_weight * 100)}% ·
                lifestyle {Math.round(detailQuery.data.weights.lifestyle_weight * 100)}% · sleep{" "}
                {Math.round(detailQuery.data.weights.sleep_quality_weight * 100)}% · hydration{" "}
                {Math.round(detailQuery.data.weights.hydration_weight * 100)}% · adherence{" "}
                {Math.round(detailQuery.data.weights.routine_adherence_weight * 100)}%
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Compare dialog — two full ScoreReads side by side. */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compare assessments</DialogTitle>
          </DialogHeader>
          {compareA.isLoading || compareB.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : compareA.isError || compareB.isError || !compareA.data || !compareB.data ? (
            <p className="text-destructive text-sm">Unable to load one or both assessments.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold uppercase tracking-wide">
                <span></span>
                <span>{new Date(compareA.data.calculated_at ?? "").toLocaleDateString()}</span>
                <span>{new Date(compareB.data.calculated_at ?? "").toLocaleDateString()}</span>
              </div>
              {COMPONENT_ROWS.map((row) => {
                const a = compareA.data![row.key] as number | null;
                const b = compareB.data![row.key] as number | null;
                const delta = a != null && b != null ? Math.round(b - a) : null;
                return (
                  <div key={row.key} className="grid grid-cols-3 items-center gap-2 text-sm">
                    <span className="text-on-surface-variant">{row.label}</span>
                    <span className="font-geist tabular-nums">{fmt(a)}</span>
                    <span className="font-geist tabular-nums">
                      {fmt(b)}
                      {delta != null && delta !== 0 && (
                        <span className={delta > 0 ? "text-emerald-600" : "text-destructive"}>
                          {" "}
                          ({delta > 0 ? "+" : ""}
                          {delta})
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
