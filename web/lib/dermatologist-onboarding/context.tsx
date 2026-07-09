"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

// Same shape/reasoning as lib/consultant-onboarding/context.tsx — a real, backend-
// submitted multi-step wizard, sessionStorage-backed so state survives client-side
// navigation between the standalone /dermatologist-onboarding/* routes, hydration-safe
// via useSyncExternalStore.
export interface DermatologistOnboardingState {
  medicalRegistrationNumber: string;
  medicalCouncil: string;
  hospitalClinic: string;
  yearsOfPractice: number | null;
  degrees: string[];
  boardCertifications: string[];
  specializations: string[];
  researchInterests: string;
  professionalBiography: string;
  phone: string;
  location: string;
}

const DEFAULT_STATE: DermatologistOnboardingState = {
  medicalRegistrationNumber: "",
  medicalCouncil: "",
  hospitalClinic: "",
  yearsOfPractice: null,
  degrees: [],
  boardCertifications: [],
  specializations: [],
  researchInterests: "",
  professionalBiography: "",
  phone: "",
  location: "",
};

const STORAGE_KEY = "skinlytics.dermatologist-onboarding";

interface Snapshot {
  state: DermatologistOnboardingState;
  hydrated: boolean;
}

interface ContextValue extends Snapshot {
  update: (patch: Partial<DermatologistOnboardingState>) => void;
  reset: () => void;
}

const OnboardingContext = createContext<ContextValue | null>(null);

function readFromStorage(): DermatologistOnboardingState {
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

function commit(next: DermatologistOnboardingState) {
  clientSnapshot = { state: next, hydrated: true };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

export function DermatologistOnboardingProvider({ children }: { children: ReactNode }) {
  const { state, hydrated } = useSyncExternalStore(subscribe, getClientSnapshot, () => SERVER_SNAPSHOT);

  const update = (patch: Partial<DermatologistOnboardingState>) => {
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

export function useDermatologistOnboarding(): ContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useDermatologistOnboarding must be used within DermatologistOnboardingProvider");
  }
  return ctx;
}

// Plain (non-hook) write for callers outside /dermatologist-onboarding/* — e.g. the
// dermatologist dashboard's "Edit profile" button, which isn't wrapped in
// DermatologistOnboardingProvider. See seedOnboardingDraft in
// lib/consultant-onboarding/context.tsx for the full reasoning.
export function seedOnboardingDraft(state: DermatologistOnboardingState): void {
  clientSnapshot = null;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
