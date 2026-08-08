import { useState, useEffect, useCallback } from 'react';
import { User, KeyRound, CheckCircle, Leaf, Sparkles, Sun } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [scoreData, setScoreData] = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();

  // Daily Checklist state
  const [checklist, setChecklist] = useState({
    cleanser: true,
    serum: false,
    sunscreen: false,
  });

  const fetchScore = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/v1/scoring/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setScoreData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScore(false);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('http://localhost:8000/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile({ full_name: data.full_name || data.email.split('@')[0] });
          setUserId(data.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
    fetchScore();
  }, [fetchScore]);

  useWebSocket(userId, (msg) => {
    if (msg.type === 'SYNC_REQUIRED') {
      console.log('Syncing dashboard...');
      fetchScore();
    }
  });

  const toggleChecklist = (item: 'cleanser' | 'serum' | 'sunscreen') => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="max-w-6xl animate-fade-in font-serif">
      
      {/* Top Banner */}
      <div className="bg-[#fdfbf5] rounded-3xl p-6 mb-6 shadow-sm border border-[#e5dfd1] flex items-center gap-4">
        <div className="w-16 h-16 bg-[#efe8de] rounded-xl flex items-center justify-center flex-shrink-0">
          <Leaf className="w-8 h-8 text-[#9f7c46]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#001534] tracking-tight">
            Hi, {profile?.full_name || 'User'}!
          </h1>
          <p className="text-[#001534] mt-1 text-sm font-medium">Here is the latest update on your skincare journey.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Skin Health */}
        <div className="lg:col-span-2 bg-[#fdfbf5] rounded-3xl p-8 shadow-sm border border-[#e5dfd1] relative overflow-hidden flex flex-col justify-center min-h-[250px]">
          {/* Mock background image texture would go here */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[url('/dashboard-roller-flowers.png')] bg-cover bg-left opacity-90 pointer-events-none"></div>
          
          <div className="relative z-10 w-2/3">
            <h2 className="text-xl font-bold text-[#001534] mb-4">Overall Skin Health</h2>
            
            <div className="bg-[#c2e0c6] inline-block px-6 py-2 rounded-full mb-4">
              <span className="text-[#001534] font-bold text-xl tracking-wider">
                {loadingScore ? '...' : (scoreData ? scoreData.overall_score : '---')} / 100
              </span>
            </div>
            
            <p className="text-[#001534] font-bold max-w-xs mb-6 leading-tight">
              {scoreData ? scoreData.interpretation : 'Complete your skin screening to generate a score!'}
            </p>

            <div className="flex gap-4 text-[#9f7c46]">
              <Sparkles className="w-5 h-5" />
              <Leaf className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Daily Activity */}
        <div className="bg-[#fdfbf5] rounded-3xl p-8 shadow-sm border border-[#e5dfd1] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-xl text-[#001534] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#9f7c46]" />
              Daily Activity
            </h3>
            <User className="w-5 h-5 text-[#001534]" />
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-[#e5dfd1]">
              <span className="font-bold text-[#001534] text-sm">Routine Adherence</span>
              <span className="font-bold text-[#001534] text-sm">
                {scoreData ? `${scoreData.routine_adherence_score}%` : '--%'}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-[#e5dfd1]">
              <span className="font-bold text-[#001534] text-sm">Skin Logs This Week</span>
              <span className="font-bold text-[#001534] text-sm">
                {scoreData ? scoreData.logs_this_week : 0}
              </span>
            </div>
          </div>

          <button className="w-full bg-gradient-to-b from-[#b8955f] to-[#7a5c31] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition shadow-md">
            Log Routine Now
          </button>
        </div>

        {/* Current Morning Routine / Daily Checklist */}
        <div className="bg-[#fdfbf5] rounded-3xl p-8 shadow-sm border border-[#e5dfd1]">
          <h3 className="font-bold text-xl text-[#001534] mb-2">Daily Skincare Checklist</h3>
          <p className="text-sm text-[#001534] mb-6 font-medium">Tick off your personalized routine steps.</p>
          
          <div className="space-y-4">
            
            <button 
              onClick={() => toggleChecklist('cleanser')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition shadow-sm text-left ${checklist.cleanser ? 'bg-[#fdfbf5] border-2 border-[#9f7c46]' : 'bg-white border border-[#e5dfd1]'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${checklist.cleanser ? 'bg-white text-[#9f7c46] border border-[#9f7c46]' : 'bg-[#efe8de] text-[#001534]'}`}>1</div>
                <div>
                  <span className="block font-bold text-[#001534]">Gentle Cleanser</span>
                  <span className="text-xs text-[#001534]">Purifying</span>
                </div>
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center border ${checklist.cleanser ? 'border-[#d6c7b0]' : 'border-[#d6c7b0]'}`}>
                <CheckCircle className={`w-4 h-4 ${checklist.cleanser ? 'text-[#d6c7b0]' : 'text-transparent'}`} />
              </div>
            </button>

            <button 
              onClick={() => toggleChecklist('serum')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition shadow-sm text-left ${checklist.serum ? 'bg-[#fdfbf5] border-2 border-[#9f7c46]' : 'bg-white border border-[#e5dfd1]'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${checklist.serum ? 'border border-[#9f7c46] bg-white text-[#9f7c46]' : 'bg-[#efe8de] text-[#001534]'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>
                </div>
                <div>
                  <span className="block font-bold text-[#001534]">Laked Serum</span>
                  <span className="text-xs text-[#001534] block">Deep Hydration</span>
                </div>
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center border ${checklist.serum ? 'border-[#d6c7b0]' : 'border-[#d6c7b0]'}`}>
                <CheckCircle className={`w-4 h-4 ${checklist.serum ? 'text-[#d6c7b0]' : 'text-transparent'}`} />
              </div>
            </button>

            <button 
              onClick={() => toggleChecklist('sunscreen')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition shadow-sm text-left ${checklist.sunscreen ? 'bg-[#fdfbf5] border-2 border-[#9f7c46]' : 'bg-white border border-[#e5dfd1]'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${checklist.sunscreen ? 'bg-white text-[#9f7c46] border border-[#9f7c46]' : 'bg-[#efe8de] text-[#001534]'}`}>
                  <Sun className="w-6 h-6" />
                </div>
                <div>
                  <span className="block font-bold text-[#001534]">Sunscreen</span>
                  <span className="text-xs text-[#001534]">Protection</span>
                </div>
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center border ${checklist.sunscreen ? 'border-[#d6c7b0]' : 'border-[#d6c7b0]'}`}>
                <CheckCircle className={`w-4 h-4 ${checklist.sunscreen ? 'text-[#d6c7b0]' : 'text-transparent'}`} />
              </div>
            </button>

          </div>
        </div>

        {/* Right Bottom Image */}
        <div className="lg:col-span-2 bg-[#fdfbf5] rounded-3xl overflow-hidden shadow-sm border border-[#e5dfd1] h-full min-h-[350px] relative">
          <img src="/dashboard-skincare-flatlay.png" alt="Skincare flatlay" className="absolute inset-0 w-full h-full object-cover" />
        </div>

      </div>
    </div>
  );
}
