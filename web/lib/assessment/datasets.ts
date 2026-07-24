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
