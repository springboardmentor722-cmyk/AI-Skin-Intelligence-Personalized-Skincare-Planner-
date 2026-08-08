import React from 'react';
import { User, Activity, CheckCircle, Droplet, Sun, Clock, Calendar } from 'lucide-react';

interface ClientProfileViewProps {
    client: any;
}

const ClientProfileView: React.FC<ClientProfileViewProps> = ({ client }) => {
    if (!client) return <div>No client selected</div>;

    return (
        <div className="flex gap-8">
            <div className="w-1/3 flex flex-col gap-6">
                <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg p-6">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200/50">
                        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl border border-blue-200">
                            {client.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{client.full_name}</h2>
                            <p className="text-sm text-gray-500">{client.email}</p>
                            <span className="inline-block mt-2 px-2 py-1 text-[10px] uppercase font-bold rounded-md border bg-green-100 text-green-700 border-green-200">
                                {client.status || 'ACTIVE'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Skin Type</p>
                            <p className="font-medium text-gray-900 flex items-center gap-2"><Droplet className="w-4 h-4 text-blue-500"/> Oily / Combination</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Primary Concern</p>
                            <p className="font-medium text-gray-900">Adult Acne & Hyperpigmentation</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Skin Goals</p>
                            <p className="font-medium text-gray-900">Clear skin, even tone</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Allergies</p>
                            <p className="font-medium text-red-600">Salicylic Acid (Mild)</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500"/> Lifestyle Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Sleep</p>
                            <p className="font-medium text-gray-900 text-sm">6-7 Hours</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Water</p>
                            <p className="font-medium text-gray-900 text-sm">~1.5 Liters</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Stress</p>
                            <p className="font-medium text-gray-900 text-sm">High</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Sun</p>
                            <p className="font-medium text-gray-900 text-sm">Rarely</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-2/3 flex flex-col gap-6">
                <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Current Status & Progress</h3>
                    
                    <div className="flex gap-6 mb-8">
                        <div className="flex-1 bg-white/50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 mb-1">Latest Skin Score</p>
                                <p className="text-3xl font-bold text-indigo-600">72<span className="text-sm text-gray-400">/100</span></p>
                            </div>
                            <Activity className="w-8 h-8 text-indigo-200" />
                        </div>
                        <div className="flex-1 bg-white/50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 mb-1">Routine Compliance</p>
                                <p className="text-3xl font-bold text-green-600">85%</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-200" />
                        </div>
                    </div>

                    <h4 className="font-bold text-gray-900 mb-4">Progress Timeline</h4>
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
                        <div className="relative pl-6">
                            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                            <p className="text-xs font-bold text-blue-500 mb-1">Today</p>
                            <p className="font-medium text-gray-900">Routine Check-in</p>
                            <p className="text-sm text-gray-500 mt-1">Client reported reduced redness after starting new moisturizer.</p>
                        </div>
                        <div className="relative pl-6">
                            <div className="absolute w-3 h-3 bg-gray-300 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                            <p className="text-xs font-bold text-gray-500 mb-1">Oct 12, 2023</p>
                            <p className="font-medium text-gray-900">Dermatologist Review Completed</p>
                            <p className="text-sm text-gray-500 mt-1">Dr. Smith approved the screening report and requested a hydration focus.</p>
                        </div>
                        <div className="relative pl-6">
                            <div className="absolute w-3 h-3 bg-gray-300 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                            <p className="text-xs font-bold text-gray-500 mb-1">Oct 10, 2023</p>
                            <p className="font-medium text-gray-900">Initial AI Screening</p>
                            <p className="text-sm text-gray-500 mt-1">Skin scan completed. Score: 68/100.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientProfileView;
