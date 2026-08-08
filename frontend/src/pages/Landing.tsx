import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cpu, Dna, ShieldCheck, Fingerprint, FlaskConical, HeartPulse, Ban, SunMoon, BookOpen, Search, Leaf, Droplets } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen font-sans flex flex-col relative bg-[#fdfbf7]">
      {/* Custom generated background image */}
      <div 
        className="absolute inset-0 z-0 opacity-50 pointer-events-none" 
        style={{
          backgroundImage: "url('/landing-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 bg-transparent">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Dna className="w-10 h-10 text-black" strokeWidth={1.5} />
          <div className="flex flex-col leading-none text-black">
            <span className="text-sm font-medium tracking-wide">SKIN</span>
            <span className="text-sm font-medium tracking-wide mt-1">INTELLIGENCE</span>
          </div>
        </div>
        
        {/* Links and Button */}
        <div className="hidden md:flex items-center gap-10">
          <div className="flex gap-10 text-[16px] text-black">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#resources" className="hover:text-blue-600 transition-colors">Resources</a>
            <a href="#analysis" className="hover:text-blue-600 transition-colors">AI Skin Analysis</a>
          </div>
          <Link to="/register" className="bg-gradient-to-r from-[#c59c55] to-[#a47b38] text-white px-5 py-2.5 rounded-[4px] text-[13px] font-semibold tracking-wider hover:shadow-md transition-all hover:scale-[1.02]" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
            GET STARTED
          </Link>
        </div>
      </nav>
      
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 py-16">
        
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 max-w-4xl mx-auto mt-8"
        >
          <h1 className="text-5xl md:text-[3.5rem] font-serif font-bold text-[#0b1b3d] mb-6 drop-shadow-sm leading-tight">
            Your Personal AI Dermatologist
          </h1>
          <p className="text-lg md:text-xl text-[#0b1b3d] max-w-3xl mx-auto font-medium">
            Get personalized skincare routines based on your unique skin profile, lifestyle, and environment.
          </p>
        </motion.div>

        {/* Center Decorative Icon */}
        <div className="mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-[#e5c78b] to-[#b38749] rounded-full flex items-center justify-center shadow-lg">
             <Cpu className="text-white w-8 h-8" />
          </div>
        </div>

        {/* 3 Info Cards */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
          }}
          className="grid md:grid-cols-3 gap-6 max-w-6xl w-full mb-16 relative z-10"
        >
          {/* Card 1 */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-[#fcfaf5]/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/60 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#f3ebd8] flex items-center justify-center mb-6 border border-[#e5c78b]">
              <Cpu className="w-8 h-8 text-[#9b7230]" />
            </div>
            <p className="text-slate-700 leading-relaxed text-sm">
              <span className="font-bold text-[#0b1b3d] text-base">AI Analysis</span> - Advanced algorithms analyze your skin concerns to recommend the perfect products.
            </p>
          </motion.div>
          
          {/* Card 2 */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-[#fcfaf5]/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/60 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#f3ebd8] flex items-center justify-center mb-6 border border-[#e5c78b]">
              <Dna className="w-8 h-8 text-[#9b7230]" />
            </div>
            <p className="text-slate-700 leading-relaxed text-sm">
              <span className="font-bold text-[#0b1b3d] text-base">Personalized Routine</span> - Dynamic routines that adapt to your lifestyle and local environment.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-[#fcfaf5]/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/60 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#f3ebd8] flex items-center justify-center mb-6 border border-[#e5c78b]">
              <ShieldCheck className="w-8 h-8 text-[#9b7230]" />
            </div>
            <p className="text-slate-700 leading-relaxed text-sm">
              <span className="font-bold text-[#0b1b3d] text-base">Expert Advice</span> - Verified by dermatologists to ensure safety and effectiveness for your skin type.
            </p>
          </motion.div>
        </motion.div>

        {/* Sign Up Button */}
        <Link 
          to="/register" 
          className="bg-gradient-to-r from-[#c59c55] to-[#a47b38] text-white px-12 py-3 rounded-[3px] font-bold text-[20px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_15px_rgba(0,0,0,0.2)] hover:scale-105 transition-all duration-300" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}
        >
          Sign Up Now
        </Link>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 w-full py-24 px-8 bg-[#fbf9f4] overflow-hidden flex flex-col items-center justify-center">
        {/* Abstract Circuit Background - simulated with a better SVG pattern */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10l30 30h20l30-30M10 90l30-30h20l30 30' stroke='%23a18a58' stroke-width='1.5' fill='none'/%3E%3Ccircle cx='40' cy='40' r='3' fill='%23a18a58'/%3E%3Ccircle cx='60' cy='40' r='3' fill='%23a18a58'/%3E%3Ccircle cx='40' cy='60' r='3' fill='%23a18a58'/%3E%3Ccircle cx='60' cy='60' r='3' fill='%23a18a58'/%3E%3C/svg>")`,
            backgroundSize: '120px 120px'
        }} />
             
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } }
          }}
          className="max-w-6xl mx-auto relative z-10 flex flex-col items-center"
        >
          <h2 className="text-[36px] font-serif font-bold text-[#0c162c] mb-16 text-center">Core Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8 w-full mb-14">
            {/* Card 1 */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="px-8 py-12 bg-white/75 backdrop-blur-md rounded-xl shadow-[0_15px_40px_rgb(0,0,0,0.08)] border border-white/60 flex flex-col items-center text-center">
              <div className="relative w-[76px] h-[76px] rounded-full bg-gradient-to-br from-[#7d6132] to-[#453315] flex items-center justify-center mb-8 shadow-lg ring-4 ring-[#e7dfc7] ring-offset-2 ring-offset-transparent">
                <Fingerprint className="w-[36px] h-[36px] text-[#f8f5e6]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[22px] font-serif font-bold text-[#0c162c] mb-4">Skin Care Assessments</h3>
              <p className="text-gray-700 leading-relaxed text-[15px]">Take our comprehensive questionnaire to identify your unique skin type, concerns, and goals.</p>
            </motion.div>
            
            {/* Card 2 */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="px-8 py-12 bg-white/75 backdrop-blur-md rounded-xl shadow-[0_15px_40px_rgb(0,0,0,0.08)] border border-white/60 flex flex-col items-center text-center">
              <div className="relative w-[76px] h-[76px] rounded-full bg-gradient-to-br from-[#7d6132] to-[#453315] flex items-center justify-center mb-8 shadow-lg ring-4 ring-[#e7dfc7] ring-offset-2 ring-offset-transparent">
                <FlaskConical className="w-[36px] h-[36px] text-[#f8f5e6]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[22px] font-serif font-bold text-[#0c162c] mb-4">Ingredient Analysis</h3>
              <p className="text-gray-700 leading-relaxed text-[15px]">Learn exactly what goes into your products. We flag conflicts and highlight beneficial active ingredients.</p>
            </motion.div>
            
            {/* Card 3 */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="px-8 py-12 bg-white/75 backdrop-blur-md rounded-xl shadow-[0_15px_40px_rgb(0,0,0,0.08)] border border-white/60 flex flex-col items-center text-center">
              <div className="relative w-[76px] h-[76px] rounded-full bg-gradient-to-br from-[#7d6132] to-[#453315] flex items-center justify-center mb-8 shadow-lg ring-4 ring-[#e7dfc7] ring-offset-2 ring-offset-transparent">
                <HeartPulse className="w-[36px] h-[36px] text-[#f8f5e6]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[22px] font-serif font-bold text-[#0c162c] mb-4">Product Recommendations</h3>
              <p className="text-gray-700 leading-relaxed text-[15px]">Get a curated list of over 2,000+ dermatologist-approved skincare products tailored just you.</p>
            </motion.div>
          </div>
          
          <Link to="/register" className="bg-gradient-to-r from-[#c59c55] to-[#a47b38] text-white px-10 py-[14px] rounded-[3px] text-[16px] font-bold tracking-wide shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_15px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:scale-105 transition-all duration-300" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
            FIND YOUR PERFECT ROUTINE
          </Link>
        </motion.div>
      </section>

      {/* AI Skin Analysis Section */}
      <section id="analysis" className="relative z-10 w-full py-24 px-8 bg-gradient-to-br from-[#fcfdfd] to-[#f4f7fa] overflow-hidden">
        {/* Subtle circuit background */}
        <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10l30 30h20l30-30M10 90l30-30h20l30 30' stroke='%238a9ba8' stroke-width='1' fill='none'/%3E%3Ccircle cx='40' cy='40' r='2' fill='%238a9ba8'/%3E%3Ccircle cx='60' cy='40' r='2' fill='%238a9ba8'/%3E%3C/svg>")`,
            backgroundSize: '120px 120px'
        }} />
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.3 } }
          }}
          className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-12"
        >
          {/* Left Column */}
          <motion.div variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6 } } }} className="flex-1 flex flex-col justify-center text-center sm:text-left">
            <h2 className="text-[34px] font-serif font-bold text-[#0c162c] mb-4 tracking-tight">Advanced AI Skin Analysis</h2>
            <p className="text-[15px] text-[#475569] mb-14 leading-relaxed max-w-[620px] mx-auto sm:mx-0 font-medium">
              Our proprietary screening engine cross-references your profile against thousands of ingredients to ensure you never use conflicting products. We analyze environmental factors like local UV index and humidity to adjust your daily routine dynamically.
            </p>
            
            {/* 3 Horizontal Mini-Cards */}
            <div className="flex flex-col sm:flex-row gap-5 mb-8 w-full max-w-[620px] mx-auto sm:mx-0">
              {/* Mini Card 1 */}
              <div className="relative flex-1 bg-gradient-to-b from-[#fbf9f4] to-[#f6f3eb] border border-white rounded-[10px] pt-10 pb-5 px-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.04)] mt-6 sm:mt-0">
                <div className="absolute -top-[26px] left-1/2 -translate-x-1/2 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#8a6b32] to-[#453315] flex items-center justify-center shadow-lg ring-[5px] ring-[#f4f7fa]">
                  <FlaskConical className="w-[22px] h-[22px] text-[#f8f5e6]" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] font-semibold text-[#333] leading-[1.4]">Checks for<br/>allergy triggers</p>
              </div>
              
              {/* Mini Card 2 */}
              <div className="relative flex-1 bg-gradient-to-b from-[#fbf9f4] to-[#f6f3eb] border border-white rounded-[10px] pt-10 pb-5 px-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.04)] mt-8 sm:mt-0">
                <div className="absolute -top-[26px] left-1/2 -translate-x-1/2 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#8a6b32] to-[#453315] flex items-center justify-center shadow-lg ring-[5px] ring-[#f4f7fa]">
                  <Ban className="w-[22px] h-[22px] text-[#f8f5e6]" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] font-semibold text-[#333] leading-[1.4]">Prevents active<br/>ingredient conflicts</p>
              </div>
              
              {/* Mini Card 3 */}
              <div className="relative flex-1 bg-gradient-to-b from-[#fbf9f4] to-[#f6f3eb] border border-white rounded-[10px] pt-10 pb-5 px-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.04)] mt-8 sm:mt-0">
                <div className="absolute -top-[26px] left-1/2 -translate-x-1/2 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#8a6b32] to-[#453315] flex items-center justify-center shadow-lg ring-[5px] ring-[#f4f7fa]">
                  <SunMoon className="w-[22px] h-[22px] text-[#f8f5e6]" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] font-semibold text-[#333] leading-[1.4]">Optimizes for morning<br/>vs. night routines</p>
              </div>
            </div>
            
            <div className="flex justify-center w-full max-w-[620px] mx-auto sm:mx-0">
              <Link to="/register" className="w-full sm:w-[85%] bg-gradient-to-r from-[#c59c55] to-[#a47b38] text-white py-[12px] rounded-[4px] text-[15px] font-bold tracking-wide shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 text-center" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
                DISCOVER YOUR FULL POTENTIAL
              </Link>
            </div>
          </motion.div>
          
          {/* Right Column (AI Hub Orb) */}
          <motion.div variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6 } } }} className="flex-1 w-full flex justify-center relative mt-20 lg:mt-0">
            {/* Background floating text */}
            <div className="absolute top-10 -left-6 text-[11px] text-gray-400 opacity-60 leading-[1.6] text-right hidden lg:block font-mono">
              Ingredients<br/>Glycmosate<br/>Biliate<br/>Giluchin<br/>Bepilin<br/>Elharmess
            </div>
            <div className="absolute top-16 -right-6 text-[13px] text-gray-500 font-medium hidden lg:block">
              UV-Index 3
            </div>
            <div className="absolute bottom-16 -right-6 text-[13px] text-gray-500 font-medium hidden lg:block">
              UV-Index 3<br/>Humidity 60%
            </div>
            
            {/* Glowing Orb Container */}
            <div className="relative w-[340px] h-[340px] rounded-full border border-white/50 bg-gradient-to-br from-white/70 to-blue-50/20 backdrop-blur-sm shadow-[0_0_80px_rgba(100,160,255,0.35)] flex flex-col items-center justify-center">
              {/* Inner glowing ring */}
              <div className="absolute inset-5 rounded-full border-2 border-blue-200/50 shadow-[inset_0_0_30px_rgba(59,130,246,0.3)]"></div>
              
              <h3 className="absolute top-12 text-[22px] font-serif font-bold text-[#0c162c] tracking-wide">AI Hub</h3>
              
              {/* CPU Chip */}
              <div className="relative w-[130px] h-[130px] bg-gradient-to-br from-[#7d6132] to-[#3a2810] rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.35)] flex items-center justify-center border-2 border-[#d3b272] mt-6">
                {/* Simulated circuit pins */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-[6px]">
                   {[1,2,3,4,5,6].map(i => <div key={i} className="w-3 h-[2px] bg-[#d3b272]"></div>)}
                </div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-[6px]">
                   {[1,2,3,4,5,6].map(i => <div key={i} className="w-3 h-[2px] bg-[#d3b272]"></div>)}
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-[6px]">
                   {[1,2,3,4,5,6].map(i => <div key={i} className="w-[2px] h-3 bg-[#d3b272]"></div>)}
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-[6px]">
                   {[1,2,3,4,5,6].map(i => <div key={i} className="w-[2px] h-3 bg-[#d3b272]"></div>)}
                </div>
                
                <Cpu className="w-[60px] h-[60px] text-[#f8f5e6]" strokeWidth={1} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="relative z-10 w-full py-28 px-4 bg-[#f9f9f9] overflow-hidden border-t border-gray-200">
        {/* Background Decorative Elements */}
        <div className="absolute left-0 top-0 opacity-[0.15]">
          <Droplets className="w-[400px] h-[400px] text-[#9ca3af] -translate-x-1/3 -translate-y-1/4" strokeWidth={0.5} />
        </div>
        <div className="absolute right-0 bottom-0 opacity-[0.25]">
          <Leaf className="w-[500px] h-[500px] text-[#6b7280] translate-x-1/4 translate-y-1/4 rotate-[-15deg]" strokeWidth={0.5} />
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } }
          }}
          className="max-w-[1200px] mx-auto relative z-10 flex flex-col items-center"
        >
          
          {/* Top Row: Badges & Title */}
          <div className="flex w-full items-center justify-center gap-8 mb-6 px-4 md:px-16">
            {/* Left Badge */}
            <motion.div variants={{ hidden: { opacity: 0, scale: 0 }, visible: { opacity: 1, scale: 1, transition: { type: "spring" } } }} className="hidden md:flex w-[70px] h-[70px] bg-gradient-to-br from-[#c59c55] to-[#a47b38] rounded-full items-center justify-center shadow-[0_10px_20px_rgba(197,156,85,0.3)] border-[3px] border-white z-20 relative shrink-0">
              <FlaskConical className="w-8 h-8 text-white absolute" strokeWidth={1.2} />
              <Search className="w-4 h-4 text-[#a47b38] absolute bottom-3 right-3 bg-white rounded-full" strokeWidth={2} />
            </motion.div>
            
            {/* Title */}
            <h2 className="text-[36px] md:text-[46px] font-serif font-bold text-[#1e3a5f] tracking-tight text-center">
              Skincare Resources & Education
            </h2>
            
            {/* Right Badge */}
            <motion.div variants={{ hidden: { opacity: 0, scale: 0 }, visible: { opacity: 1, scale: 1, transition: { type: "spring" } } }} className="hidden md:flex w-[70px] h-[70px] bg-gradient-to-br from-[#c59c55] to-[#a47b38] rounded-full items-center justify-center shadow-[0_10px_20px_rgba(197,156,85,0.3)] border-[3px] border-white z-20 relative shrink-0">
              <BookOpen className="w-8 h-8 text-white" strokeWidth={1.5} />
            </motion.div>
          </div>

          {/* Middle Row: Cards & Center Text/Buttons */}
          <div className="flex flex-col xl:flex-row w-full items-center xl:justify-between gap-10 mb-10 mt-4">
            
            {/* Left Card */}
            <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="flex-shrink-0 w-[300px] h-[190px] bg-[#f8f9fa] rounded-[8px] shadow-[6px_6px_0px_rgba(197,156,85,0.2),_0_15px_30px_rgba(0,0,0,0.08)] border-[10px] border-[#c59c55] relative flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-[#fdfcf9] z-0"></div>
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="relative mb-3">
                  <FlaskConical className="w-[45px] h-[45px] text-[#a47b38]" strokeWidth={1} />
                  <Search className="w-[18px] h-[18px] text-[#a47b38] absolute -bottom-1 -right-2 bg-[#f8f9fa] rounded-full p-[1px]" strokeWidth={2} />
                </div>
                <h3 className="text-[17px] font-bold text-[#8a6b32]">Ingredient Dictionary</h3>
              </div>
            </motion.div>

            {/* Center Content */}
            <div className="flex-1 flex flex-col items-center text-center px-4 max-w-[650px]">
              <p className="text-[17px] text-[#4b5563] mb-10 leading-relaxed font-medium">
                Dive into our ingredient dictionary, read dermatologist-approved guides, and understand the science behind healthy skin.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-6 w-full">
                <motion.button variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="px-8 py-[14px] bg-gradient-to-b from-white to-[#fdfcf9] text-[#a47b38] font-bold text-[15px] rounded-[6px] shadow-[0_4px_6px_rgba(197,156,85,0.15),_inset_0_2px_0_white] border border-[#e5d5b5] hover:shadow-[0_2px_4px_rgba(197,156,85,0.15),_inset_0_2px_0_white] hover:translate-y-[2px] transition-all">
                  Ingredient Dictionary
                </motion.button>
                <motion.button variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="px-8 py-[14px] bg-gradient-to-b from-white to-[#fdfcf9] text-[#a47b38] font-bold text-[15px] rounded-[6px] shadow-[0_4px_6px_rgba(197,156,85,0.15),_inset_0_2px_0_white] border border-[#e5d5b5] hover:shadow-[0_2px_4px_rgba(197,156,85,0.15),_inset_0_2px_0_white] hover:translate-y-[2px] transition-all">
                  Routine Guides
                </motion.button>
              </div>
            </div>

            {/* Right Card */}
            <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }} className="flex-shrink-0 w-[300px] h-[190px] bg-[#f8f9fa] rounded-[8px] shadow-[6px_6px_0px_rgba(197,156,85,0.2),_0_15px_30px_rgba(0,0,0,0.08)] border-[10px] border-[#c59c55] relative flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-[#fdfcf9] z-0"></div>
              <div className="relative z-10 flex flex-col items-center justify-center">
                <BookOpen className="w-[45px] h-[45px] text-[#a47b38] mb-3" strokeWidth={1} />
                <h3 className="text-[17px] font-bold text-[#8a6b32]">Routine Guides</h3>
              </div>
            </motion.div>

          </div>
          
          {/* Footer Text */}
          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="flex flex-wrap items-center justify-center gap-3 text-[#64748b] text-[15px] font-medium tracking-wide mt-2">
            <span className="text-[#a0aec0]">»</span>
            <span>Science-Backed</span>
            <span className="text-[#cbd5e1]">|</span>
            <span>Dermatologist Approved</span>
            <span className="text-[#cbd5e1]">|</span>
            <span>Understand Your Skin</span>
            <span className="text-[#a0aec0]">«</span>
          </motion.div>
          
        </motion.div>
      </section>


    </div>
  )
}
