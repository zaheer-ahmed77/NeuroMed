import React, { useState, useContext, useEffect } from 'react';
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
    } else if (!token && currentRoute !== 'home') {
      setCurrentRoute('home');
    }
  }, [token, currentRoute]);

  const handleLogin = () => {
    // Show splash for 500ms after login
    setShowLoader(true);
    setTimeout(() => {
      setShowLoader(false);
      window.location.hash = 'overview';
    }, 500);
  };

  const handleLogout = () => {
    logout();
    window.location.hash = 'home';
  };

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
