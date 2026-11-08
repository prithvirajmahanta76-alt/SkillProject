/**
 * SignBridge Universal — Web Audio & Sound Synthesizer
 * Provides WCAG 2.1 AAA sensory audio feedback:
 * 1. Emergency Siren / Warble for 1-Tap SOS
 * 2. Gesture recognition confirmation chimes
 * 3. Text-to-Speech regional playback using browser SpeechSynthesis
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play high-urgency SOS dual-tone siren
 */
export function playEmergencySiren(durationSeconds = 3) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.3, now);

    // Warble between 800Hz and 1200Hz
    const cycles = durationSeconds * 4;
    for (let i = 0; i < cycles; i++) {
      const t = now + (i * 0.25);
      osc.frequency.setValueAtTime(i % 2 === 0 ? 960 : 720, t);
    }

    gain.gain.setValueAtTime(0.3, now + durationSeconds - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    osc.start(now);
    osc.stop(now + durationSeconds);
  } catch (err) {
    console.warn('AudioContext playback error:', err);
  }
}

/**
 * Play subtle confirmation chime on sign recognition
 */
export function playConfirmationTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}

/**
 * Speak regional medical text using browser Web Speech API
 */
export function speakText(text, langCode = 'hi-IN') {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel(); // Stop prior speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 0.95; // Slightly slower for medical clarity
  utterance.pitch = 1.0;

  // Try to find an Indian English or Hindi regional voice
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find(v => v.lang.startsWith(langCode.slice(0, 2)));
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  window.speechSynthesis.speak(utterance);
}

