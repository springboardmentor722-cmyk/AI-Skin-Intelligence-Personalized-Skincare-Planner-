import React, { useEffect, useState } from 'react';
import { getUsers, getRequests, updateRequestStatus, subscribe } from '../services/db';
import { UserProfile, ConsultationRequest } from '../types';
import {
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Sparkles,
  Search,
  Check,
  Plus,
  Clock,
  Calendar,
  Sun,
} from 'lucide-react';

interface ConsultantDashboardViewProps {
  currentTab: 'dashboard' | 'clients' | 'requests' | 'routine';
  onSelectTab: (tab: 'dashboard' | 'clients' | 'requests' | 'routine') => void;
  currentUser: UserProfile | null;
}

export const ConsultantDashboardView: React.FC<ConsultantDashboardViewProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientForRoutine, setSelectedClientForRoutine] = useState<string>('');
  const [routineSavedToast, setRoutineSavedToast] = useState(false);

  // Custom routine builder state
  const [morningSteps, setMorningSteps] = useState([
    'Gentle Gel Cleanser',
    'Vitamin C 15% Serum',
    'Barrier Repair Moisturizer',
    'Sun Veil SPF 50+',
  ]);
  const [eveningSteps, setEveningSteps] = useState([
    'Double Cleanser',
    'Niacinamide 10% Treatment',
    'Moon Milk Recovery Night Cream',
  ]);
  const [newMorningStep, setNewMorningStep] = useState('');
  const [newEveningStep, setNewEveningStep] = useState('');

  useEffect(() => {
    const loadData = () => {
      const allUsers = getUsers();
      setUsers(allUsers);
      const allRequests = getRequests();
      setRequests(allRequests);

      if (allUsers.length > 0 && !selectedClientForRoutine) {
        setSelectedClientForRoutine(allUsers[0].name);
      }
    };

    loadData();
    return subscribe(loadData);
  }, [selectedClientForRoutine]);

  const handleApprove = (requestId: string) => {
    updateRequestStatus(requestId, 'Approved');
  };

  const handleDeny = (requestId: string) => {
    updateRequestStatus(requestId, 'Denied');
  };

  const handleSaveRoutine = () => {
    setRoutineSavedToast(true);
    setTimeout(() => setRoutineSavedToast(false), 3000);
  };

  const clientUsersOnly = users.filter((u) => !u.role || u.role === 'user');

  const filteredUsers = clientUsersOnly.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.primaryConcern && u.primaryConcern.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRequests = requests.filter(
    (r) =>
      r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dermatologistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.concern.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequests = requests.filter((r) => r.status === 'Pending');

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Consultant Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">
            SKINCARE CONSULTANT PANEL
          </p>
          <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1">
            Welcome back, {currentUser?.name || 'Dr. Priya Sharma'} <Sparkles className="w-5 h-5 inline text-amber-400 fill-amber-400" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Here's what's happening with your clients and appointment requests today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clients or requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-purple-600 w-60"
            />
          </div>
        </div>
      </header>

      {/* RENDER TAB CONTENT */}

      {/* 1. DASHBOARD TAB */}
      {currentTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Registered Clients</p>
                <h2 className="text-3xl font-bold font-serif text-slate-900 mt-1">{users.length}</h2>
                <span className="text-[10px] text-emerald-600 font-semibold">↑ 12% vs last month</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Requests</p>
                <h2 className="text-3xl font-bold font-serif text-amber-600 mt-1">{pendingRequests.length}</h2>
                <span className="text-[10px] text-amber-600 font-semibold">Clients waiting</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Assessments Done</p>
                <h2 className="text-3xl font-bold font-serif text-slate-900 mt-1">36</h2>
                <span className="text-[10px] text-emerald-600 font-semibold">↑ 15% vs last month</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Avg. Skin Improvement</p>
                <h2 className="text-3xl font-bold font-serif text-purple-600 mt-1">+18%</h2>
                <span className="text-[10px] text-emerald-600 font-semibold">This month</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                ✦
              </div>
            </div>
          </div>

          {/* Quick Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incoming Requests Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-serif text-lg font-bold text-slate-900">Incoming Consultation Requests</h2>
                <button
                  onClick={() => onSelectTab('requests')}
                  className="text-xs font-bold text-purple-600 hover:underline"
                >
                  View All Requests →
                </button>
              </div>

              <div className="space-y-3">
                {requests.slice(0, 4).map((r) => (
                  <div key={r.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{r.clientName}</p>
                      <p className="text-[11px] text-slate-500">
                        Request for <strong>{r.dermatologistName}</strong> · {r.preferredDate} ({r.preferredTime})
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        r.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'Denied'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clients Awaiting Plan */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-serif text-lg font-bold text-slate-900">Registered Clients Database</h2>
                <button
                  onClick={() => onSelectTab('clients')}
                  className="text-xs font-bold text-purple-600 hover:underline"
                >
                  View All Clients →
                </button>
              </div>

              <div className="space-y-3">
                {users.slice(0, 4).map((u) => (
                  <div key={u.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email} · {u.skinType}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
                      Score: {u.skinHealthScore}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CLIENTS TAB */}
      {currentTab === 'clients' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Clients Database</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every member who signs up or logs into Soluna is stored here.
              </p>
            </div>
            <p className="text-xs text-slate-400 font-semibold">Total Clients: {filteredUsers.length}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Client Name & Email</th>
                  <th className="py-3 px-4">Skin Type</th>
                  <th className="py-3 px-4">Primary Concern</th>
                  <th className="py-3 px-4">Skin Health Score</th>
                  <th className="py-3 px-4">Last Assessment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No clients found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-semibold">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold">{u.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md font-medium">
                          {u.skinType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{u.primaryConcern}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="text-purple-600">{u.skinHealthScore}</span> / 100
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{u.lastAssessment}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedClientForRoutine(u.name);
                            onSelectTab('routine');
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition"
                        >
                          Build Routine →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. REQUESTS TAB (REQUIREMENTS 7, 8, 9) */}
      {currentTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Dermatologist Appointment Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, approve, or deny client requests for dermatologists.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Pending: {pendingRequests.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Dermatologist Requested</th>
                  <th className="py-3 px-4">Concern / Goal</th>
                  <th className="py-3 px-4">Preferred Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No appointment requests recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      {/* Client Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r.clientName}
                        <span className="block text-[10px] text-slate-400 font-normal">{r.clientEmail}</span>
                      </td>

                      {/* Dermatologist requested */}
                      <td className="py-3.5 px-4 font-semibold text-purple-700">{r.dermatologistName}</td>

                      {/* Concern / Goal */}
                      <td className="py-3.5 px-4 max-w-[200px]">{r.concern}</td>

                      {/* Preferred Date & Time */}
                      <td className="py-3.5 px-4 text-slate-800">
                        <div className="font-semibold">{r.preferredDate}</div>
                        <div className="text-[10px] text-slate-500">{r.preferredTime}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            r.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : r.status === 'Denied'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Actions: Approve / Deny */}
                      <td className="py-3.5 px-4 text-right">
                        {r.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(r.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleDeny(r.id)}
                              className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-[11px] px-3 py-1.5 rounded-lg transition flex items-center gap-1 border border-slate-200"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Deny
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Decision recorded</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ROUTINE BUILDER TAB */}
      {currentTab === 'routine' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Custom Routine Builder</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Design or customize a targeted morning and evening routine for a specific client.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Select Client:</label>
              <select
                value={selectedClientForRoutine}
                onChange={(e) => setSelectedClientForRoutine(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.skinType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Routine Builder */}
            <div className="p-5 bg-amber-50/40 rounded-2xl border border-amber-100 space-y-4">
              <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-600" /> Morning Routine Steps
              </h3>

              <div className="space-y-2 text-xs">
                {morningSteps.map((step, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-200/60 flex items-center justify-between gap-2">
                    <span>{idx + 1}. {step}</span>
                    <button
                      onClick={() => setMorningSteps(morningSteps.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a step (e.g. SPF 50 sunscreen)"
                  value={newMorningStep}
                  onChange={(e) => setNewMorningStep(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-amber-200 text-xs outline-none bg-white"
                />
                <button
                  onClick={() => {
                    if (newMorningStep.trim()) {
                      setMorningSteps([...morningSteps, newMorningStep.trim()]);
                      setNewMorningStep('');
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Evening Routine Builder */}
            <div className="p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-4">
              <h3 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Evening Routine Steps
              </h3>

              <div className="space-y-2 text-xs">
                {eveningSteps.map((step, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-xl border border-indigo-200/60 flex items-center justify-between gap-2">
                    <span>{idx + 1}. {step}</span>
                    <button
                      onClick={() => setEveningSteps(eveningSteps.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a step (e.g. Night Ceramide Mask)"
                  value={newEveningStep}
                  onChange={(e) => setNewEveningStep(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-indigo-200 text-xs outline-none bg-white"
                />
                <button
                  onClick={() => {
                    if (newEveningStep.trim()) {
                      setEveningSteps([...eveningSteps, newEveningStep.trim()]);
                      setNewEveningStep('');
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveRoutine}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6 py-3 rounded-xl transition shadow-md shadow-purple-600/20"
            >
              Save Custom Routine for {selectedClientForRoutine} →
            </button>
          </div>
        </div>
      )}

      {routineSavedToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> Routine saved for {selectedClientForRoutine}!
        </div>
      )}
    </div>
  );
};
