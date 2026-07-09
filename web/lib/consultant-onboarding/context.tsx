"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

// A real, backend-submitted multi-step wizard (unlike lib/assessment/context.tsx's
// deterministic client-only preview — this one persists to consultant_profiles via
// app/api/consultant-onboarding/submit/route.ts) but the same step-to-step state
// mechanism: sessionStorage-backed, survives client-side navigation between the
// standalone /consultant-onboarding/* routes, hydration-safe via useSyncExternalStore
// (same reasoning as lib/assessment/context.tsx's own comment).
export interface ConsultantOnboardingState {
  qualifications: string;
  yearsOfExperience: number | null;
  currentOrganization: string;
  licenseNumber: string;
  specializations: string[];
  areasOfExpertise: string[];
  languages: string[];
  consultationModes: string[];
  availability: string;
  biography: string;
  phone: string;
  location: string;
  clinicAddress: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

const DEFAULT_STATE: ConsultantOnboardingState = {
  qualifications: "",
  yearsOfExperience: null,
  currentOrganization: "",
  licenseNumber: "",
  specializations: [],
  areasOfExpertise: [],
  languages: [],
  consultationModes: [],
  availability: "",
  biography: "",
  phone: "",
  location: "",
  clinicAddress: "",
  linkedinUrl: "",
  portfolioUrl: "",
};

const STORAGE_KEY = "skinlytics.consultant-onboarding";

interface Snapshot {
  state: ConsultantOnboardingState;
  hydrated: boolean;
}

interface ContextValue extends Snapshot {
  update: (patch: Partial<ConsultantOnboardingState>) => void;
  reset: () => void;
}

const OnboardingContext = createContext<ContextValue | null>(null);

function readFromStorage(): ConsultantOnboardingState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let clientSnapshot: Snapshot | null = null;
const listeners = new Set<() => void>();

function getClientSnapshot(): Snapshot {
  clientSnapshot ??= { state: readFromStorage(), hydrated: true };
  return clientSnapshot;
}

const SERVER_SNAPSHOT: Snapshot = { state: DEFAULT_STATE, hydrated: false };

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: ConsultantOnboardingState) {
  clientSnapshot = { state: next, hydrated: true };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

export function ConsultantOnboardingProvider({ children }: { children: ReactNode }) {
  const { state, hydrated } = useSyncExternalStore(subscribe, getClientSnapshot, () => SERVER_SNAPSHOT);

  const update = (patch: Partial<ConsultantOnboardingState>) => {
    commit({ ...state, ...patch });
  };

  const reset = () => {
    clientSnapshot = { state: DEFAULT_STATE, hydrated: true };
    window.sessionStorage.removeItem(STORAGE_KEY);
    listeners.forEach((listener) => listener());
  };

  return (
    <OnboardingContext.Provider value={{ state, update, reset, hydrated }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useConsultantOnboarding(): ContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useConsultantOnboarding must be used within ConsultantOnboardingProvider");
  }
  return ctx;
}

// Plain (non-hook) write for callers outside /consultant-onboarding/* — e.g. the
// consultant dashboard's "Edit profile" button (app/consultant/dashboard/page.tsx),
// which isn't wrapped in ConsultantOnboardingProvider. Writes straight to
// sessionStorage and drops the cached snapshot so the *next* mount of the provider
// (once navigation lands on a route it does wrap) reads this fresh, rather than an
// in-memory value cached from earlier in the same session.
export function seedOnboardingDraft(state: ConsultantOnboardingState): void {
  clientSnapshot = null;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
