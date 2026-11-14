import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, VideoOff, Sparkles, AlertCircle, Wifi, WifiOff } from 'lucide-react';

/**
 * Hand Landmark skeleton connection pairs (MediaPipe Hands — 21 landmarks)
 * Defined outside component to prevent re-creation.
 */
const SKELETON_PAIRS = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],        // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17],                               // Palm base
];

/** Normalize 21 MediaPipe landmarks to wrist-centered unit sphere (63 floats) */
function normalizeLandmarks(landmarks) {
  const pts = landmarks.map((lm) => [lm.x, lm.y, lm.z || 0]);
  const wx = pts[0][0], wy = pts[0][1], wz = pts[0][2];
  const centered = pts.map(([x, y, z]) => [x - wx, y - wy, z - wz]);
  const maxDist = Math.max(
    ...centered.map(([x, y, z]) => Math.sqrt(x * x + y * y + z * z))
  ) || 1e-7;
  const normalized = centered.map(([x, y, z]) => [x / maxDist, y / maxDist, z / maxDist]);
  return normalized.flat(); // 63 floats
}

/** Load MediaPipe Hands CDN scripts dynamically */
function loadMediaPipeHands() {
  return new Promise((resolve, reject) => {
    if (window.__mediapipeHandsLoaded) { resolve(); return; }

    const holistic = document.createElement('script');
    holistic.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js';
    holistic.crossOrigin = 'anonymous';
    holistic.onload = () => {
      const camera = document.createElement('script');
      camera.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js';
      camera.crossOrigin = 'anonymous';
      camera.onload = () => {
        window.__mediapipeHandsLoaded = true;
        resolve();
      };
      camera.onerror = reject;
      document.head.appendChild(camera);
    };
    holistic.onerror = reject;
    document.head.appendChild(holistic);
  });
}

/**
 * LiveCameraTracker
 * Universal Camera & Landmark Viewport with Real MediaPipe Hands + Graceful Sim Fallback.
 * - Simulation Mode (default): beautiful animated skeleton, no webcam required
 * - Live Mode: Real MediaPipe Hands via CDN → 21 landmarks → WebSocket /api/gesture/ws/stream
 * - Clean hardware track release on unmount / toggle
 */
