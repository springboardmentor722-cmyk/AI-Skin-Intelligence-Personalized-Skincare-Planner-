import { Droplets, FlaskConical, Moon, Shield, Sparkles, Sun, type LucideIcon } from "lucide-react";

// Products/ingredients/routine steps each carry a free-text `category` column
// (database_schemas/skinlytics_postgresql_schema_v3.sql: products.category,
// ingredients.category, routine_steps.category's 6 canonical values) — this maps
// that real text to a purposeful icon instead of one repeated flask placeholder.
// Unmapped/unknown category strings keep the previous FlaskConical default.
const RULES: [RegExp, LucideIcon][] = [
  [/cleans/i, Droplets],
  [/exfoliat|acid|peel/i, Sparkles],
  [/sun|spf|uv/i, Sun],
  [/night|retinoid|retinol/i, Moon],
  [/antioxidant|barrier|protect/i, Shield],
  [/moistur|hydrat|humectant|emollient/i, Droplets],
];

export function categoryIcon(category: string | null | undefined): LucideIcon {
  if (!category) return FlaskConical;
  return RULES.find(([re]) => re.test(category))?.[1] ?? FlaskConical;
}
