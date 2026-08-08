import React, { useState, useEffect } from 'react';
import { TrendingUp, Camera, Activity, Calendar, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProgressTracking() {
  const [history, setHistory] = useState<any[]>([]);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const [scoreRes, screeningRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/scoring/history', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/api/v1/screening/history', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (scoreRes.ok) {
          const data = await scoreRes.json();
          const formatted = data.map((d: any, idx: number) => ({
            name: `Week ${idx + 1}`,
            score: d.overall_score,
            adherence: d.adherence,
            date: d.date
          }));
          setHistory(formatted);
        }
        
        if (screeningRes.ok) {
          const sData = await screeningRes.json();
          // Sort oldest first
          sData.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          setScreenings(sData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleDeleteScreening = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this photo?")) return;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/v1/screening/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Remove from local state
        setScreenings(prev => prev.filter(s => s.id !== id));
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to delete screening:", errorData);
        alert(`Failed to delete screening: ${errorData.detail || "Server Error"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001534]"></div>
      </div>
    );
  }

  const latestScore = history.length > 0 ? history[history.length - 1].score : 0;
  const firstScore = history.length > 0 ? history[0].score : 0;
  const improvement = latestScore - firstScore;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in font-serif space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#001534] tracking-tight">Progress Tracking</h1>
          <p className="text-slate-500 mt-2 font-sans">Monitor your skin's improvement and adherence over time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Improvement Analysis */}
        <div className="md:col-span-1 bg-[#fdfbf5] p-8 rounded-3xl border border-[#e5dfd1] shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#efe8de] rounded-xl flex items-center justify-center text-[#9f7c46]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#001534]">Improvement</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center text-center">
            <span className="text-6xl font-bold text-[#9f7c46] mb-4">{improvement > 0 ? '+' : ''}{improvement}</span>
            <p className="text-[#001534] font-medium">Points overall improvement since your first scan!</p>
          </div>
        </div>

        {/* Trend Analysis Graph */}
        <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-[#e5dfd1] shadow-sm">
          <h2 className="text-xl font-bold text-[#001534] mb-8 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#9f7c46]" /> Health Score Trend
          </h2>
          
          <div className="h-64 font-sans">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5dfd1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5dfd1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#001534', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="score" name="Overall Score" stroke="#9f7c46" strokeWidth={4} dot={{r: 6, fill: '#9f7c46', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-[#e5dfd1] rounded-2xl bg-slate-50">
                <span className="text-slate-400 font-medium">Take your first Skin Screening to see your trend!</span>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Before / After */}
        <div className="bg-[#fdfbf5] p-8 rounded-3xl border border-[#e5dfd1] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#001534] flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#9f7c46]" /> Before & After
            </h2>
            <button 
              onClick={() => window.location.href = '/dashboard/screening'}
              className="px-4 py-2 bg-[#9f7c46] hover:bg-[#8a6a3b] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              Upload After Photo
            </button>
          </div>
          <div className="flex gap-4 h-56">
            <div className="flex-1 rounded-2xl overflow-hidden relative border border-[#e5dfd1] bg-slate-100 group">
              {screenings.length > 0 && screenings[0].image_data ? (
                <>
                  <img src={screenings[0].image_data} alt="First Screening" className="absolute inset-0 w-full h-full object-cover" />
                  <button onClick={() => handleDeleteScreening(screenings[0].id)} className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur z-20 shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-sans text-sm p-4 text-center">First Screening Image</div>
              )}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-[#001534] text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm font-sans z-10 flex flex-col">
                <span>Before (Score: {firstScore})</span>
                {screenings.length > 0 && <span className="text-[10px] font-medium text-slate-500 mt-0.5">{new Date(screenings[0].created_at).toLocaleDateString()}</span>}
              </div>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden relative border border-[#e5dfd1] bg-slate-100 group">
              {screenings.length > 1 && screenings[screenings.length - 1].image_data ? (
                <>
                  <img src={screenings[screenings.length - 1].image_data} alt="Latest Screening" className="absolute inset-0 w-full h-full object-cover" />
                  <button onClick={() => handleDeleteScreening(screenings[screenings.length - 1].id)} className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur z-20 shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-sans text-sm p-4 text-center">Latest Screening Image</div>
              )}
              <div className="absolute bottom-3 left-3 bg-[#001534]/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm font-sans z-10 flex flex-col">
                <span>After (Score: {latestScore})</span>
                {screenings.length > 1 && <span className="text-[10px] font-medium text-slate-300 mt-0.5">{new Date(screenings[screenings.length - 1].created_at).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Routine Adherence */}
        <div className="bg-white p-8 rounded-3xl border border-[#e5dfd1] shadow-sm">
          <h2 className="text-xl font-bold text-[#001534] mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#9f7c46]" /> Routine Adherence Trend
          </h2>
          <div className="space-y-6 mt-4 font-sans">
            {history.length > 0 ? (
              history.map((point, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-500 w-16">{point.name}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#d1b17d] to-[#9f7c46] rounded-full transition-all duration-1000" 
                      style={{ width: `${point.adherence}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-[#001534] w-12 text-right">{point.adherence}%</span>
                </div>
              ))
            ) : (
              <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-[#e5dfd1] rounded-2xl bg-slate-50">
                <span className="text-slate-400 font-medium">No routine adherence data yet!</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
