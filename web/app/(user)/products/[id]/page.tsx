"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CircleCheck,
  RotateCw,
  ShieldAlert,
  ShoppingBag,
  Star,
  TriangleAlert,
} from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

// web/designs/wireframes/app-product-detail.html — real content only. The 3D
// pedestal/gallery, "Application Guide" steps, fabricated review text, and
// "Routine Check" cross-product interaction cards have no backing data anywhere
// (no application-steps column, no review-text table, no product-to-product
// interaction rule — only ingredient-to-ingredient interactions exist, M3-B) —
// dropped rather than reproduced, same precedent as client-detail-view.tsx.
export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);

  const detailQuery = useQuery({
    queryKey: ["products", "detail", productId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/products/{product_id}", {
        params: { path: { product_id: productId } },
      });
      if (error) throw new Error("Couldn't load this product.");
      return data;
    },
  });

  const alternativesQuery = useQuery({
    queryKey: ["products", "alternatives", productId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/products/{product_id}/alternatives", {
        params: { path: { product_id: productId } },
      });
      if (error) throw new Error("Couldn't load alternatives.");
      return data;
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <StateCard
        tone="destructive"
        icon={TriangleAlert}
        description="Couldn't load this product."
        action={
          <Button variant="outline" onClick={() => detailQuery.refetch()}>
            <RotateCw className="size-4" strokeWidth={1.5} />
            Retry
          </Button>
        }
      />
    );
  }

  const product = detailQuery.data;
  const alternatives = alternativesQuery.data?.alternatives ?? [];
  const flaggedIngredients = product.ingredients.filter((i) => i.allergy_flag || i.avoid_flag);

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={
          <Link href="/products">
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Products
          </Link>
        }
      />

      <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6 md:flex-row md:items-start">
        <div className="bg-muted flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- seeded/external product photo
            <img
              src={product.image_url}
              alt={product.product_name ?? "Product"}
              className="h-full w-full object-cover"
            />
          ) : (
            <ShoppingBag className="text-on-surface-variant/40 size-10" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1">
          {product.category && <Badge variant="secondary">{product.category}</Badge>}
          <h1 className="font-heading text-on-surface mt-2 text-2xl font-bold">
            {product.product_name}
          </h1>
          <p className="text-on-surface-variant font-sans text-sm">{product.brand_name}</p>
          <div className="mt-2 flex items-center gap-4">
            <span className="font-geist text-on-surface text-lg tabular-nums">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.rating != null ? (
              <span className="text-on-surface-variant flex items-center gap-1 font-sans text-sm">
                <Star className="size-4 fill-current" strokeWidth={0} />
                {product.rating.toFixed(1)}
                {product.review_count != null && ` (${product.review_count} reviews)`}
              </span>
            ) : (
              <span className="text-on-surface-variant font-sans text-xs">No reviews yet</span>
            )}
          </div>

          {product.suitable !== null && (
            <div
              className={`mt-4 flex items-start gap-3 rounded-xl p-4 ${
                flaggedIngredients.some((i) => i.allergy_flag)
                  ? "bg-destructive/10"
                  : product.suitable
                    ? "bg-success/10"
                    : "bg-amber-500/10"
              }`}
            >
              {flaggedIngredients.some((i) => i.allergy_flag) ? (
                <ShieldAlert className="text-destructive mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
              ) : product.suitable ? (
                <CircleCheck className="text-success mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
              ) : (
                <TriangleAlert
                  className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
                  strokeWidth={1.5}
                />
              )}
              <div>
                <p className="font-sans text-sm font-semibold">
                  {flaggedIngredients.some((i) => i.allergy_flag)
                    ? "Possible allergy conflict"
                    : product.suitable
                      ? "Suitable for your profile"
                      : "Not recommended for your profile"}
                  {product.suitability_confidence != null && (
                    <span className="text-on-surface-variant ml-2 font-normal">
                      {Math.round(product.suitability_confidence * 100)}% confidence
                    </span>
                  )}
                </p>
                {flaggedIngredients.map((i) => (
                  <p key={i.ingredient_id} className="text-on-surface-variant mt-1 font-sans text-sm">
                    {i.ingredient_name}: {i.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          <p className="text-on-surface-variant mt-4 font-sans text-xs">
            This is general skincare guidance, not medical advice — check with a
            dermatologist or consultant before starting a new product, especially on
            sensitive or compromised skin.
          </p>
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <h2 className="font-heading text-on-surface mb-4 text-lg font-semibold">Ingredients</h2>
        {product.ingredients.length === 0 ? (
          <p className="text-on-surface-variant font-sans text-sm">
            No ingredient data recorded for this product yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-border text-on-surface-variant border-b font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Flag</th>
                </tr>
              </thead>
              <tbody>
                {product.ingredients.map((i) => (
                  <tr key={i.ingredient_id} className="border-border border-b last:border-0">
                    <td className="text-on-surface px-4 py-3 font-sans text-sm">
                      <Link href={`/ingredients/${i.ingredient_id}`} className="hover:underline">
                        {i.ingredient_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {i.allergy_flag ? (
                        <Badge variant="destructive">Allergy</Badge>
                      ) : i.avoid_flag ? (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Avoid for your skin type
                        </Badge>
                      ) : (
                        <span className="text-on-surface-variant font-sans text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {alternatives.length > 0 && (
        <div className="border-border bg-card rounded-2xl border p-5">
          <h2 className="font-heading text-on-surface mb-4 text-lg font-semibold">
            Alternatives ({alternatives.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((alt) => (
              <Link
                key={alt.product_id}
                href={`/products/${alt.product_id}`}
                className="border-border hover:border-secondary/40 rounded-xl border p-4 transition-colors"
              >
                <p className="text-on-surface-variant font-sans text-xs uppercase">
                  {alt.brand_name}
                </p>
                <p className="font-sans text-sm font-semibold">{alt.product_name}</p>
                <p className="font-geist text-on-surface mt-1 text-sm tabular-nums">
                  {formatPrice(alt.price, alt.currency)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
