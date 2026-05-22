import { io, type Socket } from 'socket.io-client';
import { getApiUrl } from './api';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(getApiUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export const SocketEvents = {
  JOIN_CHAT: 'chat:join',
  SEND_MESSAGE: 'message:send',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  MESSAGE_NEW: 'message:new',
  TYPING_UPDATE: 'typing:update',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
} as const;
