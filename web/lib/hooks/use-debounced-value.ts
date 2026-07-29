import { useEffect, useState } from "react";

// Extracted from web/app/(user)/routine/edit/[routineId]/page.tsx's own local
// copy (product search debounce) — shared here so the clinical-review roster
// search (M3R Phase 5) doesn't reimplement it a second time.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
