"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CircleCheck,
  Loader2,
  RotateCw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
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
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { formatPrice } from "@/lib/utils";

const CATEGORIES = [
  "Face Wash",
  "Moisturizer",
  "Sunscreen",
  "Serum",
  "Toner",
  "Treatment Products",
  "Face Masks",
];

interface ClientRecommendationsViewProps {
  userId: string;
  backHref: string;
}

export function ClientRecommendationsView({ userId, backHref }: ClientRecommendationsViewProps) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [detailProductId, setDetailProductId] = useState<number | null>(null);
  const [recommendProductId, setRecommendProductId] = useState<number | null>(null);
  const [usageInstructions, setUsageInstructions] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);

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

  const productsQuery = useQuery({
    queryKey: ["products", "list", { q: debouncedQ, category }],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/products", {
        params: { query: { page: 1, page_size: 30, q: debouncedQ || null, category } },
      });
      if (error) throw new Error("Couldn't load products.");
      return data;
    },
  });

  const historyQuery = useQuery({
    queryKey: ["clinical-review", "recommendations", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/{user_id}/recommendations", {
        params: { path: { user_id: userId }, query: { page_size: 50 } },
      });
      if (error) throw new Error("Couldn't load recommendation history.");
      return data;
    },
  });

  const detailQuery = useQuery({
    queryKey: ["clinical-review", "product-detail", userId, detailProductId],
    queryFn: async () => {
      if (detailProductId == null) return null;
      const { data, error } = await api.GET("/api/v1/clients/{user_id}/products/{product_id}", {
        params: { path: { user_id: userId, product_id: detailProductId } },
      });
      if (error) throw new Error("Couldn't load this product.");
      return data;
    },
    enabled: detailProductId != null,
  });

  const invalidateHistory = () =>
    queryClient.invalidateQueries({ queryKey: ["clinical-review", "recommendations", userId] });

  const recommendMutation = useMutation({
    mutationFn: async (productId: number) => {
      const { error } = await api.POST("/api/v1/clients/{user_id}/recommendations", {
        params: { path: { user_id: userId } },
        body: {
          product_id: productId,
          usage_instructions: usageInstructions || null,
          frequency: frequency || null,
          notes: notes || null,
        },
      });
      if (error) throw new Error("Couldn't recommend this product.");
    },
    onSuccess: () => {
      toast.success("Product recommended");
      setRecommendProductId(null);
      setUsageInstructions("");
      setFrequency("");
      setNotes("");
      invalidateHistory();
    },
    onError: () => toast.error("Couldn't recommend this product."),
  });

  const activeMutation = useMutation({
    mutationFn: async ({
      recommendationId,
      isActive,
    }: {
      recommendationId: number;
      isActive: boolean;
    }) => {
      const { error } = await api.PATCH(
        "/api/v1/clients/{user_id}/recommendations/{recommendation_id}",
        {
          params: { path: { user_id: userId, recommendation_id: recommendationId } },
          body: { is_active: isActive },
        }
      );
      if (error) throw new Error("Couldn't update recommendation.");
    },
    onSuccess: () => invalidateHistory(),
    onError: () => toast.error("Couldn't update recommendation."),
  });

  const client = clientQuery.data;
  const products = productsQuery.data?.items ?? [];
  const history = historyQuery.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
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
            {client?.name ?? client?.email ?? "Client"} — Product recommendations
          </h1>
          {client && <p className="text-on-surface-variant font-sans text-sm">{client.email}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-on-surface text-lg font-semibold">Previously recommended</h2>
        {historyQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : historyQuery.isError ? (
          <StateCard
            tone="destructive"
            icon={TriangleAlert}
            description="Unable to load recommendation history."
            action={
              <Button variant="outline" onClick={() => historyQuery.refetch()}>
                <RotateCw className="size-4" strokeWidth={1.5} />
                Retry
              </Button>
            }
          />
        ) : history.length === 0 ? (
          <p className="text-on-surface-variant font-sans text-sm">No recommendations yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {history.map((rec) => (
              <div key={rec.recommendation_id} className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-sans text-sm font-semibold">{rec.product.product_name}</p>
                    <p className="text-on-surface-variant text-xs">{rec.product.brand_name}</p>
                  </div>
                  <Badge variant={rec.recommended_by_professional_id == null ? "secondary" : "default"}>
                    {rec.recommended_by_professional_id == null ? "AI Served" : "Consultant"}
                  </Badge>
                </div>
                {rec.usage_instructions && (
                  <p className="text-on-surface-variant font-sans text-xs">{rec.usage_instructions}</p>
                )}
                {rec.frequency && (
                  <p className="text-on-surface-variant font-geist text-xs">Frequency: {rec.frequency}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-on-surface-variant font-geist text-xs tabular-nums">
                    {rec.is_active ? "Active" : "Inactive"}
                    {rec.created_at && ` · ${new Date(rec.created_at).toLocaleDateString()}`}
                  </span>
                  {rec.recommended_by_professional_id != null && (
                    <Switch
                      checked={rec.is_active ?? false}
                      disabled={activeMutation.isPending}
                      onCheckedChange={(checked) =>
                        activeMutation.mutate({ recommendationId: rec.recommendation_id, isActive: checked })
                      }
                      aria-label={rec.is_active ? "Deactivate recommendation" : "Activate recommendation"}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-on-surface text-lg font-semibold">Browse products</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="text-on-surface-variant absolute top-1/2 left-3 size-4 -translate-y-1/2" strokeWidth={1.5} />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setQ(searchInput)}
              placeholder="Search products or brands..."
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setQ(searchInput)}>
            Search
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={category === null ? "default" : "outline"} onClick={() => setCategory(null)}>
            All
          </Button>
          {CATEGORIES.map((c) => (
            <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>
              {c}
            </Button>
          ))}
        </div>

        {productsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : productsQuery.isError ? (
          <StateCard
            tone="destructive"
            icon={TriangleAlert}
            description="Unable to load product recommendations."
            action={
              <Button variant="outline" onClick={() => productsQuery.refetch()}>
                <RotateCw className="size-4" strokeWidth={1.5} />
                Retry
              </Button>
            }
          />
        ) : products.length === 0 ? (
          <StateCard icon={ShoppingBag} description="No products found." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.product_id} className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-4">
                <button
                  type="button"
                  onClick={() => setDetailProductId(product.product_id)}
                  className="flex flex-col gap-2 text-left"
                >
                  {product.category && <Badge variant="outline">{product.category}</Badge>}
                  <p className="font-sans text-sm font-semibold">{product.product_name}</p>
                  <p className="text-on-surface-variant font-sans text-xs">{product.brand_name}</p>
                  <p className="font-geist text-on-surface text-sm tabular-nums">
                    {formatPrice(product.price, product.currency)}
                  </p>
                </button>
                <Button
                  size="sm"
                  className="mt-auto"
                  onClick={() => setRecommendProductId(product.product_id)}
                >
                  <Sparkles className="size-4" strokeWidth={1.5} />
                  Recommend
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product detail dialog — suitability computed against this client. */}
      <Dialog open={detailProductId != null} onOpenChange={(open) => !open && setDetailProductId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Product detail</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : detailQuery.isError || !detailQuery.data ? (
            <p className="text-destructive text-sm">Unable to load this product.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-sans text-sm font-semibold">{detailQuery.data.product_name}</p>
                <p className="text-on-surface-variant font-sans text-xs">{detailQuery.data.brand_name}</p>
              </div>
              {detailQuery.data.suitable !== null && (
                <div className="flex items-center gap-2 text-sm">
                  {detailQuery.data.suitable ? (
                    <CircleCheck className="text-success size-4" strokeWidth={1.5} />
                  ) : (
                    <ShieldAlert className="text-destructive size-4" strokeWidth={1.5} />
                  )}
                  <span>{detailQuery.data.suitable ? "Suitable for this client" : "Not recommended for this client"}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                {detailQuery.data.ingredients.map((i) => (
                  <div key={i.ingredient_id} className="flex items-center justify-between text-xs">
                    <span>{i.ingredient_name}</span>
                    {i.allergy_flag ? (
                      <Badge variant="destructive">Allergy</Badge>
                    ) : i.avoid_flag ? (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">Avoid</Badge>
                    ) : null}
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  setRecommendProductId(detailQuery.data!.product_id);
                  setDetailProductId(null);
                }}
              >
                <Sparkles className="size-4" strokeWidth={1.5} />
                Recommend to client
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recommend dialog — usage instructions, frequency, notes. */}
      <Dialog open={recommendProductId != null} onOpenChange={(open) => !open && setRecommendProductId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recommend product</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Textarea
              value={usageInstructions}
              onChange={(e) => setUsageInstructions(e.target.value)}
              placeholder="Usage instructions (optional)"
              rows={2}
            />
            <Input
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="Frequency (e.g. Daily, 2x/week)"
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecommendProductId(null)}>
              Cancel
            </Button>
            <Button
              disabled={recommendMutation.isPending}
              onClick={() => recommendProductId != null && recommendMutation.mutate(recommendProductId)}
            >
              {recommendMutation.isPending && <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />}
              Recommend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
