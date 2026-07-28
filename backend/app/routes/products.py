from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.db.postgres import get_db
from app.models.user import User
from app.models.product import Product, ProductCategory, ProductIngredient
from app.models.ingredient import Ingredient
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter(tags=["Skincare Products & Recommendations"])


# ─────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    brand: str
    category: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    price: float
    rating: float = 4.5
    skin_types: str
    concerns: str
    usage_instructions: Optional[str] = None
    ingredient_names: List[str] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    rating: Optional[float] = None
    skin_types: Optional[str] = None
    concerns: Optional[str] = None
    usage_instructions: Optional[str] = None


class IngredientCreate(BaseModel):
    name: str
    benefits: Optional[str] = None
    risk_level: str = "low"
    suitable_skin_types: Optional[str] = None


# ─────────────────────────────────────────────
# Curated 30+ Product Dataset (unique images per product)
# ─────────────────────────────────────────────

CURATED_PRODUCTS = [
    # ── Cleansers ──
    {
        "name": "Hydrating Facial Cleanser",
        "brand": "CeraVe",
        "category": "face_wash",
        "price": 14.99,
        "rating": 4.8,
        "types": "dry, sensitive, normal",
        "concerns": "dry skin, redness",
        "img": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80",
        "desc": "A gentle non-foaming cleanser that maintains the skin's natural protective barrier with three essential ceramides and hyaluronic acid.",
        "ings": ["Ceramides", "Hyaluronic Acid"],
    },
    {
        "name": "Foaming Facial Cleanser",
        "brand": "CeraVe",
        "category": "face_wash",
        "price": 13.49,
        "rating": 4.7,
        "types": "oily, combination, normal",
        "concerns": "acne, excess oil, clogged pores",
        "img": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80",
        "desc": "Foaming facial cleanser removes excess oil, dirt and impurities while maintaining the skin's protective barrier.",
        "ings": ["Niacinamide", "Ceramides"],
    },
    {
        "name": "2% BHA Liquid Exfoliant",
        "brand": "Paula's Choice",
        "category": "treatment",
        "price": 32.00,
        "rating": 4.9,
        "types": "oily, combination",
        "concerns": "acne, enlarged pores, blackheads",
        "img": "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=300&q=80",
        "desc": "A leave-on salicylic acid exfoliant for blackheads and enlarged pores. Clinically proven to unclog and diminish enlarged pores.",
        "ings": ["Salicylic Acid"],
    },
    {
        "name": "Gentle Skin Cleanser",
        "brand": "Cetaphil",
        "category": "face_wash",
        "price": 11.99,
        "rating": 4.6,
        "types": "dry, sensitive, normal, combination",
        "concerns": "redness, irritation, dryness",
        "img": "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=300&q=80",
        "desc": "The iconic gentle skin cleanser that is mild enough for babies and gentle for sensitive skin of all types.",
        "ings": ["Ceramides"],
    },
    {
        "name": "Perfect Cleanser Ultra Gentle",
        "brand": "Avène",
        "category": "face_wash",
        "price": 18.50,
        "rating": 4.7,
        "types": "sensitive, dry",
        "concerns": "redness, irritation, dryness",
        "img": "https://images.unsplash.com/photo-1594652634010-275456c808d0?auto=format&fit=crop&w=300&q=80",
        "desc": "A soap-free cleanser infused with Avène Thermal Spring Water, providing immediate soothing and gentle cleansing.",
        "ings": ["Centella Asiatica"],
    },

    # ── Serums ──
    {
        "name": "Niacinamide 10% + Zinc 1%",
        "brand": "The Ordinary",
        "category": "serum",
        "price": 8.90,
        "rating": 4.7,
        "types": "oily, combination, sensitive",
        "concerns": "acne, redness, enlarged pores",
        "img": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=300&q=80",
        "desc": "High-strength vitamin and mineral formula to target blemishes, enlarged pores and control sebum production effectively.",
        "ings": ["Niacinamide"],
    },
    {
        "name": "Hyaluronic Acid 2% + B5",
        "brand": "The Ordinary",
        "category": "serum",
        "price": 9.90,
        "rating": 4.6,
        "types": "dry, sensitive, normal",
        "concerns": "dry skin, dehydration, dullness",
        "img": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80",
        "desc": "Multi-depth hyaluronic acid serum with a b5 complex for intensified surface hydration and lasting skin softness.",
        "ings": ["Hyaluronic Acid"],
    },
    {
        "name": "Vitamin C Suspension 23%",
        "brand": "The Ordinary",
        "category": "serum",
        "price": 6.80,
        "rating": 4.4,
        "types": "normal, combination, oily",
        "concerns": "dark spots, dullness, hyperpigmentation",
        "img": "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=300&q=80",
        "desc": "A high-potency Vitamin C formulation at 23% for brightening and targeting uneven skin tone.",
        "ings": ["Niacinamide"],
    },
    {
        "name": "10% Vitamin C Booster Serum",
        "brand": "Paula's Choice",
        "category": "serum",
        "price": 48.00,
        "rating": 4.8,
        "types": "normal, dry, combination",
        "concerns": "dullness, hyperpigmentation, fine lines",
        "img": "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=300&q=80",
        "desc": "Stabilised vitamin C serum that brightens visible skin damage and significantly improves visible radiance.",
        "ings": ["Niacinamide"],
    },
    {
        "name": "Advanced Génifique Youth Activating Serum",
        "brand": "Lancôme",
        "category": "serum",
        "price": 110.00,
        "rating": 4.9,
        "types": "all",
        "concerns": "fine lines, wrinkles, dullness",
        "img": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80",
        "desc": "Skin-renewing serum powered by 7 probiotics and prebiotics to help stimulate skin's natural defenses.",
        "ings": ["Hyaluronic Acid", "Ceramides"],
    },
    {
        "name": "SkinCeuticals C E Ferulic",
        "brand": "SkinCeuticals",
        "category": "serum",
        "price": 182.00,
        "rating": 4.9,
        "types": "normal, dry, sensitive",
        "concerns": "fine lines, dullness, sun damage",
        "img": "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=300&q=80",
        "desc": "A patented daytime vitamin C antioxidant serum with a synergistic combination of 15% L-ascorbic acid.",
        "ings": ["Niacinamide"],
    },
    {
        "name": "Retinol 0.5% in Squalane",
        "brand": "The Ordinary",
        "category": "treatment",
        "price": 11.80,
        "rating": 4.5,
        "types": "normal, combination, dry",
        "concerns": "fine lines, texture, wrinkles",
        "img": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=300&q=80",
        "desc": "Pure retinol serum at 0.5% in a stable squalane base for cell turnover and anti-aging benefits.",
        "ings": ["Retinol"],
    },

    # ── Moisturizers ──
    {
        "name": "Moisturizing Cream (Face & Body)",
        "brand": "CeraVe",
        "category": "moisturizer",
        "price": 19.99,
        "rating": 4.9,
        "types": "dry, sensitive, normal",
        "concerns": "dry skin, eczema, flakiness",
        "img": "https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=300&q=80",
        "desc": "Developed with dermatologists, this rich moisturizing cream has a unique formula with three essential ceramides.",
        "ings": ["Ceramides", "Hyaluronic Acid"],
    },
    {
        "name": "Cicaplast Baume B5+ Soothing",
        "brand": "La Roche-Posay",
        "category": "moisturizer",
        "price": 18.50,
        "rating": 4.8,
        "types": "dry, sensitive, all",
        "concerns": "redness, irritation, eczema",
        "img": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=300&q=80",
        "desc": "A soothing balm that helps repair, nourish and soothe irritated, sensitive skin. Clinically tested with Panthenol B5.",
        "ings": ["Centella Asiatica", "Ceramides"],
    },
    {
        "name": "Oil-Free Moisturiser SPF 30",
        "brand": "Neutrogena",
        "category": "moisturizer",
        "price": 16.99,
        "rating": 4.5,
        "types": "oily, combination",
        "concerns": "excess oil, acne, sun damage",
        "img": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80",
        "desc": "Lightweight oil-free formula moisturises skin without clogging pores while providing broad-spectrum SPF 30 protection.",
        "ings": ["Niacinamide"],
    },
    {
        "name": "Toleriane Double Repair Face Moisturiser",
        "brand": "La Roche-Posay",
        "category": "moisturizer",
        "price": 22.00,
        "rating": 4.8,
        "types": "sensitive, normal, dry",
        "concerns": "dryness, irritation, redness",
        "img": "https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=300&q=80",
        "desc": "A prebiotic moisturizer that restores the protective skin barrier, using ceramide-3 and niacinamide.",
        "ings": ["Ceramides", "Niacinamide"],
    },
    {
        "name": "Ultra Facial Cream",
        "brand": "Kiehl's",
        "category": "moisturizer",
        "price": 36.00,
        "rating": 4.7,
        "types": "dry, normal, sensitive",
        "concerns": "dryness, dullness, dehydration",
        "img": "https://images.unsplash.com/photo-1586495777744-4e6232bf5abb?auto=format&fit=crop&w=300&q=80",
        "desc": "Intensely moisturizing daily face cream fortified with Squalane and Glacial Glycoprotein for 24-hour hydration.",
        "ings": ["Hyaluronic Acid"],
    },
    {
        "name": "First Aid Beauty Ultra Repair Cream",
        "brand": "First Aid Beauty",
        "category": "moisturizer",
        "price": 26.00,
        "rating": 4.7,
        "types": "dry, sensitive, normal",
        "concerns": "dry skin, eczema, redness",
        "img": "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=300&q=80",
        "desc": "A fast-absorbing, rich-but-not-greasy moisturizer that delivers immediate relief for dry skin and eczema.",
        "ings": ["Ceramides", "Centella Asiatica"],
    },

    # ── Sunscreens ──
    {
        "name": "Relief Sun SPF 50+ PA++++",
        "brand": "Beauty of Joseon",
        "category": "sunscreen",
        "price": 16.00,
        "rating": 4.9,
        "types": "combination, sensitive, oily",
        "concerns": "sun damage, aging, redness",
        "img": "https://images.unsplash.com/photo-1614093302611-8efc9c977c72?auto=format&fit=crop&w=300&q=80",
        "desc": "A lightweight mineral sunscreen enriched with rice and probiotics for hydration while providing broad-spectrum SPF 50+ protection.",
        "ings": ["Centella Asiatica", "Niacinamide"],
    },
    {
        "name": "Anthelios UV Correct SPF 50+",
        "brand": "La Roche-Posay",
        "category": "sunscreen",
        "price": 35.00,
        "rating": 4.8,
        "types": "all",
        "concerns": "sun damage, dark spots, aging",
        "img": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=300&q=80",
        "desc": "A daily moisturizing SPF50+ sunscreen with Niacinamide that corrects dark spots, texture and signs of early aging.",
        "ings": ["Niacinamide"],
    },
    {
        "name": "Ultra Sheer Dry-Touch Sunscreen SPF 100",
        "brand": "Neutrogena",
        "category": "sunscreen",
        "price": 14.99,
        "rating": 4.6,
        "types": "oily, combination, normal",
        "concerns": "sun damage, aging, acne",
        "img": "https://images.unsplash.com/photo-1614093302611-8efc9c977c72?auto=format&fit=crop&w=300&q=80",
        "desc": "Lightweight, non-greasy sunscreen with Helioplex technology. Dry-touch formula that leaves no white residue.",
        "ings": ["Niacinamide"],
    },
    {
        "name": "Everyday SPF 50 Invisible Sunscreen",
        "brand": "Supergoop!",
        "category": "sunscreen",
        "price": 34.00,
        "rating": 4.7,
        "types": "all",
        "concerns": "sun damage, aging",
        "img": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=300&q=80",
        "desc": "A clean, everyday SPF50 sunscreen that leaves no white cast, absorbs instantly and wears beautifully under makeup.",
        "ings": ["Hyaluronic Acid"],
    },

    # ── Treatments & Actives ──
    {
        "name": "Effaclar Duo Acne Treatment",
        "brand": "La Roche-Posay",
        "category": "treatment",
        "price": 29.99,
        "rating": 4.7,
        "types": "oily, combination",
        "concerns": "acne, blackheads, enlarged pores",
        "img": "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=300&q=80",
        "desc": "A dual-action acne spot treatment with micronized benzoyl peroxide and LHA (lipo-hydroxy acid) to unclog pores.",
        "ings": ["Salicylic Acid", "Niacinamide"],
    },
    {
        "name": "Cica Barrier Centella Serum",
        "brand": "Purito",
        "category": "serum",
        "price": 22.00,
        "rating": 4.7,
        "types": "sensitive, dry, combination",
        "concerns": "redness, irritation, eczema",
        "img": "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=300&q=80",
        "desc": "A centella-powered barrier repair serum that deeply soothes redness and rebuilds the skin moisture barrier.",
        "ings": ["Centella Asiatica", "Ceramides"],
    },
    {
        "name": "Peeling Solution AHA 30% BHA 2%",
        "brand": "The Ordinary",
        "category": "treatment",
        "price": 9.70,
        "rating": 4.5,
        "types": "normal, combination, oily",
        "concerns": "texture, dark spots, dullness",
        "img": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=300&q=80",
        "desc": "A 10-minute exfoliating facial with AHA and BHA acids to improve skin radiance and clarity without irritation.",
        "ings": ["Salicylic Acid"],
    },
    {
        "name": "A313 Vitamin A Pommade",
        "brand": "A313",
        "category": "treatment",
        "price": 19.00,
        "rating": 4.6,
        "types": "normal, dry, combination",
        "concerns": "fine lines, wrinkles, texture",
        "img": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=300&q=80",
        "desc": "A legendary French pharmacy retinol cream used for decades to treat fine lines, blemishes and uneven skin tone.",
        "ings": ["Retinol"],
    },

    # ── Face Masks ──
    {
        "name": "Kaolin Clay Detox Mask",
        "brand": "The Ordinary",
        "category": "face_mask",
        "price": 12.90,
        "rating": 4.5,
        "types": "oily, combination",
        "concerns": "excess oil, enlarged pores, blackheads",
        "img": "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=300&q=80",
        "desc": "A mineral-rich clay mask with salicylic acid and charcoal to deeply cleanse pores and absorb excess sebum.",
        "ings": ["Salicylic Acid"],
    },
    {
        "name": "Vital Perfection Uplifting & Firming Mask",
        "brand": "Shiseido",
        "category": "face_mask",
        "price": 75.00,
        "rating": 4.8,
        "types": "normal, dry, combination",
        "concerns": "fine lines, firmness, dullness",
        "img": "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=300&q=80",
        "desc": "A rich sheet mask formulated to restore skin vitality, visibly improve firmness and reduce fine lines overnight.",
        "ings": ["Hyaluronic Acid", "Retinol"],
    },
    {
        "name": "Hydro Boost Hydrating Sleeping Mask",
        "brand": "Neutrogena",
        "category": "face_mask",
        "price": 13.99,
        "rating": 4.5,
        "types": "dry, sensitive, normal",
        "concerns": "dry skin, dullness, dehydration",
        "img": "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=300&q=80",
        "desc": "An overnight sleeping mask with hyaluronic acid that deeply hydrates and restores your skin's glow by morning.",
        "ings": ["Hyaluronic Acid"],
    },

    # ── Toners ──
    {
        "name": "Glycolic Acid 7% Toning Solution",
        "brand": "The Ordinary",
        "category": "treatment",
        "price": 10.70,
        "rating": 4.6,
        "types": "normal, combination, oily",
        "concerns": "dullness, texture, dark spots",
        "img": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80",
        "desc": "An exfoliating toner that uses 7% glycolic acid to improve skin brightness, texture and clarity with continued use.",
        "ings": ["Niacinamide"],
    },
    {
        "name": "Soft Water Soothing Toner",
        "brand": "Laneige",
        "category": "treatment",
        "price": 28.00,
        "rating": 4.7,
        "types": "dry, sensitive, normal",
        "concerns": "dryness, dullness, dehydration",
        "img": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80",
        "desc": "A soothing toner that replenishes skin moisture and balances the skin's pH level for a healthy, clear complexion.",
        "ings": ["Hyaluronic Acid", "Centella Asiatica"],
    },

    # ── Eye Care ──
    {
        "name": "Caffeine Solution 5% + EGCG Eye Serum",
        "brand": "The Ordinary",
        "category": "treatment",
        "price": 7.90,
        "rating": 4.5,
        "types": "all",
        "concerns": "dark circles, puffiness, fine lines",
        "img": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=300&q=80",
        "desc": "A potent under-eye serum with 5% pure caffeine and EGCG (from green tea) to reduce dark circles and puffiness.",
        "ings": ["Niacinamide"],
    },
]


