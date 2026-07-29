"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import { RoutineEditor } from "@/components/routine-editor/routine-editor";
import { api } from "@/lib/api";

// web/designs/wireframes/app-routine-edit{,-dark}.html — real content is built in
// the shared RoutineEditor (web/components/routine-editor/routine-editor.tsx,
// extracted M3R Phase 5 Task 5 so the professional edit screen reuses it without
// duplication). This page is just the user's own data-fetch + not-found handling.
export default function EditRoutinePage() {
  const params = useParams<{ routineId: string }>();
  const routineId = Number(params.routineId);

  const routinesQuery = useQuery({
    queryKey: ["routines", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/routine");
      return data ?? [];
    },
  });
  const routine = routinesQuery.data?.find((r) => r.routine_id === routineId);

  if (routinesQuery.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }
  if (!routine) {
    return (
      <StateCard
        icon={TriangleAlert}
        title="Routine not found"
        description="This routine doesn't exist or isn't yours."
        action={<Button nativeButton={false} render={<Link href="/routine">Back to My Routine</Link>} />}
      />
    );
  }

  return <RoutineEditor routine={routine} backHref="/routine" />;
}
