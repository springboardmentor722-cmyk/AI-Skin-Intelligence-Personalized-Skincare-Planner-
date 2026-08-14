from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, engine, cache
from ..database import get_db
from ..deps import get_current_user, require_roles

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=List[schemas.ProductOut])
def list_products(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Product)
    if category:
        query = query.filter(models.Product.category == category)
    return query.all()


@router.get("/recommendations", response_model=List[schemas.ProductRecommendationOut])
def get_recommendations(
    category: Optional[str] = Query(None, description="Filter recommendations to one product category"),
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cache_key = f"product_recs:{current_user.id}:{category or 'all'}:{limit}"
    cached = cache.cache_get(cache_key)
    if cached:
        return cached

    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a skin profile first.")

    query = db.query(models.Product)
    if category:
        query = query.filter(models.Product.category == category)
    products = query.all()

    results = engine.score_products_for_profile_hybrid(products, profile)
    scored = []
    for r in results:
        scored.append({
            "product": r["product"],
            "suitability_score": r["score"],
            "reason": r["reason"],
            "method": r["method"]
        })

    scored.sort(key=lambda x: x["suitability_score"], reverse=True)
    top = scored[:limit]

    # cache for 10 minutes -- product catalog + profile don't change every second
    serializable = [
        {"product": schemas.ProductOut.model_validate(r["product"]).model_dump(mode="json"),
         "suitability_score": r["suitability_score"], "reason": r["reason"], "method": r["method"]}
        for r in top
    ]
    cache.cache_set(cache_key, serializable, ttl_seconds=600)

    return top


@router.get("/compare", response_model=List[schemas.ProductRecommendationOut])
def compare_products(
    product_ids: str = Query(..., description="Comma-separated product IDs, e.g. 1,2,3"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a skin profile first.")

    ids = [int(x) for x in product_ids.split(",") if x.strip().isdigit()]
    products = db.query(models.Product).filter(models.Product.id.in_(ids)).all()

    results_raw = engine.score_products_for_profile_hybrid(products, profile)
    results = []
    for r in results_raw:
        results.append({
            "product": r["product"],
            "suitability_score": r["score"],
            "reason": r["reason"],
            "method": r["method"]
        })
    results.sort(key=lambda x: x["suitability_score"], reverse=True)
    return results


@router.post("", response_model=schemas.ProductOut)
def create_product(
    product: schemas.ProductOut,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin")),
):
    data = product.model_dump(exclude={"id"})
    new_product = models.Product(**data)
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product
