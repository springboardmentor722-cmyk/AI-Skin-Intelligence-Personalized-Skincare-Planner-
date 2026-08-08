import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Video, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ShieldAlert, 
  Droplets, 
  Moon, 
  Activity,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

export default function ProfessionalAppointmentsView() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track open patient details dropdowns by appointment ID
  const [expandedApptId, setExpandedApptId] = useState<string | null>(null);
  const [patientDetailsMap, setPatientDetailsMap] = useState<Record<string, any>>({});
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/v1/appointments/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePatientDetails = async (apptId: string) => {
    if (expandedApptId === apptId) {
      setExpandedApptId(null);
      return;
    }

    setExpandedApptId(apptId);

    // Fetch details if not cached yet
    if (!patientDetailsMap[apptId]) {
      try {
        setLoadingDetailsId(apptId);
        const token = localStorage.getItem('access_token');
        const res = await fetch(`http://localhost:8000/api/v1/appointments/${apptId}/patient-details`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPatientDetailsMap(prev => ({ ...prev, [apptId]: data }));
        }
      } catch (err) {
        console.error("Failed to fetch patient details", err);
      } finally {
        setLoadingDetailsId(null);
      }
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/v1/appointments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-[#001534] font-medium flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#9f7c46] border-t-transparent rounded-full animate-spin"></div>
        Loading appointments & scheduled patients...
      </div>
    );
  }

  return (
    <div className="p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#001534]">Appointments & Patient Consultations</h2>
          <p className="text-slate-500 text-sm mt-1">Review scheduled appointments and expand patient details prior to consultation.</p>
        </div>
        <span className="bg-[#f6f2e9] text-[#9f7c46] border border-[#d6c7b0] text-xs font-bold px-3 py-1.5 rounded-full">
          {appointments.length} Total Consultations
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {appointments.map((appt) => {
          const isExpanded = expandedApptId === appt.id;
          const details = patientDetailsMap[appt.id];
          const isLoadingThisDetails = loadingDetailsId === appt.id;

          return (
            <div key={appt.id} className="bg-white rounded-2xl shadow-sm border border-[#e5dfd1] overflow-hidden transition-all duration-300">
              
              {/* Card Header */}
              <div className="p-6 flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      appt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      appt.status === 'REJECTED' ? 'bg-red-100 text-red-700 border border-red-200' :
                      'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {appt.status}
                    </span>
                    
                    <span className="text-sm text-slate-600 font-medium flex items-center gap-1.5 bg-[#fdfbf5] px-3 py-1 rounded-lg border border-[#e5dfd1]">
                      <Calendar className="w-4 h-4 text-[#9f7c46]" />
                      {appt.appointment_date ? format(new Date(appt.appointment_date), "PPpp") : "Date TBD"}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-xl text-[#001534] mt-1 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#9f7c46]" />
                    {appt.patient_name || "Patient Consultation"}
                  </h3>
                  
                  {appt.patient_email && (
                    <p className="text-slate-500 text-xs mt-0.5">{appt.patient_email}</p>
                  )}

                  <p className="text-slate-600 text-sm mt-2">
                    <span className="font-semibold text-slate-700">Booking Notes:</span> {appt.notes || 'No specific notes provided.'}
                  </p>
                  
                  {appt.meeting_link && (
                    <div className="mt-3">
                      <a href={appt.meeting_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-[#001534] text-[#d1b17d] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#1a2d4c] transition shadow-sm">
                        <Video className="w-4 h-4" /> Join Virtual Consultation
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Actions & Dropdown Toggle */}
                <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    {appt.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(appt.id, 'CONFIRMED')}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <CheckCircle className="w-4 h-4" /> Accept
                        </button>
                        <button 
                          onClick={() => handleStatusChange(appt.id, 'REJECTED')}
                          className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1.5 transition"
                        >
                          <XCircle className="w-4 h-4" /> Decline
                        </button>
                      </>
                    )}
                  </div>

                  {/* Dropdown Button */}
                  <button
                    onClick={() => togglePatientDetails(appt.id)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#fdfbf5] hover:bg-[#f6f2e9] text-[#001534] border border-[#d6c7b0] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <FileText className="w-4 h-4 text-[#9f7c46]" />
                    {isExpanded ? "Hide Patient Details" : "View Patient Details"}
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Patient Details Dropdown Drawer */}
              {isExpanded && (
                <div className="border-t border-[#e5dfd1] bg-[#fdfbf5] p-6 animate-fade-in space-y-6">
                  {isLoadingThisDetails ? (
                    <div className="flex items-center gap-2 text-sm text-[#9f7c46] font-medium py-4">
                      <div className="w-4 h-4 border-2 border-[#9f7c46] border-t-transparent rounded-full animate-spin"></div>
                      Fetching complete patient skincare medical records...
                    </div>
                  ) : details ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Column 1: Patient Identity & Health Score */}
                      <div className="bg-white p-5 rounded-2xl border border-[#e5dfd1] space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="font-serif font-bold text-[#001534] text-base flex items-center gap-2">
                            <User className="w-4 h-4 text-[#9f7c46]" /> Identity Overview
                          </h4>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            Risk: {details.health_score?.risk_level || 'Low'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs text-slate-600">
                          <p><strong className="text-slate-800">Full Name:</strong> {details.patient_info?.name}</p>
                          <p><strong className="text-slate-800">Email:</strong> {details.patient_info?.email || 'N/A'}</p>
                          <p><strong className="text-slate-800">Age:</strong> {details.patient_info?.age}</p>
                          <p><strong className="text-slate-800">Gender:</strong> {details.patient_info?.gender}</p>
                          {details.patient_info?.phone_number && <p><strong className="text-slate-800">Phone:</strong> {details.patient_info?.phone_number}</p>}
                        </div>

                        <div className="bg-[#f6f2e9] p-3 rounded-xl border border-[#e5dfd1] flex items-center justify-between">
                          <span className="text-xs font-bold text-[#001534]">Calculated Health Score</span>
                          <span className="text-lg font-bold font-serif text-[#9f7c46]">
                            {details.health_score?.overall_score}/100
                          </span>
                        </div>
                      </div>

                      {/* Column 2: Skin Profile & Concerns */}
                      <div className="bg-white p-5 rounded-2xl border border-[#e5dfd1] space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="font-serif font-bold text-[#001534] text-base flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#9f7c46]" /> Skin Attributes
                          </h4>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-slate-500 font-bold block mb-1">Skin Type</span>
                            <span className="bg-[#001534] text-white px-3 py-1 rounded-full font-bold inline-block">
                              {details.skin_profile?.skin_type}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 font-bold block mb-1">Target Concerns</span>
                            <div className="flex flex-wrap gap-1.5">
                              {details.skin_profile?.concerns?.length > 0 ? (
                                details.skin_profile.concerns.map((c: string) => (
                                  <span key={c} className="bg-[#f6f2e9] text-[#001534] border border-[#d6c7b0] px-2.5 py-0.5 rounded-md font-bold">
                                    {c}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400">None specified</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-1">
                            <p className="text-slate-600"><strong className="text-slate-800">Allergies:</strong> {details.skin_profile?.allergies}</p>
                            <p className="text-slate-600 mt-1"><strong className="text-slate-800">Sensitivities:</strong> {details.skin_profile?.sensitivities}</p>
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Lifestyle & Screening Insights */}
                      <div className="bg-white p-5 rounded-2xl border border-[#e5dfd1] space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="font-serif font-bold text-[#001534] text-base flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#9f7c46]" /> Lifestyle & Screening
                          </h4>
                        </div>

                        <div className="space-y-2.5 text-xs text-slate-600">
                          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="flex items-center gap-1.5 font-bold text-slate-700">
                              <Moon className="w-3.5 h-3.5 text-[#9f7c46]" /> Sleep Quality
                            </span>
                            <span className="font-bold text-[#001534]">{details.lifestyle_profile?.sleep_quality}</span>
                          </div>

                          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="flex items-center gap-1.5 font-bold text-slate-700">
                              <Droplets className="w-3.5 h-3.5 text-[#9f7c46]" /> Water Intake
                            </span>
                            <span className="font-bold text-[#001534]">{details.lifestyle_profile?.water_intake}</span>
                          </div>

                          <div className="pt-2">
                            <p><strong className="text-slate-800">Active Screening Concern:</strong> {details.latest_screening?.primary_concern}</p>
                            <p className="mt-1"><strong className="text-slate-800">Secondary Concern:</strong> {details.latest_screening?.secondary_concern}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">Patient details could not be loaded.</div>
                  )}
                </div>
              )}

            </div>
          );
        })}
        
        {appointments.length === 0 && (
          <div className="bg-[#f9f8f4] p-12 rounded-2xl text-center text-slate-500 border border-[#d4cdbd]">
            <Calendar className="w-10 h-10 text-[#9f7c46] mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-serif font-bold text-[#001534]">No Appointments Scheduled Yet</h3>
            <p className="text-sm text-slate-500 mt-1">When users book virtual consultations with you, their appointments and patient skincare records will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
