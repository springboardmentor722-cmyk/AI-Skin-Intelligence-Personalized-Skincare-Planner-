from typing import List, Dict, Any
from app.models.product import Product

class RecommendationEngine:
    @staticmethod
    def calculate_suitability(product: Product, user_concerns: List[str], user_skin_type: str) -> int:
        score = 0
        
        # Lowercase for matching
        lower_concerns = [c.lower() for c in user_concerns]
        p_skin_types = product.skin_types.lower() if product.skin_types else ""
        p_ingredients = " ".join([ing.name.lower() for ing in product.ingredients])
        
        # 1. Target Concern Match Weight (50%)
        # Simple heuristic mapping concern to beneficial ingredient keywords
        concern_map = {
            "acne": ["salicylic", "niacinamide", "bha", "retinol", "zinc"],
            "redness": ["niacinamide", "azelaic", "centella", "aloe"],
            "dry": ["ceramide", "hyaluronic", "glycerin", "squalane"],
            "hyperpigmentation": ["vitamin c", "arbutin", "niacinamide", "aha"],
            "aging": ["retinol", "peptide", "bakuchiol", "vitamin c"]
        }
        
        concern_score = 0
        for concern in lower_concerns:
            matched = False
            for k, keywords in concern_map.items():
                if k in concern:
                    if any(kw in p_ingredients for kw in keywords):
                        matched = True
                        break
            if matched:
                concern_score += 1
                
        if len(lower_concerns) > 0:
            score += min(50, int((concern_score / len(lower_concerns)) * 50))
        else:
            score += 25 # Default mid score if no concerns
            
        # 2. Skin Type Fit Weight (35%)
        skin_type_score = 0
        if user_skin_type:
            lower_user_st = user_skin_type.lower()
            if lower_user_st in p_skin_types:
                skin_type_score = 35
            elif "all" in p_skin_types:
                skin_type_score = 25
            else:
                skin_type_score = 10 # Some penalty for mismatch
        else:
            skin_type_score = 20
        score += skin_type_score
        
        # 3. Rating Weight (15%)
        rating = product.rating or 0.0
        # Normalize rating from 0-5 to 0-15
        rating_score = int((rating / 5.0) * 15)
        score += rating_score
        
        return min(100, score)

    @staticmethod
    def get_recommendations(products: List[Product], user_concerns: List[str], user_skin_type: str, max_price: float = None) -> List[Dict[str, Any]]:
        results = []
        for p in products:
            # Budget Optimization / Hard-Filter
            if max_price and p.price > max_price:
                continue
                
            match_score = RecommendationEngine.calculate_suitability(p, user_concerns, user_skin_type)
            
            results.append({
                "id": str(p.id),
                "name": p.name,
                "brand": p.brand,
                "category": p.product_type,
                "price": p.price,
                "rating": p.rating,
                "match": match_score,
                "image": p.image_url,
                "tags": [ing.name for ing in p.ingredients]
            })
            
        results.sort(key=lambda x: x["match"], reverse=True)
        return results
