import React, { createContext, useState, useEffect } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/react';
import API_BASE from '../config';

export const AuthContext = createContext();

const DEMO_TOKEN = 'DEMO_MODE';
const DEMO_USER = {
  id: 'demo-user',
  fullName: 'Demo Physician',
  email: 'demo@neuromed.ai',
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

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      // 1. If user activated demo mode
      if (token === DEMO_TOKEN) {
        setUser(DEMO_USER);
        setSettings(DEMO_SETTINGS);
        setIsDemoMode(true);
        setIsLoading(false);
        return;
      }

      // Wait until Clerk is fully loaded
      if (!isClerkLoaded) {
        return;
      }

      // 2. If signed in with Clerk
      if (isSignedIn && clerkUser) {
        setIsDemoMode(false);
        try {
          const clerkToken = await getToken();
          if (!isMounted) return;

          if (clerkToken) {
            setToken(clerkToken);
            localStorage.setItem('token', clerkToken);
          }

          const formattedUser = {
            id: clerkUser.id,
            fullName: clerkUser.fullName || clerkUser.firstName || clerkUser.username || (clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0]) || 'Physician',
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            avatar: clerkUser.imageUrl || null,
          };
          setUser(formattedUser);

          // Sync with backend /me and /settings
          if (clerkToken) {
            try {
              const res = await fetch(`${API_BASE}/me`, {
                headers: { 'Authorization': `Bearer ${clerkToken}` }
              });
              if (res.ok) {
                const dbUser = await res.json();
                if (isMounted) setUser(prev => ({ ...prev, ...dbUser }));
              }
            } catch (err) {
              console.warn('Backend /me sync notice:', err.message);
            }

            try {
              const sRes = await fetch(`${API_BASE}/settings`, {
                headers: { 'Authorization': `Bearer ${clerkToken}` }
              });
              if (sRes.ok) {
                const sData = await sRes.json();
                if (isMounted) setSettings(sData);
              }
            } catch (err) {
              console.warn('Backend /settings sync notice:', err.message);
            }
          }
        } catch (err) {
          console.error('Clerk session token error:', err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
        // 3. Not signed in and not demo
        setToken(null);
        setUser(null);
        setSettings({});
        setIsDemoMode(false);
        localStorage.removeItem('token');
        setIsLoading(false);
      }
    }

    syncAuth();

    return () => {
      isMounted = false;
    };
  }, [isClerkLoaded, isSignedIn, clerkUser, token, getToken]);

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
