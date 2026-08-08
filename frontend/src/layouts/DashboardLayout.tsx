import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Sparkles, Activity, List, ShoppingBag, Settings, LogOut, MessageCircle, Heart, Share2, Users, User } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const [userData, setUserData] = useState<{name: string, role: string, initials: string} | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return
        const res = await fetch('http://localhost:8000/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const name = data.full_name || data.email.split('@')[0]
          const role = data.roles && data.roles.length > 0 ? data.roles[0].name : 'User'
          
          let initials = 'U'
          if (data.full_name) {
            const parts = data.full_name.split(' ').filter(Boolean)
            if (parts.length >= 2) {
              initials = `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            } else if (parts.length === 1) {
              initials = parts[0].substring(0, 2).toUpperCase()
            }
          } else {
             initials = name.substring(0, 2).toUpperCase()
          }

          setUserData({ name, role, initials })
        }
      } catch (err) {
        console.error("Failed to fetch user data", err)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = () => {
    navigate('/login')
  }

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'AI Skin Screening', path: '/dashboard/screening', icon: Sparkles },
    { name: 'Lifestyle Tracking', path: '/dashboard/lifestyle', icon: Activity },
    { name: 'Routine Generator', path: '/dashboard/routines', icon: List },
    { name: 'Product Engine', path: '/dashboard/products', icon: ShoppingBag },
    { name: 'Ingredients IQ', path: '/dashboard/ingredients', icon: Sparkles },
    { name: 'Progress Tracking', path: '/dashboard/tracking', icon: List },
    { name: 'Consult Professionals', path: '/dashboard/professionals', icon: Users },
    { name: 'User Profile', path: '/dashboard/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-[#f3efe8] flex font-serif">
      {/* Sidebar */}
      <div className="w-64 bg-[#f3efe8] border-r border-[#e5dfd1] flex flex-col hidden md:flex">
        <div className="p-8">
          <h2 className="text-xl font-bold text-[#001534] tracking-tight">AI Skincare</h2>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name}
                to={item.path} 
                className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition ${isActive ? 'font-bold text-[#001534]' : 'text-slate-600 hover:bg-[#efe8de]'}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#9f7c46]' : 'text-slate-500'}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Texture (Optional subtle grain or solid color) */}
        <div className="absolute inset-0 bg-[#efe8de] pointer-events-none z-[-1]"></div>

        {/* Header */}
        <header className="p-6 flex justify-end items-center space-x-6 z-10">
          <Link to="/dashboard/profile" className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition">
            <span className="text-sm font-medium text-[#001534]">
              {userData ? `${userData.name} (${userData.role})` : 'Loading...'}
            </span>
            <div className="w-10 h-10 rounded-full bg-[#d6c7b0] flex items-center justify-center text-[#001534] font-bold shadow-sm">
              {userData ? userData.initials : 'JD'}
            </div>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-slate-500 hover:text-red-600 transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 z-10">
          <Outlet />
        </main>


      </div>
    </div>
  )
}
