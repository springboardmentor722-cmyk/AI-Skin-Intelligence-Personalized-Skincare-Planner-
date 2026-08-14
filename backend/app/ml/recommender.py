from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def build_user_query(profile: dict) -> str:
    """Build a search string from the user's profile."""
    terms = []
    if profile.get("skin_type"):
        terms.append(profile["skin_type"])
    if profile.get("skin_concerns"):
        terms.extend(profile["skin_concerns"])
    # We can boost concerns by repeating them, but simple concatenation is fine for TF-IDF
    return " ".join(terms).replace("_", " ")

def build_product_document(product: dict) -> str:
    """Build a document string representing the product for TF-IDF."""
    terms = []
    terms.append(product.get("category", ""))
    terms.extend(product.get("key_ingredients", []))
    terms.extend(product.get("suitable_concerns", []))
    terms.append(product.get("description", ""))
    return " ".join(terms).replace("_", " ")

def compute_content_similarity(profile_dict: dict, products: list) -> list:
    """
    Computes cosine similarity between the user profile and a list of products.
    Returns a list of float similarity scores (0.0 to 1.0) corresponding to each product.
    """
    if not products:
        return []

    user_query = build_user_query(profile_dict)
    
    # If the user has no specific concerns or skin type, fallback to a neutral score
    if not user_query.strip():
        return [0.5 for _ in products]

    product_docs = [build_product_document(p) for p in products]

    # Initialize TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(stop_words='english')
    
    # Fit and transform all product documents + user query
    # The last element will be the user query
    all_docs = product_docs + [user_query]
    
    try:
        tfidf_matrix = vectorizer.fit_transform(all_docs)
    except ValueError:
        # Failsafe if vocabulary is empty (e.g. all stop words)
        return [0.5 for _ in products]

    # The user vector is the last row
    user_vector = tfidf_matrix[-1]
    
    # The product vectors are all rows except the last
    product_vectors = tfidf_matrix[:-1]

    # Compute cosine similarity
    cosine_sim = cosine_similarity(user_vector, product_vectors)
    
    # cosine_sim is a 2D array, get the first (and only) row
    scores = cosine_sim[0].tolist()
    
    return scores
