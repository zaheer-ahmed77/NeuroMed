import React, { useState, useEffect } from 'react';
import { Show, UserButton } from '@clerk/react';
import AuthForm from './AuthForm';
import {
  Brain, Activity, ChevronRight, Shield, X, Menu, Info,
  Microscope, Stethoscope, CheckCircle2, AlertTriangle,
  TrendingUp, Star, ArrowRight, Zap, Upload, FileText, Users,
  Crosshair, Play
} from 'lucide-react';
import brainImg from '../assets/brain.png';

/* ══════════════════════════════════════
   NEUROMED LOGO
══════════════════════════════════════ */
const NeuroMedLogo = ({ size = 30, glow = false }) => (
  <img src="/neuromed_logo.png" alt="NeuroMed Logo" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, filter: glow ? 'drop-shadow(0 0 10px rgba(255,255,255,0.4))' : 'none' }} />
);

/* ══════════════════════════════════════
   FLOATING HERO CARDS — ChronoTask style
══════════════════════════════════════ */

/* Top-left: MRI Scan Result */
const HeroCardMRI = () => (
  <div className="hero-float-card" style={{ width: 228, animation: 'heroFloat 5s ease-in-out infinite' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(30,64,175,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Brain size={16} color="#1E40AF" />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>MRI Result</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <img src={brainImg} alt="" style={{ width: 52, height: 52, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(30,64,175,0.25))' }} />
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>Glioblastoma</div>
        <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
          <AlertTriangle size={11} /> High Grade
        </div>
      </div>
    </div>
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 500 }}>Confidence</span>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#1E40AF' }}>97.3%</span>
      </div>
      <div style={{ height: 5, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '97%', background: 'linear-gradient(90deg, #1E40AF, #3B82F6)', borderRadius: 99 }} />
      </div>
    </div>
  </div>
);

/* Top-right: Symptom Risk */
const HeroCardRisk = () => (
  <div className="hero-float-card" style={{ width: 200, animation: 'heroFloat 6s ease-in-out infinite 0.8s', position: 'relative' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Risk Score</div>
      <Activity size={16} color="#3B82F6" strokeWidth={2.5} style={{ opacity: 0.8 }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r="30" fill="none" stroke="#F3F4F6" strokeWidth="7" />
        <circle cx="38" cy="38" r="30" fill="none" stroke="#EF4444" strokeWidth="7"
          strokeDasharray={`${0.76 * 188.5} ${188.5}`} strokeLinecap="round"
          transform="rotate(-90 38 38)" />
        <text x="38" y="43" textAnchor="middle" fontSize="17" fontWeight="900" fill="#111827">76</text>
      </svg>
    </div>
    {['Headaches', 'Seizures', 'Vision'].map((s, i) => (
      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: ['#EF4444', '#F59E0B', '#3B82F6'][i], flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', color: '#374151' }}>{s}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.67rem', fontWeight: 600, color: '#9CA3AF' }}>
          {['Severe', 'Moderate', 'Mild'][i]}
        </span>
      </div>
    ))}
  </div>
);

/* Bottom-left: Speed stats (dark card) */
const HeroCardStats = () => (
  <div style={{
    background: '#1E40AF', borderRadius: 20, padding: '18px 20px',
    boxShadow: '0 8px 32px rgba(30,64,175,0.30)', width: 175,
    animation: 'heroFloat 7s ease-in-out infinite 1.5s'
  }}>
    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>Analysis Speed</div>
    <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 4 }}>2.4s</div>
    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>avg. per scan</div>
    <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', marginBottom: 12 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <TrendingUp size={13} color="#2DD4BF" />
      <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>98.6% accurate</span>
    </div>
  </div>
);

/* Bottom-right: Doctor recommendation */
const HeroCardDoctors = () => (
  <div className="hero-float-card" style={{ width: 210, animation: 'heroFloat 5.5s ease-in-out infinite 2s' }}>
    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 }}>Referral Network</div>
    {[{ initials: 'SC', name: 'Dr. Sarah Chen', role: 'Neurosurgeon', bg: 'linear-gradient(135deg,#6366F1,#2DD4BF)' },
    { initials: 'RA', name: 'Dr. Raza Ahmed', role: 'Oncologist', bg: 'linear-gradient(135deg,#1E40AF,#60A5FA)' }
    ].map((doc, i) => (
      <div key={doc.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i === 0 ? 10 : 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: doc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: '#fff', fontWeight: 800, flexShrink: 0 }}>{doc.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>{doc.name}</div>
          <div style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{doc.role}</div>
          <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
            {[...Array(5)].map((_, j) => <Star key={j} size={9} fill="#F59E0B" color="#F59E0B" />)}
          </div>
        </div>
        <ChevronRight size={14} color="#9CA3AF" />
      </div>
    ))}
    <div style={{ marginTop: 12, background: '#F0FDF4', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
      <span style={{ fontSize: '0.67rem', fontWeight: 600, color: '#059669' }}>Available Today</span>
    </div>
  </div>
);

/* ══════════════════════════════════════
   FEATURE CHECK LIST ITEM
══════════════════════════════════════ */
const CheckItem = ({ text, color = '#0D9488' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
    <CheckCircle2 size={18} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
    <span style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.5 }}>{text}</span>
  </div>
);

/* ══════════════════════════════════════
   HOW IT WORKS CARD
══════════════════════════════════════ */
const HowCard = ({ step, Icon, iconColor, iconBg, title, desc, svgIllustration }) => (
  <div style={{
    background: '#fff', borderRadius: 20, padding: 28,
    border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 20,
    transition: 'transform 0.25s, box-shadow 0.25s'
  }} className="how-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} color={iconColor} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: iconColor, background: iconBg, padding: '4px 12px', borderRadius: 99, letterSpacing: '0.5px' }}>Step {step}</span>
    </div>
    {svgIllustration && <div style={{ display: 'flex', justifyContent: 'center' }}>{svgIllustration}</div>}
    <div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: '0.88rem', color: '#6B7280', lineHeight: 1.65 }}>{desc}</p>
    </div>
  </div>
);

