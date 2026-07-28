"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Layers, RotateCw, Search, Sparkles, ShoppingBag, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

// web/designs/wireframes/app-products.html — real content only. Match-score rings,
// "Allergy-Safe Mode" toggle, and "(Mocked)" cards are dropped: match scores come
// from the Recommender (a separate GET /recommendations/me, linked below as "For
// you"), not the catalog; allergy annotations already gate the *recommendations*
// feed and the product detail page rather than a second, separate catalog toggle.
const CATEGORIES = [
  "Face Wash",
  "Moisturizer",
  "Sunscreen",
  "Serum",
  "Toner",
  "Treatment Products",
  "Face Masks",
  "uncategorized",
];

export default function ProductsPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  const query = useQuery({
    queryKey: ["products", "list", { q, category }],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/products", {
        params: { query: { page: 1, page_size: 50, q: q || null, category } },
      });
      if (error) throw new Error("Couldn't load products.");
      return data;
    },
  });

  const items = query.data?.items ?? [];

  const toggleCompare = (productId: number) =>
    setCompareIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : prev.length >= 3
          ? prev
          : [...prev, productId]
    );

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-on-surface text-2xl font-bold">Products</h1>
          <p className="text-on-surface-variant mt-1 font-sans text-sm">
            Browse the full catalog, or see what&apos;s matched to your profile.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/recommendations">
              <Sparkles className="size-4" strokeWidth={1.5} />
              For you
            </Link>
          }
        />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(searchInput);
        }}
      >
        <div className="relative w-full max-w-sm">
          <Search
            className="text-on-surface-variant absolute top-1/2 left-3 size-4 -translate-y-1/2"
            strokeWidth={1.5}
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products or brands..."
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={category === null ? "default" : "outline"}
          onClick={() => setCategory(null)}
        >
          All
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            onClick={() => setCategory(c)}
          >
            {c === "uncategorized" ? "Uncategorized" : c}
          </Button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <StateCard
          tone="destructive"
          icon={TriangleAlert}
          description="Couldn't load products."
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              <RotateCw className="size-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <StateCard
          icon={ShoppingBag}
          title="No products found"
          description="Try a different search term or category."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <div
              key={product.product_id}
              className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-4"
            >
              <Link href={`/products/${product.product_id}`} className="flex flex-col gap-3">
                <div className="bg-muted flex aspect-square items-center justify-center overflow-hidden rounded-lg">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- seeded/external product photos
                    <img
                      src={product.image_url}
                      alt={product.product_name ?? "Product"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag
                      className="text-on-surface-variant/40 size-8"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <div>
                  {product.category && (
                    <Badge variant="outline" className="mb-1">
                      {product.category}
                    </Badge>
                  )}
                  <h3 className="font-heading text-on-surface text-sm font-semibold">
                    {product.product_name}
                  </h3>
                  <p className="text-on-surface-variant font-sans text-xs">
                    {product.brand_name}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-geist text-on-surface text-sm tabular-nums">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {product.rating != null && (
                    <span className="text-on-surface-variant font-sans text-xs">
                      ★ {product.rating.toFixed(1)}
                      {product.review_count != null && ` (${product.review_count})`}
                    </span>
                  )}
                </div>
              </Link>
              <label className="text-on-surface-variant flex items-center gap-2 border-t pt-3 font-sans text-xs">
                <Checkbox
                  checked={compareIds.includes(product.product_id)}
                  onCheckedChange={() => toggleCompare(product.product_id)}
                  disabled={
                    !compareIds.includes(product.product_id) && compareIds.length >= 3
                  }
                />
                Compare
              </label>
            </div>
          ))}
        </div>
      )}

      {query.data?.meta.source === "fallback" && (
        <p className="text-on-surface-variant font-sans text-xs">
          Search is running in degraded mode — results may be less complete than usual.
        </p>
      )}

      {compareIds.length >= 2 && (
        <div className="border-border bg-card fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-t-2xl border p-4 shadow-lg sm:left-64">
          <span className="font-sans text-sm font-semibold">
            {compareIds.length} product{compareIds.length === 1 ? "" : "s"} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCompareIds([])}>
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/products/compare?ids=${compareIds.join(",")}`)}
            >
              <Layers className="size-4" strokeWidth={1.5} />
              Compare
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
