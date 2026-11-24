import React, { useState, useContext } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Zap, Shield, Brain, Activity, KeyRound, ArrowLeft } from 'lucide-react';
import { useClerk } from '@clerk/react';
import { useSignIn, useSignUp } from '@clerk/react/legacy';
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

  // Password Reset / Forgot Password state
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'code'
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    setIsResetting(false);
    setResetStep('request');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const cancelReset = () => {
    setIsResetting(false);
    setResetStep('request');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleStartForgotPassword = () => {
    setError(null);
    setSuccess(null);
    setIsResetting(true);
    if (email.trim()) {
      handleSendResetCode(email.trim());
    } else {
      setResetStep('request');
    }
  };

  const handleSendResetCode = async (targetEmail = email, isResend = false) => {
    const cleanEmail = (targetEmail || '').trim();
    if (!cleanEmail) {
      setError('Please enter your email address to receive the verification code.');
      return;
    }
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const targetSignIn = (typeof clerk.client?.signIn?.create === 'function' ? clerk.client.signIn : null)
        || (typeof signIn?.create === 'function' ? signIn : null)
        || (typeof window.Clerk?.client?.signIn?.create === 'function' ? window.Clerk.client.signIn : null)
        || clerk.client?.signIn
        || signIn;

      if (!targetSignIn) {
        throw new Error('Authentication service is still initializing. Please wait a moment.');
      }

      // Check modern future API first
      if (typeof targetSignIn?.resetPasswordEmailCode?.sendCode === 'function') {
        if (!targetSignIn.status || targetSignIn.status === 'needs_identifier') {
          await targetSignIn.create({ identifier: cleanEmail });
        }
        const { error: sendErr } = await targetSignIn.resetPasswordEmailCode.sendCode();
        if (sendErr) {
          const msg = sendErr.errors?.[0]?.longMessage || sendErr.errors?.[0]?.message || sendErr.message || 'Failed to send reset code.';
          setError(msg);
          return;
        }
        setEmail(cleanEmail);
        setIsResetting(true);
        setResetStep('code');
        setSuccess(`A 6-digit verification code has been sent to ${cleanEmail}`);
        return;
      }

      // If resending and factor is already prepared on this sign-in attempt
      if (isResend && targetSignIn.status === 'needs_first_factor' && targetSignIn.supportedFirstFactors) {
        const factor = targetSignIn.supportedFirstFactors.find(
          f => f.strategy === 'reset_password_email_code'
        );
        if (factor && typeof targetSignIn.prepareFirstFactor === 'function') {
          await targetSignIn.prepareFirstFactor({
            strategy: 'reset_password_email_code',
            emailAddressId: factor.emailAddressId,
          });
          setSuccess(`A new 6-digit verification code has been sent to ${cleanEmail}`);
          setIsResetting(true);
          setResetStep('code');
          return;
        }
      }

      await targetSignIn.create({
        strategy: 'reset_password_email_code',
        identifier: cleanEmail,
      });

      setEmail(cleanEmail);
      setIsResetting(true);
      setResetStep('code');
      setSuccess(`A 6-digit verification code has been sent to ${cleanEmail}`);
    } catch (err) {
      console.error('Password reset send code error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Failed to send reset code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanCode = resetCode.trim();
    if (!cleanCode) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    if (cleanCode.length !== 6) {
      setError('The verification code must be exactly 6 digits.');
      return;
    }
    if (!newPassword) {
      setError('Please enter your new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please verify both passwords match.');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const targetSignIn = (typeof clerk.client?.signIn?.attemptFirstFactor === 'function' ? clerk.client.signIn : null)
        || (typeof signIn?.attemptFirstFactor === 'function' ? signIn : null)
        || (typeof window.Clerk?.client?.signIn?.attemptFirstFactor === 'function' ? window.Clerk.client.signIn : null)
        || clerk.client?.signIn
        || signIn;

      const activeSetActive = clerk.setActive || setActiveSignIn || (window.Clerk?.setActive ? window.Clerk.setActive.bind(window.Clerk) : null);

      if (!targetSignIn) {
        throw new Error('Authentication service is still initializing. Please wait a moment.');
      }

      // Check modern future API first
      if (typeof targetSignIn?.resetPasswordEmailCode?.verifyCode === 'function') {
        const { error: vErr } = await targetSignIn.resetPasswordEmailCode.verifyCode({ code: cleanCode });
        if (vErr) {
          const msg = vErr.errors?.[0]?.longMessage || vErr.errors?.[0]?.message || vErr.message || 'Invalid verification code.';
          setError(msg);
          return;
        }

        const { error: pErr } = await targetSignIn.resetPasswordEmailCode.submitPassword({ password: newPassword });
        if (pErr) {
          const msg = pErr.errors?.[0]?.longMessage || pErr.errors?.[0]?.message || pErr.message || 'Failed to set password.';
          setError(msg);
          return;
        }

        setSuccess('Password reset successfully! Logging you in...');
        setTimeout(() => {
          if (onLogin) onLogin();
        }, 600);
        return;
      }

      // Classic / Legacy API with attemptFirstFactor
      if (typeof targetSignIn.attemptFirstFactor !== 'function') {
        throw new Error('Password reset function is not available on this client.');
      }

      let result;
      // 1. Attempt first factor verification
      try {
        result = await targetSignIn.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code: cleanCode,
          password: newPassword,
        });
      } catch (firstErr) {
        console.warn('Attempt with password threw error, retrying code-only verification:', firstErr);
        result = await targetSignIn.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code: cleanCode,
        });
      }

      // 2. If status is needs_new_password, call resetPassword to finalize password update!
      if (result && result.status === 'needs_new_password' && typeof targetSignIn.resetPassword === 'function') {
        result = await targetSignIn.resetPassword({
          password: newPassword,
        });
      }

      if (result && result.status === 'complete') {
        if (activeSetActive && result.createdSessionId) {
          await activeSetActive({ session: result.createdSessionId });
        }
        setSuccess('Password reset successfully! Logging you in...');
        setTimeout(() => {
          if (onLogin) onLogin();
        }, 600);
      } else {
        const status = result?.status || 'unknown';
        console.warn('Reset result incomplete status:', status, result);
        setError(`Password reset could not complete (status: ${status}). Please verify the code or try again.`);
      }
    } catch (err) {
      console.error('Reset error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Failed to reset password. Please check the code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Gracefully resolve active Clerk auth client (from hooks or window.Clerk fallback)
      let activeSignUp = signUp || window.Clerk?.client?.signUp;
      let activeSignIn = signIn || window.Clerk?.client?.signIn;
      let activeSetActive = (isLogin ? setActiveSignIn : setActiveSignUp) || 
                            (window.Clerk?.setActive ? window.Clerk.setActive.bind(window.Clerk) : null);

      if (isLogin && !activeSignIn) {
        for (let i = 0; i < 25; i++) {
          await new Promise(r => setTimeout(r, 150));
          activeSignIn = signIn || window.Clerk?.client?.signIn;
          activeSetActive = setActiveSignIn || (window.Clerk?.setActive ? window.Clerk.setActive.bind(window.Clerk) : null);
          if (activeSignIn) break;
        }
      } else if (!isLogin && !activeSignUp) {
        for (let i = 0; i < 25; i++) {
          await new Promise(r => setTimeout(r, 150));
          activeSignUp = signUp || window.Clerk?.client?.signUp;
          activeSetActive = setActiveSignUp || (window.Clerk?.setActive ? window.Clerk.setActive.bind(window.Clerk) : null);
          if (activeSignUp) break;
        }
      }

      if (isLogin) {
        if (!activeSignIn) {
          throw new Error('Authentication service is still initializing. Please wait a moment and try again.');
        }

        const result = await activeSignIn.create({
          identifier: email.trim(),
          password: password,
        });

        if (result.status === 'complete') {
          if (activeSetActive && result.createdSessionId) {
            await activeSetActive({ session: result.createdSessionId });
          }
          if (onLogin) onLogin();
        } else if (result.status === 'needs_first_factor') {
          const factorResult = await activeSignIn.attemptFirstFactor({
            strategy: 'password',
            password: password,
          });
          if (factorResult.status === 'complete') {
            if (activeSetActive && factorResult.createdSessionId) {
              await activeSetActive({ session: factorResult.createdSessionId });
            }
            if (onLogin) onLogin();
          } else {
            setError('Sign in could not be completed. Please check your credentials.');
          }
        } else {
          setError('Sign in incomplete. Please check your credentials.');
        }
      } else {
        if (!activeSignUp) {
          throw new Error('Authentication service is still initializing. Please wait a moment and try again.');
        }

        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || 'Physician';
        const lastName = nameParts.slice(1).join(' ') || '';

        const result = await activeSignUp.create({
          firstName: firstName,
          lastName: lastName || undefined,
          emailAddress: email.trim(),
          password: password,
        });

        if (result.status === 'complete') {
          if (activeSetActive && result.createdSessionId) {
            await activeSetActive({ session: result.createdSessionId });
          }
          if (onLogin) onLogin();
        } else {
          // Prepare email verification safely on created result, activeSignUp, or window.Clerk
          if (typeof result?.prepareEmailAddressVerification === 'function') {
            await result.prepareEmailAddressVerification({ strategy: 'email_code' });
          } else if (typeof activeSignUp?.prepareEmailAddressVerification === 'function') {
            await activeSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          } else if (typeof window.Clerk?.client?.signUp?.prepareEmailAddressVerification === 'function') {
            await window.Clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          }
          setPendingVerification(true);
          setSuccess(`A 6-digit verification code was sent to ${email.trim()}`);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Authentication failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    setError(null);
    setIsLoading(true);

    try {
      let activeSignUp = signUp || window.Clerk?.client?.signUp;
      let activeSetActive = setActiveSignUp || (window.Clerk?.setActive ? window.Clerk.setActive.bind(window.Clerk) : null);

      if (!activeSignUp) {
        throw new Error('Authentication service is still initializing. Please wait a moment.');
      }

      let completeSignUp;
      if (typeof window.Clerk?.client?.signUp?.attemptEmailAddressVerification === 'function') {
        completeSignUp = await window.Clerk.client.signUp.attemptEmailAddressVerification({
          code: verificationCode.trim(),
        });
      } else if (typeof activeSignUp?.attemptEmailAddressVerification === 'function') {
        completeSignUp = await activeSignUp.attemptEmailAddressVerification({
          code: verificationCode.trim(),
        });
      }

      if (completeSignUp && completeSignUp.status === 'complete') {
        if (activeSetActive && completeSignUp.createdSessionId) {
          await activeSetActive({ session: completeSignUp.createdSessionId });
        }
        if (onLogin) onLogin();
      } else {
        setError('Verification could not be completed. Please check the code.');
      }
    } catch (err) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Verification failed.';
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

            <h1 style={{
              fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.05,
              letterSpacing: '-1.5px', color: '#111827', margin: '0 0 6px 0'
            }}>
              Clinical-grade AI
            </h1>
            <h1 style={{
              fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.05,
              letterSpacing: '-1.5px', color: '#9CA3AF', margin: '0 0 36px 0'
            }}>
              for brain tumors.
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          flex: '0 0 520px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 10,
          padding: 40
        }}>
          <div style={{ 
            width: '100%', maxWidth: 440, background: '#FFFFFF', 
            borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            
            <div className="auth-card-inner" style={{ padding: '36px 40px 20px 40px' }}>
              {/* Mobile Logo */}
              <div className="auth-mobile-logo" style={{ display: 'none', justifyContent: 'center', marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <NeuroMedLogo size={32} />
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>NeuroMed</span>
                </div>
              </div>

              {/* Tab Switcher OR Reset Back Header */}
              {isResetting ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '4px 0' }}>
                  <button type="button" onClick={cancelReset}
                    style={{ background: 'none', border: 'none', color: '#1E40AF', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
                    <ArrowLeft size={16} /> Back to Sign In
                  </button>
                  <span style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>Password Recovery</span>
                </div>
              ) : (
                <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 14, padding: 4, marginBottom: 28 }}>
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
              )}

              {/* Header Title & Subtitle */}
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', marginBottom: 8 }}>
                  {isResetting ? (resetStep === 'code' ? 'Enter 6-Digit Code' : 'Forgot Password') : (pendingVerification ? 'Verify Email' : (isLogin ? 'Welcome back' : 'Create account'))}
                </h2>
                <p style={{ color: '#475569', fontSize: '0.88rem', fontWeight: 500, lineHeight: 1.5 }}>
                  {isResetting ? (
                    resetStep === 'code' ? (
                      <>Enter the <strong>6-digit code</strong> sent to <strong>{email}</strong> and set your new password.</>
                    ) : (
                      'Enter your registered email address and we will send you a 6-digit verification code.'
                    )
                  ) : pendingVerification ? (
                    'Please enter the 6-digit code sent to your email.'
                  ) : isLogin ? (
                    'Sign in to access your clinical dashboard.'
                  ) : (
                    'Register to start using NeuroMed.'
                  )}
                </p>
              </div>

              {/* Error / Success Notifications */}
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

              {/* ──────────────────────────────────────────
                  1) PASSWORD RESET FLOW
              ────────────────────────────────────────── */}
              {isResetting ? (
                resetStep === 'request' ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSendResetCode(email); }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={17} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="name@hospital.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
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
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Send 6-Digit Code'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 10 }}>
                      <button type="button" onClick={cancelReset}
                        style={{ background: 'none', border: 'none', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                        ← Cancel and Back to Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Step 2: Code + New Password */
                  <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>
                        6-Digit Verification Code
                      </label>
                      <div style={{ position: 'relative' }}>
                        <KeyRound size={17} color="#1E40AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" inputMode="numeric" maxLength={6} required value={resetCode}
                          onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          style={{ ...inputStyle, letterSpacing: '4px', fontSize: '1.1rem', fontWeight: 700, color: '#1E40AF' }}
                          onFocus={handleFocus} onBlur={handleBlur} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>New Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={17} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type={showNewPassword ? 'text' : 'password'} required minLength={8} value={newPassword}
                          onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters"
                          style={{ ...inputStyle, paddingRight: 44 }} onFocus={handleFocus} onBlur={handleBlur} />
                        <button type="button" onClick={() => setShowNewPassword(p => !p)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}>
                          {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>Confirm New Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={17} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type={showConfirmPassword ? 'text' : 'password'} required minLength={8} value={confirmNewPassword}
                          onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Re-enter new password"
                          style={{ ...inputStyle, paddingRight: 44 }} onFocus={handleFocus} onBlur={handleBlur} />
                        <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}>
                          {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
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
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Reset Password & Sign In'}
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <button type="button" onClick={() => handleSendResetCode(email, true)}
                        style={{ background: 'none', border: 'none', color: '#1E40AF', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                        Resend Code
                      </button>
                      <button type="button" onClick={cancelReset}
                        style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                )
              ) : pendingVerification ? (
                /* ──────────────────────────────────────────
                    2) EMAIL SIGNUP VERIFICATION
                ────────────────────────────────────────── */
                <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>Verification Code</label>
                    <div style={{ position: 'relative' }}>
                      <KeyRound size={17} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="text" inputMode="numeric" maxLength={6} required value={verificationCode} onChange={e => setVerificationCode(e.target.value)}
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
                /* ──────────────────────────────────────────
                    3) NORMAL SIGN IN / REGISTER FORM
                ────────────────────────────────────────── */
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
                        <span onClick={handleStartForgotPassword} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1E40AF', cursor: 'pointer' }}>Forgot Password?</span>
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

              {/* Demo mode link */}
              {isLogin && !pendingVerification && !isResetting && (
                <div style={{ marginTop: 22, textAlign: 'center' }}>
                  <button type="button" onClick={() => { loginDemo(); if (onLogin) onLogin(); }}
                    style={{ background: 'none', border: 'none', color: '#475569', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontFamily: "'Inter', sans-serif" }}>
                    Access Demo Mode (No Login Required)
                  </button>
                </div>
              )}
            </div>
            
            {/* Footer inside card */}
            <div style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
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
