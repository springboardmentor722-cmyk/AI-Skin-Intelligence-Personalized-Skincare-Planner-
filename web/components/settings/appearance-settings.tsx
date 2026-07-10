"use client";

import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Check, Laptop, Loader2, Moon, RotateCcw, Sun } from "lucide-react";

import { usePalette } from "@/components/providers/palette-provider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useAppearancePreferencesQuery,
  useResetAppearanceMutation,
  useUpdateAppearanceMutation,
} from "@/lib/hooks/use-appearance-preferences";
import { PALETTE_META, PALETTES, type ThemeMode } from "@/lib/themes";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

// Settings > Appearance (all four roles — AGENTS.md §3 already names "Settings" in
// every nav list, this is that screen's real content, not a new nav item). Auto-saves
// on every change (instant local apply via PaletteProvider/next-themes + a background
// PUT to Postgres, docs-worthy call: appearance is a low-stakes, frequently-toggled
// preference — a manual "Save" button would just be an extra click for no real
// protection against anything) rather than a form + submit button.
export function AppearanceSettings() {
  const { palette, setPalette } = usePalette();
  const { theme, setTheme } = useTheme();
  const preferencesQuery = useAppearancePreferencesQuery();
  const updateMutation = useUpdateAppearanceMutation();
  const resetMutation = useResetAppearanceMutation();

  const handlePaletteChange = (next: string) => {
    if (!PALETTES.includes(next as (typeof PALETTES)[number])) return;
    const value = next as (typeof PALETTES)[number];
    setPalette(value);
    updateMutation.mutate(
      { palette: value },
      { onError: () => toast.error("Couldn't save your theme. It's still applied locally.") }
    );
  };

  const handleModeChange = (next: string[]) => {
    const value = next[0] as ThemeMode | undefined;
    if (!value) return;
    setTheme(value);
    updateMutation.mutate(
      { theme_mode: value },
      { onError: () => toast.error("Couldn't save your theme mode. It's still applied locally.") }
    );
  };

  const handleReset = () => {
    setPalette("default");
    setTheme("system");
    resetMutation.mutate(undefined, {
      onSuccess: () => toast.success("Appearance reset to default."),
      onError: () => toast.error("Couldn't reset on the server. Local appearance was reset."),
    });
  };

  if (preferencesQuery.isLoading) {
    return (
      <div className="border-border bg-card rounded-2xl border p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 h-9 w-56 rounded-full" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (preferencesQuery.isError) {
    return (
      <div className="border-border bg-card rounded-2xl border p-6">
        <p className="text-destructive font-sans text-sm">
          Couldn&apos;t load your appearance settings. Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card flex flex-col gap-8 rounded-2xl border p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-on-surface text-lg font-semibold">Appearance</h2>
          <p className="text-on-surface-variant mt-1 font-sans text-sm">
            Choose a color palette and light/dark mode for your own account — this
            doesn&apos;t affect anyone else.
          </p>
        </div>
        <div
          role="status"
          aria-live="polite"
          className="text-on-surface-variant flex h-8 shrink-0 items-center gap-1.5 font-sans text-xs"
        >
          {updateMutation.isPending && (
            <>
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              Saving…
            </>
          )}
          {updateMutation.isSuccess && !updateMutation.isPending && (
            <>
              <Check className="text-success size-3.5" strokeWidth={2} />
              Saved
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
          Mode
        </span>
        <ToggleGroup
          aria-label="Theme mode"
          spacing={1}
          className="bg-muted w-fit rounded-full p-1"
          value={theme ? [theme] : ["system"]}
          onValueChange={handleModeChange}
        >
          {MODE_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={option.label}
              className="data-pressed:bg-secondary data-pressed:text-secondary-foreground text-on-surface-variant flex items-center gap-1.5 rounded-full px-4 py-1.5 font-sans text-sm font-medium"
            >
              <option.icon className="size-4" strokeWidth={1.75} />
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
          Color palette
        </span>
        <RadioGroup
          value={palette}
          onValueChange={handlePaletteChange}
          aria-label="Color palette"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {PALETTES.map((id) => {
            const meta = PALETTE_META[id];
            return (
              <RadioGroupItem
                key={id}
                value={id}
                className={cn(
                  "group/palette-card relative flex size-auto aspect-auto min-w-0 w-full cursor-pointer flex-col items-start gap-2.5 rounded-xl border border-border bg-transparent p-3 text-left transition-colors",
                  "hover:border-secondary/40 hover:bg-muted/60",
                  "focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  "data-checked:border-secondary data-checked:bg-secondary/[0.06] data-checked:text-on-surface dark:data-checked:bg-secondary/10"
                )}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="flex overflow-hidden rounded-full ring-1 ring-black/5">
                    <span
                      className="size-4"
                      style={{ backgroundColor: meta.preview.primary }}
                    />
                    <span
                      className="size-4"
                      style={{ backgroundColor: meta.preview.secondary }}
                    />
                    <span
                      className="size-4"
                      style={{ backgroundColor: meta.preview.tertiary }}
                    />
                  </span>
                  <Check
                    className="text-secondary hidden size-4 shrink-0 group-data-checked/palette-card:block"
                    strokeWidth={2.5}
                  />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-sans text-sm font-semibold text-on-surface">
                    {meta.label}
                  </span>
                  <span className="text-on-surface-variant text-xs leading-tight">
                    {meta.description}
                  </span>
                </span>
              </RadioGroupItem>
            );
          })}
        </RadioGroup>
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={resetMutation.isPending}
        >
          {resetMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
          ) : (
            <RotateCcw className="size-3.5" strokeWidth={1.75} />
          )}
          Reset to default
        </Button>
      </div>
    </div>
  );
}
