"use client";

import { useParams } from "next/navigation";

import { ClientAssessmentsView } from "@/components/clinical-review/client-assessments-view";

export default function DermatologistAssessmentDetailPage() {
  const params = useParams<{ userId: string }>();
  return <ClientAssessmentsView userId={params.userId} backHref="/dermatologist/assessments" />;
}
