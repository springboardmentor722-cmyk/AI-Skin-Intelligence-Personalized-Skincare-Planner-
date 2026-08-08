import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Activity, FileWarning, ClipboardList, Search, ChevronRight, User, Camera, Pill, LineChart as ChartIcon,
  Calendar, FolderOpen, PieChart, Bell, Settings, LayoutDashboard, Clock, ImagePlus, ShieldAlert, FileText, CheckCircle, LogOut, MessageCircle, Share2, Leaf, Phone, ChevronDown, TestTube, Microscope, FileDigit, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfessionalOnboarding from '../components/ProfessionalOnboarding/ProfessionalOnboarding';
import ProfessionalAppointmentsView from '../components/consultant/ProfessionalAppointmentsView';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PatientQueue {
  id: string;
  user_id: string;
  patient_name: string;
  status: string;
  risk_level: string;
  created_at: string;
  primary_concern?: string;
  secondary_concern?: string;
}

interface PatientDetails {
  profile: any;
  screening: any;
  history: any[];
  routine: any;
}

export default function DermatologistDashboard() {
  const navigate = useNavigate();
  const [activeSidebar, setActiveSidebar] = useState('overview');
  const [activeTab, setActiveTab] = useState('insights');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [patients, setPatients] = useState<PatientQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientQueue | null>(null);
  
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [recordsSelectedPatient, setRecordsSelectedPatient] = useState<PatientQueue | null>(null);
  const [recordsPatientDetails, setRecordsPatientDetails] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/auth/me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            setCurrentUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const FALLBACK_PATIENTS: PatientQueue[] = [
    { id: 'bc132dbf-c7cd-493a-8b3c-77f4a067c139', user_id: 'bc132dbf-c7cd-493a-8b3c-77f4a067c139', patient_name: 'lalli', status: 'SUBMITTED', risk_level: 'Standard Priority', primary_concern: 'Fine Lines' },
    { id: 'c4bbf99b-ae29-4172-840a-bf84c3523464', user_id: 'c4bbf99b-ae29-4172-840a-bf84c3523464', patient_name: 'likhith', status: 'SUBMITTED', risk_level: 'Standard Priority', primary_concern: 'Acne & Breakouts' },
    { id: 'f39db07a-cbdf-478b-867c-01686edc0c74', user_id: 'f39db07a-cbdf-478b-867c-01686edc0c74', patient_name: 'sindhu', status: 'SUBMITTED', risk_level: 'Standard Priority', primary_concern: 'Moderate Redness' },
    { id: 'f1eb41d1-93d0-4b53-a7a6-c6154927c785', user_id: 'f1eb41d1-93d0-4b53-a7a6-c6154927c785', patient_name: 'vallika', status: 'SUBMITTED', risk_level: 'Standard Priority', primary_concern: 'Moderate Redness' },
    { id: 'fd16b4df-8604-49f2-a2e3-f7547c25730a', user_id: 'fd16b4df-8604-49f2-a2e3-f7547c25730a', patient_name: 'likanya', status: 'SUBMITTED', risk_level: 'Standard Priority', primary_concern: 'Moderate Redness' }
  ];

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/clinical-workflow/queue/dermatologist', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        });
        if (res.ok) {
            const data = await res.json();
            const list = (data && data.length > 0) ? data : FALLBACK_PATIENTS;
            setPatients(list);
            setSelectedPatient(list[0]);
            setRecordsSelectedPatient(list[0]);
        } else {
            setPatients(FALLBACK_PATIENTS);
            setSelectedPatient(FALLBACK_PATIENTS[0]);
            setRecordsSelectedPatient(FALLBACK_PATIENTS[0]);
        }
      } catch (err) {
        console.error("Failed to fetch queue", err);
        setPatients(FALLBACK_PATIENTS);
        setSelectedPatient(FALLBACK_PATIENTS[0]);
        setRecordsSelectedPatient(FALLBACK_PATIENTS[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      const fetchDetails = async () => {
        setLoadingDetails(true);
        try {
          const res = await fetch(`http://localhost:8000/api/v1/clinical-workflow/patient-details/${selectedPatient.id}`, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                  'Content-Type': 'application/json'
              }
          });
          if (res.ok) {
              const data = await res.json();
              setPatientDetails(data);
          }
        } catch (err) {
          console.error("Failed to fetch details", err);
        } finally {
          setLoadingDetails(false);
        }
      };
      fetchDetails();
    }
  }, [selectedPatient]);

  useEffect(() => {
    const targetPatient = recordsSelectedPatient || selectedPatient || (patients.length > 0 ? patients[0] : null);
    if (targetPatient) {
      const fetchRecordDetails = async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/v1/clinical-workflow/patient-details/${targetPatient.id}`, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                  'Content-Type': 'application/json'
              }
          });
          if (res.ok) {
              const data = await res.json();
              setRecordsPatientDetails(data);
          }
        } catch (err) {
          console.error("Failed to fetch record details", err);
        }
      };
      fetchRecordDetails();
    }
  }, [recordsSelectedPatient, selectedPatient, patients]);

  const [stats, setStats] = useState({
    total_patients: 0,
    critical_cases: 0,
    active_treatments: 0,
    monthly_recovery: '+0%'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/clinical-workflow/stats/dermatologist', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

  const totalPatients = stats.total_patients || patients.length;
  const criticalFlags = stats.critical_cases;
  const activeTreatmentsCount = stats.active_treatments;
  const avgImprovement = stats.monthly_recovery; 

  const SidebarItem = ({ id, icon: Icon, label, alert }: any) => (
    <button 
      onClick={() => setActiveSidebar(id)}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition font-bold text-sm mb-1 ${
        activeSidebar === id 
        ? 'bg-[#0a1128] text-[#dcb974] shadow-md border border-[#cda35d]/30 relative overflow-hidden' 
        : 'text-[#1a1a1a] hover:bg-white/50'
      }`}
    >
      <div className="flex items-center gap-3 relative z-10">
        <Icon className={`w-5 h-5 ${activeSidebar === id ? 'text-[#dcb974]' : 'text-[#595959]'}`} />
        {label}
      </div>
      <div className="flex items-center gap-2 relative z-10">
        {alert && <span className="bg-[#faeaea] text-[#9c3f3f] text-[10px] px-1.5 py-0.5 rounded-full border border-[#e6b3b3]">{alert}</span>}
        {activeSidebar === id && <Leaf className="w-4 h-4 text-[#dcb974] opacity-80" />}
      </div>
      {activeSidebar === id && <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>}
    </button>
  );

  return (
    <>
      {showOnboarding && (
        <ProfessionalOnboarding 
          role="Dermatologist" 
          onComplete={() => setShowOnboarding(false)} 
        />
      )}
      <div className="min-h-screen font-sans relative flex flex-col bg-[url('/bg_marble_circuit.png')] bg-cover bg-center bg-no-repeat bg-fixed">
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Glassmorphic */}
          <aside className="w-64 bg-white/40 backdrop-blur-md border-r border-[#d4cdbd]/50 h-screen sticky top-0 flex flex-col z-20 shadow-[4px_0_20px_-10px_rgba(0,0,0,0.1)]">
            <div className="p-6 border-b border-[#d4cdbd]/50 flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-[#9f7c46]" />
              <div>
                <h2 className="font-serif font-bold text-[#1a1a1a] leading-tight">Dermo<br/>Portal</h2>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
              <SidebarItem id="overview" icon={LayoutDashboard} label="Overview" />
              <SidebarItem id="appointments" icon={Calendar} label="Appointments" />
              <SidebarItem id="records" icon={FolderOpen} label="Medical Records" />
              <SidebarItem id="analytics" icon={PieChart} label="Analytics" />

              
              <div className="pt-4 mt-4 border-t border-[#d4cdbd]/50">
                <button 
                  onClick={() => {
                    localStorage.removeItem('access_token');
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition font-bold text-sm text-[#1a1a1a] hover:bg-white/50"
                >
                  <LogOut className="w-5 h-5 text-[#595959]" />
                  Logout
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-[#d4cdbd]/50">
              <div className="flex items-center gap-3 p-2 bg-white/40 backdrop-blur-sm rounded-xl border border-[#d4cdbd]/50">
                <div className="w-10 h-10 bg-[#e6f2f3]/80 rounded-lg border border-[#b5dcd6] flex items-center justify-center text-[#087f8c] font-bold uppercase">
                  {currentUser?.full_name ? currentUser.full_name.substring(0, 2) : 'DR'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#1a1a1a] truncate">{currentUser?.full_name || 'Dr. Specialist'}</p>
                  <p className="text-xs text-[#595959] truncate">{currentUser?.roles?.[0]?.name || 'Dermatology'}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 p-8 h-screen overflow-y-auto relative z-10 flex flex-col">
            
            {activeSidebar === 'appointments' && (
              <ProfessionalAppointmentsView />
            )}
            
            {/* OVERVIEW TAB */}
            {activeSidebar === 'overview' && (
              <div className="animate-fade-in relative z-10 w-full max-w-[1400px] mx-auto flex-1 flex flex-col">
                <div className="mb-6">
                  <h1 className="text-4xl font-serif font-bold text-[#0a1128]">Dashboard Overview</h1>
                  <p className="text-[#1a1a1a] mt-1 font-medium">Manage active treatments and review critical AI diagnoses.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {[
                    { label: 'Total Patients', value: totalPatients.toString(), icon: User, color: 'text-[#087f8c]', bg: 'bg-[#e6f2f3]' },
                    { label: 'Critical Cases', value: criticalFlags.toString(), icon: ShieldAlert, color: 'text-[#9c3f3f]', bg: 'bg-[#faeaea]' },
                    { label: 'Active Treatments', value: activeTreatmentsCount.toString(), icon: ClipboardList, color: 'text-[#7c6f5a]', bg: 'bg-[#f4f2ef]' },
                    { label: 'Monthly Recovery', value: avgImprovement, icon: Activity, color: 'text-[#9f7c46]', bg: 'bg-[#fcf9f2]' },
                  ].map((stat, i) => (
                    <div key={i} className={`bg-white/40 backdrop-blur-md p-5 rounded-xl border-2 border-[#dcb974]/60 shadow-lg flex items-center gap-4 transition hover:-translate-y-1 relative overflow-hidden`}>
                       <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} border border-[#d4cdbd]/50 relative z-10`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-bold text-[#0a1128]">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex gap-8">
                  <div className="w-[380px] bg-white/40 backdrop-blur-md rounded-2xl border-2 border-[#dcb974]/60 shadow-xl flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                    <div className="p-6 border-b border-[#d4cdbd]/50 flex items-center justify-between relative z-10">
                      <h2 className="text-xl font-bold text-[#0a1128]">Patient Roster</h2>
                      <div className="relative">
                        <input type="text" placeholder="Search..." className="pl-8 pr-4 py-2 bg-white/50 border border-[#cda35d] rounded-lg text-sm w-36 focus:ring-2 focus:ring-[#cda35d] outline-none text-[#1a1a1a] placeholder-[#595959] font-medium" />
                        <Search className="absolute left-2.5 top-2.5 text-[#595959] w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-hide relative z-10">
                      {loading ? (
                          <div className="p-8 text-center text-[#1a1a1a] font-medium">Loading queue...</div>
                      ) : patients.length === 0 ? (
                          <div className="p-12 text-center text-[#1a1a1a] font-medium">Queue is empty.</div>
                      ) : (
                        patients.map((p) => (
                          <div 
                            key={p.id} 
                            onClick={() => setSelectedPatient(p)}
                            className={`p-4 mb-3 rounded-xl cursor-pointer transition flex flex-col items-start group border-2 ${selectedPatient?.id === p.id ? 'bg-white/60 border-[#dcb974] shadow-md' : 'bg-white/30 border-transparent hover:border-[#cda35d]/50 hover:bg-white/50'}`}
                          >
                            <div className="flex justify-between w-full items-start">
                              <div>
                                <h3 className="font-bold text-[#0a1128] text-lg">{p.patient_name}</h3>
                                <p className="text-sm text-[#1a1a1a] font-medium mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {p.status}</p>
                              </div>
                              <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md border ${p.risk_level.includes('High') || p.risk_level.includes('Severe') ? 'bg-[#faeaea] text-[#9c3f3f] border-[#e6b3b3]' : p.risk_level.includes('Medium') ? 'bg-[#fcf9f2] text-[#9f7c46] border-[#e5dfd1]' : 'bg-[#e6f2f3] text-[#087f8c] border-[#b5dcd6]'}`}>
                                {p.risk_level}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex gap-8">
                    {selectedPatient ? (
                      <div className="flex-1 bg-white/40 backdrop-blur-md rounded-2xl border-2 border-[#dcb974]/60 shadow-xl p-8 flex flex-col relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-bl from-white/30 to-transparent pointer-events-none"></div>
                        
                        {loadingDetails || !patientDetails ? (
                          <div className="flex-1 flex items-center justify-center relative z-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a1128]"></div>
                          </div>
                        ) : (
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[#d4cdbd]/50">
                            <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center text-[#0a1128] shadow-sm border border-[#cda35d]/50">
                              <User className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                              <h2 className="text-3xl font-bold font-serif text-[#0a1128]">{selectedPatient.patient_name}</h2>
                              <div className="flex gap-4 mt-2 text-sm font-medium text-[#1a1a1a]">
                                <span>ID: {selectedPatient.id.substring(0,8).toUpperCase()}</span>
                                <span>•</span>
                                <span>{patientDetails.profile?.age || '--'} years old</span>
                                <span>•</span>
                                <span>Skin Type: {patientDetails.profile?.skin_type || 'Unknown'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-1">Current Score</div>
                              <div className="text-4xl font-bold text-[#dcb974]">{patientDetails.screening?.score || '--'}</div>
                            </div>
                          </div>

                          <div className="flex gap-4 mb-6 border-b border-[#d4cdbd]/50 pb-4">
                            {[
                              { id: 'insights', label: 'Patient Insights', icon: Activity },
                              { id: 'condition', label: 'Condition Details', icon: Camera },
                              { id: 'treatment', label: 'Treatment & Rx', icon: Pill },
                              { id: 'progress', label: 'Progress Analytics', icon: ChartIcon }
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition ${activeTab === tab.id ? 'bg-[#0a1128] text-[#dcb974] shadow-md border border-[#cda35d]/30' : 'text-[#1a1a1a] hover:bg-white/50 border border-transparent'}`}
                              >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 space-y-6">
                            {/* TAB 1: INSIGHTS */}
                            {activeTab === 'insights' && (
                              <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white/50 p-6 rounded-xl border border-[#d4cdbd]/50 shadow-sm">
                                  <h3 className="font-bold text-[#0a1128] mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#cda35d]"/> Medical Profile</h3>
                                  <div className="space-y-4 text-sm">
                                    <div><span className="text-[#595959] font-medium block">Known Allergies</span><p className="font-bold text-[#1a1a1a]">{patientDetails.profile?.allergies || 'None reported'}</p></div>
                                    <div><span className="text-[#595959] font-medium block">Sensitivities</span><p className="font-bold text-[#1a1a1a]">{patientDetails.profile?.sensitivities || 'None reported'}</p></div>
                                    <div><span className="text-[#595959] font-medium block">Current Medications</span><p className="font-bold text-[#1a1a1a]">{patientDetails.profile?.current_medications || 'None'}</p></div>
                                    <div><span className="text-[#595959] font-medium block">Pregnancy Status</span><p className="font-bold text-[#1a1a1a]">{patientDetails.profile?.pregnancy_status || 'N/A'}</p></div>
                                  </div>
                                </div>
                                <div className="bg-white/50 p-6 rounded-xl border border-[#d4cdbd]/50 shadow-sm">
                                  <h3 className="font-bold text-[#0a1128] mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-[#cda35d]"/> Lifestyle Factors</h3>
                                  <div className="space-y-4 text-sm">
                                    <div><span className="text-[#595959] font-medium block">Stress Levels</span><p className="font-bold text-[#1a1a1a]">{patientDetails.profile?.stress_levels || 'Medium'}</p></div>
                                    <div><span className="text-[#595959] font-medium block">Sleep Quality</span><p className="font-bold text-[#1a1a1a]">{patientDetails.profile?.sleep_quality || 'Good'}</p></div>
                                    <div><span className="text-[#595959] font-medium block">Water Intake</span><p className="font-bold text-[#1a1a1a]">{patientDetails.profile?.water_intake || '2.0 L/day'}</p></div>
                                    <div><span className="text-[#595959] font-medium block">Diet</span><p className="font-bold text-[#1a1a1a]">{patientDetails.profile?.diet || 'Balanced'}</p></div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: CONDITION DETAILS (WITH IMAGE & DETECTED CONCERNS) */}
                            {activeTab === 'condition' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Assessment Image Container */}
                                <div className="bg-white/50 p-6 rounded-xl border border-[#d4cdbd]/50 shadow-sm flex flex-col items-start justify-between">
                                  <div className="flex items-center justify-between w-full mb-4">
                                    <h3 className="font-bold text-[#0a1128] flex items-center gap-2">
                                      <Camera className="w-5 h-5 text-[#cda35d]" /> Assessment Image
                                    </h3>
                                    <span className="bg-[#e6f2f3] text-[#087f8c] border border-[#b5dcd6] text-xs font-bold px-2.5 py-1 rounded-full">
                                      Verified Scan
                                    </span>
                                  </div>

                                  {patientDetails.screening?.image_url ? (
                                    <div className="w-full relative rounded-xl overflow-hidden border-2 border-[#dcb974]/60 shadow-md">
                                      <img 
                                        src={patientDetails.screening.image_url} 
                                        alt="Patient Skin Scan" 
                                        className="w-full h-64 object-cover"
                                      />
                                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-md backdrop-blur-sm">
                                        Scan ID: #{selectedPatient.id.substring(0, 6)}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-64 bg-[#f9f8f4] border-2 border-dashed border-[#d4cdbd] rounded-xl flex flex-col items-center justify-center text-slate-500 text-sm p-4 text-center">
                                      <Camera className="w-10 h-10 text-[#cda35d] mb-2 opacity-60" />
                                      <p className="font-bold text-[#0a1128]">No Photo Uploaded</p>
                                      <p className="text-xs text-slate-400 mt-1">Patient completed questionnaire assessment without image attachment</p>
                                    </div>
                                  )}

                                  <div className="w-full mt-4 p-3 bg-[#fdfbf5] rounded-xl border border-[#e5dfd1] text-xs text-slate-600 flex items-center justify-between">
                                    <span>Screening Date: {patientDetails.screening?.date || 'Recent Session'}</span>
                                    <span className="font-bold text-[#0a1128]">Score: {patientDetails.screening?.score || 78}/100</span>
                                  </div>
                                </div>

                                {/* Detected Concerns & Diagnostic Analysis */}
                                <div className="bg-white/50 p-6 rounded-xl border border-[#d4cdbd]/50 shadow-sm space-y-5">
                                  <h3 className="font-bold text-[#0a1128] flex items-center gap-2">
                                    <FileWarning className="w-5 h-5 text-[#cda35d]" /> Detected Concerns
                                  </h3>

                                  <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                      AI Identified Skin Conditions
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                      {(patientDetails.screening?.detected_concerns || [patientDetails.screening?.primary_concern || "Acne", "Oily T-Zone"]).map((c: string) => (
                                        <span key={c} className="bg-[#0a1128] text-[#dcb974] border border-[#cda35d]/40 font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
                                          {c}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-3 pt-2 text-sm">
                                    <div className="p-3 bg-[#faeaea] border border-[#e6b3b3] rounded-xl text-[#9c3f3f]">
                                      <strong className="block text-xs uppercase tracking-wider font-bold mb-0.5">Primary Target Concern</strong>
                                      <p className="font-bold text-base">{patientDetails.screening?.primary_concern || 'Acne & Breakouts'}</p>
                                    </div>

                                    <div className="p-3 bg-[#fdfbf5] border border-[#e5dfd1] rounded-xl text-slate-700">
                                      <strong className="block text-xs uppercase tracking-wider font-bold mb-0.5 text-slate-500">Secondary Concern</strong>
                                      <p className="font-semibold text-sm">{patientDetails.screening?.secondary_concern || 'Uneven Skin Texture'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 3: TREATMENT & RX */}
                            {activeTab === 'treatment' && (
                              <div className="space-y-6">
                                <div className="bg-white/50 p-6 rounded-xl border border-[#d4cdbd]/50 shadow-sm">
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-[#0a1128] flex items-center gap-2">
                                      <Pill className="w-5 h-5 text-[#cda35d]" /> Recommended Treatment Routine
                                    </h3>
                                    <button className="bg-[#0a1128] text-[#dcb974] font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#1a2d4c] transition shadow-sm">
                                      Approve Treatment Rx
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/70 rounded-xl border border-[#d4cdbd]/50 space-y-2">
                                      <span className="text-xs font-bold uppercase text-[#087f8c] tracking-wider block">☀️ Morning Steps</span>
                                      <p className="text-xs font-bold text-[#0a1128]">1. Gentle Salicylic Acid Cleanser</p>
                                      <p className="text-xs font-bold text-[#0a1128]">2. Niacinamide 10% Serum</p>
                                      <p className="text-xs font-bold text-[#0a1128]">3. Lightweight Gel Moisturizer + SPF 50</p>
                                    </div>
                                    <div className="p-4 bg-white/70 rounded-xl border border-[#d4cdbd]/50 space-y-2">
                                      <span className="text-xs font-bold uppercase text-[#9f7c46] tracking-wider block">🌙 Evening Steps</span>
                                      <p className="text-xs font-bold text-[#0a1128]">1. Hydrating Cream Cleanser</p>
                                      <p className="text-xs font-bold text-[#0a1128]">2. Adapalene 0.1% Retinoid Treatment</p>
                                      <p className="text-xs font-bold text-[#0a1128]">3. Barrier Repair Ceramide Night Cream</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 4: PROGRESS ANALYTICS */}
                            {activeTab === 'progress' && (
                              <div className="bg-white/50 p-6 rounded-xl border border-[#d4cdbd]/50 shadow-sm space-y-4">
                                <h3 className="font-bold text-[#0a1128] flex items-center gap-2">
                                  <ChartIcon className="w-5 h-5 text-[#cda35d]" /> Skin Health Progress Tracking
                                </h3>

                                <div className="h-56 w-full pt-4">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={patientDetails.history?.length > 0 ? patientDetails.history : [
                                      { name: 'Week 1', score: 62, adherence: 70 },
                                      { name: 'Week 2', score: 68, adherence: 82 },
                                      { name: 'Week 3', score: 74, adherence: 90 },
                                      { name: 'Week 4', score: patientDetails.screening?.score || 78, adherence: 95 },
                                    ]}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e5dfd1" />
                                      <XAxis dataKey="name" stroke="#595959" />
                                      <YAxis domain={[0, 100]} stroke="#595959" />
                                      <Tooltip />
                                      <Line type="monotone" dataKey="score" stroke="#cda35d" strokeWidth={3} name="Skin Score" />
                                      <Line type="monotone" dataKey="adherence" stroke="#087f8c" strokeWidth={2} name="Routine Compliance %" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 flex flex-col gap-6">
                            
                            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl border-2 border-[#dcb974]/60 shadow-lg relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-lg text-[#0a1128] flex items-center gap-2">
                                            <FileWarning className="w-5 h-5 text-[#cda35d]"/> Detected Concerns
                                        </h3>
                                        <div className="text-2xl">⭐</div>
                                    </div>
                                    <p className="text-[#1a1a1a] text-sm font-medium leading-relaxed">
                                        - Run a scan to see your detected skin concerns here.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl border-2 border-[#dcb974]/60 shadow-lg relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg text-[#0a1128] mb-4">Active Treatment Overview</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-3 bg-white/50 rounded-xl border border-[#d4cdbd]/50">
                                            <div className="w-10 h-10 bg-[#e6f2f3]/80 border border-[#b5dcd6] rounded-lg flex items-center justify-center text-[#087f8c]">
                                                <Pill className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#0a1128] text-sm">Treatment 1: Gentle Cleanser</h4>
                                                <p className="text-xs text-[#1a1a1a] font-medium mt-1">Purifying<br/>Deep hydration</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-4 p-3 bg-white/50 rounded-xl border border-[#d4cdbd]/50">
                                            <div className="w-10 h-10 bg-[#f4f2ef]/80 border border-[#d4cdbd] rounded-lg flex items-center justify-center text-[#7c6f5a]">
                                                <Pill className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#0a1128] text-sm">Treatment 2: Laked Serum</h4>
                                                <p className="text-xs text-[#1a1a1a] font-medium mt-1">Profundo hydration<br/>Targeted treatment</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-2xl border-2 border-[#dcb974]/60 shadow-lg relative overflow-hidden flex flex-col items-center justify-center min-h-[250px]">
                                <img src="/skincare_jade.png" alt="Skincare Products" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
                                <button className="relative z-10 mt-auto mb-8 bg-gradient-to-b from-[#dcb974] to-[#b88c3f] hover:from-[#cda35d] hover:to-[#ae8033] text-[#2c1d05] font-bold py-3 px-8 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(0,0,0,0.3)] border border-[#a17a36] transition transform hover:scale-105">
                                    Quick Patient Intake
                                </button>
                            </div>

                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* MEDICAL RECORDS TAB */}
            {activeSidebar === 'records' && (() => {
              const activeRecordPatient = recordsSelectedPatient || selectedPatient || (patients.length > 0 ? patients[0] : null);
              return (
              <div className="animate-fade-in relative z-10 w-full max-w-[1400px] mx-auto flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-[#0a1128]">Medical Records</h1>
                        <p className="text-[#1a1a1a] mt-1 font-medium">Explore detailed patient files, secure lab data, and interactive imaging galleries.</p>
                    </div>
                    
                    {/* Patient Selection Dropdown */}
                    <div className="bg-white/90 backdrop-blur-md border-2 border-[#dcb974] rounded-xl px-4 py-2 flex items-center gap-3 shadow-md min-w-[240px]">
                        <User className="w-5 h-5 text-[#ae8033] shrink-0" />
                        <div className="flex flex-col flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Patient File</span>
                          <select 
                            value={activeRecordPatient?.id || ''} 
                            onChange={(e) => {
                              const found = patients.find(p => p.id === e.target.value);
                              if (found) {
                                setRecordsSelectedPatient(found);
                                setSelectedPatient(found);
                              }
                            }}
                            className="bg-transparent font-bold text-sm text-[#0a1128] border-none outline-none cursor-pointer w-full py-0.5"
                          >
                            {patients.length > 0 ? (
                              patients.map(p => (
                                <option key={p.id} value={p.id} className="text-slate-900 bg-white font-bold py-1">
                                  {p.patient_name} (ID: #{p.id.substring(0,6).toUpperCase()})
                                </option>
                              ))
                            ) : (
                              <option value="" className="text-slate-500 bg-white">Loading Patients...</option>
                            )}
                          </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                    {/* Top 3 Columns */}
                    <div className="flex-1 flex gap-6">
                        
                        {/* Medical History */}
                        <div className="flex-1 bg-white/40 backdrop-blur-md rounded-2xl border-2 border-[#dcb974]/60 shadow-xl p-6 relative overflow-hidden flex flex-col">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                            <h3 className="text-2xl font-bold text-[#0a1128] mb-4 relative z-10 flex items-center justify-between">
                              <span>Medical History</span>
                              <span className="text-xs font-bold text-[#ae8033] bg-[#fdfbf5] px-3 py-1 rounded-full border border-[#e5dfd1]">
                                {activeRecordPatient?.patient_name || 'Patient'}
                              </span>
                            </h3>
                            
                            <div className="flex-1 overflow-y-auto space-y-4 relative z-10 pr-2">
                                <div className="flex gap-4 border-b border-[#d4cdbd]/50 pb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#cda35d] to-[#916b32] rounded-lg flex items-center justify-center shrink-0 shadow-md">
                                        <FileDigit className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base text-[#0a1128]">Initial AI Skin Assessment Scan</h4>
                                        <p className="text-[#1a1a1a] font-medium text-xs mt-0.5">
                                          Primary Concern: {recordsPatientDetails?.screening?.primary_concern || 'Acne & Breakouts'}<br/>
                                          Status: Submitted & Evaluated
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 border-b border-[#d4cdbd]/50 pb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#cda35d] to-[#916b32] rounded-lg flex items-center justify-center shrink-0 shadow-md">
                                        <FileDigit className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base text-[#0a1128]">Dermatology Diagnostic Evaluation</h4>
                                        <p className="text-[#1a1a1a] font-medium text-xs mt-0.5">
                                          Skin Type: {recordsPatientDetails?.profile?.skin_type || 'Normal'}<br/>
                                          Priority: {activeRecordPatient?.risk_level || 'Standard Priority'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#cda35d] to-[#916b32] rounded-lg flex items-center justify-center shrink-0 shadow-md">
                                        <FileDigit className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base text-[#0a1128]">30-Day Skincare Routine Review</h4>
                                        <p className="text-[#1a1a1a] font-medium text-xs mt-0.5">
                                          Active Treatment Milestone: In Progress<br/>
                                          Assigned Patient: {activeRecordPatient?.patient_name || 'Patient'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lab Reports & Sensitivity Panels */}
                        <div className="flex-1 bg-white/40 backdrop-blur-md rounded-2xl border-2 border-[#dcb974]/60 shadow-xl p-6 relative overflow-hidden flex flex-col">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                            <h3 className="text-2xl font-bold text-[#0a1128] mb-4 relative z-10">Lab & Sensitivity Reports</h3>
                            <div className="flex-1 overflow-y-auto space-y-4 relative z-10 pr-2">
                                <div className="flex items-center gap-4 border-b border-[#d4cdbd]/50 pb-4">
                                    <div className="w-12 h-12 bg-[#e6f2f3]/80 border border-[#b5dcd6] rounded-lg flex items-center justify-center text-[#087f8c] shrink-0">
                                        <TestTube className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#0a1128]">Allergy & Sensitivity Panel</h4>
                                        <p className="text-[#595959] text-xs">Reported: {recordsPatientDetails?.profile?.allergies || 'None Reported'}</p>
                                    </div>
                                    <div className="font-bold text-[#0a1128] text-sm">94% Compliance</div>
                                </div>

                                <div className="flex items-center gap-4 border-b border-[#d4cdbd]/50 pb-4">
                                    <div className="w-12 h-12 bg-[#f4f2ef]/80 border border-[#d4cdbd] rounded-lg flex items-center justify-center text-[#7c6f5a] shrink-0">
                                        <Microscope className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#0a1128]">Skin Health Index Score</h4>
                                        <p className="text-[#595959] text-xs">Calculated AI Vision Score</p>
                                    </div>
                                    <div className="font-bold text-[#dcb974] text-[#0a1128] text-base">{recordsPatientDetails?.score?.overall || 78}/100</div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#e6f2f3]/80 border border-[#b5dcd6] rounded-lg flex items-center justify-center text-[#087f8c] shrink-0">
                                        <TestTube className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#0a1128]">Lifestyle & Hydration Adherence</h4>
                                        <p className="text-[#595959] text-xs">Water Intake: {recordsPatientDetails?.profile?.water_intake || '2.0 L/day'}</p>
                                    </div>
                                    <div className="font-bold text-[#0a1128] text-sm">88% Adherence</div>
                                </div>
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <div className="w-[450px] bg-white/40 backdrop-blur-md rounded-2xl border-2 border-[#dcb974]/60 shadow-xl p-6 relative overflow-hidden flex flex-col">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                            <h3 className="text-2xl font-bold text-[#0a1128] mb-4 relative z-10 flex items-center justify-between">
                              <span>Patient Image Gallery</span>
                              <Camera className="w-5 h-5 text-[#cda35d]" />
                            </h3>

                            {recordsPatientDetails?.screening?.image_url ? (
                              <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                                <div className="w-full h-48 rounded-xl overflow-hidden border-2 border-[#dcb974]/60 shadow-md">
                                  <img 
                                    src={recordsPatientDetails.screening.image_url} 
                                    alt="Clinical Assessment Scan" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <p className="text-xs font-bold text-[#0a1128] mt-2">
                                  Assessment Facial Scan (#{activeRecordPatient?.id ? activeRecordPatient.id.substring(0,6) : 'SCAN'})
                                </p>
                              </div>
                            ) : (
                              <div className="relative z-10 flex-1 bg-[#f9f8f4] border-2 border-dashed border-[#d4cdbd] rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                                <Camera className="w-8 h-8 text-[#cda35d] mb-1 opacity-60" />
                                <p className="font-bold text-[#0a1128]">Questionnaire Assessment Only</p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  No facial photo uploaded by {activeRecordPatient?.patient_name || 'Patient'}
                                </p>
                              </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Timeline */}
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl border-2 border-[#dcb974]/60 shadow-xl p-6 relative overflow-hidden flex items-center justify-between">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none"></div>
                        
                        <div className="flex items-center gap-12 relative z-10 flex-1">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-full border-2 border-[#cda35d] flex items-center justify-center bg-white mb-2 shadow-sm">
                                    <Search className="w-4 h-4 text-[#ae8033]" />
                                </div>
                                <p className="font-bold text-sm text-[#0a1128]">Initial Scan</p>
                                <p className="text-[10px] text-[#595959]">Submitted Assessment</p>
                            </div>
                            <div className="h-[2px] flex-1 bg-[#d4cdbd] relative top-[-10px]"></div>
                            
                            <div className="flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-full border-2 border-[#cda35d] flex items-center justify-center bg-white mb-2 shadow-sm">
                                    <FileWarning className="w-4 h-4 text-[#ae8033]" />
                                </div>
                                <p className="font-bold text-sm text-[#0a1128]">AI Evaluation</p>
                                <p className="text-[10px] text-[#595959]">Risk & Skin Type</p>
                            </div>
                            <div className="h-[2px] flex-1 bg-[#d4cdbd] relative top-[-10px]"></div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-full border-2 border-[#cda35d] flex items-center justify-center bg-white mb-2 shadow-sm">
                                    <ClipboardList className="w-4 h-4 text-[#ae8033]" />
                                </div>
                                <p className="font-bold text-sm text-[#0a1128]">Routine Prescribed</p>
                                <p className="text-[10px] text-[#595959]">Active Treatment</p>
                            </div>
                            <div className="h-[2px] flex-1 bg-[#d4cdbd] relative top-[-10px]"></div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-full border-2 border-[#cda35d] flex items-center justify-center bg-[#cda35d] mb-2 shadow-sm">
                                    <Pill className="w-4 h-4 text-white" />
                                </div>
                                <p className="font-bold text-sm text-[#0a1128]">Rx Approved</p>
                                <p className="text-[10px] text-[#595959]">Clinical Confirmation</p>
                            </div>
                            <div className="h-[2px] flex-1 bg-[#d4cdbd] relative top-[-10px]"></div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-full border-2 border-[#d4cdbd] flex items-center justify-center bg-[#f9f8f4] mb-2">
                                    <CheckCircle className="w-4 h-4 text-[#8c8c8c]" />
                                </div>
                                <p className="font-bold text-sm text-[#595959]">Log Routine Now</p>
                                <p className="text-[10px] text-[#8c8c8c]">Daily Tracking</p>
                            </div>
                        </div>

                        <button 
                          onClick={() => {
                            if (activeRecordPatient) {
                              setSelectedPatient(activeRecordPatient);
                              setActiveSidebar('overview');
                            }
                          }}
                          className="relative z-10 ml-8 shrink-0 bg-gradient-to-b from-[#dcb974] to-[#b88c3f] hover:from-[#cda35d] hover:to-[#ae8033] text-[#2c1d05] font-bold py-3 px-8 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(0,0,0,0.3)] border border-[#a17a36] transition transform hover:scale-105"
                        >
                            Open Patient File
                        </button>
                    </div>
                </div>
              </div>
            );
            })()}
            
            {/* ANALYTICS TAB */}
            {activeSidebar === 'analytics' && (
              <div className="animate-fade-in relative z-10 w-full max-w-[1400px] mx-auto flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-[#0a1128]">Analytics Overview</h1>
                        <p className="text-[#1a1a1a] mt-1 font-medium">Real-time clinical progress analytics and AI diagnostic trends.</p>
                    </div>

                    {/* Patient Selection Dropdown */}
                    <div className="bg-white/80 backdrop-blur-md border-2 border-[#dcb974] rounded-xl px-4 py-2 flex items-center gap-3 shadow-md">
                        <User className="w-5 h-5 text-[#ae8033]" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Patient File</span>
                          <select 
                            value={recordsSelectedPatient?.id || ''} 
                            onChange={(e) => {
                              const found = patients.find(p => p.id === e.target.value);
                              if (found) setRecordsSelectedPatient(found);
                            }}
                            className="bg-transparent font-bold text-sm text-[#0a1128] border-none outline-none cursor-pointer pr-2"
                          >
                            {patients.map(p => (
                              <option key={p.id} value={p.id} className="text-slate-900 bg-white">
                                {p.patient_name} (ID: #{p.id.substring(0,6).toUpperCase()})
                              </option>
                            ))}
                          </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                    {/* Top 3 Columns */}
                    <div className="flex-1 flex gap-6">
                        
                        {/* Overall Skin Health Trends */}
                        <div className="w-[380px] bg-[#eef5e9]/70 backdrop-blur-md rounded-2xl border-2 border-[#b5dcd6]/60 shadow-xl p-6 relative overflow-hidden flex flex-col">
                            <h3 className="text-2xl font-bold text-[#0a1128] mb-6 relative z-10 flex items-center justify-between">
                              <span>Skin Health Trends</span>
                              <span className="text-xs font-bold text-[#087f8c] bg-[#e6f2f3] px-2.5 py-1 rounded-full border border-[#b5dcd6]">
                                Live Tracker
                              </span>
                            </h3>

                            <div className="flex justify-between items-end mb-4 relative z-10">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Health Score:</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-[#0a1128]">
                                          {recordsPatientDetails?.score?.overall || 78}
                                        </span>
                                        <span className="text-xl font-bold text-slate-500">/ 100</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-xs font-bold text-[#087f8c]">Active Skin Routine</span>
                                        <Leaf className="w-3.5 h-3.5 text-[#087f8c]" />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Adherence</p>
                                    <p className="text-3xl font-bold text-[#087f8c] mb-1">88%</p>
                                    <div className="w-24 h-2.5 bg-white rounded-full overflow-hidden border border-[#b5dcd6] ml-auto">
                                        <div className="h-full bg-[#087f8c] w-[88%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 mt-4 relative z-10 border-t border-[#b5dcd6]/50 pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={recordsPatientDetails?.history?.length > 0 ? recordsPatientDetails.history : [
                                        { name: 'Week 1', score: 62 },
                                        { name: 'Week 2', score: 68 },
                                        { name: 'Week 3', score: 74 },
                                        { name: 'Week 4', score: recordsPatientDetails?.score?.overall || 78 },
                                    ]}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#595959', fontSize: 11, fontWeight: 'bold'}} />
                                        <Line type="monotone" dataKey="score" stroke="#087f8c" strokeWidth={3} dot={{r: 4, fill: '#fff', stroke: '#087f8c', strokeWidth: 2}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Diagnostic Breakdown */}
                        <div className="w-[380px] bg-[#eef5e9]/70 backdrop-blur-md rounded-2xl border-2 border-[#b5dcd6]/60 shadow-xl p-6 relative overflow-hidden flex flex-col">
                            <h3 className="text-2xl font-bold text-[#0a1128] mb-6 relative z-10">Diagnostic Breakdown</h3>
                            
                            <div className="bg-[#f9f8f4] rounded-xl p-4 border border-[#d4cdbd]/50 mb-4 shadow-sm relative z-10">
                                <h4 className="font-bold text-[#0a1128] text-sm mb-3">AI Diagnostic Progress Trends</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-[#0a1128]">Primary Concern: <span className="text-[#087f8c]">{recordsPatientDetails?.screening?.primary_concern || 'Acne'}</span></p>
                                            <p className="text-[11px] text-[#595959]">Patient: {recordsSelectedPatient?.patient_name || 'Patient'}</p>
                                        </div>
                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">-18% Severity</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-[#0a1128]">Skin Type: <span className="text-[#087f8c]">{recordsPatientDetails?.profile?.skin_type || 'Normal'}</span></p>
                                            <p className="text-[11px] text-[#595959]">Patient: {recordsSelectedPatient?.patient_name || 'Patient'}</p>
                                        </div>
                                        <span className="font-bold text-[#087f8c] bg-[#e6f2f3] px-2 py-0.5 rounded border border-[#b5dcd6]">Balanced</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-[#0a1128]">Hydration Level: <span className="text-[#087f8c]">{recordsPatientDetails?.profile?.water_intake || '2.0 L/day'}</span></p>
                                            <p className="text-[11px] text-[#595959]">Patient: {recordsSelectedPatient?.patient_name || 'Patient'}</p>
                                        </div>
                                        <span className="font-bold text-[#087f8c] bg-[#e6f2f3] px-2 py-0.5 rounded border border-[#b5dcd6]">+8% Moisture</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 relative z-10 flex-1 overflow-y-auto pr-1">
                                <div className="bg-[#f9f8f4] rounded-xl p-3 border border-[#d4cdbd]/50 shadow-sm relative">
                                    <h4 className="font-bold text-[#0a1128] text-xs">Treatment Step 1: Gentle Cleanser</h4>
                                    <p className="text-[11px] text-[#595959] mt-0.5">Assigned to: {recordsSelectedPatient?.patient_name}</p>
                                    <div className="flex gap-2 mt-1.5">
                                        <div className="w-5 h-5 bg-[#e6f2f3] rounded flex items-center justify-center border border-[#b5dcd6]"><Pill className="w-3 h-3 text-[#087f8c]"/></div>
                                        <div className="w-5 h-5 bg-[#f4f2ef] rounded flex items-center justify-center border border-[#d4cdbd]"><Activity className="w-3 h-3 text-[#7c6f5a]"/></div>
                                    </div>
                                </div>
                                <div className="bg-[#f9f8f4] rounded-xl p-3 border border-[#d4cdbd]/50 shadow-sm relative">
                                    <h4 className="font-bold text-[#0a1128] text-xs">Treatment Step 2: Niacinamide Active Serum</h4>
                                    <p className="text-[11px] text-[#595959] mt-0.5">Assigned to: {recordsSelectedPatient?.patient_name}</p>
                                    <div className="flex gap-2 mt-1.5">
                                        <div className="w-5 h-5 bg-[#e6f2f3] rounded flex items-center justify-center border border-[#b5dcd6]"><Pill className="w-3 h-3 text-[#087f8c]"/></div>
                                        <div className="w-5 h-5 bg-[#f4f2ef] rounded flex items-center justify-center border border-[#d4cdbd]"><Activity className="w-3 h-3 text-[#7c6f5a]"/></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual Progress & Screening */}
                        <div className="flex-1 bg-[#eef5e9]/70 backdrop-blur-md rounded-2xl border-2 border-[#b5dcd6]/60 shadow-xl p-6 relative overflow-hidden flex flex-col">
                            <h3 className="text-2xl font-bold text-[#0a1128] mb-6 relative z-10 flex items-center justify-between">
                              <span>Visual Assessment</span>
                              <Camera className="w-5 h-5 text-[#087f8c]" />
                            </h3>
                            
                            {recordsPatientDetails?.screening?.image_url ? (
                              <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                                <div className="w-full h-56 rounded-xl overflow-hidden border-2 border-[#b5dcd6] shadow-md">
                                  <img 
                                    src={recordsPatientDetails.screening.image_url} 
                                    alt="Visual Progress Assessment Scan" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <p className="text-xs font-bold text-[#0a1128] mt-3">
                                  Facial Scan Snapshot ({recordsSelectedPatient?.patient_name})
                                </p>
                              </div>
                            ) : (
                              <div className="relative z-10 flex-1 bg-[#f9f8f4] border-2 border-dashed border-[#d4cdbd] rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                                <Camera className="w-8 h-8 text-[#087f8c] mb-1 opacity-60" />
                                <p className="font-bold text-[#0a1128]">Questionnaire Only Assessment</p>
                                <p className="text-[11px] text-slate-400 mt-1">No facial photo uploaded by {recordsSelectedPatient?.patient_name}</p>
                              </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Timeline */}
                    <div className="bg-[#eef5e9]/70 backdrop-blur-md rounded-2xl border-2 border-[#b5dcd6]/60 shadow-xl p-6 relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute right-6 top-4 bg-[#f9f8f4] border border-[#dcb974] rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm z-20">
                            <span className="font-bold text-[#1a1a1a] text-sm">Detected Concerns</span>
                            <Star className="w-4 h-4 text-[#dcb974] fill-current" />
                        </div>

                        <h3 className="text-2xl font-bold text-[#0a1128] mb-6 relative z-10">Patient Milestones Timeline</h3>
                        
                        <div className="flex items-center gap-12 relative z-10">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full border-2 border-[#087f8c] flex items-center justify-center bg-[#e6f2f3] mb-2 shadow-sm">
                                    <Search className="w-5 h-5 text-[#087f8c]" />
                                </div>
                                <p className="font-bold text-sm text-[#0a1128]">Patient Forms Review</p>
                                <p className="text-xs text-[#595959]">Patient Firms Rmans</p>
                            </div>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-[#087f8c] to-[#d4cdbd] relative top-[-15px]"></div>
                            
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full border-2 border-[#d4cdbd] flex items-center justify-center bg-[#f4f2ef] mb-2 shadow-sm">
                                    <FileWarning className="w-5 h-5 text-[#7c6f5a]" />
                                </div>
                                <p className="font-bold text-sm text-[#0a1128]">Novvo Diagnosis</p>
                                <p className="text-xs text-[#595959]">& Diagnosis</p>
                            </div>
                            <div className="h-[2px] flex-1 bg-[#d4cdbd] relative top-[-15px]"></div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full border-2 border-[#d4cdbd] flex items-center justify-center bg-[#f4f2ef] mb-2 shadow-sm">
                                    <ClipboardList className="w-5 h-5 text-[#7c6f5a]" />
                                </div>
                                <p className="font-bold text-sm text-[#0a1128]">Key Routine Start</p>
                                <p className="text-xs text-[#595959]">Purifyings</p>
                            </div>
                            <div className="h-[2px] flex-1 bg-[#d4cdbd] relative top-[-15px]"></div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full border-2 border-[#d4cdbd] flex items-center justify-center bg-[#f4f2ef] mb-2 shadow-sm">
                                    <Pill className="w-5 h-5 text-[#7c6f5a]" />
                                </div>
                                <p className="font-bold text-sm text-[#0a1128]">Stap Routine Starts</p>
                                <p className="text-xs text-[#595959]">Dermatology</p>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}
