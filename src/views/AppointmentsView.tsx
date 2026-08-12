import React, { useEffect, useState } from 'react';
import { getRequests, subscribe } from '../services/db';
import { UserProfile, ConsultationRequest } from '../types';
import { Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface AppointmentsViewProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ currentUser, onNavigate }) => {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);

  useEffect(() => {
    const load = () => {
      const all = getRequests();
      if (currentUser) {
        setRequests(all.filter((r) => r.userId === currentUser.id || r.clientEmail.toLowerCase() === currentUser.email.toLowerCase()));
      } else {
        setRequests(all);
      }
    };

    load();
    return subscribe(load);
  }, [currentUser]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">MY APPOINTMENTS</p>
          <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1">
            Consultation <em className="italic text-purple-600 font-serif">Requests & Visits</em>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your appointment requests and see live updates from your consultant.
          </p>
        </div>

        <button
          onClick={() => onNavigate('dermatologists')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          + Request New Appointment
        </button>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Calendar className="w-10 h-10 text-purple-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No appointments requested yet</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Book a consultation with one of our board-certified dermatologists.
            </p>
            <button
              onClick={() => onNavigate('dermatologists')}
              className="text-xs font-bold text-purple-600 hover:underline pt-2"
            >
              Browse Dermatologists →
            </button>
          </div>
        ) : (
          requests.map((req) => {
            const statusConfig = {
              Pending: {
                bg: 'bg-amber-50 text-amber-700 border-amber-200',
                icon: AlertCircle,
              },
              Approved: {
                bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                icon: CheckCircle2,
              },
              Denied: {
                bg: 'bg-rose-50 text-rose-700 border-rose-200',
                icon: XCircle,
              },
            }[req.status];

            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-600">{req.dermatologistName}</span>
                    <span className="text-[10px] text-slate-400">· Requested on {req.requestedOn}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{req.concern}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" /> {req.preferredDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-500" /> {req.preferredTime}
                    </span>
                  </p>
                </div>

                <div className={`px-4 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 self-start md:self-center ${statusConfig.bg}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span>{req.status}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