/* SVG Illustrations for How It Works */
const SvgUpload = () => (
  <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
    <rect x="10" y="20" width="60" height="38" rx="10" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
    <path d="M40 38 L40 22 M40 22 L34 28 M40 22 L46 28" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="18" y="44" width="20" height="5" rx="2.5" fill="#BFDBFE" />
    <rect x="42" y="44" width="12" height="5" rx="2.5" fill="#BFDBFE" />
    <circle cx="40" cy="12" r="8" fill="#1E40AF" fillOpacity="0.1" stroke="#1E40AF" strokeWidth="1.5" strokeDasharray="3 2" />
  </svg>
);

const SvgAI = () => (
  <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
    <circle cx="40" cy="30" r="16" fill="#F3E8FF" stroke="#C084FC" strokeWidth="1.5" />
    <circle cx="40" cy="30" r="8" fill="#7C3AED" fillOpacity="0.15" />
    <circle cx="40" cy="30" r="3.5" fill="#7C3AED" />
    {[[18, 14], [62, 14], [18, 46], [62, 46], [10, 30], [70, 30]].map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r="4" fill="#F3E8FF" stroke="#C084FC" strokeWidth="1.2" />
        <line x1={x + (x < 40 ? 4 : -4)} y1={y + (y < 30 ? 4 : y > 30 ? -4 : 0)} x2={x < 10 || x > 70 ? (x < 40 ? 24 : 56) : 40} y2={y < 30 ? 22 : y > 30 ? 38 : 30} stroke="#C084FC" strokeWidth="1" strokeDasharray="2 2" />
      </g>
    ))}
  </svg>
);

