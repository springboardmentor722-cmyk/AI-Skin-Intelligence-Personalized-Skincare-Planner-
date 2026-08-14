import React, { useEffect, useState } from 'react'
import { ingredientApi } from '../api/endpoints'

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([])
  const [selected, setSelected] = useState([])
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    ingredientApi.list().then((res) => setIngredients(res.data))
  }, [])

  const toggle = (name) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  const handleCheck = async () => {
    setChecking(true)
    try {
      const res = await ingredientApi.checkSuitability(selected)
      setResult(res.data)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Ingredient Intelligence</h1>
      <p className="text-ink-soft mb-8 text-sm">Learn about key ingredients and check suitability against your skin profile.</p>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {ingredients.map((ing) => (
          <div key={ing.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="badge bg-brand-100 text-brand-700 mb-1">{ing.category}</span>
                <h3 className="font-medium text-ink">{ing.name}</h3>
              </div>
              <input type="checkbox" checked={selected.includes(ing.name)} onChange={() => toggle(ing.name)} />
            </div>
            <p className="text-sm text-ink-soft mb-2">{ing.description}</p>
            {ing.benefits?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {ing.benefits.map((b) => (
                  <span key={b} className="badge bg-sage-50 text-sage-700 text-[11px]">{b}</span>
                ))}
              </div>
            )}
            {ing.cautions?.length > 0 && (
              <p className="text-xs text-gold-600">⚠️ {ing.cautions.join('; ')}</p>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 flex justify-center">
        <button onClick={handleCheck} disabled={selected.length === 0 || checking} className="btn-primary shadow-lg">
          {checking ? 'Checking...' : `Check Suitability (${selected.length} selected)`}
        </button>
      </div>

      {result && (
        <div className="card mt-6 space-y-4">
          <h3 className="font-medium text-ink">Suitability Results</h3>
          {result.results.map((r, i) => (
            <div key={i} className={`p-3 rounded-lg ${r.suitable === false ? 'bg-rose-50' : 'bg-sage-50'}`}>
              <div className="font-medium text-sm text-ink">{r.ingredient} — {r.suitable === false ? '⚠️ Caution' : '✓ Looks suitable'}</div>
              {r.warnings.length > 0 && (
                <ul className="text-xs text-ink-soft mt-1 list-disc list-inside">
                  {r.warnings.map((w, j) => <li key={j}>{w}</li>)}
                </ul>
              )}
            </div>
          ))}
          {result.interaction_warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-gold-50 text-gold-600 text-sm">
              <strong>Interaction warnings:</strong>
              <ul className="list-disc list-inside mt-1">
                {result.interaction_warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
