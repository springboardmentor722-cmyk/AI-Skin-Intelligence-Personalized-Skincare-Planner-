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

// web/designs/wireframes/derm-patients{,-dark}.html — same real table as
// Consultant's Clients screen (shared component, ClientListTable), different copy
// per role (docs/ARCHITECTURE.md §2). Dermatologist gets the same real data
// Consultant gets, not a thinner or fabricated version.
export default function DermatologistPatientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const clientsQuery = useQuery({
    // M3R Phase 5 — rubric's "searchable list": search is now server-side
    // (GET /clients/me?q=), so the debounced term is part of the query key.
    queryKey: ["clinical-review", "clients", debouncedSearch, 1],
    queryFn: async () => {
      // Production-readiness audit: GET /clients/me is now paginated (a busy
      // professional's real patient list can grow into the hundreds) — this page
      // consumes only the first page's .items for now, same minimal-integration
      // level as the admin verification queue's own paginated response (no page-
      // switching UI built yet there either).
      const { data, error } = await api.GET("/api/v1/clients/me", {
        params: { query: { q: debouncedSearch || undefined } },
      });
      if (error) throw new Error("Couldn't load your patients.");
      return data;
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Patients</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Your assigned patients&apos; real skin profile, score, and routine data.
        </p>
      </div>

      {clientsQuery.isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : clientsQuery.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't load your patients."
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
          onSelect={(userId) => router.push(`/dermatologist/patients/${userId}`)}
          search={search}
          onSearchChange={setSearch}
          hasAssignments={debouncedSearch !== "" || (clientsQuery.data?.meta.total ?? 0) > 0}
        />
      )}
    </div>
  );
}
