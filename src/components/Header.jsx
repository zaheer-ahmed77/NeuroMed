import React, { useState, useRef, useEffect, useContext } from 'react';
import { User, Settings, LogOut, Menu, ChevronRight, Zap } from 'lucide-react';
import { UserButton } from '@clerk/react';
import { AuthContext } from '../context/AuthContext';

const NeuroMedLogo = ({ size = 22 }) => (
  <img src="/neuromed_logo.png" alt="NeuroMed Logo" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
);

const tabLabels = {
  overview:  'Overview Dashboard',
  analyzer:  'MRI Analysis Engine',
  clinical:  'Clinical Assessment',
  doctors:   'Specialist Network',
  profile:   'My Profile',
  settings:  'Settings',
};

const Header = ({ onLogout, setActiveTab, sidebarOpen, setSidebarOpen, activeTab }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, isDemoMode } = useContext(AuthContext);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    if (!user?.fullName) return 'U';
    const names = user.fullName.trim().split(' ');
    if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return names[0][0].toUpperCase();
  };

  return (
    <header className="header" role="banner">
      {/* Desktop: show hamburger when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          title="Open sidebar"
          aria-label="Open sidebar"
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer',
            padding: 7, borderRadius: 8, display: 'flex', alignItems: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Breadcrumb / Page Title — desktop only */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }} className="header-breadcrumb">
        <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>NeuroMed</span>
        <ChevronRight size={13} color="#334155" />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          {tabLabels[activeTab] || 'Dashboard'}
        </span>
      </div>

      {/* Center Logo — mobile only */}
      <div
        className="header-logo-mobile"
        onClick={() => setActiveTab('overview')}
        role="button"
        tabIndex={0}
        aria-label="Go to overview"
        style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}
      >
        <NeuroMedLogo size={36} />
      </div>

      {/* Right — demo badge + user avatar + dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
        {isDemoMode && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(13,148,136,0.10)',
            border: '1px solid rgba(13,148,136,0.30)',
            color: '#2DD4BF', fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.3px', whiteSpace: 'nowrap',
          }}>
            <Zap size={11} />
            <span className="hide-on-mobile-text">Demo Mode</span>
          </div>
        )}
        {!isDemoMode && (
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
        <div className="profile-container" ref={dropdownRef}>
          <button
            className="avatar"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Account menu"
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
          >
            {user?.avatar
              ? <img src={user.avatar} alt={`${user.fullName} avatar`} />
              : getInitials()
            }
          </button>

          {isDropdownOpen && (
            <div className="dropdown-menu" role="menu">
              {/* User info */}
              {user && (
                <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 1 }}>
                    {user.fullName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                </div>
              )}

              <div
                className="dropdown-item"
                role="menuitem"
                onClick={() => { setActiveTab('profile'); setIsDropdownOpen(false); }}
                onKeyDown={e => e.key === 'Enter' && (setActiveTab('profile'), setIsDropdownOpen(false))}
                tabIndex={0}
              >
                <User size={15} /> My Profile
              </div>
              <div
                className="dropdown-item"
                role="menuitem"
                onClick={() => { setActiveTab('settings'); setIsDropdownOpen(false); }}
                onKeyDown={e => e.key === 'Enter' && (setActiveTab('settings'), setIsDropdownOpen(false))}
                tabIndex={0}
              >
                <Settings size={15} /> Settings
              </div>
              <div
                className="dropdown-item"
                role="menuitem"
                onClick={onLogout}
                onKeyDown={e => e.key === 'Enter' && onLogout()}
                tabIndex={0}
                style={{
                  color: 'var(--color-error)',
                  borderTop: '1px solid var(--border)',
                  marginTop: 4, paddingTop: 10,
                }}
              >
                <LogOut size={15} /> Sign Out
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .header-breadcrumb { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
