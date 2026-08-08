import React, { useState } from 'react';
import { lifestyleService } from '../services/lifestyleService';

export default function LifestyleTracking() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    sleep_duration: '',
    water_intake: '',
    exercise: '',
    stress: '',
    sun_exposure: '',
    uv_exposure: '',
    pollution_exposure: ''
  });

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Sanitize payload to prevent backend validation errors
      const payload: any = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value === '') {
          payload[key] = null;
        } else if (key === 'sleep_duration' || key === 'water_intake') {
          payload[key] = parseFloat(value);
        } else {
          payload[key] = value;
        }
      }

      await lifestyleService.createLog(payload);
      setSuccess('Lifestyle data saved successfully! ✨');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save lifestyle data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4ece0] p-4 flex flex-col items-center justify-start font-serif py-12">
      <div className="w-full max-w-[1200px] mx-auto space-y-8">
        
        {/* Messages */}
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-xl text-center font-sans shadow-md relative z-10">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[#e8f0e1] text-[#3e522b] p-4 rounded-xl text-center font-sans border border-[#c1d1b1] shadow-md relative z-10">
            {success}
          </div>
        )}

        <div className="bg-white/40 p-4 rounded-3xl shadow-xl border border-white/60">
          <div className="relative w-full shadow-2xl rounded-lg overflow-hidden bg-[#faf8f5]">
            <img 
              src="/lifestyle-bg.jpg" 
              alt="Lifestyle Background" 
              className="w-full h-auto -mt-[5.5%]" 
              style={{ display: 'block' }}
            />
            
            <form onSubmit={handleSubmit} className="absolute inset-0 top-[5.5%]">
              {/* Invisible layout inputs mapping to the image fields */}
            
            {/* 1. Sleep Duration Slider */}
            <input 
              type="range"
              min="0" max="12" step="0.5"
              value={formData.sleep_duration}
              onChange={(e) => handleChange('sleep_duration', e.target.value)}
              className="absolute opacity-0 cursor-pointer"
              style={{ top: '24%', left: '7%', width: '33%', height: '4%' }}
              title="Drag to select sleep duration"
            />
            {formData.sleep_duration && (
              <div className="absolute font-sans font-bold text-lg text-[#314045] drop-shadow-md" style={{ top: '29%', left: '21%' }}>
                Selected: {formData.sleep_duration} hrs
              </div>
            )}
            {/* 2. Water Intake Input (Made opaque to cover the painted '2.5 L') */}
            <input 
              type="number"
              step="0.1"
              value={formData.water_intake}
              onChange={(e) => handleChange('water_intake', e.target.value)}
              className="absolute bg-[#e8e2d5] border border-[#a89985] rounded text-center font-sans text-xl text-[#27383f] font-bold outline-none"
              style={{ top: '26.5%', left: '66.5%', width: '9.5%', height: '5.8%' }}
              placeholder="Liters"
            />

            {/* 3. Exercise Select - Perfectly covering the painted box */}
            <select
              value={formData.exercise}
              onChange={(e) => handleChange('exercise', e.target.value)}
              className="absolute bg-[#f4ede4] border border-[#bfae99] text-[#4a3f35] font-sans text-sm rounded-md shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#a89985] px-1"
              style={{ top: '54.5%', left: '18.2%', width: '13.5%', height: '5%' }}
            >
              <option value="">Select...</option>
              <option value="None">None</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            {/* 4. Stress Level Select - Perfectly covering the painted box */}
            <select
              value={formData.stress}
              onChange={(e) => handleChange('stress', e.target.value)}
              className="absolute bg-[#f4ede4] border border-[#bfae99] text-[#4a3f35] font-sans text-sm rounded-md shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#a89985] px-1"
              style={{ top: '54.5%', left: '51%', width: '12.5%', height: '5%' }}
            >
              <option value="">Select...</option>
              <option value="Calm">Calm</option>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Severe">Severe</option>
            </select>

            {/* 5. Environmental Exposure */}
            {/* Sun Exposure - Covering 'Rotate dial' button */}
            <select
              value={formData.sun_exposure}
              onChange={(e) => handleChange('sun_exposure', e.target.value)}
              className="absolute bg-[#f4ede4] border border-[#bfae99] text-[#4a3f35] font-sans text-sm rounded-md shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#a89985] px-1"
              style={{ top: '88%', left: '18%', width: '11.5%', height: '5%' }}
            >
              <option value="">Rotate dial</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>

            {/* UV Exposure - Perfectly covering the painted box */}
            <select
              value={formData.uv_exposure}
              onChange={(e) => handleChange('uv_exposure', e.target.value)}
              className="absolute bg-[#f4ede4] border border-[#bfae99] text-[#4a3f35] font-sans text-sm rounded-md shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#a89985] px-1"
              style={{ top: '88%', left: '35.5%', width: '13.5%', height: '5%' }}
            >
              <option value="">Select...</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>

            {/* Pollution Exposure - Placed near the potion bottle */}
            <select
              value={formData.pollution_exposure}
              onChange={(e) => handleChange('pollution_exposure', e.target.value)}
              className="absolute bg-[#f4ede4] border border-[#bfae99] text-[#4a3f35] font-sans text-sm rounded-md shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#a89985] px-1"
              style={{ top: '88%', left: '65.5%', width: '13.5%', height: '5%' }}
            >
              <option value="">Select...</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>

            {/* Submit Button mapping to the painted cyan button */}
            <button 
              type="submit" 
              disabled={saving}
              className="absolute bg-black/0 hover:bg-white/20 active:bg-black/10 transition-colors cursor-pointer rounded-full focus:outline-none focus:ring-4 focus:ring-cyan-300/50"
              style={{ top: '89.5%', left: '30%', width: '31.5%', height: '7%' }}
            >
              <span className="sr-only">Submit My Assessment</span>
            </button>
            
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
