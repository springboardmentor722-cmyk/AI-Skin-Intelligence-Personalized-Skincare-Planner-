import React from 'react';
import { FileText, Search, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';

interface ScreeningReportsViewProps {
    client: any;
}

const ScreeningReportsView: React.FC<ScreeningReportsViewProps> = ({ client }) => {
    if (!client) return <div>No client selected</div>;

    return (
        <div className="flex gap-8 h-full">
            <div className="w-1/3 bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-gray-200/50 bg-white/30">
                    <h2 className="font-bold text-gray-900">Approved Reports</h2>
                    <p className="text-xs text-gray-500">Only dermatologist-approved reports are visible.</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {[1, 2].map((item, i) => (
                        <div key={i} className={`p-4 border-b border-gray-200/50 cursor-pointer transition ${i === 0 ? 'bg-white/60 border-l-4 border-l-indigo-500' : 'hover:bg-white/40'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-500">Oct 12, 2023</span>
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-green-100 text-green-700">APPROVED</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm">Routine Screening</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">AI detected mild erythema. Dermatologist confirmed and recommended hydration.</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-2/3 bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg p-6 flex flex-col overflow-y-auto h-full">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Screening Report - Oct 12, 2023</h2>
                        <p className="text-sm text-gray-500">Reviewed by Dr. Smith (Dermatologist)</p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-xl text-lg border border-indigo-100">
                        Score: 72/100
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/50 border border-gray-200 rounded-xl p-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Identified Concerns</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                <AlertTriangle className="w-4 h-4 text-orange-500"/> Mild Erythema (Cheeks)
                            </li>
                            <li className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                <AlertTriangle className="w-4 h-4 text-orange-500"/> Dehydration
                            </li>
                        </ul>
                    </div>
                    <div className="bg-white/50 border border-gray-200 rounded-xl p-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Risk Level</h3>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-bold text-gray-900">Low Risk</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">No urgent medical intervention required. Focus on routine optimization.</p>
                    </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-8">
                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4"/> Dermatologist Clinical Notes
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                        "The patient's erythema appears to be related to barrier disruption rather than rosacea. Please recommend gentle, hydrating products and ensure they are wearing SPF daily. Avoid active exfoliants for the next 2 weeks."
                    </p>
                    <div className="mt-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Note: You cannot edit clinical notes.</div>
                </div>
            </div>
        </div>
    );
};

export default ScreeningReportsView;
