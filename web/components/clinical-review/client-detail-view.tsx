"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScoreAdherenceChart } from "@/components/charts/score-adherence-chart";
import { SkinScoreRing } from "@/components/skin-score-ring";
import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { retryFor, widgetStateFor } from "@/lib/widget-state";

// web/designs/wireframes/consultant-client-detail.html /
// derm-patient-detail.html — real content only. The wireframes' "Diagnostic
// Analysis" (Hydration/Texture/Pigmentation/Elasticity/Sensitivity, invented
// prose like "Suggest chemical exfoliation") and derm's "Affected Area Mapping"/
// "AI Insights"/"Risk Factor Index"/"Clinical Photos" don't match the real Skin
// Health Score model (docs/AI_ML.md) and have no backing table/model anywhere —
// replaced here with the actual 5-component score breakdown (same pattern as
// app/(user)/dashboard/page.tsx), not reproduced.
const SCORE_COMPONENTS = [
  { key: "skin_condition_score", label: "Condition" },
  { key: "lifestyle_score", label: "Lifestyle" },
  { key: "routine_adherence_score", label: "Routine" },
  { key: "sleep_quality_score", label: "Sleep" },
  { key: "hydration_score", label: "Hydration" },
] as const;

interface ClientDetailViewProps {
  userId: string;
  backHref: string;
}

export function ClientDetailView({ userId, backHref }: ClientDetailViewProps) {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");

  const detailQuery = useQuery({
    queryKey: ["clinical-review", "client", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}", {
        params: { path: { user_id: userId } },
      });
      if (error) throw new Error("Couldn't load this client.");
      return data;
    },
  });

  const analyticsQuery = useQuery({
    queryKey: ["clinical-review", "client-analytics", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}/analytics", {
        params: { path: { user_id: userId } },
      });
      if (error) throw new Error("Couldn't load this client's progress timeline.");
      return data;
    },
  });
  const chartPoints = (analyticsQuery.data?.score_vs_adherence ?? []).map((p) => ({
    date: p.date,
    score: p.overall_score,
    adherence: p.adherence_ratio,
  }));

  const addNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await api.POST("/api/v1/clients/{user_id}/notes", {
        params: { path: { user_id: userId } },
        body: { note_text: text },
      });
      if (error) throw new Error("Couldn't save your note.");
    },
    onSuccess: () => {
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: ["clinical-review", "client", userId] });
    },
    onError: () => toast.error("Couldn't save your note."),
  });

  if (detailQuery.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <StateCard
        icon={TriangleAlert}
        tone="destructive"
        title="Couldn't load this client"
        description="They may not be assigned to you, or something went wrong."
        action={
          <Button variant="outline" onClick={() => detailQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const client = detailQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={
            <Link href={backHref}>
              <ArrowLeft className="size-4" strokeWidth={1.5} />
            </Link>
          }
        />
        <div>
          <h1 className="font-heading text-on-surface text-2xl font-bold">
            {client.name ?? client.email}
          </h1>
          <p className="text-on-surface-variant font-sans text-sm">{client.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-5">
          <h3 className="font-heading text-on-surface mb-4 text-lg font-semibold">
            Skin score
          </h3>
          {client.score ? (
            <>
              <div className="flex justify-center py-4">
                <SkinScoreRing score={client.score.overall_score ?? 0} size={180} />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {SCORE_COMPONENTS.map((c) => {
                  const value = client.score?.[c.key] ?? 0;
                  return (
                    <div key={c.key} className="flex flex-col gap-1">
                      <div className="flex items-end justify-between text-xs">
                        <span className="text-on-surface-variant font-geist font-semibold tracking-[0.05em] uppercase">
                          {c.label}
                        </span>
                        <span className="font-geist text-on-surface">{Math.round(value)}/100</span>
                      </div>
                      <Progress
                        value={Math.max(0, Math.min(100, value))}
                        trackClassName="h-1.5"
                        indicatorClassName="bg-secondary"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-on-surface-variant font-sans text-sm">
              No score yet — this client hasn&apos;t completed their skin assessment.
            </p>
          )}
        </div>

        <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-7">
          <h3 className="font-heading text-on-surface mb-4 text-lg font-semibold">
            Skin profile & routine
          </h3>
          {client.skin_profile ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-on-surface-variant font-geist text-xs uppercase">Age group</p>
                  <p className="font-sans">{client.skin_profile.age_group ?? "—"}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-geist text-xs uppercase">Allergies</p>
                  <p className="font-sans">{client.skin_profile.allergies ?? "None reported"}</p>
                </div>
              </div>
              <div className="border-border border-t pt-4">
                <p className="text-on-surface-variant font-geist mb-2 text-xs uppercase">
                  Routine compliance
                </p>
                <div className="flex flex-col gap-2">
                  {client.routines.map((routine) => {
                    const completed = routine.steps.filter((s) => s.completed_today).length;
                    return (
                      <div key={routine.routine_id} className="flex items-center justify-between text-sm">
                        <span>{routine.routine_name}</span>
                        <span className="font-geist tabular-nums">
                          {completed}/{routine.steps.length} today
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-on-surface-variant font-sans text-sm">
              No skin profile yet — this client hasn&apos;t completed their assessment.
            </p>
          )}
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-6">
        <h3 className="font-heading text-on-surface mb-4 text-lg font-semibold">
          Progress timeline
        </h3>
        <ScoreAdherenceChart
          state={widgetStateFor(analyticsQuery, chartPoints.length < 2)}
          onRetry={retryFor(analyticsQuery)}
          points={chartPoints}
          emptyMessage="Not enough history yet to chart this client's progress."
        />
      </div>

      <div className="border-border bg-card rounded-2xl border p-6">
        <h3 className="font-heading text-on-surface mb-4 text-lg font-semibold">Clinical notes</h3>
        <div className="mb-4 flex flex-col gap-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a clinical note..."
            rows={3}
          />
          <Button
            className="self-end"
            disabled={!noteText.trim() || addNoteMutation.isPending}
            onClick={() => addNoteMutation.mutate(noteText)}
          >
            {addNoteMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Send className="size-4" strokeWidth={1.5} />
            )}
            Add note
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {client.notes.length === 0 ? (
            <p className="text-on-surface-variant font-sans text-sm">No notes yet.</p>
          ) : (
            client.notes.map((note) => (
              <div key={note.note_id} className="border-border bg-muted/30 rounded-xl border p-3">
                <p className="font-sans text-sm">{note.note_text}</p>
                <p className="text-on-surface-variant mt-1 font-geist text-xs">
                  {note.created_at ? new Date(note.created_at).toLocaleString() : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
