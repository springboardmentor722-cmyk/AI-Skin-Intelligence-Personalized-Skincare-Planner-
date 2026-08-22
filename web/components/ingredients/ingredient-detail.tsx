"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, RotateCw, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { categoryIcon } from "@/lib/category-icon";
import { formatPrice, stripMarkdownArtifacts } from "@/lib/utils";

// Milestone 2 P12 — shared ingredient detail view for consultant/dermatologist/admin's
// "Ingredient Database" (mile_2.docx §5). No per-user suitability card here (unlike
// web/app/(user)/ingredients/[id]/page.tsx): GET /ingredients/{id}/suitability/me is
// `user`-role only — these roles have no skin profile of their own to evaluate against.
export function IngredientDetail({
  ingredientId,
  basePath,
  backLabel,
}: {
  ingredientId: number;
  basePath: string;
  backLabel: string;
}) {
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

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={
          <Link href={basePath}>
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            {backLabel}
          </Link>
        }
      />

      <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6 md:flex-row md:items-start">
        <div className="bg-secondary/10 text-secondary flex size-16 shrink-0 items-center justify-center rounded-2xl">
          {(() => {
            // categoryIcon picks from a fixed, stateless Lucide icon set
            // (lib/category-icon.ts) — remounting on a category change has no
            // visible effect.
            const Icon = categoryIcon(ingredient.category);
            // eslint-disable-next-line react-hooks/static-components
            return <Icon className="size-8" strokeWidth={1.5} />;
          })()}
        </div>
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            {ingredient.category && <Badge variant="secondary">{ingredient.category}</Badge>}
          </div>
          <h1 className="font-heading text-on-surface text-2xl font-bold">
            {stripMarkdownArtifacts(ingredient.ingredient_name)}
          </h1>
          {ingredient.inci_name && ingredient.inci_name !== ingredient.ingredient_name && (
            <p className="text-on-surface-variant font-sans text-sm">
              Also known as: {stripMarkdownArtifacts(ingredient.inci_name)}
            </p>
          )}
          <p className="text-on-surface-variant mt-4 font-sans text-xs">
            General skincare guidance, not medical advice.
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
                      <p className="text-on-surface-variant font-sans text-xs">
                        {stripMarkdownArtifacts(a.reason)}
                      </p>
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
                <p className="font-sans text-sm font-semibold">
                  {stripMarkdownArtifacts(article.title)}
                </p>
                {article.summary && (
                  <p className="text-on-surface-variant mt-1 font-sans text-sm">
                    {stripMarkdownArtifacts(article.summary)}
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
                  {stripMarkdownArtifacts(product.brand_name)}
                </p>
                <p className="font-sans text-sm font-semibold">
                  {stripMarkdownArtifacts(product.product_name)}
                </p>
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
