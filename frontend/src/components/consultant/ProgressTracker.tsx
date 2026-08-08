import React from 'react';
import { Activity, Droplet, Moon, TrendingUp, FileText } from 'lucide-react';

interface ProgressTrackerProps {
    client: any;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ client }) => {
    if (!client) return <div>No client selected</div>;

    return (
        <div className="flex gap-8 h-full">
            <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-gray-900 text-sm">Skin Score Trend</h3>
                            <Activity className="w-5 h-5 text-indigo-500"/>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">72</span>
                            <span className="text-sm font-bold text-green-500 mb-1">+4 from last week</span>
                        </div>
                    </div>
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-gray-900 text-sm">Water Intake</h3>
                            <Droplet className="w-5 h-5 text-blue-500"/>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">1.8L</span>
                            <span className="text-sm font-bold text-gray-500 mb-1">avg/day</span>
                        </div>
                    </div>
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-gray-900 text-sm">Sleep Quality</h3>
                            <Moon className="w-5 h-5 text-purple-500"/>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">7.2h</span>
                            <span className="text-sm font-bold text-green-500 mb-1">Improved</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500"/> Routine Completion Trend
                        </h3>
                    </div>
                    
                    <div className="flex-1 bg-white/50 border border-gray-200 rounded-xl flex items-center justify-center relative">
                        {/* Placeholder for Recharts line chart */}
                        <div className="text-center text-gray-400">
                            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="font-medium">Routine Compliance Chart</p>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs font-bold text-gray-400">
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                            <span>Sun</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-[350px] bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-gray-200/50 bg-white/30 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Progress Notes</h3>
                    <button className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition">Add Note</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-white/60 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold text-gray-500">Oct 14, 2023 - You</span>
                        </div>
                        <p className="text-sm text-gray-800">Client reported that the new moisturizer is working well. No irritation observed. Advised to continue current routine.</p>
                    </div>
                    <div className="bg-white/60 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold text-gray-500">Oct 10, 2023 - You</span>
                        </div>
                        <p className="text-sm text-gray-800">Initial review completed. Routine generated based on dermatologist approval.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressTracker;
