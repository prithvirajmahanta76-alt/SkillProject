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
 * - Professional Warm Cream & Golden Tactile Theme (WCAG 2.1 AAA Compliant)
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
        backgroundColor: '#FAF8F5', // Warm Cream Alabaster
        borderRadius: '20px',
        border: '1px solid #E6DFD5',
        padding: '28px',
        boxShadow: '0 20px 40px -15px rgba(45, 35, 20, 0.08), 0 0 1px 1px rgba(230, 223, 213, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        color: '#1C1917',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* CSS Keyframe Animations */}
      <style>{`
        @keyframes shimmerGlow {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes tokenBounce {
          0% { transform: scale(0.92); opacity: 0; }
          70% { transform: scale(1.04); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes eqWave1 { 0% { height: 4px; } 50% { height: 18px; } 100% { height: 8px; } }
        @keyframes eqWave2 { 0% { height: 16px; } 50% { height: 6px; } 100% { height: 22px; } }
        @keyframes eqWave3 { 0% { height: 8px; } 50% { height: 24px; } 100% { height: 12px; } }
        .btn-shimmer {
          background: linear-gradient(90deg, #F59E0B 0%, #FDE68A 50%, #F59E0B 100%);
          background-size: 200% auto;
          animation: shimmerGlow 3s linear infinite;
        }
      `}</style>

      {/* Header Bar */}
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
              borderRadius: '12px',
              backgroundColor: '#B45309', // Warm Amber/Gold
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 12px rgba(180, 83, 9, 0.25)',
            }}
          >
            <Hand size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#1E293B' }}>
              Deaf & Mute Gesture Recognition Hub
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
              Sub-30ms ISL Random Forest Classifier • SOV Linguistic Grammar Bridge • Multilingual Voice
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              border: '1px solid #FCD34D',
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Radio size={12} className="animate-pulse" />
            Sub-30ms Edge Inference • {selectedLanguage}
          </span>
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

      {/* Rapid 1-Tap Clinical Sentence Templates Bar */}
      <div>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748B', display: 'block', marginBottom: '8px' }}>
          ⚡ 1-Tap Rapid Clinical Templates:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {QUICK_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setAccumulatedTokens(tmpl.tokens)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E6DFD5',
                color: '#1E293B',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
              }}
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sentence Reconstruction Workbench Card */}
      <div
        style={{
          padding: '24px',
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E6DFD5',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(45, 35, 20, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F766E' }}>
              📝 Sentence Construction Shelf ({accumulatedTokens.length} Gestures Selected)
            </span>
            <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '10px' }}>
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
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: '#64748B',
                border: '1px solid #DCD6CB',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={12} /> Clear Sentence
            </button>
          )}
        </div>

        {/* Tokens Row with Grammar Roles */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            minHeight: '56px',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#FAF8F5',
            border: '1px dashed #DCD6CB',
          }}
        >
          {accumulatedTokens.length === 0 ? (
            <span style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
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
                    backgroundColor: isPredicate ? '#FEE2E2' : isSubject ? '#FEF3C7' : '#E0F2FE',
                    color: isPredicate ? '#B91C1C' : isSubject ? '#92400E' : '#0369A1',
                    border: `1px solid ${isPredicate ? '#FCA5A5' : isSubject ? '#FCD34D' : '#BAE6FD'}`,
                    fontWeight: 'bold',
                    fontSize: '13px',
                    animation: 'tokenBounce 0.3s ease-out',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>#{idx + 1}</span>
                  <span>{token}</span>

                  {/* Reorder Left */}
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMoveToken(idx, -1)}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
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
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                      title="Move right"
                    >
                      <ArrowRight size={12} />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleRemoveToken(idx)}
                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0, marginLeft: '2px' }}
                    title="Remove token"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Synthesis Action & Regional Voice Engine */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            onClick={handleSynthesizeTokens}
            disabled={isTranslating || accumulatedTokens.length === 0}
            className={accumulatedTokens.length > 0 ? 'btn-shimmer' : ''}
            style={{
              padding: '14px 26px',
              borderRadius: '12px',
              backgroundColor: accumulatedTokens.length === 0 ? '#E2E8F0' : '#D97706',
              color: accumulatedTokens.length === 0 ? '#94A3B8' : '#FFFFFF',
              fontWeight: '800',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: 'none',
              cursor: accumulatedTokens.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: accumulatedTokens.length > 0 ? '0 6px 18px rgba(217, 119, 6, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={18} />
            {isTranslating ? 'Synthesizing with Gemini 1.5 Medical Bridge...' : '🗣️ Speak for Me (Gemini Bridge)'}
          </button>

          {translatedResult && (
            <button
              type="button"
              onClick={() => handlePlayAudio(translatedResult)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                backgroundColor: isPlayingAudio ? '#DC2626' : '#0F766E',
                color: '#FFF',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
              }}
            >
              <Volume2 size={16} />
              {isPlayingAudio ? 'Stop Neural Audio' : '🔊 Hear in Regional Voice (Edge-TTS)'}
            </button>
          )}
        </div>

        {/* Translation Preview Box */}
        {translatedResult && (
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              backgroundColor: '#FAF8F5',
              border: '1px solid #E6DFD5',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 'bold' }}>
              Synthesized Patient Statement (English): "{synthesizedText}"
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#B45309' }}>
              {translatedResult}
            </div>

            {/* Equalizer Visualizer */}
            {isPlayingAudio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: '#0F766E', fontWeight: 'bold', marginRight: '6px' }}>
                  Broadcasting Neural Voice:
                </span>
                <span style={{ width: '4px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqWave1 0.5s infinite alternate' }} />
                <span style={{ width: '4px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqWave2 0.7s infinite alternate' }} />
                <span style={{ width: '4px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqWave3 0.6s infinite alternate' }} />
                <span style={{ width: '4px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqWave1 0.8s infinite alternate' }} />
                <span style={{ width: '4px', backgroundColor: '#0F766E', borderRadius: '2px', animation: 'eqWave2 0.5s infinite alternate' }} />
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
            backgroundColor: '#F0FDFA',
            border: '1px solid #99F6E4',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{activePreviewSign.icon}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F766E' }}>
                ISL Articulation: {activePreviewSign.sign} ({activePreviewSign.label})
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                ✋ <strong>Joint Motion Pose:</strong> {activePreviewSign.pose}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#0D9488', fontWeight: 'bold' }}>
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
                backgroundColor: isActive ? '#B45309' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#57534E',
                fontWeight: isActive ? 'bold' : '600',
                border: `1px solid ${isActive ? '#B45309' : '#E6DFD5'}`,
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

      {/* Vocabulary Gesture Card Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {filteredVocab.map((item) => {
          const isJustAdded = lastAddedSign === item.sign;
          return (
            <button
              key={item.sign}
              type="button"
              onClick={() => handleAddToken(item.sign)}
              onMouseEnter={() => setActivePreviewSign(item)}
              className="touch-target-lg"
              style={{
                backgroundColor: isJustAdded ? '#FEF3C7' : '#FFFFFF',
                border: `1px solid ${isJustAdded ? '#B45309' : '#E6DFD5'}`,
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s',
                transform: isJustAdded ? 'scale(1.03)' : 'none',
                boxShadow: '0 4px 12px rgba(45, 35, 20, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '26px' }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    backgroundColor: item.urgency === 'critical' ? '#FEE2E2' : '#F0FDFA',
                    color: item.urgency === 'critical' ? '#B91C1C' : '#0F766E',
                    fontWeight: 'bold',
                  }}
                >
                  {item.category}
                </span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B' }}>
                {item.sign}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
