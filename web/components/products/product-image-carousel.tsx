"use client";

import { ShoppingBag } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProductImageCarouselProps {
  /** Multiple photos (product_images, ADR-043) — external URLs, rendered as-is. */
  imageUrls: string[];
  /** Single-image fallback (products.image_url) when imageUrls is empty. */
  fallbackUrl: string | null;
  alt: string;
}

// One photo (or none) never needs carousel chrome — only step up to it once
// there's something to actually page through.
export function ProductImageCarousel({ imageUrls, fallbackUrl, alt }: ProductImageCarouselProps) {
  const images = imageUrls.length > 0 ? imageUrls : fallbackUrl ? [fallbackUrl] : [];

  if (images.length === 0) {
    return (
      <div className="bg-muted flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
        <ShoppingBag className="text-on-surface-variant/40 size-10" strokeWidth={1.5} />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="bg-muted flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- external product photo */}
        <img src={images[0]} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <Carousel className="w-32 shrink-0">
      <CarouselContent>
        {images.map((url, i) => (
          <CarouselItem key={url}>
            <div className="bg-muted flex size-32 items-center justify-center overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element -- external product photo */}
              <img src={url} alt={`${alt} — photo ${i + 1} of ${images.length}`} className="h-full w-full object-cover" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-1 size-6" />
      <CarouselNext className="right-1 size-6" />
    </Carousel>
  );
}
