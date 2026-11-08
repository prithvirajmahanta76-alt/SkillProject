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
};

export default api;

