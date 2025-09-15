import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(baseUrl: string) {
  if (!socket) {
    socket = io(baseUrl, { transports: ['websocket'], path: '/socket.io' });
  }
  return socket;
}
