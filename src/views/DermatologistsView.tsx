import React, { useState } from 'react';
import { DERMATOLOGISTS } from '../data/mockData';
import { addRequest } from '../services/db';
import { Star, Calendar, Clock, CheckCircle, X, UserCheck } from 'lucide-react';
import { Dermatologist, UserProfile } from '../types';

interface DermatologistsViewProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
}

export const DermatologistsView: React.FC<DermatologistsViewProps> = ({ currentUser, onNavigate }) => {
  const [selectedDoctor, setSelectedDoctor] = useState<Dermatologist | null>(null);
  const [preferredDate, setPreferredDate] = useState('2026-08-05');
  const [preferredTime, setPreferredTime] = useState('10:30 AM');
  const [concern, setConcern] = useState('Routine Planning & Skin Assessment Review');
  const [successMsg, setSuccessMsg] = useState('');

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    addRequest({
      userId: currentUser?.id || 'guest-1',
      clientName: currentUser?.name || 'Guest Member',
      clientEmail: currentUser?.email || 'guest@soluna.com',
      dermatologistId: selectedDoctor.id,
      dermatologistName: selectedDoctor.name,
      concern: concern,
      preferredDate: preferredDate,
      preferredTime: preferredTime,
    });

    setSuccessMsg(`Your consultation request for ${selectedDoctor.name} has been sent!`);
    setTimeout(() => {
      setSelectedDoctor(null);
      setSuccessMsg('');
    }, 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">DERMATOLOGIST CARE</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mt-1">
          Expert support, whenever <em className="italic text-purple-600 font-serif">your skin needs it.</em>
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xl">
          Book a consultation with a verified dermatologist. All requests are routed to our consultant team for immediate appointment scheduling.
        </p>
      </div>

      {/* Grid of 12 UNIQUE Dermatologists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DERMATOLOGISTS.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
          >
            {/* Properly framed portrait with object-top position so faces show clearly */}
            <div className="h-56 bg-slate-100 relative overflow-hidden">
              <img
                src={doc.photoUrl}
                alt={doc.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{doc.rating} ({doc.reviewCount})</span>
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold tracking-wider uppercase text-purple-600">
                  {doc.title}
                </span>
                <h3 className="font-serif text-xl font-bold text-slate-900 mt-0.5">{doc.name}</h3>
                <p className="text-xs text-slate-500">{doc.experienceYears} years experience</p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {doc.specialties.map((spec) => (
                    <span
                      key={spec}
                      className="text-[10px] bg-purple-50 text-purple-700 font-medium px-2 py-0.5 rounded-md"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedDoctor(doc)}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
              >
                <UserCheck className="w-3.5 h-3.5" /> Book consultation →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">APPOINTMENT REQUEST</p>
            <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
              Book with {selectedDoctor.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose your preferred date & time. Our consultant will review and approve your slot.
            </p>

            {successMsg ? (
              <div className="my-8 p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleBookSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" /> Preferred Date
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" /> Preferred Time
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-purple-600"
                  >
                    <option>09:15 AM</option>
                    <option>10:30 AM</option>
                    <option>11:30 AM</option>
                    <option>02:00 PM</option>
                    <option>04:00 PM</option>
                    <option>05:30 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Concern / Consultation Goal
                  </label>
                  <input
                    type="text"
                    value={concern}
                    onChange={(e) => setConcern(e.target.value)}
                    placeholder="e.g. Acne & dark spot evaluation"
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-purple-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-3.5 rounded-xl transition shadow-md shadow-purple-600/20"
                >
                  Submit Appointment Request →
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
