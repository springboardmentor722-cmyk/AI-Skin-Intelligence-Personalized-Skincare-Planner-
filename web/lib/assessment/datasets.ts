import skinConcernsData from "./skin-concerns.json";
import skinTypesData from "./skin-types.json";

// Milestone 2 P6 — in-built visual datasets (MILESTONE 2.docx §A/§B, docs/
// DECISIONS.md ADR-021 C1/C2, ADR-025). Single source of truth: this same JSON
// (web/lib/assessment/skin-{types,concerns}.json) is what
// backend/tests/test_visual_datasets.py validates against the live
// skin_types/skin_concerns tables — one file, two consumers, not a copy on each
// side that could drift.

export interface SkinTypeDataset {
  id: string;
  title: string;
  description: string;
  image_url: string;
  backend_enum: string;
}

export interface SkinConcernDataset {
  id: string;
  title: string;
  description: string;
  image_url: string;
  backend_field: string;
}

export const SKIN_TYPES: SkinTypeDataset[] = skinTypesData;
export const SKIN_CONCERNS: SkinConcernDataset[] = skinConcernsData;

// Milestone 2 P8 — matches a real GET /api/v1/skin-types|skin-concerns row to its
// P6 dataset entry for the wizard's card art/copy. `backend_enum` already equals
// `skin_type_name` verbatim (P6's own seed); `backend_field` is mechanically
// `{concern_name, lowercased, spaces->_}_severity` for all 10 seeded concerns
// (confirmed live against the seeded skin_concerns table this session) — no
// hand-maintained name table to drift.
export function severityFieldForConcernName(concernName: string): string {
  return `${concernName.toLowerCase().replace(/\s+/g, "_")}_severity`;
}

export function datasetForConcernName(concernName: string): SkinConcernDataset | undefined {
  const field = severityFieldForConcernName(concernName);
  return SKIN_CONCERNS.find((c) => c.backend_field === field);
}

export function datasetForSkinTypeName(skinTypeName: string): SkinTypeDataset | undefined {
  return SKIN_TYPES.find((t) => t.backend_enum === skinTypeName);
}
