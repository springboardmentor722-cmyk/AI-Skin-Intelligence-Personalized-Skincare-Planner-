import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, KeyRound } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role_name: 'User' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Registration failed')
      }

      navigate('/login')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#efe8de] font-sans relative overflow-hidden text-[#001534]">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}></div>

      <div className="flex w-full max-w-7xl mx-auto my-auto p-4 lg:p-12 relative z-10 gap-12 lg:gap-20 items-center justify-center">
        
        {/* Left Section */}
        <div className="hidden lg:flex flex-col w-[45%]">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-serif text-[#001534] tracking-tight mb-4 drop-shadow-sm">AI Skincare Planner</h1>
            {/* Logo Custom SVG */}
            <div className="flex justify-center">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C7.58 2 4 5.58 4 10C4 14.42 12 22 12 22C12 22 20 14.42 20 10C20 5.58 16.42 2 12 2Z" fill="url(#leaf-grad)" stroke="#9a815a" strokeWidth="1"/>
                <path d="M12 22V10" stroke="#9a815a" strokeWidth="1" strokeDasharray="2 2"/>
                <path d="M8 12H16" stroke="#9a815a" strokeWidth="1" strokeDasharray="2 2"/>
                <defs>
                  <linearGradient id="leaf-grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#d1e0c8" />
                    <stop offset="1" stopColor="#a3b89b" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          
          <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-white/20">
            <img 
              src="/register-img.png" 
              alt="Skincare jade roller and serum" 
              className="w-full h-[420px] object-cover"
            />
          </div>
        </div>
        
        {/* Right Section - Form */}
        <div className="w-full lg:w-[45%] flex items-center justify-center">
          <div className="w-full max-w-md bg-[#fdfbf5] p-10 rounded-[2rem] shadow-2xl shadow-[#d9cbb8]/50 border border-[#f0e8dc] relative">
            
            <h2 className="text-3xl font-serif text-[#001534] mb-2">Create an Account</h2>
            <p className="text-slate-500 mb-8 font-medium text-sm">Start your personalized skincare journey today.</p>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{error}</div>}

            <form className="space-y-4" onSubmit={handleSubmit}>
              

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#001534] ml-1">Full Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full p-3 bg-[#f6f2e9] border border-[#d6c7b0] rounded-lg focus:ring-2 focus:ring-[#9f7c46] focus:border-[#9f7c46] font-medium text-slate-700 text-sm outline-none transition placeholder-slate-400 shadow-inner" 
                    placeholder="John Doe" 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                  <User className="absolute right-3 top-3.5 text-[#a8987b] w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#001534] ml-1">Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    className="w-full p-3 bg-[#f6f2e9] border border-[#d6c7b0] rounded-lg focus:ring-2 focus:ring-[#9f7c46] focus:border-[#9f7c46] font-medium text-slate-700 text-sm outline-none transition placeholder-slate-400 shadow-inner" 
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <Mail className="absolute right-3 top-3.5 text-[#a8987b] w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#001534] ml-1">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    className="w-full p-3 bg-[#f6f2e9] border border-[#d6c7b0] rounded-lg focus:ring-2 focus:ring-[#9f7c46] focus:border-[#9f7c46] font-medium text-slate-700 text-sm outline-none transition placeholder-slate-400 shadow-inner" 
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <KeyRound className="absolute right-3 top-3.5 text-[#a8987b] w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#001534] ml-1">I am signing up as a...</label>
                <select
                  className="w-full p-3 bg-[#f6f2e9] border border-[#d6c7b0] rounded-lg focus:ring-2 focus:ring-[#9f7c46] focus:border-[#9f7c46] font-medium text-slate-700 text-sm outline-none transition shadow-inner appearance-none"
                  value={formData.role_name}
                  onChange={(e) => setFormData({...formData, role_name: e.target.value})}
                  required
                >
                  <option value="User">Patient / Client</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Skincare Consultant">Skincare Consultant</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#d1b17d] via-[#e2c79a] to-[#a47e45] text-[#1a1a1a] p-3 rounded-lg font-bold shadow hover:opacity-90 transition disabled:opacity-50 border border-[#b28e57] mt-8"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
            
            <p className="mt-8 text-center text-xs font-medium text-slate-500">
              Already have an account? <Link to="/login" className="text-[#001534] hover:text-[#9f7c46] font-bold transition">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
