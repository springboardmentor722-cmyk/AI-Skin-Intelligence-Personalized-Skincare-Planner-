import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { FaExternalLinkAlt, FaSearch } from "react-icons/fa";
import "../styles/product.css";

function Products() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [recommendations, setRecommendations] = useState([]);
    const [cautions, setCautions] = useState([]);
    const [recommendationMessage, setRecommendationMessage] = useState("");
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);
    const role = localStorage.getItem("role");

    // ------------------------------------------------
    // Load products
    // ------------------------------------------------

    useEffect(() => {
        loadProducts();
        if (role === "USER") loadRecommendations();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/products/");

            if (Array.isArray(response.data)) {
                setProducts(response.data);
            } else {
                setProducts([]);
                setError("Invalid product data received from server.");
            }
        } catch (err) {
            console.error("Product loading error:", err);
            setError("Unable to load products right now.");
        } finally {
            setLoading(false);
        }
    };

    const loadRecommendations = async () => {
        try {
            setRecommendationsLoading(true);
            setRecommendationMessage("");
            const { data } = await api.get("/products/recommendations");
            setRecommendations(data.recommendations || []);
            setCautions(data.cautions || []);
            setRecommendationMessage(data.warnings?.[0] || "");
        } catch {
            setRecommendationMessage("Personalized recommendations are unavailable right now.");
        } finally {
            setRecommendationsLoading(false);
        }
    };

    // ------------------------------------------------
    // Categories
    // ------------------------------------------------

    const categories = useMemo(() => {
        const uniqueCategories = products
            .map((product) => product.category)
            .filter(
                (category) =>
                    category &&
                    typeof category === "string" &&
                    category.trim() !== ""
            )
            .map((category) => category.trim());

        return [...new Set(uniqueCategories)].sort((a, b) =>
            a.localeCompare(b)
        );
    }, [products]);

    // ------------------------------------------------
    // Filter products
    // ------------------------------------------------

    const filteredProducts = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        return products.filter((product) => {
            const productName = String(
                product.product_name || ""
            ).toLowerCase();

            const brand = String(
                product.brand || ""
            ).toLowerCase();

            const productCategory = String(
                product.category || ""
            ).toLowerCase();

            const ingredients = String(
                product.ingredients || ""
            ).toLowerCase();

            const matchesSearch =
                !searchText ||
                productName.includes(searchText) ||
                brand.includes(searchText) ||
                productCategory.includes(searchText) ||
                ingredients.includes(searchText);

            const matchesCategory =
                category === "ALL" ||
                product.category?.trim() === category;

            return matchesSearch && matchesCategory;
        });
    }, [products, search, category]);

    // ------------------------------------------------
    // Format price
    // ------------------------------------------------

    const formatPrice = (price, currency) => {
        if (price === null || price === undefined || price === "") {
            return "Price unavailable";
        }

        const numericPrice = Number(price);

        if (Number.isNaN(numericPrice)) {
            return "Price unavailable";
        }

        return `${currency || "INR"} ${numericPrice.toFixed(2)}`;
    };

    // ------------------------------------------------
    // Reset filters
    // ------------------------------------------------

    const clearFilters = () => {
        setSearch("");
        setCategory("ALL");
    };

    return (
        <DashboardLayout>

            <div className="container-fluid">

                {/* =========================
                    HERO
                ========================= */}

                <div className="product-hero">

                    <div>

                        <h2>
                            Discover Skincare Products
                        </h2>

                        <p>
                            Explore skincare products, ingredients,
                            prices, and product information.
                        </p>

                    </div>

                </div>

                {role === "USER" && <section className="recommendations-panel mt-4" aria-live="polite">
                    <h3>Recommended for You</h3>
                    <p className="text-muted">Personalized from your current saved skin profile and active catalog products.</p>
                    {recommendationsLoading && <p className="text-muted mb-0">Loading personalized recommendations...</p>}
                    {recommendationMessage && <div className="alert alert-info mb-3">{recommendationMessage}</div>}
                    {!recommendationsLoading && !recommendationMessage && !recommendations.length && <p className="text-muted">No safe personalized recommendations are available yet.</p>}
                    <div className="row">{recommendations.slice(0, 4).map((product) => <div className="col-xl-3 col-lg-4 col-md-6 mb-3" key={product.product_id}><article className="product-card h-100"><div className="product-body"><p className="product-category">{product.category || "Skincare"}</p><h4>{product.product_name}</h4>{product.brand && <p className="brand">{product.brand}</p>}<span className="recommendation-score">{Math.round(product.recommendation_score)}% Match</span><p className="recommendation-status">Safety: Safe ({product.safety_score}/100)</p><p className="recommendation-detail">Skin type: {product.skin_type_score ? "Suitable" : "Not confirmed"} · Concern match: {Math.round(product.concern_match_score)}%</p><p className="recommendation-detail">Price: {formatPrice(product.price, product.currency)} · Rating: {product.rating ?? "Not available"}</p><p className="recommendation-reason">{product.recommendation_reason}</p>{product.ingredient_safety?.length > 0 && <details className="recommendation-ingredients"><summary>Ingredient safety</summary>{product.ingredient_safety.slice(0, 5).map((ingredient) => <p key={ingredient.ingredient_name}><strong>{ingredient.ingredient_name}:</strong> {ingredient.safety_status}</p>)}</details>}</div></article></div>)}</div>
                    {cautions.length > 0 && <details className="recommendation-cautions"><summary>Product cautions ({cautions.length})</summary>{cautions.slice(0, 5).map((product) => <p key={product.product_id}><strong>{product.product_name} ({product.safety_status}):</strong> {product.warnings.join(" ") || "Ingredient safety evidence is incomplete."}</p>)}</details>}
                </section>}

                {/* =========================
                    SEARCH + FILTER
                ========================= */}

                <div className="product-tools mt-4">

                    <label className="product-search">

                        <FaSearch />

                        <input
                            type="search"
                            placeholder="Search products, categories, brands, or ingredients..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </label>

                    <select
                        className="product-filter"
                        value={category}
                        onChange={(e) =>
                            setCategory(e.target.value)
                        }
                    >

                        <option value="ALL">
                            All Categories
                        </option>

                        {categories.map((item) => (
                            <option
                                key={item}
                                value={item}
                            >
                                {item}
                            </option>
                        ))}

                    </select>

                    {(search || category !== "ALL") && (

                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </button>

                    )}

                </div>

                {/* =========================
                    RESULT COUNT
                ========================= */}

                {!loading && !error && (

                    <div className="mt-3">

                        <p className="text-muted">

                            Showing{" "}
                            <strong>
                                {filteredProducts.length}
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {products.length}
                            </strong>{" "}
                            products

                            {category !== "ALL" && (
                                <>
                                    {" "}in{" "}
                                    <strong>
                                        {category}
                                    </strong>
                                </>
                            )}

                        </p>

                    </div>

                )}

                {/* =========================
                    ERROR
                ========================= */}

                {error && (

                    <div className="alert alert-danger mt-4">

                        {error}

                        <button
                            className="btn btn-sm btn-danger ms-3"
                            onClick={loadProducts}
                        >
                            Retry
                        </button>

                    </div>

                )}

                {/* =========================
                    LOADING
                ========================= */}

                {loading && (

                    <div className="text-center mt-5">

                        <div
                            className="spinner-border"
                            role="status"
                        />

                        <p className="mt-3">
                            Loading products...
                        </p>

                    </div>

                )}

                {/* =========================
                    EMPTY
                ========================= */}

                {!loading &&
                    !error &&
                    filteredProducts.length === 0 && (

                        <div className="product-empty mt-4">

                            <h4>
                                No products found
                            </h4>

                            <p>
                                Try another search term or
                                select a different category.
                            </p>

                            <button
                                className="btn btn-primary"
                                onClick={clearFilters}
                            >
                                Show All Products
                            </button>

                        </div>

                    )}

                {/* =========================
                    PRODUCT GRID
                ========================= */}

                {!loading &&
                    !error &&
                    filteredProducts.length > 0 && (

                        <div className="row mt-4">

                            {filteredProducts.map((product) => (

                                <div
                                    className="col-xl-3 col-lg-4 col-md-6 mb-4"
                                    key={product.product_id}
                                >

                                    <article className="product-card h-100">

                                        {/* BODY */}

                                        <div className="product-body">

                                            <p className="product-category">

                                                {product.category ||
                                                    "Skincare"}

                                            </p>

                                            <h4>
                                                {product.product_name ||
                                                    "Unnamed Product"}
                                            </h4>

                                            {product.brand && (

                                                <p className="brand">

                                                    {product.brand}

                                                </p>

                                            )}

                                            <p className="ingredients">

                                                {product.ingredients ||
                                                    "Ingredient details are unavailable."}

                                            </p>

                                            {/* PRICE */}

                                            <div className="price-row">

                                                <h4>

                                                    {formatPrice(
                                                        product.price,
                                                        product.currency
                                                    )}

                                                </h4>

                                                {product.product_url && (

                                                    <a
                                                        className="product-link"
                                                        href={
                                                            product.product_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        View{" "}
                                                        <FaExternalLinkAlt />
                                                    </a>

                                                )}

                                            </div>

                                        </div>

                                    </article>

                                </div>

                            ))}

                        </div>

                    )}

            </div>

        </DashboardLayout>
    );
}

export default Products;
