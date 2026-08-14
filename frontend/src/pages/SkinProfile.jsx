import React, { useEffect, useState, useRef } from 'react'
import { profileApi } from '../api/endpoints'
import api from '../api/client'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'

const CONCERNS = ['acne', 'hyperpigmentation', 'dark_spots', 'dry_skin', 'oily_skin', 'sensitive_skin', 'wrinkles', 'fine_lines', 'redness', 'uneven_skin_tone']
const HABITS = ['smoking', 'high_stress', 'poor_diet', 'excessive_sun_exposure', 'low_water_intake']
const ENV = ['high_pollution', 'high_uv', 'dry_climate', 'high_humidity']

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function SkinProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    skin_type: 'normal',
    age_group: '20s',
    skin_concerns: [],
    allergies: '',
    sensitivities: '',
    lifestyle_habits: [],
    sleep_quality: 'average',
    sleep_hours: 7,
    water_intake_liters: 2,
    environmental_exposure: [],
    budget_range: 'medium',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    profileApi
      .getMine()
      .then((res) => {
        const p = res.data
        setForm({
          ...p,
          allergies: (p.allergies || []).join(', '),
          sensitivities: (p.sensitivities || []).join(', '),
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    const payload = {
      ...form,
      allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
      sensitivities: form.sensitivities.split(',').map((s) => s.trim()).filter(Boolean),
      sleep_hours: Number(form.sleep_hours),
      water_intake_liters: Number(form.water_intake_liters),
    }
    try {
      await profileApi.upsertMine(payload)
      setSaved(true)
      setTimeout(() => navigate('/dashboard'), 900)
    } finally {
      setSaving(false)
    }
  }

  const handleFile = async (file) => {
    if (!file) return
    setUploadError('')
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/photos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const photo = res.data
      
      const newConcerns = [...(form.skin_concerns || [])]
      let newSkinType = form.skin_type || 'normal'

      if (photo.redness_score > 60 && !newConcerns.includes('redness')) newConcerns.push('redness')
      if (photo.texture_score > 60 && !newConcerns.includes('fine_lines')) newConcerns.push('fine_lines')
      if (photo.evenness_score < 40 && !newConcerns.includes('uneven_skin_tone')) newConcerns.push('uneven_skin_tone')
      
      if (photo.oiliness_score > 70) newSkinType = 'oily'
      else if (photo.oiliness_score < 30) newSkinType = 'dry'

      setForm((prev) => ({ ...prev, skin_concerns: newConcerns, skin_type: newSkinType }))
      alert('Photo analyzed! We have updated your profile options with the findings. You can adjust them below before saving.')
    } catch (e) {
      setUploadError(e.response?.data?.detail || 'Upload failed. Try a JPG or PNG under 8MB.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-10 text-ink-faint">Loading profile...</div>

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Your Skin Profile</h1>
      <p className="text-ink-soft mb-8 text-sm">
        This information powers your AI skin assessment, routine generator, and product recommendations.
      </p>

      {uploadError && <div className="bg-rose-50 text-rose-600 text-sm rounded-lg px-4 py-2 mb-4">{uploadError}</div>}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragActive(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`card border-2 border-dashed text-center py-8 cursor-pointer transition-colors mb-8 ${
          dragActive ? 'border-teal-400 bg-teal-50' : 'border-stone-300 hover:border-teal-300'
        }`}
      >
        <input
          ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploading ? (
          <>
            <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-teal-300 border-t-teal-600 animate-spin" />
            <p className="text-sm text-ink-soft">Analyzing your photo...</p>
          </>
        ) : (
          <>
            <Upload size={26} className="mx-auto mb-3 text-teal-500" />
            <p className="font-medium text-ink mb-1">Upload a face photo for instant analysis</p>
            <p className="text-xs text-ink-faint">We'll automatically fill in your skin type and concerns based on AI visual signals.</p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Skin Type</label>
            <select className="input" value={form.skin_type} onChange={(e) => setForm({ ...form, skin_type: e.target.value })}>
              {['oily', 'dry', 'combination', 'normal', 'sensitive'].map((t) => (
                <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Age Group</label>
            <select className="input" value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })}>
              {['teen', '20s', '30s', '40s', '50+'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Skin Concerns</label>
          <div className="flex flex-wrap gap-2">
            {CONCERNS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setForm({ ...form, skin_concerns: toggle(form.skin_concerns, c) })}
                className={`badge border transition-colors ${
                  form.skin_concerns.includes(c) ? 'bg-brand-500 text-white border-brand-500' : 'border-stone-300 text-ink-soft'
                }`}
              >
                {c.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Allergies (comma separated)</label>
            <input className="input" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="e.g. fragrance, retinol" />
          </div>
          <div>
            <label className="label">Sensitivities (comma separated)</label>
            <input className="input" value={form.sensitivities} onChange={(e) => setForm({ ...form, sensitivities: e.target.value })} placeholder="e.g. sun, alcohol-based products" />
          </div>
        </div>

        <div>
          <label className="label">Lifestyle Habits</label>
          <div className="flex flex-wrap gap-2">
            {HABITS.map((h) => (
              <button
                type="button"
                key={h}
                onClick={() => setForm({ ...form, lifestyle_habits: toggle(form.lifestyle_habits, h) })}
                className={`badge border transition-colors ${
                  form.lifestyle_habits.includes(h) ? 'bg-sage-500 text-white border-sage-500' : 'border-stone-300 text-ink-soft'
                }`}
              >
                {h.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Environmental Exposure</label>
          <div className="flex flex-wrap gap-2">
            {ENV.map((h) => (
              <button
                type="button"
                key={h}
                onClick={() => setForm({ ...form, environmental_exposure: toggle(form.environmental_exposure, h) })}
                className={`badge border transition-colors ${
                  form.environmental_exposure.includes(h) ? 'bg-sage-500 text-white border-sage-500' : 'border-stone-300 text-ink-soft'
                }`}
              >
                {h.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Sleep Quality</label>
            <select className="input" value={form.sleep_quality} onChange={(e) => setForm({ ...form, sleep_quality: e.target.value })}>
              {['poor', 'average', 'good', 'excellent'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sleep Hours / night</label>
            <input className="input" type="number" step="0.5" min="0" max="14" value={form.sleep_hours} onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })} />
          </div>
          <div>
            <label className="label">Water Intake (L/day)</label>
            <input className="input" type="number" step="0.1" min="0" max="8" value={form.water_intake_liters} onChange={(e) => setForm({ ...form, water_intake_liters: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Budget Range for Products</label>
          <select className="input" value={form.budget_range} onChange={(e) => setForm({ ...form, budget_range: e.target.value })}>
            <option value="low">Low (budget-friendly)</option>
            <option value="medium">Medium</option>
            <option value="high">High (premium, no limit)</option>
          </select>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Skin Profile'}
        </button>
      </form>
    </div>
  )
}
