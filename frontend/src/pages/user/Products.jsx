import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { Empty, Skeletons } from '../../components/ui'

/* ============================================================================
   Milestone 3, Part 3 — Upgraded product page.

   Search by name / brand / ingredient / skin type / concern / category, plus
   filters, sorting and pagination. All work is done server-side (the API returns
   a paginated { items, total, total_pages, facets } object), so the page stays
   fast as the catalogue grows. Built on the existing Lumen design system.
   ========================================================================== */

const BLANK = {
  q: '', ingredient: '', brand: '', category: '', skin_type: '',
  concern: '', usage_time: '', tier: '',
  sort_by: 'name', order: 'asc',
}

export default function Products() {
  const [data, setData] = useState(null)          // { items, total, page, total_pages, facets }
  const [facets, setFacets] = useState(null)
  const [filters, setFilters] = useState(BLANK)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  /* Reset to page 1 whenever a filter changes */
  const filterKey = JSON.stringify(filters)
  useEffect(() => { setPage(1) }, [filterKey])

  const query = useMemo(() => {
    const p = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => v && p.set(k, v))
    p.set('page', String(page))
    p.set('page_size', '9')
    return p.toString()
  }, [filters, page])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      api.get(`/products?${query}`)
        .then((d) => {
          setData(d)
          if (d?.facets) setFacets(d.facets)   // stable across pages
        })
        .catch(() => setData({ items: [], total: 0, total_pages: 0 }))
        .finally(() => setLoading(false))
    }, 250)                                    // debounce for fast typing
    return () => clearTimeout(t)
  }, [query])

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))
  const clearAll = () => setFilters(BLANK)

  const f = facets || {
    brands: [], categories: [],
    skin_types: ['oily', 'dry', 'combination', 'sensitive', 'normal'],
    concerns: ['acne', 'redness', 'hyperpigmentation', 'dark spots', 'oiliness',
      'dry skin', 'fine lines', 'wrinkles', 'sensitive skin'],
    usage_times: ['AM', 'PM', 'both'],
  }

  const stars = (r) => (r ? '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)) : '—')

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card">
        <h2 className="section-title">Product library</h2>
        <p className="stat-hint" style={{ marginBottom: 14 }}>
          Search the catalogue by name, brand, ingredient, skin type, concern or
          category. AI-matched recommendations arrive in the next milestone.
        </p>

        {/* row 1 — free text + ingredient */}
        <div className="grid cols-2" style={{ gap: 12, marginBottom: 12 }}>
          <input className="input" placeholder="Search name, brand, description…"
            value={filters.q} onChange={set('q')} aria-label="Search products" />
          <input className="input" placeholder="Contains ingredient… e.g. niacinamide"
            value={filters.ingredient} onChange={set('ingredient')} aria-label="Search by ingredient" />
        </div>

        {/* row 2 — structured filters */}
        <div className="grid cols-4" style={{ gap: 12, marginBottom: 12 }}>
          <select className="input" value={filters.brand} onChange={set('brand')}>
            <option value="">All brands</option>
            {f.brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="input" value={filters.category} onChange={set('category')}>
            <option value="">All categories</option>
            {f.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={filters.skin_type} onChange={set('skin_type')}>
            <option value="">Any skin type</option>
            {f.skin_types.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={filters.concern} onChange={set('concern')}>
            <option value="">Any concern</option>
            {f.concerns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* row 3 — usage, tier, sort, order */}
        <div className="grid cols-4" style={{ gap: 12 }}>
          <select className="input" value={filters.usage_time} onChange={set('usage_time')}>
            <option value="">Morning & night</option>
            <option value="AM">Morning</option>
            <option value="PM">Night</option>
          </select>
          <select className="input" value={filters.tier} onChange={set('tier')}>
            <option value="">Budget & premium</option>
            <option value="budget">Budget</option>
            <option value="premium">Premium</option>
          </select>
          <select className="input" value={filters.sort_by} onChange={set('sort_by')}>
            <option value="name">Sort: Name</option>
            <option value="brand">Sort: Brand</option>
            <option value="price">Sort: Price</option>
            <option value="rating">Sort: Rating</option>
            <option value="category">Sort: Category</option>
          </select>
          <select className="input" value={filters.order} onChange={set('order')}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <span className="stat-hint" style={{ marginRight: 'auto' }}>
            {data ? `${data.total} product${data.total === 1 ? '' : 's'} found` : 'Searching…'}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>Clear filters</button>
        </div>
      </div>

      {loading && !data ? (
        <Skeletons n={3} />
      ) : !data || data.items.length === 0 ? (
        <div className="card"><Empty>No products match — try clearing a filter.</Empty></div>
      ) : (
        <>
          <div className="grid cols-3">
            {data.items.map((p) => (
              <div className="card hoverable" key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <div className="stat-hint">{p.brand} · {p.category}</div>
                  </div>
                  <span className={`badge ${p.tier === 'premium' ? 'completed' : 'neutral'}`}>{p.tier}</span>
                </div>

                {p.rating != null && (
                  <div style={{ margin: '8px 0', fontSize: 13 }}>
                    <span style={{ color: 'var(--accent)' }}>{stars(p.rating)}</span>{' '}
                    <span className="stat-hint">{p.rating} ({p.review_count} reviews)</span>
                  </div>
                )}

                <p className="stat-hint" style={{ margin: '10px 0' }}>{p.description}</p>

                {p.usage_time && (
                  <div className="stat-hint" style={{ marginBottom: 6 }}>
                    Use: <strong>{p.usage_time === 'both' ? 'Morning & night' : p.usage_time === 'AM' ? 'Morning' : 'Night'}</strong>
                  </div>
                )}

                <div className="pill-row" style={{ marginBottom: 12 }}>
                  {p.ingredients.map((i) => (
                    <span className="badge neutral" key={i.id}
                      title={i.benefits || i.description || ''}>{i.name}</span>
                  ))}
                </div>

                {p.warnings && (
                  <p className="stat-hint" style={{ color: 'var(--warn)', marginBottom: 8 }}>
                    ⚠ {p.warnings}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>₹{p.price}</span>
                  <span className="stat-hint">
                    for {p.skin_type_compat ? p.skin_type_compat.split(',').slice(0, 3).join(', ') :
                      (p.suitable_for === 'all' ? 'all skin types' : p.suitable_for)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* pagination */}
          {data.total_pages > 1 && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>← Prev</button>
              <span className="stat-hint">Page {data.page} of {data.total_pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= data.total_pages}
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
