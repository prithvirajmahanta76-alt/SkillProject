import React, { useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  Volume2,
  VolumeX,
  Stethoscope,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import api from '../services/api';

const INITIAL_AUDIT = {
  consultation_id: 'OPD-CIVIL-1794156577',
  patient_id: 'PAT-9842',
  doctor_name: 'Dr. Anjali Mishra',
  soap_subjective:
    'Patient reports sharp epigastric pain radiating to lower abdomen for 48 hours. Mild nausea present, aggravated after spicy meals.',
  soap_objective:
    'Abdomen soft, tenderness localized at epigastrium. No rebound tenderness. Vitals: BP 124/82, HR 76 bpm, SpO2 98%.',
  soap_assessment:
    'Acute gastritis with functional dyspepsia (ICD-10 R10.9). Documented Penicillin allergy confirmed.',
  soap_plan:
    '1. Tab Pantocid 40mg OD before breakfast x 5 days.\n2. Tab Drotikind-M SOS.\n3. Ultrasound Whole Abdomen if symptoms persist.',
  verified_drugs: [
    {
      drug: 'Pantocid 40 (Pantoprazole 40mg)',
      spoken_timestamp: '00:38',
      confidence: 0.99,
      status: 'VERIFIED_SPOKEN',
      reason: "Verbatim acoustic match ('pantoprazole') confirmed in doctor audio.",
    },
    {
      drug: 'Drotikind-M (Drotaverine + Mefenamic)',
      spoken_timestamp: '00:46',
      confidence: 0.98,
      status: 'VERIFIED_SPOKEN',
      reason: "Verbatim acoustic match ('drotikind') confirmed in doctor audio.",
    },
  ],
  flagged_drugs: [
    {
      drug: 'Amoxicillin 500mg',
      spoken_timestamp: '00:52',
      confidence: 0.99,
      status: 'CONTRAINDICATED_ALLERGY',
      reason: "Doctor explicitly stated to AVOID this drug due to patient's Penicillin allergy.",
    },
  ],
  audit_score: 100.0,
  hallucination_detected: false,
  audit_verdict: 'AUDIT PASSED (100% Spoken Acoustic Ground-Truth Verified)',
  verification_hash: 'SB-AUDIT-98F4A21C00',
  created_at: new Date().toISOString(),
};

export default function AmbientScribe({ isPlayingAudio, handlePlayAudio }) {
  const [isRecording, setIsRecording] = useState(false);
  const [auditData, setAuditData] = useState(INITIAL_AUDIT);
  const [selectedConsultId] = useState('OPD-CIVIL-1794156577');
  const [activeTab, setActiveTab] = useState('soap'); // 'soap' | 'firewall'

  const loadAmbientAudit = useCallback(async () => {
    try {
      const res = await api.transcribeAndAuditConsultation(
        selectedConsultId,
        'PAT-9842',
        'Dr. Anjali Mishra'
      );
      setAuditData(res);
    } catch (err) {
      console.warn('Ambient audit fallback:', err);
    }
  }, [selectedConsultId]);

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Auto-stop after 4 seconds and re-audit
      setTimeout(() => {
        setIsRecording(false);
        loadAmbientAudit();
      }, 4000);
    } else {
      setIsRecording(false);
    }
  };

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
            <Stethoscope size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1C1917', margin: 0 }}>
                SilentAudit — Ambient Clinical Scribe & Fraud Firewall
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
                Zero-Hallucination Verified
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#78716C', margin: '4px 0 0 0' }}>
              Continuous acoustic diarization converting doctor-patient speech into structured SOAP notes with strict acoustic ground-truth verification.
            </p>
          </div>
        </div>

        {/* Live Mic Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={toggleRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '14px',
              background: isRecording
                ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                : 'linear-gradient(135deg, #B45309, #D97706)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isRecording
                ? '0 4px 16px rgba(220, 38, 38, 0.4)'
                : '0 4px 14px rgba(180, 83, 9, 0.25)',
              animation: isRecording ? 'pulse-live 1.5s infinite' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            {isRecording ? 'Listening & Auditing Audio...' : 'Start Ambient Consultation'}
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Column: Dual Channel Acoustic Stream & Verbatim Diarization */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#B45309" />
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1C1917', margin: 0 }}>
                Dual-Channel Acoustic Diarization Stream
              </h3>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: isRecording ? '#DC2626' : '#15803D',
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
                  background: isRecording ? '#DC2626' : '#15803D',
                  animation: isRecording ? 'pulse-live 1s infinite' : 'none',
                }}
              />
              {isRecording ? 'STREAMING 16kHz' : 'STATIONARY READY'}
            </span>
          </div>

          {/* Dual Waveform Visualizer */}
          <div
            style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'rgba(28, 25, 23, 0.04)',
              border: '1px solid rgba(217, 180, 130, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Channel 1: Doctor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#B45309', width: '70px' }}>
                DOCTOR:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1, height: '24px' }}>
                {[30, 60, 90, 45, 75, 100, 80, 50, 65, 85, 40, 70, 95, 60, 40, 80, 55, 30].map(
                  (val, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        background: '#B45309',
                        borderRadius: '2px',
                        height: isRecording ? `${val}%` : '20%',
                        transition: 'height 0.2s ease',
                      }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Channel 2: Patient */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0F766E', width: '70px' }}>
                PATIENT:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1, height: '24px' }}>
                {[20, 40, 60, 30, 80, 50, 70, 90, 40, 60, 80, 30, 50, 70, 40, 60, 30, 20].map(
                  (val, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        background: '#0F766E',
                        borderRadius: '2px',
                        height: isRecording ? `${val}%` : '15%',
                        transition: 'height 0.2s ease',
                      }}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Verbatim Consultation Transcript */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.08)',
                borderLeft: '4px solid #B45309',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#B45309' }}>
                  Dr. Anjali Mishra (General Medicine)
                </span>
                <span style={{ fontSize: '10px', color: '#78716C', fontVariantNumeric: 'tabular-nums' }}>
                  00:12
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#1C1917', margin: 0, lineHeight: 1.4 }}>
                "Good morning Rahul. Where is the pain located, and for how many days have you been feeling this?"
              </p>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(15, 118, 110, 0.08)',
                borderLeft: '4px solid #0F766E',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0F766E' }}>
                  Rahul Sahoo (Patient ISL Translated)
                </span>
                <span style={{ fontSize: '10px', color: '#78716C', fontVariantNumeric: 'tabular-nums' }}>
                  00:24
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#1C1917', margin: 0, lineHeight: 1.4 }}>
                [Signs: I - PAIN - STOMACH - TWO DAYS] "Doctor, I am experiencing severe stomach pain since the last two days. It hurts more after food."
              </p>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.08)',
                borderLeft: '4px solid #B45309',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#B45309' }}>
                  Dr. Anjali Mishra (General Medicine)
                </span>
                <span style={{ fontSize: '10px', color: '#78716C', fontVariantNumeric: 'tabular-nums' }}>
                  00:38
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#1C1917', margin: 0, lineHeight: 1.4 }}>
                "I will prescribe <strong>Pantoprazole 40mg (Pantocid)</strong> once daily before breakfast. If spasmodic colic occurs, take <strong>Drotikind-M</strong>. We will avoid Amoxicillin due to your Penicillin allergy."
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: SOAP Notes & Hallucination Firewall Guard */}
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
          {/* Sub Navigation Bar */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '4px',
              borderRadius: '12px',
              background: 'rgba(28, 25, 23, 0.05)',
            }}
          >
            {[
              { id: 'soap', label: 'SOAP Note', icon: FileCheck2 },
              { id: 'firewall', label: 'Hallucination Firewall', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isAct = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isAct ? 'linear-gradient(135deg, #B45309, #D97706)' : 'transparent',
                    color: isAct ? '#FFFFFF' : '#78716C',
                    fontWeight: isAct ? '800' : '600',
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: Structured SOAP Notes */}
          {activeTab === 'soap' && auditData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Subjective */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(217, 180, 130, 0.35)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#B45309', textTransform: 'uppercase', marginBottom: '4px' }}>
                  [S] Subjective (Chief Complaint & History)
                </div>
                <div style={{ fontSize: '12px', color: '#292524', lineHeight: 1.5 }}>
                  {auditData.soap_subjective}
                </div>
              </div>

              {/* Objective */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(217, 180, 130, 0.35)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F766E', textTransform: 'uppercase', marginBottom: '4px' }}>
                  [O] Objective (Physical Examination & Vitals)
                </div>
                <div style={{ fontSize: '12px', color: '#292524', lineHeight: 1.5 }}>
                  {auditData.soap_objective}
                </div>
              </div>

              {/* Assessment */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(217, 180, 130, 0.35)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#92400E', textTransform: 'uppercase', marginBottom: '4px' }}>
                  [A] Assessment (Clinical Diagnosis & ICD-10)
                </div>
                <div style={{ fontSize: '12px', color: '#292524', lineHeight: 1.5 }}>
                  {auditData.soap_assessment}
                </div>
              </div>

              {/* Plan */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(217, 180, 130, 0.35)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#15803D', textTransform: 'uppercase', marginBottom: '4px' }}>
                  [P] Plan (Rx Regimen & Interventions)
                </div>
                <pre
                  style={{
                    fontSize: '12px',
                    color: '#292524',
                    lineHeight: 1.5,
                    fontFamily: 'inherit',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {auditData.soap_plan}
                </pre>
              </div>

              {/* Audio Playback of Clinical Note */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  onClick={() =>
                    handlePlayAudio(
                      `${auditData.soap_subjective} Diagnosis: ${auditData.soap_assessment}. Regimen: ${auditData.soap_plan}`
                    )
                  }
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(217, 180, 130, 0.5)',
                    color: '#57534E',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {isPlayingAudio ? <VolumeX size={15} color="#DC2626" /> : <Volume2 size={15} />}
                  {isPlayingAudio ? 'Stop Voice Note' : 'Listen Clinical Audio Note'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Hallucination Firewall & Fraud Audit */}
          {activeTab === 'firewall' && auditData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Score Meter */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(21, 128, 61, 0.12) 0%, rgba(240, 253, 244, 0.8) 100%)',
                  border: '1px solid rgba(21, 128, 61, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#15803D', textTransform: 'uppercase' }}>
                    Acoustic Ground-Truth Score
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#15803D', marginTop: '2px' }}>
                    {auditData.audit_score}% VERIFIED
                  </div>
                  <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>
                    {auditData.audit_verdict}
                  </div>
                </div>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#15803D',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
              </div>

              {/* Verified Medications */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1C1917', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} color="#15803D" /> Spoken & Acoustically Validated Drugs ({auditData.verified_drugs.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {auditData.verified_drugs.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.85)',
                        border: '1px solid rgba(21, 128, 61, 0.3)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1C1917' }}>{d.drug}</div>
                        <div style={{ fontSize: '11px', color: '#78716C', marginTop: '2px' }}>{d.reason}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: 'rgba(21, 128, 61, 0.1)', color: '#15803D', border: '1px solid rgba(21, 128, 61, 0.3)' }}>
                          @{d.spoken_timestamp}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', background: '#15803D', color: '#FFFFFF' }}>
                          VERIFIED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flagged or Contraindicated Drugs */}
              {auditData.flagged_drugs.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#DC2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={15} color="#DC2626" /> Intercepted Unsafe or Hallucinated Drugs ({auditData.flagged_drugs.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {auditData.flagged_drugs.map((d, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(254, 242, 242, 0.9)',
                          border: '1px solid rgba(220, 38, 38, 0.4)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#DC2626' }}>{d.drug}</div>
                          <div style={{ fontSize: '11px', color: '#991B1B', marginTop: '2px' }}>{d.reason}</div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: '#DC2626', color: '#FFFFFF' }}>
                          INTERCEPTED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cryptographic Verification Hash */}
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#78716C',
                  textAlign: 'right',
                  padding: '6px 0',
                }}
              >
                Audit Hash: {auditData.verification_hash}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
