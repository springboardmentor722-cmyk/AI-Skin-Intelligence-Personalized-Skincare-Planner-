import React, { useEffect, useRef, useState } from 'react'
import { Upload, Camera, ShieldAlert, Trash2 } from 'lucide-react'
import api from '../api/client'

const SIGNAL_LABELS = {
  redness_score: { label: 'Redness', color: '#D65472' },
  texture_score: { label: 'Texture / roughness', color: '#C89B4A' },
  evenness_score: { label: 'Tone evenness', color: '#1F6F5C' },
  oiliness_score: { label: 'Oiliness / shine', color: '#4B9179' },
}

export default function PhotoAnalysis() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const load = () => {
    api.get('/photos/mine').then((res) => setPhotos(res.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleFile = async (file) => {
    if (!file) return
    setError('')
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post('/photos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Try a JPG or PNG under 8MB.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    await api.delete(`/photos/${id}`)
    load()
  }

  const latest = photos[0]

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Photo-Based Analysis</h1>
      <p className="text-ink-soft mb-6 text-sm">
        Computer-vision estimates of redness, texture, tone, and shine from your photo — blended into your next assessment.
      </p>

      <div className="card bg-gold-50 border-gold-300 mb-6 flex gap-3">
        <ShieldAlert size={18} className="text-gold-600 shrink-0 mt-0.5" />
        <p className="text-xs text-ink-soft leading-relaxed">
          These are visual signal estimates from image processing, <strong>not a medical diagnosis</strong>.
          For a clinical read, ask a verified dermatologist to review your profile through the platform.
          Photos are private to your account and visible only to you, consultants, dermatologists, and admins.
        </p>
      </div>

      {error && <div className="bg-rose-50 text-rose-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragActive(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`card border-2 border-dashed text-center py-12 cursor-pointer transition-colors mb-8 ${
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
            <p className="font-medium text-ink mb-1">Drop a photo here, or click to choose one</p>
            <p className="text-xs text-ink-faint">Well-lit, front-facing, face filling most of the frame. JPG/PNG/WEBP, up to 8MB.</p>
          </>
        )}
      </div>

      {loading ? (
        <p className="text-ink-faint">Loading...</p>
      ) : latest ? (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Camera size={16} className="text-teal-600" />
            <h3 className="font-medium text-ink">Latest analysis</h3>
            <span className="text-xs text-ink-faint ml-auto">{new Date(latest.uploaded_at).toLocaleString()}</span>
          </div>

          {!latest.face_detected ? (
            <p className="text-sm text-ink-soft">{latest.analysis_notes?.[0] || 'No face detected in this photo.'}</p>
          ) : (
            <>
              <div className="space-y-4 mb-5">
                {Object.entries(SIGNAL_LABELS).map(([key, meta]) => {
                  const val = latest[key]
                  if (val === null || val === undefined) return null
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-ink-soft">{meta.label}</span>
                        <span className="data-figure text-ink-faint">{Math.round(val)}/100</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${val}%`, backgroundColor: meta.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-stone-200 pt-4 space-y-1.5">
                {latest.analysis_notes.map((n, i) => (
                  <p key={i} className="text-xs text-ink-faint leading-relaxed">{n}</p>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {photos.length > 0 && (
        <div>
          <h3 className="font-medium text-ink mb-3 text-sm">Upload history</h3>
          <div className="space-y-2">
            {photos.map((p) => (
              <div key={p.id} className="card py-3 flex items-center justify-between">
                <div className="text-sm text-ink-soft">
                  {new Date(p.uploaded_at).toLocaleString()} — {p.face_detected ? 'face detected' : 'no face detected'}
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-ink-faint hover:text-rose-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
