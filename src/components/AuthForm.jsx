import React, { useState, useContext } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Zap, Shield, Brain, Activity, KeyRound } from 'lucide-react';
import { useSignIn, useSignUp, useClerk } from '@clerk/react';
import { AuthContext } from '../context/AuthContext';

/* ── NeuroMed Logo ── */
const NeuroMedLogo = ({ size = 28 }) => (
  <img src="/neuromed_logo.png" alt="NeuroMed Logo" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
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
  
  // Email verification state for Sign Up if required by Clerk
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const clerk = useClerk();
  const { isLoaded: isSignInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  const { loginDemo } = useContext(AuthContext);

  const handleTabSwitch = (loginMode) => {
    setIsLogin(loginMode);
    setError(null);
    setSuccess(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setPendingVerification(false);
    setVerificationCode('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Wait for Clerk client if it's still initializing
      let activeSignIn = signIn || clerk.client?.signIn;
      let activeSignUp = signUp || clerk.client?.signUp;

      if (!activeSignIn && !activeSignUp) {
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 200));
          activeSignIn = signIn || clerk.client?.signIn;
          activeSignUp = signUp || clerk.client?.signUp;
          if (activeSignIn || activeSignUp) break;
        }
      }

      const activeSetActive = isLogin 
        ? (setActiveSignIn || clerk.setActive) 
        : (setActiveSignUp || clerk.setActive);

      if (isLogin) {
        if (!activeSignIn) {
          throw new Error('Authentication is still connecting. Please check your connection and try again.');
        }

        const result = await activeSignIn.create({
          identifier: email.trim(),
          password: password,
        });

        if (result.status === 'complete') {
          if (activeSetActive) {
            await activeSetActive({ session: result.createdSessionId });
          }
          if (onLogin) onLogin();
        } else {
          console.warn('Sign in required additional steps:', result.status);
          setError('Sign in requires further steps. Please check your credentials.');
          setIsLoading(false);
        }
      } else {
        if (!activeSignUp) {
          throw new Error('Authentication is still connecting. Please check your connection and try again.');
        }

        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || 'Physician';
        const lastName = nameParts.slice(1).join(' ') || undefined;

        const result = await activeSignUp.create({
          emailAddress: email.trim(),
          password: password,
          firstName: firstName,
          lastName: lastName,
        });

        if (result.status === 'complete') {
          if (activeSetActive) {
            await activeSetActive({ session: result.createdSessionId });
          }
          if (onLogin) onLogin();
        } else if (result.status === 'missing_requirements' || result.unverifiedFields?.includes('email_address')) {
          // Send verification code
          await activeSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setPendingVerification(true);
          setSuccess(`A 6-digit verification code was sent to ${email.trim()}`);
          setIsLoading(false);
        } else {
          setError('Sign up could not be completed. Please try again.');
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Authentication failed.';
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    setError(null);
    setIsLoading(true);

    try {
      const activeSignUp = signUp || clerk.client?.signUp;
      const activeSetActive = setActiveSignUp || clerk.setActive;

      if (!activeSignUp) {
        throw new Error('Verification is initializing. Please try again.');
      }

      const completeSignUp = await activeSignUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === 'complete') {
        if (activeSetActive) {
          await activeSetActive({ session: completeSignUp.createdSessionId });
        }
        if (onLogin) onLogin();
      } else {
        setError('Verification could not be completed. Please check the code.');
        setIsLoading(false);
      }
    } catch (err) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Verification failed.';
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (!clerk.loaded) {
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 200));
          if (clerk.loaded) break;
        }
      }

      const activeSignIn = signIn || clerk.client?.signIn;
      if (!activeSignIn) {
        throw new Error('Authentication service is still connecting. Please try again.');
      }

      await activeSignIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/#overview',
      });
    } catch (err) {
      console.error('Google sign-in error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Google sign-in failed.';
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your Email Address above first, then click Forgot Password.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const activeSignIn = signIn || clerk.client?.signIn;
      if (!activeSignIn) return;

      await activeSignIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setSuccess(`Password reset instructions sent to ${email.trim()}.`);
    } catch (err) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to send password reset.';
      setError(msg);
    } finally {
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
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center'
    }}>

      {/* ═══════════════════════════════════
          CENTERED SPLIT WRAPPER (Zoom Safe)
      ═══════════════════════════════════ */}
      <div className="auth-split-wrapper" style={{
        display: 'flex', width: '100%', maxWidth: 1440, minHeight: '100vh',
        position: 'relative', zIndex: 2
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 50 }}>
              <NeuroMedLogo size={36} />
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>NeuroMed</span>
            </div>

            <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', color: '#111827', marginBottom: 8 }}>
              Clinical-grade AI
            </h1>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', color: '#9CA3AF', marginBottom: 40 }}>
              for brain tumors.
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <TrustItem Icon={Brain} iconBg="rgba(30,64,175,0.08)" iconColor="#1E40AF" text="98.6% tumor detection accuracy" />
              <TrustItem Icon={Shield} iconBg="rgba(16,185,129,0.08)" iconColor="#10B981" text="HIPAA-compliant data security" />
              <TrustItem Icon={Activity} iconBg="rgba(124,58,237,0.08)" iconColor="#7C3AED" text="Explainable AI with Grad-CAM" />
              <TrustItem Icon={Zap} iconBg="rgba(245,158,11,0.08)" iconColor="#F59E0B" text="Real-Time AI diagnostics (2.4s/scan)" />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════
            RIGHT PANEL — Exact Card Design
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
                    <button key={label} type="button" onClick={() => handleTabSwitch(i === 0)}
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
                  {pendingVerification ? 'Verify Email' : (isLogin ? 'Welcome back' : 'Create account')}
                </h2>
                <p style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
                  {pendingVerification ? 'Please enter the 6-digit code sent to your email.' : (isLogin ? 'Sign in to access your clinical dashboard.' : 'Register to start using NeuroMed.')}
                </p>
              </div>

              {/* Error / Success */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, marginBottom: 20, fontSize: '0.85rem', color: '#DC2626', fontWeight: 600 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> <span>{error}</span>
                </div>
              )}
              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, marginBottom: 20, fontSize: '0.85rem', color: '#16A34A', fontWeight: 600 }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> <span>{success}</span>
                </div>
              )}

              {/* Verification Form (if pending email code) */}
              {pendingVerification ? (
                <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>Verification Code</label>
                    <div style={{ position: 'relative' }}>
                      <KeyRound size={17} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="text" required value={verificationCode} onChange={e => setVerificationCode(e.target.value)}
                        placeholder="123456" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                    </div>
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
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Verify & Continue'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 10 }}>
                    <button type="button" onClick={() => setPendingVerification(false)}
                      style={{ background: 'none', border: 'none', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                      ← Back to Sign Up
                    </button>
                  </div>
                </form>
              ) : (
                /* Normal Form */
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
                        <span onClick={handleForgotPassword} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1E40AF', cursor: 'pointer' }}>Forgot Password?</span>
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
              )}

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              </div>

              {/* Google Pill Button - Exactly like previous design */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', maxWidth: 260,
                    padding: '10px 20px', borderRadius: 999,
                    border: '1.5px solid #E5E7EB', background: '#FFFFFF',
                    cursor: isLoading ? 'wait' : 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s', fontFamily: "'Inter', sans-serif"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151' }}>Sign in with Google</span>
                </button>
              </div>

              {/* Demo mode */}
              {isLogin && !pendingVerification && (
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <button type="button" onClick={() => { loginDemo(); if (onLogin) onLogin(); }}
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
        @media (max-width: 1200px) {
          .auth-doctor-img {
            height: 65% !important;
            right: 480px !important;
          }
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
