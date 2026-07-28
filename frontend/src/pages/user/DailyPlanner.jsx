import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { getToken } from '../../api/client'
import { Badge, Empty, ScoreDial, Skeletons } from '../../components/ui'

/* ============================================================================
   Milestone 2 — Daily Planner Dashboard & Checklist (spec Step 5.2)

   • useEffect -> GET /api/v1/routine and GET /api/v1/assessment/score
   • Skin Health Score card + weighted breakdown
   • Detected concerns, primary concern, personalised recommendations
   • Morning (AM) / Evening (PM) / Weekly / Seasonal cards
   • Live checkboxes -> POST /api/v1/routine/complete -> routine_logs
   • Compliance progress + completion percentage

   Uses only the existing Lumen design system — no new visual language.
   ========================================================================== */

const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } })

const PILLARS = [
  ['skin_condition', 'Skin condition'],
  ['lifestyle', 'Lifestyle'],
  ['consistency', 'Consistency'],
  ['sleep', 'Sleep'],
  ['hydration', 'Hydration'],
]

const PHASES = [
  ['AM', 'Morning plan'],
  ['PM', 'Evening plan'],
  ['Weekly', 'Weekly highlights'],
  ['Seasonal', 'Seasonal suggestions'],
]

const severityBadge = (s) =>
  s === 'high' ? 'cancelled' : s === 'medium' ? 'pending' : 'neutral'

