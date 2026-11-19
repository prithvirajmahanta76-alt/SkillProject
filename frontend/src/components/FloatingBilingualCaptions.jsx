import React, { useState } from 'react';
import { Volume2, X, Globe, Sparkles } from 'lucide-react';

/**
 * FloatingBilingualCaptions
 * Floating Cinema-Style Subtitle HUD for Live Hospital Consultations
 */
export default function FloatingBilingualCaptions({
  primaryText,
  secondaryText,
  language = 'Hindi',
  isPlaying = false,
  onReplayAudio,
  onDismiss,
}) {
  const [dismissedText, setDismissedText] = useState('');

  if (!primaryText || dismissedText === primaryText) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: '92vw',
        width: '680px',
        background: 'rgba(28, 25, 23, 0.92)',
        borderRadius: '20px',
        border: '1px solid rgba(217, 180, 130, 0.5)',
        boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.5), 0 0 30px rgba(217, 119, 6, 0.25)',
        backdropFilter: 'blur(24px)',
        padding: '16px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        color: '#FFFFFF',
        animation: 'pulse-soft 4s infinite ease-in-out',
      }}
    >
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
              fontSize: '11px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: '0.04em',
            }}
          >
            <Globe size={12} /> {language.toUpperCase()} LIVE SUBTITLES
          </span>

          {isPlaying && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={12} /> Audio Streaming...
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onReplayAudio && (
            <button
              type="button"
              onClick={onReplayAudio}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FDE68A',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Volume2 size={13} /> Replay
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setDismissedText(primaryText);
              if (onDismiss) onDismiss();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Primary Subtitle Line (Large, High Contrast) */}
      <div
        style={{
          fontSize: '17px',
          fontWeight: '800',
          color: '#FEF3C7',
          lineHeight: 1.35,
          letterSpacing: '-0.01em',
        }}
      >
        &ldquo;{primaryText}&rdquo;
      </div>

      {/* Secondary English Line */}
      {secondaryText && secondaryText !== primaryText && (
        <div
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '600',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '6px',
            lineHeight: 1.3,
          }}
        >
          EN: {secondaryText}
        </div>
      )}
    </div>
  );
}
