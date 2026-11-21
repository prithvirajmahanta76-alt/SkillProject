import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  TrendingUp,
  Award,
  VideoOff,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';

const PROTOCOLS = [
  {
    id: 'SHOULDER_ABDUCTION_RIGHT',
    name: 'Right Shoulder Abduction',
    indication: 'Stroke Hemiparesis & Frozen Shoulder',
    target_angle: 90.0,
    joint: 'Right Shoulder (Glenohumeral)',
    cue: 'Raise right arm straight out to the side until level with shoulder.',
  },
  {
    id: 'ELBOW_FLEXION_LEFT',
    name: 'Left Elbow Flexion',
    indication: 'Bicep Re-education & Spasticity Management',
    target_angle: 135.0,
    joint: 'Left Elbow (Humeroulnar)',
    cue: 'Bend left elbow smoothly bringing palm toward front of shoulder.',
  },
  {
    id: 'KNEE_EXTENSION_RIGHT',
    name: 'Seated Right Knee Extension',
    indication: 'Quadriceps Atrophy & Post-Op Knee Rehab',
    target_angle: 170.0,
    joint: 'Right Knee (Tibiofemoral)',
    cue: 'Extend lower leg straight out. Hold for 2 seconds at peak.',
  },
  {
    id: 'CERVICAL_ROTATION',
    name: 'Cervical Spine Rotation',
    indication: 'Cervical Spondylosis & Neck Stiffness',
    target_angle: 75.0,
    joint: 'Atlanto-Axial C1-C2',
    cue: 'Gently rotate chin toward right shoulder without tilting head.',
  },
];

const INITIAL_SESSION_HISTORY = [
  {
    id: 'REHAB-SES-882',
    exercise_name: 'Right Shoulder Abduction (Post-Stroke)',
    target_angle: 90.0,
    achieved_angle: 85.2,
    rom_percentage: 94.6,
    reps_completed: 12,
    compensatory_flags: ['Mild Lateral Trunk Lean (+3 deg)'],
    recovery_trend: 'POSITIVE_RECOVERY (+12% ROM)',
    created_at: new Date().toISOString(),
  },
];

