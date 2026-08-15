// frontend/src/pages/AiAnalysis.js

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

const API_BASE_URL = 'http://localhost:8000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

function AiAnalysis() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [captureMode, setCaptureMode] = useState('upload');
  const [cameraActive, setCameraActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/ai-analysis');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAnswers, setFeedbackAnswers] = useState({
    gotRecommendations: false,
    gotRoutine: false,
    gotInstructions: false,
    satisfied: false,
    feedbackText: ''
  });
  const [analysisSaved, setAnalysisSaved] = useState(false);
  const [isViewingStoredResults, setIsViewingStoredResults] = useState(false);
  const [storedResults, setStoredResults] = useState(null);

  const videoRef2 = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // ============================================================
    // FIXED: Check for stored AI results from Dashboard
    // ============================================================
    const showStoredResults = localStorage.getItem('showAiResults');
    const storedData = localStorage.getItem('aiResultsData');
    
    if (showStoredResults === 'true' && storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setStoredResults(parsedData);
        setIsViewingStoredResults(true);
        // Clear the flag so it doesn't show again on refresh
        localStorage.removeItem('showAiResults');
        localStorage.removeItem('aiResultsData');
        setShowFeedback(true);
      } catch (e) {
        console.error('Error parsing stored AI results:', e);
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [navigate]);

  // ============================================================
  // START CAMERA
  // ============================================================

  const startCamera = async () => {
    setCameraError('');
    setError('');
    setCaptureMode('camera');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;

      if (videoRef2.current) {
        videoRef2.current.srcObject = stream;
        videoRef2.current.onloadedmetadata = () => {
          videoRef2.current.play()
            .then(() => {
              setCameraActive(true);
            })
            .catch(err => {
              console.error('Play error:', err);
              setError('Failed to start video playback.');
            });
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Unable to access camera');
      setError('Unable to access camera. Please allow camera permissions.');
      setCaptureMode('upload');
    }
  };

  // ============================================================
  // CAPTURE PHOTO
  // ============================================================

  const capturePhoto = () => {
    if (!videoRef2.current) return;

    const video = videoRef2.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    fetch(imageDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'captured-face.jpg', { type: 'image/jpeg' });
        setPhotoFile(file);
        setPreviewImage(imageDataUrl);
        setShowPreview(true);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setCameraActive(false);
      });
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCaptureMode('upload');
  };

  // ============================================================
  // PREVIEW HANDLING
  // ============================================================

  const retakePhoto = () => {
    setPreviewImage(null);
    setShowPreview(false);
    setPhotoFile(null);
    startCamera();
  };

  const usePhoto = () => {
    setPhoto(previewImage);
    setShowPreview(false);
    setCaptureMode('upload');
  };

  // ============================================================
  // UPLOAD HANDLING
  // ============================================================

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
        setPhotoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  // ============================================================
  // AI ANALYSIS
  // ============================================================

  const handleAnalyze = async () => {
    if (!photoFile && !photo) {
      setError('Please upload or capture a photo first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login again.');
        setLoading(false);
        return;
      }

      const formData = new FormData();

      if (photoFile) {
        formData.append('file', photoFile);
      } else if (photo) {
        const response = await fetch(photo);
        const blob = await response.blob();
        const file = new File([blob], 'uploaded-photo.jpg', { type: 'image/jpeg' });
        formData.append('file', file);
      }

      const response = await api.post('/api/v1/ai-analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: { token },
      });

      const data = response.data;

      if (data.success) {
        setResult({
          analysis_id: data.analysis_id,
          predicted_concern: data.predicted_concern,
          confidence: data.confidence,
          all_predictions: data.all_predictions,
          recommendations: data.recommendations,
          routine_suggestions: data.routine_suggestions,
          general_instructions: data.general_instructions,
          image_url: data.image_url,
          message: data.message
        });
        setAnalysisSaved(true);
        setIsViewingStoredResults(false);
        setStoredResults(null);
        setShowFeedback(true);
      } else {
        setError(data.message || 'AI analysis failed. Please try again.');
      }

      setLoading(false);
    } catch (err) {
      console.error('AI Analysis error:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(err.response?.data?.detail || 'AI analysis failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleFeedbackChange = (field, value) => {
    setFeedbackAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/v1/ai-analysis/feedback', {
        analysis_id: result?.analysis_id || storedResults?.analysis_id,
        feedback: feedbackAnswers
      }, {
        params: { token }
      });
    } catch (err) {
      console.error('Feedback submit error:', err);
    }
    
    navigate('/dashboard');
  };

  const handleReset = () => {
    setPhoto(null);
    setPhotoFile(null);
    setResult(null);
    setError('');
    setPreviewImage(null);
    setShowPreview(false);
    setCaptureMode('upload');
    setCameraError('');
    setShowFeedback(false);
    setAnalysisSaved(false);
    setIsViewingStoredResults(false);
    setStoredResults(null);
    setFeedbackAnswers({
      gotRecommendations: false,
      gotRoutine: false,
      gotInstructions: false,
      satisfied: false,
      feedbackText: ''
    });
    stopCamera();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    setActiveMenu(path);
    navigate(path);
  };

  const mainMenu = [];

  // ============================================================
  // RENDER
  // ============================================================

  // If viewing stored results from Dashboard
  if (isViewingStoredResults && storedResults) {
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
              <h1 style={styles.pageTitle}>🤖 AI Analysis Results</h1>
              <p style={styles.pageSubtitle}>Your AI skin analysis from the photo you uploaded</p>
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

          {/* Stored Results Display */}
          <div style={styles.resultCard}>
            <h3 style={styles.resultTitle}>📊 AI Analysis Results</h3>

            {/* Uploaded Photo */}
            {storedResults.image_url && (
              <div style={styles.uploadedPhotoSection}>
                <h4 style={styles.sectionSubtitle}>📸 Your Uploaded Photo</h4>
                <img 
                  src={getImageUrl(storedResults.image_url)} 
                  alt="Uploaded" 
                  style={styles.uploadedPhoto}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300/6C5CE7/ffffff?text=No+Image'; }}
                />
              </div>
            )}

            <div style={styles.resultMain}>
              <div style={styles.resultConcern}>
                <span style={styles.resultConcernLabel}>Detected Concern</span>
                <span style={styles.resultConcernValue}>{storedResults.predicted_concern}</span>
                <span style={styles.resultConfidenceBadge}>Confidence: {storedResults.confidence}%</span>
              </div>
            </div>

            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>All Predictions:</span>
              <div style={styles.resultTags}>
                {storedResults.all_predictions && storedResults.all_predictions.map((p, i) => (
                  <span key={i} style={{
                    ...styles.resultTag,
                    opacity: i === 0 ? 1 : 0.6,
                    fontWeight: i === 0 ? 'bold' : 'normal'
                  }}>
                    {p.class}: {p.confidence.toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {storedResults.recommendations && storedResults.recommendations.length > 0 && (
              <div style={styles.recommendationsSection}>
                <h4 style={styles.recommendationsTitle}>🛍️ Recommended Products</h4>
                <div style={styles.recommendationsList}>
                  {storedResults.recommendations.slice(0, 5).map((p, i) => (
                    <div key={i} style={styles.recommendationItem}>
                      <img
                        src={getImageUrl(p.image_url) || 'https://via.placeholder.com/50x50/6C5CE7/ffffff?text=No'}
                        alt={p.name}
                        style={styles.recommendationImage}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/50x50/6C5CE7/ffffff?text=No+Image';
                        }}
                      />
                      <div style={styles.recommendationInfo}>
                        <div style={styles.recommendationName}>{p.name}</div>
                        <div style={styles.recommendationBrand}>{p.brand} • {p.category || 'Skincare'}</div>
                        <div style={styles.recommendationMeta}>
                          ⭐ {p.rating || 'N/A'} • ${p.price || 'N/A'}
                          <span style={styles.recommendationMatch}>Matched: {p.ingredient_matched}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Routine Suggestions */}
            {storedResults.routine_suggestions && storedResults.routine_suggestions.length > 0 && (
              <div style={styles.routineSection}>
                <h4 style={styles.routineTitle}>📋 Suggested Routine</h4>
                <div style={styles.routineList}>
                  {storedResults.routine_suggestions.map((step, i) => (
                    <div key={i} style={styles.routineItem}>
                      <span style={styles.routineStep}>{step.step}</span>
                      <span style={styles.routineDesc}>{step.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Instructions */}
            {storedResults.general_instructions && storedResults.general_instructions.length > 0 && (
              <div style={styles.instructionsSection}>
                <h4 style={styles.instructionsTitle}>💡 General Instructions</h4>
                <div style={styles.instructionsList}>
                  {storedResults.general_instructions.map((inst, i) => (
                    <div key={i} style={styles.instructionItem}>
                      <span style={styles.instructionIcon}>{inst.title}</span>
                      <span style={styles.instructionText}>{inst.instruction}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.resultMessage}>
              💡 {storedResults.message || 'AI analysis complete.'}
            </div>

            <button style={styles.newAnalysisBtn} onClick={handleReset}>
              🔄 New Analysis
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Regular render for new analysis or upload
  return (
    <div style={styles.container}>
      {/* Sidebar */}

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
            <h1 style={styles.pageTitle}>🤖 AI Skin Analysis</h1>
            <p style={styles.pageSubtitle}>Upload or capture a photo to get AI-powered skin insights</p>
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
        {cameraError && <div style={styles.error}>📷 {cameraError}</div>}

        {/* Mode Selection */}
        {!photo && captureMode === 'upload' && !showPreview && !result && !showFeedback && !isViewingStoredResults && (
          <div style={styles.modeSelection}>
            <button
              style={{...styles.modeBtn, ...(captureMode === 'upload' ? styles.modeBtnActive : {})}}
              onClick={() => setCaptureMode('upload')}
            >
              📁 Upload Photo
            </button>
            <button
              style={styles.modeBtn}
              onClick={startCamera}
            >
              📷 Live Camera
            </button>
          </div>
        )}

        {/* Upload Section */}
        {captureMode === 'upload' && !photo && !showPreview && !result && !showFeedback && !isViewingStoredResults && (
          <div style={styles.uploadSection}>
            <div style={styles.uploadPlaceholder}>
              <p style={styles.uploadIcon}>📸</p>
              <p style={styles.uploadText}>Choose a clear photo of your face</p>
              <p style={styles.uploadSubtext}>Good lighting and front-facing photos work best</p>
              <button style={styles.uploadBtn} onClick={() => document.getElementById('fileInput').click()}>
                Choose Photo
              </button>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Camera View */}
        <div style={{
          ...styles.cameraContainer,
          display: (captureMode === 'camera' && !photo && !showPreview && !result && !showFeedback && !isViewingStoredResults) ? 'block' : 'none'
        }}>
          <div style={styles.videoWrapper}>
            <video
              ref={videoRef2}
              style={styles.video}
              playsInline
              autoPlay
              muted
            />
            <svg style={styles.overlaySvg} viewBox="0 0 640 480">
              <defs>
                <mask id="ovalMask">
                  <rect width="640" height="480" fill="white" />
                  <ellipse cx="320" cy="240" rx="150" ry="180" fill="black" />
                </mask>
              </defs>
              <rect width="640" height="480" fill="rgba(0,0,0,0.4)" mask="url(#ovalMask)" />
              <ellipse cx="320" cy="240" rx="150" ry="180" fill="none" stroke="#6F63D8" strokeWidth="4" />
              <circle cx="170" cy="60" r="6" fill="#6F63D8" />
              <circle cx="470" cy="60" r="6" fill="#6F63D8" />
              <circle cx="170" cy="420" r="6" fill="#6F63D8" />
              <circle cx="470" cy="420" r="6" fill="#6F63D8" />
            </svg>
            <div style={styles.statusBadge}>📷</div>
            {!cameraActive && (
              <div style={styles.videoLoadingOverlay}>Starting camera…</div>
            )}
          </div>
          <div style={styles.guidanceContainer}>
            <p style={{...styles.guidanceText, color: '#6F63D8'}}>
              {cameraActive ? '✅ Position your face inside the oval' : 'Requesting camera access…'}
            </p>
          </div>
          <div style={styles.cameraControls}>
            <button style={styles.captureBtn} onClick={capturePhoto} disabled={!cameraActive}>
              📸 Capture Photo
            </button>
            <button style={styles.cancelBtn} onClick={stopCamera}>
              ✕ Cancel
            </button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && previewImage && (
          <div style={styles.previewContainer}>
            <h3 style={styles.previewTitle}>📸 Preview</h3>
            <img src={previewImage} alt="Captured" style={styles.previewImage} />
            <div style={styles.previewActions}>
              <button style={styles.retakeBtn} onClick={retakePhoto}>📷 Retake</button>
              <button style={styles.useBtn} onClick={usePhoto}>✅ Use This Photo</button>
            </div>
          </div>
        )}

        {/* Photo with Analyze */}
        {photo && !showPreview && !result && !showFeedback && !isViewingStoredResults && (
          <div style={styles.photoContainer}>
            <img src={photo} alt="Uploaded" style={styles.photoPreview} />
            <div style={styles.photoActions}>
              <button style={styles.retakeBtn} onClick={handleReset}>🔄 Retake</button>
              <button style={styles.analyzeBtn} onClick={handleAnalyze} disabled={loading}>
                {loading ? '⏳ Analyzing...' : '🔍 Analyze'}
              </button>
            </div>
          </div>
        )}

        {/* Results with Feedback */}
        {result && showFeedback && (
          <div style={styles.resultCard}>
            <h3 style={styles.resultTitle}>📊 AI Analysis Results</h3>

            {/* Uploaded Photo */}
            {result.image_url && (
              <div style={styles.uploadedPhotoSection}>
                <h4 style={styles.sectionSubtitle}>📸 Your Uploaded Photo</h4>
                <img 
                  src={getImageUrl(result.image_url)} 
                  alt="Uploaded" 
                  style={styles.uploadedPhoto}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300/6C5CE7/ffffff?text=No+Image'; }}
                />
              </div>
            )}

            <div style={styles.resultMain}>
              <div style={styles.resultConcern}>
                <span style={styles.resultConcernLabel}>Detected Concern</span>
                <span style={styles.resultConcernValue}>{result.predicted_concern}</span>
                <span style={styles.resultConfidenceBadge}>Confidence: {result.confidence}%</span>
              </div>
            </div>

            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>All Predictions:</span>
              <div style={styles.resultTags}>
                {result.all_predictions && result.all_predictions.map((p, i) => (
                  <span key={i} style={{
                    ...styles.resultTag,
                    opacity: i === 0 ? 1 : 0.6,
                    fontWeight: i === 0 ? 'bold' : 'normal'
                  }}>
                    {p.class}: {p.confidence.toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div style={styles.recommendationsSection}>
                <h4 style={styles.recommendationsTitle}>🛍️ Recommended Products</h4>
                <div style={styles.recommendationsList}>
                  {result.recommendations.slice(0, 5).map((p, i) => (
                    <div key={i} style={styles.recommendationItem}>
                      <img
                        src={getImageUrl(p.image_url) || 'https://via.placeholder.com/50x50/6C5CE7/ffffff?text=No'}
                        alt={p.name}
                        style={styles.recommendationImage}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/50x50/6C5CE7/ffffff?text=No+Image';
                        }}
                      />
                      <div style={styles.recommendationInfo}>
                        <div style={styles.recommendationName}>{p.name}</div>
                        <div style={styles.recommendationBrand}>{p.brand} • {p.category || 'Skincare'}</div>
                        <div style={styles.recommendationMeta}>
                          ⭐ {p.rating || 'N/A'} • ${p.price || 'N/A'}
                          <span style={styles.recommendationMatch}>Matched: {p.ingredient_matched}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Routine Suggestions */}
            {result.routine_suggestions && result.routine_suggestions.length > 0 && (
              <div style={styles.routineSection}>
                <h4 style={styles.routineTitle}>📋 Suggested Routine</h4>
                <div style={styles.routineList}>
                  {result.routine_suggestions.map((step, i) => (
                    <div key={i} style={styles.routineItem}>
                      <span style={styles.routineStep}>{step.step}</span>
                      <span style={styles.routineDesc}>{step.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Instructions */}
            {result.general_instructions && result.general_instructions.length > 0 && (
              <div style={styles.instructionsSection}>
                <h4 style={styles.instructionsTitle}>💡 General Instructions</h4>
                <div style={styles.instructionsList}>
                  {result.general_instructions.map((inst, i) => (
                    <div key={i} style={styles.instructionItem}>
                      <span style={styles.instructionIcon}>{inst.title}</span>
                      <span style={styles.instructionText}>{inst.instruction}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.resultMessage}>
              💡 {result.message || 'AI analysis complete.'}
            </div>

            {/* Feedback Section */}
            <div style={styles.feedbackSection}>
              <h4 style={styles.feedbackTitle}>📝 How was your experience?</h4>
              
              <div style={styles.feedbackGrid}>
                <label style={styles.feedbackCheckbox}>
                  <input
                    type="checkbox"
                    checked={feedbackAnswers.gotRecommendations}
                    onChange={(e) => handleFeedbackChange('gotRecommendations', e.target.checked)}
                  />
                  Got product recommendations
                </label>
                <label style={styles.feedbackCheckbox}>
                  <input
                    type="checkbox"
                    checked={feedbackAnswers.gotRoutine}
                    onChange={(e) => handleFeedbackChange('gotRoutine', e.target.checked)}
                  />
                  Got routine suggestions
                </label>
                <label style={styles.feedbackCheckbox}>
                  <input
                    type="checkbox"
                    checked={feedbackAnswers.gotInstructions}
                    onChange={(e) => handleFeedbackChange('gotInstructions', e.target.checked)}
                  />
                  Got general instructions
                </label>
                <label style={styles.feedbackCheckbox}>
                  <input
                    type="checkbox"
                    checked={feedbackAnswers.satisfied}
                    onChange={(e) => handleFeedbackChange('satisfied', e.target.checked)}
                  />
                  Satisfied with AI analysis
                </label>
              </div>

              <textarea
                style={styles.feedbackTextarea}
                placeholder="Any additional feedback? (optional)"
                value={feedbackAnswers.feedbackText}
                onChange={(e) => handleFeedbackChange('feedbackText', e.target.value)}
                rows="2"
              />

              <div style={styles.feedbackButtons}>
                <button style={styles.retakeBtn} onClick={handleReset}>
                  🔄 Retake Analysis
                </button>
                <button style={styles.continueBtn} onClick={handleContinue}>
                  ✅ Continue to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Styles (same as before, plus new ones)
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
  modeSelection: { display: 'flex', gap: '16px', marginBottom: '20px' },
  modeBtn: { flex: 1, padding: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E6EAF2', borderRadius: '18px', fontSize: '16px', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'center', color: '#13213D' },
  modeBtnActive: { borderColor: '#6F63D8', backgroundColor: '#F4F5F9' },
  uploadSection: { backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '18px', border: '1px solid #E6EAF2', textAlign: 'center' },
  uploadPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  uploadIcon: { fontSize: '48px' },
  uploadText: { fontSize: '16px', color: '#13213D' },
  uploadSubtext: { fontSize: '13px', color: '#667085' },
  uploadBtn: { padding: '12px 30px', backgroundColor: '#EEECFF', color: '#13213D', border: 'none', borderRadius: '18px', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit' },
  cameraContainer: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E6EAF2' },
  videoWrapper: { position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto', borderRadius: '18px', overflow: 'hidden', backgroundColor: '#13213D', minHeight: '300px' },
  video: { width: '100%', height: 'auto', display: 'block', borderRadius: '18px', backgroundColor: '#13213D', minHeight: '300px', objectFit: 'cover' },
  overlaySvg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  statusBadge: { position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFFFFF', padding: '6px 12px', borderRadius: '22px', fontSize: '18px', fontFamily: 'inherit' },
  videoLoadingOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '14px', backgroundColor: 'rgba(0,0,0,0.35)' },
  guidanceContainer: { textAlign: 'center', padding: '12px 0', minHeight: '50px' },
  guidanceText: { fontSize: '18px', fontWeight: 'normal', margin: 0, fontFamily: 'inherit' },
  cameraControls: { display: 'flex', gap: '12px', marginTop: '8px' },
  captureBtn: { flex: 1, padding: '12px', backgroundColor: '#EEECFF', color: '#13213D', border: 'none', borderRadius: '18px', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#C2415A', color: '#FFFFFF', border: 'none', borderRadius: '18px', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit' },
  previewContainer: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '18px', border: '1px solid #E6EAF2', textAlign: 'center' },
  previewTitle: { fontSize: '18px', color: '#13213D', marginBottom: '12px', fontFamily: 'inherit', fontWeight: 'normal' },
  previewImage: { maxWidth: '100%', maxHeight: '350px', borderRadius: '18px', marginBottom: '16px' },
  previewActions: { display: 'flex', gap: '12px', justifyContent: 'center' },
  retakeBtn: { padding: '10px 24px', backgroundColor: '#F4F5F9', color: '#13213D', border: '1px solid #E6EAF2', borderRadius: '18px', cursor: 'pointer', fontFamily: 'inherit' },
  useBtn: { padding: '10px 24px', backgroundColor: '#EEECFF', color: '#13213D', border: 'none', borderRadius: '18px', cursor: 'pointer', fontFamily: 'inherit' },
  photoContainer: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '18px', border: '1px solid #E6EAF2', textAlign: 'center' },
  photoPreview: { maxWidth: '100%', maxHeight: '350px', borderRadius: '18px', marginBottom: '16px' },
  photoActions: { display: 'flex', gap: '12px', justifyContent: 'center' },
  analyzeBtn: { padding: '10px 30px', backgroundColor: '#EEECFF', color: '#13213D', border: 'none', borderRadius: '18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '16px' },
  resultCard: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '18px', border: '1px solid #E6EAF2', marginTop: '24px' },
  resultTitle: { fontSize: '18px', color: '#13213D', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E6EAF2', paddingBottom: '10px', fontWeight: '600' },
  resultMain: { marginBottom: '16px' },
  resultConcern: { backgroundColor: '#F4F5F9', padding: '16px', borderRadius: '18px', textAlign: 'center' },
  resultConcernLabel: { display: 'block', fontSize: '12px', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.5px' },
  resultConcernValue: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#13213D', margin: '4px 0' },
  resultConfidenceBadge: { display: 'inline-block', padding: '4px 12px', backgroundColor: '#EEECFF', color: '#13213D', borderRadius: '22px', fontSize: '12px' },
  resultRow: { marginBottom: '12px' },
  resultLabel: { fontSize: '14px', fontWeight: '500', color: '#667085', display: 'block', marginBottom: '4px' },
  resultTags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  resultTag: { backgroundColor: '#F4F5F9', padding: '4px 14px', borderRadius: '22px', fontSize: '13px', color: '#13213D' },
  recommendationsSection: { marginTop: '16px', borderTop: '1px solid #E6EAF2', paddingTop: '16px' },
  recommendationsTitle: { fontSize: '15px', fontWeight: '600', color: '#13213D', marginBottom: '12px' },
  recommendationsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  recommendationItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E6EAF2' },
  recommendationImage: { width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', backgroundColor: '#E6EAF2', flexShrink: 0 },
  recommendationInfo: { flex: 1 },
  recommendationName: { fontSize: '13px', fontWeight: '500', color: '#13213D' },
  recommendationBrand: { fontSize: '11px', color: '#667085' },
  recommendationMeta: { fontSize: '11px', color: '#667085', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' },
  recommendationMatch: { backgroundColor: '#E6EAF2', padding: '1px 8px', borderRadius: '18px', fontSize: '10px', color: '#13213D' },
  routineSection: { marginTop: '16px', borderTop: '1px solid #E6EAF2', paddingTop: '16px' },
  routineTitle: { fontSize: '15px', fontWeight: '600', color: '#13213D', marginBottom: '12px' },
  routineList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  routineItem: { display: 'flex', alignItems: 'center', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E6EAF2', gap: '12px' },
  routineStep: { fontSize: '13px', fontWeight: '600', color: '#6F63D8', minWidth: '100px' },
  routineDesc: { fontSize: '13px', color: '#13213D' },
  instructionsSection: { marginTop: '16px', borderTop: '1px solid #E6EAF2', paddingTop: '16px' },
  instructionsTitle: { fontSize: '15px', fontWeight: '600', color: '#13213D', marginBottom: '12px' },
  instructionsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  instructionItem: { display: 'flex', alignItems: 'flex-start', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E6EAF2', gap: '10px' },
  instructionIcon: { fontSize: '14px', minWidth: '30px' },
  instructionText: { fontSize: '13px', color: '#13213D', lineHeight: '1.4' },
  resultMessage: { marginTop: '16px', padding: '12px 16px', backgroundColor: '#F4F5F9', borderRadius: '18px', fontSize: '14px', color: '#13213D' },
  feedbackSection: { marginTop: '16px', borderTop: '1px solid #E6EAF2', paddingTop: '16px' },
  feedbackTitle: { fontSize: '15px', fontWeight: '600', color: '#13213D', marginBottom: '12px' },
  feedbackGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' },
  feedbackCheckbox: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#13213D', cursor: 'pointer' },
  feedbackTextarea: { width: '100%', padding: '10px 14px', border: '1px solid #E6EAF2', borderRadius: '18px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '12px', backgroundColor: '#FFFFFF' },
  feedbackButtons: { display: 'flex', gap: '12px' },
  continueBtn: { flex: 1, padding: '12px', backgroundColor: '#EEECFF', color: '#13213D', border: 'none', borderRadius: '18px', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit' },
  newAnalysisBtn: { padding: '12px 30px', backgroundColor: '#EEECFF', color: '#13213D', border: 'none', borderRadius: '18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '16px', marginTop: '12px', width: '100%' },
  uploadedPhotoSection: { marginBottom: '16px', textAlign: 'center' },
  sectionSubtitle: { fontSize: '14px', fontWeight: '600', color: '#13213D', marginBottom: '8px' },
  uploadedPhoto: { maxWidth: '100%', maxHeight: '300px', borderRadius: '18px', border: '1px solid #E6EAF2', objectFit: 'cover' },
};

export default AiAnalysis;