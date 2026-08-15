// frontend/src/pages/SimpleCamera.js
import React, { useRef, useState } from 'react';

function SimpleCamera() {
  const videoRef = useRef(null);
  const [isOn, setIsOn] = useState(false);
  const [error, setError] = useState('');

  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        setIsOn(true);
      };
    } catch (err) {
      setError(err.message);
    }
  };

  const stopCam = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
      setIsOn(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📷 Camera Test</h1>
        {error && <p style={styles.error}>❌ {error}</p>}
        
        <div style={styles.videoWrapper}>
          <video 
            ref={videoRef} 
            style={styles.video} 
            playsInline 
          />
        </div>
        
        <div style={styles.buttonRow}>
          {!isOn ? (
            <button onClick={startCam} style={styles.startBtn}>
              📷 Start Camera
            </button>
          ) : (
            <button onClick={stopCam} style={styles.stopBtn}>
              ✕ Stop Camera
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F8F5F7',
    fontFamily: '"Times New Roman", Times, serif',
    padding: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(107, 79, 107, 0.08)',
    maxWidth: '600px',
    width: '100%',
    border: '1px solid #E8DCE0',
  },
  title: {
    textAlign: 'center',
    color: '#2C1E2C',
    marginBottom: '20px',
    fontSize: '28px',
    fontWeight: 'normal',
    letterSpacing: '1px',
  },
  videoWrapper: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    overflow: 'hidden',
    height: '400px',
    marginBottom: '20px',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  startBtn: {
    padding: '12px 30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontFamily: '"Times New Roman", Times, serif',
  },
  stopBtn: {
    padding: '12px 30px',
    backgroundColor: '#B22222',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontFamily: '"Times New Roman", Times, serif',
  },
  error: {
    color: '#B22222',
    textAlign: 'center',
    backgroundColor: '#FDF0ED',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
};

export default SimpleCamera;