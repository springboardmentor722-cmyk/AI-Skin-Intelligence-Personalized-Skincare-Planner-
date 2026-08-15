import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import ProductImage from "../components/ProductImage";
import "./Store.css";

const CATEGORIES = ["All", "Cleanser", "Serum", "Moisturizer", "Sunscreen", "Toner", "Mask", "Treatment"];

export default function Store() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState({}); // { productId: quantity }
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState("");

  const [view, setView] = useState("catalog"); // "catalog" | "forYou"
  const [recommendations, setRecommendations] = useState(null);
  const [maxPrice, setMaxPrice] = useState("");
  const [recLoading, setRecLoading] = useState(false);
  const [excludedCount, setExcludedCount] = useState(0);

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .catch(() => setError("Could not load the store."))
      .finally(() => setLoading(false));
  }, []);

  const loadRecommendations = () => {
    setRecLoading(true);
    const params = maxPrice ? { max_price: maxPrice } : {};
    api
      .get("/v1/recommendations", { params })
      .then((res) => {
        setRecommendations(res.data.categories);
        setExcludedCount(res.data.excluded_count);
      })
      .catch(() => setError("Could not load personalized recommendations. Have you completed your assessment?"))
      .finally(() => setRecLoading(false));
  };

  useEffect(() => {
    if (view === "forYou" && recommendations === null) loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const visibleProducts = useMemo(
    () => (category === "All" ? products : products.filter((p) => p.category === category)),
    [products, category]
  );

  const flatRecommendations = useMemo(() => {
    if (!recommendations) return [];
    const flat = Object.values(recommendations).flat();
    return category === "All" ? flat : flat.filter((p) => p.category === category);
  }, [recommendations, category]);

  const addToCart = (productId) => {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[productId] > 1) {
        next[productId] -= 1;
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const findProductPrice = (productId) => {
    const fromCatalog = products.find((p) => p.id === productId);
    if (fromCatalog) return fromCatalog.price;
    const fromRec = flatRecommendations.find((p) => p.id === productId);
    return fromRec ? fromRec.price : 0;
  };

  const findProductName = (productId) => {
    const fromCatalog = products.find((p) => p.id === productId);
    if (fromCatalog) return fromCatalog.name;
    const fromRec = flatRecommendations.find((p) => p.id === productId);
    return fromRec ? fromRec.name : "";
  };

  const cartItems = Object.entries(cart).map(([productId, quantity]) => ({
    productId,
    name: findProductName(productId),
    price: findProductPrice(productId),
    quantity,
  }));

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setPlacing(true);
    setError("");
    try {
      await api.post("/products/order", {
        items: cartItems.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
      });
      setOrderSuccess(`Order placed! ${cartCount} item${cartCount > 1 ? "s" : ""} — ₹${cartTotal.toFixed(2)}`);
      setCart({});
    } catch {
      setError("Could not place your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Loading label="Loading the store" />;

  return (
    <div className="store-page">
      <div className="store-header">
        <span className="eyebrow">Skincare Store</span>
        <h1>Shop skincare products</h1>
        <p>Browse the full catalog, or see products matched to your skin profile and budget.</p>
      </div>

      <ErrorBanner message={error} />
      {orderSuccess && <div className="alert alert-success">{orderSuccess}</div>}

      <div className="store-category-tabs">
        <button
          className={`store-category-tab ${view === "catalog" ? "store-category-tab-active" : ""}`}
          onClick={() => setView("catalog")}
        >
          Full Catalog
        </button>
        <button
          className={`store-category-tab ${view === "forYou" ? "store-category-tab-active" : ""}`}
          onClick={() => setView("forYou")}
        >
          ✨ For You
        </button>
      </div>

      {view === "forYou" && (
        <div className="store-budget-row">
          <label>Budget cap (₹)</label>
          <input
            type="number"
            placeholder="No limit"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <button className="btn btn-ghost" onClick={loadRecommendations} disabled={recLoading}>
            {recLoading ? "Matching..." : "Update matches"}
          </button>
          {excludedCount > 0 && (
            <span className="store-excluded-note">
              {excludedCount} product{excludedCount > 1 ? "s" : ""} hidden due to your allergy profile
            </span>
          )}
        </div>
      )}

      <div className="store-category-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`store-category-tab ${category === c ? "store-category-tab-active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="store-layout">
        <div className="store-grid">
          {view === "catalog" &&
            visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                inCart={cart[product.id]}
                onAdd={() => addToCart(product.id)}
                onRemove={() => removeFromCart(product.id)}
              />
            ))}

          {view === "forYou" &&
            (recLoading ? (
              <Loading label="Finding your matches" />
            ) : flatRecommendations.length === 0 ? (
              <p className="donut-empty">
                No personalized matches yet — complete your skin assessment first.
              </p>
            ) : (
              flatRecommendations.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  inCart={cart[product.id]}
                  onAdd={() => addToCart(product.id)}
                  onRemove={() => removeFromCart(product.id)}
                  matchPercentage={product.match_percentage}
                  ingredientTags={product.ingredient_tags}
                  alternativeTo={product.alternative_to}
                />
              ))
            ))}
        </div>

        <div className="store-cart glass-card">
          <h3>Your cart</h3>
          {cartItems.length === 0 ? (
            <p className="store-cart-empty">No items yet — add something from the shelf.</p>
          ) : (
            <>
              <div className="store-cart-items">
                {cartItems.map((item) => (
                  <div key={item.productId} className="store-cart-item">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="store-cart-total">
                <span>Total</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <button className="btn btn-primary store-checkout-btn" onClick={handleCheckout} disabled={placing}>
                {placing ? "Placing order..." : "Place order"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, inCart, onAdd, onRemove, matchPercentage, ingredientTags, alternativeTo }) {
  return (
    <div className="glass-card store-product-card">
      {product.is_recommended_for_you && (
        <span className="badge badge-active store-recommended-badge">Recommended for you</span>
      )}
      {matchPercentage != null && (
        <span className="badge badge-active store-recommended-badge">{matchPercentage}% Match</span>
      )}
      <ProductImage category={product.category} />
      <div className="store-product-info">
        <span className="store-product-brand">{product.brand}</span>
        <h3 className="store-product-name">{product.name}</h3>
        <div className="store-product-rating">
          ⭐ {product.rating.toFixed(1)}
          {product.review_count != null && (
            <span className="store-product-reviews"> ({product.review_count.toLocaleString()})</span>
          )}
        </div>
        {ingredientTags && ingredientTags.length > 0 && (
          <div className="store-ingredient-tags">
            {ingredientTags.map((tag) => (
              <span key={tag} className="badge badge-coming-soon">
                {tag}
              </span>
            ))}
          </div>
        )}
        {product.description && <p className="store-product-description">{product.description}</p>}
        {alternativeTo && <p className="store-alternative-note">Cheaper alternative to {alternativeTo}</p>}
        <div className="store-product-footer">
          <span className="store-product-price">₹{product.price.toFixed(2)}</span>
          {inCart ? (
            <div className="store-qty-control">
              <button onClick={onRemove}>−</button>
              <span>{inCart}</span>
              <button onClick={onAdd}>+</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onAdd}>
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
