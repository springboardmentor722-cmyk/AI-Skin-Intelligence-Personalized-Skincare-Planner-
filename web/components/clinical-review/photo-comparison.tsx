"use client";

import { useQuery } from "@tanstack/react-query";
import { Camera, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type ProgressPhotoRead = components["schemas"]["ProgressPhotoRead"];

interface PhotoComparisonProps {
  userId: string;
}

// web/designs/wireframes/derm-patient-detail.html's "Clinical Photos" card
// (diagnostic-card, 2-col grid, aspect-square) is the layout source — the
// wireframe's own photos are fabricated stock images with no backing table, so
// only the layout carries over. The before/after pair itself is decided
// server-side (progress_service.get_progress_photos — oldest vs most recent
// real upload), so this component only renders what the backend already
// picked, never a selector.
function PhotoCaption({ photo }: { photo: ProgressPhotoRead }) {
  return (
    <div className="mt-2 flex flex-col gap-0.5">
      <p className="font-geist text-on-surface text-xs font-semibold tracking-[0.05em] uppercase">
        {photo.image_stage ?? "Untagged"}
      </p>
      <p className="text-on-surface-variant font-sans text-xs">
        {new Date(photo.uploaded_at).toLocaleDateString()}
        {photo.skin_health_score_at_upload !== null &&
          ` · Score ${Math.round(photo.skin_health_score_at_upload)}`}
      </p>
    </div>
  );
}

export function PhotoComparison({ userId }: PhotoComparisonProps) {
  const photosQuery = useQuery({
    queryKey: ["clinical-review", "client-photos", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}/photos", {
        params: { path: { user_id: userId } },
      });
      if (error) throw new Error("Couldn't load this client's progress photos.");
      return data;
    },
  });

  if (photosQuery.isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }
  if (photosQuery.isError || !photosQuery.data) {
    return (
      <StateCard
        icon={TriangleAlert}
        tone="destructive"
        description="Couldn't load this client's progress photos."
        action={
          <Button variant="outline" onClick={() => photosQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const { before, after } = photosQuery.data;

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h3 className="font-heading text-on-surface mb-4 text-lg font-semibold">
        Baseline vs Current
      </h3>
      {!before ? (
        <StateCard icon={Camera} description="No progress photos yet." />
      ) : (
        <div className={`grid grid-cols-1 gap-4 ${after ? "sm:grid-cols-2" : ""}`}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- client-uploaded, presigned URL */}
            <img
              src={before.url}
              alt="Baseline progress photo"
              className="bg-muted aspect-square w-full rounded-lg object-cover"
            />
            <PhotoCaption photo={before} />
          </div>
          {after && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element -- client-uploaded, presigned URL */}
              <img
                src={after.url}
                alt="Current progress photo"
                className="bg-muted aspect-square w-full rounded-lg object-cover"
              />
              <PhotoCaption photo={after} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
