"use client";

import { useParams } from "next/navigation";

import { ClientReportsView } from "@/components/clinical-review/client-reports-view";

export default function ConsultantReportsDetailPage() {
  const params = useParams<{ userId: string }>();
  return <ClientReportsView userId={params.userId} backHref="/consultant/reports" />;
}
