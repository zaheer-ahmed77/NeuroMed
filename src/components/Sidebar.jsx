import React, { useState, useContext } from 'react';
import {
  Brain, User, Settings, Info, Plus, X, Menu,
  ChevronLeft, ChevronRight, Activity,
  LayoutDashboard, Stethoscope, LogOut, Clock
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const NeuroMedLogo = ({ size = 26 }) => (
  <img src="/neuromed_logo.png" alt="NeuroMed Logo" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
);

const Sidebar = ({ navigate, setActiveTab, activeTab, sidebarOpen, setSidebarOpen }) => {
  const { logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'analyzer', icon: Brain, label: 'MRI Analysis' },
    { id: 'clinical', icon: Activity, label: 'Clinical Assessment' },
    { id: 'fusion', icon: Plus, label: 'Multimodal Fusion' },
    { id: 'history', icon: Clock, label: 'Assessment History' },
  ];

    const bottomItems = [
    { id: 'doctors', icon: Stethoscope, label: 'Referral Network' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const NavButton = ({ item, onClick }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        className={`sidebar-link ${isActive ? 'active' : ''}`}
        onClick={() => { setActiveTab(item.id); if (onClick) onClick(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px',
          borderRadius: 8, border: 'none', background: isActive ? 'var(--bg-active)' : 'transparent',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: isActive ? 600 : 500, cursor: 'pointer', textAlign: 'left',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
      >
        <item.icon size={18} color={isActive ? 'var(--brand-primary-500)' : 'currentColor'} strokeWidth={isActive ? 2.5 : 2} />
        <span style={{ flex: 1, whiteSpace: 'nowrap', opacity: sidebarOpen || mobileMenuOpen ? 1 : 0, transition: 'opacity 0.2s' }}>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* ══════════ DESKTOP SIDEBAR ══════════ */}
      <aside className={`sidebar sidebar-desktop ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{
        background: '#F9FAFB', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', 
        padding: '20px 12px', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0, overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 24px', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setActiveTab('overview')}>
            <NeuroMedLogo size={28} />
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', letterSpacing: '-0.3px' }}>NeuroMed</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, display: 'flex', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Main Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, whiteSpace: 'nowrap' }}>
          {navItems.map(item => <NavButton key={item.id} item={item} />)}
        </div>

        {/* Bottom Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto', whiteSpace: 'nowrap' }}>
          {bottomItems.map(item => <NavButton key={item.id} item={item} />)}
          <button
            onClick={() => navigate('about')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px',
              borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-secondary)',
              fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Info size={18} color="currentColor" strokeWidth={2} />
            <span style={{ flex: 1 }}>About</span>
          </button>
          <button
            onClick={() => { logout(); window.location.hash = 'home'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px',
              borderRadius: 8, border: 'none', background: 'transparent', color: '#EF4444',
              fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={18} color="currentColor" strokeWidth={2} />
            <span style={{ flex: 1 }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ══════════ MOBILE HAMBURGER ══════════ */}
      <button
        className="mobile-hamburger-btn"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* ══════════ MOBILE BOTTOM BAR ══════════ */}
      <div className="mobile-bottom-bar">
        <button className={`mobile-bottom-icon ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}>
          <Clock size={20} /> <span>History</span>
        </button>
        <div className="mobile-bottom-logo" onClick={() => setActiveTab('overview')} role="button" tabIndex={0}>
          <NeuroMedLogo size={22} /> <span>NeuroMed</span>
        </div>
        <button className={`mobile-bottom-icon ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}>
          <User size={20} /> <span>Profile</span>
        </button>
      </div>

      {/* ══════════ MOBILE SIDE DRAWER ══════════ */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <NeuroMedLogo size={24} />
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>NeuroMed</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              {navItems.map(item => <NavButton key={item.id} item={item} onClick={() => setMobileMenuOpen(false)} />)}
            </div>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {bottomItems.map(item => <NavButton key={item.id} item={item} onClick={() => setMobileMenuOpen(false)} />)}
              <button
                onClick={() => { navigate('about'); setMobileMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
              >
                <Info size={20} color="#64748B" /> About
              </button>
              <button
                onClick={() => { logout(); window.location.hash = 'home'; setMobileMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', background: 'transparent', color: '#EF4444', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
              >
                <LogOut size={20} color="#EF4444" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
