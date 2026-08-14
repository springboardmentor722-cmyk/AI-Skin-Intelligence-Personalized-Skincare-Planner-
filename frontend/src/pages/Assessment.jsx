import React, { useEffect, useState } from 'react'
import { assessmentApi } from '../api/endpoints'

export default function Assessment() {
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const loadLatest = () => {
    assessmentApi
      .latest()
      .then((res) => setAssessment(res.data))
      .catch(() => setAssessment(null))
      .finally(() => setLoading(false))
  }

  useEffect(loadLatest, [])

  const handleRun = async () => {
    setRunning(true)
    setError('')
    try {
      const res = await assessmentApi.run()
      setAssessment(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not run assessment. Create your skin profile first.')
    } finally {
      setRunning(false)
    }
  }

  const severityColor = (score) => (score >= 60 ? 'bg-rose-400' : score >= 35 ? 'bg-gold-400' : 'bg-sage-400')

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-semibold text-ink">Skin Assessment</h1>
        <button onClick={handleRun} disabled={running} className="btn-primary">
          {running ? 'Analyzing...' : 'Run New Assessment'}
        </button>
      </div>
      <p className="text-ink-soft mb-8 text-sm">
        Identifies and prioritizes your skin concerns based on your profile, lifestyle, and environment.
      </p>

      {error && <div className="bg-rose-50 text-rose-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      {loading ? (
        <p className="text-ink-faint">Loading...</p>
      ) : !assessment ? (
        <div className="card text-center py-10 text-ink-soft">
          No assessment yet. Click "Run New Assessment" to analyze your skin profile.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <span className={`badge ${assessment.scoring_method === 'ml' ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-ink-soft'}`}>
              {assessment.scoring_method === 'ml' ? '🤖 Scored by trained XGBoost model' : 'Scored by rule engine'}
            </span>
          </div>
          <div className="card">
            <h3 className="font-medium text-ink mb-4">Concern Severity Scores</h3>
            <div className="space-y-3">
              {Object.entries(assessment.condition_scores).map(([concern, score]) => (
                <div key={concern}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-ink-soft">{concern.replace(/_/g, ' ')}</span>
                    <span className="text-ink-soft">{score}/100</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${severityColor(score)}`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200 flex justify-between items-center">
              <span className="text-ink-soft font-medium">Overall Condition Score</span>
              <span className="text-xl font-semibold text-brand-600">{assessment.overall_condition_score}/100</span>
            </div>
          </div>

          <div className="card">
            <h3 className="font-medium text-ink mb-3">Prioritized Concerns</h3>
            <ol className="list-decimal list-inside space-y-1 text-ink-soft text-sm">
              {assessment.prioritized_concerns.map((c) => (
                <li key={c} className="capitalize">{c.replace(/_/g, ' ')}</li>
              ))}
            </ol>
          </div>

          {assessment.risk_factors.length > 0 && (
            <div className="card bg-gold-50 border-gold-100">
              <h3 className="font-medium text-gold-600 mb-3">Risk Factors to Watch</h3>
              <ul className="space-y-1.5 text-sm text-gold-600">
                {assessment.risk_factors.map((rf, i) => (
                  <li key={i}>⚠️ {rf}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