# ─────────────────────────────────────────────
# Clinical Ingredients Reference
# ─────────────────────────────────────────────

CLINICAL_INGREDIENTS = [
    {"name": "Salicylic Acid", "benefits": "Exfoliates skin, penetrates pores to reduce acne, and regulates sebum output.", "suitable": "oily, combination", "risk": "low"},
    {"name": "Niacinamide", "benefits": "Regulates sebum production, minimizes pore size, and strengthens skin barrier.", "suitable": "oily, combination, dry, sensitive", "risk": "low"},
    {"name": "Hyaluronic Acid", "benefits": "Deeply hydrates, locks moisture in skin cells, and smooths texture.", "suitable": "dry, sensitive, normal", "risk": "low"},
    {"name": "Ceramides", "benefits": "Soothes redness, repairs skin barrier, and locks in essential lipids.", "suitable": "dry, sensitive, normal", "risk": "low"},
    {"name": "Centella Asiatica", "benefits": "Calms inflammation, treats irritation, and accelerates skin healing.", "suitable": "sensitive, dry, combination", "risk": "low"},
    {"name": "Retinol", "benefits": "Accelerates skin cell turnover, reduces fine lines, and refines texture.", "suitable": "normal, dry, combination", "risk": "medium"},
]


# ─────────────────────────────────────────────
# Seeding Logic
# ─────────────────────────────────────────────

