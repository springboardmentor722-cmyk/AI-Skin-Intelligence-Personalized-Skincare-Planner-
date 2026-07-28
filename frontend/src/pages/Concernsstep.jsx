import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Sparkles, HelpCircle, Plus, Search, X } from "lucide-react";

const STEPS = [
  { number: "01", label: "Skin Type" },
  { number: "02", label: "Skin Concerns", active: true },
  { number: "03", label: "Lifestyle" },
  { number: "04", label: "Face Analysis" },
  { number: "05", label: "AI Recommendation" },
];

const CONCERN_CARDS = [
  {
    id: "Acne",
    name: "Acne",
    description: "Pimples, breakouts or active acne",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Post Acne Marks",
    name: "Post Acne Marks",
    description: "Dark marks left after acne healing",
    image: "https://images.unsplash.com/photo-1512290900676-26c2a4d4b51b?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Hyperpigmentation",
    name: "Hyperpigmentation",
    description: "Dark patches or uneven skin tone",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Redness",
    name: "Redness",
    description: "Irritated, inflamed or sensitive skin",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Dry Skin",
    name: "Dry Skin",
    description: "Flaky, rough or tight skin",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Oily Skin",
    name: "Oily Skin",
    description: "Excess oil or shiny appearance",
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Enlarged Pores",
    name: "Enlarged Pores",
    description: "Visible or large pores",
    image: "https://images.unsplash.com/photo-1608248597279-b3c6b6a7b16f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Blackheads",
    name: "Blackheads",
    description: "Blocked pores and dark spots",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Whiteheads",
    name: "Whiteheads",
    description: "Small clogged bumps",
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Uneven Skin Tone",
    name: "Uneven Skin Tone",
    description: "Dull or uneven complexion",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Fine Lines & Wrinkles",
    name: "Fine Lines & Wrinkles",
    description: "Early aging signs",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "Dark Circles",
    name: "Dark Circles",
    description: "Under-eye darkness or puffiness",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
];

export default function ConcernsStep({ form, setForm, onNext, onBack, onSkip }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNotSure, setIsNotSure] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [allergiesText, setAllergiesText] = useState(form?.allergies || "");
  const [sensitivitiesText, setSensitivitiesText] = useState(form?.sensitivities || "");

  const toggle = (value) => {
    setForm((f) => {
      const currentConcerns = f.skin_concerns || [];
      const exists = currentConcerns.includes(value);
      return {
        ...f,
        skin_concerns: exists
          ? currentConcerns.filter((v) => v !== value)
          : [...currentConcerns, value],
      };
    });
  };

  const filtered = CONCERN_CARDS.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 font-sans text-[#2F3542]">
      
      {/* 1. TOP STEP INDICATOR (5 STEPS) */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-2 border-b border-purple-100/60">
        {STEPS.map((s, idx) => (
          <div key={s.number} className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                s.active
                  ? "bg-[#A78BFA] text-white shadow-sm"
                  : "bg-purple-50 text-purple-400"
              }`}
            >
              {s.number}
            </span>
            <span
              className={`text-xs font-semibold ${
                s.active ? "text-purple-900 font-bold" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
            {idx < STEPS.length - 1 && <span className="text-gray-300 mx-1">›</span>}
          </div>
        ))}
      </div>

      {/* 2. HEADING & SUBTITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2F3542] tracking-tight flex items-center gap-2">
            What are your main skin concerns? <Sparkles className="w-5 h-5 text-[#A78BFA]" />
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Select all concerns that apply. Our AI will personalize your skincare analysis.
          </p>
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search skin concern..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-full border border-purple-100 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#A78BFA] shadow-xs"
          />
        </div>
      </div>

      {/* 3. SKIN CONCERN CARDS GRID (12 LUXURY CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-h-[460px] overflow-y-auto pr-1">
        {filtered.map((card) => {
          const active = (form?.skin_concerns || []).includes(card.id) || (form?.skin_concerns || []).includes(card.name);
          return (
            <div
              key={card.id}
              onClick={() => toggle(card.id)}
              className={`relative cursor-pointer rounded-[18px] border overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 ${
                active
                  ? "border-[#A78BFA] bg-purple-50/50 shadow-md shadow-purple-100/60 ring-2 ring-[#A78BFA]/30"
                  : "border-purple-100/80 bg-white hover:border-purple-300 hover:shadow-sm"
              }`}
            >
              {/* Image Container */}
              <div className="relative h-24 overflow-hidden bg-purple-50/40">
                <img
                  src={card.image}
                  alt={card.name}
                  onError={(e) => { e.target.style.display = "none"; }}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                
                {/* Small AI Icon Badge at Bottom Center */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs border border-purple-200 flex items-center justify-center shadow-xs">
                  <Sparkles className={`w-3 h-3 ${active ? "text-[#A78BFA]" : "text-purple-400"}`} />
                </div>

                {/* Selection Checkbox Top-Right */}
                <div
                  className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                    active ? "bg-gradient-to-r from-[#A78BFA] to-[#F9A8D4] text-white shadow-xs" : "bg-white/90 border border-gray-300"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </div>
              </div>

              {/* Title & Short Medical Description */}
              <div className="p-2.5 text-center flex-1 flex flex-col justify-between bg-white">
                <h3 className={`text-xs font-bold leading-tight ${active ? "text-purple-900" : "text-[#2F3542]"}`}>
                  {card.name}
                </h3>
                <p className="text-[10px] text-gray-500 leading-tight mt-1">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. OTHER & I'M NOT SURE SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Other Concern Input Card */}
        <div className={`p-3.5 rounded-[18px] border flex items-center gap-3 ${otherText.trim() ? "border-[#A78BFA] bg-purple-50/40" : "border-purple-100 bg-white"}`}>
          <div className="w-8 h-8 rounded-full border border-purple-200 flex items-center justify-center shrink-0 text-[#A78BFA]">
            <Plus className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-[#2F3542]">Other</p>
            <p className="text-[10px] text-gray-400 mb-1">Describe your concern</p>
            <input
              type="text"
              placeholder="Type here..."
              value={otherText}
              onChange={(e) => {
                const val = e.target.value;
                setOtherText(val);
                if (val.trim()) {
                  setForm((f) => ({
                    ...f,
                    skin_concerns: [...(f.skin_concerns || []).filter((x) => !x.startsWith("Other: ")), `Other: ${val.trim()}`],
                  }));
                }
              }}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-purple-100 focus:outline-none focus:border-[#A78BFA]"
            />
          </div>
        </div>

        {/* I'm Not Sure Option */}
        <div
          onClick={() => setIsNotSure(!isNotSure)}
          className={`p-3.5 rounded-[18px] border cursor-pointer flex items-center gap-3 transition-all ${
            isNotSure ? "border-[#A78BFA] bg-purple-50/40" : "border-purple-100 bg-white hover:border-purple-300"
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isNotSure ? "bg-[#A78BFA] text-white" : "bg-purple-100 text-[#A78BFA]"}`}>
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className={`text-xs font-bold ${isNotSure ? "text-purple-900" : "text-[#2F3542]"}`}>I'm Not Sure</p>
            <p className="text-[10.5px] text-gray-500 leading-tight">
              Don't worry! Upload your face photo in the next step and our AI will detect your skin concerns automatically.
            </p>
          </div>
        </div>
      </div>

      {/* 5. ALLERGIES & SENSITIVITIES INPUTS */}
      <div className="p-4 rounded-[18px] border border-purple-100 bg-white space-y-3">
        <h4 className="text-xs font-bold text-gray-700">Allergies & Sensitivities (Optional)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10.5px] text-gray-400 mb-1 block">Allergies</label>
            <input
              type="text"
              placeholder="Separate multiple with commas"
              value={allergiesText}
              onChange={(e) => {
                setAllergiesText(e.target.value);
                setForm((f) => ({ ...f, allergies: e.target.value }));
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-purple-100 focus:outline-none focus:border-[#A78BFA]"
            />
          </div>

          <div>
            <label className="text-[10.5px] text-gray-400 mb-1 block">Sensitivities</label>
            <input
              type="text"
              placeholder="Separate multiple with commas"
              value={sensitivitiesText}
              onChange={(e) => {
                setSensitivitiesText(e.target.value);
                setForm((f) => ({ ...f, sensitivities: e.target.value }));
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-purple-100 focus:outline-none focus:border-[#A78BFA]"
            />
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ACTION BUTTONS */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onBack}
          className="rounded-full border border-purple-200 text-gray-700 font-semibold px-6 py-3 text-xs hover:bg-purple-50/50 transition-colors flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-full bg-gradient-to-r from-[#A78BFA] to-[#F9A8D4] text-white font-bold py-3 text-xs flex items-center justify-center gap-2 shadow-md shadow-pink-200/80 hover:opacity-95 transition-all"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}