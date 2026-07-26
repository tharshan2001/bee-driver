import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getTokens, saveTokens } from '../storage/storage';
import axios from 'axios';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!WS_URL) throw new Error('[STOMP] Missing EXPO_PUBLIC_WS_URL in .env');
if (!API_URL) throw new Error('[STOMP] Missing EXPO_PUBLIC_API_URL in .env');

let client: Client | null = null;
let connectResolve: (() => void) | null = null;
let connectReject: ((err: Error) => void) | null = null;

async function getValidToken(): Promise<string | null> {
  try {
    const tokens = await getTokens();
    if (tokens?.accessToken) return tokens.accessToken;
    const refreshed = await refreshAccessToken();
    return refreshed;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
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
  }
}

export async function connect(): Promise<void> {
  if (client?.connected) {
    return Promise.resolve();
  }

  if (client) {
    client.deactivate();
    client = null;
  }

  const token = await getValidToken();
  if (!token) {
    if (__DEV__) console.warn('[STOMP] No valid auth token, cannot connect');
    throw new Error('No valid auth token');
  }
  if (__DEV__) console.log('[STOMP] Token obtained, connecting to', WS_URL);

  const newClient = new Client({
    webSocketFactory: () => {
      if (__DEV__) console.log('[STOMP] Creating SockJS connection to', 'https://ebee.lk/ws');
      return new SockJS('https://ebee.lk/ws') as any;
    },
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  newClient.configure({
    onConnect: () => {
      if (__DEV__) console.log('[STOMP] Connected');
      if (timeoutId) clearTimeout(timeoutId);
      if (connectResolve) {
        connectResolve();
        connectResolve = null;
        connectReject = null;
      }
    },
    onStompError: (frame) => {
      console.error('[STOMP] STOMP error:', frame.headers['message'], frame.body);
      if (timeoutId) clearTimeout(timeoutId);
      if (connectReject) {
        connectReject(new Error('STOMP error: ' + (frame.headers['message'] || frame.body)));
        connectReject = null;
        connectResolve = null;
      }
    },
    onWebSocketClose: (evt) => {
      if (__DEV__) console.log('[STOMP] WebSocket closed:', evt?.code, evt?.reason);
      if (timeoutId) clearTimeout(timeoutId);
      if (connectReject) {
        connectReject(new Error('WebSocket closed'));
        connectReject = null;
        connectResolve = null;
      }
    },
    onWebSocketError: (evt) => {
      if (__DEV__) console.error('[STOMP] WebSocket error:', evt);
    },
  });

  timeoutId = setTimeout(() => {
    if (__DEV__) console.warn('[STOMP] Connection timeout after 15s');
    newClient.deactivate();
    if (connectReject) {
      connectReject(new Error('Connection timeout'));
      connectReject = null;
      connectResolve = null;
    }
  }, 15000);

  client = newClient;

  const connectPromise = new Promise<void>((resolve, reject) => {
    connectResolve = resolve;
    connectReject = reject;
  });

  if (__DEV__) console.log('[STOMP] Activating...');
  newClient.activate();

  return connectPromise;
}

export function disconnect(): void {
  if (client?.active) {
    client.deactivate();
  }
  client = null;
  connectResolve = null;
  connectReject = null;
}

export function sendLocation(payload: {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  bearing: number | null;
  speed: number | null;
}): boolean {
  const c = client;
  if (!c?.connected) {
    if (__DEV__) console.warn('[STOMP] sendLocation: not connected, dropped');
    return false;
  }

  try {
    c.publish({
      destination: '/app/driver-locations/update',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (__DEV__) console.log('[STOMP] Location sent:', payload.latitude.toFixed(5), payload.longitude.toFixed(5));
    return true;
  } catch (e) {
    if (__DEV__) console.warn('[STOMP] Failed to send location:', e);
    return false;
  }
}
