import React from 'react';
import { Users, UserPlus, ClipboardList, TrendingUp, CheckCircle, Clock, Activity, MessageSquare } from 'lucide-react';

interface StatsProps {
    stats: any;
}

const DashboardStats: React.FC<StatsProps> = ({ stats }) => {
    const statCards = [
        { label: 'Assigned Clients', value: stats?.total_assigned_clients || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Active Clients', value: stats?.active_clients || 0, icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Completed Consultations', value: stats?.completed_consultations || 0, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-100' },
        { label: 'Pending Recommendations', value: stats?.pending_recommendations || 0, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Follow-up Requests', value: stats?.follow_up_requests || 0, icon: Clock, color: 'text-red-600', bg: 'bg-red-100' },
        { label: 'Routine Compliance', value: `${stats?.routine_compliance_rate || 0}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Client Satisfaction', value: `${stats?.client_satisfaction || 0}/5`, icon: MessageSquare, color: 'text-pink-600', bg: 'bg-pink-100' },
        { label: 'New Screening Requests', value: 3, icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, i) => (
                <div key={i} className="bg-white/40 backdrop-blur-md p-5 rounded-xl border border-gray-200/50 shadow-sm flex items-center gap-4 transition hover:-translate-y-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} border border-white/50 shadow-sm`}>
                        <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardStats;
