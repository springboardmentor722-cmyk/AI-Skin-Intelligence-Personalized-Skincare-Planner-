import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

from app.database import SessionLocal
from app.models import Ingredient

def clean_ingredient(ingredient):
    """
    Standardize ingredient data before inserting into the database.
    """

    # ---------- Standardize Ingredient Names ----------
    name_mapping = {
        "Aloe Leaf Juice": "Aloe Vera",
        "Green Tea Leaf Extract": "Green Tea Extract",
        "Licorice Root": "Licorice Root Extract",
        "Centella Extract": "Centella Asiatica Extract",
        "Cica Extract": "Centella Asiatica Extract",
        "Honey Extract": "Honey",
        "Oat Extract": "Oat Kernel Extract",
        "Cucumber Extract": "Cucumber Fruit Extract",
        "Chamomile Extract": "Chamomile Flower Extract",
        "Calendula Extract": "Calendula Flower Extract",
    }

    ingredient["ingredient_name"] = name_mapping.get(
        ingredient["ingredient_name"],
        ingredient["ingredient_name"]
    )

    # ---------- Standardize Categories ----------
    category_mapping = {
        "Botanical": "Plant Extract",
        "Botanical Extract": "Plant Extract",
        "Natural Extract": "Plant Extract",
        "Natural Oil": "Botanical Oil",
        "Cell Protector": "Active Ingredient",
        "Mineral Water": "Soothing Agent",
        "Barrier Lipid": "Barrier Repair",
        "Skin Lipid": "Barrier Repair",
    }

    ingredient["category"] = category_mapping.get(
        ingredient["category"],
        ingredient["category"]
    )

    # Remove extra spaces
    ingredient["ingredient_name"] = ingredient["ingredient_name"].strip()
    ingredient["category"] = ingredient["category"].strip()
    ingredient["benefits"] = ingredient["benefits"].strip()
    ingredient["skin_concerns"] = ingredient["skin_concerns"].strip()
    ingredient["suitable_skin_types"] = ingredient["suitable_skin_types"].strip()
    ingredient["description"] = ingredient["description"].strip()

    return ingredient

db = SessionLocal()

