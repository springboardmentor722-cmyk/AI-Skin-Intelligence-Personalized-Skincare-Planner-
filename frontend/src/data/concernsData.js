/**
 * Clinical Dermatology Skin Concerns Data Registry
 * Data-driven registry for visual cards, clinical images, 1-line descriptions, and typical symptoms.
 */

export const CLINICAL_CONCERNS_DATA = [
  {
    id: "Acne",
    title: "Acne",
    description: "Inflamed papules, pustules & congested pores",
    image: "/images/concerns/acne.jpg",
    alt: "Clinical dermatology image of active facial acne and inflamed lesions",
    symptoms: ["Pimples", "Whiteheads", "Blackheads", "Red papules"],
    defaultSeverity: 7
  },
  {
    id: "Dark Spots",
    title: "Dark Spots",
    description: "Post-acne mark hyperpigmentation & sun spots",
    image: "/images/concerns/dark-spots.jpg",
    alt: "Close-up clinical image of dark spots and localized pigmentation",
    symptoms: ["Post-acne marks", "Sun spots", "Age spots", "UV freckles"],
    defaultSeverity: 6
  },
  {
    id: "Hyperpigmentation",
    title: "Hyperpigmentation",
    description: "Uneven brown melanin patches & sun damage",
    image: "/images/concerns/hyperpigmentation.jpg",
    alt: "Clinical photography showing dermal hyperpigmentation patches",
    symptoms: ["Dark patches", "Uneven tone", "Melanin clusters", "Sun damage"],
    defaultSeverity: 6
  },
  {
    id: "Redness",
    title: "Redness",
    description: "Vascular flushing, inflammation & reactive skin",
    image: "/images/concerns/redness.jpg",
    alt: "Clinical dermatology close-up of facial redness and skin flushing",
    symptoms: ["Flushed cheeks", "Capillary redness", "Irritation", "Heat sensitivity"],
    defaultSeverity: 5
  },
  {
    id: "Wrinkles",
    title: "Wrinkles",
    description: "Forehead lines, nasolabial folds & collagen loss",
    image: "/images/concerns/wrinkles.jpg",
    alt: "Clinical macro photograph of skin wrinkles and expression lines",
    symptoms: ["Forehead creases", "Nasolabial folds", "Elasticity loss", "Deep lines"],
    defaultSeverity: 5
  },
  {
    id: "Fine Lines",
    title: "Fine Lines",
    description: "Crow's feet & superficial dehydration creases",
    image: "/images/concerns/fine-lines.jpg",
    alt: "Clinical view of periorbital fine lines and dehydration texture",
    symptoms: ["Crow's feet", "Dehydration lines", "Eye micro-wrinkles", "Surface creasing"],
    defaultSeverity: 4
  },
  {
    id: "Dryness",
    title: "Dryness",
    description: "Flaky stratum corneum & rough lipid deficit",
    image: "/images/concerns/dryness.jpg",
    alt: "Macro dermatology view of dry flaky skin and micro-cracking",
    symptoms: ["Tight skin", "Flaking", "Rough texture", "Dehydration pull"],
    defaultSeverity: 5
  },
  {
    id: "Oiliness",
    title: "Oiliness",
    description: "Hyper-seborrhea, slick T-zone & shine",
    image: "/images/concerns/oiliness.jpg",
    alt: "Clinical photo showing excess facial sebum and T-zone oiliness",
    symptoms: ["Excess shine", "Greasy T-zone", "Enlarged pores", "Clogged sebum"],
    defaultSeverity: 6
  },
  {
    id: "Sensitive Skin",
    title: "Sensitive Skin",
    description: "Stinging, compromised barrier & flare-ups",
    image: "/images/concerns/sensitive.jpg",
    alt: "Dermatology image of sensitive reactive skin barrier",
    symptoms: ["Stinging sensation", "Patchy irritation", "Product reactivity", "Tight feeling"],
    defaultSeverity: 6
  },
  {
    id: "Uneven Tone",
    title: "Uneven Tone",
    description: "Patchy complexion, sallow tone & dullness",
    image: "/images/concerns/uneven-tone.jpg",
    alt: "Clinical photography of uneven skin tone and sallow patchiness",
    symptoms: ["Patchy shade", "Blotchy tone", "Dull complexion", "Discoloration"],
    defaultSeverity: 5
  },
  {
    id: "Melasma",
    title: "Melasma",
    description: "Hormonal mask-like dermal pigmentation",
    image: "/images/concerns/melasma.jpg",
    alt: "Clinical dermatology image of facial melasma pigmentation",
    symptoms: ["Mask-like patches", "Hormonal dark spots", "Cheek discoloration"],
    defaultSeverity: 6
  },
  {
    id: "Rosacea",
    title: "Rosacea",
    description: "Persistent facial erythema & vascular papules",
    image: "/images/concerns/rosacea.jpg",
    alt: "Clinical dermatology image of facial rosacea and capillary flush",
    symptoms: ["Persistent flushing", "Vascular papules", "Visible capillaries", "Burning feel"],
    defaultSeverity: 6
  },
  {
    id: "Enlarged Pores",
    title: "Enlarged Pores",
    description: "Prominent open ostia & orange-peel texture",
    image: "/images/concerns/enlarged-pores.jpg",
    alt: "Clinical close-up of enlarged T-zone pores",
    symptoms: ["Visible pore ostia", "Rough texture", "Sebum plugs"],
    defaultSeverity: 5
  },
  {
    id: "Acne Scars",
    title: "Acne Scars",
    description: "Pitted ice-pick, boxcar & rolling scar depressions",
    image: "/images/concerns/acne-scars.jpg",
    alt: "Clinical close-up of pitted acne scarring",
    symptoms: ["Pitted texture", "Scar depressions", "Uneven dermal relief"],
    defaultSeverity: 6
  },
  {
    id: "Dullness",
    title: "Dullness",
    description: "Lack of natural radiance & dead cell accumulation",
    image: "/images/concerns/dullness.jpg",
    alt: "Clinical view of dull sallow skin complexion",
    symptoms: ["Sallow skin", "Lack of radiance", "Rough surface reflection"],
    defaultSeverity: 4
  }
];

export function getConcernDataById(id) {
  return CLINICAL_CONCERNS_DATA.find(c => c.id.toLowerCase() === id.toLowerCase()) || {
    id,
    title: id,
    description: "Dermatological skin concern",
    image: "/images/concerns/acne.jpg",
    alt: `Clinical photo of ${id}`,
    symptoms: ["Targeted dermal symptom"],
    defaultSeverity: 5
  };
}
