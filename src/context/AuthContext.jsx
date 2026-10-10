import React, { createContext, useState, useEffect } from 'react';
import API_BASE from '../config';

export const AuthContext = createContext();

const DEMO_TOKEN = 'DEMO_MODE';
const DEMO_USER = {
  id: 'demo-user',
  fullName: 'Demo User',
  email: 'demo@neuromed.ai',
  avatar: null,
};
const DEMO_SETTINGS = {
  saveHistory: false,
  emailNotifications: false,
  timezone: 'Asia/Karachi',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (token === DEMO_TOKEN) {
      // Demo mode — no API calls
      setUser(DEMO_USER);
      setSettings(DEMO_SETTINGS);
      setIsDemoMode(true);
      setIsLoading(false);
    } else if (token) {
      localStorage.setItem('token', token);
      setIsDemoMode(false);
      fetchUser();
      fetchSettings();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setSettings({});
      setIsDemoMode(false);
      setIsLoading(false);
    }
  }, [token]);

  async function fetchUser() {
    try {
      const response = await fetch(`${API_BASE}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to fetch user', err);
      // If backend is unreachable and we have a token, clear it
      setToken(null);
    }
  };

  async function fetchSettings() {
    try {
      const response = await fetch(`${API_BASE}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    if (isDemoMode) {
      // Demo mode — just update in memory
      setSettings(prev => ({ ...prev, ...newSettings }));
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
    // Bypass all API calls — set demo token which triggers demo branch in useEffect
    localStorage.setItem('token', DEMO_TOKEN);
    setToken(DEMO_TOKEN);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, loginDemo, logout, isLoading, settings, updateSettings, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};