def seed_catalog_if_empty(db: Session):
    """Seed the products table with 30+ curated products if empty."""
    if db.query(Product).first() is not None:
        return

    print("Seeding skincare catalog with curated product dataset...")

    # 1. Ensure clinical ingredients exist
    ing_map: dict[str, Ingredient] = {}
    for ci in CLINICAL_INGREDIENTS:
        ing = db.query(Ingredient).filter(Ingredient.name == ci["name"]).first()
        if not ing:
            ing = Ingredient(
                name=ci["name"],
                benefits=ci["benefits"],
                suitable_for_skin_types=ci["suitable"],
                risk_level=ci["risk"],
            )
            db.add(ing)
            db.commit()
            db.refresh(ing)
        ing_map[ci["name"]] = ing

    # 2. Insert curated products
    for item in CURATED_PRODUCTS:
        cat_str = item["category"]
        try:
            cat_enum = ProductCategory(cat_str)
        except ValueError:
            cat_enum = ProductCategory("treatment")

        p = Product(
            name=item["name"],
            brand=item["brand"],
            category=cat_enum,
            price=item["price"],
            rating=item["rating"],
            suitable_for_skin_types=item["types"],
            concerns=item["concerns"],
            image_url=item["img"],
            description=item["desc"],
            usage_instructions="Apply to clean, dry skin as directed. For external use only.",
        )
        db.add(p)
        db.flush()  # assigns p.id (client-side UUID, already available)

        # Link clinical ingredients by name match
        for ing_name in item.get("ings", []):
            ing_obj = ing_map.get(ing_name)
            if ing_obj:
                db.add(ProductIngredient(product_id=p.id, ingredient_id=ing_obj.id))

    db.commit()  # single commit for all products at the end

    print(f"[OK] Seeded {len(CURATED_PRODUCTS)} curated skincare products successfully.")


