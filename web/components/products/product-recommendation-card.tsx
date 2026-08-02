import { FlaskConical } from "lucide-react";

import { MatchRing } from "@/components/products/match-ring";
import { formatPrice } from "@/lib/utils";
import type { components } from "@/lib/api-types";

type RecommendationRead = components["schemas"]["RecommendationRead"];

interface ProductRecommendationCardProps {
  recommendation: RecommendationRead;
  /** Reserved for a future compact density; every current caller renders the full card. */
  compact?: boolean;
}

// The full Product Recommendations screen's card (web/app/(user)/recommendations/page.tsx).
// The Dashboard's "Recommended for you" widget uses the narrower, carousel-specific
// dashboard/product-carousel.tsx instead — a genuinely different tile design (horizontal
// scroll, rating/budget badges), not a candidate for merging into this one. This component
// used to be unwired dead code with a comment falsely claiming both screens shared it
// (found 2026-08-02 while fixing missing product images); the Recommendations screen had
// its own drifted inline copy instead. Fixed by wiring the page onto this component.
export function ProductRecommendationCard({
  recommendation,
  compact = false,
}: ProductRecommendationCardProps) {
  const { product, match_percentage, reasons } = recommendation;

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
          <div className="bg-surface-container-low flex h-full w-full flex-col items-center justify-center gap-1.5">
            <FlaskConical className="text-on-surface-variant/50 size-7" strokeWidth={1.5} />
            <span className="font-geist text-on-surface-variant text-[10px] font-medium tracking-[0.05em] uppercase">
              No photo yet
            </span>
          </div>
        )}
        <MatchRing score={match_percentage} className="absolute top-2 right-2" />
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