ingredients = [

    # -------- Part 1 --------
    # Hydration Ingredients
{
    "ingredient_name": "Hyaluronic Acid",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "Dry, Normal, Combination",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Powerful moisture-binding ingredient."
},

{
    "ingredient_name": "Glycerin",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Draws moisture into the skin."
},

{
    "ingredient_name": "Ceramide",
    "category": "Barrier Repair",
    "benefits": "Barrier Repair, Hydration",
    "suitable_skin_types": "Dry, Sensitive",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Repairs damaged skin barrier."
},

{
    "ingredient_name": "Panthenol",
    "category": "Vitamin B5",
    "benefits": "Healing, Hydration",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness",
    "irritation_level": "Low",
    "description": "Calms and hydrates skin."
},

{
    "ingredient_name": "Squalane",
    "category": "Emollient",
    "benefits": "Moisturizing",
    "suitable_skin_types": "Dry, Sensitive",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Lightweight moisturizing oil."
},

{
    "ingredient_name": "Urea",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Softens rough skin."
},

{
    "ingredient_name": "Sodium PCA",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Natural moisturizing factor."
},

{
    "ingredient_name": "Betaine",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Maintains moisture balance."
},

{
    "ingredient_name": "Aloe Vera",
    "category": "Botanical",
    "benefits": "Hydration, Soothing",
    "suitable_skin_types": "Sensitive, Dry",
    "skin_concerns": "Redness",
    "irritation_level": "Low",
    "description": "Natural soothing ingredient."
},

{
    "ingredient_name": "Allantoin",
    "category": "Skin Protectant",
    "benefits": "Healing",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Irritation",
    "irritation_level": "Low",
    "description": "Supports skin repair."
},

# ------------------------------
# Acne Ingredients
# ------------------------------

{
    "ingredient_name": "Niacinamide",
    "category": "Active Ingredient",
    "benefits": "Oil Control, Brightening, Barrier Repair",
    "suitable_skin_types": "Oily, Combination, Normal",
    "skin_concerns": "Acne, Pigmentation",
    "irritation_level": "Low",
    "description": "Reduces oil production, minimizes pores and improves skin tone."
},

{
    "ingredient_name": "Salicylic Acid",
    "category": "BHA",
    "benefits": "Exfoliation, Acne Treatment",
    "suitable_skin_types": "Oily, Combination",
    "skin_concerns": "Acne, Blackheads",
    "irritation_level": "Medium",
    "description": "Penetrates pores to dissolve excess oil and reduce acne."
},

{
    "ingredient_name": "Benzoyl Peroxide",
    "category": "Antibacterial",
    "benefits": "Kills Acne-causing Bacteria",
    "suitable_skin_types": "Oily",
    "skin_concerns": "Acne",
    "irritation_level": "High",
    "description": "Effective treatment for inflammatory acne."
},

{
    "ingredient_name": "Tea Tree Oil",
    "category": "Essential Oil",
    "benefits": "Antibacterial, Anti-inflammatory",
    "suitable_skin_types": "Oily, Combination",
    "skin_concerns": "Acne",
    "irritation_level": "Medium",
    "description": "Natural antibacterial ingredient that helps reduce pimples."
},

{
    "ingredient_name": "Sulfur",
    "category": "Mineral",
    "benefits": "Oil Control, Acne Treatment",
    "suitable_skin_types": "Oily",
    "skin_concerns": "Acne",
    "irritation_level": "Medium",
    "description": "Absorbs excess oil and dries active acne lesions."
},

{
    "ingredient_name": "Zinc PCA",
    "category": "Mineral",
    "benefits": "Sebum Control",
    "suitable_skin_types": "Oily",
    "skin_concerns": "Acne",
    "irritation_level": "Low",
    "description": "Regulates oil production while keeping skin hydrated."
},

{
    "ingredient_name": "Azelaic Acid",
    "category": "Dicarboxylic Acid",
    "benefits": "Acne Treatment, Brightening",
    "suitable_skin_types": "Sensitive, Oily",
    "skin_concerns": "Acne, Pigmentation",
    "irritation_level": "Low",
    "description": "Reduces acne, redness and post-acne pigmentation."
},

{
    "ingredient_name": "Willow Bark Extract",
    "category": "Botanical",
    "benefits": "Gentle Exfoliation",
    "suitable_skin_types": "Oily, Combination",
    "skin_concerns": "Acne",
    "irritation_level": "Low",
    "description": "Natural source of salicylates for gentle exfoliation."
},

{
    "ingredient_name": "Green Tea Extract",
    "category": "Antioxidant",
    "benefits": "Anti-inflammatory",
    "suitable_skin_types": "All",
    "skin_concerns": "Acne, Redness",
    "irritation_level": "Low",
    "description": "Rich in antioxidants that calm inflamed skin."
},

{
    "ingredient_name": "Centella Asiatica",
    "category": "Botanical",
    "benefits": "Healing, Soothing",
    "suitable_skin_types": "Sensitive, Acne-prone",
    "skin_concerns": "Acne, Redness",
    "irritation_level": "Low",
    "description": "Promotes wound healing and reduces inflammation."
},

{
    "ingredient_name": "Kaolin Clay",
    "category": "Clay",
    "benefits": "Oil Absorption",
    "suitable_skin_types": "Oily",
    "skin_concerns": "Acne",
    "irritation_level": "Low",
    "description": "Absorbs excess oil and cleans pores."
},

{
    "ingredient_name": "Activated Charcoal",
    "category": "Adsorbent",
    "benefits": "Deep Cleansing",
    "suitable_skin_types": "Oily",
    "skin_concerns": "Acne",
    "irritation_level": "Low",
    "description": "Removes dirt and impurities from pores."
},

{
    "ingredient_name": "Mandelic Acid",
    "category": "AHA",
    "benefits": "Gentle Exfoliation",
    "suitable_skin_types": "Sensitive, Acne-prone",
    "skin_concerns": "Acne, Pigmentation",
    "irritation_level": "Low",
    "description": "Gentle exfoliating acid suitable for sensitive skin."
},

{
    "ingredient_name": "Copper PCA",
    "category": "Mineral",
    "benefits": "Sebum Control",
    "suitable_skin_types": "Oily",
    "skin_concerns": "Acne",
    "irritation_level": "Low",
    "description": "Controls oil while supporting healthy skin."
},

{
    "ingredient_name": "Lactobionic Acid",
    "category": "PHA",
    "benefits": "Gentle Exfoliation",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Acne, Redness",
    "irritation_level": "Low",
    "description": "Polyhydroxy acid that exfoliates without irritation."

},


# ------------------------------
# Pigmentation Ingredients
# ------------------------------

{
    "ingredient_name": "Vitamin C",
    "category": "Antioxidant",
    "benefits": "Brightening, Antioxidant",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation, Dullness",
    "irritation_level": "Low",
    "description": "Brightens skin and reduces dark spots."
},

{
    "ingredient_name": "Alpha Arbutin",
    "category": "Skin Brightener",
    "benefits": "Pigmentation Reduction",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Reduces melanin production and fades dark spots."
},

{
    "ingredient_name": "Kojic Acid",
    "category": "Skin Brightener",
    "benefits": "Brightening",
    "suitable_skin_types": "Normal, Oily",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Medium",
    "description": "Helps lighten hyperpigmentation."
},

{
    "ingredient_name": "Tranexamic Acid",
    "category": "Brightening Agent",
    "benefits": "Pigmentation Reduction",
    "suitable_skin_types": "All",
    "skin_concerns": "Melasma, Pigmentation",
    "irritation_level": "Low",
    "description": "Effective against melasma and stubborn pigmentation."
},

{
    "ingredient_name": "Licorice Root Extract",
    "category": "Botanical",
    "benefits": "Brightening, Anti-inflammatory",
    "suitable_skin_types": "Sensitive, All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Naturally brightens skin and calms irritation."
},

{
    "ingredient_name": "Mulberry Extract",
    "category": "Botanical",
    "benefits": "Brightening",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Helps reduce uneven skin tone."
},

{
    "ingredient_name": "Niacinamide",
    "category": "Active Ingredient",
    "benefits": "Brightening, Barrier Repair",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Improves uneven skin tone and strengthens skin."
},

{
    "ingredient_name": "Azelaic Acid",
    "category": "Dicarboxylic Acid",
    "benefits": "Brightening",
    "suitable_skin_types": "Sensitive, All",
    "skin_concerns": "Pigmentation, Acne Marks",
    "irritation_level": "Low",
    "description": "Fades acne scars and pigmentation."
},

{
    "ingredient_name": "Ellagic Acid",
    "category": "Antioxidant",
    "benefits": "Brightening",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Natural antioxidant that inhibits melanin production."
},

{
    "ingredient_name": "Resorcinol",
    "category": "Skin Brightener",
    "benefits": "Pigmentation Reduction",
    "suitable_skin_types": "Normal",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Medium",
    "description": "Targets stubborn dark spots."
},

{
    "ingredient_name": "Ferulic Acid",
    "category": "Antioxidant",
    "benefits": "Brightening, Antioxidant",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Enhances Vitamin C stability and reduces sun damage."
},

{
    "ingredient_name": "Glutathione",
    "category": "Antioxidant",
    "benefits": "Brightening",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Powerful antioxidant for brighter skin."
},

{
    "ingredient_name": "Bearberry Extract",
    "category": "Botanical",
    "benefits": "Brightening",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Natural source of arbutin."
},

{
    "ingredient_name": "Cysteamine",
    "category": "Depigmenting Agent",
    "benefits": "Pigmentation Reduction",
    "suitable_skin_types": "All",
    "skin_concerns": "Melasma",
    "irritation_level": "Medium",
    "description": "Helps reduce severe pigmentation."
},

{
    "ingredient_name": "Hexylresorcinol",
    "category": "Brightening Agent",
    "benefits": "Skin Brightening",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Improves skin brightness and reduces dark spots."
},

# ------------------------------
# Anti-Aging Ingredients
# ------------------------------

{
    "ingredient_name": "Retinol",
    "category": "Retinoid",
    "benefits": "Anti-aging, Collagen Production",
    "suitable_skin_types": "Normal, Oily, Combination",
    "skin_concerns": "Wrinkles, Fine Lines",
    "irritation_level": "High",
    "description": "Gold standard ingredient for reducing wrinkles and improving skin texture."
},

{
    "ingredient_name": "Retinal",
    "category": "Retinoid",
    "benefits": "Anti-aging",
    "suitable_skin_types": "Normal, Oily",
    "skin_concerns": "Wrinkles",
    "irritation_level": "Medium",
    "description": "A more potent retinoid with faster results than retinol."
},

{
    "ingredient_name": "Bakuchiol",
    "category": "Plant Extract",
    "benefits": "Anti-aging",
    "suitable_skin_types": "Sensitive, Dry",
    "skin_concerns": "Wrinkles",
    "irritation_level": "Low",
    "description": "Natural retinol alternative suitable for sensitive skin."
},

{
    "ingredient_name": "Peptides",
    "category": "Peptide",
    "benefits": "Collagen Boosting",
    "suitable_skin_types": "All",
    "skin_concerns": "Wrinkles, Loss of Firmness",
    "irritation_level": "Low",
    "description": "Supports collagen production and improves skin elasticity."
},

{
    "ingredient_name": "Copper Peptides",
    "category": "Peptide",
    "benefits": "Skin Repair, Anti-aging",
    "suitable_skin_types": "All",
    "skin_concerns": "Wrinkles",
    "irritation_level": "Low",
    "description": "Promotes skin healing and collagen synthesis."
},

{
    "ingredient_name": "Matrixyl 3000",
    "category": "Peptide",
    "benefits": "Firming",
    "suitable_skin_types": "All",
    "skin_concerns": "Fine Lines",
    "irritation_level": "Low",
    "description": "Peptide complex that helps reduce wrinkle appearance."
},

{
    "ingredient_name": "Coenzyme Q10",
    "category": "Antioxidant",
    "benefits": "Anti-aging",
    "suitable_skin_types": "All",
    "skin_concerns": "Wrinkles",
    "irritation_level": "Low",
    "description": "Protects skin from oxidative stress and aging."
},

{
    "ingredient_name": "Resveratrol",
    "category": "Antioxidant",
    "benefits": "Anti-aging, Antioxidant",
    "suitable_skin_types": "All",
    "skin_concerns": "Wrinkles",
    "irritation_level": "Low",
    "description": "Powerful antioxidant that protects against environmental damage."
},

{
    "ingredient_name": "Vitamin E",
    "category": "Antioxidant",
    "benefits": "Moisturizing, Anti-aging",
    "suitable_skin_types": "Dry, Normal",
    "skin_concerns": "Fine Lines",
    "irritation_level": "Low",
    "description": "Protects skin and supports barrier repair."
},

{
    "ingredient_name": "DMAE",
    "category": "Firming Agent",
    "benefits": "Firming",
    "suitable_skin_types": "Normal",
    "skin_concerns": "Sagging Skin",
    "irritation_level": "Medium",
    "description": "Improves skin firmness and elasticity."
},

{
    "ingredient_name": "Idebenone",
    "category": "Antioxidant",
    "benefits": "Anti-aging",
    "suitable_skin_types": "All",
    "skin_concerns": "Wrinkles",
    "irritation_level": "Low",
    "description": "High-performance antioxidant for aging skin."
},

{
    "ingredient_name": "Astaxanthin",
    "category": "Antioxidant",
    "benefits": "Anti-aging",
    "suitable_skin_types": "All",
    "skin_concerns": "Fine Lines",
    "irritation_level": "Low",
    "description": "Powerful antioxidant that protects against UV damage."
},

{
    "ingredient_name": "Argireline",
    "category": "Peptide",
    "benefits": "Wrinkle Reduction",
    "suitable_skin_types": "All",
    "skin_concerns": "Expression Lines",
    "irritation_level": "Low",
    "description": "Peptide that helps soften expression lines."
},

{
    "ingredient_name": "EGF",
    "category": "Growth Factor",
    "benefits": "Skin Regeneration",
    "suitable_skin_types": "All",
    "skin_concerns": "Wrinkles",
    "irritation_level": "Low",
    "description": "Supports skin renewal and regeneration."
},

{
    "ingredient_name": "Adenosine",
    "category": "Cell Communicating Ingredient",
    "benefits": "Anti-aging",
    "suitable_skin_types": "All",
    "skin_concerns": "Wrinkles",
    "irritation_level": "Low",
    "description": "Helps improve skin smoothness and reduce wrinkles."
},

# ------------------------------
# Sensitive Skin Ingredients
# ------------------------------

{
    "ingredient_name": "Bisabolol",
    "category": "Botanical Extract",
    "benefits": "Soothing, Anti-inflammatory",
    "suitable_skin_types": "Sensitive, Dry",
    "skin_concerns": "Redness, Irritation",
    "irritation_level": "Low",
    "description": "Calms irritated skin and reduces redness."
},

{
    "ingredient_name": "Madecassoside",
    "category": "Botanical Extract",
    "benefits": "Healing, Barrier Repair",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness, Irritation",
    "irritation_level": "Low",
    "description": "Active compound from Centella Asiatica that repairs damaged skin."
},

{
    "ingredient_name": "Beta Glucan",
    "category": "Polysaccharide",
    "benefits": "Hydration, Healing",
    "suitable_skin_types": "Sensitive, Dry",
    "skin_concerns": "Dryness, Redness",
    "irritation_level": "Low",
    "description": "Boosts skin repair and provides long-lasting hydration."
},

{
    "ingredient_name": "Colloidal Oatmeal",
    "category": "Botanical",
    "benefits": "Soothing",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Itching, Redness",
    "irritation_level": "Low",
    "description": "Relieves itching and calms irritated skin."
},

{
    "ingredient_name": "Chamomile Extract",
    "category": "Botanical",
    "benefits": "Anti-inflammatory",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness",
    "irritation_level": "Low",
    "description": "Natural calming ingredient for sensitive skin."
},

{
    "ingredient_name": "Calendula Extract",
    "category": "Botanical",
    "benefits": "Healing",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Irritation",
    "irritation_level": "Low",
    "description": "Supports skin healing and reduces inflammation."
},

{
    "ingredient_name": "Oat Extract",
    "category": "Botanical",
    "benefits": "Soothing",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Dryness, Redness",
    "irritation_level": "Low",
    "description": "Provides relief for dry and irritated skin."
},

{
    "ingredient_name": "Cucumber Extract",
    "category": "Botanical",
    "benefits": "Cooling, Hydration",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness",
    "irritation_level": "Low",
    "description": "Refreshes and hydrates sensitive skin."
},

{
    "ingredient_name": "Licorice Root",
    "category": "Botanical",
    "benefits": "Brightening, Soothing",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness, Pigmentation",
    "irritation_level": "Low",
    "description": "Helps reduce redness while improving skin tone."
},

{
    "ingredient_name": "Honey Extract",
    "category": "Natural Extract",
    "benefits": "Hydration, Healing",
    "suitable_skin_types": "Sensitive, Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Natural moisturizer with antibacterial properties."
},

{
    "ingredient_name": "Thermal Spring Water",
    "category": "Mineral Water",
    "benefits": "Soothing",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness",
    "irritation_level": "Low",
    "description": "Mineral-rich water that calms irritated skin."
},

{
    "ingredient_name": "Ectoin",
    "category": "Cell Protector",
    "benefits": "Barrier Protection",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Sensitivity",
    "irritation_level": "Low",
    "description": "Protects skin cells from environmental stress."
},

{
    "ingredient_name": "Sodium Hyaluronate",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "Sensitive, Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Smaller form of Hyaluronic Acid for deeper hydration."
},

{
    "ingredient_name": "Ceramide NP",
    "category": "Barrier Repair",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Sensitive, Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Strengthens the skin barrier and prevents moisture loss."
},

{
    "ingredient_name": "Probiotic Ferment",
    "category": "Probiotic",
    "benefits": "Barrier Support",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Sensitivity",
    "irritation_level": "Low",
    "description": "Supports a healthy skin microbiome."
},

# ------------------------------
# Exfoliation Ingredients
# ------------------------------

{
    "ingredient_name": "Glycolic Acid",
    "category": "AHA",
    "benefits": "Exfoliation, Brightening",
    "suitable_skin_types": "Normal, Oily",
    "skin_concerns": "Pigmentation, Fine Lines",
    "irritation_level": "Medium",
    "description": "Small molecular AHA that exfoliates and improves skin texture."
},

{
    "ingredient_name": "Lactic Acid",
    "category": "AHA",
    "benefits": "Gentle Exfoliation, Hydration",
    "suitable_skin_types": "Dry, Sensitive",
    "skin_concerns": "Dryness, Pigmentation",
    "irritation_level": "Low",
    "description": "Gentle exfoliating acid that also hydrates the skin."
},

{
    "ingredient_name": "Citric Acid",
    "category": "AHA",
    "benefits": "Brightening",
    "suitable_skin_types": "All",
    "skin_concerns": "Dullness",
    "irritation_level": "Low",
    "description": "Improves skin brightness and supports exfoliation."
},

{
    "ingredient_name": "Malic Acid",
    "category": "AHA",
    "benefits": "Exfoliation",
    "suitable_skin_types": "All",
    "skin_concerns": "Uneven Texture",
    "irritation_level": "Low",
    "description": "Fruit acid that gently smooths the skin."
},

{
    "ingredient_name": "Tartaric Acid",
    "category": "AHA",
    "benefits": "Skin Renewal",
    "suitable_skin_types": "Normal",
    "skin_concerns": "Texture",
    "irritation_level": "Low",
    "description": "Supports skin cell turnover."
},

{
    "ingredient_name": "Gluconolactone",
    "category": "PHA",
    "benefits": "Gentle Exfoliation",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness, Texture",
    "irritation_level": "Low",
    "description": "PHA that exfoliates gently while hydrating."
},

{
    "ingredient_name": "Lactobionic Acid",
    "category": "PHA",
    "benefits": "Gentle Exfoliation",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Texture",
    "irritation_level": "Low",
    "description": "Hydrating exfoliating acid suitable for sensitive skin."
},

{
    "ingredient_name": "Papaya Enzyme",
    "category": "Enzyme",
    "benefits": "Enzymatic Exfoliation",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Dullness",
    "irritation_level": "Low",
    "description": "Natural enzyme that removes dead skin cells."
},

{
    "ingredient_name": "Pineapple Enzyme",
    "category": "Enzyme",
    "benefits": "Gentle Exfoliation",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Texture",
    "irritation_level": "Low",
    "description": "Contains bromelain to gently exfoliate skin."
},

{
    "ingredient_name": "Pumpkin Enzyme",
    "category": "Enzyme",
    "benefits": "Skin Renewal",
    "suitable_skin_types": "Normal",
    "skin_concerns": "Texture",
    "irritation_level": "Low",
    "description": "Natural fruit enzyme that smooths rough skin."
},

{
    "ingredient_name": "Rice Enzyme",
    "category": "Enzyme",
    "benefits": "Brightening",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Brightens and smooths the skin naturally."
},

{
    "ingredient_name": "Fruit Enzyme Blend",
    "category": "Enzyme",
    "benefits": "Gentle Exfoliation",
    "suitable_skin_types": "All",
    "skin_concerns": "Dullness",
    "irritation_level": "Low",
    "description": "Blend of fruit enzymes for mild exfoliation."
},

{
    "ingredient_name": "Polyhydroxy Acid",
    "category": "PHA",
    "benefits": "Hydrating Exfoliation",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Texture",
    "irritation_level": "Low",
    "description": "Exfoliates while maintaining skin hydration."
},

{
    "ingredient_name": "Mandelic Acid",
    "category": "AHA",
    "benefits": "Gentle Exfoliation",
    "suitable_skin_types": "Sensitive, Acne-prone",
    "skin_concerns": "Acne, Pigmentation",
    "irritation_level": "Low",
    "description": "Large-molecule AHA that exfoliates gently."
},

{
    "ingredient_name": "Microcrystalline Cellulose",
    "category": "Physical Exfoliant",
    "benefits": "Physical Exfoliation",
    "suitable_skin_types": "Normal",
    "skin_concerns": "Rough Texture",
    "irritation_level": "Medium",
    "description": "Provides gentle physical exfoliation."
},

# ------------------------------
# Barrier Repair Ingredients
# ------------------------------

{
    "ingredient_name": "Ceramide AP",
    "category": "Barrier Repair",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Dry, Sensitive",
    "skin_concerns": "Dryness, Sensitivity",
    "irritation_level": "Low",
    "description": "Strengthens the skin barrier and prevents moisture loss."
},

{
    "ingredient_name": "Ceramide EOP",
    "category": "Barrier Repair",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Dry, Sensitive",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Supports healthy skin barrier function."
},

{
    "ingredient_name": "Ceramide EOS",
    "category": "Barrier Repair",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Barrier Damage",
    "irritation_level": "Low",
    "description": "Improves skin barrier integrity."
},

{
    "ingredient_name": "Cholesterol",
    "category": "Barrier Lipid",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Dry, Sensitive",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Essential lipid naturally found in healthy skin."
},

{
    "ingredient_name": "Linoleic Acid",
    "category": "Essential Fatty Acid",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Dry, Acne-prone",
    "skin_concerns": "Barrier Damage",
    "irritation_level": "Low",
    "description": "Essential fatty acid that strengthens the skin barrier."
},

{
    "ingredient_name": "Linolenic Acid",
    "category": "Essential Fatty Acid",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Helps maintain healthy skin lipids."
},

{
    "ingredient_name": "Phytosphingosine",
    "category": "Skin Lipid",
    "benefits": "Barrier Repair, Anti-inflammatory",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness",
    "irritation_level": "Low",
    "description": "Natural lipid with soothing properties."
},

{
    "ingredient_name": "Shea Butter",
    "category": "Natural Butter",
    "benefits": "Moisturizing, Barrier Repair",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Rich emollient that restores moisture."
},

{
    "ingredient_name": "Caprylic/Capric Triglyceride",
    "category": "Emollient",
    "benefits": "Barrier Support",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Softens skin and prevents moisture loss."
},

{
    "ingredient_name": "Dimethicone",
    "category": "Silicone",
    "benefits": "Barrier Protection",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Irritation",
    "irritation_level": "Low",
    "description": "Forms a protective barrier on the skin."
},

{
    "ingredient_name": "Petrolatum",
    "category": "Occlusive",
    "benefits": "Barrier Protection",
    "suitable_skin_types": "Very Dry",
    "skin_concerns": "Barrier Damage",
    "irritation_level": "Low",
    "description": "Excellent occlusive that prevents water loss."
},

{
    "ingredient_name": "Lanolin",
    "category": "Occlusive",
    "benefits": "Moisturizing",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Medium",
    "description": "Rich moisturizer commonly used in barrier creams."
},

{
    "ingredient_name": "Jojoba Oil",
    "category": "Natural Oil",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Closely resembles the skin's natural sebum."
},

{
    "ingredient_name": "Avocado Oil",
    "category": "Natural Oil",
    "benefits": "Nourishing",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Rich in vitamins and fatty acids."
},

{
    "ingredient_name": "Sunflower Seed Oil",
    "category": "Natural Oil",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "High in linoleic acid and supports barrier recovery."
},

# ------------------------------
# UV Filters & Sunscreen Ingredients
# ------------------------------

{
    "ingredient_name": "Zinc Oxide",
    "category": "Mineral UV Filter",
    "benefits": "Sun Protection",
    "suitable_skin_types": "All, Sensitive",
    "skin_concerns": "Sun Damage",
    "irritation_level": "Low",
    "description": "Broad-spectrum mineral sunscreen that protects against UVA and UVB rays."
},

{
    "ingredient_name": "Titanium Dioxide",
    "category": "Mineral UV Filter",
    "benefits": "Sun Protection",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Sun Damage",
    "irritation_level": "Low",
    "description": "Mineral sunscreen ingredient providing UV protection."
},

{
    "ingredient_name": "Avobenzone",
    "category": "Chemical UV Filter",
    "benefits": "UVA Protection",
    "suitable_skin_types": "All",
    "skin_concerns": "Photoaging",
    "irritation_level": "Low",
    "description": "Chemical filter that absorbs UVA rays."
},

{
    "ingredient_name": "Octocrylene",
    "category": "Chemical UV Filter",
    "benefits": "UVB Protection",
    "suitable_skin_types": "Normal, Oily",
    "skin_concerns": "Sun Damage",
    "irritation_level": "Medium",
    "description": "Improves sunscreen stability and provides UVB protection."
},

{
    "ingredient_name": "Homosalate",
    "category": "Chemical UV Filter",
    "benefits": "UVB Protection",
    "suitable_skin_types": "All",
    "skin_concerns": "Sun Damage",
    "irritation_level": "Low",
    "description": "Common UVB sunscreen ingredient."
},

{
    "ingredient_name": "Octisalate",
    "category": "Chemical UV Filter",
    "benefits": "UVB Protection",
    "suitable_skin_types": "All",
    "skin_concerns": "Sun Damage",
    "irritation_level": "Low",
    "description": "Helps absorb UVB rays."
},

{
    "ingredient_name": "Octinoxate",
    "category": "Chemical UV Filter",
    "benefits": "UVB Protection",
    "suitable_skin_types": "Normal",
    "skin_concerns": "Sun Damage",
    "irritation_level": "Medium",
    "description": "Widely used chemical sunscreen ingredient."
},

{
    "ingredient_name": "Tinosorb S",
    "category": "Chemical UV Filter",
    "benefits": "Broad Spectrum Protection",
    "suitable_skin_types": "All",
    "skin_concerns": "Photoaging",
    "irritation_level": "Low",
    "description": "Advanced UVA and UVB filter."
},

{
    "ingredient_name": "Tinosorb M",
    "category": "Hybrid UV Filter",
    "benefits": "Broad Spectrum Protection",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Photoaging",
    "irritation_level": "Low",
    "description": "Hybrid UV filter offering broad-spectrum protection."
},

{
    "ingredient_name": "Uvinul A Plus",
    "category": "Chemical UV Filter",
    "benefits": "UVA Protection",
    "suitable_skin_types": "All",
    "skin_concerns": "Photoaging",
    "irritation_level": "Low",
    "description": "Highly photostable UVA filter."
},

{
    "ingredient_name": "Uvinul T150",
    "category": "Chemical UV Filter",
    "benefits": "UVB Protection",
    "suitable_skin_types": "All",
    "skin_concerns": "Sun Damage",
    "irritation_level": "Low",
    "description": "High-performance UVB sunscreen filter."
},

{
    "ingredient_name": "Mexoryl SX",
    "category": "Chemical UV Filter",
    "benefits": "UVA Protection",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Photoaging",
    "irritation_level": "Low",
    "description": "Patented UVA sunscreen ingredient."
},

{
    "ingredient_name": "Mexoryl XL",
    "category": "Chemical UV Filter",
    "benefits": "Broad Spectrum Protection",
    "suitable_skin_types": "All",
    "skin_concerns": "Sun Damage",
    "irritation_level": "Low",
    "description": "Provides both UVA and UVB protection."
},

{
    "ingredient_name": "Bemotrizinol",
    "category": "Chemical UV Filter",
    "benefits": "Broad Spectrum Protection",
    "suitable_skin_types": "All",
    "skin_concerns": "Photoaging",
    "irritation_level": "Low",
    "description": "Photostable sunscreen ingredient with broad UV coverage."
},

{
    "ingredient_name": "Ecamsule",
    "category": "Chemical UV Filter",
    "benefits": "UVA Protection",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Sun Damage",
    "irritation_level": "Low",
    "description": "Long-lasting UVA protection."
},

# ------------------------------
# Botanical Oils & Plant Extracts
# ------------------------------

{
    "ingredient_name": "Rosehip Oil",
    "category": "Botanical Oil",
    "benefits": "Skin Repair, Brightening",
    "suitable_skin_types": "Dry, Mature",
    "skin_concerns": "Scars, Pigmentation",
    "irritation_level": "Low",
    "description": "Rich in essential fatty acids and Vitamin A."
},

{
    "ingredient_name": "Argan Oil",
    "category": "Botanical Oil",
    "benefits": "Moisturizing",
    "suitable_skin_types": "Dry, Normal",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Lightweight nourishing oil rich in Vitamin E."
},

{
    "ingredient_name": "Marula Oil",
    "category": "Botanical Oil",
    "benefits": "Hydration, Antioxidant",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Rich antioxidant oil that softens skin."
},

{
    "ingredient_name": "Grapeseed Oil",
    "category": "Botanical Oil",
    "benefits": "Oil Balance",
    "suitable_skin_types": "Oily",
    "skin_concerns": "Acne",
    "irritation_level": "Low",
    "description": "Lightweight oil rich in linoleic acid."
},

{
    "ingredient_name": "Evening Primrose Oil",
    "category": "Botanical Oil",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Dry, Sensitive",
    "skin_concerns": "Eczema",
    "irritation_level": "Low",
    "description": "Rich in gamma-linolenic acid."
},

{
    "ingredient_name": "Tamanu Oil",
    "category": "Botanical Oil",
    "benefits": "Healing",
    "suitable_skin_types": "Acne-prone",
    "skin_concerns": "Scars",
    "irritation_level": "Low",
    "description": "Supports wound healing and scar reduction."
},

{
    "ingredient_name": "Hemp Seed Oil",
    "category": "Botanical Oil",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness",
    "irritation_level": "Low",
    "description": "Balances skin oils while calming irritation."
},

{
    "ingredient_name": "Black Seed Oil",
    "category": "Botanical Oil",
    "benefits": "Anti-inflammatory",
    "suitable_skin_types": "Oily",
    "skin_concerns": "Acne",
    "irritation_level": "Low",
    "description": "Natural antibacterial and anti-inflammatory oil."
},

{
    "ingredient_name": "Camellia Seed Oil",
    "category": "Botanical Oil",
    "benefits": "Moisturizing",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Traditional Japanese beauty oil."
},

{
    "ingredient_name": "Olive Oil",
    "category": "Botanical Oil",
    "benefits": "Moisturizing",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Rich source of antioxidants and healthy fats."
},

{
    "ingredient_name": "Green Tea Leaf Extract",
    "category": "Plant Extract",
    "benefits": "Antioxidant",
    "suitable_skin_types": "All",
    "skin_concerns": "Redness",
    "irritation_level": "Low",
    "description": "Protects skin from environmental stress."
},

{
    "ingredient_name": "Turmeric Extract",
    "category": "Plant Extract",
    "benefits": "Brightening",
    "suitable_skin_types": "All",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Natural antioxidant that improves skin tone."
},

{
    "ingredient_name": "Ginseng Extract",
    "category": "Plant Extract",
    "benefits": "Anti-aging",
    "suitable_skin_types": "Mature",
    "skin_concerns": "Fine Lines",
    "irritation_level": "Low",
    "description": "Boosts skin vitality and elasticity."
},

{
    "ingredient_name": "Sea Buckthorn Oil",
    "category": "Botanical Oil",
    "benefits": "Skin Repair",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Barrier Damage",
    "irritation_level": "Low",
    "description": "Rich in omega fatty acids and antioxidants."
},

{
    "ingredient_name": "Pomegranate Extract",
    "category": "Plant Extract",
    "benefits": "Antioxidant",
    "suitable_skin_types": "All",
    "skin_concerns": "Aging",
    "irritation_level": "Low",
    "description": "Protects skin against free-radical damage."
},

{
    "ingredient_name": "Centella Extract",
    "category": "Plant Extract",
    "benefits": "Healing",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness",
    "irritation_level": "Low",
    "description": "Promotes collagen production and wound healing."
},

{
    "ingredient_name": "Licorice Extract",
    "category": "Plant Extract",
    "benefits": "Brightening",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Pigmentation",
    "irritation_level": "Low",
    "description": "Natural skin brightener."
},

{
    "ingredient_name": "Calendula Flower Extract",
    "category": "Plant Extract",
    "benefits": "Healing",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Irritation",
    "irritation_level": "Low",
    "description": "Excellent soothing botanical."
},

{
    "ingredient_name": "Aloe Leaf Juice",
    "category": "Plant Extract",
    "benefits": "Hydration",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Provides hydration and cooling."
},

{
    "ingredient_name": "Cica Extract",
    "category": "Plant Extract",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Redness",
    "irritation_level": "Low",
    "description": "Centella-derived ingredient for skin recovery."
},

# ------------------------------
# Humectants, Emollients & Occlusives
# ------------------------------

{
    "ingredient_name": "Propylene Glycol",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Draws moisture into the skin."
},

{
    "ingredient_name": "Butylene Glycol",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Improves moisture retention and product absorption."
},

{
    "ingredient_name": "Sorbitol",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Sugar alcohol that attracts water to the skin."
},

{
    "ingredient_name": "Pentylene Glycol",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Provides hydration and improves product preservation."
},

{
    "ingredient_name": "Hexylene Glycol",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Acts as a moisturizer and solvent."
},

{
    "ingredient_name": "Isopropyl Myristate",
    "category": "Emollient",
    "benefits": "Skin Softening",
    "suitable_skin_types": "Normal",
    "skin_concerns": "Rough Skin",
    "irritation_level": "Medium",
    "description": "Provides a silky feel to skincare products."
},

{
    "ingredient_name": "Cetearyl Alcohol",
    "category": "Fatty Alcohol",
    "benefits": "Moisturizing",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Fatty alcohol that softens skin and stabilizes creams."
},

{
    "ingredient_name": "Cetyl Alcohol",
    "category": "Fatty Alcohol",
    "benefits": "Skin Conditioning",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Provides smooth texture and moisturization."
},

{
    "ingredient_name": "Stearyl Alcohol",
    "category": "Fatty Alcohol",
    "benefits": "Moisturizing",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Helps reduce moisture loss."
},

{
    "ingredient_name": "Behenyl Alcohol",
    "category": "Fatty Alcohol",
    "benefits": "Skin Softening",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Provides a rich, creamy texture."
},

{
    "ingredient_name": "Mineral Oil",
    "category": "Occlusive",
    "benefits": "Moisture Retention",
    "suitable_skin_types": "Very Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Creates a protective barrier to reduce water loss."
},

{
    "ingredient_name": "Hydrogenated Polyisobutene",
    "category": "Emollient",
    "benefits": "Skin Conditioning",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Lightweight alternative to mineral oil."
},

{
    "ingredient_name": "Squalene",
    "category": "Emollient",
    "benefits": "Moisturizing",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Natural lipid that supports skin softness."
},

{
    "ingredient_name": "Caprylyl Glycol",
    "category": "Humectant",
    "benefits": "Hydration",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Hydrates skin while enhancing preservation."
},

{
    "ingredient_name": "Glyceryl Stearate",
    "category": "Emollient",
    "benefits": "Barrier Support",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Softens skin and strengthens the barrier."
},

{
    "ingredient_name": "PEG-100 Stearate",
    "category": "Emulsifier",
    "benefits": "Skin Conditioning",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Helps oil and water mix in skincare formulations."
},

{
    "ingredient_name": "Coco-Caprylate",
    "category": "Emollient",
    "benefits": "Silky Finish",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Plant-derived lightweight emollient."
},

{
    "ingredient_name": "Hydrogenated Lecithin",
    "category": "Barrier Lipid",
    "benefits": "Barrier Repair",
    "suitable_skin_types": "Sensitive",
    "skin_concerns": "Barrier Damage",
    "irritation_level": "Low",
    "description": "Improves skin barrier and ingredient delivery."
},

{
    "ingredient_name": "Sucrose Stearate",
    "category": "Emulsifier",
    "benefits": "Skin Conditioning",
    "suitable_skin_types": "All",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Gentle emulsifier commonly used in moisturizers."
},

{
    "ingredient_name": "Hydroxyethyl Urea",
    "category": "Humectant",
    "benefits": "Deep Hydration",
    "suitable_skin_types": "Dry",
    "skin_concerns": "Dryness",
    "irritation_level": "Low",
    "description": "Highly effective moisturizing ingredient."
},
]

