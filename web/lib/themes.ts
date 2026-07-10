// Theme system (Phase 3) — the frontend half of the fixed palette set. Keep this in
// lockstep with the migration's CHECK constraint (a1e009276345) and the backend's
// PaletteId (backend/app/services/user/schemas.py) — three independent sources of
// truth for the same set, same discipline SIGNUP_ROLES/ROLE_CARDS already use.
//
// A palette is a *color* choice only — it re-points --primary/--secondary/--tertiary
// (+ their --on-*/--*-container pairs) in app/globals.css to different values. It
// never changes glass, spacing, radius, or typography (AGENTS.md: "Design system is
// locked, not proposed"); every existing component already consumes these token
// names, so switching palettes needs zero component-level changes.
export const PALETTES = [
  "default",
  "emerald",
  "ocean",
  "lavender",
  "sunset",
  "slate",
  "rose",
  "forest",
] as const;

export type Palette = (typeof PALETTES)[number];

export const THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export interface PaletteMeta {
  label: string;
  description: string;
  // Light-mode --primary/--secondary/--tertiary, copied verbatim from app/globals.css
  // — this is what a theme *card* previews (a small 3-swatch strip), independent of
  // whichever palette is actually mounted right now. The live app itself always reads
  // the real CSS custom properties, never this object; keep these two in sync by hand
  // (same discipline as every other "two sources of truth" pairing in this file).
  preview: { primary: string; secondary: string; tertiary: string };
}

export const PALETTE_META: Record<Palette, PaletteMeta> = {
  default: {
    label: "Skinlytics Default",
    description: "Deep Navy, Royal Blue & Teal — the signature Frosted Lab Glass look.",
    preview: { primary: "#0f172a", secondary: "#2f5fd6", tertiary: "#14b8a6" },
  },
  emerald: {
    label: "Emerald",
    description: "Clinical green with a lime accent — calm, growth-oriented.",
    preview: { primary: "#064e3b", secondary: "#059669", tertiary: "#84cc16" },
  },
  ocean: {
    label: "Ocean",
    description: "Deep navy through sky blue to cyan — cool and precise.",
    preview: { primary: "#0c4a6e", secondary: "#0284c7", tertiary: "#06b6d4" },
  },
  lavender: {
    label: "Lavender",
    description: "Violet and fuchsia — soft, modern, a little playful.",
    preview: { primary: "#3b0764", secondary: "#7c3aed", tertiary: "#c026d3" },
  },
  sunset: {
    label: "Sunset",
    description: "Burnt orange through rose pink — warm and energetic.",
    preview: { primary: "#7c2d12", secondary: "#ea580c", tertiary: "#db2777" },
  },
  slate: {
    label: "Slate",
    description: "Muted steel-blue with an amber accent — quiet and businesslike.",
    preview: { primary: "#1e293b", secondary: "#475569", tertiary: "#d97706" },
  },
  rose: {
    label: "Rose",
    description: "Crimson and teal — a bold, high-contrast complementary pair.",
    preview: { primary: "#881337", secondary: "#e11d48", tertiary: "#0d9488" },
  },
  forest: {
    label: "Forest",
    description: "Deep green, moss, and earthy amber — grounded and organic.",
    preview: { primary: "#14532d", secondary: "#4d7c0f", tertiary: "#a16207" },
  },
};

export function isPalette(value: string | null | undefined): value is Palette {
  return !!value && (PALETTES as readonly string[]).includes(value);
}

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return !!value && (THEME_MODES as readonly string[]).includes(value);
}
