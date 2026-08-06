import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, Sparkles, CheckCircle2, ShieldCheck, Maximize2, X, AlertCircle } from "lucide-react";

/**
 * Reusable Clinical Dermatology Before & After Image Comparison Slider Component.
 * Supports high-resolution imagery (min 1200x1200), smooth drag animation,
 * loading skeletons, zoom on hover, full-screen modal, and API-driven user uploads.
 */
const BeforeAfterSlider = ({
  beforeImage,
  afterImage,
  beforeLabel = "BEFORE (Day 1)",
  afterLabel = "AFTER (Week 6)",
  improvementPercent = 94,
  timelineText = "6 Weeks",
  concernName = "Skin Care Outcome",
  beforeDetails = [],
  afterDetails = [],
  userUploaded = false,
  isLoading = false,
  className = ""
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [fullscreenModal, setFullscreenModal] = useState(false);

  const containerRef = useRef(null);

  // Reset loaded states when images change
  useEffect(() => {
    setBeforeLoaded(false);
    setAfterLoaded(false);
  }, [beforeImage, afterImage]);

  const handleMove = (clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate slider horizontal percentage
    let percentage = ((clientX - rect.left) / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    setSliderPosition(percentage);

    // Calculate hover mouse coordinates for smooth zoom effect
    const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setMousePos({ x: xPct, y: yPct });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setMousePos({ x: xPct, y: yPct });
    }
    if (!isDragging) return;
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === "ArrowRight") {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  const isReady = beforeLoaded && afterLoaded && !isLoading;

  return (
    <div className={`flex flex-col gap-6 w-full ${className}`}>
      {/* Top Header Metrics & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F5F0EB] pb-4">
        <div className="flex items-center gap-2">
          <span className="bg-[#D8F3DC] text-[#059669] text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            {userUploaded ? "Your AI Assessment Preview" : concernName}
          </span>

          {userUploaded && (
            <span className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> User Photo Analyzed
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold px-4 py-1.5 rounded-2xl shadow-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            {improvementPercent}% Improvement
          </div>

          <div className="bg-[#FAF8F5] border border-[#F5F0EB] text-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-2xl">
            ⏱ {timelineText}
          </div>
        </div>
      </div>

      {/* Main Interactive Comparison Container */}
      <div className="relative group w-full">
        <div
          ref={containerRef}
          tabIndex={0}
          role="slider"
          aria-valuenow={Math.round(sliderPosition)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Before and after image comparison slider"
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDragging(false);
            setIsHovered(false);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onTouchStart={(e) => {
            setIsDragging(true);
            handleTouchMove(e);
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsDragging(false)}
          className="relative w-full h-[400px] sm:h-[480px] lg:h-[520px] rounded-[24px] overflow-hidden select-none cursor-ew-resize border border-[#F5F0EB] shadow-[0_20px_40px_-15px_rgba(5,150,105,0.08)] bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
        >
          {/* Loading Skeleton */}
          <AnimatePresence>
            {!isReady && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-30 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center space-y-4 animate-pulse"
              >
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-600 animate-spin" />
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Loading Clinical Dermatology Imagery...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* After Image Layer (Right / Background) */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden transition-transform duration-300 ease-out"
            style={
              isHovered && !isDragging
                ? {
                    transform: "scale(1.04)",
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                  }
                : { transform: "scale(1)" }
            }
          >
            <img
              src={afterImage}
              alt="Clinical After Treatment"
              loading="lazy"
              onLoad={() => setAfterLoaded(true)}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* AFTER Label Badge (Top Right) */}
          <div className="absolute top-4 right-4 z-20 bg-emerald-950/80 backdrop-blur-md text-emerald-200 border border-emerald-500/40 text-xs font-black px-4 py-2 rounded-full shadow-lg tracking-wider uppercase">
            {afterLabel}
          </div>

          {/* Before Image Layer (Left / Clipped Overlay) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden z-10 transition-all duration-75"
            style={{ width: `${sliderPosition}%` }}
          >
            <div
              className="absolute inset-0 h-full overflow-hidden transition-transform duration-300 ease-out"
              style={{
                width: containerRef.current ? containerRef.current.clientWidth : "100%",
                transform:
                  isHovered && !isDragging
                    ? "scale(1.04)"
                    : "scale(1)",
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`
              }}
            >
              <img
                src={beforeImage}
                alt="Clinical Before Treatment"
                loading="lazy"
                onLoad={() => setBeforeLoaded(true)}
                className="w-full h-full object-cover object-center max-w-none"
                style={{
                  width: containerRef.current ? containerRef.current.clientWidth : "100%"
                }}
              />
            </div>
          </div>

          {/* BEFORE Label Badge (Top Left) */}
          <div className="absolute top-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md text-white border border-white/20 text-xs font-black px-4 py-2 rounded-full shadow-lg tracking-wider uppercase">
            {beforeLabel}
          </div>

          {/* Divider Line & Interactive Handle */}
          <div
            className="absolute top-0 bottom-0 z-20 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center -translate-x-1/2 cursor-ew-resize"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-10 h-10 rounded-full bg-white text-slate-900 shadow-2xl border-2 border-emerald-500 flex items-center justify-center font-black text-sm transition-transform group-hover:scale-110">
              <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9l-3 3m0 0l3 3m-3-3h14M16 9l3 3m0 0l-3 3m3-3H3" />
              </svg>
            </div>
          </div>

          {/* Fullscreen & Zoom Trigger Button (Bottom Right) */}
          <button
            onClick={() => setFullscreenModal(true)}
            className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur-md hover:bg-white text-slate-900 px-3.5 py-2 rounded-2xl shadow-xl transition-all flex items-center gap-1.5 text-xs font-extrabold cursor-pointer border border-slate-200"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-600" /> Fullscreen Zoom
          </button>
        </div>

        {/* Dynamic Symptom Breakdown Cards (Before vs After Details) */}
        {(beforeDetails.length > 0 || afterDetails.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Before Symptoms Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F9] border border-rose-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Before Concerns Identified
              </div>
              <ul className="space-y-1.5 pt-1">
                {beforeDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                    <span className="capitalize">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After Results Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F0FDF4] border border-emerald-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                After Clinical Results
              </div>
              <ul className="space-y-1.5 pt-1">
                {afterDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span className="capitalize">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen High-Resolution Inspection Modal */}
      <AnimatePresence>
        {fullscreenModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                    High Resolution Dermatology Detail
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {concernName} — Clinical Progress Comparison
                  </h3>
                </div>

                <button
                  onClick={() => setFullscreenModal(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Side by Side High-Res Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900 uppercase">
                    <span>{beforeLabel}</span>
                    <span className="text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full text-[10px]">
                      Baseline Assessment
                    </span>
                  </div>
                  <div className="h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={beforeImage}
                      alt="Before Fullscreen"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-700 uppercase">
                    <span>{afterLabel}</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px]">
                      +{improvementPercent}% Improvement
                    </span>
                  </div>
                  <div className="h-80 sm:h-96 rounded-2xl overflow-hidden border border-emerald-200 bg-slate-900">
                    <img
                      src={afterImage}
                      alt="After Fullscreen"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#F5F0EB] flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Clinical Duration: {timelineText}</span>
                <span className="text-emerald-700 font-extrabold">Verified Dermatology Case Study</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BeforeAfterSlider;
