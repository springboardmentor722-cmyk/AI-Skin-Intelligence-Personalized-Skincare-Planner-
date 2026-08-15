// frontend/src/pages/IngredientAnalyzer.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

const API_BASE_URL = 'http://localhost:8000';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url}`;
};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/40x40/6C5CE7/FFFFFF?text=No+Image';

function IngredientAnalyzer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/ingredient-analyzer');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [ingredientDetail, setIngredientDetail] = useState(null);
  const [safetyRating, setSafetyRating] = useState(null);
  const [ingredientProducts, setIngredientProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const saved = localStorage.getItem('recentIngredientSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, [navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError('');
    setSelectedIngredient(null);
    setIngredientDetail(null);
    setSafetyRating(null);
    setIngredientProducts([]);
    setShowResults(true);

    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/v1/ingredients/search', {
        params: { token, q: searchQuery.trim(), limit: 20 }
      });
      
      setSearchResults(response.data.ingredients || []);
      
      const newRecent = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentIngredientSearches', JSON.stringify(newRecent));
      
      if (response.data.ingredients.length === 0) {
        setError('No ingredients found. Try a different search term.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const viewIngredient = async (ingredient) => {
    setSelectedIngredient(ingredient);
    setLoading(true);
    setError('');
    setIngredientProducts([]);

    try {
      const token = localStorage.getItem('token');
      
      const detailRes = await api.get(`/api/v1/ingredients/${ingredient.id}`, {
        params: { token }
      });
      setIngredientDetail(detailRes.data);

      const safetyRes = await api.get(`/api/v1/ingredients/safety-rating/${ingredient.name}`, {
        params: { token }
      });
      setSafetyRating(safetyRes.data);

      const productsRes = await api.get(`/api/v1/ingredients/${ingredient.id}/products`, {
        params: { token, limit: 50 }
      });
      setIngredientProducts(productsRes.data.products || []);

    } catch (err) {
      setError('Failed to load ingredient details.');
    } finally {
      setLoading(false);
    }
  };

  const viewProductsWithIngredient = () => {
    if (!selectedIngredient) return;
    localStorage.setItem('filterIngredient', selectedIngredient.name);
    navigate('/products');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedIngredient(null);
    setIngredientDetail(null);
    setSafetyRating(null);
    setIngredientProducts([]);
    setError('');
    setShowResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    setActiveMenu(path);
    navigate(path);
  };

  const getComedogenicityLabel = (value) => {
    if (!value || value === 'None' || value === 'null') {
      return { label: 'Not classified', color: '#667085', description: 'No comedogenicity data available for this ingredient.' };
    }
    const num = parseFloat(value);
    if (num <= 1) return { label: 'Low (Safe)', color: '#2D9D82', description: 'Unlikely to clog pores. Safe for most skin types.' };
    if (num <= 2) return { label: 'Moderate', color: '#D9913D', description: 'May clog pores in acne-prone skin. Use with caution.' };
    if (num <= 3) return { label: 'High', color: '#D97745', description: 'Likely to clog pores. Avoid if prone to breakouts.' };
    return { label: 'Very High', color: '#C2415A', description: 'Highly comedogenic. Not recommended for acne-prone skin.' };
  };

  const getIrritancyLabel = (value) => {
    if (!value || value === 'None' || value === 'null') {
      return { label: 'Not classified', color: '#667085', description: 'No irritancy data available for this ingredient.' };
    }
    const num = parseFloat(value);
    if (num <= 1) return { label: 'Low (Safe)', color: '#2D9D82', description: 'Unlikely to cause irritation. Suitable for sensitive skin.' };
    if (num <= 2) return { label: 'Moderate', color: '#D9913D', description: 'May cause mild irritation in sensitive skin.' };
    if (num <= 3) return { label: 'High', color: '#D97745', description: 'Can cause significant irritation. Patch test recommended.' };
    return { label: 'Very High', color: '#C2415A', description: 'Highly irritating. Not suitable for sensitive skin.' };
  };

  const mainMenu = [];

  return (
    <div style={styles.container}>
      <PatientSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <button style={{...styles.toggleBtn, left: sidebarOpen ? '250px' : '64px'}} onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '◀' : '▶'}
      </button>

      <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>🧪 Ingredient Analyzer</h1>
            <p style={styles.pageSubtitle}>Search and analyze skincare ingredients for safety and suitability.</p>
          </div>
          <div style={styles.topBarRight}>
            <div style={styles.dateChip}>📅 {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div style={styles.profileChip}>
              <div style={styles.avatarCircle}>{localStorage.getItem('userName')?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div>
                <div style={styles.profileName}>{localStorage.getItem('userName') || 'User'}</div>
                <div style={styles.profileRole}>User</div>
              </div>
            </div>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.searchCard}>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for an ingredient (e.g., Niacinamide, Retinol)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchBtn} disabled={isSearching}>
              {isSearching ? '⏳ Searching...' : '🔍 Search'}
            </button>
            {searchQuery && (
              <button type="button" style={styles.clearBtn} onClick={clearSearch}>
                ✕
              </button>
            )}
          </form>

          {recentSearches.length > 0 && !showResults && !selectedIngredient && (
            <div style={styles.recentSearches}>
              <span style={styles.recentLabel}>Recent:</span>
              {recentSearches.map((term, index) => (
                <button
                  key={index}
                  style={styles.recentTag}
                  onClick={() => {
                    setSearchQuery(term);
                    handleSearch({ preventDefault: () => {} });
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {showResults && searchResults.length > 0 && !selectedIngredient && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📋 Search Results ({searchResults.length})</h3>
            <div style={styles.resultList}>
              {searchResults.map((ing) => (
                <div
                  key={ing.id}
                  style={styles.resultItem}
                  onClick={() => viewIngredient(ing)}
                >
                  <div style={styles.resultName}>{ing.name}</div>
                  <div style={styles.resultTags}>
                    {ing.functions && ing.functions.length > 0 && (
                      <span style={styles.resultTag}>{ing.functions.slice(0, 2).join(', ')}</span>
                    )}
                  </div>
                  <span style={styles.resultArrow}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedIngredient && ingredientDetail && safetyRating && (
          <div style={styles.detailCard}>
            <div style={styles.detailHeader}>
              <div>
                <h2 style={styles.detailTitle}>{ingredientDetail.name}</h2>
                <div style={styles.detailSubtitle}>
                  {ingredientDetail.category && <span>Category: {ingredientDetail.category}</span>}
                  {ingredientDetail.rating && <span> | Rating: {ingredientDetail.rating}</span>}
                </div>
              </div>
              <button style={styles.detailBackBtn} onClick={clearSearch}>
                ← Back to Results
              </button>
            </div>

            <div style={styles.safetySection}>
              <div style={{...styles.safetyScore, borderColor: safetyRating.color}}>
                <span style={styles.safetyScoreLabel}>Safety Score</span>
                <span style={{...styles.safetyScoreValue, color: safetyRating.color}}>
                  {safetyRating.safety_score}
                </span>
                <span style={{...styles.safetyScoreLabel, color: safetyRating.color}}>
                  {safetyRating.safety_label}
                </span>
              </div>
              {safetyRating.warnings && safetyRating.warnings.length > 0 && (
                <div style={styles.warningList}>
                  {safetyRating.warnings.map((w, i) => (
                    <div key={i} style={styles.warningItem}>⚠️ {w}</div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.propertiesGrid}>
              <div style={styles.propertyCard}>
                <div style={styles.propertyLabel}>Comedogenicity</div>
                <div style={{...styles.propertyValue, color: getComedogenicityLabel(ingredientDetail.comedogenicity).color}}>
                  {ingredientDetail.comedogenicity || 'Not classified'}
                </div>
                <div style={styles.propertyDesc}>{getComedogenicityLabel(ingredientDetail.comedogenicity).description}</div>
              </div>
              <div style={styles.propertyCard}>
                <div style={styles.propertyLabel}>Irritancy</div>
                <div style={{...styles.propertyValue, color: getIrritancyLabel(ingredientDetail.irritancy).color}}>
                  {ingredientDetail.irritancy || 'Not classified'}
                </div>
                <div style={styles.propertyDesc}>{getIrritancyLabel(ingredientDetail.irritancy).description}</div>
              </div>
              <div style={styles.propertyCard}>
                <div style={styles.propertyLabel}>Functions</div>
                <div style={styles.propertyValue}>
                  {ingredientDetail.functions && ingredientDetail.functions.length > 0 ? (
                    ingredientDetail.functions.slice(0, 4).join(', ')
                  ) : (
                    'No functions listed'
                  )}
                </div>
                <div style={styles.propertyDesc}>Primary uses in skincare formulations</div>
              </div>
            </div>

            <div style={styles.productsSection}>
              <div style={styles.productsHeader}>
                <h4 style={styles.productsTitle}>
                  🛍️ Products containing this ingredient ({ingredientProducts.length || ingredientDetail.total_products || 0})
                </h4>
                {ingredientProducts.length > 0 && (
                  <button style={styles.viewAllProductsBtn} onClick={viewProductsWithIngredient}>
                    View All Products →
                  </button>
                )}
              </div>
              {ingredientProducts.length > 0 ? (
                <div style={styles.productList}>
                  {ingredientProducts.slice(0, 5).map((p) => (
                    <div key={p.id} style={styles.productItem}>
                      <img 
                        src={getImageUrl(p.image_url) || PLACEHOLDER_IMAGE}
                        alt={p.name}
                        style={styles.productImage}
                        onError={(e) => { 
                          e.target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div style={styles.productInfo}>
                        <div style={styles.productName}>{p.name}</div>
                        <div style={styles.productBrand}>{p.brand} • {p.category || 'Uncategorized'}</div>
                      </div>
                      <button 
                        style={styles.productViewBtn}
                        onClick={() => {
                          localStorage.setItem('filterIngredient', selectedIngredient.name);
                          navigate('/products');
                        }}
                      >
                        View Product
                      </button>
                    </div>
                  ))}
                  {ingredientProducts.length > 5 && (
                    <div style={styles.moreProducts}>
                      + {ingredientProducts.length - 5} more products
                    </div>
                  )}
                </div>
              ) : (
                <p style={styles.emptyText}>No products found containing this ingredient.</p>
              )}
            </div>
          </div>
        )}

        {!showResults && !selectedIngredient && !isSearching && !error && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔬</div>
            <h3 style={styles.emptyTitle}>Search for an Ingredient</h3>
            <p style={styles.emptyText}>
              Enter an ingredient name to learn about its safety, functions, and which products contain it.
            </p>
            <div style={styles.exampleTags}>
              <span style={styles.exampleTag} onClick={() => { setSearchQuery('Niacinamide'); handleSearch({ preventDefault: () => {} }); }}>
                Niacinamide
              </span>
              <span style={styles.exampleTag} onClick={() => { setSearchQuery('Retinol'); handleSearch({ preventDefault: () => {} }); }}>
                Retinol
              </span>
              <span style={styles.exampleTag} onClick={() => { setSearchQuery('Salicylic Acid'); handleSearch({ preventDefault: () => {} }); }}>
                Salicylic Acid
              </span>
              <span style={styles.exampleTag} onClick={() => { setSearchQuery('Hyaluronic Acid'); handleSearch({ preventDefault: () => {} }); }}>
                Hyaluronic Acid
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#F7F8FC', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif' },
  sidebar: { backgroundColor: '#13213D', borderRight: '1px solid #263B63', padding: '20px 12px', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto', transition: 'width 0.2s ease', zIndex: 100, boxSizing: 'border-box' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', padding: '0 8px' },
  sidebarLogoIcon: { fontSize: '24px' },
  sidebarLogoText: { fontSize: '15px', fontWeight: '700', color: '#13213D' },
  sidebarLogoSub: { fontSize: '11px', color: '#6F63D8', fontWeight: '600' },
  sidebarSectionLabel: { fontSize: '11px', fontWeight: '700', color: '#98A2B3', letterSpacing: '0.5px', padding: '10px 12px 6px' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '2px' },
  sidebarNavItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', width: '100%', backgroundColor: 'transparent', color: '#667085', border: 'none', borderRadius: '18px', cursor: 'pointer', fontSize: '13.5px', fontFamily: 'inherit', textAlign: 'left', whiteSpace: 'nowrap' },
  sidebarNavItemActive: { backgroundColor: '#EEECFF', color: '#13213D', fontWeight: '600', boxShadow: '0 4px 10px rgba(108,92,231,0.35)' },
  navIcon: { fontSize: '16px', flexShrink: 0, width: '18px', textAlign: 'center' },
  sidebarLogout: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', width: '100%', backgroundColor: 'transparent', color: '#C2415A', border: '1px solid #F1B8C0', borderRadius: '18px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', marginTop: 'auto', flexShrink: 0, whiteSpace: 'nowrap' },
  toggleBtn: { position: 'fixed', top: '18px', zIndex: 101, backgroundColor: '#FFFFFF', border: '1px solid #E6EAF2', color: '#667085', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '11px', transition: 'left 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(-50%)' },
  mainContent: { flex: 1, padding: '24px 32px', transition: 'margin-left 0.2s ease' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' },
  pageTitle: { fontSize: '22px', color: '#13213D', margin: 0, fontWeight: '700' },
  pageSubtitle: { fontSize: '14px', color: '#667085', margin: '4px 0 0' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '14px' },
  dateChip: { background: '#FFFFFF', border: '1px solid #E6EAF2', borderRadius: '18px', padding: '8px 14px', fontSize: '13px', color: '#344054' },
  profileChip: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarCircle: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#EEECFF', color: '#13213D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '15px' },
  profileName: { fontSize: '13px', fontWeight: '600', color: '#13213D' },
  profileRole: { fontSize: '11px', color: '#667085' },
  error: { backgroundColor: '#FFF2F3', color: '#C2415A', padding: '12px', borderRadius: '18px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' },
  searchCard: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E6EAF2', marginBottom: '20px' },
  searchForm: { display: 'flex', gap: '10px', alignItems: 'center' },
  searchInput: { flex: 1, padding: '10px 14px', border: '1px solid #E6EAF2', borderRadius: '18px', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#FFFFFF', outline: 'none', minWidth: '200px' },
  searchBtn: { padding: '10px 20px', backgroundColor: '#EEECFF', color: '#13213D', border: 'none', borderRadius: '18px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  clearBtn: { padding: '8px 12px', backgroundColor: '#C2415A', color: '#FFFFFF', border: 'none', borderRadius: '18px', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit' },
  recentSearches: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', alignItems: 'center' },
  recentLabel: { fontSize: '12px', color: '#667085', fontWeight: '500' },
  recentTag: { padding: '4px 12px', backgroundColor: '#F4F5F9', border: '1px solid #E6EAF2', borderRadius: '22px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#344054' },
  card: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E6EAF2', marginBottom: '20px' },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#13213D', marginTop: 0, marginBottom: '12px', borderBottom: '1px solid #F4F5F9', paddingBottom: '10px' },
  resultList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  resultItem: { display: 'flex', alignItems: 'center', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '18px', cursor: 'pointer', transition: 'all 0.2s' },
  resultName: { flex: 1, fontSize: '14px', fontWeight: '500', color: '#13213D' },
  resultTags: { display: 'flex', gap: '6px', marginRight: '12px' },
  resultTag: { padding: '2px 10px', backgroundColor: '#E6EAF2', borderRadius: '18px', fontSize: '11px', color: '#667085' },
  resultArrow: { fontSize: '18px', color: '#667085' },
  detailCard: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '18px', border: '1px solid #E6EAF2', marginBottom: '20px' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  detailTitle: { fontSize: '22px', fontWeight: '700', color: '#13213D', margin: 0 },
  detailSubtitle: { fontSize: '13px', color: '#667085', marginTop: '4px' },
  detailBackBtn: { padding: '6px 14px', backgroundColor: '#F4F5F9', border: '1px solid #E6EAF2', borderRadius: '18px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', color: '#344054' },
  safetySection: { display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '18px', marginBottom: '20px', flexWrap: 'wrap' },
  safetyScore: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 24px', border: '2px solid #2D9D82', borderRadius: '18px', minWidth: '120px' },
  safetyScoreLabel: { fontSize: '11px', color: '#667085' },
  safetyScoreValue: { fontSize: '28px', fontWeight: '700' },
  warningList: { flex: 1 },
  warningItem: { fontSize: '13px', color: '#8B5E2B', padding: '2px 0' },
  propertiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' },
  propertyCard: { backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '18px', textAlign: 'center' },
  propertyLabel: { fontSize: '11px', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.5px' },
  propertyValue: { fontSize: '18px', fontWeight: '600', padding: '4px 0' },
  propertyDesc: { fontSize: '12px', color: '#667085', lineHeight: '1.4' },
  productsSection: { marginTop: '16px', borderTop: '1px solid #E6EAF2', paddingTop: '16px' },
  productsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' },
  productsTitle: { fontSize: '14px', fontWeight: '600', color: '#13213D', margin: 0 },
  viewAllProductsBtn: { padding: '6px 16px', backgroundColor: '#EEECFF', color: '#13213D', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' },
  productList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  productItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '18px' },
  productImage: { width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', backgroundColor: '#E6EAF2' },
  productInfo: { flex: 1 },
  productName: { fontSize: '13px', fontWeight: '500', color: '#13213D' },
  productBrand: { fontSize: '11px', color: '#667085' },
  productViewBtn: { padding: '4px 12px', backgroundColor: '#EEECFF', color: '#13213D', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' },
  moreProducts: { textAlign: 'center', fontSize: '12px', color: '#667085', padding: '8px' },
  emptyState: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E6EAF2' },
  emptyIcon: { fontSize: '56px', marginBottom: '16px' },
  emptyTitle: { fontSize: '18px', fontWeight: '600', color: '#13213D', marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: '#667085', maxWidth: '400px', margin: '0 auto' },
  exampleTags: { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '16px' },
  exampleTag: { padding: '6px 16px', backgroundColor: '#F4F5F9', border: '1px solid #E6EAF2', borderRadius: '22px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', color: '#344054', transition: 'all 0.2s' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

export default IngredientAnalyzer;