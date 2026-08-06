import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Share2, Calendar, Award, ShieldCheck, Sparkles, CheckCircle } from 'lucide-react';
import GlassCard from '../../components/ui/GlassCard';
import SkinGauge from '../../components/ui/SkinGauge';

export default function Reports() {
  const [downloading, setDownloading] = useState(false);

  const reportData = {
    patientName: 'Alex Rivera',
    reportId: 'SKIN-REP-2026-8842',
    date: 'August 5, 2026',
    overallScore: 88,
    skinType: 'Combination / Sensitive',
    primaryConcerns: ['Hyper-pigmentation', 'Mild Erythema', 'Barrier Disruption'],
    lifestyleRating: '92% Compliance',
    dermatologistNotes: 'Patient displays notable reduction in localized inflammatory redness over 4-week regimen. Vitamin C 15% and Ceramide Complex have improved barrier resilience by 24%. Recommended maintaining current SPF 50+ regimen.',
    keyMetrics: [
      { name: 'Hydration Level', score: '84%', status: 'Optimal', color: '#10B981' },
      { name: 'Sebum Balance', score: '72%', status: 'Balanced', color: '#18C8C8' },
      { name: 'UV Damage Risk', score: 'Low', status: 'Protected', color: '#5B6DFF' },
      { name: 'Pore Congestion', score: '18%', status: 'Minimal', color: '#8B5CF6' },
    ]
  };

  const handleExportPDF = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      window.print();
    }, 800);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Clinical Documentation
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Skin Intelligence Assessment Report
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Generated AI clinical diagnostic report & dermatologist verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={downloading}
            className="btn-gradient-primary px-6 py-3 rounded-full text-sm font-semibold shadow-lg"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Preparing Report...' : 'Export Official PDF'}
          </button>
        </div>
      </div>

      {/* Main Printable Report Card */}
      <GlassCard className="p-8 sm:p-12 space-y-8 border border-white/50 shadow-2xl relative overflow-hidden bg-white/90 dark:bg-slate-900/90">
        {/* Top Branding Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#18C8C8] to-[#5B6DFF] flex items-center justify-center text-white font-bold text-xl shadow-lg">
              SI
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Skin Intelligence SaaS</h2>
              <p className="text-xs text-gray-500">Clinical Grade Personalized Skincare Engine</p>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs text-gray-500 space-y-1">
            <div><strong className="text-gray-700 dark:text-gray-300">Report ID:</strong> {reportData.reportId}</div>
            <div><strong className="text-gray-700 dark:text-gray-300">Generated:</strong> {reportData.date}</div>
            <div className="text-teal-600 font-semibold flex items-center gap-1 sm:justify-end">
              <ShieldCheck className="w-4 h-4" /> Verified Clinical Document
            </div>
          </div>
        </div>

        {/* Score & Patient Profile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-gray-50/80 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-200/60 dark:border-gray-700/50">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Patient Name</span>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{reportData.patientName}</h3>
            <span className="text-sm font-medium text-teal-600 dark:text-teal-400 mt-1">
              Skin Classification: {reportData.skinType}
            </span>
          </div>

          <div className="flex justify-center">
            <SkinGauge score={reportData.overallScore} size={150} label="Skin Health Index" subtitle="Top 5% Health Cohort" />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Primary AI Diagnoses</span>
            <div className="flex flex-wrap gap-2">
              {reportData.primaryConcerns.map((concern, idx) => (
                <span key={idx} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm">
                  {concern}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Metric Grid */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Biometric Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportData.keyMetrics.map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">{m.name}</span>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{m.score}</div>
                <span className="text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded" style={{ color: m.color, backgroundColor: `${m.color}15` }}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Clinical Notes */}
        <div className="p-6 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-900/50 space-y-3">
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-sm">
            <Award className="w-5 h-5" /> Attending Dermatologist Evaluation
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
            "{reportData.dermatologistNotes}"
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-teal-200/40 text-xs text-gray-500">
            <span>Reviewed by: Dr. Sarah Vance, MD (Board Certified Dermatologist)</span>
            <span className="font-semibold text-teal-600">Digital Signature Valid</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
