import { MessageType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { chatsService } from '../chats/chats.service.js';

export class MessagesService {
  async getMessages(chatId: string, userId: string, cursor?: string, limit = 50) {
    await chatsService.assertMember(chatId, userId);

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        replyTo: {
          select: { id: true, content: true, sender: { select: { displayName: true } } },
        },
        reactions: { include: { user: { select: { id: true, displayName: true } } } },
        reads: { where: { userId }, select: { readAt: true } },
      },
    });

    return messages.reverse();
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    data: {
      type?: MessageType;
      content?: string;
      encryptedContent?: string;
      mediaUrl?: string;
      replyToId?: string;
      forwardedFromId?: string;
    }
  ) {
    await chatsService.assertMember(chatId, senderId);

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        type: data.type ?? MessageType.TEXT,
        content: data.content,
        encryptedContent: data.encryptedContent,
        mediaUrl: data.mediaUrl,
        replyToId: data.replyToId,
        forwardedFromId: data.forwardedFromId,
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        replyTo: true,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.senderId !== userId) throw new AppError(403, 'Cannot edit this message');
    if (msg.deletedAt) throw new AppError(400, 'Message deleted');

    if (msg.content) {
      await prisma.messageEditHistory.create({
        data: { messageId, content: msg.content },
      });
    }

    return prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true, editedAt: new Date() },
      include: { sender: { select: { id: true, displayName: true } } },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.senderId !== userId) throw new AppError(403, 'Cannot delete this message');

    return prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: null },
    });
  }

  async markAsRead(messageIds: string[], userId: string) {
    await Promise.all(
      messageIds.map((messageId) =>
        prisma.messageRead.upsert({
          where: { messageId_userId: { messageId, userId } },
          create: { messageId, userId },
          update: {},
        })
      )
    );
    return { read: messageIds.length };
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    return prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      create: { messageId, userId, emoji },
      update: {},
      include: { user: { select: { id: true, displayName: true } } },
    });
  }

  async pinMessage(chatId: string, messageId: string, userId: string) {
    await chatsService.assertMember(chatId, userId);
    return prisma.pinnedMessage.upsert({
      where: { chatId_messageId: { chatId, messageId } },
      create: { chatId, messageId, pinnedById: userId },
      update: { pinnedAt: new Date() },
      include: { message: true },
    });
  }
}

export const messagesService = new MessagesService();
