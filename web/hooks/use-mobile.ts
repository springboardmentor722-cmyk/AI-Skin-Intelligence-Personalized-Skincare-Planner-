import * as React from "react"

const MOBILE_BREAKPOINT = 768

// useSyncExternalStore instead of the generated hook's effect+setState pattern — this
// repo's React Compiler ESLint rule flags synchronous setState in an effect (the same
// issue ThemeToggle hit earlier, docs in PROGRESS.md); subscribing via
// useSyncExternalStore avoids the effect entirely and is also the React-correct way to
// read external, non-React state like window size.
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
