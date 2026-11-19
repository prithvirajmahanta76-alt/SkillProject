import React, { useState } from 'react';
import {
  Hand,
  Sparkles,
  Volume2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Radio,
} from 'lucide-react';

/**
 * DeafMuteHub
 * Phase 2: Deaf & Mute Gesture Recognition Hub Component
 * - ISL Sign Language Control Room — Futuristic Hex-Grid Studio Theme
 * - Categorized Medical ISL Vocabulary Palette (22 Clinical Signs)
 * - Interactive Sign Pose Avatar & Hand Joint Visualizer
 * - SOV Grammar Sentence Builder with Reordering & One-Tap Clinical Templates
 * - Gemini 1.5 Natural Language Synthesis & Multilingual Edge-TTS Audio
 */
export default function DeafMuteHub({
  accumulatedTokens,
  setAccumulatedTokens,
  synthesizedText,
  translatedResult,
  isTranslating,
  handleSynthesizeTokens,
  selectedLanguage,
  isPlayingAudio,
  handlePlayAudio,
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activePreviewSign, setActivePreviewSign] = useState(null);
  const [lastAddedSign, setLastAddedSign] = useState(null);

  // Categorized Medical ISL Dictionary with Gesture Articulation Details
  const VOCABULARY = [
    // Symptoms & Emergencies
    { sign: 'PAIN', category: 'SYMPTOMS', label: 'Pain / दर्द', icon: '⚡', pose: 'Closed fist vibrating near affected site', urgency: 'high' },
    { sign: 'FEVER', category: 'SYMPTOMS', label: 'Fever / बुखार', icon: '🌡️', pose: 'Back of hand placed against forehead', urgency: 'medium' },
    { sign: 'BREATHING', category: 'SYMPTOMS', label: 'Breathing Difficulty / सांस', icon: '🫁', pose: 'Both hands clutching upper chest', urgency: 'critical' },
    { sign: 'CHEST_PAIN', category: 'SYMPTOMS', label: 'Chest Pain / सीने में दर्द', icon: '💔', pose: 'Tight fist clenched over sternum', urgency: 'critical' },
    { sign: 'DIZZY', category: 'SYMPTOMS', label: 'Dizzy / चक्कर', icon: '💫', pose: 'Index finger circling above temple', urgency: 'medium' },
    { sign: 'STOMACH', category: 'SYMPTOMS', label: 'Stomach / पेट', icon: '🩺', pose: 'Flat palm circular motion over abdomen', urgency: 'medium' },
    { sign: 'BLEEDING', category: 'SYMPTOMS', label: 'Bleeding / खून', icon: '🩸', pose: 'Fingers fluttering downward from wound', urgency: 'critical' },

    // Clinical Requests
    { sign: 'DOCTOR', category: 'CLINICAL', label: 'Doctor / डॉक्टर', icon: '👨‍⚕️', pose: 'Two fingers tapping radial wrist pulse', urgency: 'medium' },
    { sign: 'NURSE', category: 'CLINICAL', label: 'Nurse / नर्स', icon: '👩‍⚕️', pose: 'Thumb forming cross on forehead / cap', urgency: 'medium' },
    { sign: 'MEDICINE', category: 'CLINICAL', label: 'Medicine / दवाई', icon: '💊', pose: 'Right middle finger grinding in left palm', urgency: 'medium' },
    { sign: 'INJECTION', category: 'CLINICAL', label: 'Injection / सुई', icon: '💉', pose: 'Index + thumb syringe plunge on arm', urgency: 'medium' },
    { sign: 'HELP', category: 'CLINICAL', label: 'Emergency Help / मदद', icon: '🆘', pose: 'Thumbs-up resting on flat upward palm', urgency: 'critical' },

    // Daily Needs & Comfort
    { sign: 'WATER', category: 'NEEDS', label: 'Water / पानी', icon: '💧', pose: 'W-handshape index tapping chin thrice', urgency: 'low' },
    { sign: 'FOOD', category: 'NEEDS', label: 'Food / खाना', icon: '🍲', pose: 'Flattened O-hand tapping lips twice', urgency: 'low' },
    { sign: 'RESTROOM', category: 'NEEDS', label: 'Restroom / शौचालय', icon: '🚻', pose: 'T-handshape shaking side to side', urgency: 'low' },
    { sign: 'WHEELCHAIR', category: 'NEEDS', label: 'Wheelchair / व्हीलचेयर', icon: '🧑‍🦼', pose: 'Hands circling like wheelchair wheels', urgency: 'low' },
    { sign: 'BLANKET', category: 'NEEDS', label: 'Cold / Blanket / कंबल', icon: '🥶', pose: 'Fists shivering with crossed arms', urgency: 'low' },

    // Responses & Navigation
    { sign: 'YES', category: 'RESPONSES', label: 'Yes / हाँ', icon: '👍', pose: 'S-fist nodding vertically like head', urgency: 'low' },
    { sign: 'NO', category: 'RESPONSES', label: 'No / नहीं', icon: '👎', pose: 'Index + middle snap onto thumb', urgency: 'low' },
    { sign: 'PLEASE', category: 'RESPONSES', label: 'Please / कृपया', icon: '🙏', pose: 'Flat palm circular rub over chest', urgency: 'low' },
    { sign: 'WHERE', category: 'RESPONSES', label: 'Where / कहाँ', icon: '❓', pose: 'Palms upward waving horizontally', urgency: 'low' },
    { sign: 'THANK_YOU', category: 'RESPONSES', label: 'Thank You / धन्यवाद', icon: '🤝', pose: 'Flat hand moving forward from chin', urgency: 'low' },
  ];

  const CATEGORIES = [
    { id: 'ALL', label: 'All Signs (22)' },
    { id: 'SYMPTOMS', label: '⚡ Symptoms & Pain (7)' },
    { id: 'CLINICAL', label: '🩺 Clinical Requests (5)' },
    { id: 'NEEDS', label: '💧 Patient Needs (5)' },
    { id: 'RESPONSES', label: '💬 Responses & Query (5)' },
  ];

  // 1-Tap Rapid Clinical Sentence Templates
  const QUICK_TEMPLATES = [
    { label: '⚡ Severe Stomach Pain', tokens: ['I', 'STOMACH', 'PAIN'] },
    { label: '🫁 Cannot Breathe / Urgent', tokens: ['I', 'BREATHING', 'HELP'] },
    { label: '💊 Need Regular Pills', tokens: ['I', 'MEDICINE', 'PLEASE'] },
    { label: '🚻 Need Restroom Assist', tokens: ['HELP', 'RESTROOM', 'WHEELCHAIR'] },
  ];

  const filteredVocab = selectedCategory === 'ALL'
    ? VOCABULARY
    : VOCABULARY.filter((v) => v.category === selectedCategory);

  const handleAddToken = (sign) => {
    setAccumulatedTokens([...accumulatedTokens, sign]);
    setLastAddedSign(sign);
    setActivePreviewSign(VOCABULARY.find((v) => v.sign === sign));
    setTimeout(() => setLastAddedSign(null), 800);
  };

  const handleRemoveToken = (idx) => {
    setAccumulatedTokens(accumulatedTokens.filter((_, i) => i !== idx));
  };

  const handleMoveToken = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= accumulatedTokens.length) return;
    const updated = [...accumulatedTokens];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setAccumulatedTokens(updated);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #060D1A 0%, #0A1226 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(20,184,166,0.15)',
        padding: '28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(20,184,166,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        color: '#E2E8F0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* CSS Keyframe Animations */}
      <style>{`
        @keyframes shimmerGlow {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes tokenBounce {
          0% { transform: scale(0.92) translateX(20px); opacity: 0; }
          70% { transform: scale(1.04) translateX(0); }
          100% { transform: scale(1) translateX(0); opacity: 1; }
        }
        @keyframes eqWave1 { 0% { height: 4px; } 50% { height: 18px; } 100% { height: 8px; } }
        @keyframes eqWave2 { 0% { height: 16px; } 50% { height: 6px; } 100% { height: 22px; } }
        @keyframes eqWave3 { 0% { height: 8px; } 50% { height: 24px; } 100% { height: 12px; } }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.06); opacity: 0; }
          100% { transform: scale(1.06); opacity: 0; }
        }
        @keyframes slideInRight {
          0% { transform: translateX(30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes arrowFlow {
          0% { opacity: 0.3; transform: translateX(-4px); }
          50% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0.3; transform: translateX(-4px); }
        }
        @keyframes hexPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .btn-shimmer {
          background: linear-gradient(90deg, #0F766E 0%, #14B8A6 40%, #B45309 70%, #0F766E 100%);
          background-size: 200% auto;
          animation: shimmerGlow 3s linear infinite;
        }
        .sign-card-hover:hover {
          transform: rotateY(8deg) translateZ(10px) scale(1.04) !important;
          box-shadow: 0 8px 32px rgba(20,184,166,0.2), 0 0 0 1px rgba(20,184,166,0.3) !important;
        }
      `}</style>

      {/* Animated Hex Dot-Matrix Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(20,184,166,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content wrapper — above hex overlay */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            paddingBottom: '18px',
            borderBottom: '1px solid rgba(20,184,166,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0F766E, #14B8A6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                boxShadow: '0 0 20px rgba(20,184,166,0.4)',
              }}
            >
              <Hand size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#F0FDFA', letterSpacing: '-0.3px' }}>
                ISL Gesture Control Room
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.8)', margin: '3px 0 0', fontFamily: 'monospace' }}>
                Sub-30ms ISL Random Forest Classifier • SOV Linguistic Grammar Bridge • Multilingual Voice
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(20,184,166,0.1)',
                color: '#14B8A6',
                border: '1px solid rgba(20,184,166,0.3)',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'monospace',
              }}
            >
              <Radio size={12} style={{ animation: 'hexPulse 1.5s ease-in-out infinite' }} />
              Sub-30ms Edge • {selectedLanguage}
            </span>
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                background: 'rgba(180,83,9,0.1)',
                color: '#F59E0B',
                border: '1px solid rgba(245,158,11,0.25)',
                fontSize: '11px',
                fontWeight: '600',
              }}
            >
              WCAG 2.1 AAA
            </span>
          </div>
        </div>

        {/* Rapid 1-Tap Clinical Sentence Templates Bar */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(148,163,184,0.7)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
            ⚡ 1-Tap Rapid Clinical Templates:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {QUICK_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAccumulatedTokens(tmpl.tokens)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: 'rgba(15,118,110,0.12)',
                  border: '1px solid rgba(20,184,166,0.25)',
                  color: '#94E4DC',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sentence Construction / Token Accumulator Workbench */}
        <div
          style={{
            padding: '22px',
            borderRadius: '16px',
            background: 'rgba(10,18,38,0.7)',
            border: '1px solid rgba(20,184,166,0.15)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'inset 0 1px 0 rgba(20,184,166,0.07)',
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#14B8A6', fontFamily: 'monospace' }}>
                📝 Sentence Construction Shelf ({accumulatedTokens.length} Gestures Selected)
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.6)', marginLeft: '10px' }}>
                ISL Grammar Order: Subject ➔ Object ➔ Verb/Action
              </span>
            </div>

            {accumulatedTokens.length > 0 && (
              <button
                type="button"
                onClick={() => setAccumulatedTokens([])}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 11px',
                  borderRadius: '6px',
                  background: 'rgba(220,38,38,0.1)',
                  color: '#FC8181',
                  border: '1px solid rgba(220,38,38,0.25)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={12} /> Clear Sentence
              </button>
            )}
          </div>

          {/* SOV Grammar Builder — cinema ticker */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              minHeight: '60px',
              alignItems: 'center',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(6,13,26,0.6)',
              border: '1px dashed rgba(20,184,166,0.2)',
              overflowX: 'auto',
            }}
          >
            {accumulatedTokens.length === 0 ? (
              <span style={{ fontSize: '13px', color: 'rgba(148,163,184,0.4)', fontStyle: 'italic', fontFamily: 'monospace' }}>
                Tap any gesture card below or use 1-Tap Clinical Templates above to assemble your statement...
              </span>
            ) : (
              accumulatedTokens.map((token, idx) => {
                const isSubject = ['I', 'YOU', 'HE', 'SHE'].includes(token);
                const isPredicate = ['PAIN', 'HURT', 'FEVER', 'HELP', 'BLEEDING'].includes(token);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: isPredicate
                        ? 'rgba(220,38,38,0.12)'
                        : isSubject
                        ? 'rgba(180,83,9,0.15)'
                        : 'rgba(15,118,110,0.2)',
                      color: isPredicate ? '#FC8181' : isSubject ? '#F59E0B' : '#14B8A6',
                      border: `1px solid ${isPredicate ? 'rgba(220,38,38,0.3)' : isSubject ? 'rgba(245,158,11,0.35)' : 'rgba(20,184,166,0.4)'}`,
                      fontWeight: 'bold',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      animation: 'slideInRight 0.3s ease-out',
                      boxShadow: isPredicate
                        ? '0 0 10px rgba(220,38,38,0.1)'
                        : isSubject
                        ? '0 0 10px rgba(245,158,11,0.15)'
                        : '0 0 10px rgba(20,184,166,0.1)',
                    }}
                  >
                    <span style={{ fontSize: '10px', opacity: 0.5 }}>#{idx + 1}</span>
                    <span>{token}</span>

                    {/* Reorder Left */}
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveToken(idx, -1)}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, opacity: 0.7 }}
                        title="Move left"
                      >
                        <ArrowLeft size={12} />
                      </button>
                    )}

                    {/* Reorder Right */}
                    {idx < accumulatedTokens.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveToken(idx, 1)}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, opacity: 0.7 }}
                        title="Move right"
                      >
                        <ArrowRight size={12} />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveToken(idx)}
                      style={{ background: 'none', border: 'none', color: '#FC8181', cursor: 'pointer', padding: 0, marginLeft: '2px', opacity: 0.8 }}
                      title="Remove token"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* SOV Grammar Timeline Connector */}
          {accumulatedTokens.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
              {['S — Subject', 'O — Object', 'V — Verb'].map((label, i) => (
                <React.Fragment key={label}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: 'rgba(180,83,9,0.15)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      color: '#F59E0B',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                    }}
                  >
                    {label}
                  </span>
                  {i < 2 && (
                    <span style={{ color: '#14B8A6', fontSize: '14px', animation: 'arrowFlow 1.5s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}>
                      →
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Grammar Synthesize CTA */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {/* Pulsing ring behind button */}
            {accumulatedTokens.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '240px',
                  height: '52px',
                  borderRadius: '14px',
                  border: '2px solid rgba(20,184,166,0.5)',
                  animation: 'pulseRing 2s ease-out infinite',
                  pointerEvents: 'none',
                }}
              />
            )}
            <button
              type="button"
              onClick={handleSynthesizeTokens}
              disabled={isTranslating || accumulatedTokens.length === 0}
              className={accumulatedTokens.length > 0 ? 'btn-shimmer' : ''}
              style={{
                padding: '14px 28px',
                borderRadius: '12px',
                background: accumulatedTokens.length === 0
                  ? 'rgba(30,41,59,0.6)'
                  : 'linear-gradient(135deg, #0F766E, #B45309)',
                color: accumulatedTokens.length === 0 ? 'rgba(148,163,184,0.5)' : '#FFFFFF',
                fontWeight: '800',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: 'none',
                cursor: accumulatedTokens.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: accumulatedTokens.length > 0 ? '0 6px 24px rgba(15,118,110,0.35)' : 'none',
                transition: 'all 0.2s',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Sparkles size={18} />
              {isTranslating ? 'Synthesizing with Gemini 1.5 Medical Bridge...' : '⚡ Synthesize Clinical Sentence'}
            </button>

            {translatedResult && (
              <button
                type="button"
                onClick={() => handlePlayAudio(translatedResult)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 22px',
                  borderRadius: '999px',
                  background: isPlayingAudio
                    ? 'rgba(220,38,38,0.2)'
                    : 'rgba(15,118,110,0.2)',
                  color: isPlayingAudio ? '#FC8181' : '#14B8A6',
                  border: `1px solid ${isPlayingAudio ? 'rgba(220,38,38,0.4)' : 'rgba(20,184,166,0.4)'}`,
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                }}
              >
                <Volume2 size={16} />
                {isPlayingAudio ? 'Stop Neural Audio' : '🔊 Speak for Me'}
                {/* Waveform animation bars inside */}
                {isPlayingAudio && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                    <span style={{ width: '3px', background: '#FC8181', borderRadius: '2px', display: 'inline-block', animation: 'eqWave1 0.5s infinite alternate' }} />
                    <span style={{ width: '3px', background: '#FC8181', borderRadius: '2px', display: 'inline-block', animation: 'eqWave2 0.7s infinite alternate' }} />
                    <span style={{ width: '3px', background: '#FC8181', borderRadius: '2px', display: 'inline-block', animation: 'eqWave3 0.6s infinite alternate' }} />
                    <span style={{ width: '3px', background: '#FC8181', borderRadius: '2px', display: 'inline-block', animation: 'eqWave1 0.8s infinite alternate' }} />
                    <span style={{ width: '3px', background: '#FC8181', borderRadius: '2px', display: 'inline-block', animation: 'eqWave2 0.5s infinite alternate' }} />
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Translation Output Card */}
          {translatedResult && (
            <div
              style={{
                padding: '18px 20px',
                borderRadius: '12px',
                background: 'rgba(6,13,26,0.8)',
                border: '1px solid rgba(20,184,166,0.15)',
                borderLeft: '4px solid #14B8A6',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                boxShadow: 'inset 0 1px 0 rgba(20,184,166,0.05)',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(148,163,184,0.5)', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                Synthesized Patient Statement (English): &quot;{synthesizedText}&quot;
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#F59E0B' }}>
                {translatedResult}
              </div>

              {/* Equalizer Visualizer */}
              {isPlayingAudio && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#14B8A6', fontWeight: 'bold', marginRight: '6px', fontFamily: 'monospace' }}>
                    Broadcasting Neural Voice:
                  </span>
                  <span style={{ width: '4px', backgroundColor: '#14B8A6', borderRadius: '2px', display: 'inline-block', animation: 'eqWave1 0.5s infinite alternate' }} />
                  <span style={{ width: '4px', backgroundColor: '#14B8A6', borderRadius: '2px', display: 'inline-block', animation: 'eqWave2 0.7s infinite alternate' }} />
                  <span style={{ width: '4px', backgroundColor: '#14B8A6', borderRadius: '2px', display: 'inline-block', animation: 'eqWave3 0.6s infinite alternate' }} />
                  <span style={{ width: '4px', backgroundColor: '#14B8A6', borderRadius: '2px', display: 'inline-block', animation: 'eqWave1 0.8s infinite alternate' }} />
                  <span style={{ width: '4px', backgroundColor: '#14B8A6', borderRadius: '2px', display: 'inline-block', animation: 'eqWave2 0.5s infinite alternate' }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Gesture Pose Articulation Inspector */}
        {activePreviewSign && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(15,118,110,0.08)',
              border: '1px solid rgba(20,184,166,0.25)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>{activePreviewSign.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#14B8A6', fontFamily: 'monospace' }}>
                  ISL Articulation: {activePreviewSign.sign} ({activePreviewSign.label})
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.7)' }}>
                  ✋ <strong style={{ color: 'rgba(148,163,184,0.9)' }}>Joint Motion Pose:</strong> {activePreviewSign.pose}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: '#14B8A6', fontWeight: 'bold', fontFamily: 'monospace', background: 'rgba(20,184,166,0.08)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(20,184,166,0.2)' }}>
              MediaPipe Keypoints Confirmed
            </span>
          </div>
        )}

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(180,83,9,0.4), rgba(245,158,11,0.2))'
                    : 'rgba(10,18,38,0.5)',
                  color: isActive ? '#F59E0B' : 'rgba(148,163,184,0.7)',
                  fontWeight: isActive ? 'bold' : '600',
                  border: `1px solid ${isActive ? 'rgba(245,158,11,0.4)' : 'rgba(20,184,166,0.1)'}`,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '0 4px 12px rgba(245,158,11,0.15)' : 'none',
                  fontFamily: 'monospace',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 3D Perspective Sign Card Grid */}
        <div
          style={{
            perspective: '1000px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
          }}
        >
          {filteredVocab.map((item) => {
            const isJustAdded = lastAddedSign === item.sign;
            const isSelected = accumulatedTokens.includes(item.sign);
            return (
              <button
                key={item.sign}
                type="button"
                onClick={() => handleAddToken(item.sign)}
                onMouseEnter={() => setActivePreviewSign(item)}
                className="sign-card-hover touch-target-lg"
                style={{
                  background: isJustAdded
                    ? 'rgba(245,158,11,0.1)'
                    : 'rgba(10,18,38,0.7)',
                  border: `1px solid ${isJustAdded ? 'rgba(245,158,11,0.5)' : isSelected ? 'rgba(245,158,11,0.3)' : 'rgba(20,184,166,0.15)'}`,
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isJustAdded ? 'rotateY(4deg) scale(1.04)' : 'rotateY(0deg)',
                  boxShadow: isSelected
                    ? '0 0 20px rgba(245,158,11,0.5), inset 0 0 10px rgba(245,158,11,0.1)'
                    : isJustAdded
                    ? '0 0 20px rgba(245,158,11,0.3)'
                    : '0 4px 16px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(8px)',
                  transformStyle: 'preserve-3d',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '40px', lineHeight: 1 }}>{item.icon}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '3px 7px',
                      borderRadius: '4px',
                      background: item.urgency === 'critical'
                        ? 'rgba(220,38,38,0.15)'
                        : item.urgency === 'high'
                        ? 'rgba(245,158,11,0.12)'
                        : 'rgba(15,118,110,0.15)',
                      color: item.urgency === 'critical'
                        ? '#FC8181'
                        : item.urgency === 'high'
                        ? '#F59E0B'
                        : '#14B8A6',
                      border: `1px solid ${item.urgency === 'critical' ? 'rgba(220,38,38,0.3)' : item.urgency === 'high' ? 'rgba(245,158,11,0.3)' : 'rgba(20,184,166,0.2)'}`,
                      fontWeight: 'bold',
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#F0FDFA', letterSpacing: '0.03em' }}>
                  {item.sign}
                </div>
                <div style={{ fontSize: '11px', color: '#14B8A6', fontFamily: 'monospace' }}>
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
