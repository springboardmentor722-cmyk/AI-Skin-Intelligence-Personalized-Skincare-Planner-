"use client";

import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";

import { RoutineEditor } from "@/components/routine-editor/routine-editor";
import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

// M3R Phase 5 Task 5 — the consultant/dermatologist counterpart of
// web/app/(user)/routine/edit/[routineId]/page.tsx, reusing the same shared
// RoutineEditor. Shares ClientDetailView's own query key
// (["clinical-review", "client", userId]) so a save here invalidates the exact
// cache the client-detail page reads from. Follows client-detail-view.tsx's
// pattern of one component rendered by two thin per-role page files
// (consultant/, dermatologist/ — each a real folder per AGENTS.md §4).
interface ProfessionalRoutineEditViewProps {
  userId: string;
  routineId: number;
  /** The client detail page URL to link back to / redirect to after a save. */
  backHref: string;
}

export function ProfessionalRoutineEditView({
  userId,
  routineId,
  backHref,
}: ProfessionalRoutineEditViewProps) {
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

  const routine = detailQuery.data.routines.find((r) => r.routine_id === routineId);
  if (!routine) {
    return (
      <StateCard
        icon={TriangleAlert}
        title="Routine not found"
        description="This client doesn't have a routine with that id."
      />
    );
  }

  return <RoutineEditor routine={routine} backHref={backHref} clientUserId={userId} />;
}
