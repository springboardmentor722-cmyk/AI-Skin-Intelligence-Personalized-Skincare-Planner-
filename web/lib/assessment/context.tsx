"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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

interface AssessmentContextValue {
  state: AssessmentState;
  update: (patch: Partial<AssessmentState>) => void;
  reset: () => void;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

function loadInitial(): AssessmentState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssessmentState>(loadInitial);

  const update = (patch: Partial<AssessmentState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const reset = () => {
    setState(DEFAULT_STATE);
    if (typeof window !== "undefined") window.sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AssessmentContext.Provider value={{ state, update, reset }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment(): AssessmentContextValue {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}
