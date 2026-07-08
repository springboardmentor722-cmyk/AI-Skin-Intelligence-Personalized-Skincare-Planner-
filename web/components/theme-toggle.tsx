"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

// docs/AGENTS.md §3: "the header always has a theme toggle" — one shared component
// for every header (the app-shell topbar and the public landing navbar both use this).
// Both icons render always; the `dark:` variant swaps which is visible via CSS, so
// there's no mount-detection effect needed — avoids the react-hooks/set-state-in-effect
// lint violation the app-shell topbar's previous inline version had to suppress.
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "text-on-surface-variant hover:bg-muted hover:text-on-surface flex size-9 items-center justify-center rounded-full transition-colors",
        className
      )}
    >
      <Sun className="size-[18px] dark:hidden" strokeWidth={1.5} />
      <Moon className="hidden size-[18px] dark:block" strokeWidth={1.5} />
    </button>
  );
}
