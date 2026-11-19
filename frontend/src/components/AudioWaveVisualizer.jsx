import React from 'react';
import { Mic, Volume2 } from 'lucide-react';

/**
 * AudioWaveVisualizer
 * Kinetic Equalizer Soundwave Visualizer for Live Speech & Audio Synthesis
 */
export default function AudioWaveVisualizer({
  isActive = false,
  label = 'Acoustic Channel Active',
  mode = 'input', // 'input' (mic) | 'output' (speaker)
  barCount = 18,
}) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 14px',
        borderRadius: '999px',
        background: isActive ? 'rgba(217, 119, 6, 0.12)' : 'rgba(255, 255, 255, 0.75)',
        border: isActive ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid rgba(217, 180, 130, 0.4)',
        boxShadow: isActive ? '0 4px 12px rgba(180, 83, 9, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
        transition: 'all 0.25s ease',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: isActive ? 'linear-gradient(135deg, #B45309 0%, #D97706 100%)' : 'rgba(217, 180, 130, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive ? '#FFFFFF' : '#78716C',
        }}
      >
        {mode === 'input' ? <Mic size={13} /> : <Volume2 size={13} />}
      </div>

      <span
        style={{
          fontSize: '11px',
          fontWeight: '800',
          color: isActive ? '#B45309' : '#78716C',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>

      {/* Kinetic Animated Bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '20px' }}>
        {bars.map((idx) => {
          const animationDelay = `${(idx * 0.08).toFixed(2)}s`;
          const animClass = `waveBar${(idx % 5) + 1}`;
          return (
            <div
              key={idx}
              style={{
                width: '3px',
                height: isActive ? '16px' : '4px',
                borderRadius: '2px',
                background: isActive
                  ? 'linear-gradient(180deg, #D97706 0%, #0F766E 100%)'
                  : 'rgba(217, 180, 130, 0.6)',
                animation: isActive ? `${animClass} 0.7s infinite ease-in-out` : 'none',
                animationDelay,
                transition: 'height 0.2s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
