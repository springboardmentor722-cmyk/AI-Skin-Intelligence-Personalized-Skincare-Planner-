// frontend/src/pages/AdminProducts.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/admin-theme.css';

function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/admin/products');
  const [userName, setUserName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    rating: '',
    reviews_count: '',
    image_url: '',
    description: '',
    ingredients_text: '',
    how_to_use: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    setUserName(name || 'Admin');
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await api.get('/api/v1/products', { params: { token, limit: 200 } });
      setProducts(res.data.products || []);
      setFilteredProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Could not load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.brand || !formData.category) {
      setError('Please fill in all required fields (Name, Brand, Category).');
      return;
    }

    setSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      await api.post('/admin/products', {
        ...formData,
        price: parseFloat(formData.price) || 0,
        rating: parseFloat(formData.rating) || 0,
        reviews_count: parseInt(formData.reviews_count) || 0
      }, { params: { token } });
      setShowAddForm(false);
      setFormData({
        name: '',
        brand: '',
        category: '',
        price: '',
        rating: '',
        reviews_count: '',
        image_url: '',
        description: '',
        ingredients_text: '',
        how_to_use: ''
      });
      fetchProducts();
      alert('✅ Product added successfully!');
    } catch (err) {
      setError('Failed to add product: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    setSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      await api.put(`/admin/products/${editingProduct.id}`, {
        ...formData,
        price: parseFloat(formData.price) || 0,
        rating: parseFloat(formData.rating) || 0,
        reviews_count: parseInt(formData.reviews_count) || 0
      }, { params: { token } });
      setEditingProduct(null);
      setFormData({
        name: '',
        brand: '',
        category: '',
        price: '',
        rating: '',
        reviews_count: '',
        image_url: '',
        description: '',
        ingredients_text: '',
        how_to_use: ''
      });
      fetchProducts();
      alert('✅ Product updated successfully!');
    } catch (err) {
      setError('Failed to update product: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const token = localStorage.getItem('token');

    try {
      await api.delete(`/admin/products/${productId}`, { params: { token } });
      fetchProducts();
      alert('✅ Product deleted successfully!');
    } catch (err) {
      setError('Failed to delete product: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      brand: product.brand || '',
      category: product.category || '',
      price: product.price || '',
      rating: product.rating || '',
      reviews_count: product.reviews_count || '',
      image_url: product.image_url || '',
      description: product.description || '',
      ingredients_text: product.ingredients_text || '',
      how_to_use: product.how_to_use || ''
    });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: '',
      category: '',
      price: '',
      rating: '',
      reviews_count: '',
      image_url: '',
      description: '',
      ingredients_text: '',
      how_to_use: ''
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    setActiveMenu(path);
    navigate(path);
  };

  if (loading) {
    return (
      <div className="admin-loading-page">
        <div className="admin-loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`admin-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="admin-header">
          <div>
            <div className="admin-kicker">PRODUCT MANAGEMENT</div>
            <h1 className="admin-title">🛍️ Product Management</h1>
            <p className="admin-subtitle">Manage all products in the catalog.</p>
          </div>
          <div style={styles.topBarRight}>
            <button className="admin-primary-button" onClick={() => setShowAddForm(true)}>
              + Add Product
            </button>
            <div style={styles.dateChip}>📅 {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div style={styles.profileChip}>
              <div style={styles.avatarCircle}>{userName?.charAt(0)?.toUpperCase() || 'A'}</div>
              <div>
                <div style={styles.profileName}>{userName}</div>
                <div style={styles.profileRole}>Admin</div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="admin-alert-error">{error}</div>}

        <div style={styles.filterCard}>
          <div style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search by name, brand, or category..."
              value={searchTerm}
              onChange={handleSearch}
              style={styles.searchInput}
            />
            <button className="admin-secondary-button" onClick={fetchProducts}>🔄 Refresh</button>
          </div>
          <div style={styles.filterStats}>
            <span>Showing {filteredProducts.length} of {products.length} products</span>
          </div>
        </div>

        {(showAddForm || editingProduct) && (
          <div style={styles.formCard}>
            <h4 style={styles.formTitle}>{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h4>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  placeholder="Product name"
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Brand *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  style={styles.input}
                  placeholder="Brand name"
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={styles.input}
                  placeholder="e.g., Serum, Cleanser"
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Price ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  style={styles.input}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Rating (0-5)</label>
                <input
                  type="number"
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: e.target.value})}
                  style={styles.input}
                  placeholder="4.5"
                  step="0.1"
                  min="0"
                  max="5"
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Reviews Count</label>
                <input
                  type="number"
                  value={formData.reviews_count}
                  onChange={(e) => setFormData({...formData, reviews_count: e.target.value})}
                  style={styles.input}
                  placeholder="0"
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Image URL</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  style={styles.input}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={styles.textarea}
                  rows="2"
                  placeholder="Product description"
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Ingredients</label>
                <textarea
                  value={formData.ingredients_text}
                  onChange={(e) => setFormData({...formData, ingredients_text: e.target.value})}
                  style={styles.textarea}
                  rows="2"
                  placeholder="List of ingredients"
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>How to Use</label>
                <textarea
                  value={formData.how_to_use}
                  onChange={(e) => setFormData({...formData, how_to_use: e.target.value})}
                  style={styles.textarea}
                  rows="2"
                  placeholder="Usage instructions"
                />
              </div>
            </div>
            <div style={styles.formActions}>
              <button style={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
              <button
                className="admin-primary-button"
                onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        )}

        <div className="admin-surface">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Price</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{...styles.td, textAlign: 'center', color: '#778198' }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            style={styles.productThumb}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{product.brand}</td>
                    <td style={styles.td}>{product.category || 'Uncategorized'}</td>
                    <td style={styles.td}>${product.price?.toFixed(2) || '0.00'}</td>
                    <td style={styles.td}>⭐ {product.rating || 'N/A'}</td>
                    <td style={styles.td}>
                      <button style={styles.editBtn} onClick={() => openEdit(product)}>✏️</button>
                      <button style={styles.deleteBtn} onClick={() => handleDeleteProduct(product.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const styles = {
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap'
  },
  dateChip: {
    background: '#FFFFFF',
    border: '1px solid #E7EAF1',
    borderRadius: '12px',
    padding: '8px 14px',
    fontSize: '13px',
    color: '#374151'
  },
  profileChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatarCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#0d9488',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '15px'
  },
  profileName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#17233C'
  },
  profileRole: {
    fontSize: '11px',
    color: '#778198'
  },
  filterCard: {
    background: '#FFFFFF',
    padding: '24px',
    borderRadius: '20px',
    border: '1px solid #E7EAF1',
    boxShadow: '0 14px 38px rgba(23,35,60,0.07)',
    marginBottom: '20px'
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    minWidth: '200px',
    outline: 'none',
    backgroundColor: '#FBFCFE'
  },
  filterStats: {
    fontSize: '13px',
    color: '#778198',
    marginTop: '10px'
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #F0F2F6',
    color: '#17233C',
    verticalAlign: 'middle'
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  productThumb: {
    width: '40px',
    height: '40px',
    objectFit: 'contain',
    borderRadius: '4px',
    backgroundColor: '#F9FAFB'
  },
  editBtn: {
    padding: '4px 10px',
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '4px'
  },
  deleteBtn: {
    padding: '4px 10px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  formCard: {
    background: '#FFFFFF',
    padding: '24px',
    borderRadius: '20px',
    border: '2px solid #0d9488',
    marginBottom: '20px'
  },
  formTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#17233C',
    marginBottom: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
    marginBottom: '16px'
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#17233C'
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#FBFCFE'
  },
  textarea: {
    padding: '10px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#FBFCFE'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#F5F7FB',
    color: '#778198',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit'
  }
};

export default AdminProducts;