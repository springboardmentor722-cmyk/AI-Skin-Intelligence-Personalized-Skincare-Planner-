"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import { api } from "@/lib/api";

const PAGE_SIZE = 10;

function IngredientsTable() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "ingredients", page],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/ingredients", {
        params: { query: { page, page_size: PAGE_SIZE } },
      });
      if (error) throw new Error("Failed to load ingredients");
      return data;
    },
  });

  if (query.isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (query.isError || !query.data) {
    return (
      <StateCard
        tone="destructive"
        icon={TriangleAlert}
        description="Couldn't load ingredients."
        action={
          <Button variant="outline" onClick={() => query.refetch()}>
            <RotateCw className="size-4" strokeWidth={1.5} />
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-border text-on-surface-variant border-b font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">INCI name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {query.data.items.map((ingredient) => (
              <tr key={ingredient.ingredient_id} className="border-border border-b last:border-0">
                <td className="text-on-surface px-4 py-3 font-sans text-sm">
                  {ingredient.ingredient_name}
                </td>
                <td className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                  {ingredient.inci_name ?? "—"}
                </td>
                <td className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                  {ingredient.category ?? "—"}
                </td>
                <td className="px-4 py-3 font-sans text-sm">
                  {ingredient.is_active ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-border flex items-center justify-between border-t px-4 py-3">
        <p className="text-on-surface-variant font-sans text-xs">
          {query.data.meta.total} ingredient{query.data.meta.total === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page * PAGE_SIZE >= query.data.meta.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProductsTable() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "products", page],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/products", {
        params: { query: { page, page_size: PAGE_SIZE } },
      });
      if (error) throw new Error("Failed to load products");
      return data;
    },
  });

  if (query.isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (query.isError || !query.data) {
    return (
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
    );
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-border text-on-surface-variant border-b font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
            </tr>
          </thead>
          <tbody>
            {query.data.items.map((product) => (
              <tr key={product.product_id} className="border-border border-b last:border-0">
                <td className="text-on-surface px-4 py-3 font-sans text-sm">
                  {product.brand_name ?? "—"}
                </td>
                <td className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                  {product.product_name ?? "—"}
                </td>
                <td className="text-on-surface-variant px-4 py-3 font-sans text-sm">
                  {product.category ?? "—"}
                </td>
                <td className="text-on-surface px-4 py-3 font-sans text-sm tabular-nums">
                  {product.price != null ? `${product.currency ?? ""} ${product.price}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-border flex items-center justify-between border-t px-4 py-3">
        <p className="text-on-surface-variant font-sans text-xs">
          {query.data.meta.total} product{query.data.meta.total === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page * PAGE_SIZE >= query.data.meta.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminContentPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Content &amp; data</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Read-only views over seeded catalog data. Full editing is a later milestone.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-on-surface text-lg font-semibold">Ingredients</h2>
        <IngredientsTable />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-on-surface text-lg font-semibold">Products</h2>
        <ProductsTable />
      </div>

      <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
        <Database className="text-on-surface-variant/40 mx-auto mb-3 size-7" strokeWidth={1.5} />
        <h3 className="font-heading text-on-surface text-sm font-semibold">
          Lifestyle dataset management
        </h3>
        <p className="text-on-surface-variant mt-1 font-sans text-xs">Coming soon</p>
      </div>
    </div>
  );
}
