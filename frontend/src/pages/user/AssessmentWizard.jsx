import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { z } from 'zod'
import { getToken } from '../../api/client'
import { Empty, Icon } from '../../components/ui'
import AiSkinAnalysis from './AiSkinAnalysis'

/* ============================================================================
   Milestone 2 — Multi-Step Assessment Wizard (spec Step 5.1)

   • 4 steps with a progress bar
   • Zod validation per step; "Next" is gated behind it
   • localStorage autosave on every change, restored after a refresh
   • Axios POST to /api/v1/assessment/evaluate
   • Loading state ("Analyzing your skin profile…") + red error banner
   • Clears the draft and redirects to the dashboard on success

   Built entirely from the existing Lumen design system (.card, .btn, .input,
   .field, .slot) — no new visual language is introduced.
   ========================================================================== */

const DRAFT_KEY = 'lumen_assessment_draft'
const TOTAL_STEPS = 4

const CONCERNS = [
  'Acne', 'Hyperpigmentation', 'Dark Spots', 'Oiliness',
  'Dry Skin', 'Redness', 'Wrinkles', 'Fine Lines', 'Sensitive Skin',
]
const SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive', 'normal']
const SEVERITIES = ['low', 'medium', 'high']

/* One Zod schema per step, so "Next" can be blocked on invalid input. */
const stepSchemas = {
  1: z.object({
    age: z.coerce.number().int().min(1, 'Age must be at least 1').max(120, 'Age must be 120 or under'),
    gender: z.string().min(1, 'Please select a gender'),
    skin_type: z.enum(SKIN_TYPES, { message: 'Please select your skin type' }),
  }),
  2: z.object({
    selected: z.array(z.string()),        // empty is valid — "no concerns" is an answer
    sensitivities: z.string().optional(),
  }),
  3: z.object({
    sleep_hours: z.coerce.number().min(0, 'Cannot be negative').max(24, 'There are only 24 hours in a day'),
    water_intake_l: z.coerce.number().min(0, 'Cannot be negative').max(20, 'That is dangerously high'),
    stress_level: z.coerce.number().int().min(1, 'Must be between 1 and 10').max(10, 'Must be between 1 and 10'),
    exercise_minutes: z.coerce.number().int().min(0, 'Cannot be negative').max(1440, 'Cannot exceed a full day'),
    environment_exposure: z.enum(['low', 'moderate', 'high'], { message: 'Please select your exposure level' }),
  }),
  4: z.object({}),                        // review step — nothing new to validate
}

const EMPTY = {
  age: '', gender: '', skin_type: '',
  selected: [], severities: {}, sensitivities: '', allergies: '',
  sleep_hours: '', water_intake_l: '', stress_level: '',
  exercise_minutes: '', environment_exposure: '',
  uses_sunscreen: true, smokes: false,
}

const errStyle = { color: 'var(--danger)', fontSize: 12.5 }

