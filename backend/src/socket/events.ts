export const SocketEvents = {
  // Client → Server
  JOIN_CHAT: 'chat:join',
  LEAVE_CHAT: 'chat:leave',
  SEND_MESSAGE: 'message:send',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  MARK_READ: 'message:read',
  USER_STATUS: 'user:status',

  // Server → Client
  MESSAGE_NEW: 'message:new',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_READ: 'message:read:update',
  TYPING_UPDATE: 'typing:update',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  REACTION_ADDED: 'reaction:added',
  NOTIFICATION: 'notification',
  ERROR: 'error',
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];
