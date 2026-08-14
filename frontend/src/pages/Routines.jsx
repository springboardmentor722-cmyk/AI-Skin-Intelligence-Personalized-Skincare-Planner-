import React, { useEffect, useState } from 'react'
import { routineApi } from '../api/endpoints'

const TYPES = [
  { key: 'morning', label: 'Morning', icon: '☀️' },
  { key: 'evening', label: 'Evening', icon: '🌙' },
  { key: 'weekly', label: 'Weekly Treatment', icon: '📅' },
  { key: 'seasonal', label: 'Seasonal', icon: '🍂' },
]

export default function Routines() {
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState('')
  const [season, setSeason] = useState('winter')
  const [error, setError] = useState('')

  const load = () => {
    routineApi.active().then((res) => setRoutines(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleGenerate = async (type) => {
    setGenerating(type)
    setError('')
    try {
      await routineApi.generate(type, type === 'seasonal' ? season : undefined)
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not generate routine. Create your skin profile first.')
    } finally {
      setGenerating('')
    }
  }

  const routineFor = (type) => routines.find((r) => r.routine_type === type)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Personalized Routine</h1>
      <p className="text-ink-soft mb-8 text-sm">Generate a step-by-step routine tailored to your skin profile.</p>

      {error && <div className="bg-rose-50 text-rose-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="flex flex-wrap gap-3 mb-8">
        {TYPES.map((t) => (
          <div key={t.key} className="flex items-center gap-2">
            <button onClick={() => handleGenerate(t.key)} disabled={generating === t.key} className="btn-secondary text-sm">
              {generating === t.key ? 'Generating...' : `${t.icon} Generate ${t.label}`}
            </button>
            {t.key === 'seasonal' && (
              <select className="input py-1.5 text-sm w-auto" value={season} onChange={(e) => setSeason(e.target.value)}>
                <option value="winter">Winter</option>
                <option value="summer">Summer</option>
                <option value="monsoon">Monsoon</option>
              </select>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-faint">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {TYPES.map((t) => {
            const r = routineFor(t.key)
            return (
              <div key={t.key} className="card">
                <h3 className="font-medium text-ink mb-4">{t.icon} {t.label} Routine</h3>
                {!r ? (
                  <p className="text-sm text-ink-faint">Not generated yet.</p>
                ) : (
                  <ol className="space-y-3">
                    {r.steps.map((step) => (
                      <li key={step.order} className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center shrink-0">
                          {step.order}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-ink">{step.category} <span className="text-ink-faint font-normal">· {step.product_category}</span></div>
                          <div className="text-sm text-ink-soft">{step.instruction}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
