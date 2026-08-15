"""Application-wide constants."""

ROLE_USER = "User"
ROLE_CONSULTANT = "Skincare Consultant"
ROLE_DERMATOLOGIST = "Dermatologist"
ROLE_ADMINISTRATOR = "Administrator"

ALL_ROLES = [ROLE_USER, ROLE_CONSULTANT, ROLE_DERMATOLOGIST, ROLE_ADMINISTRATOR]

SKIN_TYPES = ["Normal", "Dry", "Oily", "Combination", "Sensitive"]
STRESS_LEVELS = ["Low", "Moderate", "High"]

# --- Skin profile photo uploads ---
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
SKIN_PHOTOS_SUBDIR = "skin_photos"

# --- Concern vocabulary — must match the wizard's COMMON_CONCERNS (frontend/src/pages/Assessment.jsx) ---
CONCERN_TAGS = [
    "Acne",
    "Hyperpigmentation",
    "Dark Spots",
    "Dry Skin",
    "Oily Skin",
    "Sensitive Skin",
    "Wrinkles",
    "Fine Lines",
    "Redness",
    "Uneven Skin Tone",
]

# --- Ingredient Intelligence knowledge base (Milestone 3, Step 1) ---
# Modeled by CATEGORY since the chemical conflict matrix operates at that
# level (e.g. "any Retinoid clashes with any strong AHA/BHA"). Specific
# actives are stored as aliases, which doubles as the allergy-alias list.
SEED_INGREDIENTS = [
    {"name": "Retinoid", "category": "Retinoid", "irritation_risk": "High",
     "aliases": ["Retinol", "Retinaldehyde", "Tretinoin", "Retinyl Palmitate"],
     "description": "Vitamin A derivatives that speed cell turnover — highly effective, but the most irritation-prone active in skincare."},
    {"name": "AHA/BHA", "category": "AHA/BHA", "irritation_risk": "Medium",
     "aliases": ["Salicylic Acid", "Glycolic Acid", "Lactic Acid", "BHA", "AHA"],
     "description": "Chemical exfoliants that dissolve dead skin cells and unclog pores."},
    {"name": "Vitamin C", "category": "Vitamin C", "irritation_risk": "Medium",
     "aliases": ["L-Ascorbic Acid", "Ascorbic Acid"],
     "description": "Antioxidant that brightens tone and fades dark spots."},
    {"name": "Niacinamide", "category": "Niacinamide", "irritation_risk": "Low",
     "aliases": ["Vitamin B3", "Nicotinamide"],
     "description": "Soothes redness and regulates oil production."},
    {"name": "Hyaluronic Acid", "category": "Hyaluronic Acid", "irritation_risk": "Low",
     "aliases": ["Sodium Hyaluronate"],
     "description": "Humectant that draws water into the skin for hydration."},
    {"name": "Ceramide", "category": "Ceramide", "irritation_risk": "Low",
     "aliases": ["Ceramides", "Ceramide NP", "Ceramide AP"],
     "description": "Lipids that rebuild and protect the skin barrier."},
    {"name": "Peptide", "category": "Peptide", "irritation_risk": "Low",
     "aliases": ["Palmitoyl Pentapeptide", "Copper Peptides", "Matrixyl"],
     "description": "Amino acid chains that signal collagen production."},
    {"name": "Zinc", "category": "Zinc", "irritation_risk": "Low",
     "aliases": ["Zinc PCA", "Zinc Oxide"],
     "description": "Mineral that calms inflammation and helps regulate sebum."},
    {"name": "Benzoyl Peroxide", "category": "Benzoyl Peroxide", "irritation_risk": "High",
     "aliases": ["BPO"],
     "description": "Antibacterial acne treatment; effective but drying and reactive with other actives."},
    {"name": "Botanical Extract", "category": "Botanical Extract", "irritation_risk": "Low",
     "aliases": ["Tea Tree Oil", "Melaleuca", "Green Tea Extract", "Neem Extract"],
     "description": "Plant-derived actives with mild antibacterial or antioxidant properties."},
]

