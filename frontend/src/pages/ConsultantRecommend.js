// frontend/src/pages/ConsultantRecommend.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

const API_BASE_URL = 'http://localhost:8000';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url}`;
};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/80x80/0d9488/FFFFFF?text=No+Image';

function ConsultantRecommend() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recommendationNote, setRecommendationNote] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    setUserName(name || 'Consultant');
    fetchClients();
    fetchProducts();

    if (location.state?.clientId) {
      setSelectedClient(location.state.clientId);
    }
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchRecommendations(selectedClient);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/consultant/reviews', { params: { token } });
      const clientList = res.data || [];

      const enriched = [];
      for (const client of clientList) {
        try {
          const profileRes = await api.get('/user/profile', {
            params: { token, user_id: client.user_id }
          });
          enriched.push({
            ...client,
            profile: profileRes.data
          });
        } catch (e) {
          enriched.push(client);
        }
      }
      setClients(enriched);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/v1/products', {
        params: { token, limit: 100 }
      });
      setProducts(res.data.products || []);
      setFilteredProducts(res.data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Could not load products.');
    } finally {
      setLoadingProducts(false);
      setLoading(false);
    }
  };

  const fetchRecommendations = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/v1/products/recommendations', {
        params: { token, limit: 20 }
      });
      setRecommendations(res.data || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  };

  const handleRecommend = async () => {
    if (!selectedClient) {
      setError('Please select a client.');
      return;
    }
    if (!selectedProduct) {
      setError('Please select a product to recommend.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await api.post(`/api/v1/products/recommend`, {
        user_id: selectedClient,
        product_id: selectedProduct.id,
        reason: recommendationNote || 'Recommended by consultant'
      }, { params: { token } });

      setSuccess(`✅ ${selectedProduct.name} recommended successfully!`);
      setSelectedProduct(null);
      setRecommendationNote('');
      fetchRecommendations(selectedClient);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to recommend product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="professional-loading-page">
        <div className="professional-loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="professional-page role-consultant">
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">PRODUCT RECOMMENDATIONS</div>
            <h1 className="professional-title">🛍️ Product Recommendations</h1>
            <p className="professional-subtitle">Recommend products to your clients.</p>
          </div>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}
        {success && (
          <div className="professional-alert-success">{success}</div>
        )}

        <div className="professional-surface">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
            📝 Recommend a Product
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <div className="professional-field">
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#17233C' }}>Select Client *</label>
              <select
                value={selectedClient || ''}
                onChange={(e) => setSelectedClient(Number(e.target.value))}
                style={{ padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', width: '100%', backgroundColor: '#FFFFFF' }}
              >
                <option value="">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client.user_id} value={client.user_id}>
                    {client.user_name || client.profile?.full_name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div className="professional-field">
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#17233C' }}>Search Products</label>
              <input
                type="text"
                placeholder="Search by product name or brand..."
                value={searchTerm}
                onChange={handleSearch}
                style={{ padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', width: '100%' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#17233C' }}>Select a Product *</label>
            {loadingProducts ? (
              <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>No products found.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredProducts.slice(0, 10).map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: selectedProduct?.id === product.id ? '2px solid #0d9488' : '1px solid #E7EAF1',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: selectedProduct?.id === product.id ? '#E4F7F4' : '#FFFFFF'
                    }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img
                      src={getImageUrl(product.image_url) || PLACEHOLDER_IMAGE}
                      alt={product.name}
                      style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#F9FAFB' }}
                      onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#17233C' }}>{product.name}</div>
                      <div style={{ fontSize: '12px', color: '#778198' }}>{product.brand}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0d9488' }}>${product.price?.toFixed(2) || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="professional-field" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#17233C' }}>Recommendation Note (optional)</label>
            <textarea
              placeholder="Why are you recommending this product?"
              value={recommendationNote}
              onChange={(e) => setRecommendationNote(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px' }}
              rows="3"
            />
          </div>

          <button
            style={{
              padding: '14px',
              backgroundColor: '#0d9488',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontFamily: 'inherit',
              fontWeight: '600',
              width: '100%',
              opacity: submitting || !selectedClient || !selectedProduct ? 0.6 : 1
            }}
            onClick={handleRecommend}
            disabled={submitting || !selectedClient || !selectedProduct}
          >
            {submitting ? 'Recommending...' : '📩 Recommend to Client'}
          </button>
        </div>

        {selectedClient && (
          <div className="professional-surface">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
              📋 Recommendations Sent
            </h3>
            {recommendations.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>No recommendations sent to this client yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recommendations.map((rec, i) => (
                  <div key={i} style={{ padding: '12px 16px', backgroundColor: '#F5F7FB', borderRadius: '12px', border: '1px solid #E7EAF1' }}>
                    <div style={{ fontWeight: '600', color: '#17233C' }}>{rec.product?.name || 'Product'}</div>
                    <div style={{ fontSize: '13px', color: '#778198' }}>{rec.product?.brand || 'Unknown'}</div>
                    {rec.reason && <div style={{ fontSize: '13px', color: '#34415B', marginTop: '4px' }}>💡 {rec.reason}</div>}
                    <div style={{ fontSize: '12px', color: '#9AA3B5', marginTop: '4px' }}>
                      {new Date(rec.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default ConsultantRecommend;