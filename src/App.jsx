import React, { useState, useContext, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AboutUs from './components/AboutUs';
import Services from './components/Services';
import LoadingScreen from './components/LoadingScreen';
import { AuthProvider, AuthContext } from './context/AuthContext';

function AppContent() {
  const { token, logout, isLoading } = useContext(AuthContext);
  const [showLoader, setShowLoader] = useState(false);

  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'about' || hash === 'services') return hash;
    return 'home';
  });

  // Keep route synced with URL hash and auth token
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'about' || hash === 'services') {
        setCurrentRoute(hash);
      } else if (token) {
        setCurrentRoute('dashboard');
        if (hash === '' || hash === 'home') {
          window.location.hash = 'overview';
        }
      } else {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash(); // Evaluate immediately on mount/token change
    return () => window.removeEventListener('hashchange', handleHash);
  }, [token]);

  // Safety watchdog: ensure showLoader NEVER stays stuck
  useEffect(() => {
    if (showLoader) {
      const timer = setTimeout(() => setShowLoader(false), 900);
      return () => clearTimeout(timer);
    }
  }, [showLoader]);

  const navigate = (route) => {
    if (route === 'dashboard') {
      window.location.hash = 'overview';
    } else {
      window.location.hash = route;
    }
  };

  const handleLogin = () => {
    // Smooth transition only when user explicitly logs in through the modal
    setShowLoader(true);
    setTimeout(() => {
      setShowLoader(false);
      setCurrentRoute('dashboard');
      window.location.hash = 'overview';
    }, 600);
  };

  const handleLogout = () => {
    logout();
    setCurrentRoute('home');
    window.location.hash = 'home';
  };

  // Only show splash screen while Auth/Clerk is actually verifying session, or during active login
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
