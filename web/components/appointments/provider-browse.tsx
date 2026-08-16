"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useProvidersQuery } from "@/lib/hooks/use-appointments";

interface ProviderBrowseProps {
  onSelectProvider: (providerId: string, role: "consultant" | "dermatologist") => void;
}

export function ProviderBrowse({ onSelectProvider }: ProviderBrowseProps) {
  const [role, setRole] = useState<"consultant" | "dermatologist">("consultant");
  const [search, setSearch] = useState("");
  const providersQuery = useProvidersQuery(role);

  const filtered = (providersQuery.data ?? []).filter((p) =>
    (p.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          value={[role]}
          onValueChange={(next) => next[0] && setRole(next[0] as "consultant" | "dermatologist")}
          className="bg-muted rounded-full p-1"
        >
          <ToggleGroupItem value="consultant" className="rounded-full px-3 py-1.5 text-xs font-bold">
            Consultants
          </ToggleGroupItem>
          <ToggleGroupItem value="dermatologist" className="rounded-full px-3 py-1.5 text-xs font-bold">
            Dermatologists
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="border-border bg-muted flex flex-1 items-center gap-2 rounded-full border px-3 py-2">
          <Search className="text-on-surface-variant size-4" strokeWidth={1.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="w-full bg-transparent font-sans text-sm outline-none"
          />
        </div>
      </div>

      {providersQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <StateCard icon={Search} description="No providers found." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((provider) => (
            <button
              key={provider.provider_id}
              type="button"
              onClick={() => onSelectProvider(provider.provider_id, role)}
              className="border-border bg-card hover:bg-muted flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors"
            >
              <p className="font-sans text-sm font-semibold">{provider.name ?? "Provider"}</p>
              {provider.years_experience !== null && (
                <p className="text-on-surface-variant font-sans text-xs">
                  {provider.years_experience} years experience
                </p>
              )}
              {provider.biography && (
                <p className="text-on-surface-variant line-clamp-2 font-sans text-xs">
                  {provider.biography}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
