// Tier boundaries are NOT arbitrary — they match the bands the scoring engine
// already treats as meaningful (backend/app/services/scores/constants.py):
// CONDITION_MEDIUM_SEVERITY_MIN = 4, CONDITION_HIGH_SEVERITY_MIN = 8. Keep these
// two files' boundaries in lockstep; this comment is the link between them.
export type SeverityTier = "low" | "medium" | "high";

export const SEVERITY_BANDS = [
  { min: 8, tier: "high", label: "High" },
  { min: 4, tier: "medium", label: "Medium" },
  { min: 0, tier: "low", label: "Low" },
] as const satisfies readonly { min: number; tier: SeverityTier; label: string }[];

export function getSeverityBand(rating: number): { tier: SeverityTier; label: string } {
  const band = SEVERITY_BANDS.find((b) => rating >= b.min) ?? SEVERITY_BANDS[SEVERITY_BANDS.length - 1];
  return { tier: band.tier, label: band.label };
}