export default function LiveCameraTracker({ onSignDetected, activeSign = 'PAIN' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const handsRef = useRef(null);
  const cameraUtilRef = useRef(null);
  const wsRef = useRef(null);
  const mediapipeActiveRef = useRef(false);

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [fps, setFps] = useState(60);
  const [detectedSign, setDetectedSign] = useState(activeSign);
  const [confidence, setConfidence] = useState(0.964);
  const [wsConnected, setWsConnected] = useState(false);
  const [isMediaPipeMode, setIsMediaPipeMode] = useState(false); // true = real MP, false = sim

  // --- WebSocket connection to /api/gesture/ws/stream ---
  const connectWS = useCallback(() => {
    try {
      const ws = new WebSocket('ws://127.0.0.1:8000/api/gesture/ws/stream');
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.predicted_gloss) {
            setDetectedSign(data.predicted_gloss);
            setConfidence(parseFloat(data.confidence || 0.95));
            if (onSignDetected) onSignDetected(data.predicted_gloss);
          }
        } catch { /* ignore parse errors */ }
      };
      wsRef.current = ws;
    } catch { /* WS not available offline */ }
  }, [onSignDetected]);

  const disconnectWS = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* ignore */ }
      wsRef.current = null;
      setWsConnected(false);
    }
  }, []);

  // --- Draw canvas (simulation or MediaPipe passthrough) ---
  const drawSimulatedLandmarks = useCallback((ctx, width, height, tick) => {
    try {
      ctx.clearRect(0, 0, width, height);

      // Grid overlay
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      const bcx = width * 0.5 + Math.sin(tick * 0.04) * 20;
      const bcy = height * 0.55 + Math.cos(tick * 0.04) * 15;

      const landmarks = [
        { x: bcx, y: bcy + 40 },
        { x: bcx - 25, y: bcy + 20 }, { x: bcx - 40, y: bcy }, { x: bcx - 45, y: bcy - 20 }, { x: bcx - 48, y: bcy - 35 },
        { x: bcx - 15, y: bcy - 10 }, { x: bcx - 18, y: bcy - 35 }, { x: bcx - 20, y: bcy - 55 }, { x: bcx - 22, y: bcy - 70 },
        { x: bcx, y: bcy - 12 }, { x: bcx, y: bcy - 40 }, { x: bcx, y: bcy - 62 }, { x: bcx, y: bcy - 80 },
        { x: bcx + 15, y: bcy - 10 }, { x: bcx + 18, y: bcy - 35 }, { x: bcx + 20, y: bcy - 55 }, { x: bcx + 22, y: bcy - 70 },
        { x: bcx + 30, y: bcy }, { x: bcx + 35, y: bcy - 20 }, { x: bcx + 38, y: bcy - 38 }, { x: bcx + 40, y: bcy - 50 },
      ];

      // Golden bone connections
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#B45309';
      ctx.shadowColor = '#B45309';
      ctx.shadowBlur = 6;
      SKELETON_PAIRS.forEach(([i, j]) => {
        const p1 = landmarks[i], p2 = landmarks[j];
        if (p1 && p2) {
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }
      });

      // Clinical teal joints
      landmarks.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, idx === 0 ? 6 : (idx % 4 === 0 ? 4.5 : 3), 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? '#f59e0b' : '#0F766E';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 7;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    } catch (e) {
      console.warn('Canvas sim draw error:', e);
    }
  }, []);

  const drawMediaPipeLandmarks = useCallback((ctx, width, height, mpLandmarks) => {
    try {
      ctx.clearRect(0, 0, width, height);
      const lms = mpLandmarks.map((lm) => ({ x: lm.x * width, y: lm.y * height }));

      // Golden bone connections
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#B45309';
      ctx.shadowColor = '#B45309';
      ctx.shadowBlur = 5;
      SKELETON_PAIRS.forEach(([i, j]) => {
        const p1 = lms[i], p2 = lms[j];
        if (p1 && p2) {
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }
      });

      // Clinical teal joints
      lms.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, idx === 0 ? 7 : (idx % 4 === 0 ? 5 : 3.5), 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? '#f59e0b' : '#0F766E';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    } catch (e) {
      console.warn('Canvas MP draw error:', e);
    }
  }, []);

  // --- Simulation animation loop (when not in live mode) ---
  useEffect(() => {
    if (isLiveMode && isMediaPipeMode) return; // MediaPipe handles its own loop

    let tick = 0;
    let lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let frameCount = 0;

    const renderLoop = (time) => {
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = time;
      }
      const canvas = canvasRef.current;
      if (canvas && !mediapipeActiveRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawSimulatedLandmarks(ctx, canvas.width, canvas.height, tick);
      }
      tick++;
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isLiveMode, isMediaPipeMode, drawSimulatedLandmarks]);

  // --- Initialize MediaPipe Hands ---
  const initMediaPipe = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      await loadMediaPipeHands();
    } catch (e) {
      console.warn('MediaPipe CDN load failed — staying in simulation mode:', e);
      setCameraError('MediaPipe CDN unavailable. Simulation active.');
      setIsMediaPipeMode(false);
      return;
    }

    if (!window.Hands) {
      setCameraError('MediaPipe Hands not found in window. Simulation active.');
      return;
    }

    const hands = new window.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const mpLandmarks = results.multiHandLandmarks[0];
        drawMediaPipeLandmarks(ctx, canvas.width, canvas.height, mpLandmarks);

        // Send to WebSocket every frame
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const payload = normalizeLandmarks(mpLandmarks);
          wsRef.current.send(JSON.stringify({ landmarks: payload }));
        }
      } else {
        // No hand detected: draw empty grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    handsRef.current = hands;

    // Use CameraUtils if available, otherwise manual frame loop
    if (window.Camera && videoRef.current) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current) await handsRef.current.send({ image: videoRef.current });
        },
        width: 480,
        height: 240,
      });
      camera.start();
      cameraUtilRef.current = camera;
    }

    mediapipeActiveRef.current = true;
    setIsMediaPipeMode(true);
  }, [drawMediaPipeLandmarks]);

  // --- Stop camera + MediaPipe cleanly ---
  const stopCamera = useCallback(() => {
    try {
      mediapipeActiveRef.current = false;
      if (cameraUtilRef.current) {
        try { cameraUtilRef.current.stop(); } catch { /* ignore */ }
        cameraUtilRef.current = null;
      }
      if (handsRef.current) {
        try { handsRef.current.close(); } catch { /* ignore */ }
        handsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsMediaPipeMode(false);
    } catch (e) {
      console.warn('Error stopping camera:', e);
    }
  }, []);

  // --- Start WebRTC camera + MediaPipe ---
  const startCamera = async () => {
    setIsCameraStarting(true);
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('WebRTC Camera API not supported.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((e) => console.warn('Video play:', e));
      }
      setIsLiveMode(true);
      connectWS();
      await initMediaPipe();
      if (onSignDetected) onSignDetected(detectedSign);
    } catch (err) {
      console.warn('Webcam access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Simulation active.'
          : 'Webcam not detected. Simulation active.'
      );
      setIsLiveMode(false);
    } finally {
      setIsCameraStarting(false);
    }
  };

  const toggleLiveCamera = () => {
    if (isLiveMode) {
      stopCamera();
      disconnectWS();
      setIsLiveMode(false);
    } else {
      startCamera();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      disconnectWS();
    };
  }, [stopCamera, disconnectWS]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {/* Viewport Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '240px',
          borderRadius: '12px',
          backgroundColor: '#050b14',
          overflow: 'hidden',
          border: isLiveMode
            ? '2px solid var(--accent-green)'
            : '2px dashed var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Background Live Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            opacity: isLiveMode ? 0.75 : 0,
            pointerEvents: 'none',
          }}
        />

        {/* Foreground Canvas for 21 Skeletal Landmarks */}
        <canvas
          ref={canvasRef}
          width={480}
          height={240}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none',
          }}
        />

        {/* Mode pill — top left */}
        <div
          style={{
            position: 'absolute', top: '12px', left: '12px',
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '999px',
            backgroundColor: 'rgba(15,23,42,0.85)',
            border: `1px solid ${isLiveMode ? 'var(--accent-green)' : 'var(--accent-yellow)'}`,
            fontSize: '11px', fontWeight: 'bold',
            color: isLiveMode ? 'var(--accent-green)' : 'var(--accent-yellow)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: isLiveMode ? 'var(--accent-green)' : 'var(--accent-yellow)',
            animation: 'pulse 1.5s infinite',
          }} />
          {isLiveMode
            ? `🟢 ${isMediaPipeMode ? 'MediaPipe Live' : 'WebRTC Live'} (${fps} FPS)`
            : `⚪ Edge Simulator (${fps} FPS)`}
        </div>

        {/* WS status — top right */}
        <div
          style={{
            position: 'absolute', top: '12px', right: '12px',
            padding: '4px 8px', borderRadius: '6px',
            backgroundColor: 'rgba(15,23,42,0.85)',
            border: `1px solid ${wsConnected ? 'var(--accent-green)' : 'var(--accent-cyan)'}`,
            fontSize: '11px',
            color: wsConnected ? 'var(--accent-green)' : 'var(--accent-cyan)',
            fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          {wsConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {wsConnected ? 'WS Stream Live' : '21 Landmarks Extracted'}
        </div>

        {/* Detected sign — bottom left */}
        <div
          style={{
            position: 'absolute', bottom: '12px', left: '12px',
            padding: '6px 14px', borderRadius: '8px',
            backgroundColor: 'rgba(15,23,42,0.9)',
            border: '1px solid var(--accent-cyan)',
            fontSize: '13px', color: 'var(--accent-cyan)',
            fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <Sparkles size={16} />
          Detected Sign:{' '}
          <span style={{ color: 'var(--accent-yellow)' }}>{detectedSign}</span>
          {' '}({(confidence * 100).toFixed(1)}%)
        </div>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          onClick={toggleLiveCamera}
          disabled={isCameraStarting}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '8px',
            backgroundColor: isLiveMode ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${isLiveMode ? 'var(--accent-red)' : 'var(--accent-green)'}`,
            color: isLiveMode ? 'var(--accent-red)' : 'var(--accent-green)',
            fontSize: '12px', fontWeight: 'bold',
            cursor: isCameraStarting ? 'wait' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {isCameraStarting ? (
            '⏳ Starting MediaPipe…'
          ) : isLiveMode ? (
            <><VideoOff size={14} /> Stop Webcam (Switch to Simulation)</>
          ) : (
            <><Camera size={14} /> 🟢 Switch to Live MediaPipe Camera</>
          )}
        </button>

        {cameraError ? (
          <span style={{ fontSize: '11px', color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> {cameraError}
          </span>
        ) : (
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {isMediaPipeMode
              ? 'MediaPipe Hands CDN • 21 Landmarks → WS /api/gesture/ws/stream'
              : 'MediaPipe Hand Pipeline • Sub-30ms Edge Inference'}
          </span>
        )}
      </div>
    </div>
  );
}
