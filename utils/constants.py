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

# --- Product e-store catalog (Milestone 3) ---
# Real, publicly known product/brand names (facts, not reproduced marketing
# copy or photography). Prices are representative INR street prices.
SEED_PRODUCTS = [
    {"name": "Foaming Facial Cleanser", "brand": "CeraVe", "category": "Cleanser",
     "description": "Gentle daily foaming cleanser with ceramides and hyaluronic acid.",
     "price": 999, "rating": 4.6, "review_count": 3120},
    {"name": "Gentle Skin Cleanser", "brand": "Cetaphil", "category": "Cleanser",
     "description": "Soap-free, fragrance-free cleanser for sensitive and dry skin.",
     "price": 550, "rating": 4.5, "review_count": 5400},
    {"name": "Tea Tree Face Wash", "brand": "Mamaearth", "category": "Cleanser",
     "description": "Tea tree and neem face wash for acne-prone skin.",
     "price": 349, "rating": 4.2, "review_count": 8900},
    {"name": "SA Smoothing Cleanser", "brand": "CeraVe", "category": "Cleanser",
     "description": "Salicylic acid cleanser that exfoliates rough, bumpy skin.",
     "price": 899, "rating": 4.4, "review_count": 1750},
    {"name": "Niacinamide 10% + Zinc 1%", "brand": "The Ordinary", "category": "Serum",
     "description": "High-strength vitamin and mineral blemish formula.",
     "price": 850, "rating": 4.5, "review_count": 12400},
    {"name": "Vitamin C 10% Serum", "brand": "Minimalist", "category": "Serum",
     "description": "Brightening serum with 10% L-ascorbic acid.",
     "price": 549, "rating": 4.3, "review_count": 6700},
    {"name": "Hyaluronic Acid 2% + B5", "brand": "The Ordinary", "category": "Serum",
     "description": "Multi-depth hydration serum with vitamin B5.",
     "price": 750, "rating": 4.5, "review_count": 9800},
    {"name": "Vitamin C Glow Serum", "brand": "Dot & Key", "category": "Serum",
     "description": "10% vitamin C serum for radiance and even tone.",
     "price": 695, "rating": 4.2, "review_count": 3200},
    {"name": "Anthelios UVMune 400 Sunscreen SPF50+", "brand": "La Roche-Posay", "category": "Sunscreen",
     "description": "Broad-spectrum, water-resistant daily sunscreen.",
     "price": 1590, "rating": 4.6, "review_count": 4100},
    {"name": "Ultra Sheer Dry-Touch Sunscreen SPF50", "brand": "Neutrogena", "category": "Sunscreen",
     "description": "Lightweight, non-greasy broad-spectrum sunscreen.",
     "price": 550, "rating": 4.3, "review_count": 7600},
    {"name": "Sunscreen SPF 50 PA++++", "brand": "Minimalist", "category": "Sunscreen",
     "description": "Matte-finish sunscreen with no white cast.",
     "price": 399, "rating": 4.4, "review_count": 5200},
    {"name": "Moisturizing Cream", "brand": "CeraVe", "category": "Moisturizer",
     "description": "24-hour hydration with 3 essential ceramides.",
     "price": 1200, "rating": 4.7, "review_count": 8300},
    {"name": "Moisturising Cream", "brand": "Cetaphil", "category": "Moisturizer",
     "description": "Rich, fast-absorbing cream for dry, sensitive skin.",
     "price": 700, "rating": 4.5, "review_count": 6100},
    {"name": "Hydro Boost Water Gel", "brand": "Neutrogena", "category": "Moisturizer",
     "description": "Hyaluronic-acid gel moisturizer for a dewy finish.",
     "price": 1150, "rating": 4.5, "review_count": 9400},
    {"name": "Green Tea Clear Face Toner", "brand": "Plum", "category": "Toner",
     "description": "Alcohol-free toner that minimizes pores and controls oil.",
     "price": 425, "rating": 4.3, "review_count": 4800},
    {"name": "Green Tea Fresh Toner", "brand": "Innisfree", "category": "Toner",
     "description": "Lightweight toner that hydrates and soothes.",
     "price": 900, "rating": 4.4, "review_count": 3900},
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
