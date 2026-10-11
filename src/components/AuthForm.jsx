import React, { useContext } from 'react';
import { SignIn } from '@clerk/react';
import { Brain, Shield, Activity, Zap } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

/* ── NeuroMed Logo ── */
const NeuroMedLogo = ({ size = 28 }) => (
  <img src="/neuromed_logo.png" alt="NeuroMed Logo" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
);

/* ── Trust Item (Left Panel) ── */
const TrustItem = ({ Icon, iconBg, iconColor, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{
      width: 40, height: 40, borderRadius: 12, background: iconBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <Icon size={20} color={iconColor} />
    </div>
    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>{text}</span>
  </div>
);

const AuthForm = ({ onLogin }) => {
  const { loginDemo } = useContext(AuthContext);

  const handleDemo = () => {
    loginDemo();
    if (onLogin) onLogin();
  };

  return (
    <div className="auth-split-wrapper" style={{
      display: 'flex', minHeight: '100vh', width: '100%',
      backgroundColor: '#F8FAFC',
      backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* ═══════════════════════════════════
          BACKGROUND HERO THEME
      ═══════════════════════════════════ */}
      <img src="/network_brain.webp" alt="" style={{
        position: 'absolute',
        left: '25%', top: '10%',
        width: 600, opacity: 0.15,
        animation: 'heroFloat 8s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0
      }} />

      <img src="/hero_doctor_exact.webp" alt="Doctor" className="auth-doctor-img" style={{
        position: 'absolute',
        bottom: 40, right: '540px',
        height: '75%', objectFit: 'contain',
        pointerEvents: 'none', zIndex: 5,
        filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))'
      }} />

      {/* ═══════════════════════════════════
          LEFT PANEL — Branding & Trust
      ═══════════════════════════════════ */}
      <div className="auth-left-panel" style={{
        flex: 1, display: 'none', flexDirection: 'column',
        justifyContent: 'flex-start', alignItems: 'flex-start',
        padding: '60px 80px', position: 'relative', zIndex: 10
      }}>
        <div style={{ maxWidth: 500, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 50 }}>
            <NeuroMedLogo size={36} />
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>NeuroMed</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', color: '#111827', marginBottom: 8 }}>
            Clinical-grade AI
          </h1>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', color: '#9CA3AF', marginBottom: 40 }}>
            for brain tumors.
          </h1>

          {/* Trust Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <TrustItem Icon={Brain} iconBg="rgba(30,64,175,0.08)" iconColor="#1E40AF" text="98.6% tumor detection accuracy" />
            <TrustItem Icon={Shield} iconBg="rgba(16,185,129,0.08)" iconColor="#10B981" text="HIPAA-compliant data security" />
            <TrustItem Icon={Activity} iconBg="rgba(124,58,237,0.08)" iconColor="#7C3AED" text="Explainable AI with Grad-CAM" />
            <TrustItem Icon={Zap} iconBg="rgba(245,158,11,0.08)" iconColor="#F59E0B" text="Real-Time AI diagnostics (2.4s/scan)" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          RIGHT PANEL — Clerk Auth Modal
      ═══════════════════════════════════ */}
      <div className="auth-right-panel" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 10
      }}>
        <div style={{
          width: '100%', maxWidth: 440, background: '#FFFFFF',
          borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          <div className="auth-card-inner">
            {/* Mobile Logo */}
            <div className="auth-mobile-logo" style={{ display: 'none', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <NeuroMedLogo size={32} />
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>NeuroMed</span>
              </div>
            </div>

            {/* Clerk Sign In / Sign Up */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <SignIn
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: { width: '100%' },
                    card: { boxShadow: 'none', border: 'none', width: '100%', padding: '0px' },
                    headerTitle: { fontSize: '1.5rem', fontWeight: 800, color: '#111827' },
                    headerSubtitle: { color: '#64748B', fontSize: '0.875rem' },
                    formButtonPrimary: {
                      backgroundColor: '#1E40AF',
                      '&:hover': { backgroundColor: '#1D4ED8' }
                    }
                  }
                }}
              />
            </div>

            {/* Demo Mode Button */}
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleDemo}
                style={{
                  background: 'none', border: 'none', color: '#475569',
                  fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                  textDecoration: 'underline', fontFamily: "'Inter', sans-serif"
                }}
              >
                Access Demo Mode (No Login Required)
              </button>
            </div>
          </div>

          {/* Footer inside card */}
          <div style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {[['🔒', 'HIPAA Compliant'], ['🧠', '98.6% Accurate'], ['⚡', 'Real-Time AI']].map(([emoji, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: '#6B7280', fontWeight: 600 }}>
                <span>{emoji}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .auth-right-panel {
          flex: 0 0 520px;
          padding: 40px;
        }
        .auth-card-inner {
          padding: 32px 32px 20px 32px;
        }
        @media (min-width: 992px) {
          .auth-left-panel { display: flex !important; }
        }
        @media (max-width: 991px) {
          .auth-mobile-logo { display: flex !important; }
          .auth-doctor-img { display: none !important; }
        }
        @media (max-width: 600px) {
          .auth-right-panel {
            flex: 1 1 100%;
            padding: 20px;
          }
          .auth-card-inner {
            padding: 24px 18px 18px 18px;
          }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthForm;
