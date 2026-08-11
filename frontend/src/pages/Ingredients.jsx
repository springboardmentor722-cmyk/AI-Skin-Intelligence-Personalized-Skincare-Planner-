import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { FaCheckCircle, FaExclamationTriangle, FaExternalLinkAlt, FaLeaf, FaSearch } from "react-icons/fa";
import "../styles/ingredient.css";
function Ingredients() {
  const [ingredients, setIngredients] = useState([]); const [search, setSearch] = useState(""); const [error, setError] = useState("");
  useEffect(() => { api.get("/ingredients/").then(({ data }) => setIngredients(data)).catch(() => setError("Unable to load ingredients right now.")); }, []);
  const filtered = ingredients.filter((i) => !search || [i.ingredient_name, i.short_description, i.description, i.benefits, i.suitable_for].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase()));
  return <DashboardLayout><div className="ingredient-hero"><h2>Ingredients Library</h2><p>Learn what skincare ingredients are, what they do, and who they may suit.</p></div><label className="search-box mt-4"><FaSearch /><input type="search" placeholder="Search ingredients, benefits, or concerns..." value={search} onChange={(e) => setSearch(e.target.value)} /></label>{error && <div className="alert alert-danger mt-4">{error}</div>}{!error && !filtered.length && <div className="ingredient-empty mt-4">No ingredients match your search.</div>}<div className="row mt-4">{filtered.map((i) => <div className="col-lg-6 mb-4" key={i.ingredient_id}><article className="ingredient-card h-100"><div className="ingredient-body"><h3>{i.ingredient_name}</h3>{i.short_description && <p className="ingredient-summary">{i.short_description}</p>}{(i.suitable_for || i.suitable_skin) && <div className="skin-tag"><FaLeaf /> {i.suitable_for || i.suitable_skin}</div>}{i.description && <div className="info-section"><h6>What is it?</h6><p>{i.description}</p></div>}{i.benefits && <div className="info-section"><h6><FaCheckCircle /> What does it do?</h6><p>{i.benefits}</p></div>}{i.side_effects && <div className="info-section"><h6><FaExclamationTriangle /> Who should avoid it?</h6><p>{i.side_effects}</p></div>}{i.source_url && <a className="ingredient-link" href={i.source_url} target="_blank" rel="noreferrer">Source <FaExternalLinkAlt /></a>}</div></article></div>)}</div></DashboardLayout>;
}
export default Ingredients;
