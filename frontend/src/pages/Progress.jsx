import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { progressApi, scoringApi, reportApi } from '../api/endpoints'

export default function Progress() {
  const [logs, setLogs] = useState([])
  const [scores, setScores] = useState([])
  const [summary, setSummary] = useState(null)
  const [adherence, setAdherence] = useState(80)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    progressApi.history().then((res) => setLogs(res.data))
    scoringApi.history().then((res) => setScores(res.data))
    progressApi.summary().then((res) => setSummary(res.data))
  }

  useEffect(load, [])

  const handleLog = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await progressApi.log({ routine_adherence_percent: Number(adherence), mood_or_notes: notes })
      setNotes('')
      load()
    } finally {
      setSaving(false)
    }
  }

  const scoreChartData = scores.map((s, i) => ({ name: `#${i + 1}`, score: s.overall_score }))
  const adherenceChartData = logs.map((l, i) => ({
    name: new Date(l.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    adherence: l.routine_adherence_percent,
  }))

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Progress Tracking</h1>
      <p className="text-ink-soft mb-8 text-sm">Log your daily routine adherence and watch your skin health trend over time.</p>

      {summary && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-semibold text-brand-600">{summary.total_logs}</div>
            <div className="text-xs text-ink-faint">Logs recorded</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-semibold text-brand-600">{summary.average_routine_adherence}%</div>
            <div className="text-xs text-ink-faint">Avg adherence</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-semibold text-brand-600 capitalize">{summary.score_trend.replace('_', ' ')}</div>
            <div className="text-xs text-ink-faint">Score trend</div>
          </div>
          <div className="card text-center">
            <div className={`text-2xl font-semibold ${summary.score_improvement >= 0 ? 'text-sage-600' : 'text-rose-500'}`}>
              {summary.score_improvement > 0 ? '+' : ''}{summary.score_improvement}
            </div>
            <div className="text-xs text-ink-faint">Score change</div>
          </div>
        </div>
      )}

      <div className="card mb-8">
        <h3 className="font-medium text-ink mb-4">Skin Health Score Trend</h3>
        {scoreChartData.length === 0 ? (
          <p className="text-sm text-ink-faint">Compute your skin health score a few times to see a trend.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1ef" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#D65472" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card mb-8">
        <h3 className="font-medium text-ink mb-4">Routine Adherence Over Time</h3>
        {adherenceChartData.length === 0 ? (
          <p className="text-sm text-ink-faint">Log your daily adherence below to start tracking.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={adherenceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1ef" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="adherence" stroke="#1F6F5C" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <form onSubmit={handleLog} className="card">
        <h3 className="font-medium text-ink mb-4">Log Today's Routine</h3>
        <label className="label">Routine adherence: {adherence}%</label>
        <input type="range" min="0" max="100" value={adherence} onChange={(e) => setAdherence(e.target.value)} className="w-full mb-4 accent-brand-500" />
        <label className="label">Notes (optional)</label>
        <textarea className="input mb-4" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did your skin feel today?" />
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Log'}</button>
      </form>

      <div className="card mt-8">
        <h3 className="font-medium text-ink mb-3">Export Your Report</h3>
        <p className="text-sm text-ink-soft mb-4">Download a summary of your profile, assessment, score, and routines.</p>
        <div className="flex gap-3">
          <button onClick={() => reportApi.downloadPdf()} className="btn-outline text-sm">📄 Download PDF</button>
          <button onClick={() => reportApi.downloadExcel()} className="btn-outline text-sm">📊 Download Excel</button>
        </div>
      </div>
    </div>
  )
}
