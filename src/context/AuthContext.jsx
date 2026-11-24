import React, { createContext, useState, useEffect } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/react';
import API_BASE from '../config';

export const AuthContext = createContext();

const DEMO_TOKEN = 'DEMO_MODE';
const DEMO_USER = {
  id: 'demo-user',
  fullName: 'Demo Physician',
  email: 'demo@neuromedpk.app',
  avatar: null,
};
const DEMO_SETTINGS = {
  saveHistory: false,
  emailNotifications: false,
  timezone: 'Asia/Karachi',
};

export const AuthProvider = ({ children }) => {
  const { isSignedIn, user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Safety timeout: force loading=false after 2.5 seconds to prevent infinite spinner
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(safetyTimer);
  }, []);

  // Handle demo mode immediately without waiting for Clerk
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken === DEMO_TOKEN) {
      setUser(DEMO_USER);
      setSettings(DEMO_SETTINGS);
      setIsDemoMode(true);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      // 1. If user activated demo mode — already handled in dedicated useEffect
      if (token === DEMO_TOKEN) {
        setIsLoading(false);
        return;
      }

      // Wait until Clerk is fully loaded
      if (!isClerkLoaded) {
        // Still waiting for Clerk — do nothing, keep loading
        return;
      }

      // 2. If signed in with Clerk
      if (isSignedIn && clerkUser) {
        setIsDemoMode(false);
        try {
          const clerkToken = await getToken();
          if (!isMounted) return;

          if (clerkToken) {
            // Update token in state but DON'T store old value in deps
            localStorage.setItem('token', clerkToken);
            setToken(clerkToken);
          }

          const formattedUser = {
            id: clerkUser.id,
            fullName: clerkUser.fullName || clerkUser.firstName || clerkUser.username || (clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0]) || 'Physician',
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            avatar: clerkUser.imageUrl || null,
          };
          setUser(formattedUser);

          // Unblock loading immediately so dashboard/app renders without waiting for backend
          if (isMounted) setIsLoading(false);

          // Asynchronous non-blocking background sync with backend /me and /settings
          if (clerkToken) {
            fetch(`${API_BASE}/me`, {
              headers: { 'Authorization': `Bearer ${clerkToken}` }
            })
              .then(res => (res.ok ? res.json() : null))
              .then(dbUser => {
                if (isMounted && dbUser) setUser(prev => ({ ...prev, ...dbUser }));
              })
              .catch(err => console.warn('Backend /me sync notice:', err.message));

            fetch(`${API_BASE}/settings`, {
              headers: { 'Authorization': `Bearer ${clerkToken}` }
            })
              .then(res => (res.ok ? res.json() : null))
              .then(sData => {
                if (isMounted && sData) setSettings(sData);
              })
              .catch(err => console.warn('Backend /settings sync notice:', err.message));
          }
        } catch (err) {
          console.error('Clerk session token error:', err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
        // 3. Not signed in and not demo — clear everything
        if (isMounted) {
          setToken(null);
          setUser(null);
          setSettings({});
          setIsDemoMode(false);
          localStorage.removeItem('token');
          setIsLoading(false);
        }
      }
    }

    syncAuth();

    return () => {
      isMounted = false;
    };
    // Note: 'token' intentionally removed from deps to prevent re-render loop
    // token state is updated internally by syncAuth itself
  }, [isClerkLoaded, isSignedIn, clerkUser, getToken]);

  const updateSettings = async (newSettings) => {
    if (isDemoMode) {
      setSettings(prev => ({ ...prev, ...newSettings }));
      return;
    }
    try {
      const currentToken = token || (await getToken());
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });
      if (response.ok) {
        setSettings({ ...settings, ...newSettings });
      }
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const loginDemo = () => {
    localStorage.setItem('token', DEMO_TOKEN);
    setToken(DEMO_TOKEN);
    setIsDemoMode(true);
    setUser(DEMO_USER);
    setSettings(DEMO_SETTINGS);
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSettings({});
    setIsDemoMode(false);
    try {
      await signOut();
    } catch (err) {
      console.warn('SignOut error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      token,
      login,
      loginDemo,
      logout,
      isLoading,
      settings,
      updateSettings,
      isDemoMode,
      isSignedIn,
      clerkUser,
      getToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};
