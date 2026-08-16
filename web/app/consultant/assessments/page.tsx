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

// Reuses the exact same GET /clients/me roster + ClientListTable as the Clients
// page (ClientSummaryRead already carries skin type, skin score, primary concern,
// trend, last sync — the columns this page needs), framed as an assessment
// worklist. Row click goes to the assessment-history detail view (new route)
// rather than the client profile page — a distinct focused surface for
// "open assessment details / view history / compare", not a duplicate of
// /consultant/clients/[userId] (AGENTS.md §13).
export default function ConsultantAssessmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const clientsQuery = useQuery({
    queryKey: ["clinical-review", "assessments-roster", debouncedSearch],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/me", {
        params: { query: { q: debouncedSearch || undefined } },
      });
      if (error) throw new Error("Couldn't load assessments.");
      return data;
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Assessments</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Latest skin health score per assigned client. Open a client to see full assessment
          history and compare past results.
        </p>
      </div>

      {clientsQuery.isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : clientsQuery.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Unable to load assessments."
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
          personLabel="Clients"
          onSelect={(userId) => router.push(`/consultant/assessments/${userId}`)}
          search={search}
          onSearchChange={setSearch}
          hasAssignments={debouncedSearch !== "" || (clientsQuery.data?.meta.total ?? 0) > 0}
        />
      )}
    </div>
  );
}
