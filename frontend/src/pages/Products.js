// frontend/src/pages/Products.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

function Products() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterIngredient, setFilterIngredient] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const savedFilter = localStorage.getItem('filterIngredient');
    if (savedFilter) {
      setFilterIngredient(savedFilter);
      setSearchTerm(savedFilter);
      localStorage.removeItem('filterIngredient');
    }
    
    fetchCategories();
    fetchProducts();
    fetchRecommendedProducts();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/v1/products/categories', {
        params: { token }
      });
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = { token, skip: 0, limit: 200 };
      
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim();
      }
      
      if (selectedCategory && selectedCategory !== '') {
        params.category = selectedCategory;
      }
      
      const response = await api.get('/api/v1/products', { params });
      
      const products = (response.data.products || []).map(p => ({
        ...p,
        image_url: p.image_url 
          ? (p.image_url.startsWith('http') ? p.image_url : `http://localhost:8000${p.image_url}`)
          : null
      }));
      
      setAllProducts(products);
      setError('');
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Could not load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedProducts = async () => {
    setLoadingRecommended(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/v1/products/recommendations', {
        params: { token, limit: 20 }
      });
      
      const recommendations = response.data || [];
      setRecommendedProducts(recommendations);
      setHasRecommendations(recommendations.length > 0);
      
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setRecommendedProducts([]);
      setHasRecommendations(false);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    fetchProducts();
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleBuyNow = (product) => {
    alert(`🛒 "${product.name}" added to cart!\n\nPrice: $${product.price}\nBrand: ${product.brand}`);
  };

  const getSourceBadge = (source) => {
    const badges = {
      'rule_engine': { color: '#6C63D9', label: '🤖 AI Suggested' },
      'ai_analysis': { color: '#26A69A', label: '🧠 AI Analysis' },
      'consultant': { color: '#D98B32', label: '👩‍⚕️ Consultant' },
      'dermatologist': { color: '#B63B49', label: '👨‍⚕️ Dermatologist' }
    };
    return badges[source] || { color: '#778198', label: source };
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setFilterIngredient('');
    fetchProducts();
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  const ProductCard = ({ product, isRecommended, source, sourceLabel, reason }) => {
    const isWishlisted = wishlist.includes(product.id);
    
    const ingredientsList = product.ingredients_text ? 
      product.ingredients_text.split('・').slice(0, 3) : [];
    const ingredientsPreview = ingredientsList.length > 0 ? 
      '🌿 ' + ingredientsList.join(' • ') : '';

    const imageUrl = product.image_url 
      ? (product.image_url.startsWith('http') ? product.image_url : `http://localhost:8000${product.image_url}`)
      : 'https://via.placeholder.com/300x300/8B6B8B/FFFFFF?text=No+Image';

    return (
      <div style={styles.productCard}>
        <div style={styles.productImageContainer}>
          <img 
            src={imageUrl}
            alt={product.name}
            style={styles.productImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x300/8B6B8B/FFFFFF?text=' + encodeURIComponent(product.brand);
            }}
          />
          {isRecommended && source && (
            <div style={{...styles.sourceBadge, backgroundColor: getSourceBadge(source).color}}>
              {getSourceBadge(source).label}
            </div>
          )}
          <button 
            style={styles.wishlistBtn}
            onClick={() => toggleWishlist(product.id)}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
        <div style={styles.productInfo}>
          <div style={styles.productBrand}>{product.brand}</div>
          <div style={styles.productName}>{product.name}</div>
          <div style={styles.productCategory}>{product.category || 'Uncategorized'}</div>
          <div style={styles.productRating}>
            {'⭐'.repeat(Math.round(product.rating || 0))}
            {product.rating > 0 && ` ${product.rating.toFixed(1)}`}
            {product.reviews_count > 0 && ` (${product.reviews_count})`}
          </div>
          <div style={styles.productPrice}>
            ${product.price ? product.price.toFixed(2) : '0.00'}
          </div>
          
          {isRecommended && reason && (
            <div style={styles.recommendationReason}>
              💡 {reason}
            </div>
          )}
          
          {ingredientsPreview && (
            <div style={styles.ingredientsPreview}>
              {ingredientsPreview}
            </div>
          )}
          
          <div style={styles.buttonRow}>
            <button style={styles.buyNowBtn} onClick={() => handleBuyNow(product)}>
              🛒 Buy Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="patient-page">
      <PatientSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="patient-header">
          <div>
            <div className="patient-kicker">PRODUCTS</div>
            <h1 className="patient-title">🛍️ Product Recommendations</h1>
            <p className="patient-subtitle">Browse our curated collection of skincare products.</p>
          </div>
        </div>

        {error && <div className="patient-alert-error">{error}</div>}

        <div className="patient-surface">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Search by product or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                flex: 1, 
                padding: '11px 16px', 
                border: '1px solid #DCE1EC', 
                borderRadius: '12px', 
                fontSize: '14px', 
                fontFamily: 'inherit', 
                backgroundColor: '#FBFCFE', 
                outline: 'none' 
              }}
            />
            <button type="submit" style={{ 
              padding: '11px 22px', 
              backgroundColor: '#6C63D9', 
              color: '#FFFFFF', 
              border: 'none', 
              borderRadius: '12px', 
              cursor: 'pointer', 
              fontSize: '14px', 
              fontFamily: 'inherit', 
              fontWeight: '700' 
            }}>
              🔍 Search
            </button>
          </form>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <select 
              value={selectedCategory} 
              onChange={handleCategoryChange}
              style={{ 
                padding: '10px 14px', 
                border: '1px solid #DCE1EC', 
                borderRadius: '12px', 
                fontSize: '14px', 
                fontFamily: 'inherit', 
                backgroundColor: '#FFFFFF', 
                outline: 'none', 
                minWidth: '180px' 
              }}
            >
              <option value="">All Categories</option>
              {categories
                .filter(cat => {
                  const skincareKeywords = ['face', 'wash', 'cleanser', 'moisturizer', 'cream', 'lotion', 
                                            'serum', 'sunscreen', 'spf', 'toner', 'mask', 'eye', 'lip', 
                                            'exfoliator', 'scrub', 'oil', 'treatment', 'retinol', 'vitamin',
                                            'hyaluronic', 'peptide', 'niacinamide', 'night', 'day', 'bb', 
                                            'primer', 'setting'];
                  const catLower = cat.toLowerCase();
                  return skincareKeywords.some(keyword => catLower.includes(keyword));
                })
                .map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))
              }
            </select>
            {(searchTerm || selectedCategory || filterIngredient) && (
              <button onClick={clearFilters} style={{ 
                padding: '8px 16px', 
                backgroundColor: '#B63B49', 
                color: '#FFFFFF', 
                border: 'none', 
                borderRadius: '10px', 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontFamily: 'inherit' 
              }}>
                ✕ Clear Filters
              </button>
            )}
            {filterIngredient && (
              <div style={{ 
                padding: '8px 16px', 
                backgroundColor: '#EEECFF', 
                borderRadius: '10px', 
                fontSize: '14px', 
                color: '#17233C', 
                border: '1px solid #D8D4F5' 
              }}>
                🔍 Filtering by: <strong>{filterIngredient}</strong>
              </div>
            )}
          </div>
        </div>

        {!loadingRecommended && hasRecommendations && (
          <div className="patient-surface">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px', 
              borderBottom: '1px solid #E7EAF1', 
              paddingBottom: '12px' 
            }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#17233C', margin: 0 }}>🎯 Recommended for You</h3>
            </div>
            <div style={styles.productsGrid}>
              {recommendedProducts.map((rec) => (
                <ProductCard
                  key={rec.id}
                  product={rec.product}
                  isRecommended={true}
                  source={rec.source}
                  sourceLabel={rec.source_label}
                  reason={rec.reason}
                />
              ))}
            </div>
          </div>
        )}

        <div className="patient-surface">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px', 
            borderBottom: '1px solid #E7EAF1', 
            paddingBottom: '12px' 
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#17233C', margin: 0 }}>📦 Browse All Products</h3>
            <span style={{ fontSize: '13px', color: '#778198' }}>{allProducts.length} products</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
              <div className="patient-loading-spinner" style={{ width: '30px', height: '30px' }}></div>
              <p style={{ marginTop: '15px', color: '#778198', fontSize: '14px' }}>Loading products...</p>
            </div>
          ) : allProducts.length > 0 ? (
            <div style={styles.productsGrid}>
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} isRecommended={false} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '48px', marginBottom: '10px' }}>🔍</p>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#17233C' }}>No products found</p>
              <p style={{ fontSize: '14px', color: '#778198' }}>Try adjusting your search or filters</p>
              <button onClick={clearFilters} style={{ 
                padding: '8px 16px', 
                backgroundColor: '#B63B49', 
                color: '#FFFFFF', 
                border: 'none', 
                borderRadius: '10px', 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontFamily: 'inherit', 
                marginTop: '12px' 
              }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E7EAF1',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '100%',
    backgroundColor: '#F5F7FB',
    overflow: 'hidden',
  },
  productImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: '10px',
  },
  sourceBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '10px',
    color: '#ffffff',
    fontFamily: 'inherit',
    fontWeight: '600',
  },
  wishlistBtn: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    zIndex: 2,
  },
  productInfo: {
    padding: '12px 14px 14px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  productBrand: {
    fontSize: '11px',
    color: '#778198',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  productName: {
    fontSize: '14px',
    color: '#17233C',
    margin: '4px 0',
    lineHeight: '1.3',
    minHeight: '36px',
    fontWeight: '600',
  },
  productCategory: {
    fontSize: '11px',
    color: '#9AA3B5',
  },
  productRating: {
    fontSize: '13px',
    color: '#F59E0B',
    margin: '4px 0',
  },
  productPrice: {
    fontSize: '16px',
    color: '#17233C',
    fontWeight: '700',
    marginTop: 'auto',
  },
  recommendationReason: {
    fontSize: '11px',
    color: '#778198',
    marginTop: '6px',
    padding: '6px 8px',
    backgroundColor: '#F5F7FB',
    borderRadius: '8px',
  },
  ingredientsPreview: {
    fontSize: '11px',
    color: '#778198',
    marginTop: '6px',
    padding: '4px 8px',
    backgroundColor: '#F5F7FB',
    borderRadius: '8px',
    lineHeight: '1.4',
  },
  buttonRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
  },
  buyNowBtn: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#6C63D9',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit',
    fontWeight: '600',
    transition: 'background 0.2s',
  },
};

export default Products;