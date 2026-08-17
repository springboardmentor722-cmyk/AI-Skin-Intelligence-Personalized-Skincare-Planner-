"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ClipboardList, Copy, Loader2, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type RoutineRead = components["schemas"]["RoutineRead"];

interface ClientRoutinesViewProps {
  userId: string;
  backHref: string;
  editHrefFor: (routineId: number) => string;
}

export function ClientRoutinesView({ userId, backHref, editHrefFor }: ClientRoutinesViewProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [description, setDescription] = useState("");

  const clientQuery = useQuery({
    queryKey: ["clinical-review", "client", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}", {
        params: { path: { user_id: userId } },
      });
      if (error) throw new Error("Couldn't load client.");
      return data;
    },
  });

  const routinesQuery = useQuery({
    queryKey: ["clinical-review", "routines", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}/routines", {
        params: { path: { user_id: userId } },
      });
      if (error) throw new Error("Couldn't load routines.");
      return data;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["clinical-review", "routines", userId] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST("/api/v1/clients/{user_id}/routines", {
        params: { path: { user_id: userId } },
        body: { routine_name: routineName, routine_type: "Custom", description: description || null },
      });
      if (error) throw new Error("Couldn't create routine.");
    },
    onSuccess: () => {
      toast.success("Routine created");
      setCreateOpen(false);
      setRoutineName("");
      setDescription("");
      invalidate();
    },
    onError: () => toast.error("Couldn't create routine."),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (routineId: number) => {
      const { error } = await api.POST("/api/v1/clients/{user_id}/routines/{routine_id}/duplicate", {
        params: { path: { user_id: userId, routine_id: routineId } },
      });
      if (error) throw new Error("Couldn't duplicate routine.");
    },
    onSuccess: () => {
      toast.success("Routine duplicated");
      invalidate();
    },
    onError: () => toast.error("Couldn't duplicate routine."),
  });

  const activeMutation = useMutation({
    mutationFn: async ({ routineId, isActive }: { routineId: number; isActive: boolean }) => {
      const { error } = await api.PATCH("/api/v1/clients/{user_id}/routines/{routine_id}", {
        params: { path: { user_id: userId, routine_id: routineId } },
        body: { is_active: isActive },
      });
      if (error) throw new Error("Couldn't update routine.");
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error("Couldn't update routine."),
  });

  if (clientQuery.isLoading || routinesQuery.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }
  if (clientQuery.isError || routinesQuery.isError || !clientQuery.data) {
    return (
      <StateCard
        tone="destructive"
        icon={TriangleAlert}
        title="Unable to load routine plans"
        description="This client may not be assigned to you, or something went wrong."
        action={
          <Button variant="outline" onClick={() => routinesQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const client = clientQuery.data;
  const routines: RoutineRead[] = routinesQuery.data ?? [];
  const aiRoutines = routines.filter((r) => r.created_by_professional_id == null);
  const customRoutines = routines.filter((r) => r.created_by_professional_id != null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Back
          </Link>
          <div>
            <h1 className="font-heading text-on-surface text-2xl font-bold">
              {client.name ?? client.email} — Routine plans
            </h1>
            <p className="text-on-surface-variant font-sans text-sm">{client.email}</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" strokeWidth={1.5} />
          Create routine
        </Button>
      </div>

      {routines.length === 0 ? (
        <StateCard icon={ClipboardList} description="No routine plans yet." />
      ) : (
        <>
          <RoutineSection
            title="AI-generated"
            routines={aiRoutines}
            editHrefFor={editHrefFor}
            onDuplicate={(id) => duplicateMutation.mutate(id)}
            duplicatePending={duplicateMutation.isPending}
          />
          <RoutineSection
            title="Consultant-created"
            routines={customRoutines}
            editHrefFor={editHrefFor}
            onDuplicate={(id) => duplicateMutation.mutate(id)}
            duplicatePending={duplicateMutation.isPending}
            onToggleActive={(id, isActive) => activeMutation.mutate({ routineId: id, isActive })}
            togglePending={activeMutation.isPending}
            emptyMessage="No consultant-authored routines yet — create one or duplicate an AI-generated routine to customize it."
          />
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create routine</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="Routine name"
              aria-label="Routine name"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!routineName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoutineSection({
  title,
  routines,
  editHrefFor,
  onDuplicate,
  duplicatePending,
  onToggleActive,
  togglePending,
  emptyMessage,
}: {
  title: string;
  routines: RoutineRead[];
  editHrefFor: (routineId: number) => string;
  onDuplicate: (routineId: number) => void;
  duplicatePending: boolean;
  onToggleActive?: (routineId: number, isActive: boolean) => void;
  togglePending?: boolean;
  emptyMessage?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-on-surface text-lg font-semibold">{title}</h2>
      {routines.length === 0 ? (
        <p className="text-on-surface-variant font-sans text-sm">
          {emptyMessage ?? "None."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {routines.map((routine) => (
            <div key={routine.routine_id} className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-sans text-sm font-semibold">{routine.routine_name}</p>
                  <p className="text-on-surface-variant text-xs">{routine.routine_type}</p>
                </div>
                <Badge variant={routine.created_by_professional_id == null ? "secondary" : "default"}>
                  {routine.created_by_professional_id == null ? "AI Generated" : "Consultant Created"}
                </Badge>
              </div>
              {routine.description && (
                <p className="text-on-surface-variant font-sans text-xs">{routine.description}</p>
              )}
              <p className="text-on-surface-variant font-geist text-xs tabular-nums">
                {routine.steps.length} step{routine.steps.length === 1 ? "" : "s"} ·{" "}
                {routine.is_active ? "Active" : "Inactive"}
                {routine.updated_at && ` · Updated ${new Date(routine.updated_at).toLocaleDateString()}`}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <Link
                  href={editHrefFor(routine.routine_id)}
                  className="text-secondary font-sans text-sm font-medium hover:underline"
                >
                  Edit steps
                </Link>
                <div className="flex items-center gap-3">
                  {onToggleActive && (
                    <Switch
                      checked={routine.is_active ?? false}
                      disabled={togglePending}
                      onCheckedChange={(checked) => onToggleActive(routine.routine_id, checked)}
                      aria-label={routine.is_active ? "Deactivate routine" : "Activate routine"}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={duplicatePending}
                    onClick={() => onDuplicate(routine.routine_id)}
                    aria-label="Duplicate routine"
                  >
                    <Copy className="size-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