# --- Chemical Conflict Matrix (Milestone 3, Step 1) ---
# Category pairs unsafe/risky in the SAME routine step. Checked in both
# orderings by the ingredient service — order here doesn't matter.
SEED_INGREDIENT_CONFLICTS = [
    {"category_a": "Retinoid", "category_b": "AHA/BHA", "severity": "Unsafe",
     "reason": "Combining retinoids with strong AHAs/BHAs in the same step significantly increases irritation and barrier damage risk."},
    {"category_a": "Retinoid", "category_b": "Benzoyl Peroxide", "severity": "Unsafe",
     "reason": "Retinoids can be deactivated and skin over-irritated when combined with benzoyl peroxide."},
    {"category_a": "Vitamin C", "category_b": "Niacinamide", "severity": "Warning",
     "reason": "High concentrations of Vitamin C and Niacinamide together may reduce efficacy or cause flushing for sensitive skin."},
    {"category_a": "Benzoyl Peroxide", "category_b": "AHA/BHA", "severity": "Warning",
     "reason": "Benzoyl Peroxide combined with AHAs/BHAs can excessively dry and irritate the skin."},
    {"category_a": "AHA/BHA", "category_b": "Peptide", "severity": "Warning",
     "reason": "Strong exfoliation can break down peptides before they have a chance to work, reducing effectiveness."},
]

