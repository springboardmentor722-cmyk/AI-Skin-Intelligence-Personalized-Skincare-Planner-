import React, { useState, useEffect } from 'react';
import { 
  getRequests, 
  updateRequestStatus, 
  getUsers, 
  subscribe 
} from '../services/db';
import { DERMATOLOGISTS } from '../data/mockData';
import { UserProfile, ConsultationRequest, Dermatologist } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Inbox, 
  Calendar, 
  Clock, 
  UserCheck, 
  Check, 
  X, 
  Video, 
  Sparkles, 
  Star, 
  Save, 
  Plus, 
  Search,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface DermatologistDashboardViewProps {
  currentTab: 'dashboard' | 'patients' | 'requests' | 'appointments' | 'availability' | 'profile';
  onSelectTab: (tab: 'dashboard' | 'patients' | 'requests' | 'appointments' | 'availability' | 'profile') => void;
  currentUser: UserProfile | null;
}

export const DermatologistDashboardView: React.FC<DermatologistDashboardViewProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
}) => {
  const [requests, setRequests] = useState<ConsultationRequest[]>(getRequests());
  const [patients, setPatients] = useState<UserProfile[]>(getUsers().filter(u => u.role === 'user'));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Form State
  const [doctorProfile, setDoctorProfile] = useState<Dermatologist>(() => {
    const found = DERMATOLOGISTS.find(d => d.name.toLowerCase().includes(currentUser?.name.toLowerCase() || '')) || DERMATOLOGISTS[0];
    return {
      ...found,
      qualifications: found.qualifications || 'MD Dermatology, Fellow AAD (USA)',
      clinicLocation: found.clinicLocation || 'Soluna Skin Clinic & Virtual Care',
      fee: found.fee || '₹ 1,200 / session',
    };
  });

  // Availability State
  const [availableToday, setAvailableToday] = useState(doctorProfile.availableToday);
  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [slotDuration, setSlotDuration] = useState('30 min');

  // Search filter for patients
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const sync = () => {
      setRequests(getRequests());
      setPatients(getUsers().filter(u => u.role === 'user'));
    };
    return subscribe(sync);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAcceptRequest = (reqId: string) => {
    updateRequestStatus(reqId, 'Accepted by Dermatologist');
    triggerToast('Request accepted! Sent to Consultant for final approval.');
  };

  const handleDeclineRequest = (reqId: string) => {
    updateRequestStatus(reqId, 'Denied');
    triggerToast('Consultation request declined.');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Practice profile updated successfully!');
  };

  const handleSaveAvailability = () => {
    setDoctorProfile(prev => ({ ...prev, availableToday }));
    triggerToast('Availability settings updated!');
  };

  // Filter requests assigned ONLY to this dermatologist (Requirement 7)
  const myRequests = requests.filter((r) => {
    if (!r.dermatologistName && !r.dermatologistId) return false;
    
    const idMatch = Boolean(r.dermatologistId && doctorProfile.id && r.dermatologistId === doctorProfile.id);
    const nameMatch = Boolean(
      r.dermatologistName && 
      doctorProfile.name && 
      (r.dermatologistName.toLowerCase().includes(doctorProfile.name.toLowerCase()) ||
       doctorProfile.name.toLowerCase().includes(r.dermatologistName.toLowerCase()))
    );

    return idMatch || nameMatch;
  });

  const pendingRequests = myRequests.filter(r => r.status === 'Forwarded to Dermatologist' || r.status === 'Pending');
  const confirmedAppointments = myRequests.filter(r => r.status === 'Approved' || r.status === 'Accepted by Dermatologist');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.primaryConcern.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">
              DERMATOLOGIST CLINICAL SUITE
            </span>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Live Practice Active
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mt-1">
            Welcome back, <em className="italic text-purple-600 font-serif">{doctorProfile.name}</em>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review patient consultation requests, manage your schedule, and update clinical profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('requests')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-purple-600/20 flex items-center gap-2"
          >
            <Inbox className="w-4 h-4" />
            <span>Pending Requests ({pendingRequests.length})</span>
          </button>
          <button
            onClick={() => onSelectTab('availability')}
            className="bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {currentTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Patients</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-3xl font-serif font-bold text-slate-900">{patients.length}</p>
              <p className="text-[11px] text-emerald-600 font-medium">↑ +3 new this week</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pending Requests</span>
                <Inbox className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-3xl font-serif font-bold text-purple-600">{pendingRequests.length}</p>
              <p className="text-[11px] text-purple-600 font-medium">Forwarded by Consultant</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Confirmed Appointments</span>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-3xl font-serif font-bold text-slate-900">{confirmedAppointments.length}</p>
              <p className="text-[11px] text-slate-500 font-medium">Scheduled this week</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Patient Rating</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              </div>
              <p className="text-3xl font-serif font-bold text-slate-900">{doctorProfile.rating}</p>
              <p className="text-[11px] text-amber-600 font-medium">{doctorProfile.reviewCount} verified reviews</p>
            </div>
          </div>

          {/* Quick Actions & Pending Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Pending Requests Stream */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-purple-600" />
                  <span>Incoming Consultation Requests</span>
                </h2>
                <button
                  onClick={() => onSelectTab('requests')}
                  className="text-xs text-purple-600 font-bold hover:underline"
                >
                  View all ({myRequests.length})
                </button>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">All requests are up to date!</p>
                  <p className="text-[11px]">No new consultation requests pending your review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">{req.clientName}</h3>
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded">
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong>Concern:</strong> {req.concern}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Requested Slot: <strong>{req.preferredDate}</strong> at <strong>{req.preferredTime}</strong>
                        </p>
                        {req.notes && (
                          <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200/60 mt-1">
                            "{req.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.id)}
                          className="border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Clinical Profile Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-serif text-base font-bold text-slate-900">Practice Overview</h3>
                <button
                  onClick={() => onSelectTab('profile')}
                  className="text-xs text-purple-600 font-bold hover:underline"
                >
                  Edit Profile
                </button>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={doctorProfile.photoUrl}
                  alt={doctorProfile.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-200 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{doctorProfile.name}</h4>
                  <p className="text-xs text-purple-600 font-medium">{doctorProfile.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{doctorProfile.experienceYears} Years Experience</p>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Qualifications:</span>
                  <span className="font-bold text-slate-800 text-right">{doctorProfile.qualifications}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fee:</span>
                  <span className="font-bold text-slate-800">{doctorProfile.fee}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Status Today:</span>
                  <span className={`font-bold ${availableToday ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {availableToday ? '● Available' : '○ Offline'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Specialties</p>
                <div className="flex flex-wrap gap-1">
                  {doctorProfile.specialties.map((spec) => (
                    <span key={spec} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-md">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENTS LIST */}
      {currentTab === 'patients' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Patient Registry</h2>
              <p className="text-xs text-slate-500">Manage registered patient skin logs and histories.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search patients or concern..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pl-2">Patient</th>
                  <th className="pb-3">Skin Type</th>
                  <th className="pb-3">Primary Concern</th>
                  <th className="pb-3">Health Score</th>
                  <th className="pb-3">Last Visit</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pl-2">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                        <p className="text-[11px] text-slate-400">{p.email} · Age {p.age || 26}</p>
                      </div>
                    </td>
                    <td className="py-3.5 font-medium text-slate-700">{p.skinType}</td>
                    <td className="py-3.5">
                      <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-md border border-purple-100">
                        {p.primaryConcern}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="font-serif font-bold text-slate-900 text-sm">{p.skinHealthScore} / 100</span>
                    </td>
                    <td className="py-3.5 text-slate-500">{p.lastAssessment || 'Recent'}</td>
                    <td className="py-3.5 text-right pr-2">
                      <button className="text-purple-600 font-bold text-xs hover:underline bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REQUESTS */}
      {currentTab === 'requests' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-serif text-xl font-bold text-slate-900">Consultation Requests Workflow</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review requests routed through the Consultant portal. Accept or decline to process client appointments.
            </p>
          </div>

          <div className="space-y-4">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className={`p-5 rounded-2xl border transition ${
                  req.status === 'Forwarded to Dermatologist' || req.status === 'Pending'
                    ? 'border-purple-200 bg-purple-50/20 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-base font-bold text-slate-900">{req.clientName}</h3>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          req.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : req.status === 'Accepted by Dermatologist'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : req.status === 'Denied'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        ● {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong>Client Email:</strong> {req.clientEmail}
                    </p>
                    <p className="text-xs text-slate-700 font-semibold">
                      <strong>Primary Concern:</strong> {req.concern}
                    </p>
                    <p className="text-xs text-slate-500">
                      <strong>Requested Time:</strong> {req.preferredDate} at {req.preferredTime}
                    </p>
                    {req.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <strong>Patient Note:</strong> "{req.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 self-start md:self-center shrink-0">
                    {req.status === 'Forwarded to Dermatologist' || req.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Check className="w-4 h-4" /> Accept Request
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.id)}
                          className="w-full sm:w-auto border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" /> Decline
                        </button>
                      </>
                    ) : req.status === 'Accepted by Dermatologist' ? (
                      <span className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-xl font-medium border border-blue-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" /> Waiting for Consultant Final Approval
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-xl font-medium">
                        Status: {req.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: APPOINTMENTS */}
      {currentTab === 'appointments' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-serif text-xl font-bold text-slate-900">Confirmed Clinical Schedule</h2>
            <p className="text-xs text-slate-500 mt-0.5">Approved consultations ready for video telehealth session.</p>
          </div>

          {confirmedAppointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 text-purple-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No active appointments scheduled.</p>
              <p className="text-xs">Accept incoming requests to populate your appointment calendar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {confirmedAppointments.map((app) => (
                <div
                  key={app.id}
                  className="bg-purple-50/30 border border-purple-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center font-serif text-sm">
                        {app.clientName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{app.clientName}</h3>
                        <p className="text-[11px] text-slate-500">{app.clientEmail}</p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                      Confirmed
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><strong>Date & Time:</strong> {app.preferredDate} at {app.preferredTime}</p>
                    <p><strong>Clinical Focus:</strong> {app.concern}</p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href="https://meet.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2.5 rounded-xl text-center transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Video className="w-4 h-4" /> Launch Telehealth Call
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AVAILABILITY */}
      {currentTab === 'availability' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Availability & Time Slots</h2>
              <p className="text-xs text-slate-500 mt-0.5">Configure your working hours and consultation availability.</p>
            </div>
            <button
              onClick={handleSaveAvailability}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Schedule Settings
            </button>
          </div>

          <div className="space-y-6 max-w-2xl">
            {/* Available Today Instant Toggle */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-slate-900">Live Status: Available Today</p>
                <p className="text-xs text-slate-500">Show your profile as active for instant consultation booking.</p>
              </div>
              <button
                onClick={() => setAvailableToday(!availableToday)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  availableToday ? 'bg-purple-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    availableToday ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Working Days */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const isSelected = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setWorkingDays(workingDays.filter(d => d !== day));
                        } else {
                          setWorkingDays([...workingDays, day]);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hours & Slot duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slot Duration</label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600 bg-white"
                >
                  <option value="15 min">15 minutes</option>
                  <option value="30 min">30 minutes</option>
                  <option value="45 min">45 minutes</option>
                  <option value="60 min">60 minutes</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EDITABLE PROFILE / PRACTICE (REQUIREMENT 7) */}
      {currentTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Editable Practice Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your public profile, qualifications, bio, and clinic information shown to users.
              </p>
            </div>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-md shadow-purple-600/20"
            >
              <Save className="w-4 h-4" /> Save Profile Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name</label>
              <input
                type="text"
                value={doctorProfile.name}
                onChange={(e) => setDoctorProfile({ ...doctorProfile, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Title / Designation</label>
              <input
                type="text"
                value={doctorProfile.title}
                onChange={(e) => setDoctorProfile({ ...doctorProfile, title: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications & Degrees</label>
              <input
                type="text"
                value={doctorProfile.qualifications}
                onChange={(e) => setDoctorProfile({ ...doctorProfile, qualifications: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
                placeholder="e.g. MD Dermatology, Fellow AAD"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Years of Experience</label>
              <input
                type="number"
                value={doctorProfile.experienceYears}
                onChange={(e) => setDoctorProfile({ ...doctorProfile, experienceYears: Number(e.target.value) })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee</label>
              <input
                type="text"
                value={doctorProfile.fee}
                onChange={(e) => setDoctorProfile({ ...doctorProfile, fee: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinic / Virtual Location</label>
              <input
                type="text"
                value={doctorProfile.clinicLocation}
                onChange={(e) => setDoctorProfile({ ...doctorProfile, clinicLocation: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo URL</label>
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  value={doctorProfile.photoUrl}
                  onChange={(e) => setDoctorProfile({ ...doctorProfile, photoUrl: e.target.value })}
                  className="flex-1 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
                />
                <img
                  src={doctorProfile.photoUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-purple-200 shrink-0"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Specialties (comma separated)</label>
              <input
                type="text"
                value={doctorProfile.specialties.join(', ')}
                onChange={(e) => setDoctorProfile({ ...doctorProfile, specialties: e.target.value.split(',').map(s => s.trim()) })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio & Clinical Focus</label>
              <textarea
                rows={4}
                value={doctorProfile.bio}
                onChange={(e) => setDoctorProfile({ ...doctorProfile, bio: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
