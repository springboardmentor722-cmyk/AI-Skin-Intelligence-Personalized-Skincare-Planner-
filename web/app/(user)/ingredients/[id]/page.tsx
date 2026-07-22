"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CircleCheck,
  FlaskConical,
  RotateCw,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

// web/designs/wireframes/app-ingredient-detail.html — real content only. The
// wireframe's "Clinical Application Guide" (strength %, AM/PM timing, frequency)
// and static "Pairs well with / Avoid mixing" chip lists have no backing column or
// query — no ingredients.strength/timing/frequency field exists, and precomputing
// synergy chips would mean guessing which other ingredients to compare against.
// Dropped; interactions are checked on-demand from the list page's real, pairwise
// GET /ingredients/interactions instead (same real curated table, no fabrication).
export default function IngredientDetailPage() {
  const params = useParams<{ id: string }>();
  const ingredientId = Number(params.id);

  const detailQuery = useQuery({
    queryKey: ["ingredients", "detail", ingredientId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/ingredients/{ingredient_id}", {
        params: { path: { ingredient_id: ingredientId } },
      });
      if (error) throw new Error("Couldn't load this ingredient.");
      return data;
    },
  });

  const suitabilityQuery = useQuery({
    queryKey: ["ingredients", "suitability", ingredientId],
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/api/v1/ingredients/{ingredient_id}/suitability/me",
        { params: { path: { ingredient_id: ingredientId } } }
      );
      if (error) throw new Error("Couldn't load suitability.");
      return data;
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <StateCard
        tone="destructive"
        icon={TriangleAlert}
        description="Couldn't load this ingredient."
        action={
          <Button variant="outline" onClick={() => detailQuery.refetch()}>
            <RotateCw className="size-4" strokeWidth={1.5} />
            Retry
          </Button>
        }
      />
    );
  }

  const ingredient = detailQuery.data;
  const suitability = suitabilityQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={
          <Link href="/ingredients">
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Ingredient Library
          </Link>
        }
      />

      <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6 md:flex-row md:items-start">
        <div className="bg-secondary/10 text-secondary flex size-16 shrink-0 items-center justify-center rounded-2xl">
          <FlaskConical className="size-8" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            {ingredient.category && <Badge variant="secondary">{ingredient.category}</Badge>}
          </div>
          <h1 className="font-heading text-on-surface text-2xl font-bold">
            {ingredient.ingredient_name}
          </h1>
          {ingredient.inci_name && ingredient.inci_name !== ingredient.ingredient_name && (
            <p className="text-on-surface-variant font-sans text-sm">
              Also known as: {ingredient.inci_name}
            </p>
          )}

          {suitability && (
            <div
              className={`mt-4 flex items-start gap-3 rounded-xl p-4 ${
                suitability.allergy_flag
                  ? "bg-destructive/10"
                  : suitability.suitable
                    ? "bg-success/10"
                    : "bg-amber-500/10"
              }`}
            >
              {suitability.allergy_flag ? (
                <ShieldAlert className="text-destructive mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
              ) : suitability.suitable ? (
                <CircleCheck className="text-success mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
              ) : (
                <TriangleAlert
                  className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
                  strokeWidth={1.5}
                />
              )}
              <div>
                <p
                  className={`font-sans text-sm font-semibold ${
                    suitability.allergy_flag ? "text-destructive" : "text-on-surface"
                  }`}
                >
                  {suitability.allergy_flag
                    ? "Possible allergy conflict"
                    : suitability.suitable
                      ? "Suitable for your profile"
                      : "Not recommended for your profile"}
                  <span className="text-on-surface-variant ml-2 font-normal">
                    {Math.round(suitability.confidence * 100)}% confidence
                  </span>
                </p>
                {suitability.reasons.map((reason) => (
                  <p key={reason} className="text-on-surface-variant mt-1 font-sans text-sm">
                    {reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          <p className="text-on-surface-variant mt-4 font-sans text-xs">
            This is general skincare guidance, not medical advice — check with a
            dermatologist or consultant before starting a new active, especially on
            sensitive or compromised skin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h2 className="font-heading text-on-surface mb-4 text-lg font-semibold">
            Concerns it targets
          </h2>
          {ingredient.treats_concerns.length === 0 ? (
            <p className="text-on-surface-variant font-sans text-sm">
              No concern data recorded yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {ingredient.treats_concerns.map((c) => (
                <li
                  key={c.concern_id}
                  className="border-border/60 flex items-center justify-between border-b py-2 last:border-b-0"
                >
                  <span className="font-sans text-sm">{c.concern_name}</span>
                  {c.evidence_strength && (
                    <Badge variant="outline" className="capitalize">
                      {c.evidence_strength} evidence
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-border bg-card rounded-2xl border p-5">
          <h2 className="font-heading text-on-surface mb-4 text-lg font-semibold">
            Avoid for these skin types
          </h2>
          {ingredient.avoid_for_skin_types.length === 0 ? (
            <p className="text-on-surface-variant font-sans text-sm">
              No skin-type cautions recorded.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {ingredient.avoid_for_skin_types.map((a) => (
                <li
                  key={a.skin_type_id}
                  className="bg-destructive/5 border-destructive/20 flex items-start gap-2 rounded-lg border p-3"
                >
                  <TriangleAlert
                    className="text-destructive mt-0.5 size-4 shrink-0"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="font-sans text-sm font-semibold">{a.skin_type_name}</p>
                    {a.reason && (
                      <p className="text-on-surface-variant font-sans text-xs">{a.reason}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <h2 className="font-heading text-on-surface mb-4 flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="size-5" strokeWidth={1.5} />
          Related research
        </h2>
        {ingredient.education.length === 0 ? (
          <p className="text-on-surface-variant font-sans text-sm">
            No published research linked to this ingredient yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {ingredient.education.map((article) => (
              <li key={article.article_id} className="border-border/60 border-b pb-3 last:border-b-0">
                <p className="font-sans text-sm font-semibold">{article.title}</p>
                {article.summary && (
                  <p className="text-on-surface-variant mt-1 font-sans text-sm">
                    {article.summary}
                  </p>
                )}
                {article.source && (
                  <p className="text-on-surface-variant mt-1 font-sans text-xs uppercase">
                    {article.source}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <h2 className="font-heading text-on-surface mb-4 text-lg font-semibold">
          Products containing this ingredient
        </h2>
        {ingredient.products.length === 0 ? (
          <p className="text-on-surface-variant font-sans text-sm">
            No products in the catalog list this ingredient yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ingredient.products.map((product) => (
              <div key={product.product_id} className="border-border rounded-xl border p-4">
                <p className="text-on-surface-variant font-sans text-xs uppercase">
                  {product.brand_name}
                </p>
                <p className="font-sans text-sm font-semibold">{product.product_name}</p>
                <p className="font-geist text-on-surface mt-1 text-sm tabular-nums">
                  {formatPrice(product.price, product.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
