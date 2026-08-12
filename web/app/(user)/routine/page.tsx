"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CalendarDays,
  FlaskConical,
  Leaf,
  Moon,
  Pencil,
  RotateCw,
  Sparkles,
  Sun,
  TriangleAlert,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useToggleRoutineStep } from "@/lib/hooks/use-toggle-routine-step";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api-types";

type RoutineRead = components["schemas"]["RoutineRead"];
type RoutineStepRead = components["schemas"]["RoutineStepRead"];
type RoutineType = "AM" | "PM" | "Weekly" | "Seasonal";

// web/designs/wireframes/app-routine{,-dark}.html — the "My Routine" screen
// (web/lib/nav-config.ts's own "My Routine" entry, previously built: false).
// Reuses this app's real AppShell/tokens, not the wireframe's own raw sidebar/topbar
// markup (docs/WIREFRAMES.md: "the wireframe HTML's sidebar text is not binding").
// Two things in the raw wireframe are deliberately NOT reproduced here, same
// "raw exports never ship" precedent the Dashboard already established for its own
// wireframe's undocumented, no-backing-data modules:
//   - The wireframe's "Regenerate with AI" button — no such regeneration action
//     exists ("Edit routine" itself is real, routine/edit/[routineId]/page.tsx). The
//     wireframe's own Seasonal banner copy ("winter adjustments ready...") was
//     fabricated too, but a real seasonal routine now exists (backend
//     routines/service.py, quarter-based: Winter/Spring/Summer/Fall by calendar
//     month) — its tab below renders that real data, not the wireframe's copy.
//   - The wireframe's PM tab content is a literal unfinished placeholder ("PM Routine
//     details are loading..."). The real PM tab renders real step cards, same as AM.
const CORE_TABS: { type: "AM" | "PM" | "Weekly"; label: string; icon: typeof Sun }[] = [
  { type: "AM", label: "AM Routine", icon: Sun },
  { type: "PM", label: "PM Routine", icon: Moon },
  { type: "Weekly", label: "Weekly Care", icon: CalendarDays },
];

function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={className ?? "h-64 w-full rounded-2xl"} />;
}

function CardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <StateCard
      tone="destructive"
      icon={TriangleAlert}
      description={message}
      action={
        <Button variant="outline" onClick={onRetry}>
          <RotateCw className="size-4" strokeWidth={1.5} />
          Retry
        </Button>
      }
    />
  );
}

function RoutineStepCard({ step, order }: { step: RoutineStepRead; order: number }) {
  const toggleMutation = useToggleRoutineStep();
  const product = step.products[0]?.product;

  return (
    <div className="border-border bg-card flex gap-6 rounded-2xl border p-6">
      <div className="border-border bg-muted flex size-10 shrink-0 items-center justify-center rounded-full border font-geist text-lg">
        {order}
      </div>
      <div className="border-border bg-muted size-24 shrink-0 overflow-hidden rounded-xl border">
        {product?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- seeded/external product photos, not part of the Next.js image pipeline
          <img
            src={product.image_url}
            alt={product.product_name ?? "Product"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-on-surface-variant/40 flex h-full w-full items-center justify-center">
            <FlaskConical className="size-8" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="bg-secondary/10 text-secondary mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold">
              {step.step_name}
            </span>
            <h4 className="font-heading text-on-surface text-lg font-semibold">
              {product?.product_name ?? "No product available"}
            </h4>
          </div>
          <div className="flex items-center gap-3">
            {step.duration_minutes != null && (
              <span className="font-geist text-on-surface-variant text-sm">
                {step.duration_minutes} min
              </span>
            )}
            <Checkbox
              checked={step.completed_today}
              onCheckedChange={() =>
                toggleMutation.mutate({ stepId: step.step_id, completed: !step.completed_today })
              }
              className="size-5 rounded-full"
            />
          </div>
        </div>
        {step.instruction && (
          <Accordion className="gap-0">
            <AccordionItem value={`step-${step.step_id}`} className="border-none">
              <AccordionTrigger className="text-secondary p-0 text-sm font-semibold no-underline hover:no-underline">
                Instructions
              </AccordionTrigger>
              <AccordionContent className="text-on-surface-variant font-sans text-sm">
                {step.instruction}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
}

function RoutineTabPanel({ routine }: { routine: RoutineRead | undefined }) {
  if (!routine || routine.steps.length === 0) {
    return (
      <p className="text-on-surface-variant font-sans text-sm">
        No steps yet for this routine.
      </p>
    );
  }
  const estimatedMinutes = routine.steps.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-on-surface-variant font-geist text-sm">
          Estimated time:{" "}
          <span className="text-on-surface font-semibold">{estimatedMinutes} min</span>
        </p>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`/routine/edit/${routine.routine_id}`}>
              <Pencil className="size-4" strokeWidth={1.5} />
              Edit routine
            </Link>
          }
        />
      </div>
      {routine.steps.map((step, i) => (
        <RoutineStepCard key={step.step_id} step={step} order={i + 1} />
      ))}
    </div>
  );
}

export default function MyRoutinePage() {
  const [activeTab, setActiveTab] = useState<RoutineType>("AM");

  const routinesQuery = useQuery({
    queryKey: ["routines", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/routine");
      return data ?? [];
    },
  });

  const routines = routinesQuery.data ?? [];
  const totalSteps = routines.reduce((sum, r) => sum + r.steps.length, 0);
  const seasonalRoutine = routines.find((r) => r.routine_type === "Seasonal");
  // Seasonal's label is real backend data (e.g. "Winter Care", quarter-based —
  // routines/service.py::_current_season), not a hardcoded string, since which
  // season is current changes over the year.
  const tabs = [
    ...CORE_TABS,
    ...(seasonalRoutine
      ? [{ type: "Seasonal" as const, label: seasonalRoutine.routine_name ?? "Seasonal Care", icon: Leaf }]
      : []),
  ];

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">My Routine</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          {totalSteps > 0
            ? `Personalized morning, evening, weekly, and seasonal care — ${totalSteps} steps in total.`
            : "Your personalized routine, generated from your skin profile."}
        </p>
      </div>

      {routinesQuery.isLoading ? (
        <CardSkeleton className="h-96 w-full rounded-2xl" />
      ) : routinesQuery.isError ? (
        <CardError message="Couldn't load your routine." onRetry={() => routinesQuery.refetch()} />
      ) : routines.length === 0 ? (
        <StateCard
          icon={Sparkles}
          title="Complete your skin profile to unlock your routine"
          description="Your AM, PM, and weekly care steps are generated from your skin profile — set it up to get started."
          action={
            <Button nativeButton={false} render={<Link href="/profile">Complete skin profile</Link>} />
          }
        />
      ) : (
        <div>
          <div className="border-border mb-6 flex gap-8 overflow-x-auto border-b">
            {tabs.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={cn(
                  "flex shrink-0 items-center gap-2 pb-4 font-sans text-lg font-semibold transition-colors",
                  activeTab === type
                    ? "text-secondary border-secondary border-b-2"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <Icon className="size-5" strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
          <RoutineTabPanel routine={routines.find((r) => r.routine_type === activeTab)} />
        </div>
      )}
    </div>
  );
}
