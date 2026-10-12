import React, { useState, useContext, useEffect } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AboutUs from './components/AboutUs';
import Services from './components/Services';
import LoadingScreen from './components/LoadingScreen';
import { AuthProvider, AuthContext } from './context/AuthContext';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'about' || hash === 'services') return hash;
    return 'home';
  });
  const [showLoader, setShowLoader] = useState(false);
  const { token, logout, isLoading } = useContext(AuthContext);

  // Check if current URL is SSO callback from Google / OAuth
  const isSSOCallback = window.location.pathname.startsWith('/sso-callback') || 
                        window.location.hash.includes('sso-callback') ||
                        window.location.search.includes('__clerk_status') ||
                        window.location.search.includes('created_session_id');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'about' || hash === 'services') setCurrentRoute(hash);
      else if (hash === '' || hash === 'home') setCurrentRoute(token ? 'dashboard' : 'home');
      else setCurrentRoute(token ? 'dashboard' : 'home');
    };
    window.addEventListener('hashchange', handleHash);
    handleHash(); // Call once on mount
    return () => window.removeEventListener('hashchange', handleHash);
  }, [token]);

  const navigate = (route) => {
    window.location.hash = route;
  };

  useEffect(() => {
    if (token && currentRoute === 'home') {
      // Show splash for 500ms on refresh when already logged in
      setShowLoader(true);
      const t = setTimeout(() => {
        setShowLoader(false);
        if (window.location.hash === '' || window.location.hash === '#home') {
          window.location.hash = 'overview';
        }
      }, 500);
      return () => clearTimeout(t);
    } else if (!token && currentRoute !== 'home' && currentRoute !== 'about' && currentRoute !== 'services') {
      setCurrentRoute('home');
    }
  }, [token, currentRoute]);

  const handleLogin = () => {
    // Show splash for 800ms after login, then go to dashboard
    setShowLoader(true);
    setTimeout(() => {
      setShowLoader(false);
      setCurrentRoute('dashboard');
      window.location.hash = 'overview';
    }, 800);
  };

  const handleLogout = () => {
    logout();
    window.location.hash = 'home';
  };

  if (isSSOCallback) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
        <AuthenticateWithRedirectCallback 
          signInForceRedirectUrl="/#overview" 
          signUpForceRedirectUrl="/#overview" 
        />
        <LoadingScreen message="Completing authentication..." />
      </div>
    );
  }

  if (isLoading || showLoader) {
    return <LoadingScreen message={showLoader && !isLoading ? 'Welcome back' : 'Loading NeuroMed'} />;
  }

  return (
    <>
      {currentRoute === 'home' && (
        <LandingPage onLogin={handleLogin} navigate={navigate} />
      )}
      
      {currentRoute === 'dashboard' && (
        <Dashboard onLogout={handleLogout} navigate={navigate} />
      )}

      {currentRoute === 'about' && (
        <AboutUs navigate={navigate} isLoggedIn={!!token} />
      )}

      {currentRoute === 'services' && (
        <Services navigate={navigate} isLoggedIn={!!token} />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
