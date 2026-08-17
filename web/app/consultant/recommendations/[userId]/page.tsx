"use client";

import { useParams } from "next/navigation";

import { ClientRecommendationsView } from "@/components/clinical-review/client-recommendations-view";

export default function ConsultantRecommendationsDetailPage() {
  const params = useParams<{ userId: string }>();
  return <ClientRecommendationsView userId={params.userId} backHref="/consultant/recommendations" />;
}
