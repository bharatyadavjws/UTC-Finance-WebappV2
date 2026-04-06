import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null);
  const [token,           setToken]           = useState(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      const savedToken = authService.getToken();

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authService.me(savedToken);
        setUser(userData);
        setToken(savedToken);
        setIsAuthenticated(true);
      } catch {
        authService.removeToken();
      } finally {
        setIsLoading(false);
      }
    }

    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    authService.saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      const savedToken = authService.getToken();
      if (savedToken) await authService.logout(savedToken);
    } catch {}
    authService.removeToken();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
  }), [user, token, isLoading, isAuthenticated, login, logout]);

  // Show nothing while checking auth — prevents blank white screen
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        color: '#6b7280',
        fontWeight: '600',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}