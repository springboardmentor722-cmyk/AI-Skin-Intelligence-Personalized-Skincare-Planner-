"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { FaceMesh, type Results } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { analyzeScan, type SkinAnalysis } from "@/lib/api";
import { CheckCircle2, ScanFace, AlertCircle } from "lucide-react";

type Alignment = "searching" | "aligned" | "too_close" | "too_far";

interface Props {
  onAnalysisComplete: (analysis: SkinAnalysis, scanId: string) => void;
}

export default function FaceScanCapture({ onAnalysisComplete }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [alignment, setAlignment] = useState<Alignment>("searching");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
    faceMesh.onResults(onMeshResults);

    let camera: Camera | null = null;
    if (webcamRef.current?.video) {
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video) await faceMesh.send({ image: webcamRef.current.video });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
    return () => {
      camera?.stop();
      faceMesh.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMeshResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiFaceLandmarks?.length) {
      setAlignment("searching");
      return;
    }

    // Use inter-eye distance relative to frame width as a proxy for distance-from-camera
    const landmarks = results.multiFaceLandmarks[0];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);

    if (eyeDistance > 0.32) setAlignment("too_close");
    else if (eyeDistance < 0.16) setAlignment("too_far");
    else setAlignment("aligned");

    // Draw a soft guide oval — visual feedback only, not the actual analysis input
    ctx.strokeStyle = alignment === "aligned" ? "#4a7a5f" : "#c9a380";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width * 0.28, canvas.height * 0.4, 0, 0, 2 * Math.PI);
    ctx.stroke();
  }, [alignment]);

  const capture = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const blob = await (await fetch(imageSrc)).blob();
      const { analysis, scan_id } = await analyzeScan(blob);
      onAnalysisComplete(analysis, scan_id);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Analysis failed. Please retake the photo with good, even lighting.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const alignmentMessage: Record<Alignment, string> = {
    searching: "Position your face inside the oval",
    too_close: "Move back a little",
    too_far: "Move closer",
    aligned: "Perfect — hold still",
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden bg-black shadow-xl">
        <Webcam
          ref={webcamRef}
          mirrored
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 h-full w-full" />

        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={alignment}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur"
            >
              {alignment === "aligned" ? <CheckCircle2 size={16} className="text-emerald-400" /> : <ScanFace size={16} />}
              {alignmentMessage[alignment]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.96 }}
        disabled={alignment !== "aligned" || isAnalyzing}
        onClick={capture}
        className="rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground shadow-lg transition-opacity disabled:opacity-40"
      >
        {isAnalyzing ? "Analyzing your skin…" : "Capture & Analyze"}
      </motion.button>
    </div>
  );
}
