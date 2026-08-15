// frontend/src/pages/PhotoUpload.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

function PhotoUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [tag, setTag] = useState('Uncategorized');
  const [notes, setNotes] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');

  const fileInputRef = useRef(null);

  const tags = ['Baseline', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Month 2', 'Month 3', 'Month 6', 'Uncategorized'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchPhotos();
    fetchComparison();
  }, [navigate, selectedTagFilter]);

  const fetchPhotos = async () => {
    setLoadingPhotos(true);
    try {
      const token = localStorage.getItem('token');
      const params = { token, limit: 50 };
      if (selectedTagFilter) params.tag = selectedTagFilter;

      const response = await api.get('/api/v1/photos', { params });
      setPhotos(response.data.photos || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Could not load photos.');
    } finally {
      setLoadingPhotos(false);
    }
  };

  const fetchComparison = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/v1/photos/comparison', { params: { token } });
      setComparison(response.data.comparison || null);
    } catch (err) {
      console.error('Error fetching comparison:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setSuccess('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a photo first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('tag', tag);
      if (notes) formData.append('notes', notes);

      await api.post('/api/v1/photos/upload', formData, {
        params: { token },
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Photo uploaded successfully!');
      setSelectedFile(null);
      setPreviewUrl(null);
      setNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchPhotos();
      fetchComparison();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/v1/photos/${photoId}`, { params: { token } });
      setSuccess('Photo deleted successfully!');
      fetchPhotos();
      fetchComparison();
    } catch (err) {
      setError('Failed to delete photo.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div style={styles.container}>
      <PatientSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <h1 style={styles.title}>Progress Photos</h1>
        <p style={styles.subtitle}>Upload and track your skin progress photos.</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <div style={styles.uploadCard}>
          <h3 style={styles.cardTitle}>Upload New Photo</h3>
          <div style={styles.uploadArea}>
            {previewUrl ? (
              <div style={styles.previewContainer}>
                <img src={previewUrl} alt="Preview" style={styles.previewImage} />
                <button style={styles.clearBtn} onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}>
                  ✕
                </button>
              </div>
            ) : (
              <div style={styles.dropArea} onClick={() => fileInputRef.current?.click()}>
                <span style={styles.dropIcon}>📸</span>
                <p style={styles.dropText}>Click or drag to upload a photo</p>
                <p style={styles.dropSubtext}>JPG, PNG, or WebP</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div style={styles.uploadFields}>
            <div style={styles.field}>
              <label style={styles.label}>Tag *</label>
              <select value={tag} onChange={(e) => setTag(e.target.value)} style={styles.select}>
                {tags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Notes</label>
              <input
                type="text"
                placeholder="e.g., After using new serum"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <button
            style={styles.uploadBtn}
            onClick={handleUpload}
            disabled={loading || !selectedFile}
          >
            {loading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>

        {comparison && comparison.has_both && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Before & After</h3>
            <div style={styles.comparisonGrid}>
              <div style={styles.comparisonBox}>
                <p style={styles.comparisonLabel}>Before</p>
                {comparison.baseline ? (
                  <>
                    <img
                      src={comparison.baseline.image_url}
                      alt="Before"
                      style={styles.comparisonImage}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200/6C5CE7/ffffff?text=No+Image'; }}
                    />
                    <p style={styles.comparisonInfo}>Score: {comparison.baseline.skin_score || 'N/A'}</p>
                    <p style={styles.comparisonInfo}>Date: {new Date(comparison.baseline.uploaded_at).toLocaleDateString()}</p>
                  </>
                ) : (
                  <p style={styles.emptyText}>No baseline photo</p>
                )}
              </div>
              <div style={styles.comparisonBox}>
                <p style={styles.comparisonLabel}>After</p>
                {comparison.latest ? (
                  <>
                    <img
                      src={comparison.latest.image_url}
                      alt="After"
                      style={styles.comparisonImage}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200/6C5CE7/ffffff?text=No+Image'; }}
                    />
                    <p style={styles.comparisonInfo}>Score: {comparison.latest.skin_score || 'N/A'}</p>
                    <p style={styles.comparisonInfo}>Date: {new Date(comparison.latest.uploaded_at).toLocaleDateString()}</p>
                  </>
                ) : (
                  <p style={styles.emptyText}>No latest photo</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.galleryHeader}>
            <h3 style={styles.cardTitle}>Photo Gallery</h3>
            <div style={styles.filterContainer}>
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Tags</option>
                {tags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button style={styles.refreshBtn} onClick={fetchPhotos}>🔄</button>
            </div>
          </div>

          {loadingPhotos ? (
            <p style={styles.emptyText}>Loading photos...</p>
          ) : photos.length > 0 ? (
            <div style={styles.galleryGrid}>
              {photos.map((photo) => (
                <div key={photo.id} style={styles.galleryItem}>
                  <img
                    src={photo.thumbnail_url || photo.image_url}
                    alt={photo.tag}
                    style={styles.galleryImage}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150x150/6C5CE7/ffffff?text=No+Image'; }}
                  />
                  <div style={styles.galleryInfo}>
                    <span style={styles.galleryTag}>{photo.tag}</span>
                    <span style={styles.galleryScore}>Score: {photo.skin_score || 'N/A'}</span>
                    <span style={styles.galleryDate}>
                      {new Date(photo.uploaded_at).toLocaleDateString()}
                    </span>
                    <button
                      style={styles.galleryDelete}
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No photos yet. Upload your first progress photo above.</p>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#F5F7FB', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  sidebar: { backgroundColor: '#17233C', borderRight: '1px solid #263B63', padding: '20px 12px', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto', transition: 'width 0.2s ease', zIndex: 100, boxSizing: 'border-box' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '0 8px' },
  sidebarLogoIcon: { fontSize: '22px' },
  sidebarLogoText: { fontSize: '17px', fontWeight: '700', color: '#17233C' },
  sidebarNav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  sidebarNavItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', width: '100%', backgroundColor: 'transparent', color: '#778198', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', textAlign: 'left', whiteSpace: 'nowrap' },
  sidebarNavItemActive: { backgroundColor: '#E8E7FF', color: '#17233C', fontWeight: '600', boxShadow: '0 4px 10px rgba(108,92,231,0.35)' },
  navIcon: { fontSize: '16px', flexShrink: 0, width: '18px', textAlign: 'center' },
  sidebarLogout: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', width: '100%', backgroundColor: 'transparent', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '14px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', marginTop: '12px', flexShrink: 0, whiteSpace: 'nowrap' },  mainContent: { flex: 1, padding: '24px 32px', transition: 'margin-left 0.2s ease' },
  title: { fontSize: '22px', color: '#17233C', marginBottom: '4px', fontWeight: '700' },
  subtitle: { fontSize: '14px', color: '#778198', marginBottom: '24px' },
  error: { backgroundColor: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '16px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' },
  success: { backgroundColor: '#ECFDF5', color: '#059669', padding: '12px', borderRadius: '16px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' },
  uploadCard: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB', marginBottom: '20px' },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' },
  uploadArea: { marginBottom: '16px' },
  dropArea: { border: '2px dashed #DDD6FE', backgroundColor: '#FAFAFF', borderRadius: '14px', padding: '40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  dropIcon: { fontSize: '44px', display: 'block', marginBottom: '10px' },
  dropText: { fontSize: '14px', color: '#17233C', fontWeight: '500', margin: 0 },
  dropSubtext: { fontSize: '12px', color: '#9CA3AF', marginTop: '4px' },
  previewContainer: { position: 'relative', display: 'inline-block' },
  previewImage: { maxWidth: '200px', maxHeight: '200px', borderRadius: '14px', objectFit: 'cover' },
  clearBtn: { position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' },
  uploadFields: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '600', color: '#17233C', marginBottom: '5px' },
  select: { padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '16px', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#FFFFFF' },
  input: { padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '16px', fontSize: '14px', fontFamily: 'inherit' },
  uploadBtn: { padding: '12px 24px', backgroundColor: '#E8E7FF', color: '#17233C', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', fontWeight: '600', width: '100%' },
  card: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB', marginBottom: '20px' },
  comparisonGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  comparisonBox: { textAlign: 'center', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '14px' },
  comparisonLabel: { fontSize: '14px', fontWeight: '700', color: '#17233C', marginBottom: '10px' },
  comparisonImage: { maxWidth: '100%', maxHeight: '200px', borderRadius: '14px', objectFit: 'cover' },
  comparisonInfo: { fontSize: '12px', color: '#778198', marginTop: '5px' },
  galleryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' },
  filterContainer: { display: 'flex', gap: '8px', alignItems: 'center' },
  filterSelect: { padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: '16px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: '#FFFFFF' },
  refreshBtn: { padding: '7px 12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' },
  galleryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' },
  galleryItem: { backgroundColor: '#FFFFFF', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E5E7EB' },
  galleryImage: { width: '100%', height: '150px', objectFit: 'cover' },
  galleryInfo: { padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: '#778198' },
  galleryTag: { fontWeight: '700', color: '#6C63D9' },
  galleryScore: { color: '#4B5563' },
  galleryDate: { color: '#9CA3AF' },
  galleryDelete: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '4px 0 0', color: '#DC2626', alignSelf: 'flex-start', fontFamily: 'inherit' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', padding: '20px 0', fontSize: '14px' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F5F7FB' },
  loadingSpinner: { border: '4px solid #E5E7EB', borderTop: '4px solid #6C5CE7', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '15px', color: '#778198', fontSize: '16px' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

export default PhotoUpload;