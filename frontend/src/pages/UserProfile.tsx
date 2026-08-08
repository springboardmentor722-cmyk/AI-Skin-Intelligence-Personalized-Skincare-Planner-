import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Sparkles, 
  Droplets, 
  Moon, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  HeartHandshake, 
  Globe, 
  Phone, 
  Briefcase, 
  Calendar,
  Activity
} from 'lucide-react';
import { userProfileService } from '../services/userProfileService';

export default function UserProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    age: '',
    gender: '',
    phone_number: '',
    country: '',
    state: '',
    city: '',
    occupation: '',
    preferred_language: '',
    bio: '',
    // Skincare Profile
    skin_type: '',
    age_group: '',
    skin_concerns: [] as string[],
    allergies: '',
    sensitivities: '',
    sleep_quality: '',
    water_intake: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let profileData = null;
      try {
        profileData = await userProfileService.getProfile();
      } catch (e: any) {
        // 404 is fine, just means no profile created yet
      }
      
      const token = localStorage.getItem('access_token');
      const onboardRes = await fetch('http://localhost:8000/api/v1/onboarding/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let onboardData = { skin_profile: {}, lifestyle_profile: {} } as any;
      if (onboardRes.ok) {
        onboardData = await onboardRes.json();
      }

      setProfile(profileData);
      setFormData({
        first_name: profileData?.first_name || '',
        last_name: profileData?.last_name || '',
        date_of_birth: profileData?.date_of_birth || '',
        age: profileData?.age ? String(profileData.age) : '',
        gender: profileData?.gender || '',
        phone_number: profileData?.phone_number || '',
        country: profileData?.country || '',
        state: profileData?.state || '',
        city: profileData?.city || '',
        occupation: profileData?.occupation || '',
        preferred_language: profileData?.preferred_language || '',
        bio: profileData?.bio || '',
        skin_type: onboardData.skin_profile?.skin_type || 'Normal',
        age_group: onboardData.skin_profile?.age_group || '25-34',
        skin_concerns: onboardData.skin_profile?.skin_concerns ? onboardData.skin_profile.skin_concerns.split(', ').filter(Boolean) : [],
        allergies: onboardData.skin_profile?.allergies || '',
        sensitivities: onboardData.skin_profile?.sensitivities || '',
        sleep_quality: onboardData.lifestyle_profile?.sleep_quality || 'Good',
        water_intake: onboardData.lifestyle_profile?.water_intake || '2.0'
      });
    } catch (err: any) {
      setError('Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleConcern = (concern: string) => {
    setFormData(prev => {
      const exists = prev.skin_concerns.includes(concern);
      const updated = exists 
        ? prev.skin_concerns.filter(c => c !== concern)
        : [...prev.skin_concerns, concern];
      return { ...prev, skin_concerns: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // 1. Update basic profile
      const profilePayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        phone_number: formData.phone_number,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        occupation: formData.occupation,
        preferred_language: formData.preferred_language,
        bio: formData.bio,
      };
      
      let data;
      if (profile) {
        data = await userProfileService.updateProfile(profilePayload);
      } else {
        data = await userProfileService.createProfile(profilePayload);
      }
      setProfile(data);

      // 2. Update onboarding profile
      const token = localStorage.getItem('access_token');
      const onboardPayload = {
        skin_profile: {
          skin_type: formData.skin_type,
          age_group: formData.age_group,
          skin_concerns: formData.skin_concerns.join(', '),
          allergies: formData.allergies,
          sensitivities: formData.sensitivities
        },
        lifestyle_profile: {
          sleep_quality: formData.sleep_quality,
          water_intake: formData.water_intake
        }
      };
      await fetch('http://localhost:8000/api/v1/onboarding/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(onboardPayload)
      });

      setSuccess('Your profile and skincare settings have been saved successfully! ✨');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f3eb] flex flex-col justify-center items-center font-serif">
        <div className="w-12 h-12 border-4 border-[#9f7c46] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#4a3f35] font-medium font-sans">Loading your personal profile...</p>
      </div>
    );
  }

  const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
  const ageGroups = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'];
  const availableConcerns = [
    'Acne', 'Hyperpigmentation', 'Dark Spots', 'Dry Skin', 
    'Oily Skin', 'Sensitive Skin', 'Wrinkles', 'Fine Lines', 
    'Redness', 'Uneven Skin Tone'
  ];

  return (
    <div className="min-h-screen bg-[#f8f4ec] py-8 px-4 sm:px-6 lg:px-8 font-serif text-[#3d3228]">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        
        {/* Top Warm Banner */}
        <div className="bg-gradient-to-r from-[#eedec2] via-[#f3e6cf] to-[#e8d5b5] text-[#3d3228] p-8 rounded-3xl shadow-sm border border-[#e2d2b4] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5 z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/80 border border-[#d6c39f] shadow-sm flex items-center justify-center shrink-0">
              <UserIcon className="w-8 h-8 text-[#8c6b47]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#8c6b47]/15 text-[#735332] border border-[#8c6b47]/30 text-[11px] font-bold font-sans uppercase tracking-wider px-3 py-1 rounded-full">
                  Personal Dashboard
                </span>
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#3d3228] mt-1">
                {formData.first_name ? `${formData.first_name} ${formData.last_name}` : 'User Profile & Skincare Goals'}
              </h1>
              <p className="text-[#6e5d4d] font-sans text-sm mt-1">
                Manage your personal details, skin attributes, and health preferences.
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="z-10 bg-[#8c6b47] hover:bg-[#735332] text-white px-7 py-3.5 rounded-2xl font-sans font-bold transition shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-95 shrink-0"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-2xl flex items-center gap-3 font-sans text-sm shadow-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-[#edf4e8] border border-[#c5dcb8] text-[#345224] px-5 py-4 rounded-2xl flex items-center gap-3 font-sans text-sm shadow-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span className="font-medium">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section 1: Skincare Profile & Goals */}
          <div className="bg-[#faf7f0] p-8 rounded-3xl border border-[#e6decb] shadow-sm space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-[#ebdcc4]">
              <div className="w-10 h-10 rounded-xl bg-[#f2e7d3] flex items-center justify-center text-[#8c6b47] border border-[#e2d4bc]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#3d3228]">Skincare Profile & Goals</h2>
                <p className="text-xs font-sans text-[#7a6958]">Your core skin attributes used for personalized scores and routine generation.</p>
              </div>
            </div>

            {/* Skin Type Selection */}
            <div className="space-y-3 font-sans">
              <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">
                Skin Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {skinTypes.map(type => {
                  const isSelected = formData.skin_type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, skin_type: type }))}
                      className={`py-3 px-4 rounded-2xl font-bold text-sm transition-all border text-center ${
                        isSelected 
                          ? 'bg-[#8c6b47] text-white border-[#8c6b47] shadow-md scale-[1.02]' 
                          : 'bg-white text-[#4a3f35] border-[#e2d7c3] hover:border-[#8c6b47] hover:bg-[#fffdf9]'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Age Group Selection */}
            <div className="space-y-3 font-sans">
              <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">
                Age Group
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {ageGroups.map(group => {
                  const isSelected = formData.age_group === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, age_group: group }))}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all border text-center ${
                        isSelected 
                          ? 'bg-[#8c6b47] text-white border-[#8c6b47] shadow-sm' 
                          : 'bg-white text-[#5c4e40] border-[#e2d7c3] hover:border-[#8c6b47]'
                      }`}
                    >
                      {group}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skin Concerns Multi-Select */}
            <div className="space-y-3 font-sans">
              <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">
                Skin Concerns (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2.5">
                {availableConcerns.map(concern => {
                  const isSelected = formData.skin_concerns.includes(concern);
                  return (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => toggleConcern(concern)}
                      className={`py-2 px-4 rounded-full font-medium text-xs transition-all border ${
                        isSelected
                          ? 'bg-[#8c6b47] text-white border-[#8c6b47] shadow-sm font-bold'
                          : 'bg-white text-[#5c4e40] border-[#e2d7c3] hover:border-[#8c6b47]'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{concern}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allergies & Sensitivities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-sans">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#8c6b47]" /> Known Allergies
                </label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="e.g. Salicylic Acid, Fragrance, Parabens"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-[#8c6b47]" /> Skin Sensitivities
                </label>
                <input
                  type="text"
                  name="sensitivities"
                  value={formData.sensitivities}
                  onChange={handleChange}
                  placeholder="e.g. High Sun Sensitivity, Eczema-prone"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>
            </div>

          </div>

          {/* Section 2: Lifestyle & Daily Habits */}
          <div className="bg-[#faf7f0] p-8 rounded-3xl border border-[#e6decb] shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#ebdcc4]">
              <div className="w-10 h-10 rounded-xl bg-[#f2e7d3] flex items-center justify-center text-[#8c6b47] border border-[#e2d4bc]">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#3d3228]">Lifestyle & Habits</h2>
                <p className="text-xs font-sans text-[#7a6958]">Hydration and sleep metrics used to calculate your skin health score.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-[#8c6b47]" /> Average Sleep Quality
                </label>
                <select
                  name="sleep_quality"
                  value={formData.sleep_quality}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm font-medium text-[#3d3228] outline-none focus:border-[#8c6b47] transition cursor-pointer"
                >
                  <option value="Poor">Poor (&lt; 5 hours/night)</option>
                  <option value="Fair">Fair (5 - 6 hours/night)</option>
                  <option value="Good">Good (7 - 8 hours/night)</option>
                  <option value="Excellent">Excellent (8+ hours/night)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-[#8c6b47]" /> Daily Water Intake (Liters)
                </label>
                <input
                  type="text"
                  name="water_intake"
                  value={formData.water_intake}
                  onChange={handleChange}
                  placeholder="e.g. 2.5"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Personal Information */}
          <div className="bg-[#faf7f0] p-8 rounded-3xl border border-[#e6decb] shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#ebdcc4]">
              <div className="w-10 h-10 rounded-xl bg-[#f2e7d3] flex items-center justify-center text-[#8c6b47] border border-[#e2d4bc]">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#3d3228]">Personal Details</h2>
                <p className="text-xs font-sans text-[#7a6958]">Basic identification and contact information.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#8c6b47]" /> Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Age"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition cursor-pointer"
                >
                  <option value="">Select Gender...</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#8c6b47]" /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#8c6b47]" /> Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">State / Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State/Province"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-[#8c6b47]" /> Occupation
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="Occupation"
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">Preferred Language</label>
                <select
                  name="preferred_language"
                  value={formData.preferred_language}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition cursor-pointer"
                >
                  <option value="">Select Language...</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 font-sans">
              <label className="text-xs font-bold text-[#7a6958] uppercase tracking-wider block">Bio / Notes</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Add any additional notes about your skincare journey..."
                className="w-full px-4 py-3 bg-white border border-[#e2d7c3] rounded-2xl text-sm text-[#3d3228] outline-none focus:border-[#8c6b47] transition resize-none"
              />
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex justify-end pt-4 font-sans">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#8c6b47] hover:bg-[#735332] text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-md flex items-center gap-3 hover:scale-[1.02] active:scale-95 text-base"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Profile Settings
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
