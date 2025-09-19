import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentUrl: string | null = null;

export function getSocket(baseUrl: string) {
  // Force reconnection if URL changed or socket is disconnected
  if (socket && (!socket.connected || currentUrl !== baseUrl)) {
    console.log('Disconnecting existing socket for fresh connection');
    socket.disconnect();
    socket = null;
    currentUrl = null;
  }

  if (!socket) {
    console.log('Creating new socket connection to:', baseUrl);
    currentUrl = baseUrl;
    socket = io(baseUrl, { 
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      path: '/socket.io',
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      autoConnect: true,
      forceNew: true, // Force new connection
      withCredentials: false,
      upgrade: true,
    });

    // Add error handling
    socket.on('connect', () => {
      console.log('Dashboard socket connected to:', baseUrl);
    });

    socket.on('disconnect', (reason) => {
      console.log('Dashboard socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Dashboard socket connection error:', error);
    });

    socket.on('welcome', (data) => {
      console.log('Socket welcome message:', data);
    });

    socket.on('error', (error) => {
      console.error('Dashboard socket error:', error);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    console.log('Manually disconnecting socket');
    socket.disconnect();
    socket = null;
    currentUrl = null;
  }
}
