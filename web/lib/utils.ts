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
