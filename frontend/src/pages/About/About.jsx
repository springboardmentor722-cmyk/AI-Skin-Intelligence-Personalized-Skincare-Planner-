import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Award, Microchip, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react';
import GlassCard from '../../components/ui/GlassCard';
import { Link } from 'react-router-dom';

export default function About() {
  const advisors = [
    { name: 'Dr. Elena Rostova, MD', role: 'Chief Medical Officer', org: 'Stanford Dermatology', bio: 'Pioneer in non-invasive skin barrier diagnostic imaging and AI dermatological modeling.' },
    { name: 'Dr. Marcus Vance, PhD', role: 'VP of AI Research', org: 'MIT Computer Science', bio: 'Specialist in deep neural networks and automated cosmetic ingredient compatibility modeling.' },
    { name: 'Sophia Lin, PharmD', role: 'Lead Formulation Scientist', org: 'Harvard Medical', bio: 'Expert in transdermal ingredient bio-availability and clinical molecular safety.' },
  ];

  return (
    <div className="space-y-16 py-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-4 py-1.5 rounded-full uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> Next-Gen Dermatological AI
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
          Pioneering Clinical Precision in <span className="text-gradient">Personalized Skincare</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          AI Skin Intelligence fuses computer vision, biochemical ingredient science, and board-certified dermatological clinical expertise to generate tailored regimens with mathematical accuracy.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Clinical Accuracy', val: '99.4%' },
          { label: 'Active Users', val: '250,000+' },
          { label: 'Ingredients Indexed', val: '14,000+' },
          { label: 'Board Doctors', val: '120+' },
        ].map((s, idx) => (
          <GlassCard key={idx} className="p-6 text-center space-y-2 border border-white/50">
            <div className="text-3xl font-extrabold text-gradient">{s.val}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Mission */}
      <GlassCard className="p-10 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Our Mission</span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Democratizing Board-Certified Dermatological Intelligence Worldwide
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Every skin profile is as unique as DNA. Generic off-the-shelf routines lead to barrier damage, acne purging, and wasted resources. Our platform continuous tracking engine analyzes your skin progress week-by-week, adjusting formulation recommendations dynamically.
          </p>
          <div className="space-y-3 pt-2">
            {['Zero generic recommendations', 'Real-time ingredient conflict detection', 'Continuous progress telemetry'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <CheckCircle2 className="w-5 h-5 text-teal-500" /> {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-[#18C8C8]/30 via-[#5B6DFF]/30 to-[#8B5CF6]/30 animate-pulse-glow flex items-center justify-center p-8">
            <GlassCard className="w-full h-full rounded-full flex flex-col items-center justify-center text-center p-6 border border-white">
              <ShieldCheck className="w-12 h-12 text-[#18C8C8] mb-2" />
              <span className="font-bold text-gray-900 dark:text-white text-sm">HIPAA & ISO Certified</span>
              <span className="text-xs text-gray-500 mt-1">Biometric Privacy Guard</span>
            </GlassCard>
          </div>
        </div>
      </GlassCard>

      {/* Advisory Board */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Medical & Scientific Advisory Board</h2>
          <p className="text-sm text-gray-500">Guided by world leaders in clinical dermatology and machine learning.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {advisors.map((adv, idx) => (
            <GlassCard key={idx} className="p-8 space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-400 to-indigo-500 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-lg">
                {adv.name.split(' ')[1]?.[0] || 'D'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{adv.name}</h3>
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 block mt-0.5">{adv.role}</span>
                <span className="text-xs text-gray-400 block">{adv.org}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {adv.bio}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* CTA */}
      <GlassCard className="p-10 text-center space-y-6 bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10 border border-teal-200/50">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Ready for Your AI Skin Assessment?</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          Get a comprehensive biometric diagnosis and custom routine in under 3 minutes.
        </p>
        <Link to="/skin-assessment" className="btn-gradient-primary inline-flex px-8 py-3.5 rounded-full text-base font-semibold shadow-xl">
          Start AI Skin Assessment <ArrowRight className="w-5 h-5" />
        </Link>
      </GlassCard>
    </div>
  );
}