# --- Product e-store catalog (Milestone 3) ---
# Real, publicly known product/brand names (facts, not reproduced marketing
# copy or photography). Prices are representative INR street prices.
# `ingredients` lists SEED_INGREDIENTS category names present in the
# product; `concern_tags`/`skin_type_tags` drive the Recommendation Engine.
SEED_PRODUCTS = [
    {"name": "Foaming Facial Cleanser", "brand": "CeraVe", "category": "Cleanser",
     "description": "Gentle daily foaming cleanser with ceramides and hyaluronic acid.",
     "price": 999, "rating": 4.6, "review_count": 3120,
     "ingredients": ["Ceramide", "Hyaluronic Acid"], "concern_tags": ["Oily Skin"],
     "skin_type_tags": ["Normal", "Oily", "Combination"]},
    {"name": "Gentle Skin Cleanser", "brand": "Cetaphil", "category": "Cleanser",
     "description": "Soap-free, fragrance-free cleanser for sensitive and dry skin.",
     "price": 550, "rating": 4.5, "review_count": 5400,
     "ingredients": [], "concern_tags": ["Redness", "Dry Skin", "Sensitive Skin"],
     "skin_type_tags": ["Sensitive", "Dry", "Normal"]},
    {"name": "Tea Tree Face Wash", "brand": "Mamaearth", "category": "Cleanser",
     "description": "Tea tree and neem face wash for acne-prone skin.",
     "price": 349, "rating": 4.2, "review_count": 8900,
     "ingredients": ["Botanical Extract"], "concern_tags": ["Acne", "Oily Skin"],
     "skin_type_tags": ["Oily", "Combination"]},
    {"name": "SA Smoothing Cleanser", "brand": "CeraVe", "category": "Cleanser",
     "description": "Salicylic acid cleanser that exfoliates rough, bumpy skin.",
     "price": 899, "rating": 4.4, "review_count": 1750,
     "ingredients": ["AHA/BHA"], "concern_tags": ["Acne", "Oily Skin", "Dark Spots"],
     "skin_type_tags": ["Oily", "Combination"]},
    {"name": "Niacinamide 10% + Zinc 1%", "brand": "The Ordinary", "category": "Serum",
     "description": "High-strength vitamin and mineral blemish formula.",
     "price": 850, "rating": 4.5, "review_count": 12400,
     "ingredients": ["Niacinamide", "Zinc"], "concern_tags": ["Acne", "Oily Skin", "Hyperpigmentation"],
     "skin_type_tags": ["Oily", "Combination", "Normal"]},
    {"name": "Vitamin C 10% Serum", "brand": "Minimalist", "category": "Serum",
     "description": "Brightening serum with 10% L-ascorbic acid.",
     "price": 549, "rating": 4.3, "review_count": 6700,
     "ingredients": ["Vitamin C"], "concern_tags": ["Hyperpigmentation", "Dark Spots", "Uneven Skin Tone"],
     "skin_type_tags": ["Normal", "Combination", "Dry"]},
    {"name": "Hyaluronic Acid 2% + B5", "brand": "The Ordinary", "category": "Serum",
     "description": "Multi-depth hydration serum with vitamin B5.",
     "price": 750, "rating": 4.5, "review_count": 9800,
     "ingredients": ["Hyaluronic Acid"], "concern_tags": ["Wrinkles", "Dry Skin", "Fine Lines"],
     "skin_type_tags": ["Dry", "Normal", "Sensitive", "Combination"]},
    {"name": "Vitamin C Glow Serum", "brand": "Dot & Key", "category": "Serum",
     "description": "10% vitamin C serum for radiance and even tone.",
     "price": 695, "rating": 4.2, "review_count": 3200,
     "ingredients": ["Vitamin C"], "concern_tags": ["Hyperpigmentation", "Dark Spots", "Uneven Skin Tone"],
     "skin_type_tags": ["Normal", "Combination"]},
    {"name": "Retinol 0.5% in Squalane", "brand": "The Ordinary", "category": "Treatment",
     "description": "Entry-level retinol treatment for fine lines and texture.",
     "price": 890, "rating": 4.4, "review_count": 5600,
     "ingredients": ["Retinoid"], "concern_tags": ["Wrinkles", "Fine Lines", "Dark Spots"],
     "skin_type_tags": ["Normal", "Combination", "Dry"]},
    {"name": "Glycolic Acid 7% Toning Solution", "brand": "The Ordinary", "category": "Toner",
     "description": "Exfoliating glycolic acid toner for texture and tone.",
     "price": 750, "rating": 4.3, "review_count": 4200,
     "ingredients": ["AHA/BHA"], "concern_tags": ["Dark Spots", "Hyperpigmentation", "Oily Skin", "Uneven Skin Tone"],
     "skin_type_tags": ["Normal", "Combination", "Oily"]},
    {"name": "Anthelios UVMune 400 Sunscreen SPF50+", "brand": "La Roche-Posay", "category": "Sunscreen",
     "description": "Broad-spectrum, water-resistant daily sunscreen.",
     "price": 1590, "rating": 4.6, "review_count": 4100,
     "ingredients": [], "concern_tags": ["Hyperpigmentation", "Sensitive Skin"],
     "skin_type_tags": ["Sensitive", "Normal", "Dry", "Oily", "Combination"]},
    {"name": "Ultra Sheer Dry-Touch Sunscreen SPF50", "brand": "Neutrogena", "category": "Sunscreen",
     "description": "Lightweight, non-greasy broad-spectrum sunscreen.",
     "price": 550, "rating": 4.3, "review_count": 7600,
     "ingredients": [], "concern_tags": ["Hyperpigmentation", "Oily Skin"],
     "skin_type_tags": ["Oily", "Combination", "Normal"]},
    {"name": "Sunscreen SPF 50 PA++++", "brand": "Minimalist", "category": "Sunscreen",
     "description": "Matte-finish sunscreen with no white cast.",
     "price": 399, "rating": 4.4, "review_count": 5200,
     "ingredients": [], "concern_tags": ["Hyperpigmentation", "Oily Skin"],
     "skin_type_tags": ["Oily", "Combination", "Normal", "Dry"]},
    {"name": "Moisturizing Cream", "brand": "CeraVe", "category": "Moisturizer",
     "description": "24-hour hydration with 3 essential ceramides.",
     "price": 1200, "rating": 4.7, "review_count": 8300,
     "ingredients": ["Ceramide", "Hyaluronic Acid"], "concern_tags": ["Wrinkles", "Redness", "Dry Skin"],
     "skin_type_tags": ["Dry", "Normal", "Sensitive"]},
    {"name": "Moisturising Cream", "brand": "Cetaphil", "category": "Moisturizer",
     "description": "Rich, fast-absorbing cream for dry, sensitive skin.",
     "price": 700, "rating": 4.5, "review_count": 6100,
     "ingredients": ["Ceramide"], "concern_tags": ["Redness", "Wrinkles", "Dry Skin", "Sensitive Skin"],
     "skin_type_tags": ["Dry", "Sensitive", "Normal"]},
    {"name": "Hydro Boost Water Gel", "brand": "Neutrogena", "category": "Moisturizer",
     "description": "Hyaluronic-acid gel moisturizer for a dewy finish.",
     "price": 1150, "rating": 4.5, "review_count": 9400,
     "ingredients": ["Hyaluronic Acid"], "concern_tags": ["Oily Skin", "Wrinkles"],
     "skin_type_tags": ["Oily", "Combination", "Normal"]},
    {"name": "Green Tea Clear Face Toner", "brand": "Plum", "category": "Toner",
     "description": "Alcohol-free toner that minimizes pores and controls oil.",
     "price": 425, "rating": 4.3, "review_count": 4800,
     "ingredients": ["Botanical Extract"], "concern_tags": ["Oily Skin", "Acne"],
     "skin_type_tags": ["Oily", "Combination"]},
    {"name": "Green Tea Fresh Toner", "brand": "Innisfree", "category": "Toner",
     "description": "Lightweight toner that hydrates and soothes.",
     "price": 900, "rating": 4.4, "review_count": 3900,
     "ingredients": ["Botanical Extract"], "concern_tags": ["Oily Skin", "Redness"],
     "skin_type_tags": ["Oily", "Combination", "Normal"]},
    {"name": "Super Volcanic Pore Clay Mask", "brand": "Innisfree", "category": "Mask",
     "description": "Volcanic clay mask that absorbs excess oil and refines pores.",
     "price": 1450, "rating": 4.5, "review_count": 3400,
     "ingredients": ["Botanical Extract"], "concern_tags": ["Oily Skin", "Acne"],
     "skin_type_tags": ["Oily", "Combination"]},
    {"name": "Feeling Beautiful Dead Sea Minerals Facial Clay Mask", "brand": "Freeman", "category": "Mask",
     "description": "Mineral clay mask that detoxifies and brightens dull, uneven skin.",
     "price": 450, "rating": 4.2, "review_count": 2800,
     "ingredients": [], "concern_tags": ["Oily Skin", "Uneven Skin Tone"],
     "skin_type_tags": ["Oily", "Combination", "Normal"]},
    {"name": "My Real Squeeze Mask - Aloe", "brand": "Innisfree", "category": "Mask",
     "description": "Soothing aloe sheet mask that hydrates dry, sensitive, irritated skin.",
     "price": 150, "rating": 4.4, "review_count": 5200,
     "ingredients": ["Hyaluronic Acid", "Botanical Extract"], "concern_tags": ["Dry Skin", "Sensitive Skin", "Redness"],
     "skin_type_tags": ["Dry", "Sensitive", "Normal"]},
]

# Seed accounts created automatically on first run (one per role).
SEED_ACCOUNTS = [
    {
        "full_name": "Demo User",
        "email": "user@demo.com",
        "phone_number": "9000000001",
        "password": "User@1234",
        "role": ROLE_USER,
    },
    {
        "full_name": "Demo Consultant",
        "email": "consultant@demo.com",
        "phone_number": "9000000002",
        "password": "Consultant@1234",
        "role": ROLE_CONSULTANT,
    },
    {
        "full_name": "Demo Dermatologist",
        "email": "dermatologist@demo.com",
        "phone_number": "9000000003",
        "password": "Dermatologist@1234",
        "role": ROLE_DERMATOLOGIST,
    },
    {
        "full_name": "Demo Administrator",
        "email": "admin@demo.com",
        "phone_number": "9000000004",
        "password": "Admin@1234",
        "role": ROLE_ADMINISTRATOR,
    },
]
