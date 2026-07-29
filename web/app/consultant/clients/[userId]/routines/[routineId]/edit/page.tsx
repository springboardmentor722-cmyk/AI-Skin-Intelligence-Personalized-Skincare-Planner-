"use client";

import { useParams } from "next/navigation";

import { ProfessionalRoutineEditView } from "@/components/clinical-review/professional-routine-edit-view";

export default function ConsultantRoutineEditPage() {
  const params = useParams<{ userId: string; routineId: string }>();
  return (
    <ProfessionalRoutineEditView
      userId={params.userId}
      routineId={Number(params.routineId)}
      backHref={`/consultant/clients/${params.userId}`}
    />
  );
}
