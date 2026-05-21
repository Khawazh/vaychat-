import type { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { getCache } from '../lib/cache.js';
import { messagesService } from '../modules/messages/messages.service.js';
import { SocketEvents } from './events.js';
import type { TokenPayload } from '../utils/jwt.js';

const TYPING_KEY = (chatId: string, userId: string) => `typing:${chatId}:${userId}`;
const ONLINE_KEY = 'users:online';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  sessionId?: string;
}

export function setupSocketHandlers(io: Server): void {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication required'));

      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, isBanned: true },
      });

      if (!user || user.isBanned) return next(new Error('Access denied'));

      socket.userId = payload.userId;
      socket.sessionId = payload.sessionId;
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    // Персональная комната для уведомлений (chat:added и др.)
    socket.join(`user:${userId}`);

    const cache = getCache();
    await cache.sadd(ONLINE_KEY, userId);
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ONLINE', lastSeenAt: new Date() },
    });
    socket.broadcast.emit(SocketEvents.USER_ONLINE, { userId });

    socket.on(SocketEvents.JOIN_CHAT, async (chatId: string) => {
      // Просто присоединяемся, если есть членство, без ошибок
      const member = await prisma.chatMember.findUnique({
        where: { chatId_userId: { chatId, userId } },
      });
      if (member) {
        socket.join(`chat:${chatId}`);
      }
    });

    socket.on(SocketEvents.LEAVE_CHAT, (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on(
      SocketEvents.SEND_MESSAGE,
      async (payload: {
        chatId: string;
        content?: string;
        encryptedContent?: string;
        replyToId?: string;
        type?: string;
      }) => {
        try {
          const message = await messagesService.sendMessage(payload.chatId, userId, {
            content: payload.content,
            encryptedContent: payload.encryptedContent,
            replyToId: payload.replyToId,
            type: payload.type as never,
          });

          io.to(`chat:${payload.chatId}`).emit(SocketEvents.MESSAGE_NEW, message);
        } catch (err) {
          // Не отправляем ошибку "Not a member" – просто игнорируем
          if (err instanceof Error && err.message === 'Not a member') return;
          socket.emit(SocketEvents.ERROR, {
            message: err instanceof Error ? err.message : 'Send failed',
          });
        }
      }
    );

    socket.on(SocketEvents.TYPING_START, async ({ chatId }: { chatId: string }) => {
      const key = TYPING_KEY(chatId, userId);
      await getCache().setex(key, 5, '1');
      socket.to(`chat:${chatId}`).emit(SocketEvents.TYPING_UPDATE, {
        chatId,
        userId,
        isTyping: true,
      });
    });

    socket.on(SocketEvents.TYPING_STOP, async ({ chatId }: { chatId: string }) => {
      await getCache().del(TYPING_KEY(chatId, userId));
      socket.to(`chat:${chatId}`).emit(SocketEvents.TYPING_UPDATE, {
        chatId,
        userId,
        isTyping: false,
      });
    });

    socket.on(
      SocketEvents.MARK_READ,
      async ({ messageIds }: { messageIds: string[] }) => {
        await messagesService.markAsRead(messageIds, userId);
        for (const id of messageIds) {
          const msg = await prisma.message.findUnique({
            where: { id },
            select: { chatId: true },
          });
          if (msg) {
            io.to(`chat:${msg.chatId}`).emit(SocketEvents.MESSAGE_READ, {
              messageIds,
              userId,
              readAt: new Date(),
            });
          }
        }
      }
    );

    socket.on('disconnect', async () => {
      await getCache().srem(ONLINE_KEY, userId);
      const sockets = await io.fetchSockets();
      const hasOtherSocket = sockets.some(
        (s) => (s.data as { userId?: string }).userId === userId && s.id !== socket.id
      );

      if (!hasOtherSocket) {
        await prisma.user.update({
          where: { id: userId },
          data: { status: 'OFFLINE', lastSeenAt: new Date() },
        });
        socket.broadcast.emit(SocketEvents.USER_OFFLINE, { userId });
      }
    });
  });
}
