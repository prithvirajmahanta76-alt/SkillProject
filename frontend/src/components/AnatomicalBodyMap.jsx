import React, { useState } from 'react';
import { Activity, Flame, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

/**
 * AnatomicalBodyMap
 * Interactive 3D/2D Vector Anatomical Human Body Map
 * - Front/Back (Anterior / Posterior) Viewport
 * - 7 Clickable & Dwell-Selectable Anatomical Regions
 * - Dynamic VAS Pain Severity Thermal Grading (1-10)
 * - 1-Click Clinical Symptom Token Dispatch into Consultation & ISL Timeline
 */
export default function AnatomicalBodyMap({ onSelectSymptom, onClose }) {
  const [viewMode, setViewMode] = useState('anterior'); // 'anterior' | 'posterior'
  const [activeZone, setActiveZone] = useState('chest');
  const [painLevel, setPainLevel] = useState(7);
  const [selectedChips, setSelectedChips] = useState([]);

  // Medical Body Zones & Corresponding Clinical Tokens
  const BODY_ZONES = {
    head: {
      name: 'Head & Neurological',
      icd10: 'R51.9 / G44.1',
      symptoms: [
        { token: 'FEVER', label: 'High Fever / Cold Sweat', severity: 'moderate' },
        { token: 'PAIN', label: 'Severe Throbbing Headache', severity: 'high' },
        { token: 'DIZZY', label: 'Vertigo / Dizziness', severity: 'moderate' },
        { token: 'BLIND', label: 'Blurred Vision / Aura', severity: 'high' },
      ],
      anteriorCoords: { cx: 120, cy: 45, r: 24 },
      posteriorCoords: { cx: 120, cy: 45, r: 24 },
    },
    throat: {
      name: 'Throat & Upper Airway',
      icd10: 'J02.9',
      symptoms: [
        { token: 'THROAT', label: 'Sore Throat / Burning', severity: 'moderate' },
        { token: 'COUGH', label: 'Persistent Dry Cough', severity: 'moderate' },
        { token: 'WATER', label: 'Difficulty Swallowing (Dysphagia)', severity: 'high' },
      ],
      anteriorCoords: { cx: 120, cy: 82, r: 14 },
      posteriorCoords: { cx: 120, cy: 82, r: 14 },
    },
    chest: {
      name: 'Chest, Heart & Lungs',
      icd10: 'R07.9 / I20.9',
      symptoms: [
        { token: 'CHEST', label: 'Chest Pressure / Tightness', severity: 'critical' },
        { token: 'BREATHE', label: 'Shortness of Breath (Dyspnea)', severity: 'critical' },
        { token: 'HEART', label: 'Rapid Heart Palpitations', severity: 'high' },
        { token: 'EMERGENCY', label: 'Radiating Left Arm Ache', severity: 'critical' },
      ],
      anteriorCoords: { cx: 120, cy: 126, r: 28 },
      posteriorCoords: { cx: 120, cy: 126, r: 28 },
    },
    stomach: {
      name: 'Abdomen & Digestive',
      icd10: 'R10.9',
      symptoms: [
        { token: 'STOMACH', label: 'Acute Abdominal Cramps', severity: 'high' },
        { token: 'VOMIT', label: 'Nausea / Repeated Vomiting', severity: 'moderate' },
        { token: 'FOOD', label: 'Burning Gastric Acid Reflux', severity: 'moderate' },
        { token: 'BLEED', label: 'Severe Gastrointestinal Spasm', severity: 'high' },
      ],
      anteriorCoords: { cx: 120, cy: 182, r: 24 },
      posteriorCoords: { cx: 120, cy: 182, r: 24 },
    },
    spine: {
      name: 'Spine & Lumbar Region',
      icd10: 'M54.5',
      symptoms: [
        { token: 'PAIN', label: 'Lower Back Sharp Spasm', severity: 'high' },
        { token: 'FALL', label: 'Spinal Stiffness / Restricted Gait', severity: 'moderate' },
        { token: 'BED', label: 'Sciatic Radiating Leg Nerve Pain', severity: 'high' },
      ],
      anteriorCoords: { cx: 120, cy: 228, r: 18 },
      posteriorCoords: { cx: 120, cy: 180, r: 32 },
    },
    arms: {
      name: 'Arms, Hands & Joints',
      icd10: 'M25.50',
      symptoms: [
        { token: 'ARM', label: 'Joint Swelling / Arthritis', severity: 'moderate' },
        { token: 'NUMB', label: 'Numbness / Loss of Grip Strength', severity: 'high' },
        { token: 'FRACTURE', label: 'Acute Wrist / Shoulder Sprain', severity: 'high' },
      ],
      anteriorCoords: { cx: 62, cy: 155, r: 18 },
      posteriorCoords: { cx: 62, cy: 155, r: 18 },
    },
    legs: {
      name: 'Legs, Knees & Feet',
      icd10: 'R60.0',
      symptoms: [
        { token: 'LEG', label: 'Knee Joint Inability to Walk', severity: 'high' },
        { token: 'SWELLING', label: 'Bilateral Ankle Edema / Swelling', severity: 'moderate' },
        { token: 'FALL', label: 'Post-Fall Trauma / Bruising', severity: 'high' },
      ],
      anteriorCoords: { cx: 102, cy: 290, r: 22 },
      posteriorCoords: { cx: 102, cy: 290, r: 22 },
    },
  };

  const currentZoneData = BODY_ZONES[activeZone] || BODY_ZONES.chest;

  // Pain color thermal ramp
  const getPainColor = (lvl) => {
    if (lvl <= 3) return '#10B981'; // Green
    if (lvl <= 6) return '#F59E0B'; // Amber
    if (lvl <= 8) return '#F97316'; // Orange
    return '#EF4444';              // Red / Critical
  };

  const handleChipClick = (symptom) => {
    if (!selectedChips.includes(symptom.token)) {
      setSelectedChips([...selectedChips, symptom.token]);
    }
    if (onSelectSymptom) {
      onSelectSymptom({
        token: symptom.token,
        label: symptom.label,
        zone: currentZoneData.name,
        painScore: painLevel,
        icd10: currentZoneData.icd10,
      });
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '24px',
        border: '1px solid rgba(217, 180, 130, 0.45)',
        boxShadow: '0 20px 50px -15px rgba(180, 83, 9, 0.12), 0 0 1px 1px rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: '#1C1917',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(217, 180, 130, 0.35)',
          paddingBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 6px 16px rgba(180, 83, 9, 0.25)',
            }}
          >
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#1C1917' }}>
                Interactive 3D Anatomical Symptom Locator
              </h3>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(15, 118, 110, 0.12)',
                  color: '#0F766E',
                  fontSize: '11px',
                  fontWeight: '800',
                }}
              >
                1-TAP DISPATCH
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#57534E', margin: '2px 0 0' }}>
              Select where it hurts on the human body wireframe to immediately populate clinical tokens.
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'anterior' ? 'posterior' : 'anterior')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(217, 180, 130, 0.45)',
              fontSize: '12px',
              fontWeight: '700',
              color: '#B45309',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(180, 83, 9, 0.05)',
            }}
          >
            <RefreshCw size={14} />
            View: {viewMode === 'anterior' ? 'Front (Anterior)' : 'Back (Posterior)'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(217, 180, 130, 0.2)',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                color: '#57534E',
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Body Vector + Symptom Selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 280px) 1fr',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        {/* Anatomical Human Vector SVG */}
        <div
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.95) 0%, rgba(245, 236, 224, 0.85) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(217, 180, 130, 0.45)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(180, 83, 9, 0.04)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '12px',
              left: '14px',
              fontSize: '11px',
              fontWeight: '800',
              color: '#0F766E',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {viewMode.toUpperCase()} PERSPECTIVE
          </span>

          <svg width="240" height="360" viewBox="0 0 240 360" style={{ cursor: 'pointer', overflow: 'visible' }}>
            <defs>
              <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Stylized Human Silhouette */}
            {/* Head */}
            <path
              d="M 104 35 C 104 20, 136 20, 136 35 C 136 55, 130 65, 120 65 C 110 65, 104 55, 104 35 Z"
              fill={activeZone === 'head' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(231, 220, 206, 0.4)'}
              stroke={activeZone === 'head' ? '#B45309' : '#C4B5A5'}
              strokeWidth={activeZone === 'head' ? '2.5' : '1.5'}
              onClick={() => setActiveZone('head')}
            />

            {/* Neck / Throat */}
            <path
              d="M 112 65 L 128 65 L 128 85 L 112 85 Z"
              fill={activeZone === 'throat' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(231, 220, 206, 0.4)'}
              stroke={activeZone === 'throat' ? '#B45309' : '#C4B5A5'}
              strokeWidth={activeZone === 'throat' ? '2.5' : '1.5'}
              onClick={() => setActiveZone('throat')}
            />

            {/* Torso: Chest & Abdomen */}
            <path
              d="M 85 85 C 100 82, 140 82, 155 85 L 150 150 C 145 152, 95 152, 90 150 Z"
              fill={activeZone === 'chest' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(231, 220, 206, 0.4)'}
              stroke={activeZone === 'chest' ? '#B45309' : '#C4B5A5'}
              strokeWidth={activeZone === 'chest' ? '2.5' : '1.5'}
              onClick={() => setActiveZone('chest')}
            />

            {/* Abdomen & Pelvis */}
            <path
              d="M 90 150 L 150 150 L 145 210 L 95 210 Z"
              fill={activeZone === 'stomach' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(231, 220, 206, 0.4)'}
              stroke={activeZone === 'stomach' ? '#B45309' : '#C4B5A5'}
              strokeWidth={activeZone === 'stomach' ? '2.5' : '1.5'}
              onClick={() => setActiveZone('stomach')}
            />

            {/* Spine (visible if posterior or when spine is active) */}
            {viewMode === 'posterior' && (
              <line
                x1="120" y1="85" x2="120" y2="210"
                stroke={activeZone === 'spine' ? '#B45309' : '#D97706'}
                strokeWidth={activeZone === 'spine' ? '4' : '2'}
                strokeDasharray="4 3"
                onClick={() => setActiveZone('spine')}
              />
            )}

            {/* Left Arm */}
            <path
              d="M 85 85 L 60 150 L 50 200 L 40 210"
              fill="none"
              stroke={activeZone === 'arms' ? '#B45309' : '#C4B5A5'}
              strokeWidth={activeZone === 'arms' ? '8' : '5'}
              strokeLinecap="round"
              onClick={() => setActiveZone('arms')}
            />

            {/* Right Arm */}
            <path
              d="M 155 85 L 180 150 L 190 200 L 200 210"
              fill="none"
              stroke={activeZone === 'arms' ? '#B45309' : '#C4B5A5'}
              strokeWidth={activeZone === 'arms' ? '8' : '5'}
              strokeLinecap="round"
              onClick={() => setActiveZone('arms')}
            />

            {/* Left Leg */}
            <path
              d="M 102 210 L 98 280 L 95 340 L 85 348"
              fill="none"
              stroke={activeZone === 'legs' ? '#B45309' : '#C4B5A5'}
              strokeWidth={activeZone === 'legs' ? '9' : '6'}
              strokeLinecap="round"
              onClick={() => setActiveZone('legs')}
            />

            {/* Right Leg */}
            <path
              d="M 138 210 L 142 280 L 145 340 L 155 348"
              fill="none"
              stroke={activeZone === 'legs' ? '#B45309' : '#C4B5A5'}
              strokeWidth={activeZone === 'legs' ? '9' : '6'}
              strokeLinecap="round"
              onClick={() => setActiveZone('legs')}
            />

            {/* Active Highlight Target Indicator */}
            <circle
              cx={currentZoneData[viewMode === 'anterior' ? 'anteriorCoords' : 'posteriorCoords'].cx}
              cy={currentZoneData[viewMode === 'anterior' ? 'anteriorCoords' : 'posteriorCoords'].cy}
              r="16"
              fill="none"
              stroke={getPainColor(painLevel)}
              strokeWidth="2.5"
              strokeDasharray="3 3"
              style={{ animation: 'pulse-soft 1.5s infinite ease-in-out' }}
            />
            <circle
              cx={currentZoneData[viewMode === 'anterior' ? 'anteriorCoords' : 'posteriorCoords'].cx}
              cy={currentZoneData[viewMode === 'anterior' ? 'anteriorCoords' : 'posteriorCoords'].cy}
              r="6"
              fill={getPainColor(painLevel)}
            />
          </svg>

          <span style={{ fontSize: '11px', color: '#78716C', marginTop: '6px' }}>
            Tap any anatomical zone to inspect
          </span>
        </div>

        {/* Right Details Panel: Zone Info + Pain Slider + Symptom Dispatch Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Zone Label + ICD-10 */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(217, 180, 130, 0.45)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(180, 83, 9, 0.04)',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#78716C', textTransform: 'uppercase' }}>
                Selected Region:
              </span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#1C1917', marginTop: '2px' }}>
                {currentZoneData.name}
              </div>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(217, 119, 6, 0.12)',
                color: '#B45309',
                fontSize: '12px',
                fontWeight: '800',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              ICD-10: {currentZoneData.icd10}
            </span>
          </div>

          {/* VAS Pain Level Severity Slider */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(217, 180, 130, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1C1917', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} color={getPainColor(painLevel)} />
                Visual Analog Pain Scale (VAS):
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: getPainColor(painLevel),
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: `${getPainColor(painLevel)}18`,
                }}
              >
                {painLevel} / 10 ({painLevel <= 3 ? 'Mild' : painLevel <= 6 ? 'Moderate' : painLevel <= 8 ? 'Severe' : 'Unbearable Critical'})
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={painLevel}
              onChange={(e) => setPainLevel(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                accentColor: getPainColor(painLevel),
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Quick Symptom Injection Chips */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#78716C', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tap Symptom to Dispatch to Translation Engine:
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {currentZoneData.symptoms.map((symptom) => {
                const isSelected = selectedChips.includes(symptom.token);
                return (
                  <button
                    key={symptom.label}
                    type="button"
                    onClick={() => handleChipClick(symptom)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      background: isSelected
                        ? 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)'
                        : 'rgba(255, 255, 255, 0.95)',
                      border: isSelected
                        ? '1px solid #0F766E'
                        : '1px solid rgba(217, 180, 130, 0.45)',
                      color: isSelected ? '#FFFFFF' : '#1C1917',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected
                        ? '0 6px 18px rgba(15, 118, 110, 0.25)'
                        : '0 2px 6px rgba(180, 83, 9, 0.04)',
                    }}
                  >
                    {isSelected ? <CheckCircle2 size={16} /> : <Sparkles size={16} color="#B45309" />}
                    <span>{symptom.label}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(217, 119, 6, 0.12)',
                        color: isSelected ? '#FFFFFF' : '#B45309',
                        fontWeight: '800',
                      }}
                    >
                      +{symptom.token}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
