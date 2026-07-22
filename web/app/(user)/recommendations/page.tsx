"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Layers, RotateCw, Sparkles, ThumbsDown, ThumbsUp, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

import { MatchRing } from "@/components/products/match-ring";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { cn, formatPrice, selectItems } from "@/lib/utils";

type RecommendationRead = components["schemas"]["RecommendationRead"];
type SortKey = "match" | "price-asc" | "price-desc";

const SORT_ITEMS = selectItems(["Best match", "Price: low to high", "Price: high to low"]);
const SORT_KEY_BY_LABEL: Record<string, SortKey> = {
  "Best match": "match",
  "Price: low to high": "price-asc",
  "Price: high to low": "price-desc",
};
const SORT_LABEL_BY_KEY: Record<SortKey, string> = {
  match: "Best match",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

const firstOf = (val: number | readonly number[]): number =>
  Array.isArray(val) ? val[0] : (val as number);

// docs/WIREFRAMES.md screen 6 "Product recommendations". Filters/sort run client-side
// over the single GET /api/v1/recommendations/me stub response — the documented ES-backed
// filter pipeline (ARCHITECTURE.md §10) is M3 scope; the API takes no filter params yet
// (recommendations/router.py), so filtering the fetched list here is the honest M1
// interim, not a guess at unbuilt query params. Vegan/fragrance-free preferences from the
// wireframe are dropped — no such column exists on `products` (database_schemas/...sql).
export default function RecommendationsPage() {
  const query = useQuery({
    queryKey: ["recommendations", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/recommendations/me");
      return data ?? [];
    },
  });

  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  const all = useMemo(
    () => (query.data ?? []).filter((r) => !dismissedIds.includes(r.product.product_id)),
    [query.data, dismissedIds]
  );

  const categories = useMemo(
    () => Array.from(new Set(all.map((r) => r.product.category).filter((c): c is string => !!c))),
    [all]
  );
  const brands = useMemo(
    () =>
      Array.from(new Set(all.map((r) => r.product.brand_name).filter((b): b is string => !!b))),
    [all]
  );
  const maxPrice = useMemo(
    () => Math.max(0, ...all.map((r) => r.product.price ?? 0)),
    [all]
  );

  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("match");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [alternativesFor, setAlternativesFor] = useState<RecommendationRead | null>(null);

  // POST /api/v1/recommendations/feedback (M3-D) — the future ranking-label stream
  // (AI_ML.md "Feedback loop"). A one-shot user-triggered action, so useMutation is
  // the right tool here (the documented useQuery-over-useMutation guidance,
  // PROGRESS.md 2026-07-15, is specifically about run-once-on-mount effects).
  const feedback = useMutation({
    mutationFn: async (body: { product_id: number; action: "thumbs_up" | "thumbs_down" | "dismissed" }) => {
      const { error } = await api.POST("/api/v1/recommendations/feedback", { body });
      if (error) throw new Error("Couldn't save your feedback.");
    },
    onError: () => toast.error("Couldn't save your feedback."),
  });

  const sendFeedback = (
    productId: number,
    action: "thumbs_up" | "thumbs_down" | "dismissed"
  ) => {
    feedback.mutate({ product_id: productId, action });
    if (action === "dismissed") {
      setDismissedIds((prev) => [...prev, productId]);
    } else {
      toast.success(action === "thumbs_up" ? "Thanks for the feedback!" : "Thanks — noted.");
    }
  };

  // Budget slider starts permissive (the highest seen price) until the user touches it —
  // `null` means "no explicit choice yet", so this never needs an effect to sync.
  const effectiveBudget = budgetMax ?? maxPrice;

  const matchesNonBudgetFilters = (r: RecommendationRead) =>
    (categoryFilter.length === 0 || categoryFilter.includes(r.product.category ?? "")) &&
    (brandFilter.length === 0 || brandFilter.includes(r.product.brand_name ?? ""));

  const filtered = all.filter(
    (r) => matchesNonBudgetFilters(r) && (r.product.price ?? 0) <= effectiveBudget
  );
  const hiddenByBudget = all.filter(
    (r) => matchesNonBudgetFilters(r) && (r.product.price ?? 0) > effectiveBudget
  ).length;

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "match") return b.match_score - a.match_score;
    if (sortBy === "price-asc") return (a.product.price ?? 0) - (b.product.price ?? 0);
    return (b.product.price ?? 0) - (a.product.price ?? 0);
  });

  const filtersActive =
    categoryFilter.length > 0 || brandFilter.length > 0 || (budgetMax !== null && budgetMax < maxPrice);

  const relaxFilters = () => {
    setCategoryFilter([]);
    setBrandFilter([]);
    setBudgetMax(maxPrice);
  };

  const toggleCategory = (c: string) =>
    setCategoryFilter((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleBrand = (b: string) =>
    setBrandFilter((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  const toggleCompare = (productId: number) =>
    setCompareIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : prev.length >= 3
          ? prev
          : [...prev, productId]
    );

  const compareItems = all.filter((r) => compareIds.includes(r.product.product_id));
  const alternatives = alternativesFor
    ? all.filter(
        (r) =>
          r.product.product_id !== alternativesFor.product.product_id &&
          r.product.category === alternativesFor.product.category
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-on-surface text-2xl font-bold">
            Product recommendations
          </h1>
          <p className="text-on-surface-variant mt-1 font-sans text-sm">
            Matched to your skin profile and concerns.
          </p>
        </div>
        {compareIds.length > 0 && (
          <Button variant="outline" onClick={() => setCompareOpen(true)}>
            <Layers className="size-4" strokeWidth={1.5} />
            Compare ({compareIds.length})
          </Button>
        )}
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't load recommendations."
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : all.length === 0 ? (
        <StateCard
          icon={Sparkles}
          title="No recommendations yet"
          description="Complete your skin profile so we can match products to your skin type and concerns."
          action={
            <Button nativeButton={false} render={<Link href="/profile">Complete skin profile</Link>} />
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="border-border bg-card h-fit flex flex-col gap-6 rounded-2xl border p-5 lg:col-span-3">
            <div>
              <Label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
                Sort by
              </Label>
              <Select
                items={SORT_ITEMS}
                value={SORT_LABEL_BY_KEY[sortBy]}
                onValueChange={(v) => setSortBy((v && SORT_KEY_BY_LABEL[v]) || "match")}
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(SORT_KEY_BY_LABEL).map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
                  Budget
                </Label>
                <span className="font-geist text-on-surface text-xs">
                  Up to {formatPrice(effectiveBudget, all[0]?.product.currency ?? "INR")}
                </span>
              </div>
              <Slider
                min={0}
                max={maxPrice}
                step={10}
                value={[effectiveBudget]}
                onValueChange={(v) => setBudgetMax(firstOf(v))}
              />
              {hiddenByBudget > 0 && (
                <p className="text-on-surface-variant font-sans text-xs">
                  {hiddenByBudget} product{hiddenByBudget === 1 ? "" : "s"} hidden by your
                  budget.
                </p>
              )}
            </div>

            {categories.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
                  Category
                </Label>
                <div className="flex flex-col gap-2">
                  {categories.map((c) => (
                    <label key={c} className="flex items-center gap-2 font-sans text-sm">
                      <Checkbox
                        checked={categoryFilter.includes(c)}
                        onCheckedChange={() => toggleCategory(c)}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {brands.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
                  Brand
                </Label>
                <div className="flex flex-col gap-2">
                  {brands.map((b) => (
                    <label key={b} className="flex items-center gap-2 font-sans text-sm">
                      <Checkbox
                        checked={brandFilter.includes(b)}
                        onCheckedChange={() => toggleBrand(b)}
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {filtersActive && (
              <Button variant="outline" className="w-full" onClick={relaxFilters}>
                Clear filters
              </Button>
            )}
          </aside>

          <div className="lg:col-span-9">
            {sorted.length === 0 ? (
              <StateCard
                icon={TriangleAlert}
                description="No products match your filters."
                action={
                  <Button variant="outline" onClick={relaxFilters}>
                    Relax filters
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {sorted.map((rec) => (
                  <div key={rec.product.product_id} className="border-border bg-card rounded-2xl border p-4">
                    <div className="bg-muted relative mb-3 aspect-square overflow-hidden rounded-lg">
                      {rec.product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- seeded/external product photos
                        <img
                          src={rec.product.image_url}
                          alt={rec.product.product_name ?? "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-on-surface-variant/40 flex h-full w-full items-center justify-center">
                          <Sparkles className="size-8" strokeWidth={1.5} />
                        </div>
                      )}
                      <MatchRing score={rec.match_score} className="absolute top-2 right-2" />
                    </div>
                    <h3 className="font-heading text-on-surface text-sm font-semibold">
                      {rec.product.product_name}
                    </h3>
                    <p className="text-on-surface-variant font-sans text-xs">
                      {rec.product.brand_name}
                    </p>
                    <p className="font-geist text-on-surface mt-1 text-sm tabular-nums">
                      {formatPrice(rec.product.price, rec.product.currency)}
                    </p>
                    {rec.reasons.length > 0 && (
                      <p className="text-on-surface-variant mt-2 font-sans text-xs">
                        {rec.reasons[0]}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <label className="text-on-surface-variant flex items-center gap-1.5 font-sans text-xs">
                        <Checkbox
                          checked={compareIds.includes(rec.product.product_id)}
                          onCheckedChange={() => toggleCompare(rec.product.product_id)}
                          disabled={
                            !compareIds.includes(rec.product.product_id) && compareIds.length >= 3
                          }
                        />
                        Compare
                      </label>
                      <button
                        type="button"
                        onClick={() => setAlternativesFor(rec)}
                        className={cn(
                          "text-secondary font-sans text-xs font-medium",
                          alternatives.length === 0 && "opacity-50"
                        )}
                      >
                        Alternatives
                      </button>
                    </div>
                    <div className="border-border mt-2 flex items-center justify-between border-t pt-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="This recommendation was helpful"
                          onClick={() => sendFeedback(rec.product.product_id, "thumbs_up")}
                          className="text-on-surface-variant hover:text-success rounded-md p-1"
                        >
                          <ThumbsUp className="size-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          aria-label="This recommendation wasn't helpful"
                          onClick={() => sendFeedback(rec.product.product_id, "thumbs_down")}
                          className="text-on-surface-variant hover:text-destructive rounded-md p-1"
                        >
                          <ThumbsDown className="size-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Dismiss this recommendation"
                        onClick={() => sendFeedback(rec.product.product_id, "dismissed")}
                        className="text-on-surface-variant hover:text-destructive rounded-md p-1"
                      >
                        <X className="size-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Compare products</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-4">
            {compareItems.map((rec) => (
              <div key={rec.product.product_id} className="border-border rounded-xl border p-4">
                <h4 className="font-heading text-on-surface text-sm font-semibold">
                  {rec.product.product_name}
                </h4>
                <p className="text-on-surface-variant font-sans text-xs">
                  {rec.product.brand_name}
                </p>
                <dl className="mt-3 flex flex-col gap-1.5 font-sans text-xs">
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">Price</dt>
                    <dd className="font-geist tabular-nums">
                      {formatPrice(rec.product.price, rec.product.currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">Category</dt>
                    <dd>{rec.product.category ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">Match</dt>
                    <dd className="font-geist tabular-nums">
                      {Math.round(rec.match_score)}%
                    </dd>
                  </div>
                </dl>
                {rec.reasons.length > 0 && (
                  <ul className="text-on-surface-variant mt-2 list-inside list-disc font-sans text-xs">
                    {rec.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={alternativesFor !== null} onOpenChange={(open) => !open && setAlternativesFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Alternatives to {alternativesFor?.product.product_name}
            </DialogTitle>
          </DialogHeader>
          {alternatives.length === 0 ? (
            <p className="text-on-surface-variant font-sans text-sm">
              No other {alternativesFor?.product.category?.toLowerCase()} products matched
              your profile.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {alternatives.map((rec) => (
                <div
                  key={rec.product.product_id}
                  className="border-border flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-sans text-sm font-semibold">{rec.product.product_name}</p>
                    <p className="text-on-surface-variant font-sans text-xs">
                      {rec.product.brand_name}
                    </p>
                  </div>
                  <span className="font-geist text-on-surface text-sm tabular-nums">
                    {formatPrice(rec.product.price, rec.product.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
