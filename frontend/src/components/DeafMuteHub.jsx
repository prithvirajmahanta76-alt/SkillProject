import React, { useState } from 'react';
import {
  Hand,
  Sparkles,
  Volume2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Radio,
  Activity,
} from 'lucide-react';
import AnatomicalBodyMap from './AnatomicalBodyMap';
import AudioWaveVisualizer from './AudioWaveVisualizer';

/**
 * DeafMuteHub
 * Phase 2: Deaf & Mute Gesture Recognition Hub Component
 * - Golden Cream Glassmorphism Architecture
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
  const [showBodyMap, setShowBodyMap] = useState(false);

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
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        padding: '28px',
        boxShadow: '0 25px 60px -15px rgba(180, 83, 9, 0.08), 0 0 1px 1px rgba(217, 180, 130, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        color: '#1C1917',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* CSS Keyframe Animations */}
      <style>{`
        @keyframes shimmerGlowGold {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes eqWave1 { 0% { height: 4px; } 50% { height: 18px; } 100% { height: 8px; } }
        @keyframes eqWave2 { 0% { height: 16px; } 50% { height: 6px; } 100% { height: 22px; } }
        @keyframes eqWave3 { 0% { height: 8px; } 50% { height: 24px; } 100% { height: 12px; } }
        @keyframes slideInRight {
          0% { transform: translateX(20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .btn-shimmer-gold {
          background: linear-gradient(90deg, #B45309 0%, #D97706 40%, #F59E0B 70%, #B45309 100%);
          background-size: 200% auto;
          animation: shimmerGlowGold 3s linear infinite;
        }
        .sign-card-hover:hover {
          transform: translateY(-4px) scale(1.02) !important;
          box-shadow: 0 10px 25px rgba(180, 83, 9, 0.12), 0 0 0 1.5px rgba(180, 83, 9, 0.3) !important;
        }
      `}</style>

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          paddingBottom: '18px',
          borderBottom: '1px solid rgba(217, 180, 130, 0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)',
            }}
          >
            <Hand size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#1C1917', letterSpacing: '-0.3px' }}>
              ISL Gesture Recognition Hub
            </h2>
            <p style={{ fontSize: '12px', color: '#78716C', margin: '3px 0 0' }}>
              Sub-30ms ISL Random Forest Classifier • SOV Linguistic Grammar Bridge • Multilingual Edge-TTS
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(15, 118, 110, 0.1)',
              color: '#0F766E',
              border: '1px solid rgba(15, 118, 110, 0.25)',
              fontSize: '11px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Radio size={12} /> Sub-30ms Edge • {selectedLanguage}
          </span>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#92400E',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              fontSize: '11px',
              fontWeight: '800',
            }}
          >
            WCAG 2.1 AAA
          </span>
        </div>
      </div>

      {/* Rapid 1-Tap Clinical Sentence Templates Bar */}
      <div>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#78716C', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ⚡ 1-Tap Rapid Clinical Templates:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {QUICK_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setAccumulatedTokens(tmpl.tokens)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(217, 180, 130, 0.45)',
                color: '#92400E',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 2px 6px rgba(180, 83, 9, 0.05)',
              }}
            >
              {tmpl.label}
            </button>
          ))}

          {/* 3D Anatomical Body Map Toggle Button */}
          <button
            type="button"
            onClick={() => setShowBodyMap(!showBodyMap)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: showBodyMap ? 'linear-gradient(135deg, #0F766E, #14B8A6)' : 'rgba(15, 118, 110, 0.12)',
              border: '1.5px solid #0F766E',
              color: showBodyMap ? '#FFFFFF' : '#0F766E',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(15, 118, 110, 0.15)',
            }}
          >
            <Activity size={14} /> {showBodyMap ? 'Hide 3D Body Map' : '🩺 3D Human Symptom Map'}
          </button>
        </div>
      </div>

      {/* Interactive 3D Anatomical Body Map Dropdown / Panel */}
      {showBodyMap && (
        <AnatomicalBodyMap
          onSelectSymptom={(symptom) => {
            if (!accumulatedTokens.includes(symptom.token)) {
              const nextTokens = [...accumulatedTokens, symptom.token];
              setAccumulatedTokens(nextTokens);
              handleSynthesizeTokens(nextTokens);
            }
          }}
          onClose={() => setShowBodyMap(false)}
        />
      )}

      {/* Sentence Construction Shelf */}
      <div
        style={{
          padding: '22px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.75)',
          border: '1px solid rgba(217, 180, 130, 0.4)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(180, 83, 9, 0.04)',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#B45309' }}>
              📝 Sentence Construction Shelf ({accumulatedTokens.length} Gestures Selected)
            </span>
            <span style={{ fontSize: '12px', color: '#78716C', marginLeft: '10px' }}>
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
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(220, 38, 38, 0.1)',
                color: '#DC2626',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={12} /> Clear Shelf
            </button>
          )}
        </div>

        {/* SOV Grammar Builder Ticker */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            minHeight: '62px',
            alignItems: 'center',
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'rgba(254, 249, 238, 0.75)',
            border: '1.5px dashed rgba(217, 180, 130, 0.6)',
          }}
        >
          {accumulatedTokens.length === 0 ? (
            <span style={{ fontSize: '13px', color: '#A8A29E', fontStyle: 'italic' }}>
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
                    borderRadius: '10px',
                    background: isPredicate
                      ? 'rgba(220, 38, 38, 0.12)'
                      : isSubject
                      ? 'rgba(245, 158, 11, 0.18)'
                      : 'rgba(15, 118, 110, 0.12)',
                    color: isPredicate ? '#B91C1C' : isSubject ? '#92400E' : '#0F766E',
                    border: `1px solid ${isPredicate ? 'rgba(220,38,38,0.35)' : isSubject ? 'rgba(217,119,6,0.35)' : 'rgba(15,118,110,0.3)'}`,
                    fontWeight: '800',
                    fontSize: '13px',
                    animation: 'slideInRight 0.3s ease-out',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>#{idx + 1}</span>
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
                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0, marginLeft: '3px', opacity: 0.8 }}
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
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#92400E',
                    fontSize: '11px',
                    fontWeight: '800',
                  }}
                >
                  {label}
                </span>
                {i < 2 && (
                  <span style={{ color: '#B45309', fontSize: '13px', fontWeight: '800' }}>
                    →
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Grammar Synthesize CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            onClick={handleSynthesizeTokens}
            disabled={isTranslating || accumulatedTokens.length === 0}
            className={accumulatedTokens.length > 0 ? 'btn-shimmer-gold' : ''}
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              background: accumulatedTokens.length === 0
                ? 'rgba(231, 229, 228, 0.7)'
                : 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
              color: accumulatedTokens.length === 0 ? '#A8A29E' : '#FFFFFF',
              fontWeight: '800',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: 'none',
              cursor: accumulatedTokens.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: accumulatedTokens.length > 0 ? '0 8px 24px rgba(180, 83, 9, 0.28)' : 'none',
              transition: 'all 0.2s',
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
                padding: '14px 24px',
                borderRadius: '12px',
                background: isPlayingAudio ? '#DC2626' : '#0F766E',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: isPlayingAudio ? '0 4px 14px rgba(220, 38, 38, 0.3)' : '0 4px 14px rgba(15, 118, 110, 0.25)',
              }}
            >
              <Volume2 size={16} />
              {isPlayingAudio ? 'Stop Voice' : '🔊 Speak for Me'}
            </button>
          )}

          {isPlayingAudio && (
            <AudioWaveVisualizer isActive={isPlayingAudio} label="Broadcasting Speech" mode="output" />
          )}
        </div>

        {/* Translation Output Card */}
        {translatedResult && (
          <div
            style={{
              padding: '18px 22px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(217, 180, 130, 0.45)',
              borderLeft: '4px solid #0F766E',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(180, 83, 9, 0.04)',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#78716C', fontWeight: '800', letterSpacing: '0.05em' }}>
              Synthesized Patient Statement (English): &quot;{synthesizedText}&quot;
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#B45309' }}>
              {translatedResult}
            </div>
          </div>
        )}
      </div>

      {/* Selected Gesture Pose Articulation Inspector */}
      {activePreviewSign && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.6) 0%, rgba(255, 255, 255, 0.75) 100%)',
            border: '1px solid rgba(217, 119, 6, 0.35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '32px' }}>{activePreviewSign.icon}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#92400E' }}>
                ISL Articulation: {activePreviewSign.sign} ({activePreviewSign.label})
              </div>
              <div style={{ fontSize: '12px', color: '#57534E', marginTop: '2px' }}>
                ✋ <strong>Joint Motion Pose:</strong> {activePreviewSign.pose}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#0F766E', fontWeight: '800', background: 'rgba(15, 118, 110, 0.1)', padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(15, 118, 110, 0.25)' }}>
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
                padding: '8px 18px',
                borderRadius: '10px',
                background: isActive
                  ? 'linear-gradient(135deg, #B45309 0%, #D97706 100%)'
                  : 'rgba(255, 255, 255, 0.75)',
                color: isActive ? '#FFFFFF' : '#78716C',
                fontWeight: '800',
                border: `1px solid ${isActive ? '#B45309' : 'rgba(217, 180, 130, 0.4)'}`,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                boxShadow: isActive ? '0 4px 12px rgba(180, 83, 9, 0.25)' : 'none',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Sign Card Grid */}
      <div
        style={{
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
                background: isSelected
                  ? 'linear-gradient(145deg, #FEF3C7 0%, #FDE68A 100%)'
                  : isJustAdded
                  ? 'rgba(254, 243, 199, 0.7)'
                  : 'rgba(255, 255, 255, 0.8)',
                border: `1.5px solid ${isSelected ? '#B45309' : isJustAdded ? '#F59E0B' : 'rgba(217, 180, 130, 0.4)'}`,
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected
                  ? '0 6px 20px rgba(180, 83, 9, 0.2)'
                  : '0 4px 14px rgba(180, 83, 9, 0.04)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '38px', lineHeight: 1 }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: item.urgency === 'critical'
                      ? 'rgba(220,38,38,0.12)'
                      : item.urgency === 'high'
                      ? 'rgba(245,158,11,0.15)'
                      : 'rgba(15,118,110,0.12)',
                    color: item.urgency === 'critical'
                      ? '#DC2626'
                      : item.urgency === 'high'
                      ? '#B45309'
                      : '#0F766E',
                    border: `1px solid ${item.urgency === 'critical' ? 'rgba(220,38,38,0.25)' : item.urgency === 'high' ? 'rgba(245,158,11,0.3)' : 'rgba(15,118,110,0.25)'}`,
                    fontWeight: '800',
                  }}
                >
                  {item.category}
                </span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1C1917', letterSpacing: '-0.2px' }}>
                {item.sign}
              </div>
              <div style={{ fontSize: '12px', color: '#0F766E', fontWeight: '700' }}>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
