"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api-types";

type RoutineRead = components["schemas"]["RoutineRead"];
type ProductRead = components["schemas"]["ProductRead"];

const CATEGORIES = ["Cleanser", "Treatment", "Moisturizer", "Sunscreen"];

// web/designs/wireframes/app-routine-edit{,-dark}.html — the deferred half of the
// My Routine screen. Real AppShell (not the wireframe's own raw sidebar/topbar),
// real edits only: reorder (up/down move, not the wireframe's drag-and-drop — no
// drag library exists yet, per the scoping decision), add/delete a step, swap a
// step's product (a real search — recommendations_service.list_products_for_skin_type
// + the ingredient_skintype_avoid safety filter, not the wireframe's invented "98%/
// 92%/85% Match" percentages), and usage notes (routine_products.usage_notes
// already existed, was read but never written until now). The wireframe's
// "Interaction Conflict" banner and "AI Prediction: Barrier Health" chart are
// deliberately NOT built — no ingredient-interaction table or predictive model
// exists anywhere in this repo; both would be fabricated clinical-sounding output,
// exactly what AGENTS.md §4 warns against.

interface EditableStep {
  key: string;
  stepId: number | null; // null until this new step is actually saved
  stepName: string;
  productId: number;
  productName: string;
  usageNotes: string;
  isNew: boolean;
}

