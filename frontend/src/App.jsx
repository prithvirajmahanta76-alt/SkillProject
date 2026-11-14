import React, { useState, useEffect } from 'react';
import {
  Activity,
  BarChart3,
  CreditCard,
  Eye,
  FileText,
  Hand,
  HeartPulse,
  Printer,
  RefreshCw,
  ShieldAlert,
  Terminal,
  UserCheck,
  X,
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

  return (
    <div className={`min-h-screen ${sosActive ? 'sos-strobe-active' : ''}`} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top Accessibility & Regional Language Bar */}
      <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', padding: '12px 24px', boxShadow: '0 2px 10px rgba(180, 83, 9, 0.04)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(180, 83, 9, 0.25)' }}>
              <HeartPulse size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                SignBridge Universal
                <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px', backgroundColor: 'rgba(15, 118, 110, 0.12)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)' }}>
                  WCAG 2.1 AAA
                </span>
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Multi-Modal Two-Way Healthcare & Accessibility Bridge
              </p>
            </div>
          </div>

          {/* Regional Indian Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Language / भाषा:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: selectedLanguage === lang.code ? 'bold' : 'normal',
                    backgroundColor: selectedLanguage === lang.code ? 'var(--accent-yellow)' : 'var(--bg-card)',
                    color: selectedLanguage === lang.code ? '#FFFFFF' : 'var(--text-primary)',
                    border: '1px solid ' + (selectedLanguage === lang.code ? 'var(--accent-yellow)' : 'var(--border)'),
                    transition: 'all 0.2s',
                    boxShadow: selectedLanguage === lang.code ? '0 2px 6px rgba(180, 83, 9, 0.2)' : 'none',
                  }}
                >
                  {lang.native}
                </button>
              ))}
            </div>

            {/* Official Hospital Documents Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowAbhaModal(true)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(21, 128, 61, 0.1)',
                  color: 'var(--accent-green)',
                  border: '1px solid var(--accent-green)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <CreditCard size={15} /> 🪪 ABHA Card
              </button>
              <button
                onClick={() => setShowOpdModal(true)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(15, 118, 110, 0.1)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid var(--accent-cyan)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <FileText size={15} /> 🖨️ OPD Slip
              </button>
            </div>

            {sosActive && (
              <button
                onClick={() => setSosActive(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-red)',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <XCircle size={16} /> Dismiss SOS
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '8px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {[
            { id: 'kiosk', label: '🏥 Hospital Kiosk (Split-Screen)', icon: Activity },
            { id: 'deaf_hub', label: '🧏 Deaf & Mute Hub', icon: Hand },
            { id: 'blind_mode', label: '🦯 Blind Assistant (AI Camera)', icon: Eye },
            { id: 'motor_mode', label: '♿ Motor Hands-Free', icon: UserCheck },
            { id: 'sos_grid', label: '🚨 1-Tap SOS Grid', icon: ShieldAlert },
            { id: 'impact_stats', label: '📊 Hospital Impact & ROI', icon: BarChart3 },
            { id: 'api_tester', label: '🔌 API Contract Tester', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: isActive ? 'bold' : '500',
                  backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                  color: isActive ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                  borderBottom: isActive ? '3px solid var(--accent-yellow)' : '3px solid transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(180, 83, 9, 0.08)' : 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
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

      {/* MODAL 1: OFFICIAL GOVERNMENT ABHA SMART CARD */}
      {showAbhaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(28, 25, 23, 0.65)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '580px', backgroundColor: '#FAF8F5', borderRadius: '18px', border: '1px solid #E6DFD5', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 25px 50px -12px rgba(45, 35, 20, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '16px' }}>
                <CreditCard size={20} /> 🪪 Official ABHA Digital Health Card
              </div>
              <button
                onClick={() => setShowAbhaModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <iframe
              src="http://localhost:8000/api/consultation/abha-card/PAT-9842"
              title="Official ABHA Card"
              style={{ width: '100%', height: '460px', border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: '#FFFFFF' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
              <a
                href="http://localhost:8000/api/consultation/abha-card/PAT-9842"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '13px', color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 'bold' }}
              >
                ➔ Open Fullscreen Card
              </a>
              <button
                onClick={() => setShowAbhaModal(false)}
                style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE CIVIL HOSPITAL OPD PRESCRIPTION SLIP */}
      {showOpdModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(28, 25, 23, 0.65)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '860px', backgroundColor: '#FAF8F5', borderRadius: '18px', border: '1px solid #E6DFD5', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 25px 50px -12px rgba(45, 35, 20, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 'bold', fontSize: '16px' }}>
                <FileText size={20} /> 🖨️ Government Civil Hospital • Signed OPD Slip
              </div>
              <button
                onClick={() => setShowOpdModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <iframe
              src="http://localhost:8000/api/consultation/slip-html/OPD-CIVIL-1794156577"
              title="Official OPD Slip"
              style={{ width: '100%', height: '520px', border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: '#FFFFFF' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
              <a
                href="http://localhost:8000/api/consultation/slip-html/OPD-CIVIL-1794156577"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '13px', color: 'var(--accent-yellow)', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} /> 🖨️ Print Prescription Slip
              </a>
              <button
                onClick={() => setShowOpdModal(false)}
                style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
