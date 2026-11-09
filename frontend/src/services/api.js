import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const api = {
  // 1. Gesture Classification
  predictGesture: async (landmarks, handedness = 'Right') => {
    const response = await client.post('/gesture/predict', {
      landmarks,
      handedness,
      timestamp_ms: Date.now(),
    });
    return response.data;
  },

  getVocabulary: async () => {
    const response = await client.get('/gesture/vocabulary');
    return response.data;
  },

  // 2. Gemini Translation & Grammar Synthesizer
  synthesizeSentence: async (tokens, targetLanguage = 'hi', medicalContext = 'emergency_room') => {
    const response = await client.post('/translate/synthesize', {
      tokens,
      target_language: targetLanguage,
      medical_context: medicalContext,
    });
    return response.data;
  },

  textToGloss: async (text, sourceLanguage = 'en') => {
    const response = await client.post('/translate/text-to-gloss', {
      text,
      source_language: sourceLanguage,
    });
    return response.data;
  },

  // 3. Vision & OCR Reader (Blind / Low-Vision)
  scanMedicine: async (imageBase64, preferredLanguage = 'en') => {
    const response = await client.post('/vision/scan-medicine', {
      image_base64: imageBase64,
      preferred_language: preferredLanguage,
    });
    return response.data;
  },

  scanSignboard: async (imageBase64, preferredLanguage = 'en') => {
    const response = await client.post('/vision/scan-signboard', {
      image_base64: imageBase64,
      preferred_language: preferredLanguage,
    });
    return response.data;
  },

  // 4. Face Mesh Motor Control
  detectFaceGesture: async (metrics) => {
    const response = await client.post('/face-control/detect-gesture', metrics);
    return response.data;
  },

  calibrateFace: async (calibrationData) => {
    const response = await client.post('/face-control/calibrate', calibrationData);
    return response.data;
  },

  // 5. Regional Speech & Sign Sequencer
  synthesizeTTS: async (text, language = 'hi-IN') => {
    const response = await client.post('/speech/tts', {
      text,
      language,
    });
    return response.data;
  },

  transcribeSTT: async (audioBase64, language = 'en-IN') => {
    const response = await client.post('/speech/stt', {
      audio_base64: audioBase64,
      language,
    });
    return response.data;
  },

  tokenizeSignSequence: async (text, language = 'en-IN') => {
    const response = await client.post('/speech/tokenize-signs', {
      text,
      language,
    });
    return response.data;
  },

  // 6. Instant 1-Tap SOS Emergency Grid
  getEmergencyPhrases: async () => {
    const response = await client.get('/emergency/phrases');
    return response.data;
  },

  triggerSOS: async (emergencyType, locationTag = 'Ward 3, Bed 14', preferredLanguage = 'hi-IN') => {
    const response = await client.post('/emergency/trigger-sos', {
      emergency_type: emergencyType,
      location_tag: locationTag,
      preferred_language: preferredLanguage,
    });
    return response.data;
  },

  // 7. Clinical Drug-Drug Interaction (DDI) Matrix & Safety Checker
  checkDDI: async (newPrescribedDrugs, currentMedications = ['Amlodipine 5mg'], patientId = 'PAT-9842') => {
    const response = await client.post('/vision/check-ddi', {
      new_prescribed_drugs: newPrescribedDrugs,
      current_medications: currentMedications,
      patient_id: patientId,
    });
    return response.data;
  },

  // 8. Emergency Severity Index (ESI Level 1-5) Clinical Triage
  evaluateTriage: async (islTokens, vitals = {}, patientId = 'PAT-9842', symptoms = '') => {
    const response = await client.post('/emergency/triage-evaluate', {
      patient_id: patientId,
      isl_tokens: islTokens,
      reported_symptoms: symptoms,
      vitals,
    });
    return response.data;
  },

  // 9. Acoustic Respiratory & Cough Biomarker AI
  analyzeCough: async (simulationPreset = 'WHEEZE_ASTHMA', audioBase64 = null, patientId = 'PAT-9842') => {
    const response = await client.post('/speech/analyze-cough', {
      simulation_preset: simulationPreset,
      audio_base64: audioBase64,
      patient_id: patientId,
    });
    return response.data;
  },

  getSignDictionary: async () => {
    const response = await client.get('/speech/sign-dictionary');
    return response.data;
  },

  // 10. Persistent Consultation & OPD Slip Generator
  createConsultation: async (consultationData) => {
    const response = await client.post('/consultation/create', consultationData);
    return response.data;
  },

  getConsultationSlip: async (consultationId) => {
    const response = await client.get(`/consultation/slip/${consultationId}`);
    return response.data;
  },

  getConsultationSlipHtmlUrl: (consultationId) => {
    return `${API_BASE_URL}/consultation/slip-html/${consultationId}`;
  },

  getABHACardHtmlUrl: (patientId = 'PAT-9842') => {
    return `${API_BASE_URL}/consultation/abha-card/${patientId}`;
  },

  // 11. ABDM National Health Authority (NHA) Milestones (M1/M2/M3)
  verifyABHA: async (abhaId = '91-4829-1039-4820', authMode = 'DEMOGRAPHIC') => {
    const response = await client.post('/consultation/abdm/v1/verify-abha', {
      abha_id: abhaId,
      auth_mode: authMode,
    });
    return response.data;
  },

  linkABDMRecord: async (consultationId, abhaId = '91-4829-1039-4820') => {
    const response = await client.post('/consultation/abdm/v2/link-hip-record', {
      consultation_id: consultationId,
      abha_id: abhaId,
    });
    return response.data;
  },

  requestABDMConsent: async (abhaId = '91-4829-1039-4820') => {
    const response = await client.post('/consultation/abdm/v3/consent-request', {
      abha_id: abhaId,
    });
    return response.data;
  },

  // 12. Offline Edge Resilience Engine
  getEdgeNetworkStatus: async () => {
    const response = await client.get('/consultation/edge/network-status');
    return response.data;
  },

  syncOfflineQueue: async () => {
    const response = await client.post('/consultation/edge/sync-offline-queue');
    return response.data;
  },

  // 13. Hospital ROI & Telemetry Impact Dashboard
  getHospitalImpactReport: async () => {
    const response = await client.get('/consultation/analytics/impact-report');
    return response.data;
  },

  // 14. 1-Tap Bilingual Audio Prescription Player
  getAudioPrescription: async (consultationId, language = 'hi') => {
    const response = await client.post(`/consultation/audio-prescription/${consultationId}`, {
      language,
    });
    return response.data;
  },
};

export default api;