function toEditableSteps(routine: RoutineRead): EditableStep[] {
  return routine.steps.map((step) => ({
    key: String(step.step_id),
    stepId: step.step_id,
    stepName: step.step_name ?? "",
    productId: step.products[0]?.product.product_id ?? 0,
    productName: step.products[0]?.product.product_name ?? "No product",
    usageNotes: step.products[0]?.usage_notes ?? "",
    isNew: false,
  }));
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function ProductPicker({
  category,
  onPick,
}: {
  category: string;
  onPick: (product: ProductRead) => void;
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const searchQuery = useQuery({
    queryKey: ["routine-product-search", category, debouncedQuery],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/routines/products/search", {
        params: { query: { category, q: debouncedQuery } },
      });
      return data ?? [];
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="border-input bg-background focus:border-secondary w-full rounded-xl border-2 px-4 py-2.5 text-sm outline-none"
      />
      <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
        {searchQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (searchQuery.data ?? []).length === 0 ? (
          <p className="text-on-surface-variant font-sans text-xs">
            No safe matches found for your skin type.
          </p>
        ) : (
          (searchQuery.data ?? []).map((product) => (
            <button
              key={product.product_id}
              type="button"
              onClick={() => onPick(product)}
              className="hover:bg-muted flex items-center gap-3 rounded-lg p-2 text-left transition-colors"
            >
              <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded">
                <FlaskConical className="text-on-surface-variant/40 size-4" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-sans text-sm font-medium">{product.product_name}</p>
                <p className="text-on-surface-variant text-xs">{product.brand_name}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function EditRoutinePage() {
  const params = useParams<{ routineId: string }>();
  const routineId = Number(params.routineId);
  const router = useRouter();
  const queryClient = useQueryClient();

  const routinesQuery = useQuery({
    queryKey: ["routines", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/routine");
      return data ?? [];
    },
  });
  const routine = routinesQuery.data?.find((r) => r.routine_id === routineId);

  const [steps, setSteps] = useState<EditableStep[]>([]);
  const [deletedStepIds, setDeletedStepIds] = useState<number[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // "Adjusting state when a prop changes" (React docs), not an effect — local edits
  // shouldn't be clobbered by a background refetch while the user is mid-edit, but
  // the first time this routine_id loads (or changes), local state must sync from
  // the real server data. Setting state directly in the render body during a
  // render where the id actually changed is the documented way to do this without
  // the extra render+flicker an effect-based sync would cause.
  const [syncedRoutineId, setSyncedRoutineId] = useState<number | null>(null);
  if (routine && routine.routine_id !== syncedRoutineId) {
    setSyncedRoutineId(routine.routine_id);
    setSteps(toEditableSteps(routine));
    setDeletedStepIds([]);
    setSelectedKey(null);
  }

  const isDirty = useMemo(() => {
    if (!routine) return false;
    if (deletedStepIds.length > 0) return true;
    if (steps.some((s) => s.isNew)) return true;
    const original = toEditableSteps(routine);
    if (original.length !== steps.length) return true;
    return steps.some((s, i) => {
      const o = original[i];
      return !o || o.stepId !== s.stepId || o.productId !== s.productId || o.usageNotes !== s.usageNotes || o.stepName !== s.stepName;
    });
  }, [routine, steps, deletedStepIds]);

  const selectedStep = steps.find((s) => s.key === selectedKey) ?? null;

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeStep = (key: string) => {
    const step = steps.find((s) => s.key === key);
    if (step?.stepId != null) setDeletedStepIds((prev) => [...prev, step.stepId!]);
    setSteps((prev) => prev.filter((s) => s.key !== key));
    if (selectedKey === key) setSelectedKey(null);
  };

  const addStep = (category: string, product: ProductRead) => {
    const key = `new-${Date.now()}`;
    setSteps((prev) => [
      ...prev,
      {
        key,
        stepId: null,
        stepName: category,
        productId: product.product_id,
        productName: product.product_name ?? "Product",
        usageNotes: "",
        isNew: true,
      },
    ]);
    setAddingCategory(null);
    setSelectedKey(key);
  };

  const updateSelected = (patch: Partial<EditableStep>) => {
    if (!selectedKey) return;
    setSteps((prev) => prev.map((s) => (s.key === selectedKey ? { ...s, ...patch } : s)));
  };

  const discard = () => {
    if (routine) {
      setSteps(toEditableSteps(routine));
      setDeletedStepIds([]);
      setSelectedKey(null);
    }
  };

  const save = async () => {
    if (!routine) return;
    setIsSaving(true);
    try {
      for (const stepId of deletedStepIds) {
        await api.DELETE("/api/v1/routines/steps/{step_id}", {
          params: { path: { step_id: stepId } },
        });
      }

      const existingSteps = steps.filter((s) => !s.isNew);
      const original = toEditableSteps(routine);
      for (const step of existingSteps) {
        const originalStep = original.find((o) => o.stepId === step.stepId);
        if (
          originalStep &&
          (originalStep.productId !== step.productId ||
            originalStep.usageNotes !== step.usageNotes ||
            originalStep.stepName !== step.stepName)
        ) {
          const { error } = await api.PATCH("/api/v1/routines/steps/{step_id}", {
            params: { path: { step_id: step.stepId! } },
            body: {
              step_name: step.stepName,
              product_id: step.productId,
              usage_notes: step.usageNotes,
            },
          });
          if (error) throw new Error("Couldn't save one of your product changes.");
        }
      }

      const originalOrder = original.map((s) => s.stepId).filter((id): id is number => id != null);
      const newOrder = existingSteps.map((s) => s.stepId!).filter((id) => !deletedStepIds.includes(id));
      const orderChanged = JSON.stringify(originalOrder.filter((id) => newOrder.includes(id))) !== JSON.stringify(newOrder);
      if (orderChanged && newOrder.length > 0) {
        const { error } = await api.PATCH("/api/v1/routines/{routine_id}/steps/reorder", {
          params: { path: { routine_id: routineId } },
          body: { step_ids: newOrder },
        });
        if (error) throw new Error("Couldn't save the new step order.");
      }

      for (const step of steps.filter((s) => s.isNew)) {
        const { error } = await api.POST("/api/v1/routines/{routine_id}/steps", {
          params: { path: { routine_id: routineId } },
          body: { step_name: step.stepName, product_id: step.productId },
        });
        if (error) throw new Error("Couldn't add your new step.");
      }

      await queryClient.invalidateQueries({ queryKey: ["routines", "me"] });
      toast.success("Routine updated");
      router.push("/routine");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (routinesQuery.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }
  if (!routine) {
    return (
      <StateCard
        icon={TriangleAlert}
        title="Routine not found"
        description="This routine doesn't exist or isn't yours."
        action={<Button nativeButton={false} render={<Link href="/routine">Back to My Routine</Link>} />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/routine" />}>
          <ArrowLeft className="size-4" strokeWidth={1.5} />
        </Button>
        <h1 className="font-heading text-on-surface text-2xl font-bold">
          Edit {routine.routine_name}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
              Steps
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddingCategory(addingCategory ? null : CATEGORIES[0])}
            >
              <Plus className="size-4" strokeWidth={1.5} />
              Add Step
            </Button>
          </div>

          {addingCategory && (
            <div className="border-border bg-card mb-3 flex flex-col gap-3 rounded-2xl border p-4">
              <Select value={addingCategory} onValueChange={setAddingCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ProductPicker
                category={addingCategory}
                onPick={(product) => addStep(addingCategory, product)}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              // A <div> with role="button", not a real <button> — the up/down/delete
              // controls below are real buttons, and a <button> can't contain another
              // <button> (invalid HTML, caused a real hydration error — found live,
              // not by inspection: "In HTML, <button> cannot be a descendant of
              // <button>").
              <div
                key={step.key}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedKey(step.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedKey(step.key);
                  }
                }}
                className={cn(
                  "border-border bg-card flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                  selectedKey === step.key && "border-secondary border-2"
                )}
              >
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex flex-col">
                    <span className="bg-muted text-on-surface-variant w-fit rounded px-1.5 py-0.5 text-[10px] font-bold uppercase">
                      Step {i + 1}
                    </span>
                    <h4 className="font-heading text-on-surface font-semibold">
                      {step.stepName}
                    </h4>
                    <p className="text-on-surface-variant text-xs italic">{step.productName}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveStep(i, -1);
                    }}
                    className="text-on-surface-variant/50 hover:text-on-surface disabled:opacity-20"
                  >
                    <ChevronUp className="size-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    disabled={i === steps.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveStep(i, 1);
                    }}
                    className="text-on-surface-variant/50 hover:text-on-surface disabled:opacity-20"
                  >
                    <ChevronDown className="size-4" strokeWidth={1.5} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStep(step.key);
                  }}
                  className="text-destructive/40 hover:text-destructive"
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7">
          {selectedStep ? (
            <div className="border-border bg-card flex flex-col gap-6 rounded-2xl border p-6">
              <div>
                <label className="font-geist text-on-surface-variant mb-2 block text-xs font-semibold tracking-[0.05em] uppercase">
                  Category
                </label>
                <Select
                  value={selectedStep.stepName}
                  onValueChange={(v) => updateSelected({ stepName: v ?? "" })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-geist text-on-surface-variant mb-2 block text-xs font-semibold tracking-[0.05em] uppercase">
                  Current product
                </label>
                <p className="font-sans text-sm">{selectedStep.productName}</p>
              </div>

              <div>
                <label className="font-geist text-on-surface-variant mb-2 block text-xs font-semibold tracking-[0.05em] uppercase">
                  Swap product
                </label>
                <ProductPicker
                  category={selectedStep.stepName}
                  onPick={(product) =>
                    updateSelected({
                      productId: product.product_id,
                      productName: product.product_name ?? "Product",
                    })
                  }
                />
              </div>

              <div>
                <label className="font-geist text-on-surface-variant mb-2 block text-xs font-semibold tracking-[0.05em] uppercase">
                  Usage notes
                </label>
                <Textarea
                  value={selectedStep.usageNotes}
                  onChange={(e) => updateSelected({ usageNotes: e.target.value })}
                  placeholder="Add usage instructions or reactions..."
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="border-border text-on-surface-variant flex h-full items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center text-sm">
              Select a step to edit it.
            </div>
          )}
        </div>
      </div>

      <div className="border-border bg-card/95 fixed bottom-0 left-0 flex w-full items-center justify-between border-t p-4 backdrop-blur md:left-64">
        <span className="text-on-surface-variant font-sans text-sm">
          {isDirty ? "Unsaved changes" : "No changes"}
        </span>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={discard} disabled={!isDirty || isSaving}>
            Discard
          </Button>
          <Button onClick={save} disabled={!isDirty || isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
