import React, { useEffect, useState } from 'react';
import { Sparkles, Calendar, ShieldCheck, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SkinScreeningHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/skin-screening/history', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to fetch screening history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/dashboard/screening" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Screening
          </Link>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Skin Assessment History</h1>
          <p className="text-slate-600 text-sm mt-1">Review your past AI vision diagnostic logs and submitted clinical evaluations.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Loading diagnostic history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-serif font-bold text-slate-800">No Assessment Records Found</h3>
          <p className="text-slate-500 text-sm mt-1 mb-4">You haven't completed any AI skin screenings yet.</p>
          <Link
            to="/dashboard/screening"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition"
          >
            Start First Assessment
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item, index) => (
            <div key={item.id || index} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-bold text-slate-900">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Assessment Log'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Primary Concern: <span className="font-semibold text-slate-800">{item.primary_concern || 'General Evaluation'}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {item.status || 'Evaluated'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
