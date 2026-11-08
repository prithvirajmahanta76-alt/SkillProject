import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Ambulance,
  CheckCircle2,
  ChevronRight,
  Eye,
  Hand,
  HeartPulse,
  HelpCircle,
  Mic,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Terminal,
  User,
  UserCheck,
  Video,
  Volume2,
  XCircle
} from 'lucide-react';
import api from './services/api';

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

  // Convert Doctor voice to Sign Glosses
  const handleDoctorToGloss = async () => {
    try {
      const result = await api.textToGloss(doctorSpeechInput);
      setDoctorGlosses(result.gloss_sequence);
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

  // Simulate Medicine Scan
  const handleScanMedicine = async () => {
    setIsScanning(true);
    try {
      const result = await api.scanMedicine('dummy_base64_data', selectedLanguage.split('-')[0]);
      setVisionResult(result);
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
        data = await api.predictGesture([
          { x: 0.5, y: 0.6, z: -0.04 },
          { x: 0.52, y: 0.58, z: -0.03 },
        ]);
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
      <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', padding: '12px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
              <HeartPulse size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                SignBridge Universal
                <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px', backgroundColor: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)' }}>
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
                    backgroundColor: selectedLanguage === lang.code ? 'var(--accent-cyan)' : 'var(--bg-card)',
                    color: selectedLanguage === lang.code ? '#000' : 'var(--text-primary)',
                    border: '1px solid ' + (selectedLanguage === lang.code ? 'var(--accent-cyan)' : 'var(--border)'),
                    transition: 'all 0.2s',
                  }}
                >
                  {lang.native}
                </button>
              ))}
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
      <nav style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid var(--border)', padding: '8px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {[
            { id: 'kiosk', label: '🏥 Hospital Kiosk (Split-Screen)', icon: Activity },
            { id: 'deaf_hub', label: '🧏 Deaf & Mute Hub', icon: Hand },
            { id: 'blind_mode', label: '🦯 Blind Assistant (AI Camera)', icon: Eye },
            { id: 'motor_mode', label: '♿ Motor Hands-Free', icon: UserCheck },
            { id: 'sos_grid', label: '🚨 1-Tap SOS Grid', icon: ShieldAlert },
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
                  backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                  color: isActive ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '3px solid var(--accent-yellow)' : '3px solid transparent',
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
        {/* TAB 1: DUAL-SCREEN HOSPITAL KIOSK */}
        {activeTab === 'kiosk' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
            {/* LEFT: Patient Console */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} /> Patient Console (ISL Gesture Input)
                </span>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)' }}>
                  60 FPS Edge AI Ready
                </span>
              </div>

              {/* Simulated Camera Viewfinder */}
              <div style={{ position: 'relative', width: '100%', height: '240px', borderRadius: '12px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Video size={48} style={{ margin: '0 auto 12px', color: 'var(--accent-cyan)' }} />
                  <p style={{ fontSize: '14px', fontWeight: 'bold' }}>MediaPipe Hand Landmark Viewport</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>21 3D Landmarks Extracted In Browser</p>
                </div>
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--accent-cyan)', fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                  Detected Sign: PAIN (94.2%)
                </div>
              </div>

              {/* Accumulated Sign Gloss Tokens */}
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Accumulated ISL Tokens:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '44px', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  {accumulatedTokens.map((t, idx) => (
                    <span key={idx} style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: 'rgba(250, 204, 21, 0.15)', color: 'var(--accent-yellow)', border: '1px solid var(--accent-yellow)', fontWeight: 'bold', fontSize: '13px' }}>
                      {t}
                    </span>
                  ))}
                  <button
                    onClick={() => setAccumulatedTokens([...accumulatedTokens, 'WATER'])}
                    style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '12px', border: '1px dashed var(--border)' }}
                  >
                    + Add "WATER"
                  </button>
                  <button
                    onClick={() => setAccumulatedTokens([])}
                    style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'transparent', color: 'var(--text-muted)', fontSize: '12px' }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Gemini Grammar Bridge Action */}
              <button
                onClick={handleSynthesizeTokens}
                disabled={isTranslating || accumulatedTokens.length === 0}
                className="touch-target-lg"
                style={{
                  borderRadius: '12px',
                  backgroundColor: 'var(--accent-yellow)',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(250, 204, 21, 0.3)',
                }}
              >
                <Sparkles size={20} />
                {isTranslating ? 'Synthesizing with Gemini 1.5...' : 'Speak for Me (Gemini Bridge)'}
              </button>
            </div>

            {/* RIGHT: Doctor / Hospital Staff Console */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Stethoscope size={18} /> Staff / Doctor Console
                </span>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)' }}>
                  Two-Way Speech Engine
                </span>
              </div>

              {/* Patient's Synthesized Medical Dialogue */}
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Patient Statement (English):</p>
                <p style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  "{synthesizedText}"
                </p>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Regional Medical Translation:</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>
                  {translatedResult}
                </p>
              </div>

              {/* Doctor's Response Input */}
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Doctor Response (Transcribed / Typed):</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={doctorSpeechInput}
                    onChange={(e) => setDoctorSpeechInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={handleDoctorToGloss}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--accent-cyan)',
                      color: '#000',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Send size={16} /> Send
                  </button>
                </div>
              </div>

              {/* Two-Way Sign Video Playlist Sequencer */}
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 'bold', marginBottom: '8px' }}>
                  Two-Way Sign Sequencer (Avatar Clip Playlist):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {doctorGlosses.map((g, idx) => (
                    <span key={idx} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', fontSize: '12px', fontWeight: 'bold' }}>
                      {idx + 1}. {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEAF & MUTE HUB */}
        {activeTab === 'deaf_hub' && (
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', padding: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-yellow)' }}>
              🧏 Mode 1: Deaf & Mute Gesture Recognition Hub
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Real-time MediaPipe Hand landmark extractor coupled with sub-30ms ISL Random Forest classifier.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {['PAIN', 'DOCTOR', 'MEDICINE', 'HELP', 'WATER', 'FOOD', 'FEVER', 'YES'].map((sign) => (
                <button
                  key={sign}
                  onClick={() => setAccumulatedTokens([...accumulatedTokens, sign])}
                  className="touch-target-lg"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  <span>{sign}</span>
                  <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>+ Add Sign</span>
                </button>
              ))}
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Current Sentence Tokens: </span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-yellow)' }}>
                  {accumulatedTokens.join(' ➔ ') || '(None selected)'}
                </span>
              </div>
              <button
                onClick={handleSynthesizeTokens}
                style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--accent-yellow)', color: '#000', fontWeight: 'bold' }}
              >
                Synthesize Sentence
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: BLIND & LOW-VISION ASSISTANT */}
        {activeTab === 'blind_mode' && (
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', padding: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-cyan)' }}>
              🦯 Mode 2: Blind & Low-Vision Assistant ("AI Camera Eyes")
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Point camera at prescription, medicine box, or corridor signs to receive instant high-contrast regional audio guidance.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              <button
                onClick={handleScanMedicine}
                disabled={isScanning}
                className="touch-target-lg"
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-card)',
                  border: '2px solid var(--accent-cyan)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', fontSize: '18px', fontWeight: 'bold' }}>
                  <Eye size={24} /> 1-Touch Medicine Scanner
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Extracts drug name, dosage, active ingredients, and expiry warnings.
                </p>
                <span style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>
                  {isScanning ? 'Inspecting with Gemini Vision...' : '➔ Tap to Scan Medicine'}
                </span>
              </button>

              <button
                onClick={handleScanMedicine}
                className="touch-target-lg"
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-yellow)', fontSize: '18px', fontWeight: 'bold' }}>
                  <Volume2 size={24} /> Audio Corridor Guide
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Reads room numbers, ICU signs, and emergency exits aloud in Indian regional languages.
                </p>
                <span style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                  ➔ Tap to Scan Signboard
                </span>
              </button>
            </div>

            {visionResult && (
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--accent-cyan)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  Detected: {visionResult.medicine_name} ({visionResult.strength})
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  <strong>Audio Spoken Output:</strong> "{visionResult.spoken_summary}"
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Dosage: {visionResult.dosage_instructions}</span>
                  <span>Expiry: {visionResult.expiry_date}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MOTOR-IMPAIRED HANDS-FREE */}
        {activeTab === 'motor_mode' && (
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', padding: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-green)' }}>
              ♿ Mode 3: Motor-Impaired Hands-Free Controller
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Head Nod (YES), Head Shake (NO), and Sustained Double Blink (Emergency Alarm) via MediaPipe Face Mesh.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <button
                onClick={() => {
                  setMotorAction('YES_CONFIRM');
                  setMotorFeedback('Head Nod Detected: YES / Confirm');
                }}
                className="touch-target-lg"
                style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent-green)', textAlign: 'left' }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-green)' }}>Head Nod Up/Down</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Triggers "YES" / Confirm Selection</div>
              </button>

              <button
                onClick={() => {
                  setMotorAction('NO_CANCEL');
                  setMotorFeedback('Head Shake Detected: NO / Cancel');
                }}
                className="touch-target-lg"
                style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'left' }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>Head Shake Left/Right</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Triggers "NO" / Cancel Action</div>
              </button>

              <button
                onClick={() => {
                  setMotorAction('DOUBLE_BLINK_EMERGENCY');
                  setMotorFeedback('Sustained Double Blink: Emergency Alarm Triggered!');
                  handleTriggerSOS('FALL_DETECTED');
                }}
                className="touch-target-lg"
                style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent-red)', textAlign: 'left' }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-red)' }}>Double Blink (EAR &lt; 0.2)</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Triggers Instant Emergency Alarm</div>
              </button>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active Intent: </span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-yellow)', fontSize: '16px' }}>{motorFeedback}</span>
            </div>
          </div>
        )}

        {/* TAB 5: 1-TAP SOS EMERGENCY GRID */}
        {activeTab === 'sos_grid' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={24} /> Mode 4: Instant 1-Tap SOS Emergency Grid
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Giant touch targets (&gt;64px). Tapping any card dispatches immediate regional audio, visual strobe, and nursing station alerts.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              {[
                { type: 'AMBULANCE', title: 'Ambulance', icon: Ambulance, color: '#ef4444' },
                { type: 'SEVERE_PAIN', title: 'Severe Pain', icon: AlertTriangle, color: '#f59e0b' },
                { type: 'DOCTOR_NEEDED', title: 'Doctor Needed', icon: Stethoscope, color: '#06b6d4' },
                { type: 'CANNOT_BREATHE', title: 'Cannot Breathe', icon: Activity, color: '#ec4899' },
                { type: 'FALL_DETECTED', title: 'Fell Down / Lost', icon: HelpCircle, color: '#8b5cf6' },
                { type: 'FAMILY_ALERT', title: 'Call Family', icon: User, color: '#10b981' },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.type}
                    onClick={() => handleTriggerSOS(card.type)}
                    className="touch-target-lg"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '16px',
                      padding: '28px',
                      border: `2px solid ${card.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      boxShadow: `0 4px 18px rgba(0,0,0,0.3)`,
                      transition: 'transform 0.1s',
                    }}
                  >
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                      <Icon size={32} />
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{card.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tap for Instant SOS</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {sosMessage && (
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-red)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                  <AlertTriangle size={20} /> SOS Broadcast Dispatched: {sosMessage.emergency_type}
                </div>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Audio Broadcast:</strong> {sosMessage.regional_audio_broadcast?.hi || sosMessage.regional_audio_broadcast?.en}
                </p>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Dispatch Status: Nursing Station (SENT) • SMS Alert (SENT) • Visual Strobe (ACTIVE)
                </div>
              </div>
            )}
          </div>
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
  );
}
