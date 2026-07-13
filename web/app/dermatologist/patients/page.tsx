"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RotateCw, TriangleAlert } from "lucide-react";

import { ClientListTable } from "@/components/clinical-review/client-list-table";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

// web/designs/wireframes/derm-patients{,-dark}.html — same real table as
// Consultant's Clients screen (shared component, ClientListTable), different copy
// per role (docs/ARCHITECTURE.md §2). Dermatologist gets the same real data
// Consultant gets, not a thinner or fabricated version.
export default function DermatologistPatientsPage() {
  const router = useRouter();

  const clientsQuery = useQuery({
    queryKey: ["clinical-review", "my-clients"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/me");
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
          clients={clientsQuery.data ?? []}
          personLabel="Patients"
          onSelect={(userId) => router.push(`/dermatologist/patients/${userId}`)}
        />
      )}
    </div>
  );
}
