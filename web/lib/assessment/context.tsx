"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

// web/designs/wireframes/assessment-*.html — a self-contained 5-step intake wizard,
// distinct from the Skin Profile screen (docs/WIREFRAMES.md screen 4, already built).
// No backend endpoint exists for this yet (Skin Assessment service is ADR-007-stubbed,
// not built — PROGRESS.md) — state lives here only, client-side, for the length of the
// wizard. Results are a deterministic client-side summary of these answers, not a real
// AI call (matches the same ADR-007 "deterministic, seeded placeholder" pattern the
// real backend stubs use, just computed in the browser since no endpoint exists).
export interface AssessmentSensitivities {
  reactsToActives: boolean;
  sunSensitive: boolean;
  rednessProne: boolean;
}

export interface AssessmentConcernPriority {
  concernId: number;
  concernName: string;
  severity: "mild" | "moderate" | "severe";
}

export type SunExposure = "indoor" | "occasional" | "outdoor" | "intense";

export interface AssessmentState {
  ageGroup: string | null;
  goals: string[];
  location: string;
  skinTypeId: number | null;
  skinTypeName: string | null;
  priorities: AssessmentConcernPriority[];
  allergies: string[];
  sensitivities: AssessmentSensitivities;
  sleepHours: number;
  sleepQuality: string;
  waterGlasses: number;
  stressLevel: number;
  sunExposure: SunExposure;
}

const DEFAULT_STATE: AssessmentState = {
  ageGroup: null,
  goals: [],
  location: "",
  skinTypeId: null,
  skinTypeName: null,
  priorities: [],
  allergies: [],
  sensitivities: { reactsToActives: false, sunSensitive: false, rednessProne: false },
  sleepHours: 7.5,
  sleepQuality: "Occasional waking",
  waterGlasses: 6,
  stressLevel: 5,
  sunExposure: "occasional",
};

const STORAGE_KEY = "skinlytics.assessment";

interface AssessmentSnapshot {
  state: AssessmentState;
  /** False only for the fixed snapshot the server (and the client's first hydration
   * pass) render, before sessionStorage has been read. A consumer that must not act on
   * a stale/default `state` — e.g. the results page's save-to-profile effect — should
   * wait for this. */
  hydrated: boolean;
}

interface AssessmentContextValue extends AssessmentSnapshot {
  update: (patch: Partial<AssessmentState>) => void;
  reset: () => void;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

function readFromStorage(): AssessmentState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

// A tiny external store (not React state) backing the wizard's answers — the same
// pattern app/(user)/dashboard/page.tsx's useGreeting uses for its own server/client
// mismatch. sessionStorage can't be read during SSR, so the server (and the client's
// *first* hydration render) must both see the same fixed SERVER_SNAPSHOT; real answers
// only appear once useSyncExternalStore switches to getClientSnapshot, which — unlike
// an effect — React runs synchronously right after hydration, so there's no
// "setState inside an effect" cascading render (this repo's React Compiler lint rule
// flags that pattern) and no window where a descendant's own effect could read stale
// DEFAULT_STATE before this provider's data is ready.
let clientSnapshot: AssessmentSnapshot | null = null;
const listeners = new Set<() => void>();

function getClientSnapshot(): AssessmentSnapshot {
  clientSnapshot ??= { state: readFromStorage(), hydrated: true };
  return clientSnapshot;
}

const SERVER_SNAPSHOT: AssessmentSnapshot = { state: DEFAULT_STATE, hydrated: false };

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: AssessmentState) {
  clientSnapshot = { state: next, hydrated: true };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const { state, hydrated } = useSyncExternalStore(subscribe, getClientSnapshot, () => SERVER_SNAPSHOT);

  // Only ever called from a user interaction (post-hydration), so `state` is always
  // the real synced value by then — no need to fall back to readFromStorage() here.
  const update = (patch: Partial<AssessmentState>) => {
    commit({ ...state, ...patch });
  };

  const reset = () => {
    clientSnapshot = { state: DEFAULT_STATE, hydrated: true };
    window.sessionStorage.removeItem(STORAGE_KEY);
    listeners.forEach((listener) => listener());
  };

  return (
    <AssessmentContext.Provider value={{ state, update, reset, hydrated }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment(): AssessmentContextValue {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}
