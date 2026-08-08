import React, { useState } from 'react';
import { Search, Filter, ChevronRight, User, AlertTriangle } from 'lucide-react';

interface Client {
    assignment_id: string;
    client_id: string;
    full_name: string;
    email: string;
    status: string;
    assigned_at: string;
    skin_type?: string;
    primary_concern?: string;
}

interface ClientListProps {
    clients: Client[];
    onSelectClient: (client: Client) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onSelectClient }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg flex flex-col relative overflow-hidden h-[600px]">
            <div className="p-6 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/30">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Assigned Clients</h2>
                    <p className="text-sm text-gray-500 font-medium">Manage and monitor your clients</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search clients..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white/60 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" 
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="py-2 px-3 bg-white/60 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/40 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Client Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Contact</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Assigned</th>
                            <th className="px-6 py-4 border-b border-gray-200"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredClients.map((client) => (
                            <tr key={client.assignment_id} className="hover:bg-white/50 transition cursor-pointer" onClick={() => onSelectClient(client)}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                                            {client.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{client.full_name || 'Unknown User'}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                {client.status === 'PENDING' && <AlertTriangle className="w-3 h-3 text-orange-500"/>}
                                                ID: {client.client_id.substring(0,8)}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                    {client.email}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md border ${
                                        client.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' :
                                        client.status === 'PENDING' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                        'bg-gray-100 text-gray-700 border-gray-200'
                                    }`}>
                                        {client.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                    {new Date(client.assigned_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </td>
                            </tr>
                        ))}
                        {filteredClients.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                                    No clients found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClientList;
