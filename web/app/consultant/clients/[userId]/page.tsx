"use client";

import { useParams } from "next/navigation";

import { ClientDetailView } from "@/components/clinical-review/client-detail-view";

export default function ConsultantClientDetailPage() {
  const params = useParams<{ userId: string }>();
  return <ClientDetailView userId={params.userId} backHref="/consultant/clients" />;
}
