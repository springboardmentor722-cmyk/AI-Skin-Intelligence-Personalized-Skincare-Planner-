import React, { useEffect, useState } from 'react'
import { productApi } from '../api/endpoints'

const CATEGORIES = ['', 'Face Wash', 'Moisturizer', 'Sunscreen', 'Serum', 'Toner', 'Treatment Products', 'Face Masks']

export default function Products() {
  const [recs, setRecs] = useState([])
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState([])

  const load = (cat) => {
    setLoading(true)
    productApi
      .recommendations(cat || undefined, 12)
      .then((res) => setRecs(res.data))
      .catch((e) => setError(e.response?.data?.detail || 'Create your skin profile first.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(category), [category])

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev))
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Product Recommendations</h1>
      <p className="text-ink-soft mb-6 text-sm">Ranked by suitability for your skin type, concerns, allergies, and budget.</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c || 'all'}
            onClick={() => setCategory(c)}
            className={`badge border ${category === c ? 'bg-brand-500 text-white border-brand-500' : 'border-stone-300 text-ink-soft'}`}
          >
            {c || 'All Categories'}
          </button>
        ))}
      </div>

      {error && <div className="bg-rose-50 text-rose-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      {selected.length > 0 && (
        <div className="bg-brand-50 text-brand-700 text-sm rounded-lg px-4 py-2 mb-4">
          Comparing {selected.length} product(s) — select up to 3 using the checkbox on each card.
        </div>
      )}

      {loading ? (
        <p className="text-ink-faint">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {recs.map((r) => (
            <div key={r.product.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs text-ink-faint">{r.product.brand}</div>
                  <div className="font-medium text-ink">{r.product.name}</div>
                </div>
                <input type="checkbox" checked={selected.includes(r.product.id)} onChange={() => toggleSelect(r.product.id)} className="mt-1" />
              </div>
              <div className="text-sm text-ink-soft mb-2">{r.product.description}</div>
              <div className="flex items-center justify-between mb-3">
                <span className="badge bg-sage-100 text-sage-700">₹{r.product.price}</span>
                <div className="flex gap-1.5">
                  <span className={`badge ${r.method === 'ml' ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-ink-soft'}`}>
                    {r.method === 'ml' ? '🤖 ML model' : 'rules'}
                  </span>
                  <span className={`badge ${r.suitability_score >= 70 ? 'bg-sage-100 text-sage-700' : 'bg-gold-100 text-gold-600'}`}>
                    {r.suitability_score}% match
                  </span>
                </div>
              </div>
              <p className="text-xs text-ink-faint">{r.reason}</p>
            </div>
          ))}
          {recs.length === 0 && !error && (
            <div className="col-span-3 text-center text-ink-faint py-10">No products found for this category yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