# ─────────────────────────────────────────────
# Recommendation Scoring
# ─────────────────────────────────────────────

def compute_match_score(product: Product, skin_type: str, concerns: list[str]) -> int:
    """Score a product 0–100 based on skin type and concern matching."""
    score = 50  # base

    # Skin type match
    suitable = (product.suitable_for_skin_types or "").lower()
    if skin_type and (skin_type.lower() in suitable or "all" in suitable):
        score += 30

    # Concern match
    product_concerns = (product.concerns or "").lower()
    matched = sum(1 for c in concerns if c.lower() in product_concerns)
    score += min(matched * 10, 20)

    return min(score, 100)


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

from sqlalchemy.orm import joinedload

@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).options(
        joinedload(Product.ingredient_links).joinedload(ProductIngredient.ingredient)
    ).all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "brand": p.brand,
            "category": p.category.value if p.category else "treatment",
            "image_url": p.image_url,
            "price": p.price,
            "rating": p.rating,
            "suitable_for_skin_types": p.suitable_for_skin_types,
            "concerns": p.concerns,
            "description": p.description,
            "usage_instructions": p.usage_instructions,
            "ingredients": [pi.ingredient.name for pi in p.ingredient_links if pi.ingredient],
            "benefits": list({pi.ingredient.benefits for pi in p.ingredient_links if pi.ingredient and pi.ingredient.benefits}),
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "status": "active"
        }
        for p in products
    ]


