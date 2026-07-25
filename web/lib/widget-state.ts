import type { WidgetState } from "@/components/dashboard/widget-states";

/**
 * The shape every dashboard widget needs from a TanStack Query result.
 * Structural, not `UseQueryResult<T>` — it keeps this helper usable with any
 * query generic without threading type parameters through every call site.
 */
export interface QueryStatusLike {
  isLoading: boolean;
  isError: boolean;
  refetch?: () => unknown;
}

/**
 * Derive a widget's `state` from a query plus its own emptiness test.
 *
 * Written because the P14 dashboards had all collapsed into the same shape:
 *
 *     state={q.isLoading ? "loading" : rows.length === 0 ? "empty" : "ready"}
 *
 * which has no `isError` branch, so a failed request renders the *empty* state
 * — the user is told "Nothing here yet" when the truth is the request 500'd,
 * and there is no retry. That contradicts MILESTONE_2_MASTER_PROMPT.md P14
 * ("every fetch has loading, empty, and error states wired with a retry path"
 * / "No screen may render a blank card on failure") and it silently hides real
 * outages behind a plausible-looking empty state.
 *
 * Order matters: loading wins over error (a background refetch after a failure
 * should show the spinner, not keep the old error), and error wins over empty
 * (a failed fetch has no data, but that is not the same as having no data).
 */
export function widgetStateFor(query: QueryStatusLike, isEmpty: boolean): WidgetState {
  if (query.isLoading) return "loading";
  if (query.isError) return "error";
  return isEmpty ? "empty" : "ready";
}

/**
 * Companion to `widgetStateFor` — the retry handler for the same query.
 * Returns `undefined` when the query exposes no `refetch`, which makes
 * `WidgetError` omit its Retry button rather than render a dead one.
 */
export function retryFor(query: QueryStatusLike): (() => void) | undefined {
  return query.refetch ? () => void query.refetch?.() : undefined;
}
