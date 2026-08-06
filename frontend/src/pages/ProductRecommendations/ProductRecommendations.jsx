import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Sparkles, Layers, Star, X, Eye, Award, Heart, CheckCircle2, ShoppingBag,
  Filter, CheckSquare, ArrowRight, IndianRupee, ShieldCheck
} from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";
import api from "../../services/api";

const CATEGORIES = [
  "All Categories", "Cleanser", "Serum", "Moisturizer", "Sunscreen", "Night Cream", "Treatment"
];

const BUDGET_TIERS = [
  "All Budgets", "₹500", "₹1000", "₹2500", "₹5000+"
];

const SKIN_TYPES = [
  "All Skin Types", "Oily", "Dry", "Combination", "Sensitive", "Normal"
];

export default function ProductRecommendations() {
  const [recommendData, setRecommendData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedBudget, setSelectedBudget] = useState("All Budgets");
  const [selectedSkinType, setSelectedSkinType] = useState("All Skin Types");
  const [searchQuery, setSearchQuery] = useState("");
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/api/v1/products/recommend");
      if (res.data) setRecommendData(res.data);
    } catch {
      // Mock catalog fallback
    }
  };

  const defaultProducts = [
    {
      id: 1,
      product_name: "CeraVe Hydrating Facial Cleanser",
      brand: "CeraVe",
      category: "Cleanser",
      price: 1299,
      rating: 4.8,
      main_ingredient: "Ceramides NP/AP, Hyaluronic Acid",
      benefit: "Restores skin barrier, non-foaming hydrating cleanse",
      match_percentage: 98,
      skin_type: "Dry, Sensitive, Normal",
      why_recommended: "High Ceramide concentration repairs lipid barrier without stripping essential oils",
      budget_tag: "₹1000",
      clinical_rating: "4.8/5.0 Clinical Trial",
      suitable_for: "Daily AM & PM Gentle Cleansing",
      image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 2,
      product_name: "The Ordinary Niacinamide 10% + Zinc 1%",
      brand: "The Ordinary",
      category: "Serum",
      price: 850,
      rating: 4.6,
      main_ingredient: "Niacinamide 10%, Zinc PCA 1%",
      benefit: "Reduces skin blemishes and balances surface sebum",
      match_percentage: 96,
      skin_type: "Oily, Combination",
      why_recommended: "Clinical strength Niacinamide targets active acne lesions and regulates T-zone oil",
      budget_tag: "₹1000",
      clinical_rating: "4.6/5.0 Clinical Trial",
      suitable_for: "AM & PM Targeted Blemish Care",
      image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 3,
      product_name: "La Roche-Posay Hyalu B5 Serum",
      brand: "La Roche-Posay",
      category: "Serum",
      price: 2450,
      rating: 4.7,
      main_ingredient: "Hyaluronic Acid, Centella Asiatica",
      benefit: "Deep hydration, soothing, plumping skin barrier",
      match_percentage: 94,
      skin_type: "Dry, Sensitive, Combination",
      why_recommended: "Multi-weight Hyaluronic Acid locks deep dermal moisture and calms micro-flushing",
      budget_tag: "₹2500",
      clinical_rating: "4.7/5.0 Clinical Trial",
      suitable_for: "Dehydrated & Sensitive Skin",
      image_url: "https://images.unsplash.com/photo-1608248597263-000799965d4a?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 4,
      product_name: "Paula's Choice 2% BHA Liquid Exfoliant",
      brand: "Paula's Choice",
      category: "Treatment",
      price: 2700,
      rating: 4.9,
      main_ingredient: "Salicylic Acid 2%, Green Tea Extract",
      benefit: "Unclogs pores, dissolves blackheads & refines texture",
      match_percentage: 92,
      skin_type: "Oily, Combination, Acne-Prone",
      why_recommended: "Lipid-soluble BHA penetrates pore channels to clear comedones and smooth roughness",
      budget_tag: "₹2500",
      clinical_rating: "4.9/5.0 Clinical Trial",
      suitable_for: "2-3x Weekly Pore Decongestion",
      image_url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 5,
      product_name: "Minimalist 10% Vitamin C Face Serum",
      brand: "Minimalist",
      category: "Serum",
      price: 699,
      rating: 4.5,
      main_ingredient: "Ethyl Ascorbic Acid 10%, Acetyl Glucosamine",
      benefit: "Brightens dull skin tone and fades hyperpigmentation",
      match_percentage: 91,
      skin_type: "All Skin Types",
      why_recommended: "Stable Vitamin C derivative offers antioxidant protection against environmental photoaging",
      budget_tag: "₹1000",
      clinical_rating: "4.5/5.0 Clinical Trial",
      suitable_for: "Morning Radiance & Antioxidant Protection",
      image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 6,
      product_name: "SkinCeuticals C E Ferulic Combination Antioxidant",
      brand: "SkinCeuticals",
      category: "Serum",
      price: 5800,
      rating: 4.9,
      main_ingredient: "L-Ascorbic Acid 15%, Alpha Tocopherol 1%",
      benefit: "Gold standard antioxidant serum for severe photoaging",
      match_percentage: 95,
      skin_type: "Normal, Dry, Mature",
      why_recommended: "Patented synergy neutralizes free radicals and boosts photoprotection by 8x",
      budget_tag: "₹5000+",
      clinical_rating: "4.9/5.0 Medical Grade Trial",
      suitable_for: "Luxury Medical Photoprotection",
      image_url: "https://images.unsplash.com/photo-1608248597263-000799965d4a?auto=format&fit=crop&w=400&q=80",
    }
  ];

  const rawProducts = recommendData?.recommended_products || defaultProducts;

  const filteredProducts = rawProducts.filter(p => {
    const matchCat = selectedCategory === "All Categories" || p.category === selectedCategory;
    const matchBud = selectedBudget === "All Budgets" || p.budget_tag === selectedBudget || (selectedBudget === "₹500" && p.price <= 500) || (selectedBudget === "₹1000" && p.price <= 1000) || (selectedBudget === "₹2500" && p.price <= 2500) || (selectedBudget === "₹5000+" && p.price > 2500);
    const matchSt = selectedSkinType === "All Skin Types" || (p.skin_type && p.skin_type.includes(selectedSkinType));
    const matchSearch = !searchQuery || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()) || p.main_ingredient.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchBud && matchSt && matchSearch;
  });

  const toggleCompare = (p) => {
    if (compareList.some(item => item.id === p.id)) {
      setCompareList(compareList.filter(item => item.id !== p.id));
    } else {
      if (compareList.length >= 3) {
        toast.error("You can compare up to 3 products at a time.");
        return;
      }
      setCompareList([...compareList, p]);
    }
  };

  const addToRoutine = (p) => {
    toast.success(`${p.product_name} added to your AI Routine Planner!`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <ShoppingBag className="w-3.5 h-3.5" /> AI Product Recommendation Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Clinical Product Match Catalog</h1>
          <p className="text-slate-400 text-sm mt-1">Formulations matched to your skin profile, active concerns, and budget tier</p>
        </div>

        {compareList.length > 0 && (
          <button
            onClick={() => setShowCompareModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Layers className="w-4 h-4" />
            <span>Compare ({compareList.length}) Selected</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <GlassCard className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Search Products / Ingredients</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search CeraVe, Niacinamide..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Budget Tier</label>
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              {BUDGET_TIERS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Skin Type</label>
            <select
              value={selectedSkinType}
              onChange={(e) => setSelectedSkinType(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              {SKIN_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p) => {
          const isComparing = compareList.some(item => item.id === p.id);
          return (
            <GlassCard key={p.id} className="p-6 flex flex-col justify-between space-y-4 group">
              <div className="space-y-4">
                {/* Image & Match Badge */}
                <div className="h-44 w-full rounded-xl overflow-hidden relative bg-slate-950">
                  <img src={p.image_url} alt={p.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs px-3 py-1 rounded-full shadow-lg">
                    {p.match_percentage}% Match
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-amber-400 font-bold text-xs px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{p.rating}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span>{p.brand}</span>
                    <span className="text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{p.budget_tag || "₹1000"}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-white leading-snug group-hover:text-cyan-300 transition-all">{p.product_name}</h3>

                  <div className="text-xs text-slate-300 font-semibold">
                    Price: <span className="text-white font-bold">₹{p.price}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[11px] font-bold text-cyan-400">Why Recommended:</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{p.why_recommended || p.benefit}</p>
                  </div>

                  <div className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Active Ingredients: </span>
                    <span>{p.main_ingredient}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedDetail(p)}
                  className="py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>
                <button
                  onClick={() => toggleCompare(p)}
                  className={`py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    isComparing ? "border-cyan-500 bg-cyan-500/20 text-cyan-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Compare
                </button>
                <button
                  onClick={() => addToRoutine(p)}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Compare Modal */}
      {showCompareModal && compareList.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="max-w-4xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" /> Clinical Product Side-by-Side Comparison
              </h3>
              <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compareList.map(p => (
                <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-sm">{p.product_name}</h4>
                  <div className="text-xs text-cyan-400 font-bold">{p.match_percentage}% Match</div>
                  <div className="text-xs text-slate-300 font-bold">₹{p.price}</div>
                  <div className="text-xs text-slate-400"><strong>Actives:</strong> {p.main_ingredient}</div>
                  <div className="text-xs text-slate-400"><strong>Why:</strong> {p.why_recommended}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}