import React, { useState, useEffect } from 'react';
import { ShoppingBag, Filter, Star, DollarSign, ArrowRight, SlidersHorizontal, Scale, CheckCircle2 } from 'lucide-react';

export default function ProductRecommendation() {
  const [filter, setFilter] = useState('All');
  const [userConcerns, setUserConcerns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Phase 3 Features
  const [maxPrice, setMaxPrice] = useState(50);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<any[]>([]);
  const [baseProducts, setBaseProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchConcerns = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`http://localhost:8000/api/v1/products/recommendations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const productList = Array.isArray(data) ? data : (data.products || []);
          // Normalize item fields (id, tags)
          const normalized = productList.map((p: any) => ({
            ...p,
            id: p.id || p.product_id || Math.random().toString(),
            tags: p.tags || (p.highlights ? String(p.highlights).replace(/[\[\]']/g, '').split(',').slice(0, 3) : [])
          }));
          setBaseProducts(normalized);
        }
      } catch (err) {
        console.error("Failed to fetch recommended products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConcerns();
  }, []);

  const categories = ['All', ...Array.from(new Set(baseProducts.map(p => p.category)))].filter(Boolean);
  const productsWithMatch = baseProducts;

  // Filter and Sort
  const filteredProducts = productsWithMatch
    .filter(p => filter === 'All' || p.category === filter)
    .filter(p => p.price <= maxPrice)
    .sort((a, b) => b.match - a.match);

  const toggleCompare = (product: any) => {
    if (selectedForCompare.find(p => p.id === product.id)) {
      setSelectedForCompare(selectedForCompare.filter(p => p.id !== product.id));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, product]);
    }
  };

  const findDupe = (product: any) => {
    const dupes = productsWithMatch.filter(p => 
      p.id !== product.id && 
      p.category === product.category && 
      p.price < product.price && 
      p.match >= product.match - 20
    );
    return dupes.length > 0 ? dupes[0] : null;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#001534] tracking-tight flex items-center gap-2 font-bold">
            <ShoppingBag className="w-8 h-8 text-[#9f7c46]" /> Recommended Products
          </h1>
          <p className="text-slate-500 mt-2">Curated products specifically matched to your skin profile and budget.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) setSelectedForCompare([]);
            }}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-medium transition ${compareMode ? 'bg-[#9f7c46] text-white border-[#9f7c46]' : 'bg-white text-[#001534] border-[#d6c7b0] hover:border-[#001534]'}`}
          >
            <Scale className="w-4 h-4" /> Compare Products {selectedForCompare.length > 0 && `(${selectedForCompare.length}/2)`}
          </button>
        </div>
      </div>

      {/* Comparison Modal / Bar */}
      {compareMode && selectedForCompare.length === 2 && (
        <div className="bg-[#001534] text-white p-6 rounded-3xl mb-8 flex flex-col md:flex-row justify-between items-center shadow-xl animate-fade-in gap-6">
          <div className="flex-1">
            <span className="text-[#d1b17d] text-xs font-bold tracking-wider uppercase block mb-1">Product 1</span>
            <h3 className="font-serif text-xl font-bold">{selectedForCompare[0].name}</h3>
            <p className="text-slate-300 text-sm mt-1">{selectedForCompare[0].brand} • ${selectedForCompare[0].price} • {selectedForCompare[0].match}% Match</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#1a2d4c] flex items-center justify-center font-bold font-serif text-[#d1b17d] shrink-0">VS</div>
          <div className="flex-1 text-right">
            <span className="text-[#d1b17d] text-xs font-bold tracking-wider uppercase block mb-1">Product 2</span>
            <h3 className="font-serif text-xl font-bold">{selectedForCompare[1].name}</h3>
            <p className="text-slate-300 text-sm mt-1">{selectedForCompare[1].match}% Match • ${selectedForCompare[1].price} • {selectedForCompare[1].brand}</p>
          </div>
        </div>
      )}

      {/* Filters & Budget */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 bg-[#fdfbf5] p-6 rounded-3xl border border-[#e5dfd1]">
        <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto hide-scrollbar">
          <Filter className="w-5 h-5 text-slate-400 flex-shrink-0" />
          {categories.map(c => (
            <button 
              key={c}
              onClick={() => setFilter(c)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition text-sm ${filter === c ? 'bg-[#001534] text-white' : 'bg-white border border-[#d6c7b0] text-slate-600 hover:border-[#001534]'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="w-full lg:w-72 flex items-center gap-4 bg-white px-4 py-3 rounded-2xl border border-[#d6c7b0]">
          <SlidersHorizontal className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Max Price</span>
              <span className="text-[#001534]">${maxPrice}</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="200" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-[#001534]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-[#9f7c46] font-bold">Matching products to your skin...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const isSelected = selectedForCompare.find(p => p.id === product.id);
            const dupe = product.price > 20 ? findDupe(product) : null;
            
            return (
              <div 
                key={product.id} 
                className={`bg-white rounded-3xl border shadow-sm transition overflow-hidden flex flex-col group ${compareMode ? 'cursor-pointer hover:border-[#9f7c46]' : ''} ${isSelected ? 'border-[#9f7c46] ring-2 ring-[#9f7c46]/20' : 'border-[#e5dfd1]'}`}
                onClick={() => compareMode && toggleCompare(product)}
              >
                <div className="h-48 bg-[#fdfbf5] flex items-center justify-center p-6 relative overflow-hidden">
                  {compareMode && (
                    <div className={`absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#9f7c46] border-[#9f7c46] text-white' : 'border-slate-300 bg-white/50'}`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3 bg-[#9f7c46] text-white text-xs font-bold px-2 py-1 rounded-md z-10 shadow-sm">
                    {product.match}% Match
                  </div>
                  
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="h-36 object-contain mix-blend-multiply drop-shadow-md group-hover:scale-105 transition duration-500" 
                    />
                  ) : (
                    <div className="w-20 h-32 bg-white border border-[#e5dfd1] shadow-sm rounded-lg flex items-center justify-center text-[#d6c7b0]">
                      <ShoppingBag className="w-8 h-8 opacity-50" />
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9f7c46] block mb-1">{product.brand}</span>
                  <h3 className="font-bold font-serif text-[#001534] mb-2 leading-tight flex-1 text-lg">{product.name}</h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-[#9f7c46] text-sm font-bold">
                      <Star className="w-4 h-4 fill-current mr-1" /> {product.rating}
                    </div>
                    <div className="flex items-center text-slate-700 font-bold text-lg">
                      <DollarSign className="w-4 h-4" /> {product.price}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.tags.map((tag: string) => (
                      <span key={tag} className="bg-[#f6f2e9] text-[#001534] text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {dupe && !compareMode && (
                    <div className="mb-4 bg-green-50 border border-green-100 rounded-lg p-2.5 text-xs text-green-700 font-medium">
                      <strong className="block text-green-800 mb-0.5">💰 Save ${(product.price - dupe.price).toFixed(0)}</strong>
                      Alternative: {dupe.brand} {dupe.name} ({dupe.match}% match)
                    </div>
                  )}

                  {!compareMode && (
                    <button className="w-full mt-auto flex items-center justify-center gap-2 bg-[#001534] text-white py-3 rounded-xl font-bold hover:bg-[#1a2d4c] transition text-sm shadow-sm">
                      View Details <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
