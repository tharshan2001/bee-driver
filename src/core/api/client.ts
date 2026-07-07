import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getTokens, saveTokens, clearTokens } from '../storage/storage';
import Constants from 'expo-constants';

type AuthListener = () => void;
let authListeners: AuthListener[] = [];

export function onAuthExpired(listener: AuthListener) {
  authListeners.push(listener);
  return () => { authListeners = authListeners.filter(l => l !== listener); };
}

function notifyAuthExpired() {
  authListeners.forEach(l => l());
}

const BASE_URL = ((Constants.expoConfig?.extra as Record<string, any>)?.apiBaseUrl as string) || 'https://ebee.lk/api';
if (__DEV__) console.log('[API] BASE_URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const excludedPaths = ['/auth/login', '/auth/refresh'];

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!excludedPaths.some((p) => config.url?.includes(p))) {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = await getTokens();
        if (!tokens?.refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        });

        const data = response.data?.data;
        if (!data) throw new Error('Refresh failed');

        await saveTokens(data.token, data.refreshToken);
        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        notifyAuthExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 400) {
      const message = (error.response?.data as any)?.message?.toLowerCase() || '';
      if (message.includes('suspended')) {
        await clearTokens();
        notifyAuthExpired();
      }
    }

    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (res) => {
    if (__DEV__) console.log(`[API] ${res.config?.method?.toUpperCase()} ${res.config?.url} → ${res.status}`);
    return res;
  },
  (err) => {
    if (__DEV__) console.log(`[API] ${err.config?.method?.toUpperCase()} ${err.config?.url} → ${err.response?.status || err.code || err.message}`, err.response?.data || '');
    return Promise.reject(err);
  }
);

export default api;
export { BASE_URL };
