import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div
        style={{
          width: '100%',
          background: 'linear-gradient(90deg, #15803D 0%, #16A34A 100%)',
          color: '#FFFFFF',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '12px',
          fontWeight: '700',
          boxShadow: '0 2px 10px rgba(22, 163, 74, 0.25)',
          zIndex: 9999,
          position: 'relative',
        }}
      >
        <CheckCircle2 size={16} />
        <span>Network Connection Restored — ABDM cloud sync resumed.</span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        background: 'linear-gradient(90deg, #B45309 0%, #D97706 100%)',
        color: '#FFFFFF',
        padding: '7px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '12px',
        fontWeight: '700',
        boxShadow: '0 2px 12px rgba(180, 83, 9, 0.3)',
        zIndex: 9999,
        position: 'relative',
      }}
    >
      <WifiOff size={16} />
      <span>
        Offline Edge Mode Active — Local ISL Landmark Classifier & Lexicon operational. Clinical records queued locally.
      </span>
    </div>
  );
}
