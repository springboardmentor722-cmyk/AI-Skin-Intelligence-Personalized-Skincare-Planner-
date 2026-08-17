"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RotateCw, TriangleAlert } from "lucide-react";

import { ClientListTable } from "@/components/clinical-review/client-list-table";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

// Same roster + ClientListTable as Patients/Assessments/Progress — pick a
// patient, then generate/view their PDF reports.
export default function DermatologistReportsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const clientsQuery = useQuery({
    queryKey: ["clinical-review", "reports-roster", debouncedSearch],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/me", {
        params: { query: { q: debouncedSearch || undefined } },
      });
      if (error) throw new Error("Couldn't load patients.");
      return data;
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Reports</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Clinical reports & analytics.
        </p>
      </div>

      {clientsQuery.isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : clientsQuery.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Unable to load your patients."
          action={
            <Button variant="outline" onClick={() => clientsQuery.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : (
        <ClientListTable
          clients={clientsQuery.data?.items ?? []}
          personLabel="Patients"
          onSelect={(userId) => router.push(`/dermatologist/reports/${userId}`)}
          search={search}
          onSearchChange={setSearch}
          hasAssignments={debouncedSearch !== "" || (clientsQuery.data?.meta.total ?? 0) > 0}
        />
      )}
    </div>
  );
}