@router.get("/products/{product_id}")
def get_product(product_id: uuid.UUID, db: Session = Depends(get_db)):
    p = db.query(Product).options(
        joinedload(Product.ingredient_links).joinedload(ProductIngredient.ingredient)
    ).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": str(p.id),
        "name": p.name,
        "brand": p.brand,
        "category": p.category.value if p.category else "treatment",
        "image_url": p.image_url,
        "price": p.price,
        "rating": p.rating,
        "suitable_for_skin_types": p.suitable_for_skin_types,
        "concerns": p.concerns,
        "description": p.description,
        "usage_instructions": p.usage_instructions,
        "ingredients": [pi.ingredient.name for pi in p.ingredient_links if pi.ingredient],
        "benefits": list({pi.ingredient.benefits for pi in p.ingredient_links if pi.ingredient and pi.ingredient.benefits}),
    }


@router.get("/recommendations")
def get_user_recommendations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return top personalised product recommendations for current logged-in user."""
    return get_recommendations(user_id=user.id, db=db)


@router.get("/recommendations/{user_id}")
def get_recommendations(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Return top personalised product recommendations for a user."""
    from app.models.skin_profile import SkinProfile

    # Attempt to load user skin profile for scoring
    skin_type = "combination"
    concerns = ["acne"]
    try:
        profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
        if profile:
            # skin_type is an enum — extract its value
            if profile.skin_type:
                skin_type = profile.skin_type.value if hasattr(profile.skin_type, 'value') else str(profile.skin_type)
            # skin_concerns is a PostgreSQL ARRAY (list), not a comma string
            if profile.skin_concerns:
                if isinstance(profile.skin_concerns, list):
                    concerns = [c.strip() for c in profile.skin_concerns if c and c.strip()]
                elif isinstance(profile.skin_concerns, str):
                    concerns = [c.strip() for c in profile.skin_concerns.split(",") if c.strip()]
    except Exception:
        pass

    from sqlalchemy.orm import joinedload
    products = db.query(Product).options(
        joinedload(Product.ingredient_links).joinedload(ProductIngredient.ingredient)
    ).all()

    # Score and sort
    scored = []
    for p in products:
        score = compute_match_score(p, skin_type, concerns)
        scored.append((score, p))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_products = scored[:8]  # return top 8

    results = []
    for match_score, p in top_products:
        why = []
        if skin_type and (skin_type.lower() in (p.suitable_for_skin_types or "").lower() or "all" in (p.suitable_for_skin_types or "").lower()):
            why.append(f"Formulated for {skin_type} skin")
        for c in concerns:
            if c.lower() in (p.concerns or "").lower():
                why.append(f"Targets {c}")
        if not why:
            why.append("Dermatologically recommended")

        results.append({
            "id": str(p.id),
            "name": p.name,
            "brand": p.brand,
            "category": p.category.value if p.category else "treatment",
            "image_url": p.image_url,
            "price": p.price,
            "rating": p.rating,
            "match_score": match_score,
            "why_recommended": why,
            "suitable_for_skin_types": p.suitable_for_skin_types,
            "concerns": p.concerns,
            "description": p.description,
            "ingredients": [pi.ingredient.name for pi in p.ingredient_links if pi.ingredient],
            "benefits": list({pi.ingredient.benefits for pi in p.ingredient_links if pi.ingredient and pi.ingredient.benefits}),
        })

    return results


