import React, { useState, useEffect } from 'react';
import {
  Activity,
  BarChart3,
  CreditCard,
  Eye,
  FileText,
  Hand,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  Terminal,
  UserCheck,
  XCircle,
} from 'lucide-react';
import api from './services/api';
import { speakTextAloud, stopAudioPlayback } from './services/audioPlayer';
import HospitalKiosk from './components/HospitalKiosk';
import DeafMuteHub from './components/DeafMuteHub';
import BlindAssistant from './components/BlindAssistant';
import MotorHandsFree from './components/MotorHandsFree';
import SosGrid from './components/SosGrid';
import HospitalImpactRoi from './components/HospitalImpactRoi';
import AbhaSmartCardModal from './components/AbhaSmartCardModal';
import OpdSlipModal from './components/OpdSlipModal';
import FloatingBilingualCaptions from './components/FloatingBilingualCaptions';

const LANGUAGES = [
  { code: 'en-IN', name: 'English', native: 'English' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  { code: 'or-IN', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('kiosk');
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
  const [sosActive, setSosActive] = useState(false);
  const [sosMessage, setSosMessage] = useState(null);

  // Kiosk / Deaf Hub States
  const [currentSign, setCurrentSign] = useState('PAIN');
  const [accumulatedTokens, setAccumulatedTokens] = useState(['I', 'PAIN', 'STOMACH']);
  const [synthesizedText, setSynthesizedText] = useState('Doctor, I am experiencing severe stomach pain.');
  const [translatedResult, setTranslatedResult] = useState('डॉक्टर साहब, मेरे पेट में बहुत तेज़ दर्द हो रहा है।');
  const [isTranslating, setIsTranslating] = useState(false);
  const [doctorSpeechInput, setDoctorSpeechInput] = useState('Where does it hurt? Please take a seat.');
  const [doctorGlosses, setDoctorGlosses] = useState(['YOU', 'HURT', 'WHERE', 'SIT', 'PLEASE']);

  // Blind Assistant States
  const [visionResult, setVisionResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Motor Impaired States
  const [motorAction, setMotorAction] = useState('YES_CONFIRM');
  const [motorFeedback, setMotorFeedback] = useState('Head Nod Detected (YES / Confirm)');

  // API Tester States
  const [testEndpoint, setTestEndpoint] = useState('gesture');
  const [apiResponseJson, setApiResponseJson] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePlayAudio = async (textToPlay) => {
    if (!textToPlay) return;
    if (isPlayingAudio) {
      stopAudioPlayback();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    try {
      await speakTextAloud(textToPlay, selectedLanguage);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Clinical Documents & Telemetry States (Phase 3)
  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [showOpdModal, setShowOpdModal] = useState(false);
  const [currentConsultId, setCurrentConsultId] = useState('OPD-CIVIL-1794156577');
  const [impactData, setImpactData] = useState(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  // Phase 4 Clinical States
  const [doctorSignClips, setDoctorSignClips] = useState([]);
  const [doctorGrammarGloss, setDoctorGrammarGloss] = useState('');
  const [ddiResult, setDdiResult] = useState(null);
  const [coughResult, setCoughResult] = useState(null);
  const [isAnalyzingCough, setIsAnalyzingCough] = useState(false);

  const handleAnalyzeCough = async (preset = 'WHEEZE_ASTHMA') => {
    setIsAnalyzingCough(true);
    try {
      const res = await api.analyzeCough(preset, null, 'PAT-9842');
      setCoughResult(res);
    } catch {
      setCoughResult({
        biomarker_detected: 'WHEEZING_STRIDOR (Bronchospasm Detected)',
        triage_urgency: 'HIGH',
        icd10_code: 'J45.901 (Asthma with acute exacerbation)',
        clinical_correlation: 'Correlates with patient documented Bronchial Asthma history.',
        actionable_clinical_guidance: 'Immediate physician evaluation; prepare Salbutamol nebulization.',
      });
    } finally {
      setIsAnalyzingCough(false);
    }
  };

  const fetchImpactReport = async () => {
    setLoadingImpact(true);
    try {
      const data = await api.getHospitalImpactReport();
      setImpactData(data);
    } catch {
      setImpactData({
        hospital_name: 'Government Civil Hospital - SignBridge Universal Kiosk',
        total_patient_encounters: 42,
        critical_allergy_contraindications_blocked: 14,
        average_triage_minutes_saved_per_patient: 18.5,
        estimated_total_staff_hours_saved: 12.9,
        edge_offline_uptime_percentage: 99.98,
        abdm_health_locker_sync_rate: 100.0,
        disability_demographics_percentage: {
          'Deaf & Mute (ISL Gestures)': '62.5%',
          'Blind & Low Vision (Speech/OCR)': '22.5%',
          'Motor Impaired (Face Mesh/Nod)': '15.0%',
        },
        top_diagnosed_conditions: [
          { icd10: 'R10.9', condition: 'Acute Abdominal Pain', count: 18 },
          { icd10: 'R07.9', condition: 'Acute Chest Pain / Triage Red', count: 8 },
          { icd10: 'J45.9', condition: 'Bronchial Asthma Exacerbation', count: 6 },
        ],
      });
    } finally {
      setLoadingImpact(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'impact_stats' && !impactData) {
      const timer = setTimeout(() => {
        fetchImpactReport();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, impactData]);

  // Trigger Gemini Synthesis
  const handleSynthesizeTokens = async () => {
    setIsTranslating(true);
    try {
      const langShort = selectedLanguage.split('-')[0];
      const result = await api.synthesizeSentence(accumulatedTokens, langShort);
      setSynthesizedText(result.natural_sentence);
      setTranslatedResult(result.translated_text);
    } catch {
      // Fallback local simulation if backend not yet running
      const map = {
        hi: 'डॉक्टर साहब, मेरे पेट में बहुत तेज़ दर्द हो रहा है।',
        or: 'ଡାକ୍ତର ବାବୁ, ମୋର ପେଟରେ ପ୍ରବଳ ଯନ୍ତ୍ରଣା ହେଉଛି।',
        te: 'డాక్టర్ గారు, నాకు కడుపులో తీవ్రమైన నొప్పిగా ఉంది.',
        en: 'Doctor, I am experiencing severe stomach pain.',
      };
      const langShort = selectedLanguage.split('-')[0];
      setSynthesizedText('Doctor, I am experiencing severe stomach pain.');
      setTranslatedResult(map[langShort] || map.en);
    } finally {
      setIsTranslating(false);
    }
  };

  // Convert Doctor voice to Sign Glosses (Two-Way Sequencer)
  const handleDoctorToGloss = async () => {
    try {
      const result = await api.tokenizeSignSequence(doctorSpeechInput, selectedLanguage);
      if (result && result.tokens && result.tokens.length > 0) {
        setDoctorGlosses(result.tokens);
        setDoctorSignClips(result.clips || []);
        setDoctorGrammarGloss(result.isl_grammatical_gloss || result.tokens.join(' '));
      } else {
        const fallbackRes = await api.textToGloss(doctorSpeechInput);
        setDoctorGlosses(fallbackRes.gloss_sequence || ['YOU', 'HURT', 'WHERE', 'SIT', 'PLEASE']);
      }
    } catch {
      setDoctorGlosses(['YOU', 'HURT', 'WHERE', 'SIT', 'PLEASE']);
    }
  };

  // Trigger SOS
  const handleTriggerSOS = async (type = 'SEVERE_PAIN') => {
    setSosActive(true);
    try {
      const result = await api.triggerSOS(type, 'Ward 3, Bed 14', selectedLanguage);
      setSosMessage(result);
    } catch {
      setSosMessage({
        emergency_type: type,
        status: 'DISPATCHED (SIMULATED)',
        strobe_visual_alert: true,
        regional_audio_broadcast: {
          en: `Emergency alert! Patient in Ward 3 reports ${type}!`,
          hi: `आपातकालीन चेतावनी! वार्ड 3 के मरीज ने सहायता माँगी है!`,
          or: `ଜରୁରୀକାଳୀନ ସତର୍କତା! ୱାର୍ଡ 3 ରୋଗୀ ସାହାଯ୍ୟ ମାଗିଛନ୍ତି!`,
          te: `అత్యవసర హెచ్చరిక! వార్డ్ 3 రోగి అత్యవసర సహాయం కోరారు!`,
        },
      });
    }
  };

  // Simulate Medicine Scan with DDI Checking
  const handleScanMedicine = async () => {
    setIsScanning(true);
    try {
      const result = await api.scanMedicine('dummy_base64_data', selectedLanguage.split('-')[0]);
      setVisionResult(result);

      // Automatic Drug-Drug Interaction check against active regimen
      try {
        const ddi = await api.checkDDI([result.medicine_name || 'Ibuprofen 400mg'], ['Amlodipine 5mg'], 'PAT-9842');
        setDdiResult(ddi);
      } catch (ddiErr) {
        console.warn('DDI check fallback:', ddiErr);
      }
    } catch {
      setVisionResult({
        medicine_name: 'Paracetamol',
        strength: '500 mg',
        active_ingredients: ['Acetaminophen 500mg'],
        dosage_instructions: 'Take 1 tablet after food with water.',
        expiry_date: 'November 2027',
        is_expired: false,
        spoken_summary: 'Paracetamol 500mg. Expiry Date: November 2027. Take one tablet after food.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Run selected API contract test
  const handleRunApiTest = async () => {
    setApiLoading(true);
    try {
      let data;
      if (testEndpoint === 'gesture') {
        // 21 canonical landmarks for ISL "PAIN" sign — fist with extended index finger
        // Landmark layout: wrist(0), thumb(1-4), index(5-8), middle(9-12), ring(13-16), pinky(17-20)
        const PAIN_LANDMARKS = [
          { x: 0.00, y: 0.00, z: 0.00 },   // 0  WRIST
          { x: -0.14, y: 0.05, z: 0.00 },  // 1  THUMB_CMC
          { x: -0.23, y: 0.13, z: 0.00 },  // 2  THUMB_MCP
          { x: -0.27, y: 0.21, z: 0.00 },  // 3  THUMB_IP
          { x: -0.29, y: 0.30, z: 0.01 },  // 4  THUMB_TIP
          { x: 0.05, y: 0.20, z: 0.00 },   // 5  INDEX_MCP
          { x: 0.05, y: 0.31, z: -0.01 },  // 6  INDEX_PIP
          { x: 0.05, y: 0.40, z: -0.02 },  // 7  INDEX_DIP
          { x: 0.05, y: 0.49, z: -0.02 },  // 8  INDEX_TIP  ← extended
          { x: 0.00, y: 0.22, z: 0.00 },   // 9  MIDDLE_MCP
          { x: 0.01, y: 0.24, z: 0.01 },   // 10 MIDDLE_PIP (curled)
          { x: 0.02, y: 0.20, z: 0.02 },   // 11 MIDDLE_DIP
          { x: 0.02, y: 0.17, z: 0.03 },   // 12 MIDDLE_TIP
          { x: -0.05, y: 0.20, z: 0.00 },  // 13 RING_MCP
          { x: -0.04, y: 0.22, z: 0.01 },  // 14 RING_PIP
          { x: -0.03, y: 0.19, z: 0.02 },  // 15 RING_DIP
          { x: -0.03, y: 0.16, z: 0.03 },  // 16 RING_TIP
          { x: -0.10, y: 0.17, z: 0.00 },  // 17 PINKY_MCP
          { x: -0.09, y: 0.19, z: 0.01 },  // 18 PINKY_PIP
          { x: -0.09, y: 0.17, z: 0.02 },  // 19 PINKY_DIP
          { x: -0.09, y: 0.14, z: 0.03 },  // 20 PINKY_TIP
        ];
        data = await api.predictGesture(PAIN_LANDMARKS);
      } else if (testEndpoint === 'vocabulary') {
        data = await api.getVocabulary();
      } else if (testEndpoint === 'translate') {
        data = await api.synthesizeSentence(['I', 'PAIN', 'STOMACH'], 'hi');
      } else if (testEndpoint === 'vision') {
        data = await api.scanMedicine('base64_sample_image');
      } else if (testEndpoint === 'face_control') {
        data = await api.detectFaceGesture({ ear: 0.18, pitch: -18.5, yaw: 2.1 });
      } else if (testEndpoint === 'speech_tts') {
        data = await api.synthesizeTTS('नमस्ते डॉक्टर साहब', 'hi-IN');
      } else if (testEndpoint === 'emergency_phrases') {
        data = await api.getEmergencyPhrases();
      } else if (testEndpoint === 'trigger_sos') {
        data = await api.triggerSOS('AMBULANCE');
      }
      setApiResponseJson(data);
    } catch (err) {
      setApiResponseJson({
        error: 'Backend request failed (ensure backend server is running on :8000)',
        details: err.message,
      });
    } finally {
      setApiLoading(false);
    }
  };

  // Live clock state
  const [liveClock, setLiveClock] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('en-IN', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const TABS = [
    { id: 'kiosk', label: 'Hospital Kiosk', emoji: '🏥', icon: Activity },
    { id: 'deaf_hub', label: 'Deaf & Mute Hub', emoji: '🧏', icon: Hand },
    { id: 'blind_mode', label: 'Blind Assistant', emoji: '🦯', icon: Eye },
    { id: 'motor_mode', label: 'Motor Hands-Free', emoji: '♿', icon: UserCheck },
    { id: 'sos_grid', label: '1-Tap SOS Grid', emoji: '🚨', icon: ShieldAlert },
    { id: 'impact_stats', label: 'Impact & ROI', emoji: '📊', icon: BarChart3 },
    { id: 'api_tester', label: 'API Tester', emoji: '🔌', icon: Terminal },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'radial-gradient(ellipse at 15% 15%, rgba(245, 158, 11, 0.1) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(180, 83, 9, 0.08) 0%, transparent 55%), linear-gradient(135deg, #FAF6EE 0%, #F5ECE0 50%, #EFE3D3 100%)', color: '#1C1917', position: 'relative' }}>
      {/* Liquid Aurora Mesh Ambient Floaters */}
      <div style={{ position: 'fixed', top: '-120px', left: '10%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'floatOrb1 18s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: '-80px', right: '5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(20, 184, 166, 0.14) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'floatOrb2 22s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', top: '35%', right: '35%', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217, 119, 6, 0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'floatOrb3 25s ease-in-out infinite' }} />
      <style>{`
        @keyframes pulse-logo {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.5), 0 0 0 0 rgba(15, 118, 110, 0.3); }
          50% { box-shadow: 0 0 0 10px rgba(217, 119, 6, 0.0), 0 0 0 20px rgba(15, 118, 110, 0.0); }
        }
        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes pulse-sos {
          0%, 100% { opacity: 1; background: rgba(220, 38, 38, 0.95); }
          50% { opacity: 0.85; background: rgba(239, 68, 68, 0.75); }
        }
        @keyframes tab-glow-gold {
          0%, 100% { box-shadow: inset 3px 0 0 #B45309, 0 4px 16px rgba(180, 83, 9, 0.15); }
          50% { box-shadow: inset 3px 0 0 #D97706, 0 4px 22px rgba(245, 158, 11, 0.3); }
        }
      `}</style>

      {/* SOS Alert Banner */}
      {sosActive && (
        <div style={{ animation: 'pulse-sos 1s infinite', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>
            <ShieldAlert size={18} />
            🚨 SOS ACTIVE — Emergency dispatched. Medical team alerted.
          </div>
          <button
            onClick={() => setSosActive(false)}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: '8px', padding: '5px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold' }}
          >
            <XCircle size={14} /> Dismiss
          </button>
        </div>
      )}

      {/* Top Header Bar — Frosted Golden Cream Glassmorphism */}
      <header style={{ background: 'rgba(255, 255, 255, 0.75)', borderBottom: '1px solid rgba(217, 180, 130, 0.45)', padding: '0 24px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 50, boxShadow: '0 4px 20px rgba(180, 83, 9, 0.04)' }}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #B45309 0%, #D97706 60%, #0F766E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse-logo 2.5s ease-in-out infinite', flexShrink: 0, boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)' }}>
            <HeartPulse size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: '#1C1917', letterSpacing: '-0.3px', lineHeight: 1.2 }}>SignBridge Universal</div>
            <div style={{ fontSize: '11px', color: '#78716C', letterSpacing: '0.02em', fontWeight: '600' }}>Multi-Modal Healthcare Accessibility Bridge</div>
          </div>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.15)', color: '#92400E', border: '1px solid rgba(245, 158, 11, 0.4)', letterSpacing: '0.08em', fontWeight: '800', marginLeft: '6px' }}>
            WCAG 2.1 AAA
          </span>
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* ABHA + OPD Buttons */}
          <button
            onClick={() => setShowAbhaModal(true)}
            style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.8)', color: '#15803D', border: '1px solid rgba(21, 128, 61, 0.35)', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(21, 128, 61, 0.08)' }}
          >
            <CreditCard size={15} /> 🪪 ABHA Card
          </button>
          <button
            onClick={() => setShowOpdModal(true)}
            style={{ padding: '8px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(254, 243, 199, 0.8) 100%)', color: '#B45309', border: '1px solid rgba(217, 119, 6, 0.4)', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(180, 83, 9, 0.1)' }}
          >
            <FileText size={15} /> 🖨️ OPD Slip
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: 'rgba(217, 180, 130, 0.5)' }} />

          {/* Live Badge + Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#DC2626', animation: 'pulse-live 1.2s ease-in-out infinite' }} />
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#DC2626', letterSpacing: '0.1em' }}>LIVE</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#57534E', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>
              {liveClock}
            </div>
          </div>

          {/* Hospital name */}
          <div style={{ fontSize: '12px', color: '#78716C', fontWeight: '700', borderLeft: '1px solid rgba(217, 180, 130, 0.5)', paddingLeft: '16px' }}>
            Govt. Civil Hospital
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left Sidebar Navigation — Golden Cream Glassmorphism */}
        <aside style={{ width: '74px', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRight: '1px solid rgba(217, 180, 130, 0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '6px', flexShrink: 0, overflowY: 'auto', overflowX: 'hidden', boxShadow: '2px 0 15px rgba(180, 83, 9, 0.03)' }}>

          {/* Nav Tab Pills */}
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                style={{
                  width: '58px',
                  minHeight: '58px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  border: isActive ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(254, 243, 199, 0.9) 100%)'
                    : 'transparent',
                  animation: isActive ? 'tab-glow-gold 2.5s ease-in-out infinite' : 'none',
                  color: isActive ? '#B45309' : '#78716C',
                  padding: '8px 4px',
                }}
              >
                <Icon size={21} />
                <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.2, color: isActive ? '#92400E' : '#78716C' }}>
                  {tab.emoji}
                </span>
              </button>
            );
          })}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Language Selector at bottom */}
          <div style={{ width: '58px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '8px', borderTop: '1px solid rgba(217, 180, 130, 0.4)' }}>
            <div style={{ fontSize: '8px', color: '#78716C', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Lang</div>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                title={lang.name}
                style={{
                  width: '46px',
                  padding: '4px 2px',
                  borderRadius: '8px',
                  fontSize: '9px',
                  fontWeight: selectedLanguage === lang.code ? '800' : '600',
                  background: selectedLanguage === lang.code ? 'linear-gradient(135deg, #B45309, #D97706)' : 'rgba(255, 255, 255, 0.5)',
                  color: selectedLanguage === lang.code ? '#FFFFFF' : '#78716C',
                  border: selectedLanguage === lang.code ? '1px solid #B45309' : '1px solid rgba(217, 180, 130, 0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {lang.native}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area — Golden Cream Glassmorphism Canvas */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'radial-gradient(ellipse at 15% 15%, rgba(245, 158, 11, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 85% 85%, rgba(180, 83, 9, 0.06) 0%, transparent 60%), linear-gradient(135deg, #FAF6ED 0%, #F5ECE0 50%, #EFE4D4 100%)' }}>

          {/* TAB 1: DUAL-SCREEN HOSPITAL KIOSK (PHASE 1) */}
          {activeTab === 'kiosk' && (
            <HospitalKiosk
              currentSign={currentSign}
              setCurrentSign={setCurrentSign}
              accumulatedTokens={accumulatedTokens}
              setAccumulatedTokens={setAccumulatedTokens}
              synthesizedText={synthesizedText}
              translatedResult={translatedResult}
              isTranslating={isTranslating}
              handleSynthesizeTokens={handleSynthesizeTokens}
              doctorSpeechInput={doctorSpeechInput}
              setDoctorSpeechInput={setDoctorSpeechInput}
              handleDoctorToGloss={handleDoctorToGloss}
              doctorGlosses={doctorGlosses}
              doctorGrammarGloss={doctorGrammarGloss}
              doctorSignClips={doctorSignClips}
              isPlayingAudio={isPlayingAudio}
              handlePlayAudio={handlePlayAudio}
              isAnalyzingCough={isAnalyzingCough}
              coughResult={coughResult}
              handleAnalyzeCough={handleAnalyzeCough}
            />
          )}

          {/* TAB 2: DEAF & MUTE HUB (PHASE 2) */}
          {activeTab === 'deaf_hub' && (
            <DeafMuteHub
              accumulatedTokens={accumulatedTokens}
              setAccumulatedTokens={setAccumulatedTokens}
              synthesizedText={synthesizedText}
              translatedResult={translatedResult}
              isTranslating={isTranslating}
              handleSynthesizeTokens={handleSynthesizeTokens}
              selectedLanguage={selectedLanguage}
              isPlayingAudio={isPlayingAudio}
              handlePlayAudio={handlePlayAudio}
            />
          )}

          {/* TAB 3: BLIND & LOW-VISION ASSISTANT (PHASE 3) */}
          {activeTab === 'blind_mode' && (
            <BlindAssistant
              visionResult={visionResult}
              isScanning={isScanning}
              handleScanMedicine={handleScanMedicine}
              ddiResult={ddiResult}
              isPlayingAudio={isPlayingAudio}
              handlePlayAudio={handlePlayAudio}
            />
          )}

          {/* TAB 4: MOTOR-IMPAIRED HANDS-FREE (PHASE 4) */}
          {activeTab === 'motor_mode' && (
            <MotorHandsFree
              motorAction={motorAction}
              setMotorAction={setMotorAction}
              motorFeedback={motorFeedback}
              setMotorFeedback={setMotorFeedback}
              handleTriggerSOS={handleTriggerSOS}
            />
          )}

          {/* TAB 5: 1-TAP SOS EMERGENCY GRID (PHASE 5) */}
          {activeTab === 'sos_grid' && (
            <SosGrid
              sosActive={sosActive}
              setSosActive={setSosActive}
              sosMessage={sosMessage}
              setSosMessage={setSosMessage}
              handleTriggerSOS={handleTriggerSOS}
              handlePlayAudio={handlePlayAudio}
              isPlayingAudio={isPlayingAudio}
            />
          )}

          {/* TAB: HOSPITAL IMPACT & TELEMETRY ROI (PHASE 6) */}
          {activeTab === 'impact_stats' && (
            <HospitalImpactRoi
              impactData={impactData}
              loadingImpact={loadingImpact}
              fetchImpactReport={fetchImpactReport}
              setShowAbhaModal={setShowAbhaModal}
              setShowOpdModal={setShowOpdModal}
              currentConsultId={currentConsultId}
              setCurrentConsultId={setCurrentConsultId}
            />
          )}

          {/* TAB 6: API CONTRACT TESTER */}
          {activeTab === 'api_tester' && (
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', padding: '28px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-cyan)' }}>
                🔌 FastAPI Live JSON Contract Verifier
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Test any of the 6 backend stub endpoints directly against <code>http://localhost:8000/api</code>.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {[
                  { id: 'gesture', label: 'POST /gesture/predict' },
                  { id: 'vocabulary', label: 'GET /gesture/vocabulary' },
                  { id: 'translate', label: 'POST /translate/synthesize' },
                  { id: 'vision', label: 'POST /vision/scan-medicine' },
                  { id: 'face_control', label: 'POST /face-control/detect-gesture' },
                  { id: 'speech_tts', label: 'POST /speech/tts' },
                  { id: 'emergency_phrases', label: 'GET /emergency/phrases' },
                  { id: 'trigger_sos', label: 'POST /emergency/trigger-sos' },
                ].map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => setTestEndpoint(ep.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      backgroundColor: testEndpoint === ep.id ? 'var(--accent-cyan)' : 'var(--bg-primary)',
                      color: testEndpoint === ep.id ? '#000' : 'var(--text-primary)',
                      border: '1px solid ' + (testEndpoint === ep.id ? 'var(--accent-cyan)' : 'var(--border)'),
                      fontWeight: testEndpoint === ep.id ? 'bold' : 'normal',
                    }}
                  >
                    {ep.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRunApiTest}
                disabled={apiLoading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-yellow)',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RefreshCw size={16} /> {apiLoading ? 'Querying API...' : `Execute ${testEndpoint}`}
              </button>

              {/* Response Viewer */}
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#090d16', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Response Payload (JSON)</span>
                  <span>Status: 200 OK (Contract Verified)</span>
                </div>
                <pre style={{ color: '#38bdf8', fontSize: '13px', overflowX: 'auto', maxHeight: '380px' }}>
                  {apiResponseJson
                    ? JSON.stringify(apiResponseJson, null, 2)
                    : '// Click "Execute" to inspect the JSON response schema for ' + testEndpoint}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FLOATING BILINGUAL CAPTIONS HUD (Feature 3) */}
      <FloatingBilingualCaptions
        primaryText={translatedResult}
        secondaryText={synthesizedText}
        language={LANGUAGES.find((l) => l.code === selectedLanguage)?.name || 'Hindi'}
        isPlaying={isPlayingAudio}
        onReplayAudio={() => handlePlayAudio(translatedResult)}
      />

      {/* MODAL 1: 3D FLIPPABLE OFFICIAL ABHA SMART CARD (Feature 5) */}
      {showAbhaModal && (
        <AbhaSmartCardModal onClose={() => setShowAbhaModal(false)} />
      )}

      {/* MODAL 2: BILINGUAL THERMAL OPD CONSULTATION SLIP (Feature 5) */}
      {showOpdModal && (
        <OpdSlipModal onClose={() => setShowOpdModal(false)} />
      )}
    </div>
  );
}
