import api from './api';

let currentAudioInstance = null;

/**
 * Plays an audio stream from a Base64 encoded string.
 * @param {string} base64Data - Raw or data-URI base64 audio
 * @param {string} mimeType - e.g. 'audio/mp3'
 * @returns {Promise<boolean>}
 */
export const playBase64Audio = async (base64Data, mimeType = 'audio/mp3') => {
  if (!base64Data) return false;

  try {
    // Stop any existing audio currently playing
    if (currentAudioInstance) {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    }

    const cleanBase64 = base64Data.startsWith('data:')
      ? base64Data
      : `data:${mimeType};base64,${base64Data}`;

    const audio = new Audio(cleanBase64);
    currentAudioInstance = audio;

    await audio.play();
    return new Promise((resolve) => {
      audio.onended = () => {
        currentAudioInstance = null;
        resolve(true);
      };
      audio.onerror = () => {
        currentAudioInstance = null;
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('Audio playback notice:', err.message);
    return false;
  }
};

/**
 * Requests Edge-TTS from backend and plays the neural audio through device speakers.
 * @param {string} text - The clinical text to synthesize
 * @param {string} language - Regional Indian language code ('hi-IN', 'te-IN', 'or-IN', 'en-IN')
 * @returns {Promise<{ success: boolean, voiceUsed: string }>}
 */
export const speakTextAloud = async (text, language = 'hi-IN') => {
  if (!text || text.trim() === '') return { success: false, voiceUsed: null };

  try {
    const res = await api.synthesizeTTS(text, language);
    if (res && res.audio_base64) {
      await playBase64Audio(res.audio_base64, res.audio_format || 'audio/mp3');
      return { success: true, voiceUsed: res.voice_used };
    }
  } catch (err) {
    console.warn('Backend TTS offline or fallback:', err.message);
  }

  // Graceful browser Web Speech API fallback if backend TTS has no audio
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
      return { success: true, voiceUsed: 'browser_native_synth' };
    }
  } catch (synthErr) {
    console.warn('Browser SpeechSynthesis fallback unavailable:', synthErr);
  }

  return { success: false, voiceUsed: null };
};

export const stopAudioPlayback = () => {
  if (currentAudioInstance) {
    currentAudioInstance.pause();
    currentAudioInstance.currentTime = 0;
    currentAudioInstance = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export default {
  playBase64Audio,
  speakTextAloud,
  stopAudioPlayback,
};

