// frontend/src/pages/ProductDetail.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

const API_BASE_URL = 'http://localhost:8000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/products');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/v1/products/${id}`, {
        params: { token }
      });
      setProduct(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Could not load product details.');
    } finally {
      setLoading(false);
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

  const handleBuyNow = () => {
    alert(`"${product?.name}" added to cart!\n\nPrice: $${product?.price}\nBrand: ${product?.brand}`);
  };

  const mainMenu = [];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="patient-page">
        <PatientSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
          <div style={styles.error}>{error || 'Product not found'}</div>
          <button style={styles.backBtn} onClick={() => navigate('/products')}>← Back to Products</button>
        </main>
      </div>
    );
  }

  return (
    <div className="patient-page">
      <PatientSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div style={styles.topBar}>
          <div>
            <p style={styles.kicker}>PRODUCT</p>
            <h1 style={styles.pageTitle}>Product Details</h1>
            <p style={styles.pageSubtitle}>{product.brand} • {product.category || 'Skincare'}</p>
          </div>
          <div style={styles.topBarRight}>
            <button style={styles.backBtnTop} onClick={() => navigate('/products')}>← Back</button>
            <div style={styles.dateChip}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div style={styles.profileChip}>
              <div style={styles.avatarCircle}>{localStorage.getItem('userName')?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div>
                <div style={styles.profileName}>{localStorage.getItem('userName') || 'User'}</div>
                <div style={styles.profileRole}>User</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.productCard}>
          <div style={styles.productImageContainer}>
            <img
              src={getImageUrl(product.image_url) || 'https://via.placeholder.com/400x400/6C63D9/ffffff?text=No+Image'}
              alt={product.name}
              style={styles.productImage}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400/6C63D9/ffffff?text=No+Image'; }}
            />
          </div>
          <div style={styles.productInfo}>
            <h2 style={styles.productName}>{product.name}</h2>
            <p style={styles.productBrand}>{product.brand}</p>
            <div style={styles.productRating}>
              {'★'.repeat(Math.round(product.rating || 0))}
              {product.rating > 0 && ` ${product.rating.toFixed(1)}`}
              {product.reviews_count > 0 && ` (${product.reviews_count} reviews)`}
            </div>
            <p style={styles.productPrice}>${product.price?.toFixed(2) || 'N/A'}</p>

            {product.description && (
              <div style={styles.productSection}>
                <h4 style={styles.sectionTitle}>Description</h4>
                <p style={styles.sectionText}>{product.description}</p>
              </div>
            )}

            {product.how_to_use && (
              <div style={styles.productSection}>
                <h4 style={styles.sectionTitle}>How to Use</h4>
                <p style={styles.sectionText}>{product.how_to_use}</p>
              </div>
            )}

            {product.ingredients_text && (
              <div style={styles.productSection}>
                <h4 style={styles.sectionTitle}>Ingredients</h4>
                <p style={styles.sectionText}>{product.ingredients_text}</p>
              </div>
            )}

            {product.highlights && product.highlights.length > 0 && (
              <div style={styles.productSection}>
                <h4 style={styles.sectionTitle}>Highlights</h4>
                <ul style={styles.highlightsList}>
                  {product.highlights.map((h, i) => (
                    <li key={i} style={styles.highlightItem}>✓ {h}</li>
                  ))}
                </ul>
              </div>
            )}

            <button style={styles.buyNowBtn} onClick={handleBuyNow}>
              Buy Now
            </button>

            {product.reviews && product.reviews.length > 0 && (
              <div style={styles.reviewsSection}>
                <h4 style={styles.sectionTitle}>Reviews</h4>
                {product.reviews.slice(0, 5).map((review, i) => (
                  <div key={i} style={styles.reviewItem}>
                    <div style={styles.reviewRating}>
                      {'★'.repeat(review.rating || 0)}
                    </div>
                    <p style={styles.reviewText}>{review.review_text}</p>
                    {review.skin_type && (
                      <p style={styles.reviewMeta}>Skin type: {review.skin_type}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' },
  kicker: { fontSize: '11px', fontWeight: '850', color: '#6C63D9', letterSpacing: '1.4px', margin: '0 0 6px' },
  pageTitle: { fontSize: '28px', color: '#17233C', margin: 0, fontWeight: '800', letterSpacing: '-0.8px' },
  pageSubtitle: { fontSize: '14px', color: '#778198', margin: '6px 0 0' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  backBtnTop: { padding: '10px 16px', backgroundColor: '#FFFFFF', border: '1px solid #DCE1EC', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit', color: '#17233C' },
  dateChip: { background: '#FFFFFF', border: '1px solid #E1E5EE', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', fontWeight: '700', color: '#34415B', whiteSpace: 'nowrap' },
  profileChip: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarCircle: { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #8E86F5, #5D57C7)', color: '#FFFFFF', display: 'grid', placeItems: 'center', fontWeight: '800', fontSize: '15px' },
  profileName: { fontSize: '13px', fontWeight: '800', color: '#17233C' },
  profileRole: { fontSize: '11px', color: '#778198' },
  error: { backgroundColor: '#FFF1F2', color: '#B63B49', padding: '18px', borderRadius: '14px', textAlign: 'center', fontSize: '14px', border: '1px solid #F1B7BD' },
  backBtn: { padding: '11px 24px', backgroundColor: '#6C63D9', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '800', fontFamily: 'inherit', marginTop: '16px' },
  productCard: { backgroundColor: '#FFFFFF', padding: '26px', borderRadius: '20px', border: '1px solid #E7EAF1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', boxShadow: '0 14px 38px rgba(23,35,60,0.07)' },
  productImageContainer: { backgroundColor: '#F6F7FB', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px', padding: '16px', boxSizing: 'border-box' },
  productImage: { maxWidth: '100%', maxHeight: '420px', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' },
  productInfo: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  productName: { fontSize: '25px', fontWeight: '800', color: '#17233C', margin: 0, letterSpacing: '-0.6px', lineHeight: '1.2' },
  productBrand: { fontSize: '15px', color: '#778198', margin: '6px 0' },
  productRating: { fontSize: '15px', color: '#F59E0B', margin: '6px 0' },
  productPrice: { fontSize: '28px', fontWeight: '800', color: '#6C63D9', margin: '10px 0 16px 0', letterSpacing: '-0.8px' },
  productSection: { marginTop: '14px' },
  sectionTitle: { fontSize: '13px', fontWeight: '800', color: '#34415B', margin: '0 0 6px 0', letterSpacing: '0.2px' },
  sectionText: { fontSize: '14px', color: '#5B6577', lineHeight: '1.65', margin: 0 },
  highlightsList: { listStyle: 'none', padding: 0, margin: '4px 0 0 0' },
  highlightItem: { fontSize: '13px', color: '#17233C', padding: '5px 0', display: 'flex', gap: '8px' },
  buyNowBtn: { padding: '15px', backgroundColor: '#6C63D9', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', marginTop: '20px', fontWeight: '800', boxShadow: '0 10px 22px rgba(108,99,217,0.28)' },
  reviewsSection: { marginTop: '20px', borderTop: '1px solid #EEF0F5', paddingTop: '16px' },
  reviewItem: { padding: '10px 0', borderBottom: '1px solid #F5F6FA' },
  reviewRating: { fontSize: '14px', color: '#F59E0B' },
  reviewText: { fontSize: '13.5px', color: '#17233C', margin: '3px 0', lineHeight: '1.55' },
  reviewMeta: { fontSize: '11px', color: '#778198', margin: 0 },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F4F6FB' },
  loadingSpinner: { border: '4px solid #E7EAF1', borderTop: '4px solid #6C63D9', borderRadius: '50%', width: '42px', height: '42px', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '15px', color: '#778198', fontSize: '15px' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

export default ProductDetail;