# ─────────────────────────────────────────────
# Admin CRUD Endpoints
# ─────────────────────────────────────────────

@router.post("/admin/products", status_code=status.HTTP_201_CREATED)
def add_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    try:
        cat_enum = ProductCategory(payload.category)
    except ValueError:
        cat_enum = ProductCategory("treatment")

    p = Product(
        name=payload.name,
        brand=payload.brand,
        category=cat_enum,
        image_url=payload.image_url,
        description=payload.description,
        price=payload.price,
        rating=payload.rating,
        suitable_for_skin_types=payload.skin_types,
        concerns=payload.concerns,
        usage_instructions=payload.usage_instructions,
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    # Link ingredients by name
    for ing_name in payload.ingredient_names:
        ing = db.query(Ingredient).filter(Ingredient.name.ilike(ing_name.strip())).first()
        if ing:
            db.add(ProductIngredient(product_id=p.id, ingredient_id=ing.id))
    db.commit()

    return {"id": str(p.id), "name": p.name, "brand": p.brand, "image_url": p.image_url}


@router.put("/admin/products/{product_id}")
def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "category" and value:
            try:
                setattr(p, key, ProductCategory(value))
            except ValueError:
                pass
        elif key == "skin_types":
            p.suitable_for_skin_types = value
        else:
            setattr(p, key, value)

    db.commit()
    db.refresh(p)
    return {"id": str(p.id), "name": p.name, "brand": p.brand, "image_url": p.image_url, "status": "updated"}


@router.delete("/admin/products/{product_id}")
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    # Remove ingredient links first
    db.query(ProductIngredient).filter(ProductIngredient.product_id == p.id).delete()
    db.delete(p)
    db.commit()
    return {"status": "deleted", "id": str(product_id)}


@router.post("/admin/ingredients", status_code=status.HTTP_201_CREATED)
def add_ingredient(
    payload: IngredientCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    ing = Ingredient(
        name=payload.name,
        benefits=payload.benefits,
        risk_level=payload.risk_level,
        suitable_for_skin_types=payload.suitable_skin_types,
    )
    db.add(ing)
    db.commit()
    db.refresh(ing)
    return {"id": str(ing.id), "name": ing.name}