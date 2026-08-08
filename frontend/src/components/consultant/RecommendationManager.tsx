import React, { useState } from 'react';
import { Package, Plus, Save, Info } from 'lucide-react';

interface RecommendationManagerProps {
    client: any;
}

const RecommendationManager: React.FC<RecommendationManagerProps> = ({ client }) => {
    const [recommendations, setRecommendations] = useState([
        { id: 1, product_name: 'Gentle Hydrating Cleanser', brand: 'CeraVe', category: 'Face Wash', reason: 'Hydration requested by Dr. Smith', usage: 'Use morning and night', time: 'Both' }
    ]);

    const [isAdding, setIsAdding] = useState(false);
    
    if (!client) return <div>No client selected</div>;

    return (
        <div className="flex gap-8 h-full">
            <div className="w-1/3 flex flex-col gap-6">
                <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-200/50 bg-white/30 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-gray-900">Current Recs</h2>
                            <p className="text-xs text-gray-500">Products currently suggested</p>
                        </div>
                        <button 
                            onClick={() => setIsAdding(!isAdding)}
                            className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {recommendations.map(rec => (
                            <div key={rec.id} className="p-4 rounded-xl border border-gray-200 bg-white/50 relative group">
                                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{rec.time}</span>
                                <div className="text-xs font-bold text-gray-500 mb-1">{rec.category}</div>
                                <h3 className="font-bold text-gray-900 text-sm leading-tight">{rec.product_name}</h3>
                                <p className="text-xs text-gray-600 mb-3">{rec.brand}</p>
                                <div className="text-xs text-gray-700 bg-gray-100 p-2 rounded-lg mt-2">
                                    <span className="font-bold text-gray-900 block mb-1">Reason:</span>
                                    {rec.reason}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-2/3 bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-lg p-6 flex flex-col overflow-y-auto h-full">
                {isAdding ? (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50">
                            <h2 className="text-2xl font-bold text-gray-900">Add New Recommendation</h2>
                            <button onClick={() => setIsAdding(false)} className="text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                        </div>
                        
                        <form className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                    <select className="w-full bg-white/60 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option>Face Wash</option>
                                        <option>Moisturizer</option>
                                        <option>Sunscreen</option>
                                        <option>Serum</option>
                                        <option>Toner</option>
                                        <option>Face Mask</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Time of Day</label>
                                    <select className="w-full bg-white/60 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option>Morning</option>
                                        <option>Evening</option>
                                        <option>Both</option>
                                        <option>Weekly</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                                    <input type="text" className="w-full bg-white/60 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Daily Facial Cleanser" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Brand</label>
                                    <input type="text" className="w-full bg-white/60 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. CeraVe" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Recommendation</label>
                                    <textarea className="w-full bg-white/60 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24" placeholder="Explain why this product is recommended..." />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Usage Instructions</label>
                                    <textarea className="w-full bg-white/60 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24" placeholder="How and when to apply..." />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button type="button" className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition">
                                    <Save className="w-4 h-4"/> Save Recommendation
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Product Recommendations</h3>
                        <p className="text-gray-500 max-w-sm mb-6">Suggest skincare products based on the approved screening report. These recommendations will be visible to the client.</p>
                        <button 
                            onClick={() => setIsAdding(true)}
                            className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition"
                        >
                            <Plus className="w-4 h-4"/> Add Recommendation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecommendationManager;
