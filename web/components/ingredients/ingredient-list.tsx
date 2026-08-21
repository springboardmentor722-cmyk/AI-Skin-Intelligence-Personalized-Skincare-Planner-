"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlaskConical, RotateCw, Search, TestTube2, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { categoryIcon } from "@/lib/category-icon";
import { stripMarkdownArtifacts } from "@/lib/utils";

// Milestone 2 P12 — the "Ingredient Database" shared by consultant, dermatologist,
// and admin (mile_2.docx §5). Same real GET /ingredients / /ingredients/interactions
// surface the user-role Ingredient Analyzer (web/app/(user)/ingredients/page.tsx)
// already uses — no per-profile suitability card here, since these roles have no
// skin profile of their own (`/ingredients/{id}/suitability/me` is `user`-role only).

const VERDICT_STYLE: Record<string, string> = {
  avoid: "bg-destructive/10 text-destructive",
  caution: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  synergy: "bg-success/10 text-success",
  unknown: "bg-muted text-on-surface-variant",
};
const VERDICT_LABEL: Record<string, string> = {
  avoid: "Avoid mixing",
  caution: "Use with caution",
  synergy: "Pairs well",
  unknown: "No documented interaction",
};

const CATEGORIES = [
  "Retinoids",
  "Niacinamide",
  "Vitamin C",
  "Hyaluronic Acid",
  "Salicylic Acid",
  "Ceramides",
  "Peptides",
  "AHAs/BHAs",
];

export function IngredientList({ basePath }: { basePath: string }) {
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["ingredients", "list", { q, category }],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/ingredients", {
        params: { query: { page: 1, page_size: 50, q: q || null, category } },
      });
      if (error) throw new Error("Couldn't load ingredients.");
      return data;
    },
  });

  const items = query.data?.items ?? [];

  const [checkerOpen, setCheckerOpen] = useState(false);
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");

  const interactionQuery = useQuery({
    queryKey: ["ingredients", "interactions", idA, idB],
    enabled: idA !== "" && idB !== "" && idA !== idB,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/ingredients/interactions", {
        params: { query: { ids: `${idA},${idB}` } },
      });
      if (error) throw new Error("Couldn't check that interaction.");
      return data;
    },
  });
  const pair = interactionQuery.data?.pairs[0];
  const selectItemsByIngredientId = Object.fromEntries(
    items.map((i) => [String(i.ingredient_id), stripMarkdownArtifacts(i.ingredient_name)])
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-on-surface text-2xl font-bold">
            Ingredient Database
          </h1>
          <p className="text-on-surface-variant mt-1 max-w-2xl font-sans text-sm">
            Search ingredient science, safety data, and known interactions.
          </p>
        </div>
        <Button variant="outline" onClick={() => setCheckerOpen(true)}>
          <TestTube2 className="size-4" strokeWidth={1.5} />
          Check interactions
        </Button>
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
            placeholder="Search by name or INCI..."
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
            {c}
          </Button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
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
      ) : items.length === 0 ? (
        <StateCard
          icon={FlaskConical}
          title="No ingredients found"
          description="Try a different search term or category."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ingredient) => (
            <Link
              key={ingredient.ingredient_id}
              href={`${basePath}/${ingredient.ingredient_id}`}
              className="border-border bg-card hover:border-secondary/40 flex flex-col gap-3 rounded-2xl border p-5 transition-colors"
            >
              <div className="bg-secondary/10 text-secondary flex size-12 items-center justify-center rounded-xl">
                {(() => {
                  // categoryIcon picks from a fixed, stateless Lucide icon set
                  // (lib/category-icon.ts) — remounting on a category change has no
                  // visible effect. react-hooks/static-components doesn't reach into
                  // .map() callbacks so this doesn't lint-error here the way the
                  // identical pattern does in ingredient-detail.tsx, but the
                  // reasoning is the same — see that file's comment.
                  const Icon = categoryIcon(ingredient.category);
                  return <Icon className="size-6" strokeWidth={1.5} />;
                })()}
              </div>
              <div>
                <h3 className="font-heading text-on-surface font-semibold">
                  {stripMarkdownArtifacts(ingredient.ingredient_name)}
                </h3>
                {ingredient.inci_name && ingredient.inci_name !== ingredient.ingredient_name && (
                  <p className="text-on-surface-variant font-sans text-xs">
                    {stripMarkdownArtifacts(ingredient.inci_name)}
                  </p>
                )}
              </div>
              {ingredient.category && (
                <Badge variant="outline" className="w-fit">
                  {ingredient.category}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}

      {query.data?.meta.source === "fallback" && (
        <p className="text-on-surface-variant font-sans text-xs">
          Search is running in degraded mode — results may be less complete than usual.
        </p>
      )}

      <Dialog open={checkerOpen} onOpenChange={setCheckerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interaction checker</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                items={selectItemsByIngredientId}
                value={idA}
                onValueChange={(v) => setIdA(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="First ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.ingredient_id} value={String(i.ingredient_id)}>
                      {stripMarkdownArtifacts(i.ingredient_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                items={selectItemsByIngredientId}
                value={idB}
                onValueChange={(v) => setIdB(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Second ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.ingredient_id} value={String(i.ingredient_id)}>
                      {stripMarkdownArtifacts(i.ingredient_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {idA && idB && idA === idB && (
              <p className="text-on-surface-variant font-sans text-sm">
                Choose two different ingredients.
              </p>
            )}

            {pair && (
              <div
                className={`flex items-start gap-3 rounded-xl p-4 ${VERDICT_STYLE[pair.verdict]}`}
              >
                <div>
                  <p className="font-sans text-sm font-semibold">
                    {VERDICT_LABEL[pair.verdict]}
                  </p>
                  {pair.reason && (
                    <p className="mt-1 font-sans text-sm leading-relaxed">
                      {stripMarkdownArtifacts(pair.reason)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="text-on-surface-variant font-sans text-xs">
              General skincare guidance, not medical advice.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
