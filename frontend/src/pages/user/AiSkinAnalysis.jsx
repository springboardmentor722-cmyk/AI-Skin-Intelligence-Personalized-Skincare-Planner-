import { useCallback, useRef, useState } from 'react'
import axios from 'axios'
import { getToken } from '../../api/client'
import { Icon } from '../../components/ui'

/* ============================================================================
   AI Skin Analysis — Milestone 3, Part 9 (premium layout pass)

   Presentation-only redesign. Same endpoint (/api/v1/ai/full-analysis), same
   data flow, same onResult() contract. Uses ONLY the existing Lumen design
   tokens (--primary plum, --accent gold, --surface cream, --ink, --border) —
   no new colours, fonts, or theme.

   Two-column layout: left = identity + intro + Analyze; right = upload card /
   live states / results. Everything renders inside the same card with no page
   layout shift.
   ========================================================================== */

const MAX_MB = 8
const ACCEPTED = 'image/jpeg,image/png,image/webp'

// Severity -> neutral Lumen tones (no bright colours)
const SEV_TONE = {
  high: 'var(--primary)',
  medium: 'var(--accent)',
  low: 'var(--ink-faint)',
}

function ProgressBar({ value, tone = 'var(--accent)' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div aria-hidden="true" style={{
      height: 6, borderRadius: 999, background: 'var(--accent-soft)', overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 999, background: tone,
        transition: 'width .6s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  )
}

export default function AiSkinAnalysis({ onResult }) {
  const fileRef = useRef(null)
  const [fileObj, setFileObj] = useState(null)
  const [preview, setPreview] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const acceptFile = useCallback((f) => {
    setError('')
    setResult(null)
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WEBP).')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_MB} MB.`)
      return
    }
    setFileObj(f)
    // Lazy: only create the object URL once a valid file is chosen.
    setPreview(URL.createObjectURL(f))
  }, [])

  const onInput = (e) => acceptFile(e.target.files?.[0])

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  const analyze = async () => {
    if (!fileObj) { setError('Choose a photo first.'); return }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', fileObj)
      const { data } = await axios.post('/api/v1/ai/full-analysis', fd, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      setResult(data)
      if (onResult) onResult(data)
    } catch (err) {
      const status = err?.response?.status
      let msg = err?.response?.data?.detail || 'Analysis failed. Please try again.'
      if (status === 422) msg = err?.response?.data?.detail ||
        'No face detected. Use a clear, front-facing, well-lit photo.'
      if (status === 413) msg = `Image is too large (max ${MAX_MB} MB).`
      if (status === 415) msg = 'Unsupported file type. Use JPG, PNG or WEBP.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview('')
    setFileObj(null)
    setResult(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const analyzeAgain = () => {
    setResult(null)
    setError('')
  }

  const openPicker = () => fileRef.current?.click()
  const onKeyPicker = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker() }
  }

  const labelStyle = { fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase',
    color: 'var(--ink-soft)', fontWeight: 600 }

  return (
    <section className="card" aria-labelledby="ai-analysis-title" style={{ marginTop: 18 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) 1fr',
        gap: 28, alignItems: 'start',
      }} className="ai-analysis-grid">

        {/* ---------------- LEFT COLUMN: identity + intro + action --------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span aria-hidden="true" style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--primary)', color: 'var(--surface-solid)',
            }}>
              <Icon name="scan" size={19} />
            </span>
            <h3 id="ai-analysis-title" className="section-title"
              style={{ marginBottom: 0, lineHeight: 1.15 }}>
              AI Skin Analysis
            </h3>
          </div>

          <p className="stat-hint" style={{ margin: 0, lineHeight: 1.6 }}>
            Upload a clear, front-facing photo. Our on-device vision model detects your
            skin type and visible concerns to complement your answers above.
          </p>

          <dl style={{ margin: 0, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <dt style={labelStyle}>Formats</dt>
              <dd style={{ margin: 0, fontSize: 13, color: 'var(--ink)' }}>JPG · PNG · WEBP</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <dt style={labelStyle}>Max size</dt>
              <dd style={{ margin: 0, fontSize: 13, color: 'var(--ink)' }}>{MAX_MB} MB</dd>
            </div>
          </dl>

          <p className="stat-hint" style={{
            margin: 0, fontSize: 11.5, lineHeight: 1.55, display: 'flex', gap: 6,
            alignItems: 'flex-start', color: 'var(--ink-faint)',
          }}>
            <Icon name="shield" size={13} style={{ marginTop: 1, flexShrink: 0 }} />
            Your photo is analysed privately for your assessment and never shared.
          </p>

          <button type="button" className="btn btn-primary" onClick={analyze}
            disabled={!fileObj || loading}
            style={{ marginTop: 2, width: '100%', justifyContent: 'center' }}>
            {loading ? 'Analyzing…' : result ? 'Re-analyze' : 'Analyze my skin'}
          </button>
        </div>

        {/* ---------------- RIGHT COLUMN: upload / states / results -------- */}
        <div style={{ minWidth: 0 }}>
          <input ref={fileRef} type="file" accept={ACCEPTED} onChange={onInput}
            style={{ display: 'none' }} id="ai-skin-file"
            aria-label="Upload a facial photo for skin analysis" />

          {error && (
            <div className="alert error" role="alert" style={{ marginBottom: 14 }}>{error}</div>
          )}

          {/* STATE: loading / processing */}
          {loading && (
            <div style={{
              maxWidth: 420, minHeight: 260, margin: '0 auto', borderRadius: 18,
              border: '1px solid var(--border)', background: 'var(--accent-soft)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center',
            }} role="status" aria-live="polite">
              <span className="ai-pulse" aria-hidden="true" style={{
                width: 54, height: 54, borderRadius: '50%', background: 'var(--primary)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--surface-solid)',
              }}>
                <Icon name="scan" size={26} />
              </span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)' }}>
                  Analyzing your skin…
                </div>
                <div className="stat-hint" style={{ marginTop: 4 }}>
                  Detecting skin type and concerns
                </div>
              </div>
              <div style={{ width: '70%' }}><ProgressBar value={70} /></div>
            </div>
          )}

          {/* STATE: empty (upload placeholder) */}
          {!loading && !preview && (
            <div
              role="button" tabIndex={0} onClick={openPicker} onKeyDown={onKeyPicker}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              aria-label="Upload area. Click or press Enter to choose a photo, or drag and drop."
              style={{
                maxWidth: 420, minHeight: 260, margin: '0 auto', borderRadius: 18,
                border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--hairline)'}`,
                background: dragOver ? 'var(--accent-soft)' : 'var(--surface)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 12, padding: 28, cursor: 'pointer',
                textAlign: 'center', transition: 'border-color .2s, background .2s',
              }}>
              <span aria-hidden="true" style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="scan" size={24} />
              </span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)' }}>
                  Drag &amp; drop, or click to upload
                </div>
                <div className="stat-hint" style={{ marginTop: 4 }}>
                  A clear, front-facing photo works best
                </div>
              </div>
              <div className="stat-hint" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                JPG · PNG · WEBP · max {MAX_MB} MB
              </div>
            </div>
          )}

          {/* STATE: preview (image chosen, before/after analysis) */}
          {!loading && preview && (
            <div style={{ maxWidth: 420, margin: '0 auto' }}>
              <div style={{
                position: 'relative', borderRadius: 18, overflow: 'hidden',
                border: '1px solid var(--border)', background: 'var(--bg-soft)',
                aspectRatio: '420 / 260',
              }}>
                <img src={preview} alt="Your uploaded photo for analysis" loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={removeImage} aria-label="Remove photo"
                  style={{
                    position: 'absolute', top: 10, right: 10, width: 30, height: 30,
                    borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'rgba(61,36,54,0.78)', color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <Icon name="x" size={15} />
                </button>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
              }}>
                <span className="stat-hint" style={{
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                }}>
                  {fileObj?.name}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={openPicker}>
                  Change
                </button>
              </div>
            </div>
          )}

          {/* STATE: complete (results) */}
          {!loading && result && (
            <div style={{ maxWidth: 420, margin: '18px auto 0', display: 'grid', gap: 14 }}>

              {/* Skin type card */}
              {result.detected_skin_type && (
                <div style={{
                  borderRadius: 16, border: '1px solid var(--border)',
                  background: 'var(--surface)', padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={labelStyle}>Skin type</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      {Math.round((result.skin_type_confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)',
                    margin: '2px 0 10px',
                  }}>
                    {result.detected_skin_type}
                  </div>
                  <ProgressBar value={(result.skin_type_confidence || 0) * 100}
                    tone="var(--primary)" />
                </div>
              )}

              {/* Concerns card */}
              {result.detected_concerns?.length > 0 && (
                <div style={{
                  borderRadius: 16, border: '1px solid var(--border)',
                  background: 'var(--surface)', padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: 10 }}>
                    <span style={labelStyle}>Concern detection</span>
                    {result.priority_concern && (
                      <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                        Priority: <strong style={{ color: 'var(--ink)' }}>{result.priority_concern}</strong>
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {result.detected_concerns.map((c) => (
                      <div key={c.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'baseline', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, color: 'var(--ink)' }}>{c.name}</span>
                          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'baseline' }}>
                            <span style={{ fontSize: 11, letterSpacing: '.05em',
                              textTransform: 'uppercase', color: SEV_TONE[c.severity] }}>
                              {c.severity}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                              {Math.round(c.confidence * 100)}%
                            </span>
                          </span>
                        </div>
                        <ProgressBar value={c.confidence * 100} tone={SEV_TONE[c.severity]} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <p className="stat-hint" style={{ margin: 0, lineHeight: 1.6 }}>
                  {result.explanation}
                </p>
              )}

              {!result.face_found && (
                <div className="alert" role="status">
                  No face was clearly detected — results may be less reliable.
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={analyzeAgain}>
                  Analyze again
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={removeImage}>
                  New photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