export default function RehabDigitalTwin({ handlePlayAudio }) {
  const [selectedProtocol, setSelectedProtocol] = useState(PROTOCOLS[0]);
  const [isExercising, setIsExercising] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(45.0);
  const [repsCompleted, setRepsCompleted] = useState(0);
  const [targetReps] = useState(10);
  const [compensatoryFlags, setCompensatoryFlags] = useState([]);
  const [voiceCue, setVoiceCue] = useState('Position yourself in view and raise arm steadily.');
  const [sessionHistory, setSessionHistory] = useState(INITIAL_SESSION_HISTORY);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(false);

  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const drawSkeleton = useCallback((angle, target) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid & Horizon
    ctx.strokeStyle = 'rgba(217, 180, 130, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cx = w / 2;
    const cy = h / 2 - 20;

    // Head
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.arc(cx, cy - 70, 20, 0, Math.PI * 2);
    ctx.fill();

    // Torso Spine Line
    ctx.strokeStyle = '#1C1917';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 50);
    ctx.lineTo(cx, cy + 60);
    ctx.stroke();

    // Shoulders
    const shL = cx - 45;
    const shR = cx + 45;
    ctx.beginPath();
    ctx.moveTo(shL, cy - 35);
    ctx.lineTo(shR, cy - 35);
    ctx.stroke();

    // Static Left Arm
    ctx.strokeStyle = '#78716C';
    ctx.beginPath();
    ctx.moveTo(shL, cy - 35);
    ctx.lineTo(shL - 15, cy + 20);
    ctx.lineTo(shL - 15, cy + 70);
    ctx.stroke();

    // Dynamic Right Arm (Animated Joint Angle)
    const armRad = (angle * Math.PI) / 180;
    const elbowX = shR + Math.cos(armRad - Math.PI / 2) * 55;
    const elbowY = cy - 35 + Math.sin(armRad - Math.PI / 2) * 55;
    const wristX = elbowX + Math.cos(armRad - Math.PI / 2) * 50;
    const wristY = elbowY + Math.sin(armRad - Math.PI / 2) * 50;

    // Color: Shifts from Gold to Green at target
    const isTarget = angle >= target * 0.9;
    ctx.strokeStyle = isTarget ? '#15803D' : '#D97706';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(shR, cy - 35);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(wristX, wristY);
    ctx.stroke();

    // Joint Markers
    [
      { x: shR, y: cy - 35 },
      { x: elbowX, y: elbowY },
      { x: wristX, y: wristY },
    ].forEach((pt) => {
      ctx.fillStyle = isTarget ? '#16A34A' : '#F59E0B';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Angle Arc Overlay
    ctx.strokeStyle = isTarget ? 'rgba(21, 128, 61, 0.6)' : 'rgba(217, 119, 6, 0.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(shR, cy - 35, 40, -Math.PI / 2, -Math.PI / 2 + armRad);
    ctx.stroke();
    ctx.setLineDash([]);

    // Angle Text Overlay
    ctx.fillStyle = isTarget ? '#15803D' : '#B45309';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`${angle}°`, shR + 45, cy - 40);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.getRehabHistory('PAT-9842');
      if (Array.isArray(res) && res.length > 0) {
        setSessionHistory(res);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Fetch session history on mount
  useEffect(() => {
    let active = true;
    api.getRehabHistory('PAT-9842')
      .then((res) => { if (active && Array.isArray(res) && res.length > 0) setSessionHistory(res); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Exercise Animation & Kinetic Joint Tracker Simulator
  useEffect(() => {
    if (!isExercising) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let progress = 0;
    let direction = 1;

    const animateLoop = () => {
      progress += 0.015 * direction;
      if (progress >= 1.0) {
        progress = 1.0;
        direction = -1;
        // Increment rep on full cycle
        setRepsCompleted((prev) => prev + 1);
      } else if (progress <= 0.0) {
        progress = 0.0;
        direction = 1;
      }

      // Calculate simulated angle based on target
      const angle = Math.round(25 + progress * (selectedProtocol.target_angle - 15));
      setCurrentAngle(angle);

      // Check compensation
      if (angle > selectedProtocol.target_angle * 0.75 && progress > 0.8) {
        setCompensatoryFlags(['Mild Lateral Spine Lean (+3° compensation)']);
        setVoiceCue('Good peak extension! Straighten spine and lower smoothly.');
      } else {
        setCompensatoryFlags([]);
        setVoiceCue('Keep raising arm steadily. Maintain smooth tempo.');
      }

      // Render Skeleton Canvas
      drawSkeleton(angle, selectedProtocol.target_angle);

      animRef.current = requestAnimationFrame(animateLoop);
    };

    animRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isExercising, selectedProtocol, drawSkeleton]);

  const handleSaveSession = async () => {
    setSavingSession(true);
    try {
      const rom = Math.min(Math.round((currentAngle / selectedProtocol.target_angle) * 100), 100);
      await api.logRehabSession({
        patient_id: 'PAT-9842',
        exercise_name: selectedProtocol.name,
        target_angle: selectedProtocol.target_angle,
        achieved_angle: currentAngle,
        rom_percentage: rom,
        reps_completed: repsCompleted,
        compensatory_flags: compensatoryFlags,
        duration_seconds: 120,
        feedback_summary: `Achieved ${rom}% ROM across ${repsCompleted} repetitions.`,
      });
      setSessionSuccess(true);
      loadHistory();
      setTimeout(() => setSessionSuccess(false), 3000);
    } catch (err) {
      console.warn('Log session fallback:', err);
    } finally {
      setSavingSession(false);
    }
  };

  const romPct = Math.min(Math.round((currentAngle / selectedProtocol.target_angle) * 100), 120);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(254, 243, 199, 0.7) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(217, 180, 130, 0.45)',
          borderRadius: '20px',
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(180, 83, 9, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #B45309, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(180, 83, 9, 0.3)',
            }}
          >
            <Activity size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1C1917', margin: 0 }}>
                NeuroGait — Stroke & Physical Therapy Digital Twin
              </h2>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: 'rgba(21, 128, 61, 0.15)',
                  color: '#15803D',
                  border: '1px solid rgba(21, 128, 61, 0.3)',
                }}
              >
                33 3D Biomechanical Landmarks
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#78716C', margin: '4px 0 0 0' }}>
              Real-time skeletal joint angle calculation, range of motion (ROM) tracking, compensatory cheat detection, and regional voice cues.
            </p>
          </div>
        </div>

        {/* Start / Stop Toggle */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsExercising(!isExercising)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '14px',
              background: isExercising
                ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                : 'linear-gradient(135deg, #B45309, #D97706)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            {isExercising ? <VideoOff size={18} /> : <Play size={18} />}
            {isExercising ? 'Pause Therapy Session' : 'Start Live Therapy Session'}
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: 3D Biomechanical Skeleton HUD */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(217, 180, 130, 0.4)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(180, 83, 9, 0.04)',
          }}
        >
          {/* Top Bar of Canvas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#B45309', textTransform: 'uppercase' }}>
                Active Protocol
              </span>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#1C1917' }}>
                {selectedProtocol.name}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#B45309',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                Target: {selectedProtocol.target_angle}°
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: romPct >= 90 ? 'rgba(21, 128, 61, 0.15)' : 'rgba(28, 25, 23, 0.08)',
                  color: romPct >= 90 ? '#15803D' : '#1C1917',
                  border: romPct >= 90 ? '1px solid rgba(21, 128, 61, 0.4)' : '1px solid rgba(217, 180, 130, 0.4)',
                }}
              >
                Achieved: {currentAngle}° ({romPct}%)
              </span>
            </div>
          </div>

          {/* Skeleton Canvas Viewport */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '320px',
              borderRadius: '16px',
              background: 'radial-gradient(ellipse at center, rgba(254, 243, 199, 0.4) 0%, rgba(250, 246, 237, 0.9) 100%)',
              border: '1px solid rgba(217, 180, 130, 0.4)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <canvas ref={canvasRef} width={480} height={320} style={{ width: '100%', height: '100%' }} />

            {/* Rep Counter Badge */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                padding: '8px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(217, 180, 130, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Award size={18} color="#B45309" />
              <div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#78716C', textTransform: 'uppercase' }}>Reps Completed</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#1C1917' }}>
                  {repsCompleted} / {targetReps}
                </div>
              </div>
            </div>

            {/* Live Compensation Warning Overlay */}
            {compensatoryFlags.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                }}
              >
                <AlertTriangle size={15} />
                <span>{compensatoryFlags[0]}</span>
              </div>
            )}
          </div>

          {/* Voice Coach Prompts Bar */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(217, 180, 130, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Volume2 size={18} color="#B45309" />
              <div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#92400E', textTransform: 'uppercase' }}>
                  Real-time Neural Audio Coach
                </div>
                <div style={{ fontSize: '12px', color: '#1C1917', fontWeight: '700' }}>
                  "{voiceCue}"
                </div>
              </div>
            </div>
            <button
              onClick={() => handlePlayAudio(voiceCue)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(217, 180, 130, 0.5)',
                color: '#57534E',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Play Voice
            </button>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSaveSession}
              disabled={savingSession}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #15803D, #16A34A)',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
              }}
            >
              <CheckCircle2 size={15} />
              {savingSession ? 'Saving to ABDM Record...' : sessionSuccess ? '✅ Session Saved!' : 'Log Session to Patient Record'}
            </button>
            <button
              onClick={() => {
                setRepsCompleted(0);
                setCurrentAngle(25);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(217, 180, 130, 0.5)',
                color: '#57534E',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Right Column: Protocols & Recovery History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Protocol Chooser */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(217, 180, 130, 0.4)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(180, 83, 9, 0.04)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#1C1917' }}>
              Prescribed Rehabilitation Protocols
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PROTOCOLS.map((p) => {
                const isSel = selectedProtocol.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProtocol(p);
                      setCurrentAngle(25);
                      setRepsCompleted(0);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: isSel
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(254, 243, 199, 0.8) 100%)'
                        : 'rgba(255, 255, 255, 0.6)',
                      border: isSel ? '1px solid rgba(217, 119, 6, 0.5)' : '1px solid rgba(217, 180, 130, 0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: isSel ? '#B45309' : '#1C1917' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#78716C', marginTop: '2px' }}>
                        {p.indication}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', background: isSel ? '#B45309' : 'rgba(28, 25, 23, 0.06)', color: isSel ? '#FFFFFF' : '#78716C' }}>
                        {p.target_angle}°
                      </span>
                      <ChevronRight size={14} color={isSel ? '#B45309' : '#78716C'} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Recovery Timeline */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(217, 180, 130, 0.4)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(180, 83, 9, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#1C1917' }}>
              <TrendingUp size={16} color="#15803D" /> Longitudinal Recovery Sparkline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {sessionHistory.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(217, 180, 130, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#1C1917' }}>
                      {s.exercise_name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#15803D', fontWeight: '700', marginTop: '2px' }}>
                      {s.recovery_trend}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#B45309' }}>
                      {s.achieved_angle}° ({s.rom_percentage}%)
                    </div>
                    <div style={{ fontSize: '10px', color: '#78716C' }}>
                      {s.reps_completed} reps
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
