"""
INCI Text Parsing Engine for raw product ingredient strings.
Uses regex and string processing to tokenize, normalize, and match
active ingredient categories, chemical filters, and potential allergens.
"""

import re
from typing import List, Dict, Any, Set

ACTIVE_CATEGORY_MAP = {
    "retinoid": "Retinoids",
    "retinol": "Retinoids",
    "retinyl palmitate": "Retinoids",
    "tretinoin": "Retinoids",
    "adapalene": "Retinoids",
    "tazarotene": "Retinoids",
    "granactive retinoid": "Retinoids",

    "salicylic acid": "AHAs/BHAs",
    "bha": "AHAs/BHAs",
    "beta hydroxy acid": "AHAs/BHAs",
    "glycolic acid": "AHAs/BHAs",
    "lactic acid": "AHAs/BHAs",
    "mandelic acid": "AHAs/BHAs",
    "aha": "AHAs/BHAs",
    "alpha hydroxy acid": "AHAs/BHAs",
    "citric acid": "AHAs/BHAs",

    "niacinamide": "Niacinamide",
    "nicotinamide": "Niacinamide",
    "vitamin b3": "Niacinamide",

    "vitamin c": "Vitamin C",
    "ascorbic acid": "Vitamin C",
    "l-ascorbic acid": "Vitamin C",
    "sodium ascorbyl phosphate": "Vitamin C",
    "tetrahexyldecyl ascorbate": "Vitamin C",
    "ethyl ascorbic acid": "Vitamin C",

    "hyaluronic acid": "Hyaluronic Acid",
    "sodium hyaluronate": "Hyaluronic Acid",
    "hydrolyzed hyaluronic acid": "Hyaluronic Acid",

    "ceramide": "Ceramides",
    "ceramide np": "Ceramides",
    "ceramide ap": "Ceramides",
    "ceramide eop": "Ceramides",
    "phytosphingosine": "Ceramides",

    "peptide": "Peptides",
    "peptides": "Peptides",
    "matrixyl": "Peptides",
    "copper tripeptide-1": "Peptides",
    "palmitoyl tripeptide": "Peptides",
    "palmitoyl tetrapeptide": "Peptides",

    "zinc oxide": "Zinc Oxide",
    "titanium dioxide": "Mineral UV Filter",

    "centella asiatica": "Centella Asiatica",
    "cica": "Centella Asiatica",
    "madecassoside": "Centella Asiatica",

    "alpha arbutin": "Alpha Arbutin",
    "arbutin": "Alpha Arbutin",

    "azelaic acid": "Azelaic Acid",
    "potassium azeloyl diglycinate": "Azelaic Acid",

    "tea tree": "Tea Tree Oil",
    "melaleuca alternifolia": "Tea Tree Oil",

    "squalane": "Squalane"
}

KNOWN_FRAGRANCES_ALLERGENS = {
    "fragrance", "parfum", "essential oil", "limonene", "linalool", "citronellol",
    "geraniol", "eugenol", "benzyl alcohol", "oxybenzone", "avobenzone", "octinoxate"
}


class INCIParserEngine:
    @staticmethod
    def tokenize_inci(raw_inci_string: str) -> List[str]:
        """
        Clean and tokenize raw INCI string into individual ingredient tokens.
        Handles parentheses, concentration percentages, and multi-language separators.
        """
        if not raw_inci_string:
            return []
        cleaned = re.sub(r'/(?=[A-Za-z])', ', ', raw_inci_string)
        cleaned = re.sub(r'[\(\[\{]\s*\d+(\.\d+)?%\s*[\)\]\}]', '', cleaned)
        tokens = [t.strip() for t in re.split(r'[,;]\s*', cleaned) if t.strip()]
        return tokens

    @classmethod
    def parse(cls, raw_inci_string: str) -> Dict[str, Any]:
        """
        Parse raw INCI text and return structured tokenized array, detected actives,
        and potential allergen flags.
        """
        tokens = cls.tokenize_inci(raw_inci_string)
        normalized_tokens = [t.lower() for t in tokens]

        detected_actives: Set[str] = set()
        detected_allergens: Set[str] = set()

        for token in normalized_tokens:
            for keyword, category in ACTIVE_CATEGORY_MAP.items():
                if keyword in token:
                    detected_actives.add(category)

            for allergen in KNOWN_FRAGRANCES_ALLERGENS:
                if allergen in token:
                    detected_allergens.add(token)

        return {
            "tokencount": len(tokens),
            "tokens": tokens,
            "detected_actives": sorted(list(detected_actives)),
            "detected_allergens": sorted(list(detected_allergens))
        }
