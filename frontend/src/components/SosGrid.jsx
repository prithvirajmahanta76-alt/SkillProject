import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Ambulance,
  AlertTriangle,
  Stethoscope,
  Activity,
  HelpCircle,
  Users,
  Radio,
  CheckCircle2,
  Volume2,
  BellRing,
  RotateCcw,
  MapPin,
  Clock,
  Flame,
} from 'lucide-react';

/**
 * SosGrid
 * Phase 5: 1-Tap SOS Emergency Grid Component
 * - Emergency Command — Full-Bleed Crimson Alert Grid
 * - 8 Clinical Emergency Classifications
 * - Circular SVG countdown timer
 * - Terminal-style dispatch console
 */
export default function SosGrid({
  sosActive,
  setSosActive,
  sosMessage,
  setSosMessage,
  handleTriggerSOS,
  handlePlayAudio,
  isPlayingAudio,
}) {
  const [activeDispatchType, setActiveDispatchType] = useState(null);
  const [cancelCountdown, setCancelCountdown] = useState(null);
  const [dispatchLines, setDispatchLines] = useState([]);
  const hasAnnouncedRef = useRef(false);
  const cancelTimerRef = useRef(null);
  const dispatchTimerRef = useRef(null);

  // ICD-10 codes for each card
  const SOS_CARDS = [
    {
      type: 'AMBULANCE',
      code: 'CODE RED',
      title: 'Ambulance / Code Red',
      subtitle: 'Cardiac Arrest / Unresponsive / Massive Trauma',
      icon: Ambulance,
      primaryColor: '#EF4444',
      icd10: 'I46.9',
      triageLevel: 'ESI-1 Resuscitation',
    },
    {
      type: 'CANNOT_BREATHE',
      code: 'CODE BLUE',
      title: 'Cannot Breathe',
      subtitle: 'Severe Dyspnea / Airway Obstruction / SpO2 < 85%',
      icon: Activity,
      primaryColor: '#F97316',
      icd10: 'J96.00',
      triageLevel: 'ESI-1 Airway Crisis',
    },
    {
      type: 'SEVERE_PAIN',
      code: 'ACUTE PAIN',
      title: 'Severe 10/10 Pain',
      subtitle: 'Acute Post-Op / Chest Pain / Kidney Colic',
      icon: AlertTriangle,
      primaryColor: '#FBBF24',
      icd10: 'R52',
      triageLevel: 'ESI-2 Emergent',
    },
    {
      type: 'DOCTOR_NEEDED',
      code: 'STAT MD',
      title: 'Doctor Needed STAT',
      subtitle: 'Sudden Patient Deterioration / Arrhythmia',
      icon: Stethoscope,
      primaryColor: '#14B8A6',
      icd10: 'I49.9',
      triageLevel: 'ESI-2 Physician Bedside',
    },
    {
      type: 'FALL_DETECTED',
      code: 'FALL ALARM',
      title: 'Fell Down / Lost',
      subtitle: 'Immobilized Patient / Bed or Bathroom Fall',
      icon: HelpCircle,
      primaryColor: '#A78BFA',
      icd10: 'W19.XXXA',
      triageLevel: 'ESI-3 Urgent Ortho',
    },
    {
      type: 'ANAPHYLAXIS',
      code: 'ALLERGY SOS',
      title: 'Allergic Reaction',
      subtitle: 'Throat Swelling / Facial Angioedema / Hives',
      icon: Flame,
      primaryColor: '#F43F5E',
      icd10: 'T78.2XXA',
      triageLevel: 'ESI-1 Anaphylaxis',
    },
    {
      type: 'BLEEDING_IV',
      code: 'IV EMERGENCY',
      title: 'Active Bleed / IV Off',
      subtitle: 'Cannula Dislodgement / Hematoma / Blood Drip',
      icon: BellRing,
      primaryColor: '#E879F9',
      icd10: 'T82.898A',
      triageLevel: 'ESI-2 Vascular',
    },
    {
      type: 'FAMILY_ALERT',
      code: 'ATTENDANT',
      title: 'Summon Family / Nurse',
      subtitle: 'Attendant Urgent Presence Needed at Bedside',
      icon: Users,
      primaryColor: '#4ADE80',
      icd10: 'Z76.89',
      triageLevel: 'ESI-4 Non-Critical',
    },
  ];

  const onCardClick = (type) => {
    setActiveDispatchType(type);
    setSosActive(true);
    hasAnnouncedRef.current = false;
    setDispatchLines([]);
    handleTriggerSOS(type);

    // 5-second grace cancellation window
    setCancelCountdown(5);
    if (cancelTimerRef.current) clearInterval(cancelTimerRef.current);
    cancelTimerRef.current = setInterval(() => {
      setCancelCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(cancelTimerRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelGrace = () => {
    if (cancelTimerRef.current) clearInterval(cancelTimerRef.current);
    setCancelCountdown(null);
    setSosActive(false);
    setSosMessage(null);
    setActiveDispatchType(null);
    setDispatchLines([]);
  };

  const handleManualReset = () => {
    if (cancelTimerRef.current) clearInterval(cancelTimerRef.current);
    if (dispatchTimerRef.current) clearTimeout(dispatchTimerRef.current);
    setCancelCountdown(null);
    setSosActive(false);
    setSosMessage(null);
    setActiveDispatchType(null);
    setDispatchLines([]);
  };

  // Sequential dispatch console lines
  useEffect(() => {
    if (sosMessage) {
      const lines = [
        '> DISPATCH INITIATED...',
        '> AMBULANCE ALERTED...',
        '> STAFF NOTIFIED...',
        '> NURSE STATION ACK: 200 OK',
        '> CORRIDOR BEACON ACTIVE',
      ];
      lines.forEach((line, i) => {
        dispatchTimerRef.current = setTimeout(() => {
          setDispatchLines((prev) => [...prev, line]);
        }, i * 700);
      });
    }
    return () => {
      if (dispatchTimerRef.current) clearTimeout(dispatchTimerRef.current);
    };
  }, [sosMessage]);

  // Auto-announce audio once when sosMessage arrives
  useEffect(() => {
    if (sosMessage && !hasAnnouncedRef.current) {
      const broadcastText = sosMessage.regional_audio_broadcast?.hi || sosMessage.regional_audio_broadcast?.en;
      if (broadcastText && typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          const utterance = new SpeechSynthesisUtterance(broadcastText);
          utterance.rate = 1.0;
          utterance.pitch = 1.1;
          window.speechSynthesis.speak(utterance);
          hasAnnouncedRef.current = true;
        } catch {
          // Speech synthesis fallback
        }
      }
    }
  }, [sosMessage]);

  // SVG circular countdown ring params
  const RING_R = 72;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;
  const ringProgress = cancelCountdown !== null ? (cancelCountdown / 5) * RING_CIRCUMFERENCE : RING_CIRCUMFERENCE;

  const activeCard = SOS_CARDS.find((c) => c.type === activeDispatchType);

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        @keyframes alertBorder {
          0%, 100% { border-color: rgba(239,68,68,0.3); box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50% { border-color: rgba(239,68,68,0.9); box-shadow: 0 0 40px rgba(239,68,68,0.25); }
        }
        @keyframes cardAlert {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeInLine {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes sirenSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes sirenPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes ringDash {
          from { stroke-dashoffset: 0; }
        }
        @keyframes cardHoverGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50% { box-shadow: 0 0 30px rgba(239,68,68,0.3); }
        }
      `}</style>

      <div
        style={{
          background: 'linear-gradient(135deg, #0D0A0A 0%, #1A0A0A 50%, #0D0A0A 100%)',
          borderRadius: '20px',
          border: sosActive ? '2px solid rgba(239,68,68,0.9)' : '2px solid rgba(239,68,68,0.3)',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          animation: sosActive ? 'alertBorder 1.5s ease-in-out infinite' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '1px solid rgba(239,68,68,0.2)',
            paddingBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Siren icon */}
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(239,68,68,0.15)',
                border: '1.5px solid rgba(239,68,68,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                animation: sosActive ? 'sirenPulse 1s ease-in-out infinite' : 'none',
              }}
            >
              <ShieldAlert size={30} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    margin: 0,
                    color: '#EF4444',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  🚨 EMERGENCY DISPATCH
                </h2>

                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: sosActive ? 'rgba(239,68,68,0.9)' : 'rgba(239,68,68,0.15)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(239,68,68,0.6)',
                    fontSize: '11px',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    animation: sosActive ? 'sirenPulse 1s ease-in-out infinite' : 'none',
                  }}
                >
                  {sosActive ? '● CODE DISPATCH ACTIVE' : '○ STANDBY READY'}
                </span>
              </div>

              {activeCard && sosActive && (
                <div
                  style={{
                    fontSize: '13px',
                    color: activeCard.primaryColor,
                    marginTop: '5px',
                    fontWeight: '700',
                    letterSpacing: '0.03em',
                  }}
                >
                  ▶ {activeCard.title} — {activeCard.triageLevel}
                </div>
              )}

              {!sosActive && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                  High-visibility tactile triggers. 1-tap broadcasts bilingual ward audio.
                </p>
              )}
            </div>
          </div>

          {/* Location + Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
                fontSize: '12px',
                fontWeight: '700',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <MapPin size={15} color="#EF4444" /> Civil Hospital: Ward 3, Bed 14 [Floor 2]
            </div>

            {sosActive && (
              <button
                type="button"
                onClick={handleManualReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1.5px solid #EF4444',
                  color: '#EF4444',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={15} /> Reset Alarm
              </button>
            )}
          </div>
        </div>

        {/* ── Grace Period: Circular SVG Countdown ── */}
        {cancelCountdown !== null && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '16px',
              padding: '20px 0',
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>
              <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#EF4444' }} />
              ACCIDENTAL TAP? GRACE CANCELLATION WINDOW ACTIVE
            </div>

            <div style={{ position: 'relative', width: '180px', height: '180px' }}>
              <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background track */}
                <circle
                  cx="90"
                  cy="90"
                  r={RING_R}
                  fill="none"
                  stroke="rgba(239,68,68,0.15)"
                  strokeWidth="10"
                />
                {/* Animated progress ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={RING_R}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE - ringProgress}
                  style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                />
              </svg>

              {/* Center content */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '52px',
                    fontWeight: '900',
                    color: '#EF4444',
                    lineHeight: 1,
                    animation: 'sirenPulse 1s ease-in-out infinite',
                  }}
                >
                  {cancelCountdown}
                </span>
                <button
                  type="button"
                  onClick={handleCancelGrace}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '8px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'rgba(239,68,68,0.7)', textAlign: 'center' }}>
              Full hospital code siren will lock in when timer reaches 0s.
            </div>
          </div>
        )}

        {/* ── 8 Emergency Triage Cards (4×2 Grid) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}
        >
          {SOS_CARDS.map((card) => {
            const Icon = card.icon;
            const isSelected = activeDispatchType === card.type;
            return (
              <button
                key={card.type}
                type="button"
                onClick={() => onCardClick(card.type)}
                style={{
                  background: isSelected ? 'rgba(220,0,0,0.25)' : 'rgba(30,0,0,0.6)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: isSelected
                    ? `2px solid ${card.primaryColor}`
                    : '1px solid rgba(239,68,68,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                  animation: isSelected ? 'cardAlert 1.2s ease-in-out infinite' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '160px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(239,68,68,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = isSelected ? card.primaryColor : 'rgba(239,68,68,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Large icon in colored circle */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: `${card.primaryColor}22`,
                    border: `2px solid ${card.primaryColor}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.primaryColor,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={28} />
                </div>

                {/* Emergency type */}
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: card.primaryColor,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      marginBottom: '3px',
                    }}
                  >
                    {card.code}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      lineHeight: 1.25,
                    }}
                  >
                    {card.title}
                  </div>
                </div>

                {/* ICD-10 code */}
                <div
                  style={{
                    marginTop: 'auto',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#EF4444',
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    letterSpacing: '0.05em',
                    background: 'rgba(239,68,68,0.08)',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  ICD-10: {card.icd10}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Dispatch Console Terminal ── */}
        {sosMessage && (
          <div
            style={{
              background: '#000',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: '14px',
              padding: '24px',
              fontFamily: 'JetBrains Mono, Consolas, monospace',
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
          >
            {/* Terminal header bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(239,68,68,0.3)',
                paddingBottom: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    animation: 'sirenPulse 1s ease-in-out infinite',
                  }}
                >
                  <BellRing size={18} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#EF4444',
                      fontFamily: 'JetBrains Mono, Consolas, monospace',
                      letterSpacing: '0.05em',
                    }}
                  >
                    DISPATCH CONSOLE — {sosMessage.emergency_type || activeDispatchType}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    Protocol: Immediate Ward Triage Code | Bedside Beacon Active
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#EF4444',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  letterSpacing: '0.08em',
                }}
              >
                <Radio size={13} /> LIVE WARD ALERT
              </div>
            </div>

            {/* Terminal output lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '130px' }}>
              {dispatchLines.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: idx < 3 ? '#4ADE80' : 'rgba(255,255,255,0.6)',
                    animation: 'fadeInLine 0.4s ease both',
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                  }}
                >
                  {idx < 3 ? (
                    <CheckCircle2 size={15} color="#4ADE80" />
                  ) : (
                    <CheckCircle2 size={15} color="rgba(255,255,255,0.4)" />
                  )}
                  {line}
                </div>
              ))}
              {/* Blinking cursor */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'rgba(239,68,68,0.7)',
                  fontFamily: 'JetBrains Mono, Consolas, monospace',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '18px',
                    background: '#EF4444',
                    animation: 'blink 1s step-start infinite',
                    verticalAlign: 'middle',
                  }}
                />
              </div>
            </div>

            {/* PA Audio Row */}
            <div
              style={{
                marginTop: '16px',
                background: 'rgba(239,68,68,0.06)',
                borderRadius: '10px',
                padding: '14px 16px',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#EF4444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '4px',
                  }}
                >
                  Bilingual Hospital PA Broadcast (Hindi + English):
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'rgba(255,255,255,0.85)',
                    fontFamily: 'inherit',
                    lineHeight: 1.4,
                  }}
                >
                  &ldquo;{sosMessage.regional_audio_broadcast?.hi || sosMessage.regional_audio_broadcast?.en || 'वार्ड ३, बेड १४ पर आपातकालीन चिकित्सा सहायता आवश्यक है।'}&rdquo;
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePlayAudio(sosMessage.regional_audio_broadcast?.hi || sosMessage.regional_audio_broadcast?.en)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: isPlayingAudio ? '#EF4444' : 'rgba(239,68,68,0.2)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(239,68,68,0.5)',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, Consolas, monospace',
                  letterSpacing: '0.03em',
                  transition: 'background 0.2s ease',
                }}
              >
                <Volume2 size={16} />
                {isPlayingAudio ? 'Playing...' : 'Re-announce Audio'}
              </button>
            </div>

            {/* 4-Channel Verification */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                marginTop: '14px',
              }}
            >
              {[
                { label: 'Nurse Station Webhook', detail: 'ACK 200 (Console #04)' },
                { label: 'Attendant SMS Alert', detail: 'Sent to +91 98***-****1' },
                { label: 'Corridor Visual Beacon', detail: 'Strobe Amber/Red Flashing' },
                { label: 'Crash Cart Dispatch', detail: 'En Route to Ward 3' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(74,222,128,0.07)',
                    border: '1px solid rgba(74,222,128,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#4ADE80',
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                  }}
                >
                  <CheckCircle2 size={14} color="#4ADE80" />
                  <div>
                    <div style={{ fontWeight: '700' }}>{item.label}:</div>
                    <div style={{ fontSize: '11px', color: 'rgba(74,222,128,0.7)' }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
