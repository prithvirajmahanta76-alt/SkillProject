import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, Sparkles, MessageSquare } from 'lucide-react';
import { speakText } from '../utils/audioAlert';
import api from '../services/api';

const QUICK_MEDICAL_CHIPS = [
  'Where does it hurt?',
  'Please take a seat.',
  'I am examining you now.',
  'Take this medicine after food.',
  'Please wait for the nurse.',
  'We need to do a blood test.',
];

export default function DoctorSpeechControl({ onGlossesGenerated, currentLanguage = 'hi-IN' }) {
  const [inputText, setInputText] = useState('Where does it hurt? Please take a seat.');
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setRecognitionSupported(true);
    }
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = currentLanguage;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendToSignSequencer(transcript);
      };

      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition error:', err);
      setIsListening(false);
    }
  };

  const handleSendToSignSequencer = async (textToSend = inputText) => {
    if (!textToSend.trim()) return;
    setIsProcessing(true);
    try {
      const res = await api.textToGloss(textToSend);
      if (onGlossesGenerated) {
        onGlossesGenerated(res.gloss_sequence);
      }
    } catch {
      // Fallback rule-based word extractor
      const words = textToSend
        .toUpperCase()
        .replace(/[.,?!]/g, '')
        .split(' ')
        .filter(w => w.length > 2);
      if (onGlossesGenerated) {
        onGlossesGenerated(words.length ? words : ['YOU', 'SIT', 'PLEASE']);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeakAloud = () => {
    speakText(inputText, currentLanguage);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Speech / Text Input Area */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Speak or type doctor response..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: '14px',
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSendToSignSequencer()}
        />

        {/* Microphone Push-to-Talk */}
        <button
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Start microphone speech input'}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            backgroundColor: isListening ? 'var(--accent-red)' : 'var(--bg-card)',
            color: isListening ? '#fff' : 'var(--accent-cyan)',
            border: '1px solid ' + (isListening ? 'var(--accent-red)' : 'var(--border)'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Audio Speaker Pronunciation */}
        <button
          onClick={handleSpeakAloud}
          title="Play voice pronunciation aloud"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--accent-yellow)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Volume2 size={20} />
        </button>

        {/* Send to ISL Sequencer */}
        <button
          onClick={() => handleSendToSignSequencer()}
          disabled={isProcessing}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-cyan)',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Send size={16} /> Sign Back
        </button>
      </div>

      {/* Quick Medical Reply Chips */}
      <div>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
          Quick Hospital Replies:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
          {QUICK_MEDICAL_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(chip);
                handleSendToSignSequencer(chip);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                textAlign: 'left',
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

