"""Idempotent local/dev seed data — `make seed` / `python -m app.db.seed`.

Seeds a small placeholder product catalog plus a curated ingredient master. Real product
data is a separate Kaggle ingestion pipeline (docs/DATASETS_AND_APIS.md §2,
`backend/app/services/admin/ingest/products.py` — code-complete, credential-blocked on
a real `KAGGLE_USERNAME`/`KAGGLE_KEY`, see `training_dataset/README.md`); this is a
stand-in so routines/recommendations have real `products` rows to reference end-to-end
regardless. Swapped out, not mixed in, once real credentials exist.

The ingredient master below is **hand-curated common dermatological knowledge** (INCI
names, treats/avoid relationships), not scraped from INCIDecoder/COSDNA — exactly the
approach `docs/DATASETS_AND_APIS.md` §3 prescribes ("no public API, do not scrape;
build the ingredient master from curated references... quality over quantity") for the
PDF's 8 named categories: Retinoids, Niacinamide, Vitamin C, Hyaluronic Acid, Salicylic
Acid, Ceramides, Peptides, AHAs/BHAs. A larger, automated ingredient feed is out of scope
until a licensed source is available.

skin_types/skin_concerns aren't seeded here — they're a real Alembic data migration now
(`a9c3d2f81b47_seed_skin_types_and_concerns.py`, production-readiness audit), not a
Python seed script: no environment before that migration had any automated way to get
this foundational reference data at all.
"""

import asyncio
import datetime
from typing import TypedDict

from sqlalchemy import select, text

from app.db.outbox import append_outbox
from app.db.postgres import async_session_factory, external_user_table
from app.services.clinical_review import service as clinical_review_service
from app.services.ingredients.models import (
    Ingredient,
    IngredientConcernTreats,
    IngredientSkintypeAvoid,
)
from app.services.recommendations.models import (
    Product,
    ProductConcern,
    ProductIngredient,
    ProductSkinType,
)
from app.services.routines import service as routines_service
from app.services.scores import service as scores_service
from app.services.scores.models import SkinScore
from app.services.skin_profile import service as skin_profile_service
from app.services.skin_profile.schemas import SkinProfileConcernInput, SkinProfileCreate


class _ProductSeed(TypedDict, total=False):
    brand_name: str
    product_name: str
    category: str
    price: float
    volume_ml: int
    spf_rating: int
    skin_types: list[str]
    concerns: list[str]
    ingredients: list[str]  # ingredient_name, must match an _INGREDIENTS entry below


