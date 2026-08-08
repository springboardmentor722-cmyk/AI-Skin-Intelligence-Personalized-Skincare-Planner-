import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, Video, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfessionalsDirectory() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Booking modal state
  const [selectedPro, setSelectedPro] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/v1/professionals/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfessionals(data);
      }
    } catch (err) {
      console.error("Failed to load professionals", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus('submitting');
    
    try {
      const token = localStorage.getItem('access_token');
      const datetimeStr = `${appointmentDate}T${appointmentTime}:00`;
      
      const payload = {
        professional_id: selectedPro.id,
        appointment_date: new Date(datetimeStr).toISOString(),
        notes: notes
      };
      
      const res = await fetch('http://localhost:8000/api/v1/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setBookingStatus('success');
        setTimeout(() => {
          setSelectedPro(null);
          setBookingStatus('');
          setAppointmentDate('');
          setAppointmentTime('');
          setNotes('');
        }, 3000);
      } else {
        setBookingStatus('error');
      }
    } catch (err) {
      console.error("Booking error:", err);
      setBookingStatus('error');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20 text-[#001534] font-bold">Loading professionals directory...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 font-sans animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-serif text-[#001534] tracking-tight font-bold mb-2">
          Consult Professionals
        </h1>
        <p className="text-slate-500">
          Book a consultation with our verified dermatologists and skin consultants. They will review your application and guide your skincare journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map(pro => (
          <div key={pro.id} className="bg-white rounded-3xl shadow-sm border border-[#e5dfd1] p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 rounded-full bg-[#d6c7b0] flex items-center justify-center text-[#001534] font-bold text-xl shadow-inner">
                {pro.full_name ? pro.full_name.charAt(0) : pro.email.charAt(0).toUpperCase()}
              </div>
              <span className="px-3 py-1 bg-[#e8f0e1] text-[#3e522b] text-xs font-bold rounded-full border border-[#c1d1b1] flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            </div>
            
            <h3 className="font-serif text-xl font-bold text-[#001534] mb-1">
              {pro.full_name || pro.email.split('@')[0]}
            </h3>
            <p className="text-[#9f7c46] text-sm font-medium mb-4">
              {pro.roles.join(', ')} • {pro.profile?.specialization}
            </p>
            
            <div className="space-y-2 mb-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>{pro.profile?.years_of_experience} years experience</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-slate-400" />
                <span>{pro.profile?.consultation_mode || 'Virtual Consultations'}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedPro(pro)}
              className="w-full py-3 bg-[#001534] hover:bg-[#1a2d4c] text-white rounded-xl font-medium transition"
            >
              Book Appointment
            </button>
          </div>
        ))}
        
        {professionals.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-[#f9f8f4] rounded-3xl border border-[#d4cdbd]/50">
            No professionals are currently available. Check back later!
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedPro && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-fade-in">
            <h2 className="text-2xl font-serif font-bold text-[#001534] mb-2">Book Appointment</h2>
            <p className="text-slate-500 mb-6 text-sm">
              Schedule a session with {selectedPro.full_name || selectedPro.email}.
            </p>
            
            {bookingStatus === 'success' ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Booking Confirmed!</h3>
                <p className="text-slate-500">The professional has received your request and application details.</p>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#9f7c46] focus:ring-1 focus:ring-[#9f7c46] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <input 
                    type="time" 
                    required
                    value={appointmentTime}
                    onChange={e => setAppointmentTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#9f7c46] focus:ring-1 focus:ring-[#9f7c46] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Primary Concern (Optional)</label>
                  <textarea 
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Briefly describe what you'd like to discuss..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#9f7c46] focus:ring-1 focus:ring-[#9f7c46] outline-none resize-none"
                  ></textarea>
                </div>
                
                {bookingStatus === 'error' && (
                  <p className="text-red-600 text-sm font-medium">Failed to book appointment. Please try again.</p>
                )}
                
                <div className="flex gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => setSelectedPro(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={bookingStatus === 'submitting'}
                    className="flex-1 py-3 bg-[#001534] hover:bg-[#1a2d4c] text-white rounded-xl font-medium transition disabled:opacity-70"
                  >
                    {bookingStatus === 'submitting' ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
