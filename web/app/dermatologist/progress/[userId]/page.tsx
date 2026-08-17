"use client";

import { useParams } from "next/navigation";

import { ClientProgressView } from "@/components/clinical-review/client-progress-view";

export default function DermatologistProgressDetailPage() {
  const params = useParams<{ userId: string }>();
  return <ClientProgressView userId={params.userId} backHref="/dermatologist/progress" />;
}
