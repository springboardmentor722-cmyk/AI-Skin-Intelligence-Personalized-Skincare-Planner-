"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { isPalette, type Palette } from "@/lib/themes";

const STORAGE_KEY = "skinlytics-palette";

function readInitialPalette(): Palette {
  // Only ever called client-side in practice (SSR always takes the "default"
  // branch, matching the server-rendered <html>, which has no data-palette
  // attribute at all) — PaletteScript already applied the real attribute
  // synchronously before this component's first client render, so a lazy
  // initializer reads it directly instead of a setState-in-effect round trip.
  if (typeof document === "undefined") return "default";
  const current = document.documentElement.getAttribute("data-palette");
  return isPalette(current) ? current : "default";
}

// The blocking inline script (rendered by PaletteScript, mounted in app/layout.tsx
// before any themed content) already applies the cached palette to <html> pre-paint —
// exactly next-themes' own anti-flash technique, hand-rolled here for the one extra
// attribute next-themes doesn't manage. This context only needs to mirror that DOM
// state into React so components can read/change it.
const PaletteContext = createContext<{
  palette: Palette;
  setPalette: (next: Palette) => void;
} | null>(null);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(readInitialPalette);

  const setPalette = useCallback((next: Palette) => {
    setPaletteState(next);
    if (next === "default") {
      // "default" needs no override block in globals.css — omit the attribute
      // entirely rather than pointing it at a palette with no matching CSS.
      document.documentElement.removeAttribute("data-palette");
    } else {
      document.documentElement.setAttribute("data-palette", next);
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can throw in private-browsing/storage-restricted contexts — the DOM
      // attribute above already applied instantly; the cache is best-effort only,
      // and the next authenticated page load reconciles from Postgres anyway
      // (components/app-shell/appearance-sync.tsx).
    }
  }, []);

  return (
    <PaletteContext.Provider value={{ palette, setPalette }}>{children}</PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette must be used within a PaletteProvider");
  return ctx;
}

// Rendered once, as early as possible in <body> (app/layout.tsx) — runs synchronously
// during HTML parsing, before React hydrates, so the correct palette is already on
// <html> for the very first paint. Reads localStorage directly (not React state,
// which doesn't exist yet at this point).
export function PaletteScript() {
  const code = `(function(){try{var p=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(p&&p!=="default"){document.documentElement.setAttribute("data-palette",p);}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
