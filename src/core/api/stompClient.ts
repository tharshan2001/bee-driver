import { Client } from '@stomp/stompjs';
import { getTokens, saveTokens } from '../storage/storage';
import axios from 'axios';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!WS_URL) throw new Error('[STOMP] Missing EXPO_PUBLIC_WS_URL in .env');
if (!API_URL) throw new Error('[STOMP] Missing EXPO_PUBLIC_API_URL in .env');

let client: Client | null = null;
let connectPromise: Promise<void> | null = null;
let isRefreshing = false;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) return null;
  isRefreshing = true;
  try {
    const tokens = await getTokens();
    if (!tokens?.refreshToken) return null;
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: tokens.refreshToken,
    });
    const data = response.data?.data;
    if (!data) return null;
    await saveTokens(data.token, data.refreshToken);
    return data.token;
  } catch {
    return null;
  } finally {
    isRefreshing = false;
  }
}

async function getValidToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (tokens?.accessToken) return tokens.accessToken;
  return refreshAccessToken();
}

function createClient(): Client {
  const c = new Client({
    webSocketFactory: () => new WebSocket(WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    beforeConnect: async (cl) => {
      const token = await getValidToken();
      if (token) {
        cl.connectHeaders = { Authorization: `Bearer ${token}` };
      }
    },
    onConnect: () => {
      if (__DEV__) console.log('[STOMP] Connected');
    },
    onDisconnect: () => {
      if (__DEV__) console.log('[STOMP] Disconnected');
    },
    onStompError: (frame) => {
      console.error('[STOMP] Error:', frame.headers['message'], frame.body);
    },
  });
  return c;
}

export function connect(): Promise<void> {
  if (connectPromise) return connectPromise;

  if (!client) client = createClient();
  if (client.connected) return Promise.resolve();

  connectPromise = new Promise<void>((resolve, reject) => {
    let settled = false;

    client!.configure({
      onConnect: () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      },
      onStompError: (frame) => {
        if (!settled) {
          settled = true;
          connectPromise = null;
          client = null;
          reject(new Error(frame.headers['message'] || 'STOMP connection failed'));
        }
      },
      onWebSocketClose: () => {
        if (!settled) {
          settled = true;
          connectPromise = null;
          client = null;
        }
      },
    });
    client!.activate();
  });

  return connectPromise;
}

export function disconnect(): void {
  if (client?.active) {
    client.deactivate();
  }
  client = null;
  connectPromise = null;
}

export function sendLocation(payload: {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  bearing: number | null;
  speed: number | null;
}): boolean {
  const c = client;
  if (!c?.connected) return false;

  try {
    c.publish({
      destination: '/app/driver-locations/update',
      body: JSON.stringify(payload),
    });
    return true;
  } catch (e) {
    if (__DEV__) console.warn('[STOMP] Failed to send location:', e);
    return false;
  }
}