_PRODUCTS: list[_ProductSeed] = [
    {
        "brand_name": "Lumina Labs",
        "product_name": "Gentle Foaming Cleanser",
        "category": "Face Wash",
        "price": 450,
        "volume_ml": 150,
        "skin_types": ["Normal", "Oily", "Combination"],
        "concerns": ["Acne", "Oily Skin"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Cream Hydrating Cleanser",
        "category": "Face Wash",
        "price": 420,
        "volume_ml": 150,
        "skin_types": ["Dry", "Sensitive"],
        "concerns": ["Dry Skin", "Sensitive Skin"],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "Micellar Cleansing Water",
        "category": "Face Wash",
        "price": 350,
        "volume_ml": 250,
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "concerns": ["Sensitive Skin"],
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "2% Salicylic Acid Treatment",
        "category": "Treatment Products",
        "price": 650,
        "volume_ml": 30,
        "skin_types": ["Oily", "Combination"],
        "concerns": ["Acne", "Oily Skin"],
        "ingredients": ["Salicylic Acid"],
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "10% Niacinamide Serum",
        "category": "Treatment Products",
        "price": 590,
        "volume_ml": 30,
        "skin_types": ["Oily", "Combination", "Normal"],
        "concerns": ["Hyperpigmentation", "Dark Spots", "Uneven Skin Tone"],
        "ingredients": ["Niacinamide"],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "Retinol 0.3% Night Treatment",
        "category": "Treatment Products",
        "price": 890,
        "volume_ml": 30,
        "skin_types": ["Normal", "Combination"],
        "concerns": ["Wrinkles", "Fine Lines"],
        "ingredients": ["Retinol"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Hyaluronic Acid Serum",
        "category": "Treatment Products",
        "price": 550,
        "volume_ml": 30,
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "concerns": ["Dry Skin"],
        "ingredients": ["Hyaluronic Acid"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Centella Calming Serum",
        "category": "Treatment Products",
        "price": 620,
        "volume_ml": 30,
        "skin_types": ["Sensitive"],
        "concerns": ["Redness", "Sensitive Skin"],
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "Vitamin C Brightening Serum",
        "category": "Treatment Products",
        "price": 750,
        "volume_ml": 30,
        "skin_types": ["Normal", "Combination", "Dry"],
        "concerns": ["Dark Spots", "Hyperpigmentation", "Uneven Skin Tone"],
        "ingredients": ["Ascorbic Acid"],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "8% Glycolic Acid Night Exfoliant",
        "category": "Treatment Products",
        "price": 720,
        "volume_ml": 30,
        "skin_types": ["Normal", "Oily", "Combination"],
        "concerns": ["Dark Spots", "Uneven Skin Tone", "Wrinkles"],
        "ingredients": ["Glycolic Acid"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Peptide Firming Serum",
        "category": "Treatment Products",
        "price": 810,
        "volume_ml": 30,
        "skin_types": ["Normal", "Dry", "Combination"],
        "concerns": ["Wrinkles", "Fine Lines"],
        "ingredients": ["Palmitoyl Pentapeptide-4"],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "Ceramide Repair Moisturizer",
        "category": "Moisturizer",
        "price": 480,
        "volume_ml": 50,
        "skin_types": ["Dry", "Sensitive"],
        "concerns": ["Dry Skin"],
        "ingredients": ["Ceramide NP", "Ceramide AP"],
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "Oil-Free Gel Moisturizer",
        "category": "Moisturizer",
        "price": 430,
        "volume_ml": 50,
        "skin_types": ["Oily", "Combination"],
        "concerns": ["Oily Skin", "Acne"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Daily Barrier Moisturizer",
        "category": "Moisturizer",
        "price": 400,
        "volume_ml": 50,
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "concerns": [],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "Broad-Spectrum SPF 50 Sunscreen",
        "category": "Sunscreen",
        "price": 550,
        "volume_ml": 50,
        "spf_rating": 50,
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "concerns": [],
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "Matte Finish SPF 40 Sunscreen",
        "category": "Sunscreen",
        "price": 520,
        "volume_ml": 50,
        "spf_rating": 40,
        "skin_types": ["Oily", "Combination"],
        "concerns": ["Oily Skin"],
    },
]


class _IngredientSeed(TypedDict, total=False):
    ingredient_name: str
    inci_name: str
    category: str
    treats: list[tuple[str, str]]  # (concern_name, evidence_strength)
    avoid_for: list[tuple[str, str]]  # (skin_type_name, reason)


# The PDF's 8 named ingredient categories (docs/DATASETS_AND_APIS.md §3). One or two
# well-established, commonly-cited actives per category — hand-curated, not scraped.
_INGREDIENTS: list[_IngredientSeed] = [
    {
        "ingredient_name": "Retinol",
        "inci_name": "Retinol",
        "category": "Retinoids",
        "treats": [("Wrinkles", "strong"), ("Fine Lines", "strong"), ("Acne", "moderate")],
        "avoid_for": [("Sensitive", "High irritation/purging risk without gradual introduction")],
    },
    {
        "ingredient_name": "Niacinamide",
        "inci_name": "Niacinamide",
        "category": "Niacinamide",
        "treats": [
            ("Hyperpigmentation", "strong"),
            ("Dark Spots", "strong"),
            ("Uneven Skin Tone", "strong"),
            ("Oily Skin", "moderate"),
            ("Redness", "moderate"),
        ],
        "avoid_for": [],
    },
    {
        "ingredient_name": "Ascorbic Acid",
        "inci_name": "L-Ascorbic Acid",
        "category": "Vitamin C",
        "treats": [
            ("Dark Spots", "strong"),
            ("Hyperpigmentation", "strong"),
            ("Uneven Skin Tone", "moderate"),
        ],
        "avoid_for": [("Sensitive", "Low pH formulations can sting or irritate reactive skin")],
    },
    {
        "ingredient_name": "Hyaluronic Acid",
        "inci_name": "Sodium Hyaluronate",
        "category": "Hyaluronic Acid",
        "treats": [("Dry Skin", "strong"), ("Fine Lines", "moderate")],
        "avoid_for": [],
    },
    {
        "ingredient_name": "Salicylic Acid",
        "inci_name": "Salicylic Acid",
        "category": "Salicylic Acid",
        "treats": [
            ("Acne", "strong"),
            ("Oily Skin", "strong"),
            ("Uneven Skin Tone", "weak"),
        ],
        "avoid_for": [
            ("Dry", "Can increase dryness and flaking"),
            ("Sensitive", "Beta-hydroxy exfoliation risks irritation"),
        ],
    },
    {
        "ingredient_name": "Ceramide NP",
        "inci_name": "Ceramide NP",
        "category": "Ceramides",
        "treats": [("Dry Skin", "strong"), ("Sensitive Skin", "moderate")],
        "avoid_for": [],
    },
    {
        "ingredient_name": "Ceramide AP",
        "inci_name": "Ceramide AP",
        "category": "Ceramides",
        "treats": [("Dry Skin", "strong")],
        "avoid_for": [],
    },
    {
        "ingredient_name": "Palmitoyl Pentapeptide-4",
        "inci_name": "Palmitoyl Pentapeptide-4",
        "category": "Peptides",
        "treats": [("Wrinkles", "moderate"), ("Fine Lines", "moderate")],
        "avoid_for": [],
    },
    {
        "ingredient_name": "Glycolic Acid",
        "inci_name": "Glycolic Acid",
        "category": "AHAs/BHAs",
        "treats": [
            ("Dark Spots", "moderate"),
            ("Uneven Skin Tone", "moderate"),
            ("Wrinkles", "weak"),
        ],
        "avoid_for": [("Sensitive", "Strong exfoliation risks irritation and barrier disruption")],
    },
    {
        "ingredient_name": "Lactic Acid",
        "inci_name": "Lactic Acid",
        "category": "AHAs/BHAs",
        "treats": [("Dry Skin", "moderate"), ("Uneven Skin Tone", "moderate")],
        "avoid_for": [],
    },
]


async def seed_ingredients() -> int:
    async with async_session_factory() as db:
        skin_types = {
            t.skin_type_name: t.skin_type_id for t in await skin_profile_service.list_skin_types(db)
        }
        concerns = {
            c.concern_name: c.concern_id for c in await skin_profile_service.list_skin_concerns(db)
        }

        existing_result = await db.execute(select(Ingredient.ingredient_name))
        existing_names = {row[0] for row in existing_result.all()}

        created = 0
        for entry in _INGREDIENTS:
            if entry["ingredient_name"] in existing_names:
                continue  # idempotent — dedupe by ingredient_name (docs/DATASETS_AND_APIS.md)

            ingredient = Ingredient(
                ingredient_name=entry["ingredient_name"],
                inci_name=entry.get("inci_name"),
                category=entry["category"],
                is_active=True,
            )
            db.add(ingredient)
            await db.flush()  # assigns ingredient.ingredient_id without committing yet
            await append_outbox(db, "ingredient", str(ingredient.ingredient_id), "upsert")

            for concern_name, evidence_strength in entry.get("treats", []):
                concern_id = concerns.get(concern_name)
                if concern_id is not None:
                    db.add(
                        IngredientConcernTreats(
                            ingredient_id=ingredient.ingredient_id,
                            concern_id=concern_id,
                            evidence_strength=evidence_strength,
                        )
                    )

            for skin_type_name, reason in entry.get("avoid_for", []):
                skin_type_id = skin_types.get(skin_type_name)
                if skin_type_id is not None:
                    db.add(
                        IngredientSkintypeAvoid(
                            ingredient_id=ingredient.ingredient_id,
                            skin_type_id=skin_type_id,
                            reason=reason,
                        )
                    )

            created += 1

        await db.commit()
        return created


async def seed_products() -> int:
    async with async_session_factory() as db:
        skin_types = {
            t.skin_type_name: t.skin_type_id for t in await skin_profile_service.list_skin_types(db)
        }
        concerns = {
            c.concern_name: c.concern_id for c in await skin_profile_service.list_skin_concerns(db)
        }

        ingredient_result = await db.execute(
            select(Ingredient.ingredient_name, Ingredient.ingredient_id)
        )
        ingredient_ids = {row[0]: row[1] for row in ingredient_result.all()}

        existing_result = await db.execute(select(Product.brand_name, Product.product_name))
        existing_pairs = {(row[0], row[1]) for row in existing_result.all()}

        created = 0
        for entry in _PRODUCTS:
            key = (entry["brand_name"], entry["product_name"])
            if key in existing_pairs:
                continue  # idempotent — dedupe by brand+name (docs/DATASETS_AND_APIS.md)

            product = Product(
                brand_name=entry["brand_name"],
                product_name=entry["product_name"],
                category=entry["category"],
                price=entry["price"],
                currency="INR",
                volume_ml=entry["volume_ml"],
                spf_rating=entry.get("spf_rating"),
                is_active=True,
            )
            db.add(product)
            await db.flush()  # assigns product.product_id without committing yet
            await append_outbox(db, "product", str(product.product_id), "upsert")

            for skin_type_name in entry.get("skin_types", []):
                skin_type_id = skin_types.get(skin_type_name)
                if skin_type_id is not None:
                    db.add(
                        ProductSkinType(product_id=product.product_id, skin_type_id=skin_type_id)
                    )

            for concern_name in entry.get("concerns", []):
                concern_id = concerns.get(concern_name)
                if concern_id is not None:
                    db.add(ProductConcern(product_id=product.product_id, concern_id=concern_id))

            for ingredient_name in entry.get("ingredients", []):
                ingredient_id = ingredient_ids.get(ingredient_name)
                if ingredient_id is not None:
                    db.add(
                        ProductIngredient(
                            product_id=product.product_id, ingredient_id=ingredient_id
                        )
                    )

            created += 1

        await db.commit()
        return created


class _DemoClientSeed(TypedDict):
    name: str
    email: str
    skin_type: str
    concern: str
    severity: int


# Milestone 2 P14 (MILESTONE_2_MASTER_PROMPT.md P14: "the seed uses the screenshot's
# cast") — real skin_type/concern names only (backend/app/db seed migration's own 5
# skin types, P6's 10 skin_concerns; no "Hair Fall & Dandruff" here, since that isn't
# a real seeded concern — inventing one to match the mockup's roster copy verbatim
# would be exactly the fabrication AGENTS.md §0.2 rules out).
_DEMO_CLIENTS: list[_DemoClientSeed] = [
    {
        "name": "Ananya Verma",
        "email": "ananya.verma@demo.skinlytics.local",
        "skin_type": "Combination",
        "concern": "Acne",
        "severity": 7,
    },
    {
        "name": "Priya Sharma",
        "email": "priya.sharma@demo.skinlytics.local",
        "skin_type": "Normal",
        "concern": "Hyperpigmentation",
        "severity": 6,
    },
    {
        "name": "Meera Iyer",
        "email": "meera.iyer@demo.skinlytics.local",
        "skin_type": "Combination",
        "concern": "Uneven Skin Tone",
        "severity": 5,
    },
    {
        "name": "Rohit Sharma",
        "email": "rohit.sharma@demo.skinlytics.local",
        "skin_type": "Oily",
        "concern": "Oily Skin",
        "severity": 6,
    },
    {
        "name": "Kavya Nair",
        "email": "kavya.nair@demo.skinlytics.local",
        "skin_type": "Dry",
        "concern": "Dry Skin",
        "severity": 7,
    },
    {
        "name": "Riya Singh",
        "email": "riya.singh@demo.skinlytics.local",
        "skin_type": "Oily",
        "concern": "Acne",
        "severity": 8,
    },
    {
        "name": "Neha Gupta",
        "email": "neha.gupta@demo.skinlytics.local",
        "skin_type": "Sensitive",
        "concern": "Sensitive Skin",
        "severity": 6,
    },
]

# demo-<slug> ids, not Better Auth-generated ones — these rows exist purely to be
# real, FK-valid `user_id` targets for skin_profiles/skin_assessments/skincare_
# routines/consultant_clients (same "direct user-table insert for a non-login-
# capable row" pattern web/tests/e2e/helpers.ts's own test fixtures use); nobody
# signs in as one, so no Better Auth account/session row exists for them.
_DEMO_CLIENT_ID_PREFIX = "demo-client-"


async def seed_demo_clients() -> int:
    """30 days of real score history + a real routine per client, so the four
    dashboards (and a professional's roster once assigned, seed_professional_
    assignments below) render plausible values instead of an honest-but-empty
    state. Idempotent — dedupe by email, same discipline as seed_ingredients/
    seed_products above."""
    async with async_session_factory() as db:
        existing_result = await db.execute(
            select(external_user_table.c.email).where(
                external_user_table.c.email.in_([c["email"] for c in _DEMO_CLIENTS])
            )
        )
        existing_emails = {row[0] for row in existing_result.all()}

        skin_types = {
            t.skin_type_name: t.skin_type_id for t in await skin_profile_service.list_skin_types(db)
        }
        concerns = {
            c.concern_name: c.concern_id for c in await skin_profile_service.list_skin_concerns(db)
        }

        created = 0
        for entry in _DEMO_CLIENTS:
            if entry["email"] in existing_emails:
                continue

            user_id = _DEMO_CLIENT_ID_PREFIX + entry["email"].split("@")[0]
            await db.execute(
                external_user_table.insert().values(
                    id=user_id, email=entry["email"], name=entry["name"], emailVerified=False
                )
            )
            await db.commit()

            await skin_profile_service.create_profile(
                db,
                user_id,
                SkinProfileCreate(
                    skin_type_id=skin_types[entry["skin_type"]],
                    age_group="25-34",
                    concerns=[
                        SkinProfileConcernInput(
                            concern_id=concerns[entry["concern"]],
                            severity_rating=entry["severity"],
                            priority_level=entry["severity"],
                        )
                    ],
                ),
            )
            latest = await scores_service.compute_and_store_score(db, user_id)
            await routines_service.get_or_generate_routines(db, user_id)

            # Backdated history (same "insert real SkinScore rows directly, don't
            # re-derive" pattern web/tests/e2e/user-journey.spec.ts already uses)
            # so the roster's score_trend sparkline and the portfolio's trend
            # analysis (app/ai/trend.py) have more than one real point to work
            # with. A gentle real improvement slope, not a random walk.
            #
            # weight_id must reference the real active scoring_weights row, not
            # None: scores_service.get_score_by_id treats a null weight_id as
            # "incomplete" and 404s (found via the clinical Assessments compare
            # dialog on these exact backdated rows) — every SkinScore, backdated
            # or not, was computed against real weights and should say so.
            active_weights = await scores_service.get_active_weights(db)
            base = latest.overall_score or 70.0
            for days_ago, delta in ((21, -6.0), (14, -3.5), (7, -1.5)):
                db.add(
                    SkinScore(
                        user_id=user_id,
                        skin_condition_score=latest.skin_condition_score,
                        lifestyle_score=latest.lifestyle_score,
                        sleep_quality_score=latest.sleep_quality_score,
                        hydration_score=latest.hydration_score,
                        routine_adherence_score=latest.routine_adherence_score,
                        overall_score=max(0.0, min(100.0, base + delta)),
                        weight_id=active_weights.weight_id,
                        calculated_at=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
                        - datetime.timedelta(days=days_ago),
                    )
                )
            await db.commit()
            created += 1

        return created


async def seed_professional_assignments() -> int:
    """Assigns every seeded demo client to every REAL consultant/dermatologist
    account already in the database at the time this runs — there's no way to
    predict a real Better-Auth-created professional's user_id in advance (seed
    data can't create a real, login-capable account; only a genuine signup +
    role promotion can). Idempotent (create_assignment reactivates an existing
    row rather than erroring) and safe to re-run after promoting a new
    professional: `make seed` again picks them up."""
    async with async_session_factory() as db:
        # `external_user_table` (app/db/postgres.py) only declares id/email/name/
        # emailVerified — the columns every FK-holding insert needs — not `role`,
        # which nothing else in this codebase reads through that Core Table object.
        # Raw SQL here rather than widening a shared table definition just for
        # this one read.
        professionals_result = await db.execute(
            text("SELECT id FROM \"user\" WHERE role IN ('consultant', 'dermatologist')")
        )
        professional_ids = [row[0] for row in professionals_result.all()]

        demo_clients_result = await db.execute(
            select(external_user_table.c.id).where(
                external_user_table.c.id.like(f"{_DEMO_CLIENT_ID_PREFIX}%")
            )
        )
        demo_client_ids = [row[0] for row in demo_clients_result.all()]

        assigned = 0
        for professional_id in professional_ids:
            for client_id in demo_client_ids:
                await clinical_review_service.create_assignment(db, professional_id, client_id)
                assigned += 1
        return assigned


async def main() -> None:
    # Ingredients first — seed_products() links product_ingredients against them.
    ingredients_created = await seed_ingredients()
    print(
        f"Seeded {ingredients_created} new ingredient(s) "
        f"({len(_INGREDIENTS) - ingredients_created} already present)."
    )
    created = await seed_products()
    print(f"Seeded {created} new product(s) ({len(_PRODUCTS) - created} already present).")

    clients_created = await seed_demo_clients()
    print(
        f"Seeded {clients_created} new demo client(s) "
        f"({len(_DEMO_CLIENTS) - clients_created} already present)."
    )
    assigned = await seed_professional_assignments()
    print(
        f"Assigned demo clients to {assigned} professional-client pair(s) "
        "(0 if no real consultant/dermatologist account exists yet — re-run after promoting one)."
    )


if __name__ == "__main__":
    asyncio.run(main())
