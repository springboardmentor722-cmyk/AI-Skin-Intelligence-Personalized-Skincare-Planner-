import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { FaExternalLinkAlt, FaSearch } from "react-icons/fa";
import "../styles/product.css";

const FALLBACK_IMAGE = "/product.png";

function Products() {
  const [products, setProducts] = useState([]); const [search, setSearch] = useState(""); const [category, setCategory] = useState("ALL"); const [error, setError] = useState("");
  useEffect(() => { api.get("/products/").then(({ data }) => setProducts(data)).catch(() => setError("Unable to load products right now.")); }, []);
  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products]);
  const filtered = products.filter((p) => { const text = [p.product_name, p.brand, p.category, p.ingredients].filter(Boolean).join(" ").toLowerCase(); return (!search || text.includes(search.toLowerCase())) && (category === "ALL" || p.category === category); });
  return <DashboardLayout><div className="product-hero"><div><h2>Discover Skincare Products</h2><p>Explore dataset-backed products, ingredients, and prices.</p></div></div><div className="product-tools mt-4"><label className="product-search"><FaSearch /><input type="search" placeholder="Search products, categories, or ingredients..." value={search} onChange={(e) => setSearch(e.target.value)} /></label><select className="product-filter" value={category} onChange={(e) => setCategory(e.target.value)}><option value="ALL">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>{error && <div className="alert alert-danger mt-4">{error}</div>}{!error && !filtered.length && <div className="product-empty mt-4">No products match your search.</div>}<div className="row mt-4">{filtered.map((p) => <div className="col-lg-4 col-md-6 mb-4" key={p.product_id}><article className="product-card h-100"><img src={p.image_url || FALLBACK_IMAGE} alt={p.product_name} onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} /><div className="product-body"><p className="product-category">{p.category || "Skincare"}</p><h4>{p.product_name}</h4>{p.brand && <p className="brand">{p.brand}</p>}<p className="ingredients">{p.ingredients || "Ingredient details are unavailable."}</p><div className="price-row"><h4>{p.price == null ? "Price unavailable" : `${p.currency || "GBP"} ${Number(p.price).toFixed(2)}`}</h4>{p.product_url && <a className="product-link" href={p.product_url} target="_blank" rel="noreferrer">View <FaExternalLinkAlt /></a>}</div></div></article></div>)}</div></DashboardLayout>;
}
export default Products;
