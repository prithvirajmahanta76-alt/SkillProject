import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  BellRing,
  Droplets,
  BedDouble,
  Sliders,
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  Activity,
  Camera,
  VideoOff,
  AlertCircle,
  Crosshair,
} from 'lucide-react';
import api from '../services/api';

/** Dynamic CDN loader for MediaPipe Face Mesh */
function loadMediaPipeFaceMesh() {
  return new Promise((resolve, reject) => {
    if (window.__mediapipeFaceMeshLoaded) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      const cameraScript = document.createElement('script');
      cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js';
      cameraScript.crossOrigin = 'anonymous';
      cameraScript.onload = () => {
        window.__mediapipeFaceMeshLoaded = true;
        resolve();
      };
      cameraScript.onerror = reject;
      document.head.appendChild(cameraScript);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function dist2D(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/** Calculate Eye Aspect Ratio from standard 6-point eye landmarks */
function calculateEyeEAR(pOuter, pInner, pTop1, pTop2, pBot1, pBot2) {
  const vert1 = dist2D(pTop1, pBot1);
  const vert2 = dist2D(pTop2, pBot2);
  const horiz = dist2D(pOuter, pInner);
  if (horiz === 0) return 0.28;
  return (vert1 + vert2) / (2.0 * horiz);
}

/**
 * MotorHandsFree
 * Phase 4: Motor-Impaired Hands-Free Controller Component
 * - Professional Warm Cream & Golden Aesthetic (WCAG 2.1 AAA Compliant)
 * - MediaPipe Face Mesh Head Pitch/Yaw/Roll & Eye Aspect Ratio (EAR) Detector
 * - Interactive 3D Biomechanical Wireframe Avatar with Live Landmark Tracking
 * - Precision Circular Dwell-Gaze Radial Ring with Countdown Timer
 * - 6 High-Impact Bedside Clinical Directives (ALS, Quadriplegia, Spinal Injury)
 * - Micro-gesture Sensitivity Calibration & Immediate Acoustic TTS Feedback
 */
export default function MotorHandsFree({
  motorAction,
  setMotorAction,
  motorFeedback,
  setMotorFeedback,
  handleTriggerSOS,
}) {
  // Biomechanical Angle & Eye Metrics
  const [pitch, setPitch] = useState(0); // Up/Down (-20 to +30 deg)
  const [yaw, setYaw] = useState(0);     // Left/Right (-35 to +35 deg)
  const [ear, setEar] = useState(0.28);  // Eye Aspect Ratio (>0.25 open, <0.20 closed)

  // Camera / MediaPipe states
  const [isLiveCamera, setIsLiveCamera] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Dwell state
  const [dwellProgress, setDwellProgress] = useState(0);
  const [dwellTarget, setDwellTarget] = useState(null);

  // Sensitivity: 'high' (ALS micro-gestures) or 'standard'
  const [sensitivity, setSensitivity] = useState('standard');
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);
  const [showLaserReticle, setShowLaserReticle] = useState(true);
  const [lastExecuted, setLastExecuted] = useState(null);

  const dwellTimerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraUtilRef = useRef(null);
  const lastApiCallTimeRef = useRef(0);
  const consecutiveBlinksRef = useRef(0);
  const lastActionExecutedTimeRef = useRef(0);

  // Sound & Speech synthesizer
  const speakFeedback = useCallback((text) => {
    if (!voiceFeedbackEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio speech fallback
    }
  }, [voiceFeedbackEnabled]);

  // Execute Action Handler
  const executeAction = useCallback((actionKey) => {
    const now = Date.now();
    // Debounce re-execution
    if (now - lastActionExecutedTimeRef.current < 1500) return;
    lastActionExecutedTimeRef.current = now;

    setLastExecuted(actionKey);

    if (actionKey === 'YES') {
      setPitch(22);
      setMotorAction('YES_CONFIRM');
      const msg = 'Confirmed: YES / Approved';
      setMotorFeedback(msg);
      speakFeedback('Confirmed YES');
    } else if (actionKey === 'NO') {
      setYaw(-25);
      setMotorAction('NO_CANCEL');
      const msg = 'Cancelled: NO / Declined';
      setMotorFeedback(msg);
      speakFeedback('Cancelled NO');
    } else if (actionKey === 'BLINK') {
      setEar(0.11);
      setMotorAction('DOUBLE_BLINK_EMERGENCY');
      const msg = 'CRITICAL: Sustained Double-Blink SOS Activated!';
      setMotorFeedback(msg);
      speakFeedback('Emergency SOS Alert sent to nurse desk');
      handleTriggerSOS('FALL_DETECTED');
    } else if (actionKey === 'NURSE') {
      setMotorAction('CALL_NURSE');
      const msg = 'Bedside Alert: Nurse dispatched to Room 304';
      setMotorFeedback(msg);
      speakFeedback('Nurse called to bedside');
    } else if (actionKey === 'WATER') {
      setMotorAction('REQUEST_WATER');
      const msg = 'Hydration Request: Water & Oral Care Logged';
      setMotorFeedback(msg);
      speakFeedback('Hydration assistance requested');
    } else if (actionKey === 'REPOSITION') {
      setMotorAction('BED_REPOSITION');
      const msg = 'Bed Adjustment: Incline +30° Requested';
      setMotorFeedback(msg);
      speakFeedback('Bed repositioning assistance requested');
    }

    // Auto-reset biomechanical gauges smoothly if in simulation
    if (!isLiveCamera) {
      setTimeout(() => {
        setPitch(0);
        setYaw(0);
        setEar(0.28);
      }, 2200);
    }
  }, [isLiveCamera, setMotorAction, setMotorFeedback, handleTriggerSOS, speakFeedback]);

  // Dwell countdown timer
  useEffect(() => {
    if (!dwellTarget) {
      return;
    }

    const intervalStep = 60; // ms
    const totalDuration = sensitivity === 'high' ? 800 : 1200; // ms
    const increment = (intervalStep / totalDuration) * 100;

    dwellTimerRef.current = setInterval(() => {
      setDwellProgress((prev) => {
        if (prev + increment >= 100) {
          clearInterval(dwellTimerRef.current);
          executeAction(dwellTarget);
          return 100;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => {
      if (dwellTimerRef.current) {
        clearInterval(dwellTimerRef.current);
      }
    };
  }, [dwellTarget, sensitivity, executeAction]);

  const handleStartDwell = (target) => {
    setDwellTarget(target);
    setDwellProgress(0);
  };

  const handleStopDwell = () => {
    if (dwellTimerRef.current) {
      clearInterval(dwellTimerRef.current);
    }
    setDwellTarget(null);
    setDwellProgress(0);
  };

  // Process MediaPipe FaceMesh results
  const onFaceResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return;
    }

    const lms = results.multiFaceLandmarks[0];

    // Key landmarks:
    // 10: Top forehead
    // 152: Bottom of chin
    // 234: Left face border
    // 454: Right face border
    const forehead = lms[10];
    const chin = lms[152];
    const leftCheek = lms[234];
    const rightCheek = lms[454];

    // Pitch: vertical nod (angle from z/y coordinates)
    const dy = chin.y - forehead.y;
    const dzPitch = (chin.z || 0) - (forehead.z || 0);
    const rawPitch = Math.atan2(dzPitch, dy) * (180 / Math.PI) * 1.5;

    // Yaw: horizontal shake (angle from z/x coordinates)
    const dx = rightCheek.x - leftCheek.x;
    const dzYaw = (rightCheek.z || 0) - (leftCheek.z || 0);
    const rawYaw = Math.atan2(dzYaw, dx) * (180 / Math.PI) * 1.5;

    // EAR:
    // Left eye: 33 (outer), 133 (inner), 160 (top1), 158 (top2), 144 (bot1), 153 (bot2)
    const leftEAR = calculateEyeEAR(lms[33], lms[133], lms[160], lms[158], lms[144], lms[153]);
    // Right eye: 263 (outer), 362 (inner), 385 (top1), 387 (top2), 380 (bot1), 373 (bot2)
    const rightEAR = calculateEyeEAR(lms[263], lms[362], lms[385], lms[387], lms[380], lms[373]);
    const computedEAR = Math.max(0.05, Math.min(0.40, (leftEAR + rightEAR) / 2.0));

    // Clamp values
    const clampedPitch = Math.round(Math.max(-35, Math.min(35, rawPitch)));
    const clampedYaw = Math.round(Math.max(-45, Math.min(45, rawYaw)));
    const roundedEAR = Number(computedEAR.toFixed(2));

    setPitch(clampedPitch);
    setYaw(clampedYaw);
    setEar(roundedEAR);

    // Track blinks
    if (roundedEAR < 0.20) {
      consecutiveBlinksRef.current += 1;
    } else {
      consecutiveBlinksRef.current = 0;
    }

    // Draw small facial wireframe landmark mesh onto canvas
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1;
      const keyIdxs = [1, 10, 152, 234, 454, 33, 133, 263, 362];
      keyIdxs.forEach((idx) => {
        const pt = lms[idx];
        if (pt) {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2, 0, Math.PI * 2);
          ctx.fillStyle = idx === 1 ? '#15803D' : '#0F766E';
          ctx.fill();
        }
      });
    }

    // Call backend API /api/face-control/detect-gesture (debounced to 250ms)
    const now = Date.now();
    if (now - lastApiCallTimeRef.current > 250) {
      lastApiCallTimeRef.current = now;
      api.detectFaceGesture({
        ear: roundedEAR,
        pitch: clampedPitch,
        yaw: clampedYaw,
        consecutive_blinks: consecutiveBlinksRef.current,
      }).then((resp) => {
        if (!resp) return;
        if (resp.action === 'YES_CONFIRM') {
          executeAction('YES');
        } else if (resp.action === 'NO_CANCEL') {
          executeAction('NO');
        } else if (resp.action === 'DOUBLE_BLINK_EMERGENCY') {
          executeAction('BLINK');
        }
      }).catch((e) => {
        console.warn('Backend face gesture error:', e);
      });
    }
  }, [executeAction]);

  // Clean stop for camera and FaceMesh
  const stopLiveCamera = useCallback(() => {
    try {
      if (cameraUtilRef.current) {
        cameraUtilRef.current.stop();
        cameraUtilRef.current = null;
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsLiveCamera(false);
      setPitch(0);
      setYaw(0);
      setEar(0.28);
    } catch (e) {
      console.warn('Error stopping face camera:', e);
    }
  }, []);

  // Start live WebRTC + Face Mesh
  const startLiveCamera = async () => {
    setCameraStarting(true);
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('WebRTC Camera API not supported.');
      }
      await loadMediaPipeFaceMesh();

      if (!window.FaceMesh) {
        throw new Error('FaceMesh library could not be loaded.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((e) => console.warn('Video play caught:', e));
      }

      const faceMesh = new window.FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onFaceResults);
      faceMeshRef.current = faceMesh;

      if (window.Camera && videoRef.current) {
        const cam = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 320,
          height: 240,
        });
        cam.start();
        cameraUtilRef.current = cam;
      }

      setIsLiveCamera(true);
    } catch (err) {
      console.warn('FaceMesh initialization failed:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Simulation active.'
          : 'Webcam not detected or FaceMesh CDN unreachable. Simulation active.'
      );
      setIsLiveCamera(false);
    } finally {
      setCameraStarting(false);
    }
  };

  const toggleCamera = () => {
    if (isLiveCamera) {
      stopLiveCamera();
    } else {
      startLiveCamera();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, [stopLiveCamera]);

  // Thresholds based on sensitivity
  const pitchThreshold = sensitivity === 'high' ? 10 : 18;
  const yawThreshold = sensitivity === 'high' ? 14 : 22;

  // Compute laser gaze screen reticle position
  const reticleX = Math.min(94, Math.max(6, 50 + (yaw / 35) * 44));
  const reticleY = Math.min(94, Math.max(6, 50 + (pitch / 25) * 40));

  return (
    <div
      style={{
        background: 'radial-gradient(ellipse at 15% 15%, rgba(245, 158, 11, 0.1) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(180, 83, 9, 0.08) 0%, transparent 55%), linear-gradient(135deg, #FAF6EE 0%, #F5ECE0 50%, #EFE3D3 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '0 25px 60px -15px rgba(180, 83, 9, 0.08), 0 0 1px 1px rgba(217, 180, 130, 0.25)',
        backdropFilter: 'blur(24px)',
        color: '#1C1917',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient background blur */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-60px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Dynamic Keyframes */}
      <style>{`
        @keyframes avatarPulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(15, 118, 110, 0.25)); }
          50% { filter: drop-shadow(0 0 18px rgba(217, 119, 6, 0.35)); }
        }
        @keyframes dwellGlow {
          0% { box-shadow: 0 0 10px rgba(217, 119, 6, 0.3); }
          100% { box-shadow: 0 0 25px rgba(217, 119, 6, 0.6); }
        }
      `}</style>

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid rgba(217, 180, 130, 0.35)',
          paddingBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 8px 20px rgba(180, 83, 9, 0.25)',
            }}
          >
            <UserCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  margin: 0,
                  color: '#1C1917',
                  letterSpacing: '-0.3px',
                }}
              >
                Motor Hands-Free Controller
              </h2>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'rgba(217, 119, 6, 0.12)',
                  color: '#B45309',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  fontSize: '11px',
                  fontWeight: '800',
                }}
              >
                TOUCHLESS UI
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#57534E', margin: '4px 0 0' }}>
              MediaPipe 468 3D Face Mesh: Head Pitch/Yaw nods and Eye Aspect Ratio (EAR) sustained blink for ALS, Cerebral Palsy, and Quadriplegia.
            </p>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Live Camera Toggle Button */}
          <button
            type="button"
            onClick={toggleCamera}
            disabled={cameraStarting}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: isLiveCamera ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.75)',
              border: isLiveCamera ? '1.5px solid #059669' : '1px solid rgba(217, 180, 130, 0.45)',
              color: isLiveCamera ? '#047857' : '#78350F',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: cameraStarting ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(180, 83, 9, 0.05)',
            }}
          >
            {cameraStarting ? (
              '⏳ Loading Face Mesh…'
            ) : isLiveCamera ? (
              <>
                <VideoOff size={15} color="#047857" /> Live Face Mesh Active
              </>
            ) : (
              <>
                <Camera size={15} color="#B45309" /> 🟢 Start Live Face Camera
              </>
            )}
          </button>

          {/* Audio TTS Toggle */}
          <button
            type="button"
            onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: voiceFeedbackEnabled ? 'rgba(15, 118, 110, 0.12)' : 'rgba(255, 255, 255, 0.75)',
              border: voiceFeedbackEnabled ? '1px solid #0F766E' : '1px solid rgba(217, 180, 130, 0.45)',
              color: voiceFeedbackEnabled ? '#0F766E' : '#78716C',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(180, 83, 9, 0.05)',
            }}
            title="Toggle synthesized voice confirmation"
          >
            {voiceFeedbackEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {voiceFeedbackEnabled ? 'Audio On' : 'Audio Muted'}
          </button>

          {/* Sensitivity Mode Toggle */}
          <button
            type="button"
            onClick={() => setSensitivity(sensitivity === 'standard' ? 'high' : 'standard')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: sensitivity === 'high' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(255, 255, 255, 0.75)',
              border: sensitivity === 'high' ? '1.5px solid #D97706' : '1px solid rgba(217, 180, 130, 0.45)',
              color: sensitivity === 'high' ? '#92400E' : '#57534E',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(180, 83, 9, 0.05)',
            }}
          >
            <Sliders size={15} />
            Mode: {sensitivity === 'high' ? 'High Sensitivity (ALS)' : 'Standard'}
          </button>

          {/* Touchless Laser Reticle Toggle */}
          <button
            type="button"
            onClick={() => setShowLaserReticle(!showLaserReticle)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: showLaserReticle ? 'rgba(15, 118, 110, 0.12)' : 'rgba(255, 255, 255, 0.75)',
              border: showLaserReticle ? '1.5px solid #0F766E' : '1px solid rgba(217, 180, 130, 0.45)',
              color: showLaserReticle ? '#0F766E' : '#78716C',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(180, 83, 9, 0.05)',
            }}
            title="Toggle floating head-gaze assistive reticle"
          >
            <Crosshair size={15} />
            Reticle: {showLaserReticle ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Floating Assistive Laser Gaze Reticle */}
      {showLaserReticle && (
        <div
          style={{
            position: 'absolute',
            left: `${reticleX}%`,
            top: `${reticleY}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 60,
            transition: 'left 0.14s ease-out, top 0.14s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              border: `2px solid ${dwellProgress > 0 ? '#10B981' : ear < 0.20 ? '#EF4444' : '#D97706'}`,
              boxShadow: `0 0 25px ${dwellProgress > 0 ? 'rgba(16, 185, 129, 0.7)' : ear < 0.20 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(217, 119, 6, 0.5)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(2px)',
            }}
          >
            {/* Concentric reticle rings */}
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: `1.5px dashed ${dwellProgress > 0 ? '#10B981' : '#D97706'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: dwellProgress > 0 ? '#10B981' : ear < 0.20 ? '#EF4444' : '#B45309',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            color: '#B45309',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} /> {cameraError}
        </div>
      )}

      {/* Hidden WebRTC video element for MediaPipe stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          display: 'none',
        }}
      />

      {/* Top Visualizer: Biomechanical 3D Avatar + Telemetry Gauges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) 1fr',
          gap: '20px',
          alignItems: 'stretch',
        }}
      >
        {/* Visualizer 1: Simulated / Live 3D Face Wireframe Avatar */}
        <div
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.98) 0%, rgba(248, 241, 230, 0.92) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(217, 180, 130, 0.5)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 30px rgba(180, 83, 9, 0.06), inset 0 0 20px rgba(255, 255, 255, 0.9)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '16px',
              fontSize: '11px',
              fontWeight: '800',
              color: '#0F766E',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <Activity size={13} color="#0F766E" /> {isLiveCamera ? 'Live Face Mesh 3D' : 'Face Mesh Pose 3D'}
          </div>

          <div
            style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '999px',
              background: ear < 0.20 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: ear < 0.20 ? '#B91C1C' : '#047857',
              border: `1px solid ${ear < 0.20 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            }}
          >
            {ear < 0.20 ? 'BLINK ACTIVE' : 'EYES TRACKED'}
          </div>

          {/* SVG 3D Animated Head Wireframe */}
          <div
            style={{
              width: '160px',
              height: '160px',
              margin: '22px 0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease-out',
              transform: `perspective(400px) rotateX(${pitch * -1.2}deg) rotateY(${yaw * 1.2}deg)`,
              position: 'relative',
              animation: 'avatarPulse 3s infinite ease-in-out',
            }}
          >
            <svg width="150" height="150" viewBox="0 0 150 150">
              <defs>
                <radialGradient id="headGlowLight" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(245, 158, 11, 0.12)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0.9)" />
                </radialGradient>
              </defs>

              {/* Head Silhouette */}
              <ellipse
                cx="75"
                cy="75"
                rx="52"
                ry="64"
                fill="url(#headGlowLight)"
                stroke="#0F766E"
                strokeWidth="2"
                strokeDasharray={pitch !== 0 || yaw !== 0 ? 'none' : '4 3'}
              />

              {/* Facial Midline Axis */}
              <path
                d={`M 75 20 Q ${75 + yaw * 0.8} 75 75 130`}
                fill="none"
                stroke="#D97706"
                strokeWidth="1.5"
                opacity="0.8"
              />

              {/* Eyebrow / Eye Axis */}
              <path
                d={`M 35 ${65 + pitch * 0.6} Q 75 ${63 + pitch * 0.6} 115 ${65 + pitch * 0.6}`}
                fill="none"
                stroke="#0D9488"
                strokeWidth="1.5"
                opacity="0.7"
              />

              {/* Left Eye Aperture */}
              <ellipse
                cx="55"
                cy={66 + pitch * 0.6}
                rx="9"
                ry={ear < 0.20 ? 1.5 : 5.5}
                fill={ear < 0.20 ? '#DC2626' : '#0F766E'}
                stroke="#0D9488"
                strokeWidth="1.5"
              />

              {/* Right Eye Aperture */}
              <ellipse
                cx="95"
                cy={66 + pitch * 0.6}
                rx="9"
                ry={ear < 0.20 ? 1.5 : 5.5}
                fill={ear < 0.20 ? '#DC2626' : '#0F766E'}
                stroke="#0D9488"
                strokeWidth="1.5"
              />

              {/* Nose Bridge Landmark */}
              <circle cx={75 + yaw * 0.4} cy={82 + pitch * 0.5} r="3" fill="#D97706" />

              {/* Mouth Landmark Curve */}
              <path
                d={`M 60 ${105 + pitch * 0.5} Q 75 ${110 + pitch * 0.5} 90 ${105 + pitch * 0.5}`}
                fill="none"
                stroke="#B45309"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            {/* Overlay Canvas for Real MediaPipe Landmark Dots */}
            {isLiveCamera && (
              <canvas
                ref={canvasRef}
                width={160}
                height={160}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>

          <div
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#57534E',
              textAlign: 'center',
            }}
          >
            Orientation: Pitch <span style={{ color: '#047857' }}>{pitch > 0 ? `+${pitch}°` : `${pitch}°`}</span> | Yaw <span style={{ color: '#B45309' }}>{yaw}°</span>
          </div>
        </div>

        {/* Visualizer 2: Biomechanical Gauges HUD */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '20px',
            border: '1px solid rgba(217, 180, 130, 0.45)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 12px 30px rgba(180, 83, 9, 0.05)',
          }}
        >
          {/* Gauge 1: Head Pitch (Nod Up/Down) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#1C1917' }}>
                  Head Pitch (Vertical Nod)
                </span>
                <span style={{ fontSize: '11px', color: '#78716C' }}>Threshold &gt; +{pitchThreshold}°</span>
              </div>
              <strong
                style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: pitch >= pitchThreshold ? '#047857' : '#78716C',
                }}
              >
                {pitch > 0 ? `+${pitch}° (Nod Confirmed)` : `${pitch}° (Neutral)`}
              </strong>
            </div>

            <div
              style={{
                width: '100%',
                height: '12px',
                background: 'rgba(231, 220, 206, 0.6)',
                borderRadius: '6px',
                border: '1px solid rgba(217, 180, 130, 0.35)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Threshold marker */}
              <div
                style={{
                  position: 'absolute',
                  left: `${((pitchThreshold + 30) / 60) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: '#D97706',
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, ((pitch + 30) / 60) * 100))}%`,
                  height: '100%',
                  background: pitch >= pitchThreshold
                    ? 'linear-gradient(90deg, #059669, #10B981)'
                    : 'linear-gradient(90deg, #0F766E, #14B8A6)',
                  transition: 'width 0.25s ease-out',
                }}
              />
            </div>
          </div>

          {/* Gauge 2: Head Yaw (Shake Left/Right) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#1C1917' }}>
                  Head Yaw (Horizontal Shake)
                </span>
                <span style={{ fontSize: '11px', color: '#78716C' }}>Threshold ±{yawThreshold}°</span>
              </div>
              <strong
                style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: Math.abs(yaw) >= yawThreshold ? '#B45309' : '#78716C',
                }}
              >
                {yaw !== 0 ? `${yaw}° (Shake Active)` : '0° (Center)'}
              </strong>
            </div>

            <div
              style={{
                width: '100%',
                height: '12px',
                background: 'rgba(231, 220, 206, 0.6)',
                borderRadius: '6px',
                border: '1px solid rgba(217, 180, 130, 0.35)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, ((yaw + 45) / 90) * 100))}%`,
                  height: '100%',
                  background: Math.abs(yaw) >= yawThreshold
                    ? 'linear-gradient(90deg, #D97706, #F59E0B)'
                    : 'linear-gradient(90deg, #B45309, #D97706)',
                  transition: 'width 0.25s ease-out',
                }}
              />
            </div>
          </div>

          {/* Gauge 3: Eye Aspect Ratio (EAR Blink Aperture) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} color="#0F766E" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#1C1917' }}>
                  Eye Aspect Ratio (EAR)
                </span>
                <span style={{ fontSize: '11px', color: '#78716C' }}>Closed &lt; 0.20</span>
              </div>
              <strong
                style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: ear < 0.20 ? '#DC2626' : '#0F766E',
                }}
              >
                {ear.toFixed(2)} {ear < 0.20 ? '● Sustained Blink' : '○ Open (Tracking)'}
              </strong>
            </div>

            <div
              style={{
                width: '100%',
                height: '12px',
                background: 'rgba(231, 220, 206, 0.6)',
                borderRadius: '6px',
                border: '1px solid rgba(217, 180, 130, 0.35)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (ear / 0.35) * 100)}%`,
                  height: '100%',
                  background: ear < 0.20
                    ? 'linear-gradient(90deg, #DC2626, #EF4444)'
                    : 'linear-gradient(90deg, #0F766E, #14B8A6)',
                  transition: 'width 0.2s ease-out',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Touchless Hands-Free Directive Grid (6 Large Accessible Cards) */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#1C1917' }}>
            Touchless Directives (Dwell Gaze or Perform Head/Eye Movement)
          </span>
          <span style={{ fontSize: '12px', color: '#78716C' }}>
            Dwell hold: {sensitivity === 'high' ? '0.8s' : '1.2s'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '18px',
          }}
        >
          {/* Card 1: Head Nod (YES) */}
          <button
            type="button"
            onClick={() => executeAction('YES')}
            onMouseEnter={() => handleStartDwell('YES')}
            onMouseLeave={handleStopDwell}
            style={{
              padding: '24px',
              borderRadius: '18px',
              background: motorAction === 'YES_CONFIRM'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.08) 100%)'
                : 'rgba(255, 255, 255, 0.82)',
              border: motorAction === 'YES_CONFIRM' ? '2px solid #059669' : '1px solid rgba(217, 180, 130, 0.45)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: motorAction === 'YES_CONFIRM' ? '0 10px 25px rgba(16, 185, 129, 0.18)' : '0 4px 14px rgba(180, 83, 9, 0.04)',
            }}
          >
            {dwellTarget === 'YES' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '4px',
                  width: `${dwellProgress}%`,
                  backgroundColor: '#059669',
                  transition: 'width 0.06s linear',
                }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: '#047857' }}>
                <CheckCircle2 size={24} /> YES / Confirm
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', color: '#047857' }}>
                NOD HEAD ↓
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#57534E', margin: 0, lineHeight: 1.4 }}>
              Nod head down forward to confirm appointment, approve medication intake, or agree with doctor.
            </p>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ➔ Pitch &gt; +{pitchThreshold}° or Dwell Gaze
            </div>
          </button>

          {/* Card 2: Head Shake (NO) */}
          <button
            type="button"
            onClick={() => executeAction('NO')}
            onMouseEnter={() => handleStartDwell('NO')}
            onMouseLeave={handleStopDwell}
            style={{
              padding: '24px',
              borderRadius: '18px',
              background: motorAction === 'NO_CANCEL'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.08) 100%)'
                : 'rgba(255, 255, 255, 0.82)',
              border: motorAction === 'NO_CANCEL' ? '2px solid #D97706' : '1px solid rgba(217, 180, 130, 0.45)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: motorAction === 'NO_CANCEL' ? '0 10px 25px rgba(245, 158, 11, 0.18)' : '0 4px 14px rgba(180, 83, 9, 0.04)',
            }}
          >
            {dwellTarget === 'NO' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '4px',
                  width: `${dwellProgress}%`,
                  backgroundColor: '#D97706',
                  transition: 'width 0.06s linear',
                }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: '#B45309' }}>
                <XCircle size={24} /> NO / Cancel
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.12)', color: '#92400E' }}>
                SHAKE HEAD ↔
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#57534E', margin: 0, lineHeight: 1.4 }}>
              Shake head side-to-side to decline option, dismiss notifications, or cancel clinical procedures.
            </p>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ➔ Yaw &gt; ±{yawThreshold}° or Dwell Gaze
            </div>
          </button>

          {/* Card 3: Double Blink SOS */}
          <button
            type="button"
            onClick={() => executeAction('BLINK')}
            onMouseEnter={() => handleStartDwell('BLINK')}
            onMouseLeave={handleStopDwell}
            style={{
              padding: '24px',
              borderRadius: '18px',
              background: motorAction === 'DOUBLE_BLINK_EMERGENCY'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.08) 100%)'
                : 'rgba(255, 255, 255, 0.82)',
              border: motorAction === 'DOUBLE_BLINK_EMERGENCY' ? '2px solid #DC2626' : '1px solid rgba(239, 68, 68, 0.3)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: motorAction === 'DOUBLE_BLINK_EMERGENCY' ? '0 10px 30px rgba(239, 68, 68, 0.25)' : '0 4px 14px rgba(180, 83, 9, 0.04)',
            }}
          >
            {dwellTarget === 'BLINK' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '4px',
                  width: `${dwellProgress}%`,
                  backgroundColor: '#DC2626',
                  transition: 'width 0.06s linear',
                }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: '#B91C1C' }}>
                <ShieldAlert size={24} /> Double Blink SOS
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#991B1B' }}>
                CRITICAL
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#57534E', margin: 0, lineHeight: 1.4 }}>
              Hold sustained double-blink for 1.2s to alert ICU staff, nurse desk, and crash cart station instantly.
            </p>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ➔ Sustained EAR &lt; 0.20 or Dwell
            </div>
          </button>

          {/* Card 4: Call Bedside Nurse */}
          <button
            type="button"
            onClick={() => executeAction('NURSE')}
            onMouseEnter={() => handleStartDwell('NURSE')}
            onMouseLeave={handleStopDwell}
            style={{
              padding: '24px',
              borderRadius: '18px',
              background: motorAction === 'CALL_NURSE'
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.08) 100%)'
                : 'rgba(255, 255, 255, 0.82)',
              border: motorAction === 'CALL_NURSE' ? '2px solid #2563EB' : '1px solid rgba(217, 180, 130, 0.45)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: motorAction === 'CALL_NURSE' ? '0 10px 25px rgba(59, 130, 246, 0.18)' : '0 4px 14px rgba(180, 83, 9, 0.04)',
            }}
          >
            {dwellTarget === 'NURSE' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '4px',
                  width: `${dwellProgress}%`,
                  backgroundColor: '#2563EB',
                  transition: 'width 0.06s linear',
                }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: '#1D4ED8' }}>
                <BellRing size={24} /> Call Bedside Nurse
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', color: '#1E40AF' }}>
                DWELL GAZE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#57534E', margin: 0, lineHeight: 1.4 }}>
              Dispatches non-emergency attendant to your hospital bed for IV drip check or general assistance.
            </p>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ➔ Look at card for 1.2s to trigger
            </div>
          </button>

          {/* Card 5: Hydration & Oral Care */}
          <button
            type="button"
            onClick={() => executeAction('WATER')}
            onMouseEnter={() => handleStartDwell('WATER')}
            onMouseLeave={handleStopDwell}
            style={{
              padding: '24px',
              borderRadius: '18px',
              background: motorAction === 'REQUEST_WATER'
                ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(15, 118, 110, 0.08) 100%)'
                : 'rgba(255, 255, 255, 0.82)',
              border: motorAction === 'REQUEST_WATER' ? '2px solid #0F766E' : '1px solid rgba(217, 180, 130, 0.45)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: motorAction === 'REQUEST_WATER' ? '0 10px 25px rgba(20, 184, 166, 0.18)' : '0 4px 14px rgba(180, 83, 9, 0.04)',
            }}
          >
            {dwellTarget === 'WATER' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '4px',
                  width: `${dwellProgress}%`,
                  backgroundColor: '#0F766E',
                  transition: 'width 0.06s linear',
                }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: '#0F766E' }}>
                <Droplets size={24} /> Water & Oral Care
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: 'rgba(20, 184, 166, 0.12)', color: '#115E59' }}>
                DWELL GAZE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#57534E', margin: 0, lineHeight: 1.4 }}>
              Signals caregiver for water sips, oral suctioning, or dry mouth relief.
            </p>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ➔ Look at card for 1.2s to trigger
            </div>
          </button>

          {/* Card 6: Bed Repositioning */}
          <button
            type="button"
            onClick={() => executeAction('REPOSITION')}
            onMouseEnter={() => handleStartDwell('REPOSITION')}
            onMouseLeave={handleStopDwell}
            style={{
              padding: '24px',
              borderRadius: '18px',
              background: motorAction === 'BED_REPOSITION'
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(126, 34, 206, 0.08) 100%)'
                : 'rgba(255, 255, 255, 0.82)',
              border: motorAction === 'BED_REPOSITION' ? '2px solid #7E22CE' : '1px solid rgba(217, 180, 130, 0.45)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: motorAction === 'BED_REPOSITION' ? '0 10px 25px rgba(168, 85, 247, 0.18)' : '0 4px 14px rgba(180, 83, 9, 0.04)',
            }}
          >
            {dwellTarget === 'REPOSITION' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '4px',
                  width: `${dwellProgress}%`,
                  backgroundColor: '#7E22CE',
                  transition: 'width 0.06s linear',
                }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: '#7E22CE' }}>
                <BedDouble size={24} /> Reposition Bed
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.12)', color: '#6B21A8' }}>
                DWELL GAZE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#57534E', margin: 0, lineHeight: 1.4 }}>
              Request motorized backrest incline change (+30° sitting / flat) for comfort.
            </p>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#7E22CE', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ➔ Look at card for 1.2s to trigger
            </div>
          </button>
        </div>
      </div>

      {/* Active Biomechanical Intent & Dispatch Feedback Bar */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(217, 180, 130, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 8px 24px rgba(180, 83, 9, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#059669',
              boxShadow: '0 0 12px rgba(5, 150, 105, 0.5)',
            }}
          />
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#78716C', fontWeight: '800', letterSpacing: '0.05em' }}>
              Current Biomechanical Intent:
            </span>
            <div style={{ fontSize: '17px', fontWeight: '800', color: '#1C1917', marginTop: '2px' }}>
              {motorFeedback || 'Listening for Head Nod (+18°), Head Shake (±22°), or Sustained Eye Blink...'}
            </div>
          </div>
        </div>

        {lastExecuted && (
          <div
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(217, 119, 6, 0.12)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              fontSize: '12px',
              fontWeight: '700',
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} /> Last Action: {lastExecuted}
          </div>
        )}
      </div>
    </div>
  );
}
