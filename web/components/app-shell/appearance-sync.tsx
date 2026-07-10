"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { usePalette } from "@/components/providers/palette-provider";
import { useAppearancePreferencesQuery } from "@/lib/hooks/use-appearance-preferences";
import { isPalette, isThemeMode } from "@/lib/themes";

// Mounted once inside AppShell (every authenticated role layout renders through it) —
// Postgres is the source of truth for appearance preferences, but the *local* palette
// attribute / next-themes mode are what actually paint the UI, seeded from
// localStorage before this even runs (PaletteScript, next-themes' own script). This
// component's only job is to reconcile the two the first time a session's real
// preferences load — e.g. signing in on a new device where localStorage is empty (or
// stale) and Postgres has the real answer. Renders nothing.
export function AppearanceSync() {
  const { data } = useAppearancePreferencesQuery();
  const { palette, setPalette } = usePalette();
  const { theme, setTheme } = useTheme();
  const reconciled = useRef(false);

  useEffect(() => {
    if (!data || reconciled.current) return;
    reconciled.current = true;
    if (isPalette(data.palette) && data.palette !== palette) setPalette(data.palette);
    if (isThemeMode(data.theme_mode) && data.theme_mode !== theme) setTheme(data.theme_mode);
    // Only re-run if `data` itself changes identity (a real refetch) — `palette`/
    // `theme` are read at that moment, not tracked as their own triggers, since this
    // effect's whole point is a one-time reconciliation, not a live two-way sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return null;
}
