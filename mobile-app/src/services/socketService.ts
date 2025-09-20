import { io, Socket } from 'socket.io-client';
import { getItem } from '../utils/secureStore';
import { getWsBaseUrl } from '../config/env';

interface IncidentData {
  _id: string;
  type: string;
  severity: string;
  description?: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  userId: string;
  createdAt: string;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  async connect() {
    if (this.socket?.connected) return;

    const token = await getItem('token');
    
    /**
     * Resolve socket URL lazily so OTA updates or runtime override applies.
     */
    async function resolveSocketUrl(): Promise<string> {
      const base = await getWsBaseUrl();
      return base.replace(/^ws/, 'http'); // ensure http(s) for socket.io endpoint
    }

    const SOCKET_URL = await resolveSocketUrl();
    this.socket = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('📡 Socket connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('📡 Socket disconnected from server');
    });

    this.socket.on('incident', (data: IncidentData) => {
      console.log('🚨 New incident received:', data);
      this.emit('incident', data);
    });

    this.socket.on('panic_alert', (data: any) => {
      console.log('🆘 Panic alert received:', data);
      this.emit('panic_alert', data);
    });

    this.socket.on('alert_acknowledged', (data: any) => {
      console.log('✅ Alert acknowledged:', data);
      this.emit('alert_acknowledged', data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.listeners.has(event)) return;
    
    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.set(event, []);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;