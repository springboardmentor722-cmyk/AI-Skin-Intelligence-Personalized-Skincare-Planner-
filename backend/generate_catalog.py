import csv
import os

products = [
    # Face Wash
    {"name": "Gentle Foaming Cleanser", "brand": "DermaBasics", "category": "Face Wash", "price": 450, "key_ingredients": "Ceramides,Glycerin", "suitable_skin_types": "dry,sensitive,normal", "suitable_concerns": "sensitive_skin,redness", "description": "Sulfate-free, pH-balanced daily cleanser for gentle purification."},
    {"name": "Oil Control Face Wash", "brand": "ClearSkin", "category": "Face Wash", "price": 350, "key_ingredients": "Salicylic Acid,Tea Tree", "suitable_skin_types": "oily,combination", "suitable_concerns": "acne,oily_skin", "description": "Deep-cleansing wash designed for acne-prone and oily skin."},
    {"name": "Hydrating Gel Cleanser", "brand": "AquaDerm", "category": "Face Wash", "price": 400, "key_ingredients": "Hyaluronic Acid,Aloe Vera", "suitable_skin_types": "dry,normal,sensitive", "suitable_concerns": "dry_skin,sensitive_skin", "description": "Refreshing gel cleanser that hydrates while removing impurities."},
    {"name": "Purifying Clay Cleanser", "brand": "EarthBiotics", "category": "Face Wash", "price": 420, "key_ingredients": "Kaolin Clay,Charcoal", "suitable_skin_types": "oily,combination", "suitable_concerns": "oily_skin,acne", "description": "Clay-based cleanser that draws out excess oil and minimizes pores."},
    {"name": "Brightening Citrus Wash", "brand": "GlowLab", "category": "Face Wash", "price": 480, "key_ingredients": "Vitamin C,Niacinamide", "suitable_skin_types": "normal,combination,oily", "suitable_concerns": "hyperpigmentation,dark_spots,uneven_skin_tone", "description": "Antioxidant-rich wash that brightens dull skin."},
    
    # Serums
    {"name": "10% Niacinamide Serum", "brand": "GlowLab", "category": "Serum", "price": 650, "key_ingredients": "Niacinamide,Zinc", "suitable_skin_types": "oily,combination,normal", "suitable_concerns": "acne,oily_skin,uneven_skin_tone", "description": "Oil-balancing, pore-refining serum for clearer skin."},
    {"name": "Vitamin C Brightening Serum", "brand": "GlowLab", "category": "Serum", "price": 899, "key_ingredients": "Vitamin C,Ferulic Acid", "suitable_skin_types": "normal,dry,combination", "suitable_concerns": "hyperpigmentation,dark_spots,uneven_skin_tone,wrinkles", "description": "15% Vitamin C serum for brighter, even-toned, and youthful skin."},
    {"name": "Hydrating Hyaluronic Serum", "brand": "AquaDerm", "category": "Serum", "price": 599, "key_ingredients": "Hyaluronic Acid,Panthenol", "suitable_skin_types": "dry,normal,sensitive,oily,combination", "suitable_concerns": "dry_skin,fine_lines", "description": "Multi-weight hyaluronic acid for deep, lasting hydration."},
    {"name": "Peptide Firming Serum", "brand": "RenewRx", "category": "Serum", "price": 1100, "key_ingredients": "Peptides,Collagen", "suitable_skin_types": "normal,dry,combination", "suitable_concerns": "wrinkles,fine_lines", "description": "Boosts collagen production for firmer, tighter skin."},
    {"name": "Soothing Centella Serum", "brand": "CalmCare", "category": "Serum", "price": 750, "key_ingredients": "Centella Asiatica,Ceramides", "suitable_skin_types": "sensitive,dry,normal", "suitable_concerns": "sensitive_skin,redness", "description": "Calms irritation and repairs the skin barrier instantly."},
    {"name": "Salicylic Acid BHA Serum", "brand": "ClearSkin", "category": "Serum", "price": 600, "key_ingredients": "Salicylic Acid,Green Tea", "suitable_skin_types": "oily,combination", "suitable_concerns": "acne,oily_skin,dark_spots", "description": "Targeted BHA serum to clear stubborn breakouts and blackheads."},
    {"name": "Alpha Arbutin Pigment Serum", "brand": "GlowLab", "category": "Serum", "price": 850, "key_ingredients": "Alpha Arbutin,Hyaluronic Acid", "suitable_skin_types": "normal,combination,dry,oily", "suitable_concerns": "hyperpigmentation,dark_spots,uneven_skin_tone", "description": "Fades dark spots and post-acne marks safely."},

    # Moisturizers
    {"name": "Barrier Repair Moisturizer", "brand": "DermaBasics", "category": "Moisturizer", "price": 700, "key_ingredients": "Ceramides,Hyaluronic Acid,Shea Butter", "suitable_skin_types": "dry,sensitive,normal", "suitable_concerns": "dry_skin,sensitive_skin,redness", "description": "Rich, ceramide-based daily moisturizer for dry skin."},
    {"name": "Oil-Free Gel Moisturizer", "brand": "ClearSkin", "category": "Moisturizer", "price": 500, "key_ingredients": "Niacinamide,Aloe Vera", "suitable_skin_types": "oily,combination", "suitable_concerns": "acne,oily_skin", "description": "Lightweight, non-comedogenic gel moisturizer that won't clog pores."},
    {"name": "Pro-Collagen Cream", "brand": "RenewRx", "category": "Moisturizer", "price": 1400, "key_ingredients": "Peptides,Retinol", "suitable_skin_types": "normal,dry", "suitable_concerns": "wrinkles,fine_lines", "description": "Anti-aging night cream that visibly reduces fine lines."},
    {"name": "Aqua Water Cream", "brand": "AquaDerm", "category": "Moisturizer", "price": 650, "key_ingredients": "Hyaluronic Acid,Glycerin", "suitable_skin_types": "combination,normal,oily", "suitable_concerns": "dry_skin", "description": "Refreshing water cream that provides an instant burst of hydration."},
    {"name": "Cica Calming Balm", "brand": "CalmCare", "category": "Moisturizer", "price": 550, "key_ingredients": "Centella Asiatica,Ceramides", "suitable_skin_types": "sensitive,dry", "suitable_concerns": "sensitive_skin,redness", "description": "Intense soothing balm for stressed, irritated, or compromised skin."},
    
    # Toners
    {"name": "Hydrating Toner", "brand": "AquaDerm", "category": "Toner", "price": 400, "key_ingredients": "Hyaluronic Acid,Rose Water", "suitable_skin_types": "dry,normal,sensitive", "suitable_concerns": "dry_skin,sensitive_skin", "description": "Alcohol-free toner that preps and hydrates skin for serums."},
    {"name": "AHA/BHA Exfoliating Toner", "brand": "ClearSkin", "category": "Toner", "price": 480, "key_ingredients": "Salicylic Acid,Glycolic Acid", "suitable_skin_types": "oily,combination", "suitable_concerns": "acne,oily_skin,dark_spots", "description": "Gentle daily exfoliating toner to keep pores clear."},
    {"name": "Brightening Essence Toner", "brand": "GlowLab", "category": "Toner", "price": 500, "key_ingredients": "Vitamin C,Licorice Root", "suitable_skin_types": "normal,combination,dry", "suitable_concerns": "hyperpigmentation,uneven_skin_tone", "description": "Illuminating essence toner for a radiant complexion."},
    {"name": "Soothing Oat Toner", "brand": "CalmCare", "category": "Toner", "price": 420, "key_ingredients": "Colloidal Oatmeal,Aloe Vera", "suitable_skin_types": "sensitive,dry,normal", "suitable_concerns": "sensitive_skin,redness", "description": "Milky, soothing toner for highly sensitive skin."},

    # Sunscreen
    {"name": "Daily Defense SPF 50", "brand": "SunGuard", "category": "Sunscreen", "price": 550, "key_ingredients": "Zinc Oxide,Titanium Dioxide", "suitable_skin_types": "normal,dry,combination,sensitive", "suitable_concerns": "hyperpigmentation,dark_spots,wrinkles,sensitive_skin", "description": "Broad-spectrum, non-greasy physical sunscreen."},
    {"name": "Matte Finish Sunscreen SPF 50", "brand": "SunGuard", "category": "Sunscreen", "price": 600, "key_ingredients": "Silica,Niacinamide", "suitable_skin_types": "oily,combination", "suitable_concerns": "acne,oily_skin", "description": "Sweat-resistant, matte sunscreen for oily skin types."},
    {"name": "Hydrating Aqua SPF 30", "brand": "AquaDerm", "category": "Sunscreen", "price": 500, "key_ingredients": "Hyaluronic Acid,Vitamin E", "suitable_skin_types": "dry,normal", "suitable_concerns": "dry_skin", "description": "Lightweight chemical sunscreen that feels like a moisturizer."},
    {"name": "Tinted Mineral SPF 40", "brand": "SunGuard", "category": "Sunscreen", "price": 650, "key_ingredients": "Zinc Oxide,Iron Oxides", "suitable_skin_types": "normal,combination,dry", "suitable_concerns": "uneven_skin_tone,redness", "description": "Mineral SPF with sheer coverage to even out skin tone."},

    # Treatments & Masks
    {"name": "Nightly Retinol Treatment", "brand": "RenewRx", "category": "Treatment Products", "price": 1200, "key_ingredients": "Retinol,Squalane", "suitable_skin_types": "normal,oily,combination,dry", "suitable_concerns": "wrinkles,fine_lines,acne", "description": "0.3% encapsulated retinol for gentle cell renewal."},
    {"name": "Clay Detox Mask", "brand": "ClearSkin", "category": "Face Masks", "price": 450, "key_ingredients": "Kaolin Clay,Salicylic Acid", "suitable_skin_types": "oily,combination", "suitable_concerns": "acne,oily_skin", "description": "Weekly clay mask to draw out excess oil and impurities."},
    {"name": "Overnight Hydration Mask", "brand": "AquaDerm", "category": "Face Masks", "price": 550, "key_ingredients": "Hyaluronic Acid,Ceramides", "suitable_skin_types": "dry,normal,sensitive", "suitable_concerns": "dry_skin,fine_lines", "description": "Intense overnight sleeping mask for plump, hydrated skin."},
    {"name": "2% BHA Liquid Exfoliant", "brand": "ClearSkin", "category": "Treatment Products", "price": 800, "key_ingredients": "Salicylic Acid,Green Tea", "suitable_skin_types": "oily,combination", "suitable_concerns": "acne,oily_skin,dark_spots", "description": "Leave-on exfoliant that rapidly unclogs pores."},
    {"name": "10% AHA Resurfacing Peel", "brand": "GlowLab", "category": "Treatment Products", "price": 950, "key_ingredients": "Glycolic Acid,Lactic Acid", "suitable_skin_types": "normal,combination,dry", "suitable_concerns": "hyperpigmentation,dark_spots,wrinkles", "description": "Powerful chemical peel for glowing, renewed skin."},
    {"name": "Soothing Sheet Mask (5-Pack)", "brand": "CalmCare", "category": "Face Masks", "price": 300, "key_ingredients": "Centella Asiatica,Aloe Vera", "suitable_skin_types": "sensitive,dry,normal,oily,combination", "suitable_concerns": "sensitive_skin,redness,dry_skin", "description": "Cooling sheet masks for immediate relief of irritation."},
]

out_path = r"c:\Users\Likhith kumar M\Downloads\skin-intelligence-app (3)\skin-intelligence-app\backend\app\data\skincare_catalog.csv"

with open(out_path, mode='w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["name", "brand", "category", "price", "key_ingredients", "suitable_skin_types", "suitable_concerns", "description"])
    writer.writeheader()
    writer.writerows(products)

print(f"Generated {len(products)} products at {out_path}")
