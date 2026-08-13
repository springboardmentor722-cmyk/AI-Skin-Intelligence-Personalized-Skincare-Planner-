import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Empty, Icon, Modal } from '../../components/ui'

export default function AdminProducts() {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', brand: '', category: 'serum', price: '', tier: 'budget', suitable_for: 'all', description: '', ingredients: '' })

  // GET /products returns a paginated object { items, total, ... } since
  // Milestone 3. Pull the array out (and request a large page so the admin
  // catalogue shows everything, not just the first page).
  const load = () => api.get('/products?page_size=100')
    .then(res => setProducts(Array.isArray(res) ? res : (res.items || [])))
    .catch(e => { setProducts([]); setError(e.message) })
  useEffect(() => { load() }, [])

  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return
    try { await api.del(`/admin/products/${p.id}`); load() } catch (e) { setError(e.message) }
  }
  const create = async (e) => {
    e.preventDefault(); setError('')
    try {
      await api.post('/admin/products', {
        name: form.name, brand: form.brand || null, category: form.category,
        price: form.price ? Number(form.price) : null, tier: form.tier,
        suitable_for: form.suitable_for, description: form.description || null,
        ingredient_names: form.ingredients.split(',').map(s => s.trim()).filter(Boolean),
      })
      setCreating(false)
      setForm({ name: '', brand: '', category: 'serum', price: '', tier: 'budget', suitable_for: 'all', description: '', ingredients: '' })
      load()
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="section-title" style={{ marginBottom: 0, marginRight: 'auto' }}>Product catalogue</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
          <Icon name="plus" size={15} /> Add product
        </button>
      </div>
      {error && <div className="alert error">{error}</div>}
      {!products ? <div className="skeleton" /> : products.length === 0 ? <Empty>Catalogue is empty.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Tier</th><th>Price</th><th>Ingredients</th><th></th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{p.brand}</div>
                  </td>
                  <td>{p.category}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.tier}</td>
                  <td>{p.price != null ? `₹${p.price}` : '—'}</td>
                  <td style={{ maxWidth: 240, color: 'var(--ink-soft)', fontSize: 12.5 }}>
                    {(p.ingredients || []).map(i => i.name).join(', ') || '—'}
                  </td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Add product"
        sub="Ingredients are matched by name and created automatically when new.">
        <form onSubmit={create}>
          <div className="grid cols-2" style={{ gap: 12 }}>
            <div className="field"><label>Name</label>
              <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="field"><label>Brand</label>
              <input className="input" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>
            <div className="field"><label>Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['cleanser', 'serum', 'moisturizer', 'sunscreen', 'exfoliant', 'treatment', 'mask', 'toner'].map(c => <option key={c}>{c}</option>)}
              </select></div>
            <div className="field"><label>Tier</label>
              <select className="input" value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
                <option value="budget">budget</option><option value="premium">premium</option>
              </select></div>
            <div className="field"><label>Price (₹)</label>
              <input className="input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
            <div className="field"><label>Suitable for</label>
              <input className="input" value={form.suitable_for} placeholder="all / oily,combination…"
                onChange={e => setForm(f => ({ ...f, suitable_for: e.target.value }))} /></div>
          </div>
          <div className="field"><label>Description</label>
            <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="field"><label>Ingredients (comma separated)</label>
            <input className="input" value={form.ingredients} placeholder="Niacinamide, Hyaluronic Acid"
              onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} /></div>
          <button className="btn btn-primary" style={{ width: '100%' }}>Add to catalogue</button>
        </form>
      </Modal>
    </div>
  )
}
