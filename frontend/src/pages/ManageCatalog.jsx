import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

const productFields = [["product_name", "Product name", true], ["brand", "Brand"], ["category", "Category"], ["skin_type", "Skin type"], ["ingredients", "Ingredients", false, true], ["price", "Price", false, false, "number"], ["currency", "Currency"], ["product_url", "Product URL", false, false, "url"], ["image_url", "Image URL", false, false, "url"]];
const ingredientFields = [["ingredient_name", "Ingredient name", true], ["short_description", "Short description", false, true], ["description", "Description", false, true], ["benefits", "Benefits", false, true], ["suitable_skin", "Suitable skin"], ["suitable_for", "Suitable for", false, true], ["side_effects", "Side effects", false, true], ["source_url", "Source URL", false, false, "url"]];

const truncateText = (text, limit = 120) => {
  if (!text) return "No details available";
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}...` : text;
};

const ingredientDetails = (ingredient) => ingredient.description || ingredient.short_description || ingredient.benefits;
const productDetails = (product) => product.ingredients;

export default function ManageCatalog({ type }) {
  const isProduct = type === "products";
  const fields = isProduct ? productFields : ingredientFields;
  const label = isProduct ? "Products" : "Ingredients";
  const idField = isProduct ? "product_id" : "ingredient_id";
  const nameField = isProduct ? "product_name" : "ingredient_name";
  const empty = Object.fromEntries(fields.map(([key]) => [key, key === "currency" ? "INR" : ""]));
  const [items, setItems] = useState([]); const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null); const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const load = async (searchTerm = search) => { setLoading(true); setError(""); try { const { data } = await api.get(`/${type}/admin`, { params: { search: searchTerm } }); setItems(data); } catch (e) { setError(e.response?.data?.detail || `Unable to load ${label.toLowerCase()}.`); } finally { setLoading(false); } };
  useEffect(() => { setItems([]); setForm(empty); setEditing(null); setSearch(""); load(""); }, [type]);
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { const payload = { ...form, ...(isProduct && form.price !== "" ? { price: Number(form.price) } : {}) }; if (editing) await api.put(`/${type}/${editing[idField]}`, payload); else await api.post(`/${type}/`, payload); setForm(empty); setEditing(null); await load(); } catch (e) { setError(e.response?.data?.detail || "Unable to save. Please check the form and try again."); } finally { setSaving(false); } };
  const beginEdit = (item) => { setEditing(item); setForm(Object.fromEntries(fields.map(([key]) => [key, item[key] ?? (key === "currency" ? "INR" : "")]))); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deactivate = async (item) => { if (!window.confirm(`Deactivate ${item[nameField]}? It will no longer appear in the public library.`)) return; setError(""); try { await api.delete(`/${type}/${item[idField]}`); await load(); } catch (e) { setError(e.response?.data?.detail || "Unable to deactivate this record."); } };

  return <DashboardLayout><div className="container py-3"><h2>Manage {label}</h2><p className="text-muted">Create, edit, and deactivate catalog records.</p>{error && <div className="alert alert-danger">{error}</div>}<form className="card card-body shadow-sm mb-4" onSubmit={submit}><h5>{editing ? `Edit ${editing[nameField]}` : `Add ${label.slice(0, -1)}`}</h5><div className="row">{fields.map(([key, fieldLabel, required, textarea, inputType]) => <div className="col-md-6 mb-3" key={key}><label className="form-label">{fieldLabel}{required && " *"}</label>{textarea ? <textarea className="form-control" rows="3" required={required} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /> : <input className="form-control" type={inputType || "text"} min={inputType === "number" ? "0" : undefined} required={required} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />}</div>)}</div><div><button className="btn btn-success" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : `Create ${label.slice(0, -1)}`}</button>{editing && <button type="button" className="btn btn-outline-secondary ms-2" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}</div></form><div className="d-flex gap-2 mb-3"><input className="form-control" placeholder={`Search ${label.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} /><button className="btn btn-outline-primary" onClick={load} disabled={loading}>Search</button></div>{loading ? <p>Loading {label.toLowerCase()}...</p> : <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Name</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map(item => <tr key={item[idField]}><td>{item[nameField]}</td><td>{truncateText(isProduct ? productDetails(item) : ingredientDetails(item))}</td><td><span className={`badge ${item.is_active ? "bg-success" : "bg-secondary"}`}>{item.is_active ? "Active" : "Inactive"}</span></td><td><button className="btn btn-sm btn-outline-primary me-2" onClick={() => beginEdit(item)}>Edit</button>{item.is_active && <button className="btn btn-sm btn-outline-danger" onClick={() => deactivate(item)}>Deactivate</button>}</td></tr>)}</tbody></table>{!items.length && <p className="text-muted">No {label.toLowerCase()} found.</p>}</div>}</div></DashboardLayout>;
}
