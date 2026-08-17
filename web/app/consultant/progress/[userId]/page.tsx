"use client";

import { useParams } from "next/navigation";

import { ClientProgressView } from "@/components/clinical-review/client-progress-view";

export default function ConsultantProgressDetailPage() {
  const params = useParams<{ userId: string }>();
  return <ClientProgressView userId={params.userId} backHref="/consultant/progress" />;
}
