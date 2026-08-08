import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os

# Define the concerns and common ingredients
concerns = ["acne", "breakout", "redness", "dry", "hyperpigmentation", "dark spot", "uneven", "wrinkle", "fine line", "oily"]
ingredients = ["salicylic", "niacinamide", "bha", "retinol", "zinc", "benzoyl", "tea tree", "azelaic", "centella", "cica", "aloe", "ceramide", "panthenol", "hyaluronic", "glycerin", "squalane", "shea", "peptide", "vitamin c", "arbutin", "kojic", "licorice", "tranexamic", "aha", "glycolic", "lactic", "bakuchiol", "collagen", "clay", "charcoal"]

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    data = []
    
    # concern mapping to beneficial ingredients (simplified)
    concern_to_ingredients = {
        "acne": ["salicylic", "niacinamide", "bha", "retinol", "zinc", "benzoyl", "tea tree"],
        "breakout": ["salicylic", "niacinamide", "bha", "retinol", "zinc", "benzoyl"],
        "redness": ["niacinamide", "azelaic", "centella", "cica", "aloe", "ceramide", "panthenol"],
        "dry": ["ceramide", "hyaluronic", "glycerin", "squalane", "shea", "peptide"],
        "hyperpigmentation": ["vitamin c", "arbutin", "niacinamide", "kojic", "licorice", "tranexamic"],
        "dark spot": ["vitamin c", "arbutin", "niacinamide", "aha", "glycolic", "lactic"],
        "uneven": ["vitamin c", "arbutin", "aha", "glycolic", "lactic"],
        "wrinkle": ["retinol", "peptide", "bakuchiol", "vitamin c", "collagen"],
        "fine line": ["retinol", "peptide", "bakuchiol", "vitamin c", "hyaluronic"],
        "oily": ["salicylic", "niacinamide", "zinc", "clay", "charcoal", "bha"],
    }
    
    for _ in range(num_samples):
        # random user concern (pick 1 or 2)
        user_concerns = np.random.choice(concerns, size=np.random.randint(1, 3), replace=False)
        
        # random product ingredients (pick 3 to 8)
        prod_ingredients = np.random.choice(ingredients, size=np.random.randint(3, 9), replace=False)
        
        # calculate dummy score based on current logic
        match_score = 70
        for concern in user_concerns:
            beneficial = []
            for k, v in concern_to_ingredients.items():
                if k in concern:
                    beneficial.extend(v)
            for b_ing in beneficial:
                if b_ing in prod_ingredients:
                    match_score += 15
            
            if match_score > 98:
                match_score = 98
            
        match_score = min(match_score, 99)
        
        # create row
        row = {}
        for c in concerns:
            row[f"concern_{c}"] = 1 if c in user_concerns else 0
        for i in ingredients:
            row[f"ing_{i}"] = 1 if i in prod_ingredients else 0
        row["match_score"] = match_score
        data.append(row)
        
    return pd.DataFrame(data)

def train_model():
    print("Generating synthetic data...")
    df = generate_synthetic_data(5000)
    
    X = df.drop(columns=["match_score"])
    y = df["match_score"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Model R^2 score: {score:.4f}")
    
    # Save the model and feature columns
    model_data = {
        "model": model,
        "features": list(X.columns)
    }
    
    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "ml")
    os.makedirs(output_path, exist_ok=True)
    
    model_file = os.path.join(output_path, "rf_model.joblib")
    joblib.dump(model_data, model_file)
    print(f"Model saved to {model_file}")

if __name__ == "__main__":
    train_model()
