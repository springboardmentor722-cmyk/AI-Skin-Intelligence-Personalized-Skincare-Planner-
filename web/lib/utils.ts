import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Base UI's Select needs an explicit value->label `items` map to display the selected
// label immediately on load (see components/skin-profile/skin-profile-form.tsx for
// why) — this covers the common case of a self-describing string option list.
export function selectItems(options: readonly string[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o, o]));
}

// Milestone 2 P3 widget kit (RankedBarList, DonutBreakdown) — a share of a whole,
// clamped to [0, 100] and rounded to the nearest whole percent since every screenshot
// percentage (UI_SPEC.md §4) is a bare integer, never a decimal.
export function computePercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

// Products are seeded/priced in INR (AGENTS.md §4: "₹ primary, $ secondary") but the API
// returns whatever `currency` the row carries — never hard-code the symbol.
export function formatPrice(price: number | null, currency: string | null): string {
  if (price == null) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency ?? "INR",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency ?? ""} ${price}`.trim();
  }
}