export default function AssessmentWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [restored, setRestored] = useState(false)

  /* Restore the draft after a refresh */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const draft = JSON.parse(raw)
        setForm({ ...EMPTY, ...(draft.form || {}) })
        setStep(draft.step || 1)
        setRestored(true)
      }
    } catch { /* a corrupt draft isn't worth crashing over */ }
  }, [])

  /* Autosave on every change */
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }))
  }, [form, step])

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const toggleConcern = (name) => {
    setForm((f) => {
      const on = f.selected.includes(name)
      const selected = on ? f.selected.filter((c) => c !== name) : [...f.selected, name]
      const severities = { ...f.severities }
      if (on) delete severities[name]
      else severities[name] = severities[name] || 'medium'
      return { ...f, selected, severities }
    })
  }

  const setSeverity = (name, severity) =>
    setForm((f) => ({ ...f, severities: { ...f.severities, [name]: severity } }))

  // Fold AI-detected concerns into the questionnaire selections (Part 9).
  // Only maps concerns that exist as pills here; the user can still adjust.
  const applyAiConcerns = (analysis) => {
    const detected = analysis?.detected_concerns || []
    if (!detected.length && !analysis?.detected_skin_type) return
    setForm((f) => {
      const selected = [...f.selected]
      const severities = { ...f.severities }
      for (const c of detected) {
        if (CONCERNS.includes(c.name)) {
          if (!selected.includes(c.name)) selected.push(c.name)
          severities[c.name] = c.severity || severities[c.name] || 'medium'
        }
      }
      // If the AI detected a skin type and the user hasn't set one, adopt it.
      const skin_type = f.skin_type || (analysis.detected_skin_type || '').toLowerCase()
      return { ...f, selected, severities, skin_type }
    })
  }

  /* Gate "Next" behind this step's Zod schema */
  const validateStep = () => {
    const result = stepSchemas[step].safeParse(form)
    if (result.success) { setErrors({}); return true }
    const fieldErrors = {}
    for (const issue of result.error.issues) fieldErrors[issue.path[0]] = issue.message
    setErrors(fieldErrors)
    return false
  }

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, TOTAL_STEPS)) }
  const back = () => { setApiError(''); setStep((s) => Math.max(s - 1, 1)) }

  const submit = async () => {
    if (!validateStep()) return
    setApiError('')
    setSubmitting(true)
    try {
      const payload = {
        age: Number(form.age) || null,
        gender: form.gender || null,
        skin_type: form.skin_type || null,
        concerns: form.selected.join(', '),
        concern_severities: form.severities,
        sensitivities: form.sensitivities || null,
        allergies: form.allergies || null,
        sleep_hours: form.sleep_hours === '' ? null : Number(form.sleep_hours),
        water_intake_l: form.water_intake_l === '' ? null : Number(form.water_intake_l),
        exercise_minutes: form.exercise_minutes === '' ? null : Number(form.exercise_minutes),
        stress_level: form.stress_level === '' ? null : Number(form.stress_level),
        environment_exposure: form.environment_exposure || null,
        uses_sunscreen: !!form.uses_sunscreen,
        smokes: !!form.smokes,
        generate_routine: true,
      }
      await axios.post('/api/v1/assessment/evaluate', payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      localStorage.removeItem(DRAFT_KEY)     // clear the draft only on success
      navigate('/app', { replace: true })    // straight to the dashboard
    } catch (err) {
      setApiError(
        err?.response?.data?.detail ||
        err?.message ||
        'We could not reach the server. Please check your connection and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const pct = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step])

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      {/* progress bar */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="stat-label">Step {step} of {TOTAL_STEPS}</span>
          <span className="stat-label">{pct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 999,
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            transition: 'width .35s ease',
          }} />
        </div>
      </div>

      {restored && step > 1 && (
        <div className="alert ok" style={{ marginBottom: 16 }}>
          We restored your saved progress — pick up where you left off.
        </div>
      )}
      {apiError && <div className="alert error">{apiError}</div>}

      {/* ---------- STEP 1: about you ---------- */}
      {step === 1 && (
        <>
          <h2 className="section-title">About you</h2>
          <div className="grid cols-2" style={{ gap: 14 }}>
            <div className="field">
              <label htmlFor="age">Age</label>
              <input id="age" className="input" type="number" value={form.age}
                onChange={set('age')} placeholder="e.g. 27" />
              {errors.age && <span style={errStyle}>{errors.age}</span>}
            </div>
            <div className="field">
              <label htmlFor="gender">Gender</label>
              <select id="gender" className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
              {errors.gender && <span style={errStyle}>{errors.gender}</span>}
            </div>
          </div>
          <div className="field">
            <label htmlFor="skin_type">Skin type</label>
            <select id="skin_type" className="input" value={form.skin_type} onChange={set('skin_type')}>
              <option value="">Select…</option>
              {SKIN_TYPES.map((t) => (
                <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            {errors.skin_type && <span style={errStyle}>{errors.skin_type}</span>}
          </div>
        </>
      )}

      {/* ---------- STEP 2: concerns ---------- */}
      {step === 2 && (
        <>
          <h2 className="section-title">Your skin concerns</h2>
          <p className="stat-hint" style={{ marginBottom: 14 }}>
            Select everything that applies, then tell us how severe each one is.
            Severity drives both your score and your routine.
          </p>
          <div className="pill-row" style={{ marginBottom: 18 }}>
            {CONCERNS.map((c) => (
              <button key={c} type="button"
                className={`slot ${form.selected.includes(c) ? 'selected' : ''}`}
                onClick={() => toggleConcern(c)}>
                {c}
              </button>
            ))}
          </div>

          {form.selected.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              {form.selected.map((c) => (
                <div key={c} className="list-row">
                  <div className="title">{c}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {SEVERITIES.map((s) => (
                      <button key={s} type="button"
                        className={`btn btn-sm ${form.severities[c] === s ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setSeverity(c, s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No concerns selected — that is a valid answer, and a good sign.</Empty>
          )}

          <div className="field">
            <label htmlFor="sens">Known sensitivities (optional)</label>
            <textarea id="sens" className="input" value={form.sensitivities}
              onChange={set('sensitivities')}
              placeholder="e.g. reacts badly to acids, fragrance, retinoids…" />
            <span className="stat-hint">
              Anything listed here means we build your routine without harsh actives.
            </span>
          </div>

          <AiSkinAnalysis onResult={applyAiConcerns} />
        </>
      )}

      {/* ---------- STEP 3: lifestyle ---------- */}
      {step === 3 && (
        <>
          <h2 className="section-title">Lifestyle habits</h2>
          <div className="grid cols-2" style={{ gap: 14 }}>
            <div className="field">
              <label htmlFor="sleep">Sleep last night (hours)</label>
              <input id="sleep" className="input" type="number" step="0.5"
                value={form.sleep_hours} onChange={set('sleep_hours')} placeholder="8" />
              {errors.sleep_hours && <span style={errStyle}>{errors.sleep_hours}</span>}
            </div>
            <div className="field">
              <label htmlFor="water">Water intake (litres/day)</label>
              <input id="water" className="input" type="number" step="0.1"
                value={form.water_intake_l} onChange={set('water_intake_l')} placeholder="2.5" />
              {errors.water_intake_l && <span style={errStyle}>{errors.water_intake_l}</span>}
            </div>
            <div className="field">
              <label htmlFor="stress">Stress level (1–10)</label>
              <input id="stress" className="input" type="number"
                value={form.stress_level} onChange={set('stress_level')} placeholder="4" />
              {errors.stress_level && <span style={errStyle}>{errors.stress_level}</span>}
            </div>
            <div className="field">
              <label htmlFor="ex">Exercise (minutes/day)</label>
              <input id="ex" className="input" type="number"
                value={form.exercise_minutes} onChange={set('exercise_minutes')} placeholder="30" />
              {errors.exercise_minutes && <span style={errStyle}>{errors.exercise_minutes}</span>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="env">Sun & environmental exposure</label>
            <select id="env" className="input" value={form.environment_exposure}
              onChange={set('environment_exposure')}>
              <option value="">Select…</option>
              <option value="low">Low — mostly indoors</option>
              <option value="moderate">Moderate — some time outdoors</option>
              <option value="high">High — outdoors, or heavy pollution</option>
            </select>
            {errors.environment_exposure && <span style={errStyle}>{errors.environment_exposure}</span>}
          </div>

          <div style={{ display: 'flex', gap: 22, marginTop: 4 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={form.uses_sunscreen} onChange={set('uses_sunscreen')} />
              I wear sunscreen daily
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={form.smokes} onChange={set('smokes')} />
              I smoke
            </label>
          </div>
        </>
      )}

      {/* ---------- STEP 4: review ---------- */}
      {step === 4 && (
        <>
          <h2 className="section-title">Review your answers</h2>
          <div className="grid cols-2" style={{ gap: 12, marginBottom: 10 }}>
            {[
              ['Age', form.age],
              ['Gender', form.gender],
              ['Skin type', form.skin_type],
              ['Concerns', form.selected.length
                ? form.selected.map((c) => `${c} (${form.severities[c]})`).join(', ')
                : 'None'],
              ['Sensitivities', form.sensitivities || 'None'],
              ['Sleep', `${form.sleep_hours} h`],
              ['Water', `${form.water_intake_l} L`],
              ['Stress', `${form.stress_level}/10`],
              ['Exercise', `${form.exercise_minutes} min`],
              ['Exposure', form.environment_exposure],
              ['Daily SPF', form.uses_sunscreen ? 'Yes' : 'No'],
              ['Smokes', form.smokes ? 'Yes' : 'No'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="stat-label">{k}</div>
                <div style={{ marginTop: 4, fontSize: 14 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
          <p className="stat-hint">
            We will score your skin across five weighted pillars and build your
            morning, evening, weekly and seasonal routine.
          </p>
        </>
      )}

      {/* ---------- navigation ---------- */}
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        {step > 1 && (
          <button type="button" className="btn btn-ghost" onClick={back} disabled={submitting}>
            Back
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {step < TOTAL_STEPS ? (
            <button type="button" className="btn btn-primary" onClick={next}>
              Next <Icon name="plus" size={14} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? 'Analyzing your skin profile…' : 'Get my skin score'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