for ingredient_data in ingredients:

    # Clean the ingredient
    ingredient_data = clean_ingredient(ingredient_data)

    # Check if ingredient already exists
    existing = (
        db.query(Ingredient)
        .filter(
            Ingredient.ingredient_name == ingredient_data["ingredient_name"]
        )
        .first()
    )

    if existing:
     print(f"Skipping: {ingredient_data['ingredient_name']}")
    continue

    ingredient = Ingredient(
        ingredient_name=ingredient_data["ingredient_name"],
        category=ingredient_data["category"],
        benefits=ingredient_data["benefits"],
        suitable_skin_types=ingredient_data["suitable_skin_types"],
        skin_concerns=ingredient_data["skin_concerns"],
        irritation_level=ingredient_data["irritation_level"],
        description=ingredient_data["description"],
    )

    db.add(ingredient)

db.commit()
db.close()

inserted = 0

processed_names = set()

from collections import Counter

# Check for duplicate ingredient names in the Python list
names = [clean_ingredient(i.copy())["ingredient_name"] for i in ingredients]

duplicates = [name for name, count in Counter(names).items() if count > 1]

print("\n===== DUPLICATE INGREDIENTS IN LIST =====")
if duplicates:
    for name in duplicates:
        print(name)
else:
    print("No duplicates found.")
print("=========================================\n")

for ingredient_data in ingredients:

    ingredient_data = clean_ingredient(ingredient_data)

    # Skip duplicate names within the same Python list
    if ingredient_data["ingredient_name"] in processed_names:
        print(f"Duplicate in list: {ingredient_data['ingredient_name']}")
        continue

    processed_names.add(ingredient_data["ingredient_name"])

    existing = (
        db.query(Ingredient)
        .filter(
            Ingredient.ingredient_name == ingredient_data["ingredient_name"]
        )
        .first()
    )

    if existing:
        print(f"Skipping: {ingredient_data['ingredient_name']}")
        continue

    ingredient = Ingredient(
        ingredient_name=ingredient_data["ingredient_name"],
        category=ingredient_data["category"],
        benefits=ingredient_data["benefits"],
        suitable_skin_types=ingredient_data["suitable_skin_types"],
        skin_concerns=ingredient_data["skin_concerns"],
        irritation_level=ingredient_data["irritation_level"],
        description=ingredient_data["description"],
    )

    db.add(ingredient)
    inserted += 1

db.commit()
db.close()

print(f"✅ {inserted} new ingredients inserted successfully!")