const SvgDoctor = () => (
  <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
    <rect x="8" y="22" width="28" height="30" rx="8" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="1.5" />
    <rect x="44" y="14" width="28" height="38" rx="8" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
    <circle cx="22" cy="14" r="8" fill="#D1FAE5" />
    <circle cx="22" cy="14" r="4" fill="#10B981" />
    <circle cx="58" cy="10" r="6" fill="#DBEAFE" />
    <circle cx="58" cy="10" r="3" fill="#1E40AF" />
    <path d="M14 38 h16 M14 43 h10" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M50 32 h16 M50 37 h10 M50 42 h12" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ══════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
══════════════════════════════════════ */
function LandingPage({ onLogin, navigate }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogin = () => { setShowAuthModal(false); onLogin(); };
  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileNavOpen(false); };

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", color: '#111827', overflowX: 'hidden' }}>

      {/* ════════════════════════════════════════════
          STICKY HEADER
      ════════════════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px',
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(250,250,250,0.6)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.05)'}`,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ maxWidth: 1200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
            <NeuroMedLogo size={30} />
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.2px' }}>NeuroMed</span>
          </div>

          {/* Desktop Nav */}
          <nav className="lp-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[['How It Works', 'how'], ['MRI Analysis', 'mri'], ['Clinical', 'clinical'], ['Referral Network', 'doctors']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="lp-nav-btn">{label}</button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="lp-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('about')} className="lp-nav-btn"><Info size={14} /> About</button>
            <Show when="signed-out">
              <button onClick={() => setShowAuthModal(true)} className="lp-cta-primary">Access Platform →</button>
            </Show>
            <Show when="signed-in">
              <button onClick={() => navigate('dashboard')} className="lp-cta-primary">Dashboard →</button>
              <UserButton afterSignOutUrl="/" />
            </Show>
          </div>

          {/* Mobile burger */}
          <button className="lp-mobile-btn" onClick={() => setMobileNavOpen(p => !p)}>
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileNavOpen && (
        <div style={{ position: 'fixed', inset: 0, top: 64, background: '#fff', zIndex: 99, padding: 28, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {['How It Works|how', 'MRI Analysis|mri', 'Clinical|clinical', 'Referral Network|doctors', 'About|about'].map((item) => {
            const [label, id] = item.split('|');
            return (
              <button key={id} onClick={() => { id === 'about' ? navigate('about') : scrollTo(id); setMobileNavOpen(false); }}
                style={{ background: 'none', border: 'none', borderBottom: '1px solid #F3F4F6', padding: '18px 0', fontSize: '1.2rem', fontWeight: 700, color: '#111827', textAlign: 'left', cursor: 'pointer' }}>
                {label}
              </button>
            );
          })}
          <Show when="signed-out">
            <button onClick={() => { setShowAuthModal(true); setMobileNavOpen(false); }} className="lp-cta-primary" style={{ marginTop: 24, padding: '16px', fontSize: '1rem', borderRadius: 14 }}>
              Access Platform
            </button>
          </Show>
          <Show when="signed-in">
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => { navigate('dashboard'); setMobileNavOpen(false); }} className="lp-cta-primary" style={{ flex: 1, padding: '16px', fontSize: '1rem', borderRadius: 14, marginRight: 12 }}>
                Dashboard →
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </Show>
        </div>
      )}

      {/* ════════════════════════════════════════════
          HERO — Modern 3-Column Layout
      ════════════════════════════════════════════ */}
      <section className="hero-section" style={{
        position: 'relative', paddingTop: 80, paddingBottom: 60, minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FAFAFA',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.09) 1.5px, transparent 1.5px)',
        backgroundSize: '14px 14px',
        overflow: 'hidden'
      }}>
        {/* Glowing Orbs for Depth */}
        <div style={{ position: 'absolute', top: '10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="hero-grid">

          {/* ── GRID 1 (Top-Left): Text & CTAs ── */}
          <div className="hero-col-center" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Decorative squiggle near headline */}
            <div style={{ position: 'absolute', top: '-5%', right: '5%', opacity: 0.8, transform: 'rotate(-10deg)', zIndex: 1 }}>
              <svg width="35" height="35" viewBox="0 0 40 40" fill="none">
                <path d="M5 20 C10 5, 20 5, 25 20 S40 35, 45 20" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            <div style={{ animation: 'lpFadeUp 0.7s ease both' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 20, margin: '0 0 20px 0' }}>
                AI-Powered Brain Tumor Diagnostics
              </p>
            </div>

            <h1 style={{ animation: 'lpFadeUp 0.7s ease 0.08s both' }}>
              <span style={{ display: 'block', fontSize: 'clamp(2.5rem, 4vw, 4rem)', fontWeight: 900, letterSpacing: '-2px', color: '#111827', lineHeight: 1.05, marginBottom: 4 }}>
                Detect, diagnose,
              </span>
              <span style={{ display: 'block', fontSize: 'clamp(2.5rem, 4vw, 4rem)', fontWeight: 900, letterSpacing: '-2px', color: '#3B82F6', lineHeight: 1.05 }}>
                and save lives.
              </span>
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#6B7280', lineHeight: 1.6, margin: '24px 0 32px 0', maxWidth: 480, animation: 'lpFadeUp 0.7s ease 0.16s both' }}>
              Clinical Decision Support System (CDSS) for radiologists and physicians. Enhance diagnostic confidence with AI-powered MRI analysis and a seamless cross-consultation network.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animation: 'lpFadeUp 0.7s ease 0.24s both' }}>
              <button onClick={() => setShowAuthModal(true)} className="lp-cta-primary" style={{ padding: '14px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                Start Free Analysis <ArrowRight size={16} />
              </button>
              <button onClick={() => scrollTo('how')} className="lp-cta-outline" style={{ padding: '14px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={10} fill="#111827" stroke="none" style={{ marginLeft: 2 }} />
                </div>
                See How It Works
              </button>
            </div>

            {/* Trust stats row */}
            <div className="hero-stats-row" style={{ display: 'flex', alignItems: 'center', marginTop: 48, animation: 'lpFadeUp 0.7s ease 0.32s both' }}>
              {[['98.6%', 'Accuracy Rate', Crosshair], ['2.4s', 'Avg. Analysis Time', Zap], ['50+', 'Clinics Connected', Shield]].map(([val, lbl, Icon], idx, arr) => (
                <React.Fragment key={lbl}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color="#1D4ED8" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{val}</div>
                      <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600 }}>{lbl}</div>
                    </div>
                  </div>
                  {idx < arr.length - 1 && <div className="stat-divider" style={{ width: 1, height: 36, background: '#E5E7EB', margin: '0 24px' }} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── GRID 2 (Top-Right): Diagnostic Visual (MRI) ── */}
          <div className="hero-col-left" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

              {/* Reference-exact MRI tablet 3D style */}
              <div style={{
                position: 'relative', width: 260, height: 320, background: '#0B1120', borderRadius: 24, boxShadow: '-15px 25px 40px rgba(15,23,42,0.25)',
                transform: 'perspective(1000px) rotateY(15deg) rotateX(5deg) rotateZ(-2deg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                border: '4px solid #1E293B', borderLeft: '8px solid #334155'
              }}>
                <img src="/mri_hero_base.webp" alt="Brain MRI Scan" style={{ width: '120%', height: '120%', objectFit: 'cover', opacity: 0.85 }} />
              </div>

              {/* Tumor Badge Overlay directly on image */}
              <div className="floating-anim" style={{ position: 'absolute', top: '35%', right: '15%', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 10px #EF4444' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '0.2px' }}>Tumor Detected</span>
              </div>

              {/* Floating SVG Brain (left side) */}
              <div style={{ position: 'absolute', top: '40%', left: '-5%', background: '#fff', borderRadius: '35%', padding: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.08)', animation: 'heroFloat 6s ease-in-out infinite 0.5s', zIndex: 4 }}>
                <Brain size={24} color="#3B82F6" strokeWidth={1.5} />
              </div>

              {/* Connecting dashed line */}
              <svg style={{ position: 'absolute', top: '0', left: '-15%', width: '150%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                <path d="M 40 140 Q 90 40 150 40" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="150" cy="40" r="3" fill="#3B82F6" />
                <circle cx="40" cy="140" r="3" fill="#3B82F6" />
              </svg>

              {/* Decorative Leaves (bottom left) */}
              <div style={{ position: 'absolute', bottom: '-5%', left: '0%', opacity: 0.8, zIndex: 1 }}>
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <path d="M30 60C30 60 15 45 10 30C5 15 20 10 30 20C40 10 55 15 50 30C45 45 30 60 30 60Z" fill="#BFDBFE" />
                  <path d="M30 60C30 60 25 50 20 40C15 30 25 25 30 30C35 25 45 30 40 40C35 50 30 60 30 60Z" fill="#93C5FD" />
                </svg>
              </div>

              {/* Floating Cards around MRI */}
              <div className="floating-anim-delayed" style={{ position: 'absolute', top: '-5%', left: '-8%', zIndex: 3 }}>
                <HeroCardMRI />
              </div>
              <div className="floating-anim-delayed-more" style={{ position: 'absolute', bottom: '-6%', right: '0%', zIndex: 3 }}>
                <HeroCardStats />
              </div>
            </div>
          </div>

          {/* ── GRID 3 (Bottom-Left - NEW): Multimodal AI & Security ── */}
          <div className="hero-col-new" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

              {/* Floating backdrop for brain */}
              <div style={{ position: 'absolute', width: 280, height: 280, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />

              <img src="/network_brain.webp" alt="AI Network" style={{ width: '90%', objectFit: 'contain', position: 'relative', zIndex: 1, animation: 'heroFloat 6s ease-in-out infinite 0.2s', filter: 'drop-shadow(0 15px 35px rgba(59,130,246,0.25))' }} />

              {/* New Card 1: HIPAA Secure */}
              <div className="floating-anim" style={{ position: 'absolute', top: '10%', left: '-5%', zIndex: 3, background: '#fff', borderRadius: 16, padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10, width: 180 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={16} color="#059669" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111827' }}>HIPAA Secure</div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280' }}>End-to-end encrypted</div>
                </div>
              </div>

              {/* New Card 2: Multimodal AI */}
              <div className="floating-anim-delayed" style={{ position: 'absolute', bottom: '10%', right: '-5%', zIndex: 3, background: '#fff', borderRadius: 16, padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10, width: 200 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} color="#4F46E5" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111827' }}>Multimodal Analysis</div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280' }}>MRI + Clinical Data</div>
                </div>
              </div>

            </div>
          </div>

          {/* ── GRID 4 (Bottom-Right): Human Element (Doctor) ── */}
          <div className="hero-col-right" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360, display: 'flex', justifyContent: 'center' }}>
              {/* Backdrop blob behind doctor */}
              <div style={{ position: 'absolute', bottom: 0, width: '110%', height: '80%', background: '#E0E7FF', borderRadius: '50% 50% 0 0', opacity: 0.7, zIndex: 0 }} />

              {/* Using user's custom image */}
              <img src="/hero_doctor_exact.webp" alt="Medical Professional" style={{ height: 460, objectFit: 'contain', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))' }} />

              {/* Floating SVG Brain (near doctor) */}
              <div style={{ position: 'absolute', bottom: '10%', right: '15%', background: '#4F46E5', borderRadius: '35%', padding: 12, boxShadow: '0 10px 25px rgba(79,70,229,0.4)', animation: 'heroFloat 5s ease-in-out infinite 0.3s', zIndex: 4 }}>
                <Brain size={24} color="#fff" strokeWidth={1.5} />
              </div>

              {/* Decorative Squiggle (top right) */}
              <div style={{ position: 'absolute', top: '0%', right: '-15%', opacity: 0.8, zIndex: 1, transform: 'rotate(15deg)' }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M5 20 C10 5, 20 5, 25 20 S40 35, 45 20" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <div className="floating-anim" style={{ position: 'absolute', top: '2%', left: '-6%', zIndex: 3 }}>
                <HeroCardRisk />
              </div>
              <div className="floating-anim-delayed" style={{ position: 'absolute', bottom: '10%', right: '-8%', zIndex: 3 }}>
                <HeroCardDoctors />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════
          HOW IT WORKS — 3 cards with SVG illustrations
      ════════════════════════════════════════════ */}
      <section id="how" style={{
        padding: '110px 28px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span className="section-label">How It Works</span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px', marginTop: 14, maxWidth: 560, margin: '14px auto 0' }}>
              From scan to diagnosis<br />in three steps
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <HowCard step={1} Icon={Upload} iconColor="#1E40AF" iconBg="rgba(30,64,175,0.07)" title="Upload MRI Scan" svgIllustration={<SvgUpload />}
              desc="Securely upload DICOM or standard image formats. Zero setup. Our system handles all preprocessing automatically." />
            <HowCard step={2} Icon={Brain} iconColor="#7C3AED" iconBg="rgba(124,58,237,0.07)" title="AI Classification" svgIllustration={<SvgAI />}
              desc="Our explainable deep-learning model classifies tumor type, grade, and location — with Grad-CAM heatmap overlays." />
            <HowCard step={3} Icon={Stethoscope} iconColor="#0D9488" iconBg="rgba(13,148,136,0.07)" title="Specialist Referral" svgIllustration={<SvgDoctor />}
              desc="Review AI results and instantly connect with vetted neurosurgeons and oncologists matched to your findings." />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURE 1 — MRI Analysis
          ChronoTask style: frameless screenshot, dot bg
      ════════════════════════════════════════════ */}
      <section id="mri" style={{
        padding: '110px 28px',
        backgroundColor: '#FAFAFA',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px)',
        backgroundSize: '14px 14px',
        borderTop: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px' }}>
            <span className="section-label">01 / MRI Intelligence</span>
            <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px', margin: '14px 0 18px' }}>
              Precision tumor detection<br />you can trust.
            </h2>
            <p style={{ fontSize: '1rem', color: '#6B7280', lineHeight: 1.75, marginBottom: 28 }}>
              Upload any brain MRI and get an instant, explainable AI classification — tumor type, grade, region — with a visual Grad-CAM heatmap overlay for transparent, audit-ready decisions.
            </p>
            <CheckItem text="Classifies 4 tumor types with 98.6% accuracy" color="#1E40AF" />
            <CheckItem text="Grad-CAM explainability heatmap overlay" color="#1E40AF" />
            <CheckItem text="Supports DICOM and standard image formats" color="#1E40AF" />
            <CheckItem text="Full results delivered in under 3 seconds" color="#1E40AF" />
            <button onClick={() => setShowAuthModal(true)} className="lp-cta-primary" style={{ marginTop: 28 }}>
              Try MRI Analysis <ArrowRight size={16} />
            </button>
          </div>
          <div style={{ flex: '1 1 460px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', maxWidth: 440, width: '100%', display: 'flex', justifyContent: 'center' }}>
              <svg width="100%" height="auto" viewBox="0 0 400 320" fill="none" style={{ maxWidth: 400 }}>
                {/* Background glow & grid */}
                <rect x="20" y="20" width="360" height="280" rx="30" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                <circle cx="200" cy="160" r="100" fill="#DBEAFE" opacity="0.4" />
                <path d="M50 80 L350 80 M50 160 L350 160 M50 240 L350 240" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M120 50 L120 270 M200 50 L200 270 M280 50 L280 270" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />

                {/* Brain Outline */}
                <path d="M200 65 C140 65 110 100 110 150 C110 190 120 220 150 240 C170 255 185 240 200 240 C215 240 230 255 250 240 C280 220 290 190 290 150 C290 100 260 65 200 65Z" stroke="#1E40AF" strokeWidth="4" fill="#EFF6FF" strokeLinejoin="round" />
                <path d="M140 100 C160 85 180 110 200 95 C220 110 240 85 260 100 C275 120 255 140 265 160 C270 180 245 190 245 210 C220 200 210 230 200 215 C190 230 180 200 155 210 C155 190 130 180 135 160 C145 140 125 120 140 100Z" stroke="#3B82F6" strokeWidth="2" fill="none" strokeLinejoin="round" opacity="0.6" />
                <path d="M200 65 L200 240" stroke="#1E40AF" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" />

                {/* Heatmap Overlay (Tumor) */}
                <circle cx="235" cy="185" r="28" fill="#EF4444" opacity="0.2" />
                <circle cx="235" cy="185" r="18" fill="#EF4444" opacity="0.4" />
                <circle cx="235" cy="185" r="8" fill="#EF4444" />

                {/* AI Scanning Line */}
                <rect x="90" y="185" width="220" height="2" fill="#10B981" />
                <rect x="180" y="181" width="40" height="10" rx="5" fill="#10B981" opacity="0.3" />
              </svg>
              {/* Floating badge */}
              <div style={{ position: 'absolute', bottom: 10, left: -20, background: '#fff', borderRadius: 14, padding: '10px 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={18} color="#1E40AF" />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>Glioblastoma GBM</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981' }}>97.3% confidence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURE 2 — Clinical Assessment
      ════════════════════════════════════════════ */}
      <section id="clinical" style={{
        padding: '110px 28px', backgroundColor: '#FFFFFF',
        borderTop: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 80, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px' }}>
            <span className="section-label">02 / Clinical System</span>
            <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px', margin: '14px 0 18px' }}>
              Smart symptom-based<br />risk evaluation.
            </h2>
            <p style={{ fontSize: '1rem', color: '#6B7280', lineHeight: 1.75, marginBottom: 28 }}>
              Before imaging is even available, our structured clinical assessment evaluates 12+ neurological warning signs — computing a real-time risk score that correlates with MRI findings.
            </p>
            <CheckItem text="12-point neurological symptom questionnaire" color="#7C3AED" />
            <CheckItem text="Real-time risk stratification: Low / Medium / High" color="#7C3AED" />
            <CheckItem text="Automatically correlates with MRI analysis results" color="#7C3AED" />
            <CheckItem text="Generates printable clinical summary PDF report" color="#7C3AED" />
          </div>
          <div style={{ flex: '1 1 460px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', maxWidth: 440, width: '100%' }}>
              <svg width="100%" height="auto" viewBox="0 0 400 320" fill="none" style={{ maxWidth: 400 }}>
                <rect x="20" y="20" width="360" height="280" rx="30" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                {/* Clipboard */}
                <rect x="120" y="50" width="160" height="220" rx="12" fill="#fff" stroke="#CBD5E1" strokeWidth="2" />
                <rect x="160" y="40" width="80" height="20" rx="6" fill="#64748B" />
                <circle cx="200" cy="50" r="4" fill="#fff" />
                {/* Lines */}
                <rect x="140" y="90" width="80" height="6" rx="3" fill="#E2E8F0" />
                <rect x="140" y="110" width="120" height="6" rx="3" fill="#E2E8F0" />
                <rect x="140" y="130" width="100" height="6" rx="3" fill="#E2E8F0" />
                <rect x="140" y="170" width="80" height="6" rx="3" fill="#E2E8F0" />
                <rect x="140" y="190" width="110" height="6" rx="3" fill="#E2E8F0" />
                {/* Risk Gauge */}
                <circle cx="200" cy="230" r="24" fill="none" stroke="#E2E8F0" strokeWidth="6" />
                <path d="M200 206 A 24 24 0 0 1 224 230" fill="none" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" />
                <text x="200" y="235" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#7C3AED">78</text>
                {/* Floating Elements */}
                <rect x="60" y="100" width="40" height="40" rx="10" fill="#F3E8FF" stroke="#D8B4FE" strokeWidth="2" />
                <path d="M70 120 L75 125 L85 115" stroke="#9333EA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                <rect x="290" y="160" width="50" height="50" rx="12" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
                <path d="M305 185 L315 175 M315 175 L325 185 M315 175 L315 195" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ position: 'absolute', top: 10, right: -16, background: '#7C3AED', borderRadius: 14, padding: '10px 16px', boxShadow: '0 4px 20px rgba(124,58,237,0.30)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} color="#fff" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>High Risk Detected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURE 3 — Specialists
      ════════════════════════════════════════════ */}
      <section id="doctors" style={{
        padding: '110px 28px',
        backgroundColor: '#FAFAFA',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px)',
        backgroundSize: '14px 14px',
        borderTop: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px' }}>
            <span className="section-label">03 / Specialist Network</span>
            <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px', margin: '14px 0 18px' }}>
              Connect to the right<br />specialist instantly.
            </h2>
            <p style={{ fontSize: '1rem', color: '#6B7280', lineHeight: 1.75, marginBottom: 28 }}>
              A critical finding triggers an automatic specialist match — surfacing top-rated neurosurgeons and oncologists filtered by specialty and availability. Referral made effortless.
            </p>
            <CheckItem text="AI-matched specialist recommendations" color="#0D9488" />
            <CheckItem text="Verified neurosurgeons and oncologists" color="#0D9488" />
            <CheckItem text="One-click patient record sharing" color="#0D9488" />
            <CheckItem text="Integrated appointment scheduling" color="#0D9488" />
          </div>
          <div style={{ flex: '1 1 460px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', maxWidth: 440, width: '100%' }}>
              <svg width="100%" height="auto" viewBox="0 0 400 320" fill="none" style={{ maxWidth: 400 }}>
                <rect x="20" y="20" width="360" height="280" rx="30" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />

                {/* Doctor Avatar Profile Card */}
                <rect x="110" y="80" width="180" height="180" rx="24" fill="#fff" stroke="#CBD5E1" strokeWidth="2" />
                <circle cx="200" cy="130" r="32" fill="#DBEAFE" />
                <path d="M200 115 A 15 15 0 0 0 185 130 A 15 15 0 0 0 215 130 A 15 15 0 0 0 200 115 Z" fill="#1E40AF" />
                <path d="M175 160 Q 200 145 225 160 L 225 170 Q 200 165 175 170 Z" fill="#1E40AF" />

                {/* Stars */}
                <path d="M170 190 L173 197 L180 197 L175 201 L177 208 L170 204 L163 208 L165 201 L160 197 L167 197 Z" fill="#F59E0B" />
                <path d="M185 190 L188 197 L195 197 L190 201 L192 208 L185 204 L178 208 L180 201 L175 197 L182 197 Z" fill="#F59E0B" />
                <path d="M200 190 L203 197 L210 197 L205 201 L207 208 L200 204 L193 208 L195 201 L190 197 L197 197 Z" fill="#F59E0B" />
                <path d="M215 190 L218 197 L225 197 L220 201 L222 208 L215 204 L208 208 L210 201 L205 197 L212 197 Z" fill="#F59E0B" />
                <path d="M230 190 L233 197 L240 197 L235 201 L237 208 L230 204 L223 208 L225 201 L220 197 L227 197 Z" fill="#F59E0B" />

                {/* Small connecting nodes */}
                <circle cx="80" cy="90" r="12" fill="#D1FAE5" stroke="#34D399" strokeWidth="2" />
                <circle cx="310" cy="110" r="16" fill="#FEE2E2" stroke="#F87171" strokeWidth="2" />
                <circle cx="100" cy="240" r="14" fill="#FEF3C7" stroke="#FBBF24" strokeWidth="2" />
                <path d="M92 90 L110 110 M310 126 L290 150 M114 240 L140 220" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
              </svg>

              <div style={{ position: 'absolute', bottom: 10, right: -14, background: '#fff', borderRadius: 14, padding: '10px 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>3 specialists available now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA BANNER — dark with dot pattern
      ════════════════════════════════════════════ */}
      <section style={{
        padding: '100px 28px', textAlign: 'center',
        background: '#0F172A',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1.5px, transparent 1.5px)',
        backgroundSize: '14px 14px',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 16 }}>
            Ready to transform<br />neurological care?
          </h2>
          <p style={{ color: '#64748B', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 36 }}>
            Join clinicians using NeuroMed to deliver faster, more accurate brain tumor diagnoses — backed by explainable AI.
          </p>
          <button onClick={() => setShowAuthModal(true)} className="lp-cta-primary" style={{ padding: '15px 36px', fontSize: '1.05rem' }}>
            Access Platform Free <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer style={{ background: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NeuroMedLogo size={24} glow={true} />
            <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>NeuroMed</span>
          </div>
          <span style={{ color: '#475569', fontSize: '0.8rem' }}>Clinical decision-support tool — not a substitute for medical diagnosis.</span>
          <span style={{ color: '#475569', fontSize: '0.8rem' }}>&copy; {new Date().getFullYear()} NeuroMed Technologies</span>
        </div>
      </footer>

      {/* ════════════════════════════════════════════
          AUTH MODAL
      ════════════════════════════════════════════ */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#FAFAFA', zIndex: 9999, overflowY: 'auto', animation: 'lpFadeIn 0.25s ease' }}>
          <button
            onClick={() => setShowAuthModal(false)}
            style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.08)', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <X size={20} />
          </button>
          <AuthForm onLogin={handleLogin} />
        </div>
      )}

      {/* ════════════════════════════════════════════
          GLOBAL STYLES
      ════════════════════════════════════════════ */}
      <style>{`
        .lp-nav-btn {
          background: none; border: none; color: #6B7280; font-size: 0.875rem;
          font-weight: 600; cursor: pointer; padding: 7px 14px; border-radius: 8px;
          transition: all 0.15s; display: flex; align-items: center; gap: 5px;
          font-family: 'Inter', sans-serif;
        }
        .lp-nav-btn:hover { background: rgba(0,0,0,0.05); color: #111827; }

        .lp-cta-primary {
          background: #1E40AF; color: #fff; border: none; border-radius: 99px;
          padding: 11px 24px; font-size: 0.9rem; font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; gap: 7px;
          box-shadow: 0 4px 16px rgba(30,64,175,0.30);
          transition: all 0.2s; font-family: 'Inter', sans-serif;
        }
        .lp-cta-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(30,64,175,0.35); }
        .lp-cta-primary:active { transform: scale(0.97); }

        .lp-cta-outline {
          background: #fff; color: #374151; border: 1.5px solid #E5E7EB;
          border-radius: 99px; padding: 11px 24px; font-size: 0.9rem;
          font-weight: 600; cursor: pointer; transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .lp-cta-outline:hover { border-color: #D1D5DB; background: #F9FAFB; }

        .hero-float-card {
          background: #fff;
          border-radius: 18px;
          padding: 18px 20px;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }

        .how-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.10) !important; }

        .lp-desktop-nav { display: flex; }
        .lp-mobile-btn { display: none; background: none; border: none; color: #111827; cursor: pointer; padding: 4px; }

        @keyframes lpFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lpFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes floatAnim {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .floating-anim { animation: floatAnim 6s ease-in-out infinite; }
        .floating-anim-delayed { animation: floatAnim 7s ease-in-out infinite 1s; }
        .floating-anim-delayed-more { animation: floatAnim 6.5s ease-in-out infinite 2.5s; }

        @media (max-width: 1400px) {
          .hero-card-tl, .hero-card-tr, .hero-card-bl, .hero-card-br { transform: scale(0.85); transform-origin: center; }
        }
        @media (max-width: 1100px) {
          .hero-card-tl, .hero-card-tr, .hero-card-bl, .hero-card-br { transform: scale(0.7); opacity: 0.6; pointer-events: none; }
        }
        @media (max-width: 900px) {
          .lp-desktop-nav { display: none !important; }
          .lp-mobile-btn { display: flex !important; }
        }
        @media (max-width: 768px) {
          .floating-anim, .floating-anim-delayed, .floating-anim-delayed-more {
            zoom: 0.6;
          }
        }
        @media (max-width: 640px) {
          .section-label { font-size: 0.72rem; }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
