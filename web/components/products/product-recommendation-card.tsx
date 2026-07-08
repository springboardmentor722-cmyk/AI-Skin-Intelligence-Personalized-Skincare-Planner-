import { FlaskConical } from "lucide-react";

import { MatchRing } from "@/components/products/match-ring";
import { formatPrice } from "@/lib/utils";
import type { components } from "@/lib/api-types";

type RecommendationRead = components["schemas"]["RecommendationRead"];

interface ProductRecommendationCardProps {
  recommendation: RecommendationRead;
  /** Dashboard preview (3 cards) omits the full reasons list; the Recommendations
   * screen's grid shows it in full — docs/WIREFRAMES.md screens 3 and 6 share this
   * card but differ on density. */
  compact?: boolean;
}

// Shared between the Dashboard's "Recommended for you" preview and the full Product
// Recommendations screen (docs/WIREFRAMES.md screens 3 & 6) — one card, two densities,
// so the two screens never visually drift from each other.
export function ProductRecommendationCard({
  recommendation,
  compact = false,
}: ProductRecommendationCardProps) {
  const { product, match_score, reasons } = recommendation;

  return (
    <div className="group">
      <div className="bg-muted border-border relative mb-3 aspect-square overflow-hidden rounded-lg border">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- seeded/external product photos, not part of the Next.js image pipeline yet
          <img
            src={product.image_url}
            alt={product.product_name ?? "Product"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="text-on-surface-variant/40 flex h-full w-full items-center justify-center">
            <FlaskConical className="size-8" strokeWidth={1.5} />
          </div>
        )}
        <MatchRing score={match_score} className="absolute top-2 right-2" />
      </div>
      <h4 className="font-heading text-on-surface text-sm font-semibold">
        {product.product_name ?? "Untitled product"}
      </h4>
      <p className="text-on-surface-variant font-sans text-xs">{product.brand_name}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-geist text-on-surface text-sm tabular-nums">
          {formatPrice(product.price, product.currency)}
        </span>
        {product.category && (
          <span className="text-on-surface-variant font-geist text-[10px] font-semibold tracking-[0.05em] uppercase">
            {product.category}
          </span>
        )}
      </div>
      {!compact && reasons.length > 0 && (
        <p className="text-on-surface-variant mt-2 font-sans text-xs">{reasons[0]}</p>
      )}
    </div>
  );
}
