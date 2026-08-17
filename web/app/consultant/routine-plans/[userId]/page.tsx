"use client";

import { useParams } from "next/navigation";

import { ClientRoutinesView } from "@/components/clinical-review/client-routines-view";

export default function ConsultantRoutinePlansDetailPage() {
  const params = useParams<{ userId: string }>();
  return (
    <ClientRoutinesView
      userId={params.userId}
      backHref="/consultant/routine-plans"
      editHrefFor={(routineId) =>
        `/consultant/clients/${params.userId}/routines/${routineId}/edit`
      }
    />
  );
}
