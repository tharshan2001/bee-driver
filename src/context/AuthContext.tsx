import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTokens, clearTokens, saveTokens, saveDriverId, getDriverId, saveAvailability } from '../core/storage/storage';
import api, { onAuthExpired } from '../core/api/client';
import type { LoginResponse } from '../core/api/types';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  driverId: string | null;
  availability: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvailability: (available: boolean) => void;
  setAvailability: (available: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    driverId: null,
    availability: false,
  });

  useEffect(() => {
    checkAuth();
    const unsub = onAuthExpired(() => {
      setState({ isLoading: false, isAuthenticated: false, driverId: null, availability: false });
    });
    return unsub;
  }, []);

  async function checkAuth() {
    try {
      const tokens = await getTokens();
      if (tokens?.refreshToken) {
        try {
          const response = await api.post('/auth/refresh', {
            refreshToken: tokens.refreshToken,
          });
          const data = response.data?.data as LoginResponse;
          if (data) {
            await saveTokens(data.token, data.refreshToken);
            await saveDriverId(data.driverId);
            await saveAvailability(data.availability);
            setState({
              isLoading: false,
              isAuthenticated: true,
              driverId: data.driverId,
              availability: data.availability,
            });
            return;
          }
        } catch {
          await clearTokens();
        }
      }
    } catch {}
    setState({ isLoading: false, isAuthenticated: false, driverId: null, availability: false });
  }

  const login = useCallback(async (email: string, password: string) => {
    console.log('[Auth] Login attempt:', email);
    const response = await api.post('/auth/login', { email, password });
    console.log('[Auth] Login response:', JSON.stringify(response.data));
    const data = response.data?.data as LoginResponse;
    if (!data) throw new Error('Login failed: no data in response');

    await saveTokens(data.token, data.refreshToken);
    await saveDriverId(data.driverId);
    await saveAvailability(data.availability);

    setState({
      isLoading: false,
      isAuthenticated: true,
      driverId: data.driverId,
      availability: data.availability,
    });
    console.log('[Auth] Login successful, driverId:', data.driverId);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    await clearTokens();
    setState({ isLoading: false, isAuthenticated: false, driverId: null, availability: false });
  }, []);

  const setAvailability = useCallback(async (available: boolean) => {
    await api.patch('/driver/availability', { availability: available });
    await saveAvailability(available);
    setState((prev) => ({ ...prev, availability: available }));
  }, []);

  const updateAvailability = useCallback((available: boolean) => {
    setState((prev) => ({ ...prev, availability: available }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateAvailability, setAvailability }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
