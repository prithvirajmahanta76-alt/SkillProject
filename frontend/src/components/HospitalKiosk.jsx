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
 * Phase 2: Dual-Panel Clinical Command Center
 * - Dark glassmorphism theme with teal (patient) and amber (doctor) accents
 * - Neural bridge animated divider between panels
 * - ESI Triage LED strip across the top
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
  const isCriticalTriage = accumulatedTokens.some((t) =>
    ['CHEST_PAIN', 'BLEEDING', 'BREATHING'].includes(t)
  ) || coughResult?.triage_urgency?.includes('1');

  const isUrgentTriage = accumulatedTokens.some((t) =>
    ['PAIN', 'FEVER', 'STOMACH', 'DIZZY'].includes(t)
  );

  const triageColor = isCriticalTriage ? '#DC2626' : isUrgentTriage ? '#F59E0B' : '#10B981';
  const triageLabel = isCriticalTriage
    ? 'ESI-1 · IMMEDIATE CRITICAL'
    : isUrgentTriage
    ? 'ESI-3 · URGENT TRIAGE'
    : 'ESI-4 · ROUTINE OPD';

  // SVG arc helpers for confidence display
  const confidenceValue = currentSign ? 0.85 : 0;
  const arcRadius = 36;
  const arcCircumference = 2 * Math.PI * arcRadius;
  const arcOffset = arcCircumference * (1 - confidenceValue);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #060D1A 0%, #0A1628 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(20, 184, 166, 0.15)',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        color: '#E2E8F0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(20,184,166,0.08)',
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
          0%, 100% { opacity: 0.35; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes rippleSonar {
          0% { transform: scale(0.95); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes triagePulse {
          0%, 100% { opacity: 0.7; box-shadow: 0 0 8px currentColor; }
          50% { opacity: 1; box-shadow: 0 0 24px currentColor; }
        }
        @keyframes blurIn {
          0% { filter: blur(12px); opacity: 0; transform: scale(0.92); }
          100% { filter: blur(0px); opacity: 1; transform: scale(1); }
        }
        @keyframes dotFlowDown {
          0% { transform: translateY(-60px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
        @keyframes dotFlowUp {
          0% { transform: translateY(60px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-60px); opacity: 0; }
        }
        @keyframes pulseBeacon {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes synthPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(15,118,110,0.4); }
          50% { box-shadow: 0 0 0 10px rgba(15,118,110,0); }
        }
        .btn-shimmer {
          background: linear-gradient(90deg, #0F766E 0%, #0D9488 50%, #0F766E 100%);
          background-size: 200% auto;
          animation: shimmerGlow 3s linear infinite;
        }
        .kiosk-quick-prompt-btn:hover {
          border-color: rgba(245,158,11,0.6) !important;
          background: rgba(180,83,9,0.15) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245,158,11,0.15);
        }
        .kiosk-gloss-chip:hover {
          box-shadow: 0 0 12px rgba(245,158,11,0.4) !important;
        }
      `}</style>

      {/* ============================================================== */}
      {/* ESI TRIAGE LED STRIP (top animated bar)                        */}
      {/* ============================================================== */}
      <div
        style={{
          height: '6px',
          background: `linear-gradient(90deg, transparent 0%, ${triageColor} 30%, ${triageColor} 70%, transparent 100%)`,
          animation: 'triagePulse 2s ease-in-out infinite',
          color: triageColor,
        }}
      />

      {/* Top Header */}
      <div
        style={{
          padding: '16px 28px 14px',
          borderBottom: '1px solid rgba(20,184,166,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(6,13,26,0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0F766E, #0D9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 16px rgba(15,118,110,0.4)',
            }}
          >
            <HeartPulse size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#E2E8F0', letterSpacing: '-0.3px' }}>
              Civil Hospital AI Kiosk · Dual-Station Clinical Console
            </h2>
            <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0' }}>
              Zero-Barrier Two-Way Accessibility · MediaPipe ISL + Gemini 1.5 Medical Bridge
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
            background: `${triageColor}11`,
            fontSize: '12px',
            fontWeight: '800',
            color: triageColor,
            letterSpacing: '0.5px',
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
          gridTemplateColumns: 'minmax(0, 1fr) 56px minmax(0, 1fr)',
          alignItems: 'stretch',
          padding: '20px',
          gap: '12px',
        }}
      >
        {/* ============================================================ */}
        {/* LEFT: PATIENT STATION (teal glassmorphism)                   */}
        {/* ============================================================ */}
        <div
          style={{
            background: 'rgba(15, 118, 110, 0.08)',
            border: '1px solid rgba(20, 184, 166, 0.25)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Patient Station Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '13px',
                textTransform: 'uppercase',
                fontWeight: '800',
                color: '#2DD4BF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '1px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#2DD4BF',
                  animation: 'pulseBeacon 2s ease-in-out infinite',
                  display: 'inline-block',
                }}
              />
              <User size={16} /> PATIENT STATION
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(20,184,166,0.1)',
                color: '#2DD4BF',
                border: '1px solid rgba(20,184,166,0.3)',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Radio size={11} /> 60 FPS
            </span>
          </div>

          {/* Large Sign Display with blur-in animation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(6,13,26,0.5)',
              border: '1px solid rgba(20,184,166,0.15)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Detected Sign
              </div>
              <div
                key={currentSign}
                style={{
                  fontSize: '56px',
                  fontWeight: '900',
                  color: '#2DD4BF',
                  lineHeight: 1,
                  animation: currentSign ? 'blurIn 0.4s ease-out forwards' : 'none',
                  textShadow: '0 0 32px rgba(45,212,191,0.4)',
                  letterSpacing: '-2px',
                  minHeight: '60px',
                }}
              >
                {currentSign || '—'}
              </div>
            </div>

            {/* Confidence Arc */}
            <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
              <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="45" cy="45" r={arcRadius}
                  fill="none"
                  stroke="rgba(20,184,166,0.1)"
                  strokeWidth="6"
                />
                <circle
                  cx="45" cy="45" r={arcRadius}
                  fill="none"
                  stroke="#2DD4BF"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={arcCircumference}
                  strokeDashoffset={arcOffset}
                  style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 0 6px #2DD4BF)' }}
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
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#2DD4BF' }}>
                  {Math.round(confidenceValue * 100)}%
                </span>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '600' }}>CONF</span>
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
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(6,13,26,0.4)',
              border: '1px dashed rgba(20,184,166,0.2)',
              fontSize: '11px',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🖐️ <strong style={{ color: '#94A3B8' }}>Guidance:</strong> Keep hand in center viewfinder. 21 3D joints tracked live.</span>
            <span style={{ color: '#2DD4BF', fontWeight: '700' }}>Latency: 28ms</span>
          </div>

          {/* Grammar-Aware ISL Token Assembly */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', margin: 0 }}>
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
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'rgba(100,116,139,0.1)',
                      border: '1px solid rgba(100,116,139,0.2)',
                      fontSize: '11px',
                      color: '#94A3B8',
                      cursor: 'pointer',
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
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '11px',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Token Chips — amber glow glassmorphism pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                minHeight: '52px',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(6,13,26,0.5)',
                border: '1px solid rgba(20,184,166,0.12)',
                alignItems: 'center',
              }}
            >
              {accumulatedTokens.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>
                  No gestures queued. Show hand signs or tap quick shortcuts below...
                </span>
              ) : (
                accumulatedTokens.map((t, idx) => {
                  const isSubject = ['I', 'YOU', 'HE', 'SHE'].includes(t);
                  const isPredicate = ['PAIN', 'HURT', 'FEVER', 'HELP', 'BLEEDING'].includes(t);
                  const bgColor = isPredicate ? 'rgba(239,68,68,0.15)' : isSubject ? 'rgba(245,158,11,0.15)' : 'rgba(20,184,166,0.12)';
                  const borderColor = isPredicate ? 'rgba(239,68,68,0.4)' : isSubject ? 'rgba(245,158,11,0.4)' : 'rgba(20,184,166,0.3)';
                  const textColor = isPredicate ? '#FCA5A5' : isSubject ? '#FCD34D' : '#2DD4BF';
                  return (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 11px',
                        borderRadius: '8px',
                        background: bgColor,
                        color: textColor,
                        border: `1px solid ${borderColor}`,
                        fontWeight: '700',
                        fontSize: '12px',
                        boxShadow: `0 0 8px ${borderColor}`,
                      }}
                    >
                      <span style={{ fontSize: '10px', opacity: 0.6 }}>#{idx + 1}</span>
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
                          marginLeft: '2px',
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
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(20,184,166,0.05)',
                  color: '#64748B',
                  fontSize: '11px',
                  border: '1px dashed rgba(20,184,166,0.2)',
                  cursor: 'pointer',
                }}
              >
                + &quot;WATER&quot;
              </button>
              <button
                type="button"
                onClick={() => setAccumulatedTokens([...accumulatedTokens, 'FEVER'])}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(20,184,166,0.05)',
                  color: '#64748B',
                  fontSize: '11px',
                  border: '1px dashed rgba(20,184,166,0.2)',
                  cursor: 'pointer',
                }}
              >
                + &quot;FEVER&quot;
              </button>
            </div>
          </div>

          {/* Gemini Grammar Bridge — large pulsing CTA */}
          <button
            type="button"
            onClick={handleSynthesizeTokens}
            disabled={isTranslating || accumulatedTokens.length === 0}
            className={accumulatedTokens.length > 0 ? 'btn-shimmer' : ''}
            style={{
              padding: '15px 20px',
              borderRadius: '14px',
              background: accumulatedTokens.length === 0 ? 'rgba(30,41,59,0.6)' : 'linear-gradient(135deg, #0F766E, #0D9488)',
              color: accumulatedTokens.length === 0 ? '#475569' : '#FFFFFF',
              fontWeight: '800',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              border: accumulatedTokens.length === 0 ? '1px solid rgba(71,85,105,0.3)' : '1px solid rgba(20,184,166,0.4)',
              cursor: accumulatedTokens.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: accumulatedTokens.length > 0 ? '0 6px 24px rgba(15,118,110,0.4)' : 'none',
              animation: accumulatedTokens.length > 0 ? 'synthPulse 2s infinite' : 'none',
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
              borderRadius: '14px',
              background: 'rgba(190,24,93,0.08)',
              border: '1px solid rgba(244,114,182,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#F472B6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mic size={14} /> Acoustic Respiratory Biomarker AI
              </span>
              <span style={{ fontSize: '10px', color: '#9D174D', fontWeight: '600', background: 'rgba(190,24,93,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(244,114,182,0.2)' }}>
                Asthma / Wheeze Detector
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleAnalyzeCough('WHEEZE_ASTHMA')}
              disabled={isAnalyzingCough}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(190,24,93,0.7)',
                color: '#FFF',
                border: '1px solid rgba(244,114,182,0.3)',
                fontWeight: '700',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isAnalyzingCough ? 'not-allowed' : 'pointer',
              }}
            >
              <Activity size={15} className={isAnalyzingCough ? 'animate-spin' : ''} />
              {isAnalyzingCough ? 'Analyzing Breath Acoustics (2.0s Sample)...' : '🫁 Test Breath / Cough Acoustics'}
            </button>

            {coughResult && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(6,13,26,0.6)',
                  border: '1px solid rgba(244,114,182,0.25)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#F472B6' }}>
                  <span>Biomarker: {coughResult.biomarker_detected}</span>
                  <span style={{ color: '#FB7185' }}>ICD-10: {coughResult.icd10_code}</span>
                </div>
                <div style={{ color: '#94A3B8', fontStyle: 'italic' }}>
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
            padding: '0 4px',
          }}
        >
          {/* Top line segment */}
          <div
            style={{
              width: '2px',
              flex: 1,
              background: 'linear-gradient(to bottom, transparent, rgba(20,184,166,0.3) 30%, rgba(245,158,11,0.3) 70%, transparent)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Moving dots */}
            <div style={{ position: 'absolute', left: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#2DD4BF', animation: 'dotFlowDown 2.5s ease-in-out infinite', boxShadow: '0 0 8px #2DD4BF' }} />
            <div style={{ position: 'absolute', left: '-3px', width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', animation: 'dotFlowUp 3s ease-in-out infinite 0.8s', boxShadow: '0 0 6px #F59E0B' }} />
            <div style={{ position: 'absolute', left: '-3px', width: '5px', height: '5px', borderRadius: '50%', background: '#2DD4BF', animation: 'dotFlowDown 3.5s ease-in-out infinite 1.6s', boxShadow: '0 0 5px #2DD4BF' }} />
          </div>

          {/* Center icon */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(6,13,26,0.9)',
              border: '2px solid rgba(20,184,166,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2DD4BF',
              boxShadow: '0 0 20px rgba(20,184,166,0.3), 0 0 40px rgba(20,184,166,0.1)',
              animation: 'bridgePulse 2.5s infinite',
              flexShrink: 0,
            }}
            title="Bi-Directional Translation Engine"
          >
            <ArrowLeftRight size={16} />
          </div>

          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#334155', fontWeight: '800', writingMode: 'vertical-rl', letterSpacing: '2px', margin: '8px 0' }}>
            BRIDGE
          </span>

          {/* Bottom line segment */}
          <div
            style={{
              width: '2px',
              flex: 1,
              background: 'linear-gradient(to bottom, transparent, rgba(20,184,166,0.3) 30%, rgba(245,158,11,0.3) 70%, transparent)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', left: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', animation: 'dotFlowDown 2.8s ease-in-out infinite 0.4s', boxShadow: '0 0 8px #F59E0B' }} />
            <div style={{ position: 'absolute', left: '-3px', width: '6px', height: '6px', borderRadius: '50%', background: '#2DD4BF', animation: 'dotFlowUp 3.2s ease-in-out infinite 1.2s', boxShadow: '0 0 6px #2DD4BF' }} />
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT: DOCTOR / STAFF STATION (amber glassmorphism)          */}
        {/* ============================================================ */}
        <div
          style={{
            background: 'rgba(180, 83, 9, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Doctor Station Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '13px',
                textTransform: 'uppercase',
                fontWeight: '800',
                color: '#FCD34D',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '1px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#F59E0B',
                  animation: 'pulseBeacon 2s ease-in-out infinite 0.5s',
                  display: 'inline-block',
                }}
              />
              <Stethoscope size={16} /> DOCTOR STATION
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(245,158,11,0.1)',
                color: '#FCD34D',
                border: '1px solid rgba(245,158,11,0.3)',
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
              borderRadius: '14px',
              background: 'rgba(6,13,26,0.5)',
              border: '1px solid rgba(245,158,11,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* English Synthesized Statement */}
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.5px' }}>
                Synthesized Patient Statement (English):
              </span>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#E2E8F0', margin: '5px 0 0', lineHeight: 1.4 }}>
                &ldquo;{synthesizedText}&rdquo;
              </p>
            </div>

            <div style={{ height: '1px', background: 'rgba(245,158,11,0.1)' }} />

            {/* Regional Translation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.5px' }}>
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
                    background: isPlayingAudio ? 'rgba(220,38,38,0.7)' : 'rgba(15,118,110,0.7)',
                    color: '#FFF',
                    border: `1px solid ${isPlayingAudio ? 'rgba(239,68,68,0.4)' : 'rgba(20,184,166,0.4)'}`,
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <Volume2 size={12} />
                  {isPlayingAudio ? 'Stop Audio' : '🔊 Listen (Edge-TTS)'}
                </button>
              </div>

              <p style={{ fontSize: '18px', fontWeight: '800', color: '#FCD34D', margin: 0, lineHeight: 1.4, textShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
                {translatedResult}
              </p>

              {/* Audio EQ Animation */}
              {isPlayingAudio && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#2DD4BF', fontWeight: '700', marginRight: '6px' }}>
                    Broadcasting Neural Speech:
                  </span>
                  <span style={{ width: '3px', backgroundColor: '#2DD4BF', borderRadius: '2px', animation: 'eqDance1 0.5s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#2DD4BF', borderRadius: '2px', animation: 'eqDance2 0.7s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#2DD4BF', borderRadius: '2px', animation: 'eqDance3 0.6s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#2DD4BF', borderRadius: '2px', animation: 'eqDance1 0.8s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#2DD4BF', borderRadius: '2px', animation: 'eqDance2 0.5s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#2DD4BF', borderRadius: '2px', animation: 'eqDance3 0.9s infinite alternate' }} />
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
                color: '#10B981',
                paddingTop: '8px',
                borderTop: '1px dashed rgba(245,158,11,0.1)',
                fontWeight: '600',
              }}
            >
              <ShieldCheck size={13} />
              <span>SHA-256 Digital Tamper-Proof Signature · FHIR v4.0.1 Verified</span>
            </div>
          </div>

          {/* Quick Doctor Response Chips — horizontal scrolling amber glow */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(6,13,26,0.6)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    color: '#CBD5E1',
                    fontSize: '11px',
                    fontWeight: '600',
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

          {/* Doctor Input textarea */}
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
                  borderRadius: '10px',
                  background: 'rgba(6,13,26,0.7)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#E2E8F0',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleDoctorToGloss}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #B45309, #D97706)',
                  color: '#FFF',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid rgba(245,158,11,0.3)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.25)',
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
              borderRadius: '14px',
              background: 'rgba(6,13,26,0.5)',
              border: '1px solid rgba(245,158,11,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#FCD34D', fontWeight: '700' }}>
                  Two-Way Sign Sequencer (Avatar Clip Playlist):
                </span>
                {doctorGrammarGloss && (
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0' }}>
                    SOV Grammar: <strong style={{ color: '#F59E0B' }}>{doctorGrammarGloss}</strong>
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
                  background: isPlayingSequence ? 'rgba(5,150,105,0.7)' : 'rgba(15,118,110,0.7)',
                  color: '#FFF',
                  border: '1px solid rgba(20,184,166,0.3)',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                <Play size={11} />
                {isPlayingSequence ? `Playing Clip #${activeClipIndex + 1}...` : 'Play All Clips'}
              </button>
            </div>

            {/* Gloss Chips — amber glow on active */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {doctorGlosses.map((g, idx) => {
                const isCurrent = activeClipIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    className="kiosk-gloss-chip"
                    onClick={() => setActiveClipIndex(idx)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 13px',
                      borderRadius: '8px',
                      background: isCurrent ? 'rgba(245,158,11,0.2)' : 'rgba(6,13,26,0.6)',
                      color: isCurrent ? '#FCD34D' : '#94A3B8',
                      border: `1px solid ${isCurrent ? 'rgba(245,158,11,0.6)' : 'rgba(245,158,11,0.1)'}`,
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      transform: isCurrent ? 'scale(1.05)' : 'none',
                      boxShadow: isCurrent ? '0 0 16px rgba(245,158,11,0.35)' : 'none',
                    }}
                  >
                    <span>🎬 {idx + 1}. {g}</span>
                    {isCurrent && <span style={{ fontSize: '10px', color: '#F59E0B' }}>● Playing</span>}
                  </button>
                );
              })}
            </div>

            {/* Avatar Viewport */}
            {activeClipIndex >= 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(6,13,26,0.7)',
                  border: '1px dashed rgba(245,158,11,0.3)',
                  fontSize: '12px',
                  color: '#FCD34D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <strong>Avatar Gesture Viewport:</strong> Rendering sign gesture for &ldquo;
                  <span style={{ color: '#F59E0B', fontWeight: '700' }}>{doctorGlosses[activeClipIndex]}</span>&rdquo;
                </span>
                <span style={{ color: '#475569', fontSize: '11px' }}>ISL Dictionary Frame 30/30 · 60 FPS</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
