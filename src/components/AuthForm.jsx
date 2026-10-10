import React, { useState, useContext } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Zap, Shield, Brain, Activity } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import API_BASE from '../config';

/* ── NeuroMed Logo ── */
const NeuroMedLogo = ({ size = 28 }) => (
  <img src="/neuromed_logo.png" alt="NeuroMed Logo" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
);

/* ── Floating Feature Badges for Left Panel ── */
const FloatingBadge = ({ children, style }) => (
  <div style={{
    background: '#fff', borderRadius: 16, padding: '12px 18px',
    border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem',
    fontWeight: 700, color: '#111827', ...style
  }}>{children}</div>
);

/* ── SVG Bitmoji — Doctor at Computer ── */
const DoctorBitmojiSVG = () => (
  <svg width="200" height="220" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Desk */}
    <rect x="20" y="160" width="160" height="12" rx="6" fill="#E2E8F0"/>
    <rect x="50" y="172" width="10" height="35" rx="3" fill="#CBD5E1"/>
    <rect x="140" y="172" width="10" height="35" rx="3" fill="#CBD5E1"/>
    {/* Computer Monitor */}
    <rect x="55" y="105" width="90" height="55" rx="8" fill="#1E40AF"/>
    <rect x="60" y="110" width="80" height="42" rx="5" fill="#DBEAFE"/>
    {/* Screen content lines */}
    <rect x="68" y="118" width="30" height="4" rx="2" fill="#93C5FD"/>
    <rect x="68" y="126" width="50" height="3" rx="1.5" fill="#BFDBFE"/>
    <rect x="68" y="133" width="40" height="3" rx="1.5" fill="#BFDBFE"/>
    <rect x="68" y="140" width="55" height="3" rx="1.5" fill="#BFDBFE"/>
    {/* Brain on screen */}
    <circle cx="120" cy="128" r="12" fill="#1E40AF" fillOpacity="0.15"/>
    <circle cx="120" cy="128" r="6" fill="#1E40AF" fillOpacity="0.3"/>
    {/* Monitor stand */}
    <rect x="93" y="157" width="14" height="6" rx="2" fill="#94A3B8"/>
    {/* Body / White coat */}
    <rect x="55" y="66" width="50" height="95" rx="16" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5"/>
    {/* Coat overlap */}
    <path d="M80 78 L66 66 L66 140" stroke="#CBD5E1" strokeWidth="1.2" fill="none"/>
    <path d="M80 78 L94 66 L94 140" stroke="#CBD5E1" strokeWidth="1.2" fill="none"/>
    {/* Stethoscope */}
    <path d="M60 85 C54 90 52 100 56 108" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="56" cy="110" r="3.5" fill="#0D9488" opacity="0.8"/>
    {/* Neck */}
    <rect x="73" y="48" width="14" height="20" rx="5" fill="#D4956A"/>
    {/* Head */}
    <ellipse cx="80" cy="32" rx="22" ry="24" fill="#D4956A"/>
    {/* Hair */}
    <path d="M58 28 C58 10 68 4 80 4 C92 4 102 10 102 28 C102 22 99 16 93 14 C87 12 73 12 67 14 C61 16 58 22 58 28Z" fill="#1C1917"/>
    {/* Eyes */}
    <ellipse cx="72" cy="32" rx="3" ry="3.5" fill="#fff"/>
    <ellipse cx="88" cy="32" rx="3" ry="3.5" fill="#fff"/>
    <circle cx="73" cy="32" r="1.8" fill="#1C1917"/>
    <circle cx="89" cy="32" r="1.8" fill="#1C1917"/>
    <circle cx="74" cy="31" r="0.6" fill="#fff"/>
    <circle cx="90" cy="31" r="0.6" fill="#fff"/>
    {/* Smile */}
    <path d="M73 40 C76 44 84 44 87 40" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Arm on keyboard */}
    <path d="M105 100 C115 95 125 100 130 110" stroke="#D4956A" strokeWidth="5" strokeLinecap="round" fill="none"/>
    {/* Keyboard */}
    <rect x="115" y="148" width="45" height="14" rx="4" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1"/>
    <rect x="120" y="152" width="6" height="4" rx="1" fill="#F1F5F9"/>
    <rect x="129" y="152" width="6" height="4" rx="1" fill="#F1F5F9"/>
    <rect x="138" y="152" width="6" height="4" rx="1" fill="#F1F5F9"/>
    <rect x="147" y="152" width="6" height="4" rx="1" fill="#F1F5F9"/>
    {/* Coffee mug */}
    <rect x="26" y="142" width="16" height="18" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5"/>
    <path d="M42 148 C48 148 48 156 42 156" stroke="#CBD5E1" strokeWidth="1.5" fill="none"/>
    <ellipse cx="34" cy="143" rx="5" ry="1.5" fill="#94A3B8" fillOpacity="0.3"/>
  </svg>
);

