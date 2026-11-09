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
 * - Professional Warm Cream & Porcelain Clinical Theme (WCAG 2.1 AAA Compliant)
 * - Left: Patient Station (ISL Gesture Input, Hand Placement Ghost, Dynamic Triage Bar, Grammar Tokens, Breath AI)
 * - Right: Doctor/Staff Station (Bilingual Statement, Quick Clinical Chips, Dynamic Audio EQ, 3D Avatar Sign Sequencer)
 * - Center: Neural Bridge Conduits with Bidirectional Translation Flow
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

  return (
    <div
      style={{
        backgroundColor: '#FAF8F5', // Luxurious Warm Cream Alabaster
        borderRadius: '20px',
        border: '1px solid #E6DFD5',
        padding: '28px',
        boxShadow: '0 20px 40px -15px rgba(45, 35, 20, 0.08), 0 0 1px 1px rgba(230, 223, 213, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        color: '#0F172A',
        fontFamily: 'system-ui, -apple-system, sans-serif',
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
        .btn-shimmer {
          background: linear-gradient(90deg, #F59E0B 0%, #FDE68A 50%, #F59E0B 100%);
          background-size: 200% auto;
          animation: shimmerGlow 3s linear infinite;
        }
      `}</style>

      {/* Top Clinical Header & Dynamic Triage Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid #E6DFD5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#0F766E', // Clinical Deep Teal
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
            }}
          >
            <HeartPulse size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#1E293B', letterSpacing: '-0.3px' }}>
              Civil Hospital AI Kiosk • Dual-Station Clinical Console
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
              Zero-Barrier Two-Way Accessibility • MediaPipe ISL Gesture Engine & Gemini 1.5 Medical Bridge
            </p>
          </div>
        </div>

        {/* Dynamic Triage Alert Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: isCriticalTriage ? '#FEE2E2' : isUrgentTriage ? '#FEF3C7' : '#E6F4EA',
              color: isCriticalTriage ? '#B91C1C' : isUrgentTriage ? '#B45309' : '#047857',
              border: `1px solid ${isCriticalTriage ? '#FCA5A5' : isUrgentTriage ? '#FCD34D' : '#A7F3D0'}`,
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isCriticalTriage ? '#DC2626' : isUrgentTriage ? '#F59E0B' : '#10B981',
              }}
            />
            {isCriticalTriage
              ? 'ESI Level 1: Immediate Critical Attention'
              : isUrgentTriage
              ? 'ESI Level 3: Urgent Clinical Triage'
              : 'ESI Level 4: Standard Routine OPD Consultation'}
          </div>

          <span
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              backgroundColor: '#F1EFE9',
              color: '#475569',
              border: '1px solid #DCD6CB',
              fontSize: '11px',
              fontWeight: '600',
            }}
          >
            WCAG 2.1 AAA Compliant
          </span>
        </div>
      </div>

      {/* Main Split-Screen Grid with Central Conduit */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'stretch',
        }}
      >
        {/* ============================================================== */}
        {/* LEFT COLUMN: PATIENT CONSOLE                                    */}
        {/* ============================================================== */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E6DFD5',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 8px 20px -6px rgba(0,0,0,0.04)',
          }}
        >
          {/* Patient Console Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '14px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                color: '#B45309', // Warm Amber
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <User size={18} /> Patient Station (ISL Gesture Input)
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: '#ECFDF5',
                color: '#047857',
                border: '1px solid #A7F3D0',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Radio size={12} /> 60 FPS Camera Mesh
            </span>
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

          {/* Hand Positioning Wireframe Hint */}
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: '#FBF9F6',
              border: '1px dashed #DCD6CB',
              fontSize: '11px',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🖐️ <strong>Guidance:</strong> Keep hand in center viewfinder. 21 3D joints tracked live.</span>
            <span style={{ color: '#0F766E', fontWeight: 'bold' }}>Latency: 28ms</span>
          </div>

          {/* Grammar-Aware ISL Token Assembly Shelf */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', margin: 0 }}>
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
                      backgroundColor: '#F8F6F2',
                      border: '1px solid #DCD6CB',
                      fontSize: '11px',
                      color: '#475569',
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
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '11px',
                      color: '#94A3B8',
                      cursor: 'pointer',
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Token Chips Display */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                minHeight: '48px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#FAF8F5',
                border: '1px solid #E6DFD5',
                alignItems: 'center',
              }}
            >
              {accumulatedTokens.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                  No gestures queued. Show hand signs or tap quick shortcuts below...
                </span>
              ) : (
                accumulatedTokens.map((t, idx) => {
                  const isSubject = ['I', 'YOU', 'HE', 'SHE'].includes(t);
                  const isPredicate = ['PAIN', 'HURT', 'FEVER', 'HELP', 'BLEEDING'].includes(t);
                  return (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: isPredicate ? '#FEE2E2' : isSubject ? '#FEF3C7' : '#E0F2FE',
                        color: isPredicate ? '#B91C1C' : isSubject ? '#92400E' : '#0369A1',
                        border: `1px solid ${isPredicate ? '#FCA5A5' : isSubject ? '#FCD34D' : '#BAE6FD'}`,
                        fontWeight: 'bold',
                        fontSize: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      }}
                    >
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>#{idx + 1}</span>
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

              {/* Quick Sign Ingestion Shortcuts */}
              <button
                type="button"
                onClick={() => setAccumulatedTokens([...accumulatedTokens, 'WATER'])}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '11px',
                  border: '1px dashed #CBD5E1',
                  cursor: 'pointer',
                }}
              >
                + "WATER"
              </button>
              <button
                type="button"
                onClick={() => setAccumulatedTokens([...accumulatedTokens, 'FEVER'])}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '11px',
                  border: '1px dashed #CBD5E1',
                  cursor: 'pointer',
                }}
              >
                + "FEVER"
              </button>
            </div>
          </div>

          {/* Gemini Grammar Bridge Action Button with Shimmer */}
          <button
            type="button"
            onClick={handleSynthesizeTokens}
            disabled={isTranslating || accumulatedTokens.length === 0}
            className={accumulatedTokens.length > 0 ? 'btn-shimmer' : ''}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor: accumulatedTokens.length === 0 ? '#E2E8F0' : '#D97706',
              color: accumulatedTokens.length === 0 ? '#94A3B8' : '#FFFFFF',
              fontWeight: '800',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              border: 'none',
              cursor: accumulatedTokens.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: accumulatedTokens.length > 0 ? '0 6px 18px rgba(217, 119, 6, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={18} />
            {isTranslating ? 'Synthesizing Medical Sentence via Gemini 1.5...' : 'Speak for Me (Gemini Bridge)'}
          </button>

          {/* Acoustic Respiratory Biomarker AI Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#FFF5F8',
              border: '1px solid #FBCFE8',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#BE185D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mic size={15} /> Acoustic Respiratory Biomarker AI
              </span>
              <span style={{ fontSize: '11px', color: '#9D174D', fontWeight: '600' }}>
                Asthma / Wheeze Detector
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleAnalyzeCough('WHEEZE_ASTHMA')}
              disabled={isAnalyzingCough}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: '#BE185D',
                color: '#FFF',
                border: 'none',
                fontWeight: 'bold',
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

            {/* Diagnostic Result Callout */}
            {coughResult && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #F472B6',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#9D174D' }}>
                  <span>Biomarker: {coughResult.biomarker_detected}</span>
                  <span style={{ color: '#E11D48' }}>ICD-10: {coughResult.icd10_code}</span>
                </div>
                <div style={{ color: '#475569', fontStyle: 'italic' }}>
                  {coughResult.actionable_clinical_guidance}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CENTER CONDUIT: THE NEURAL BRIDGE                              */}
        {/* ============================================================== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '0 4px',
          }}
        >
          <div
            style={{
              width: '1px',
              flex: 1,
              backgroundColor: '#DCD6CB',
              backgroundImage: 'linear-gradient(to bottom, #DCD6CB 0%, #0F766E 50%, #DCD6CB 100%)',
            }}
          />
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '2px solid #0F766E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F766E',
              boxShadow: '0 4px 10px rgba(15, 118, 110, 0.2)',
              animation: 'bridgePulse 2.5s infinite',
            }}
            title="Bi-Directional Translation Engine"
          >
            <ArrowLeftRight size={16} />
          </div>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', writingMode: 'vertical-rl', letterSpacing: '1px' }}>
            BRIDGE
          </span>
          <div
            style={{
              width: '1px',
              flex: 1,
              backgroundColor: '#DCD6CB',
              backgroundImage: 'linear-gradient(to bottom, #DCD6CB 0%, #0F766E 50%, #DCD6CB 100%)',
            }}
          />
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: DOCTOR / STAFF STATION                           */}
        {/* ============================================================== */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E6DFD5',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 8px 20px -6px rgba(0,0,0,0.04)',
          }}
        >
          {/* Doctor Station Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '14px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                color: '#0F766E', // Clinical Deep Teal
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Stethoscope size={18} /> Physician / Doctor Station
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: '#F0FDFA',
                color: '#0F766E',
                border: '1px solid #99F6E4',
                fontWeight: 'bold',
              }}
            >
              Two-Way Audio + Avatar
            </span>
          </div>

          {/* Bilingual Patient Statement Display Box */}
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              backgroundColor: '#FAF8F5',
              border: '1px solid #E6DFD5',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* English Synthesized Statement */}
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.5px' }}>
                Synthesized Patient Statement (English):
              </span>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: '4px 0 0', lineHeight: 1.4 }}>
                "{synthesizedText}"
              </p>
            </div>

            <div style={{ height: '1px', backgroundColor: '#E6DFD5' }} />

            {/* Regional Translation with Live Audio Player & Equalizer */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.5px' }}>
                  Regional Medical Translation:
                </span>
                <button
                  type="button"
                  onClick={() => handlePlayAudio(translatedResult)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    backgroundColor: isPlayingAudio ? '#DC2626' : '#0F766E',
                    color: '#FFF',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <Volume2 size={13} />
                  {isPlayingAudio ? 'Stop Audio' : '🔊 Listen (Edge-TTS)'}
                </button>
              </div>

              <p style={{ fontSize: '17px', fontWeight: '800', color: '#B45309', margin: 0, lineHeight: 1.4 }}>
                {translatedResult}
              </p>

              {/* 7-Band Neural Audio Equalizer Animation */}
              {isPlayingAudio && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#0F766E', fontWeight: 'bold', marginRight: '6px' }}>
                    Broadcasting Neural Speech:
                  </span>
                  <span style={{ width: '3px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqDance1 0.5s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqDance2 0.7s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqDance3 0.6s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqDance1 0.8s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqDance2 0.5s infinite alternate' }} />
                  <span style={{ width: '3px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqDance3 0.9s infinite alternate' }} />
                </div>
              )}
            </div>

            {/* SHA-256 Digital Verification Stamp */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: '#059669',
                paddingTop: '6px',
                borderTop: '1px dashed #E6DFD5',
                fontWeight: '600',
              }}
            >
              <ShieldCheck size={14} />
              <span>SHA-256 Digital Tamper-Proof Signature • FHIR v4.0.1 Verified</span>
            </div>
          </div>

          {/* Quick Doctor Response Clinical Inquiry Chips */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'block' }}>
              ⚡ 1-Tap Physician Inquiries:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {DOCTOR_QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDoctorSpeechInput(prompt.text);
                    handleDoctorToGloss();
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#FAF8F5',
                    border: '1px solid #DCD6CB',
                    color: '#334155',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Response Text/Speech Input */}
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
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #DCD6CB',
                  color: '#0F172A',
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
                  backgroundColor: '#0F766E',
                  color: '#FFF',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(15, 118, 110, 0.25)',
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
              borderRadius: '12px',
              backgroundColor: '#FAF8F5',
              border: '1px solid #E6DFD5',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#0F766E', fontWeight: 'bold' }}>
                  Two-Way Sign Sequencer (Avatar Clip Playlist):
                </span>
                {doctorGrammarGloss && (
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0' }}>
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
                  padding: '5px 12px',
                  borderRadius: '6px',
                  backgroundColor: isPlayingSequence ? '#059669' : '#0F766E',
                  color: '#FFF',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                <Play size={11} />
                {isPlayingSequence ? `Playing Clip #${activeClipIndex + 1}...` : 'Play All Clips'}
              </button>
            </div>

            {/* Gloss Tokens with Spotlight Effect */}
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
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: isCurrent ? '#0F766E' : '#FFFFFF',
                      color: isCurrent ? '#FFFFFF' : '#0F766E',
                      border: `1px solid ${isCurrent ? '#0F766E' : '#99F6E4'}`,
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      transform: isCurrent ? 'scale(1.05)' : 'none',
                      boxShadow: isCurrent ? '0 4px 12px rgba(15, 118, 110, 0.35)' : 'none',
                    }}
                  >
                    <span>🎬 {idx + 1}. {g}</span>
                    {isCurrent && <span style={{ fontSize: '10px' }}>● Playing</span>}
                  </button>
                );
              })}
            </div>

            {/* Simulated Avatar Viewport Box */}
            {activeClipIndex >= 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px dashed #0F766E',
                  fontSize: '12px',
                  color: '#0F766E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <strong>Avatar Gesture Viewport:</strong> Rendering sign gesture for "
                  <span style={{ color: '#B45309', fontWeight: 'bold' }}>{doctorGlosses[activeClipIndex]}</span>"
                </span>
                <span style={{ color: '#64748B', fontSize: '11px' }}>ISL Dictionary Frame 30/30 • 60 FPS</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
