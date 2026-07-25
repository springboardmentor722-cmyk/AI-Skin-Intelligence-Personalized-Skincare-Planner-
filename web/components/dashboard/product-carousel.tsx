"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

export interface CarouselProduct {
  key: string | number;
  name: string;
  imageUrl?: string;
  price: number | null;
  currency: string | null;
  rating?: number;
  badge?: string;
}

interface ProductCarouselProps extends WidgetStateProps {
  products?: CarouselProduct[];
}

// Horizontal product carousel with overlapping prev/next arrows (UI_SPEC.md §4.1
// "Recommended Products for You").
export function ProductCarousel({
  state = "ready",
  products,
  emptyIcon,
  emptyMessage = "No recommendations yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
  onRetry,
}: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (state === "loading") {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-48 w-36 shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }
  if (state === "error") return <WidgetError message={errorMessage} onRetry={onRetry} />;
  if (state === "empty" || !products || products.length === 0) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  const scrollBy = (dir: 1 | -1) => scrollerRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });

  return (
    <div className="relative">
      <div ref={scrollerRef} className="flex gap-3 overflow-x-auto scroll-smooth pb-1">
        {products.map((product) => (
          <div key={product.key} className="border-border bg-card w-36 shrink-0 rounded-xl border p-2">
            <div className="bg-muted relative mb-2 flex h-24 items-center justify-center overflow-hidden rounded-lg">
              {product.imageUrl && (
                <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
              )}
              {product.badge && (
                <Badge variant="secondary" className="absolute top-1 left-1">
                  {product.badge}
                </Badge>
              )}
            </div>
            <p className="line-clamp-2 text-xs font-medium">{product.name}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-semibold tabular-nums">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.rating != null && (
                <span className="text-muted-foreground flex items-center gap-0.5 text-xs tabular-nums">
                  <Star className="size-3 fill-current" strokeWidth={0} />
                  {product.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="icon-sm"
        className="absolute top-1/2 -left-3 -translate-y-1/2 rounded-full"
        onClick={() => scrollBy(-1)}
        aria-label="Previous products"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        className="absolute top-1/2 -right-3 -translate-y-1/2 rounded-full"
        onClick={() => scrollBy(1)}
        aria-label="Next products"
      >
        <ChevronRight className="size-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}
