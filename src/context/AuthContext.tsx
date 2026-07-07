import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTokens, clearTokens, saveTokens, saveDriverId, getDriverId, saveAvailability } from '../core/storage/storage';
import api, { onAuthExpired } from '../core/api/client';
import type { LoginResponse } from '../core/api/types';
import { useLocationTracking } from '../features/location/hooks/useLocationTracking';
import { registerFcmToken } from '../core/notifications/registerFcmToken';
import messaging from '@react-native-firebase/messaging';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  driverId: string | null;
  availability: boolean;
  isTracking: boolean;
  mustChangePassword: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvailability: (available: boolean) => void;
  setAvailability: (available: boolean) => Promise<void>;
  clearMustChangePassword: () => void;
  registerFcmNavigationHandler: (handler: (orderId: string, isAuthenticated: boolean) => void) => () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let fcmNavigationHandler: ((orderId: string, isAuthenticated: boolean) => void) | null = null;
let fcmDeepLinkingInitialized = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    driverId: null,
    availability: false,
    isTracking: false,
    mustChangePassword: false,
  });

  const { isTracking } = useLocationTracking(state.isAuthenticated);

  useEffect(() => {
    setState((prev) => ({ ...prev, isTracking }));
  }, [isTracking]);

  useEffect(() => {
    checkAuth();
    const unsub = onAuthExpired(() => {
      setState({ isLoading: false, isAuthenticated: false, driverId: null, availability: false, isTracking: false, mustChangePassword: false });
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
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isAuthenticated: true,
              driverId: data.driverId,
              availability: data.availability,
              mustChangePassword: data.mustChangePassword ?? false,
            }));
            registerFcmToken();
            setupFcmDeepLinking();
            return;
          }
        } catch {
          await clearTokens();
        }
      }
    } catch {}
    setState({ isLoading: false, isAuthenticated: false, driverId: null, availability: false, isTracking: false, mustChangePassword: false });
  }

  const login = useCallback(async (email: string, password: string) => {
    if (__DEV__) console.log('[Auth] Login attempt:', email);
    const response = await api.post('/auth/login', { email, password });
    if (__DEV__) console.log('[Auth] Login response:', JSON.stringify(response.data));
    const data = response.data?.data as LoginResponse;
    if (!data) throw new Error('Login failed: no data in response');

    await saveTokens(data.token, data.refreshToken);
    await saveDriverId(data.driverId);
    await saveAvailability(data.availability);

    setState((prev) => ({
      ...prev,
      isLoading: false,
      isAuthenticated: true,
      driverId: data.driverId,
      availability: data.availability,
      mustChangePassword: data.mustChangePassword ?? false,
    }));
    if (__DEV__) console.log('[Auth] Login successful, driverId:', data.driverId);

    registerFcmToken();
    setupFcmDeepLinking();
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    await clearTokens();
    setState({ isLoading: false, isAuthenticated: false, driverId: null, availability: false, isTracking: false, mustChangePassword: false });
  }, []);

  const setAvailability = useCallback(async (available: boolean) => {
    await api.patch('/driver/availability', { availability: available });
    await saveAvailability(available);
    setState((prev) => ({ ...prev, availability: available }));
  }, []);

  const updateAvailability = useCallback((available: boolean) => {
    setState((prev) => ({ ...prev, availability: available }));
  }, []);

    function registerFcmNavigationHandler(handler: (orderId: string, isAuthenticated: boolean) => void) {
    fcmNavigationHandler = handler;
    return () => {
      if (fcmNavigationHandler === handler) {
        fcmNavigationHandler = null;
      }
    };
  }

  const clearMustChangePassword = useCallback(() => {
    setState((prev) => ({ ...prev, mustChangePassword: false }));
  }, []);

  function extractOrderId(data: Record<string, any> | undefined): string | null {
    if (!data) return null;
    const type = data.type as string | undefined;
    const orderId = data.orderId as string | undefined;
    const deliveryTypes = ['delivery_assigned', 'delivery_status', 'delivery_retry', 'delivery_failed', 'delivery_failed_permanent'];
    if (type && deliveryTypes.includes(type) && orderId) {
      return orderId;
    }
    return null;
  }

  function setupFcmDeepLinking() {
    if (fcmDeepLinkingInitialized) return;
    fcmDeepLinkingInitialized = true;

    try {
      const unsubOnOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
        const orderId = extractOrderId(remoteMessage.data as Record<string, any>);
        const handler = fcmNavigationHandler;
        if (!orderId || !handler) return;
        handler(orderId, state.isAuthenticated);
      });

      messaging().getInitialNotification().then((remoteMessage) => {
        if (remoteMessage) {
          const orderId = extractOrderId(remoteMessage.data as Record<string, any>);
          const handler = fcmNavigationHandler;
          if (orderId && handler) {
            setTimeout(() => {
              handler(orderId, state.isAuthenticated);
            }, 500);
          }
        }
      }).catch(() => {});

      return () => unsubOnOpened();
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateAvailability, setAvailability, clearMustChangePassword, registerFcmNavigationHandler }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
