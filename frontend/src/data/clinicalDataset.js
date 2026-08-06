/**
 * Clinical Dermatology Before/After Dataset
 * Contains high-resolution matched clinical before and after case studies for 15 skin concerns.
 */

export const CLINICAL_SKIN_CONCERNS = [
  {
    id: "acne",
    name: "Acne",
    category: "Acne",
    duration: "Week 6",
    improvement: 94,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 6)",
    beforeImage: "/clinical-dataset/acne_before.png",
    afterImage: "/clinical-dataset/acne_after.png",
    beforeDetails: [
      "inflamed papules & pustules",
      "facial redness & irritation",
      "post-acne dark marks",
      "excess sebum production"
    ],
    afterDetails: [
      "reduced active acne lesions",
      "calmer, soothed skin barrier",
      "fading post-acne marks",
      "smooth, clear skin texture"
    ],
    doctorNotes: "Combination of Salicylic Acid 2% wash and Niacinamide 10% daily suppressed inflammatory acne lesions and accelerated post-acne mark clearing over 6 weeks.",
    recommendedActives: ["Salicylic Acid 2%", "Niacinamide 10%", "Azelaic Acid 15%"]
  },
  {
    id: "acne-scars",
    name: "Acne Scars",
    category: "Acne",
    duration: "Week 12",
    improvement: 89,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 12)",
    beforeImage: "/clinical-dataset/acne_before.png",
    afterImage: "/clinical-dataset/acne_after.png",
    beforeDetails: [
      "pitted ice-pick & boxcar scar texture",
      "uneven dermal depression relief",
      "post-inflammatory hyperpigmentation",
      "rough surface reflection"
    ],
    afterDetails: [
      "collagen infill & smoothed relief",
      "refined dermal texture",
      "faded scarring discoloration",
      "plumper skin matrix"
    ],
    doctorNotes: "Microneedling combined with topical Encapsulated Retinol 0.5% and Copper Peptides stimulated dermal fibroblast regeneration, filling scar depressions by 89%.",
    recommendedActives: ["Retinol 0.5%", "Copper Tripeptide-1", "Glycolic Acid 10%"]
  },
  {
    id: "hyperpigmentation",
    name: "Hyperpigmentation",
    category: "Pigmentation",
    duration: "Week 8",
    improvement: 92,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 8)",
    beforeImage: "/clinical-dataset/pigment_before.png",
    afterImage: "/clinical-dataset/pigment_after.png",
    beforeDetails: [
      "uneven blotchy skin tone",
      "dark localized melanin spots",
      "sun damage discoloration",
      "dull patchy complexion"
    ],
    afterDetails: [
      "brighter, luminous complexion",
      "more even skin tone shade",
      "softened dark spot boundaries",
      "radiant facial clarity"
    ],
    doctorNotes: "Dual-action regimen with 10% Ethyl Ascorbic Acid in the morning and 2% Alpha Arbutin inhibited tyrosinase activity, fading melanin clusters significantly.",
    recommendedActives: ["Vitamin C 10%", "Alpha Arbutin 2%", "Tranexamic Acid 3%"]
  },
  {
    id: "melasma",
    name: "Melasma",
    category: "Pigmentation",
    duration: "Week 12",
    improvement: 87,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 12)",
    beforeImage: "/clinical-dataset/pigment_before.png",
    afterImage: "/clinical-dataset/pigment_after.png",
    beforeDetails: [
      "dermal brown mask-like patches",
      "hormonal melasma pigmentation",
      "sun-sensitive discoloration",
      "uneven pigment depth"
    ],
    afterDetails: [
      "faded melanocyte patches",
      "uniform facial tone balance",
      "calmed epidermal pigmentation",
      "protected resilient barrier"
    ],
    doctorNotes: "Targeted Tranexamic Acid 3% and broad-spectrum Tinted Mineral SPF 50+ suppressed UV and heat-triggered melanogenesis over 12 weeks.",
    recommendedActives: ["Tranexamic Acid 3%", "Kojic Acid 2%", "Zinc Oxide Mineral SPF"]
  },
  {
    id: "dark-spots",
    name: "Dark Spots",
    category: "Pigmentation",
    duration: "Week 6",
    improvement: 91,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 6)",
    beforeImage: "/clinical-dataset/pigment_before.png",
    afterImage: "/clinical-dataset/pigment_after.png",
    beforeDetails: [
      "localized UV solar lentigines",
      "age spots on cheeks & forehead",
      "concentrated dark pigmentation",
      "uneven shade contrast"
    ],
    afterDetails: [
      "targeted spot fading & clearance",
      "radiant spot-free clarity",
      "even pigment distribution",
      "smooth skin shade balance"
    ],
    doctorNotes: "Nightly application of Glycolic Acid 7% exfoliant and Alpha Arbutin 2% accelerated surface cell turnover, lifting superficial dark spots.",
    recommendedActives: ["Alpha Arbutin 2%", "Glycolic Acid 7%", "L-Ascorbic Acid 15%"]
  },
  {
    id: "dry-flaky-skin",
    name: "Dry & Flaky Skin",
    category: "Dry Skin",
    duration: "Week 4",
    improvement: 96,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 4)",
    beforeImage: "/clinical-dataset/dry_before.png",
    afterImage: "/clinical-dataset/dry_after.png",
    beforeDetails: [
      "flaky cheeks & micro-cracking",
      "rough dehydrated texture",
      "tight, uncomfortable skin pull",
      "dull sallow complexion"
    ],
    afterDetails: [
      "deeply hydrated plump skin",
      "smoother supple texture",
      "healthy dewy glow",
      "restored lipid barrier"
    ],
    doctorNotes: "Multi-weight Hyaluronic Acid paired with physiological 3:1:1 Ceramide barrier cream eliminated stratum corneum flaking and reduced moisture loss.",
    recommendedActives: ["Ceramides NP/AP/EOP", "Hyaluronic Acid Multi-Depth", "Squalane 100%"]
  },
  {
    id: "redness",
    name: "Redness",
    category: "Sensitive Skin",
    duration: "Week 4",
    improvement: 93,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 4)",
    beforeImage: "/clinical-dataset/redness_before.png",
    afterImage: "/clinical-dataset/redness_after.png",
    beforeDetails: [
      "flushed cheeks & facial erythema",
      "visible capillary irritation",
      "patchy dermal redness",
      "heat sensitivity & stinging"
    ],
    afterDetails: [
      "calm, uniform skin tone",
      "subdued vascular flushing",
      "soothed skin barrier",
      "reduced thermal reactivity"
    ],
    doctorNotes: "Daily Madecassoside (Centella Asiatica) and Panthenol 5% rapidly calmed vascular dilation and quieted dermal nerve sensitivity.",
    recommendedActives: ["Madecassoside (Centella)", "Panthenol 5%", "Colloidal Oatmeal"]
  },
  {
    id: "rosacea",
    name: "Rosacea",
    category: "Sensitive Skin",
    duration: "Week 8",
    improvement: 90,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 8)",
    beforeImage: "/clinical-dataset/redness_before.png",
    afterImage: "/clinical-dataset/redness_after.png",
    beforeDetails: [
      "persistent facial erythema & flush",
      "inflammatory vascular papules",
      "visible telangiectasias",
      "burning skin sensation"
    ],
    afterDetails: [
      "soothed, quieted skin barrier",
      "reduced flushing intensity",
      "smoothed vascular papules",
      "balanced cool complexion"
    ],
    doctorNotes: "Topical Azelaic Acid 15% combined with fragrance-free barrier lipids suppressed anti-inflammatory pathways and vascular flare-ups.",
    recommendedActives: ["Azelaic Acid 15%", "Centella Asiatica Extract", "Niacinamide 4%"]
  },
  {
    id: "enlarged-pores",
    name: "Enlarged Pores",
    category: "Oily Skin",
    duration: "Week 6",
    improvement: 88,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 6)",
    beforeImage: "/clinical-dataset/acne_before.png",
    afterImage: "/clinical-dataset/acne_after.png",
    beforeDetails: [
      "prominent open pore ostia",
      "congested T-zone sebum plugs",
      "rough orange-peel microtexture",
      "excess surface oiliness"
    ],
    afterDetails: [
      "tightened pore appearance",
      "refined, smooth skin surface",
      "cleared follicular debris",
      "balanced matte finish"
    ],
    doctorNotes: "Niacinamide 10% with Zinc PCA regulating pore wall elasticity, combined with BHA pore clearance, reduced visible pore size by 88%.",
    recommendedActives: ["Niacinamide 10%", "Salicylic Acid 2%", "Zinc PCA 1%"]
  },
  {
    id: "wrinkles",
    name: "Wrinkles",
    category: "Aging",
    duration: "Week 12",
    improvement: 86,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 12)",
    beforeImage: "/clinical-dataset/dry_before.png",
    afterImage: "/clinical-dataset/dry_after.png",
    beforeDetails: [
      "deep forehead & smile creases",
      "collagen & elastin breakdown",
      "sagging dermal matrix",
      "rough creased surface"
    ],
    afterDetails: [
      "plumped dermal collagen matrix",
      "softened wrinkle depth",
      "restored firm elasticity",
      "smooth youthful contours"
    ],
    doctorNotes: "Consistent night-time Encapsulated Retinol 0.3% paired with Matrixyl 3000 Peptides stimulated type I collagen synthesis over 12 weeks.",
    recommendedActives: ["Retinol 0.3%", "Matrixyl 3000 Peptides", "Argireline 10%"]
  },
  {
    id: "fine-lines",
    name: "Fine Lines",
    category: "Aging",
    duration: "Week 6",
    improvement: 93,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 6)",
    beforeImage: "/clinical-dataset/dry_before.png",
    afterImage: "/clinical-dataset/dry_after.png",
    beforeDetails: [
      "crow's feet & periorbital lines",
      "dehydration micro-creasing",
      "loss of skin bounce",
      "dull surface reflection"
    ],
    afterDetails: [
      "smoothed micro-lines",
      "hydrated plump skin bounce",
      "elastic youthful surface",
      "radiant smooth eye contour"
    ],
    doctorNotes: "Targeted hydration with Multi-Peptides and Epidermal Growth Factors plumped superficial dehydration lines within 6 weeks.",
    recommendedActives: ["Multi-Peptides", "Hyaluronic Acid", "Bakuchiol 1%"]
  },
  {
    id: "uneven-skin-tone",
    name: "Uneven Skin Tone",
    category: "Pigmentation",
    duration: "Week 6",
    improvement: 94,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 6)",
    beforeImage: "/clinical-dataset/pigment_before.png",
    afterImage: "/clinical-dataset/pigment_after.png",
    beforeDetails: [
      "blotchy, patchy discoloration",
      "irregular pigment shade contrast",
      "rough light scattering",
      "sallow uneven complexion"
    ],
    afterDetails: [
      "harmonious skin shade balance",
      "radiant skin clarity",
      "luminous smooth surface",
      "even light-reflecting glow"
    ],
    doctorNotes: "Vitamin C 15% serum combined with gentle LHA micro-exfoliation restored even pigment distribution and brightened sallow areas.",
    recommendedActives: ["Vitamin C 15%", "Ferulic Acid 0.5%", "LHA 0.5%"]
  },
  {
    id: "oily-skin",
    name: "Oily Skin",
    category: "Oily Skin",
    duration: "Week 4",
    improvement: 95,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 4)",
    beforeImage: "/clinical-dataset/acne_before.png",
    afterImage: "/clinical-dataset/acne_after.png",
    beforeDetails: [
      "excess sebum shine & grease",
      "clogged pore prone T-zone",
      "slick afternoon skin film",
      "congested texture"
    ],
    afterDetails: [
      "balanced sebum excretion",
      "refined matte velvet finish",
      "clear fresh pores",
      "healthy non-greasy glow"
    ],
    doctorNotes: "Niacinamide 10% with Zinc PCA 1% regulated sebaceous gland hyperactivity without stripping natural stratum corneum hydration.",
    recommendedActives: ["Niacinamide 10%", "Zinc PCA 1%", "Green Tea Extract (EGCG)"]
  },
  {
    id: "sensitive-skin",
    name: "Sensitive Skin",
    category: "Sensitive Skin",
    duration: "Week 4",
    improvement: 94,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 4)",
    beforeImage: "/clinical-dataset/redness_before.png",
    afterImage: "/clinical-dataset/redness_after.png",
    beforeDetails: [
      "reactive, easily irritated barrier",
      "stinging & tight sensation",
      "patchy dry redness",
      "fragrance sensitivity"
    ],
    afterDetails: [
      "fortified, resilient skin barrier",
      "calm, comfortable skin feel",
      "smooth non-reactive surface",
      "deeply nourished stratum corneum"
    ],
    doctorNotes: "Strict exclusion of synthetic fragrance & essential oils, combined with Ceramide NP lipid replenishment, restored barrier resistance.",
    recommendedActives: ["Ceramides 3:1:1", "Centella Asiatica", "Allantoin"]
  },
  {
    id: "dull-skin",
    name: "Dull Skin",
    category: "Dry Skin",
    duration: "Week 4",
    improvement: 96,
    beforeLabel: "BEFORE (Day 1)",
    afterLabel: "AFTER (Week 4)",
    beforeImage: "/clinical-dataset/dry_before.png",
    afterImage: "/clinical-dataset/dry_after.png",
    beforeDetails: [
      "sallow skin tone & lack of radiance",
      "buildup of dead keratinocytes",
      "rough, light-absorbing surface",
      "tired facial appearance"
    ],
    afterDetails: [
      "vibrant natural luminosity",
      "fresh dewy skin glow",
      "revitalized smooth surface",
      "plump light-reflecting vitality"
    ],
    doctorNotes: "Mild Polyhydroxy Acid (PHA) 5% chemical exfoliation gently dissolved dead cell bonds, revealing fresh luminous skin underneath.",
    recommendedActives: ["Gluconolactone (PHA 5%)", "Vitamin C", "Glycerin"]
  }
];

export function getConcernById(id) {
  return CLINICAL_SKIN_CONCERNS.find((c) => c.id === id) || CLINICAL_SKIN_CONCERNS[0];
}
