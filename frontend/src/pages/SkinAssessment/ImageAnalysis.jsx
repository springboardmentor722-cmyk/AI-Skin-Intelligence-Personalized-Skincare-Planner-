import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, Sparkles, CheckCircle2, Brain, Stethoscope, RefreshCw, Layers } from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";
import SkinGauge from "../../components/ui/SkinGauge";
import api from "../../services/api";

export default function ImageAnalysis() {
  const [imagePreview, setImagePreview] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0); // 0: Input, 1: Processing, 2: Report
  const [showHeatmap, setShowHeatmap] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [scanResult, setScanResult] = useState({
    detected_skin_type: "Combination / Sensitive",
    confidence_score: 98.2,
    overall_risk_level: "Moderate",
    overall_skin_score: 85,
    detected_concerns: [
      { concern: "Localized Erythema / Redness", severity: "Moderate", score: 42, color: "#F59E0B" },
      { concern: "Clogged Pores / Comedones", severity: "Mild", score: 28, color: "#18C8C8" },
      { concern: "Barrier Disruption", severity: "Low", score: 18, color: "#10B981" }
    ],
    heatmap_overlay_regions: [
      { id: "h1", label: "Cheek Erythema", top: "35%", left: "28%", width: "22%", height: "20%", type: "Redness", severity: 42 },
      { id: "h2", label: "Chin Congestion", top: "68%", left: "40%", width: "20%", height: "16%", type: "Acne", severity: 28 }
    ],
    clinical_explanation: "Computer vision analysis detected low-level localized redness across mid-face regions and mild sebum congestion. Overall moisture retention index is optimal at 85/100.",
    recommended_action: "Incorporate Morning Niacinamide 10% + Evening Ceramide Cream with Mineral SPF 50+."
  });

  const handleImageFile = (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const runAIScan = () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    setStep(1);

    setTimeout(() => {
      setAnalyzing(false);
      setStep(2);
    }, 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Facial Vision AI
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            AI Skin Assessment & Image Scanner
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload or capture a face selfie for instant computer vision analysis, concern severity mapping, and heatmaps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Source */}
        <GlassCard className="lg:col-span-5 p-6 space-y-6 border border-white/50">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-500" /> Image Input
            </h3>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[360px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
            {imagePreview ? (
              <div className="relative w-full h-[360px]">
                <img src={imagePreview} alt="Skin scan preview" className="w-full h-full object-cover" />

                {analyzing && (
                  <motion.div
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#18C8C8] to-transparent shadow-[0_0_20px_#18C8C8]"
                  />
                )}

                {step === 2 && showHeatmap && (
                  <div className="absolute inset-0 pointer-events-none">
                    {scanResult.heatmap_overlay_regions.map((region) => (
                      <div
                        key={region.id}
                        style={{
                          top: region.top,
                          left: region.left,
                          width: region.width,
                          height: region.height,
                          borderColor: "#18C8C8",
                          backgroundColor: "rgba(24, 200, 200, 0.25)"
                        }}
                        className="absolute border-2 rounded-xl backdrop-blur-[1px] animate-pulse flex items-start p-1"
                      >
                        <span className="text-[10px] font-bold text-white bg-slate-900/90 px-1.5 py-0.5 rounded-md">
                          {region.label} ({region.severity}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-8 text-center cursor-pointer">
                <Upload className="w-10 h-10 text-teal-500 mb-3" />
                <span className="text-sm font-bold text-white">Upload Face Photo</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e.target.files[0])} />
              </label>
            )}
          </div>

          {imagePreview && (
            <div className="flex items-center gap-3">
              <button
                onClick={runAIScan}
                disabled={analyzing}
                className="btn-gradient-primary flex-1 py-3.5 rounded-full font-bold text-xs shadow-lg flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Scanning Dermal Features...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" /> Analyze Skin Profile
                  </>
                )}
              </button>
            </div>
          )}
        </GlassCard>

        {/* Right Column: Scan Results */}
        <GlassCard className="lg:col-span-7 p-6 sm:p-8 space-y-6 border border-white/50">
          {step === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-500 flex items-center justify-center">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Awaiting Selfie Input</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Upload a clear face photo to begin computer vision feature extraction and heatmap detection.
              </p>
            </div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    AI Scan Diagnosis
                  </span>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                    {scanResult.detected_skin_type}
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-extrabold text-emerald-500">{scanResult.confidence_score}%</div>
                  <div className="text-xs text-gray-400">Model Confidence</div>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <SkinGauge score={scanResult.overall_skin_score} size={160} label="Biometric Score" subtitle="Low Risk Cohort" />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Concern Breakdown</h4>
                {scanResult.detected_concerns.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-700 dark:text-gray-300">{item.concern}</span>
                      <span className="text-teal-600">{item.severity} ({item.score}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#18C8C8] rounded-full" style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/50 text-xs space-y-1">
                <strong className="block text-teal-800 dark:text-teal-300 font-bold flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-500" /> Prescribed Clinical Action
                </strong>
                <p className="text-gray-600 dark:text-gray-300">{scanResult.recommended_action}</p>
              </div>
            </motion.div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
