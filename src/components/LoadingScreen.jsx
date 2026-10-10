import React, { useEffect, useState } from 'react';

const NeuroMedLogo = ({ size = 48, glow = false }) => (
  <img src="/neuromed_logo.png" alt="NeuroMed Logo" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, filter: glow ? 'drop-shadow(0 0 12px rgba(255,255,255,0.25))' : 'none' }} />
);

const LoadingScreen = ({ message = 'Loading NeuroMed' }) => {
  const [dots, setDots] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(d => (d + 1) % 4);
    }, 500);

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 94) return 94;
        return p + Math.random() * 15;
      });
    }, 200);

    return () => {
      clearInterval(dotInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const dotStr = '.'.repeat(dots);

  return (
    <div
      role="status"
      aria-label="Loading NeuroMed"
      style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(160deg, #060D1B 0%, #0C1628 50%, #060D1B 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 99999,
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,64,175,0.08) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        animation: 'pulse-glow 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)',
        top: '45%', left: '48%', transform: 'translate(-50%,-50%)',
        animation: 'pulse-glow 2s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />

      {/* Logo + spinning rings */}
      <div style={{ position: 'relative', marginBottom: 28 }}>
        {/* Outer ring */}
        <div style={{
          width: 110, height: 110, borderRadius: '50%',
          border: '1.5px solid transparent',
          borderTopColor: '#1E40AF',
          borderRightColor: 'rgba(30,64,175,0.2)',
          animation: 'spin 1.5s linear infinite',
          position: 'absolute', top: -10, left: -10,
        }} />
        {/* Inner ring */}
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          border: '1px solid transparent',
          borderBottomColor: '#0D9488',
          borderLeftColor: 'rgba(13,148,136,0.2)',
          animation: 'spin 2s linear infinite reverse',
          position: 'absolute', top: -3, left: -3,
        }} />
        {/* Center */}
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(12,22,40,0.95) 0%, rgba(17,30,49,0.98) 100%)',
          border: '1px solid rgba(30,64,175,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(30,64,175,0.2)',
        }}>
          <NeuroMedLogo size={48} glow={true} />
        </div>
      </div>

      {/* Brand name */}
      <h1 style={{
        fontSize: '2rem', fontWeight: 800, letterSpacing: '3px',
        color: '#F1F5F9', margin: '0 0 4px 0',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        NEUROMED
      </h1>
      <p style={{
        color: '#475569', fontSize: '0.72rem',
        letterSpacing: '3px', margin: '0 0 36px 0',
        textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        AI Diagnostic Platform
      </p>

      {/* Progress Bar */}
      <div style={{ width: 200, marginBottom: 14 }}>
        <div style={{
          width: '100%', height: 3,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(progress, 100)}%`,
            background: 'linear-gradient(90deg, #1E40AF, #0D9488)',
            borderRadius: 999,
            transition: 'width 0.2s ease',
            boxShadow: '0 0 10px rgba(30,64,175,0.5)',
          }} />
        </div>
      </div>

      {/* Status */}
      <p style={{
        color: '#334155', fontSize: '0.78rem',
        fontFamily: 'ui-monospace, monospace',
        letterSpacing: '0.5px', minWidth: 160, textAlign: 'center',
      }}>
        {message}{dotStr}
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: translate(-50%,-50%) scale(1); }
          50%       { opacity: 1;   transform: translate(-50%,-50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
