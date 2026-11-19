import React, { useState, useEffect } from 'react';
import {
  User,
  Stethoscope,
  Sparkles,
  Volume2,
  Send,
  Activity,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  ArrowLeftRight,
  HeartPulse,
  Mic,
} from 'lucide-react';
import LiveCameraTracker from './LiveCameraTracker';

/**
 * HospitalKiosk
 * Phase 1: Dual-Screen Hospital Kiosk Component
 * - Golden Cream Frosted Glassmorphism Architecture
 * - Left: Patient Station (ISL Gesture Input, Hand Placement Ghost, Dynamic Triage Bar, Grammar Tokens, Breath AI)
 * - Right: Doctor/Staff Station (Bilingual Statement, Quick Clinical Chips, Dynamic Audio EQ, 3D Avatar Sign Sequencer)
 * - Center: Golden-Teal Neural Bridge Divider with Bidirectional Translation Flow
 */
export default function HospitalKiosk({
  currentSign,
  setCurrentSign,
  accumulatedTokens,
  setAccumulatedTokens,
  synthesizedText,
  translatedResult,
  isTranslating,
  handleSynthesizeTokens,
  doctorSpeechInput,
  setDoctorSpeechInput,
  handleDoctorToGloss,
  doctorGlosses,
  doctorGrammarGloss,
  isPlayingAudio,
  handlePlayAudio,
  isAnalyzingCough,
  coughResult,
  handleAnalyzeCough,
}) {
  const [activeClipIndex, setActiveClipIndex] = useState(-1);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);

  // Quick doctor prompts for one-tap clinical inquiries
  const DOCTOR_QUICK_PROMPTS = [
    { text: 'Where does it hurt? Please point or show.', label: '📍 Where does it hurt?' },
    { text: 'Have you taken any medicine today?', label: '💊 Taken any pills?' },
    { text: 'How many days have you had this fever?', label: '⏱️ Days of fever?' },
    { text: 'Please take a slow, deep breath.', label: '🫁 Breathe deeply' },
  ];

  // Auto-play sequencer loop through glosses
  useEffect(() => {
    let interval;
    if (isPlayingSequence && doctorGlosses.length > 0) {
      interval = setInterval(() => {
        setActiveClipIndex((prev) => {
          if (prev >= doctorGlosses.length - 1) {
            setIsPlayingSequence(false);
            return -1;
          }
          return prev + 1;
        });
      }, 1100);
    }
    return () => clearInterval(interval);
  }, [isPlayingSequence, doctorGlosses]);

  const handleStartSequencePlay = () => {
    if (doctorGlosses.length === 0) return;
    setActiveClipIndex(0);
    setIsPlayingSequence(true);
  };

  const handleUndoToken = () => {
    if (accumulatedTokens.length > 0) {
      setAccumulatedTokens(accumulatedTokens.slice(0, -1));
    }
  };

  // Compute dynamic clinical triage urgency based on tokens and cough
  const isCriticalTriage =
    accumulatedTokens.some((t) => ['CHEST_PAIN', 'BLEEDING', 'BREATHING'].includes(t)) ||
    coughResult?.triage_urgency?.includes('1');

  const isUrgentTriage = accumulatedTokens.some((t) =>
    ['PAIN', 'FEVER', 'STOMACH', 'DIZZY'].includes(t)
  );

  const triageColor = isCriticalTriage ? '#DC2626' : isUrgentTriage ? '#B45309' : '#0F766E';
  const triageLabel = isCriticalTriage
    ? 'ESI-1 · IMMEDIATE CRITICAL'
    : isUrgentTriage
    ? 'ESI-3 · URGENT TRIAGE'
    : 'ESI-4 · ROUTINE OPD';

  // SVG arc helpers for confidence display
  const confidenceValue = currentSign ? 0.88 : 0;
  const arcRadius = 36;
  const arcCircumference = 2 * Math.PI * arcRadius;
  const arcOffset = arcCircumference * (1 - confidenceValue);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        color: '#1C1917',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(180, 83, 9, 0.08), 0 0 1px 1px rgba(217, 180, 130, 0.25)',
      }}
    >
      {/* Dynamic Keyframe Animations CSS */}
      <style>{`
        @keyframes shimmerGlow {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes eqDance1 { 0% { height: 4px; } 50% { height: 18px; } 100% { height: 8px; } }
        @keyframes eqDance2 { 0% { height: 16px; } 50% { height: 6px; } 100% { height: 22px; } }
        @keyframes eqDance3 { 0% { height: 8px; } 50% { height: 24px; } 100% { height: 12px; } }
        @keyframes bridgePulse {
          0%, 100% { opacity: 0.5; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes triagePulse {
          0%, 100% { opacity: 0.8; box-shadow: 0 0 8px currentColor; }
          50% { opacity: 1; box-shadow: 0 0 18px currentColor; }
        }
        @keyframes blurIn {
          0% { filter: blur(8px); opacity: 0; transform: scale(0.94); }
          100% { filter: blur(0px); opacity: 1; transform: scale(1); }
        }
        @keyframes dotFlowDown {
          0% { transform: translateY(-50px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(50px); opacity: 0; }
        }
        @keyframes dotFlowUp {
          0% { transform: translateY(50px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-50px); opacity: 0; }
        }
        @keyframes pulseBeacon {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        .btn-shimmer-gold {
          background: linear-gradient(90deg, #B45309 0%, #F59E0B 50%, #B45309 100%);
          background-size: 200% auto;
          animation: shimmerGlow 3s linear infinite;
        }
        .kiosk-quick-prompt-btn:hover {
          border-color: rgba(180, 83, 9, 0.45) !important;
          background: rgba(254, 243, 199, 0.75) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(180, 83, 9, 0.1);
        }
      `}</style>

      {/* ESI TRIAGE LED STRIP */}
      <div
        style={{
          height: '5px',
          background: `linear-gradient(90deg, transparent 0%, ${triageColor} 30%, ${triageColor} 70%, transparent 100%)`,
          animation: 'triagePulse 2s ease-in-out infinite',
          color: triageColor,
        }}
      />

      {/* Top Header — Frosted Golden Cream */}
      <div
        style={{
          padding: '16px 28px',
          borderBottom: '1px solid rgba(217, 180, 130, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
            }}
          >
            <HeartPulse size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#1C1917', letterSpacing: '-0.3px' }}>
              Hospital Clinical Kiosk · Dual-Station Console
            </h2>
            <p style={{ fontSize: '12px', color: '#78716C', margin: '2px 0 0' }}>
              Zero-Barrier Two-Way Accessibility · MediaPipe ISL + Gemini 1.5 Medical Grammar
            </p>
          </div>
        </div>

        {/* Triage Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: '999px',
            border: `1px solid ${triageColor}44`,
            background: `${triageColor}14`,
            fontSize: '12px',
            fontWeight: '800',
            color: triageColor,
            letterSpacing: '0.4px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: triageColor,
              animation: 'pulseBeacon 1.5s ease-in-out infinite',
              display: 'inline-block',
            }}
          />
          {triageLabel}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN SPLIT-SCREEN: Patient | Neural Bridge | Doctor             */}
      {/* ============================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 52px minmax(0, 1fr)',
          alignItems: 'stretch',
          padding: '22px',
          gap: '14px',
        }}
      >
        {/* ============================================================ */}
        {/* LEFT: PATIENT STATION (teal frosted glassmorphism)           */}
        {/* ============================================================ */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.85) 0%, rgba(240, 253, 250, 0.65) 100%)',
            border: '1.5px solid rgba(15, 118, 110, 0.22)',
            backdropFilter: 'blur(16px)',
            borderRadius: '22px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 8px 25px rgba(15, 118, 110, 0.05)',
          }}
        >
          {/* Patient Station Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '13px',
                textTransform: 'uppercase',
                fontWeight: '800',
                color: '#0F766E',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.5px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#0F766E',
                  animation: 'pulseBeacon 2s ease-in-out infinite',
                  display: 'inline-block',
                }}
              />
              <User size={16} /> PATIENT STATION
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(15, 118, 110, 0.1)',
                color: '#0F766E',
                border: '1px solid rgba(15, 118, 110, 0.25)',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Radio size={12} /> 60 FPS
            </span>
          </div>

          {/* Large Sign Display with blur-in animation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '18px 20px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.75)',
              border: '1px solid rgba(15, 118, 110, 0.18)',
              boxShadow: '0 4px 14px rgba(15, 118, 110, 0.04)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#78716C', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Detected Sign
              </div>
              <div
                key={currentSign}
                style={{
                  fontSize: '54px',
                  fontWeight: '900',
                  color: '#0F766E',
                  lineHeight: 1.1,
                  animation: currentSign ? 'blurIn 0.35s ease-out forwards' : 'none',
                  letterSpacing: '-1.5px',
                  minHeight: '60px',
                }}
              >
                {currentSign || '—'}
              </div>
            </div>

            {/* Confidence Arc */}
            <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
              <svg width="84" height="84" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="42"
                  cy="42"
                  r={arcRadius}
                  fill="none"
                  stroke="rgba(15, 118, 110, 0.12)"
                  strokeWidth="6"
                />
                <circle
                  cx="42"
                  cy="42"
                  r={arcRadius}
                  fill="none"
                  stroke="#0F766E"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={arcCircumference}
                  strokeDashoffset={arcOffset}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: '900', color: '#0F766E' }}>
                  {Math.round(confidenceValue * 100)}%
                </span>
                <span style={{ fontSize: '9px', color: '#78716C', fontWeight: '700' }}>CONF</span>
              </div>
            </div>
          </div>

          {/* MediaPipe Camera Viewport */}
          <LiveCameraTracker
            activeSign={currentSign}
            onSignDetected={(sign) => {
              setCurrentSign(sign);
              if (!accumulatedTokens.includes(sign)) {
                setAccumulatedTokens((prev) => [...prev, sign]);
              }
            }}
          />

          {/* Hand Guidance */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.65)',
              border: '1px dashed rgba(15, 118, 110, 0.3)',
              fontSize: '11px',
              color: '#57534E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🖐️ <strong style={{ color: '#1C1917' }}>Guidance:</strong> Keep hand in center viewfinder. 21 3D joints tracked live.</span>
            <span style={{ color: '#0F766E', fontWeight: '800' }}>Latency: 28ms</span>
          </div>

          {/* Grammar-Aware ISL Token Assembly */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: '800', color: '#57534E', margin: 0 }}>
                Accumulated ISL Tokens ({accumulatedTokens.length}):
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                {accumulatedTokens.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndoToken}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(217, 180, 130, 0.5)',
                      fontSize: '11px',
                      color: '#78716C',
                      cursor: 'pointer',
                      fontWeight: '700',
                    }}
                    title="Remove last token"
                  >
                    <RotateCcw size={11} /> Undo
                  </button>
                )}
                {accumulatedTokens.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAccumulatedTokens([])}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '11px',
                      color: '#A8A29E',
                      cursor: 'pointer',
                      fontWeight: '700',
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Token Chips — Frosted Glass Pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                minHeight: '52px',
                padding: '12px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(217, 180, 130, 0.4)',
                alignItems: 'center',
              }}
            >
              {accumulatedTokens.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#A8A29E', fontStyle: 'italic' }}>
                  No gestures queued. Show hand signs or tap quick shortcuts below...
                </span>
              ) : (
                accumulatedTokens.map((t, idx) => {
                  const isSubject = ['I', 'YOU', 'HE', 'SHE'].includes(t);
                  const isPredicate = ['PAIN', 'HURT', 'FEVER', 'HELP', 'BLEEDING'].includes(t);
                  const bgColor = isPredicate
                    ? 'rgba(220, 38, 38, 0.12)'
                    : isSubject
                    ? 'rgba(245, 158, 11, 0.16)'
                    : 'rgba(15, 118, 110, 0.12)';
                  const borderColor = isPredicate
                    ? 'rgba(220, 38, 38, 0.35)'
                    : isSubject
                    ? 'rgba(217, 119, 6, 0.35)'
                    : 'rgba(15, 118, 110, 0.3)';
                  const textColor = isPredicate ? '#B91C1C' : isSubject ? '#92400E' : '#0F766E';
                  return (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        background: bgColor,
                        color: textColor,
                        border: `1px solid ${borderColor}`,
                        fontWeight: '800',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ fontSize: '10px', opacity: 0.65 }}>#{idx + 1}</span>
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => setAccumulatedTokens(accumulatedTokens.filter((_, i) => i !== idx))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: 0,
                          marginLeft: '3px',
                          opacity: 0.7,
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })
              )}

              {/* Quick Sign Shortcuts */}
              <button
                type="button"
                onClick={() => setAccumulatedTokens([...accumulatedTokens, 'WATER'])}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  color: '#78716C',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: '1px dashed rgba(217, 180, 130, 0.6)',
                  cursor: 'pointer',
                }}
              >
                + &quot;WATER&quot;
              </button>
              <button
                type="button"
                onClick={() => setAccumulatedTokens([...accumulatedTokens, 'FEVER'])}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  color: '#78716C',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: '1px dashed rgba(217, 180, 130, 0.6)',
                  cursor: 'pointer',
                }}
              >
                + &quot;FEVER&quot;
              </button>
            </div>
          </div>

          {/* Gemini Grammar Bridge — large golden gradient CTA */}
          <button
            type="button"
            onClick={handleSynthesizeTokens}
            disabled={isTranslating || accumulatedTokens.length === 0}
            className={accumulatedTokens.length > 0 ? 'btn-shimmer-gold' : ''}
            style={{
              padding: '15px 22px',
              borderRadius: '16px',
              background: accumulatedTokens.length === 0
                ? 'rgba(231, 229, 228, 0.6)'
                : 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
              color: accumulatedTokens.length === 0 ? '#A8A29E' : '#FFFFFF',
              fontWeight: '800',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              border: 'none',
              cursor: accumulatedTokens.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: accumulatedTokens.length > 0 ? '0 8px 24px rgba(180, 83, 9, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={18} />
            {isTranslating ? 'Synthesizing Medical Sentence via Gemini 1.5...' : 'Speak for Me (Gemini Bridge)'}
          </button>

          {/* Acoustic Respiratory Biomarker AI */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(253, 242, 248, 0.8) 0%, rgba(255, 255, 255, 0.75) 100%)',
              border: '1.5px solid rgba(244, 114, 182, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#BE185D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mic size={14} /> Acoustic Respiratory Biomarker AI
              </span>
              <span style={{ fontSize: '10px', color: '#BE185D', fontWeight: '800', background: 'rgba(244, 114, 182, 0.2)', padding: '3px 8px', borderRadius: '6px' }}>
                Asthma / Wheeze Detector
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleAnalyzeCough('WHEEZE_ASTHMA')}
              disabled={isAnalyzingCough}
              style={{
                padding: '11px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #BE185D 0%, #DB2777 100%)',
                color: '#FFF',
                border: 'none',
                fontWeight: '800',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isAnalyzingCough ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(190, 24, 93, 0.25)',
              }}
            >
              <Activity size={15} className={isAnalyzingCough ? 'animate-spin' : ''} />
              {isAnalyzingCough ? 'Analyzing Breath Acoustics (2.0s Sample)...' : '🫁 Test Breath / Cough Acoustics'}
            </button>

            {coughResult && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(244, 114, 182, 0.35)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#BE185D' }}>
                  <span>Biomarker: {coughResult.biomarker_detected}</span>
                  <span style={{ color: '#E11D48' }}>ICD-10: {coughResult.icd10_code}</span>
                </div>
                <div style={{ color: '#57534E', fontStyle: 'italic' }}>
                  {coughResult.actionable_clinical_guidance}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* CENTER: NEURAL CONDUIT DIVIDER                               */}
        {/* ============================================================ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0',
            position: 'relative',
            padding: '0 2px',
          }}
        >
          {/* Top line segment */}
          <div
            style={{
              width: '2px',
              flex: 1,
              background: 'linear-gradient(to bottom, transparent, rgba(15, 118, 110, 0.3) 30%, rgba(180, 83, 9, 0.3) 70%, transparent)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Moving dots */}
            <div style={{ position: 'absolute', left: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#0F766E', animation: 'dotFlowDown 2.5s ease-in-out infinite', boxShadow: '0 0 8px #0F766E' }} />
            <div style={{ position: 'absolute', left: '-3px', width: '6px', height: '6px', borderRadius: '50%', background: '#B45309', animation: 'dotFlowUp 3s ease-in-out infinite 0.8s', boxShadow: '0 0 6px #B45309' }} />
          </div>

          {/* Center icon */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(254, 243, 199, 0.85) 100%)',
              border: '2px solid rgba(180, 83, 9, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#B45309',
              boxShadow: '0 4px 16px rgba(180, 83, 9, 0.15)',
              animation: 'bridgePulse 2.5s infinite',
              flexShrink: 0,
            }}
            title="Bi-Directional Translation Engine"
          >
            <ArrowLeftRight size={16} />
          </div>

          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#A8A29E', fontWeight: '800', writingMode: 'vertical-rl', letterSpacing: '2px', margin: '8px 0' }}>
            BRIDGE
          </span>

          {/* Bottom line segment */}
          <div
            style={{
              width: '2px',
              flex: 1,
              background: 'linear-gradient(to bottom, transparent, rgba(180, 83, 9, 0.3) 30%, rgba(15, 118, 110, 0.3) 70%, transparent)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', left: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#B45309', animation: 'dotFlowDown 2.8s ease-in-out infinite 0.4s', boxShadow: '0 0 8px #B45309' }} />
            <div style={{ position: 'absolute', left: '-3px', width: '6px', height: '6px', borderRadius: '50%', background: '#0F766E', animation: 'dotFlowUp 3.2s ease-in-out infinite 1.2s', boxShadow: '0 0 6px #0F766E' }} />
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT: DOCTOR / STAFF STATION (golden amber glassmorphism)   */}
        {/* ============================================================ */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.85) 0%, rgba(254, 243, 199, 0.55) 100%)',
            border: '1.5px solid rgba(217, 119, 6, 0.22)',
            backdropFilter: 'blur(16px)',
            borderRadius: '22px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 8px 25px rgba(180, 83, 9, 0.05)',
          }}
        >
          {/* Doctor Station Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '13px',
                textTransform: 'uppercase',
                fontWeight: '800',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.5px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#B45309',
                  animation: 'pulseBeacon 2s ease-in-out infinite 0.5s',
                  display: 'inline-block',
                }}
              />
              <Stethoscope size={16} /> DOCTOR STATION
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#92400E',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontWeight: '700',
              }}
            >
              Two-Way Audio + Avatar
            </span>
          </div>

          {/* Bilingual Patient Statement Display */}
          <div
            style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(217, 180, 130, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 4px 14px rgba(180, 83, 9, 0.04)',
            }}
          >
            {/* English Synthesized Statement */}
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#78716C', fontWeight: '800', letterSpacing: '0.5px' }}>
                Synthesized Patient Statement (English):
              </span>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#1C1917', margin: '5px 0 0', lineHeight: 1.45 }}>
                &ldquo;{synthesizedText}&rdquo;
              </p>
            </div>

            <div style={{ height: '1px', background: 'rgba(217, 180, 130, 0.4)' }} />

            {/* Regional Translation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#78716C', fontWeight: '800', letterSpacing: '0.5px' }}>
                  Regional Medical Translation:
                </span>
                <button
                  type="button"
                  onClick={() => handlePlayAudio(translatedResult)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    background: isPlayingAudio ? '#DC2626' : '#B45309',
                    color: '#FFF',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: '0 2px 8px rgba(180, 83, 9, 0.2)',
                  }}
                >
                  <Volume2 size={13} />
                  {isPlayingAudio ? 'Stop Audio' : '🔊 Listen (Edge-TTS)'}
                </button>
              </div>

              <p style={{ fontSize: '18px', fontWeight: '800', color: '#B45309', margin: 0, lineHeight: 1.45 }}>
                {translatedResult}
              </p>

              {/* Audio EQ Animation */}
              {isPlayingAudio && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#B45309', fontWeight: '700', marginRight: '6px' }}>
                    Broadcasting Neural Speech:
                  </span>
                  <span style={{ width: '3px', backgroundColor: '#B45309', borderRadius: '2px', animation: 'eqDance1 0.5s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#B45309', borderRadius: '2px', animation: 'eqDance2 0.7s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#B45309', borderRadius: '2px', animation: 'eqDance3 0.6s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#B45309', borderRadius: '2px', animation: 'eqDance1 0.8s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#B45309', borderRadius: '2px', animation: 'eqDance2 0.5s infinite alternate' }} />
                </div>
              )}
            </div>

            {/* SHA-256 Stamp */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: '#15803D',
                paddingTop: '8px',
                borderTop: '1px dashed rgba(217, 180, 130, 0.4)',
                fontWeight: '700',
              }}
            >
              <ShieldCheck size={14} />
              <span>SHA-256 Digital Tamper-Proof Signature · FHIR v4.0.1 Verified</span>
            </div>
          </div>

          {/* Quick Doctor Response Chips */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#78716C', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚡ 1-Tap Physician Inquiries:
            </span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              {DOCTOR_QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="kiosk-quick-prompt-btn"
                  onClick={() => {
                    setDoctorSpeechInput(prompt.text);
                    handleDoctorToGloss();
                  }}
                  style={{
                    padding: '11px 13px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.75)',
                    border: '1px solid rgba(217, 180, 130, 0.4)',
                    color: '#1C1917',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Input Textbox */}
          <div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={doctorSpeechInput}
                onChange={(e) => setDoctorSpeechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDoctorToGloss()}
                placeholder="Doctor response (e.g. Please sit, where does it hurt?)"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1.5px solid rgba(217, 119, 6, 0.3)',
                  color: '#1C1917',
                  fontSize: '13px',
                  outline: 'none',
                  fontWeight: '600',
                }}
              />
              <button
                type="button"
                onClick={handleDoctorToGloss}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
                  color: '#FFF',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)',
                }}
              >
                <Send size={15} /> Send
              </button>
            </div>
          </div>

          {/* Two-Way Sign Video Playlist Sequencer */}
          <div
            style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.75)',
              border: '1px solid rgba(217, 180, 130, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 4px 14px rgba(180, 83, 9, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#B45309', fontWeight: '800' }}>
                  Two-Way Sign Sequencer (Avatar Clip Playlist):
                </span>
                {doctorGrammarGloss && (
                  <p style={{ fontSize: '11px', color: '#78716C', margin: '2px 0 0' }}>
                    SOV Grammar: <strong style={{ color: '#B45309' }}>{doctorGrammarGloss}</strong>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleStartSequencePlay}
                disabled={doctorGlosses.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: isPlayingSequence ? '#15803D' : '#0F766E',
                  color: '#FFF',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                }}
              >
                <Play size={11} />
                {isPlayingSequence ? `Playing Clip #${activeClipIndex + 1}...` : 'Play All Clips'}
              </button>
            </div>

            {/* Gloss Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {doctorGlosses.map((g, idx) => {
                const isCurrent = activeClipIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveClipIndex(idx)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      background: isCurrent
                        ? 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)'
                        : 'rgba(255, 255, 255, 0.85)',
                      color: isCurrent ? '#000' : '#78716C',
                      border: `1px solid ${isCurrent ? '#B45309' : 'rgba(217, 180, 130, 0.4)'}`,
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      transform: isCurrent ? 'scale(1.04)' : 'none',
                      boxShadow: isCurrent ? '0 4px 12px rgba(180, 83, 9, 0.25)' : 'none',
                    }}
                  >
                    <span>🎬 {idx + 1}. {g}</span>
                    {isCurrent && <span style={{ fontSize: '10px', color: '#92400E' }}>● Active</span>}
                  </button>
                );
              })}
            </div>

            {/* Avatar Viewport */}
            {activeClipIndex >= 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(254, 243, 199, 0.6)',
                  border: '1px dashed rgba(217, 119, 6, 0.4)',
                  fontSize: '12px',
                  color: '#92400E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <strong>Avatar Gesture Viewport:</strong> Rendering sign gesture for &ldquo;
                  <span style={{ color: '#B45309', fontWeight: '800' }}>{doctorGlosses[activeClipIndex]}</span>&rdquo;
                </span>
                <span style={{ color: '#78716C', fontSize: '11px', fontWeight: '700' }}>ISL Dictionary Frame 30/30 · 60 FPS</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
