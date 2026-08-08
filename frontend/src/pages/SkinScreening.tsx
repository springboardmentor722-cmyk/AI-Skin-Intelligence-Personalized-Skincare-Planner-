import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, AlertCircle, CheckCircle, Search, X } from 'lucide-react';

export default function SkinScreening() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
            stopCamera();
            
            const isBlank = blob.size < 500;
            
            // Convert to base64 for the API
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              const base64data = reader.result as string;
              handleScan(imageUrl, isBlank, base64data);
            };
          }
        }, 'image/jpeg');
      }
    }
  };

  // Attach stream when video element mounts
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleScan = async (imageUrl: string, isLikelyBlank: boolean, base64Data: string) => {
    setScanning(true);
    
    if (isLikelyBlank) {
      setScanning(false);
      setResults({
        error: true,
        message: "Unable to detect clear features or lighting is too dim."
      });
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      // 1. Call AI Vision API
      const analyzeRes = await fetch('http://localhost:8000/api/v1/screening/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image_data: base64Data })
      });
      
      const aiResults = await analyzeRes.json();
      aiResults.error = false;
      setResults(aiResults);

      // 2. Save the screening to database
      if (aiResults.detected_concerns && aiResults.detected_concerns.length > 0) {
        await fetch('http://localhost:8000/api/v1/screening/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
             primary_concern: aiResults.detected_concerns[0] || "Unknown",
             secondary_concern: aiResults.detected_concerns[1] || "Unknown",
             overall_score: aiResults.overall_score || 75,
             image_data: base64Data
          })
        });
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
      setResults({
        error: true,
        message: "AI Analysis failed to process the image."
      });
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
      
      const isBlank = file.size < 500;
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        handleScan(imageUrl, isBlank, base64data);
      };
    }
  };

  const resetScan = () => {
    setResults(null);
    setCapturedImage(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-serif text-[#001534] mb-2">AI Skin Screening</h1>
        <p className="text-slate-500">Detect your skin concerns instantly using our advanced AI analysis tool.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Scanner Area */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#e5dfd1] flex flex-col items-center justify-center min-h-[400px]">
          
          {!scanning && !results && !isCameraActive && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-[#f6f2e9] rounded-full flex items-center justify-center mx-auto border border-[#d6c7b0]">
                <Camera className="w-10 h-10 text-[#9f7c46]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#001534] mb-2">Ready for analysis?</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">Take a clear photo of your face in natural light without makeup for the best results.</p>
                {cameraError && (
                  <p className="text-sm text-red-500 mb-2">Unable to access camera. Please check your permissions.</p>
                )}
              </div>
              <div className="flex justify-center gap-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button onClick={startCamera} className="bg-[#001534] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1a2d4c] transition flex items-center shadow-md">
                  <Camera className="w-4 h-4 mr-2" /> Take Photo
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="border border-[#001534] text-[#001534] px-6 py-3 rounded-lg font-bold hover:bg-[#f6f2e9] transition flex items-center">
                  <Upload className="w-4 h-4 mr-2" /> Upload
                </button>
              </div>
            </div>
          )}

          {isCameraActive && (
             <div className="w-full flex flex-col items-center space-y-4 relative">
                <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    style={{ transform: 'scaleX(-1)' }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none border-4 border-[#9f7c46] opacity-30 rounded-2xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-48 h-64 border-2 border-dashed border-white opacity-50 rounded-full"></div>
                  </div>
                  <button 
                    onClick={stopCamera} 
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <button 
                  onClick={capturePhoto} 
                  className="bg-[#001534] text-white px-8 py-4 rounded-full font-bold hover:bg-[#1a2d4c] transition shadow-lg flex items-center text-lg gap-2"
                >
                  <Camera className="w-5 h-5" /> Capture Image
                </button>
             </div>
          )}

          {scanning && (
            <div className="text-center space-y-6">
              {capturedImage && (
                <img src={capturedImage} alt="Captured scan" className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-[#e5dfd1] opacity-50" />
              )}
              <div className="relative w-32 h-32 mx-auto mt-[-128px]">
                <div className="absolute inset-0 border-4 border-[#e5dfd1] rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#9f7c46] rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="w-8 h-8 text-[#9f7c46] animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#001534] mb-2">Analyzing your skin...</h3>
                <p className="text-sm text-slate-500">Detecting textures, pores, and pigmentation</p>
              </div>
            </div>
          )}

          {results && (
            <div className="text-center space-y-6 w-full">
               {capturedImage && (
                  <img src={capturedImage} alt="Your skin" className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-[#e5dfd1] shadow-md bg-black" />
               )}
              
              {results.error ? (
                <div>
                  <h3 className="text-2xl font-bold text-red-600 mb-1">Scan Failed</h3>
                  <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">{results.message}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-bold text-[#001534] mb-1">Analysis Complete</h3>
                  <p className="text-sm text-slate-500">Skin Health Score: <span className="font-bold text-[#9f7c46] text-lg">{results.overall_score}/100</span></p>
                </div>
              )}

              <button onClick={resetScan} className="text-sm text-slate-500 hover:text-[#001534] underline">Try again</button>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="bg-[#fdfbf5] p-8 rounded-3xl shadow-sm border border-[#e5dfd1] flex flex-col h-full">
          <h3 className="text-xl font-serif text-[#001534] mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-[#9f7c46]" /> Detected Concerns
          </h3>

          {!results ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Run a scan to see your detected skin concerns here.
            </div>
          ) : results.error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h4 className="font-bold text-[#001534] mb-2">
                {results.message.includes('lighting') ? 'No Face Detected' : 'Analysis Failed'}
              </h4>
              <p className="text-slate-500 text-sm max-w-sm">
                {results.message.includes('lighting') 
                  ? "We couldn't analyze the photo because it appears too dark or lacks clear facial features. Please ensure you are in a well-lit area and your face is visible."
                  : "Our system encountered an unexpected error while processing your image. Please try again or use a different photo."}
              </p>
            </div>
          ) : (
            <div className="space-y-6 flex-1 animate-fadeIn">
              <div className="space-y-3">
                {(results.detected_concerns || []).map((c: string, i: number) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-[#e5dfd1] shadow-sm flex items-center justify-between">
                    <span className="font-medium text-[#001534]">{c}</span>
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-bold">Detected</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-[#e5dfd1]">
                <h4 className="font-bold text-[#001534] mb-4">Recommended Next Steps</h4>
                <div className="space-y-2 mb-6">
                  {(results.recommendations || []).map((r: string, i: number) => (
                    <div key={i} className="flex items-center text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Add {r}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/dashboard/routines')} className="w-full bg-gradient-to-r from-[#d1b17d] to-[#a47e45] text-[#1a1a1a] p-3 rounded-lg font-bold hover:opacity-90 transition shadow-md">
                  Generate Personalized Routine
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