export default function DailyPlanner() {
  const [plan, setPlan] = useState(null)
  const [score, setScore] = useState(null)
  const [error, setError] = useState('')
  const [busyStep, setBusyStep] = useState(null)
  const [regenerating, setRegenerating] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [r, s] = await Promise.allSettled([
        axios.get('/api/v1/routine', auth()),
        axios.get('/api/v1/assessment/score', auth()),
      ])
      setPlan(r.status === 'fulfilled' ? r.value.data : { AM: [], PM: [], Weekly: [], Seasonal: [] })
      setScore(s.status === 'fulfilled' ? s.value.data : null)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not load your plan.')
      setPlan({ AM: [], PM: [], Weekly: [], Seasonal: [] })
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* Tick / untick — writes straight to routine_logs, then reflects the result. */
  const toggle = async (stepId, completed) => {
    setBusyStep(stepId)
    setError('')
    try {
      const { data } = await axios.post('/api/v1/routine/complete',
        { routine_step_id: stepId, completed }, auth())
      setPlan(data)          // the server returns the whole updated plan
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save that. Please try again.')
    } finally {
      setBusyStep(null)
    }
  }

  const regenerate = async () => {
    setRegenerating(true)
    setError('')
    try {
      const { data } = await axios.post('/api/v1/routine/generate', {}, auth())
      setPlan(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not regenerate your routine.')
    } finally {
      setRegenerating(false)
    }
  }

  if (!plan) return <Skeletons n={4} />

  const hasRoutine = PHASES.some(([k]) => (plan[k] || []).length > 0)

  /* Nothing yet — send them to the wizard. */
  if (!hasRoutine && !score) {
    return (
      <div className="card" style={{ maxWidth: 620 }}>
        <h2 className="section-title">Your personalised plan</h2>
        <Empty>
          You have not completed a skin assessment yet. It takes about two minutes,
          and it is what builds your score and your routine.
        </Empty>
        <Link className="btn btn-primary" to="/app/assessment">Start my skin assessment</Link>
      </div>
    )
  }

  return (
    <div className="grid" style={{ gap: 18 }}>
      {error && <div className="alert error">{error}</div>}

      {/* ---------- Skin Health Score + breakdown ---------- */}
      {score && (
        <div className="grid cols-2">
          <div className="card">
            <h2 className="section-title">Skin Health Score</h2>
            <div className="dial-wrap">
              <ScoreDial value={Math.round(score.overall_score)} size={132} />
              <div className="dial-meta">
                <div className="dial-number">{score.overall_score}</div>
                <div className="dial-caption">
                  <Badge status={score.overall_score >= 70 ? 'confirmed' : 'pending'}>
                    {score.band}
                  </Badge>
                  {score.primary_concern && (
                    <div style={{ marginTop: 8 }}>
                      Priority concern: <strong>{score.primary_concern}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* weighted breakdown */}
            {score.breakdown && (
              <div style={{ marginTop: 18 }}>
                {PILLARS.map(([key, label]) => {
                  const p = score.breakdown[key]
                  if (!p) return null
                  return (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span>{label} <span className="stat-hint">({Math.round(p.weight * 100)}%)</span></span>
                        <strong>{p.score.toFixed(0)}</strong>
                      </div>
                      <div style={{ height: 5, borderRadius: 999, background: 'var(--border)', marginTop: 4 }}>
                        <div style={{
                          width: `${Math.min(p.score, 100)}%`, height: '100%', borderRadius: 999,
                          background: p.score >= 70
                            ? 'linear-gradient(90deg, var(--primary), var(--accent))'
                            : 'var(--warn)',
                          transition: 'width .5s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* concerns + recommendations */}
          <div className="card">
            <h2 className="section-title">What we detected</h2>
            {score.detected_concerns?.length ? (
              <div className="pill-row" style={{ marginBottom: 16 }}>
                {score.detected_concerns.map((c) => (
                  <Badge key={c.name} status={severityBadge(c.severity)}>
                    {c.name} · {c.severity}
                  </Badge>
                ))}
              </div>
            ) : (
              <Empty>No significant concerns detected.</Empty>
            )}

            {score.recommendations?.length > 0 && (
              <>
                <div className="stat-label" style={{ marginBottom: 8 }}>Recommendations</div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
                  {score.recommendations.map((r, i) => (
                    <li key={i} style={{ fontSize: 13.5, lineHeight: 1.6 }}>{r}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* ---------- compliance ---------- */}
      {hasRoutine && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <h2 className="section-title" style={{ marginBottom: 0, marginRight: 'auto' }}>
              Today&rsquo;s compliance
            </h2>
            <span className="stat-hint">
              {plan.completed_today} of {plan.total_daily_steps} steps
            </span>
            <strong>{plan.completion_percent}%</strong>
            <button className="btn btn-ghost btn-sm" onClick={regenerate} disabled={regenerating}>
              {regenerating ? 'Regenerating…' : 'Regenerate routine'}
            </button>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              width: `${plan.completion_percent}%`, height: '100%', borderRadius: 999,
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              transition: 'width .45s ease',
            }} />
          </div>
          <p className="stat-hint" style={{ marginTop: 8 }}>
            Ticking steps feeds your consistency score — which is 20% of your total.
          </p>
        </div>
      )}

      {/* ---------- AM / PM / Weekly / Seasonal ---------- */}
      <div className="grid cols-2">
        {PHASES.map(([key, label]) => {
          const steps = plan[key] || []
          return (
            <div className="card" key={key}>
              <h2 className="section-title">{label}</h2>
              {steps.length === 0 ? (
                <Empty>Nothing scheduled.</Empty>
              ) : (
                steps.map((s) => (
                  <label key={s.id} className="list-row" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={!!s.completed}
                        disabled={busyStep === s.id}
                        onChange={(e) => toggle(s.id, e.target.checked)}
                        style={{ marginTop: 3, width: 17, height: 17, accentColor: 'var(--primary)' }}
                      />
                      <div>
                        <div className="title" style={{
                          textDecoration: s.completed ? 'line-through' : 'none',
                          opacity: s.completed ? 0.6 : 1,
                        }}>
                          {s.step_number}. {s.step_category}
                        </div>
                        {s.instruction && <div className="sub">{s.instruction}</div>}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Link className="btn btn-ghost" to="/app/assessment">Retake assessment</Link>
      </div>
    </div>
  )
}