/* ── Trust Feature Items for Left Panel ── */
const TrustItem = ({ Icon, iconBg, iconColor, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 42, height: 42, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={iconColor} />
    </div>
    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>{text}</span>
  </div>
);

const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginDemo } = useContext(AuthContext);

  const handleTabSwitch = (loginMode) => {
    setIsLogin(loginMode);
    setError(null); setSuccess(null);
    setFullName(''); setEmail(''); setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setIsLoading(true);
    try {
      if (isLogin) {
        const response = await fetch(`${API_BASE}/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        let data;
        try { data = await response.json(); } catch(e) { throw new Error('Server returned an empty response. Is the backend running?'); }
        if (!response.ok) throw new Error(data.detail || 'Invalid email or password.');
        login(data.access_token);
        if (onLogin) onLogin();
      } else {
        const response = await fetch(`${API_BASE}/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password })
        });
        let data;
        try { data = await response.json(); } catch(e) { throw new Error('Server returned an empty response. Is the backend running?'); }
        if (!response.ok) throw new Error(data.detail || 'Registration failed. Please try again.');
        const loginRes = await fetch(`${API_BASE}/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) { login(loginData.access_token); if (onLogin) onLogin(); }
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE}/google-login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      let data;
      try { data = await response.json(); } catch(e) { throw new Error('Server returned an empty response. Is the backend running?'); }
      if (!response.ok) throw new Error(data.detail || 'Google sign-in failed.');
      login(data.access_token);
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  /* ── Input helper ── */
  const inputStyle = {
    width: '100%', padding: '13px 13px 13px 44px', boxSizing: 'border-box',
    background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 14,
    color: '#111827', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s',
    fontFamily: "'Inter', sans-serif"
  };
  const handleFocus = (e) => { e.target.style.background = '#fff'; e.target.style.borderColor = '#1E40AF'; e.target.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.08)'; };
  const handleBlur = (e) => { e.target.style.background = '#F9FAFB'; e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100%',
      backgroundColor: '#FAFAFA',
      backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.10) 1.2px, transparent 1.2px)',
      backgroundSize: '14px 14px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* ═══════════════════════════════════
          BACKGROUND HERO THEME
      ═══════════════════════════════════ */}
      {/* Floating Brain */}
      <img src="/network_brain.webp" alt="" style={{
        position: 'absolute',
        left: '25%', top: '10%',
        width: 600, opacity: 0.15,
        animation: 'heroFloat 8s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0
      }} />
      
      {/* Floating Doctor (Left of the card) */}
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

          {/* Trust Features (Horizontal) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <TrustItem Icon={Brain} iconBg="rgba(30,64,175,0.08)" iconColor="#1E40AF" text="98.6% tumor detection accuracy" />
            <TrustItem Icon={Shield} iconBg="rgba(16,185,129,0.08)" iconColor="#10B981" text="HIPAA-compliant data security" />
            <TrustItem Icon={Activity} iconBg="rgba(124,58,237,0.08)" iconColor="#7C3AED" text="Explainable AI with Grad-CAM" />
            <TrustItem Icon={Zap} iconBg="rgba(245,158,11,0.08)" iconColor="#F59E0B" text="Real-Time AI diagnostics (2.4s/scan)" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          RIGHT PANEL — Auth Form Modal
      ═══════════════════════════════════ */}
      <div className="auth-right-panel" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 10
      }}>
        {/* Floating White Card */}
        <div style={{ 
          width: '100%', maxWidth: 440, background: '#FFFFFF', 
          borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          
          <div className="auth-card-inner">
            {/* Mobile Logo */}
            <div className="auth-mobile-logo" style={{ display: 'none', justifyContent: 'center', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <NeuroMedLogo size={32} />
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>NeuroMed</span>
              </div>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 14, padding: 4, marginBottom: 32 }}>
              {['Sign In', 'Register'].map((label, i) => {
                const active = i === 0 ? isLogin : !isLogin;
                return (
                  <button key={label} onClick={() => handleTabSwitch(i === 0)}
                    style={{
                      flex: 1, padding: '11px', border: 'none', borderRadius: 11,
                      background: active ? '#fff' : 'transparent',
                      color: active ? '#111827' : '#9CA3AF',
                      fontWeight: active ? 700 : 500, fontSize: '0.9rem',
                      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer', transition: 'all 0.2s',
                      fontFamily: "'Inter', sans-serif"
                    }}>{label}</button>
                );
              })}
            </div>

            {/* Header */}
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', marginBottom: 8 }}>
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
                {isLogin ? 'Sign in to access your clinical dashboard.' : 'Register to start using NeuroMed.'}
              </p>
            </div>

            {/* Error / Success */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, marginBottom: 20, fontSize: '0.85rem', color: '#DC2626', fontWeight: 600 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, marginBottom: 20, fontSize: '0.85rem', color: '#16A34A', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={17} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="Dr. John Doe" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="name@hospital.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: 44 }} onFocus={handleFocus} onBlur={handleBlur} />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {isLogin && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1E40AF', cursor: 'pointer' }}>Forgot Password?</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={isLoading}
                style={{
                  width: '100%', padding: '14px', border: 'none', borderRadius: 14,
                  background: '#1E40AF', color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                  cursor: isLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, marginTop: 4,
                  boxShadow: '0 4px 16px rgba(30,64,175,0.30)', transition: 'all 0.2s',
                  fontFamily: "'Inter', sans-serif", opacity: isLoading ? 0.7 : 1
                }}>
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>

            {/* Google */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed.')}
                useOneTap theme="outline" size="large" shape="pill"
              />
            </div>

            {/* Demo mode */}
            {isLogin && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <button onClick={loginDemo}
                  style={{ background: 'none', border: 'none', color: '#475569', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontFamily: "'Inter', sans-serif" }}>
                  Access Demo Mode (No Login Required)
                </button>
              </div>
            )}
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
          padding: 36px 40px 20px 40px;
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
            padding: 28px 24px 20px 24px;
          }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthForm;
