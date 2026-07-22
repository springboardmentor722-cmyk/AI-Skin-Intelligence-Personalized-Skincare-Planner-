"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RotateCw, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

// web/designs/wireframes/app-products-compare.html — real content only. Match-score
// rings and the fabricated "Texture"/star-rating-breakdown rows are dropped — no
// match score exists outside the Recommender, and there's no texture-description
// column on `products`.
export default function ProductsComparePage() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const query = useQuery({
    queryKey: ["products", "compare", ids],
    enabled: ids.length >= 2,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/products/compare", {
        params: { query: { ids: ids.join(",") } },
      });
      if (error) throw new Error("Couldn't compare these products.");
      return data;
    },
  });

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

      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Compare products</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Side-by-side attributes for the products you selected.
        </p>
      </div>

      {ids.length < 2 ? (
        <StateCard
          icon={TriangleAlert}
          title="Nothing to compare"
          description="Pick 2 or 3 products from the catalog to compare them."
          action={<Button nativeButton={false} render={<Link href="/products">Go to Products</Link>} />}
        />
      ) : query.isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : query.isError || !query.data ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't compare these products."
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-on-surface-variant w-40 px-4 py-3 font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
                    Metric
                  </th>
                  {query.data.items.map(({ product }) => (
                    <th key={product.product_id} className="min-w-[220px] px-4 py-3">
                      <Link href={`/products/${product.product_id}`} className="hover:underline">
                        <p className="font-heading text-on-surface text-base font-semibold">
                          {product.product_name}
                        </p>
                        <p className="text-on-surface-variant font-sans text-xs">
                          {product.brand_name}
                        </p>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-border border-t">
                  <td className="text-on-surface-variant bg-muted/30 px-4 py-3 font-sans text-sm font-semibold">
                    Price
                  </td>
                  {query.data.items.map(({ product }) => (
                    <td
                      key={product.product_id}
                      className="font-geist text-on-surface px-4 py-3 text-lg tabular-nums"
                    >
                      {formatPrice(product.price, product.currency)}
                    </td>
                  ))}
                </tr>
                <tr className="border-border border-t">
                  <td className="text-on-surface-variant bg-muted/30 px-4 py-3 font-sans text-sm font-semibold">
                    Category
                  </td>
                  {query.data.items.map(({ product }) => (
                    <td key={product.product_id} className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                      {product.category ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="border-border border-t">
                  <td className="text-on-surface-variant bg-muted/30 px-4 py-3 font-sans text-sm font-semibold">
                    Rating
                  </td>
                  {query.data.items.map(({ product }) => (
                    <td key={product.product_id} className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                      {product.rating != null
                        ? `★ ${product.rating.toFixed(1)}${product.review_count != null ? ` (${product.review_count})` : ""}`
                        : "No reviews yet"}
                    </td>
                  ))}
                </tr>
                <tr className="border-border border-t">
                  <td className="text-on-surface-variant bg-muted/30 px-4 py-3 font-sans text-sm font-semibold">
                    Skin types
                  </td>
                  {query.data.items.map((item) => (
                    <td key={item.product.product_id} className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.skin_types_supported.length === 0 ? (
                          <span className="text-on-surface-variant font-sans text-xs">—</span>
                        ) : (
                          item.skin_types_supported.map((t) => (
                            <span
                              key={t}
                              className="border-border rounded-full border px-2 py-0.5 font-sans text-xs"
                            >
                              {t}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-border border-t">
                  <td className="text-on-surface-variant bg-muted/30 px-4 py-3 font-sans text-sm font-semibold">
                    Concerns
                  </td>
                  {query.data.items.map((item) => (
                    <td key={item.product.product_id} className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.concerns_supported.length === 0 ? (
                          <span className="text-on-surface-variant font-sans text-xs">—</span>
                        ) : (
                          item.concerns_supported.map((c) => (
                            <span
                              key={c}
                              className="border-border rounded-full border px-2 py-0.5 font-sans text-xs"
                            >
                              {c}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-border border-t">
                  <td className="text-on-surface-variant bg-muted/30 px-4 py-3 font-sans text-sm font-semibold">
                    Ingredients
                  </td>
                  {query.data.items.map((item) => (
                    <td
                      key={item.product.product_id}
                      className="text-on-surface-variant px-4 py-3 font-sans text-sm leading-relaxed"
                    >
                      {item.ingredient_names.length > 0 ? item.ingredient_names.join(", ") : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
