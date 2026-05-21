import { ChatType, MemberRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ChatsService {
  async getUserChats(userId: string) {
    const memberships = await prisma.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    username: true,
                    avatarUrl: true,
                    status: true,
                    lastSeenAt: true,
                  },
                },
              },
            },
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { select: { id: true, displayName: true } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      id: m.chat.id,
      type: m.chat.type,
      title: m.chat.title,
      avatarUrl: m.chat.avatarUrl,
      isPinned: m.isPinned,
      members: m.chat.members.map((cm) => cm.user),
      lastMessage: m.chat.messages[0] ?? null,
      unreadCount: 0,
    }));
  }

  async createPrivateChat(userId: string, otherUserId: string) {
    if (userId === otherUserId) throw new AppError(400, 'Cannot chat with yourself');

    const existing = await prisma.chat.findFirst({
      where: {
        type: ChatType.PRIVATE,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: otherUserId } } },
        ],
      },
      include: { members: true },
    });

    if (existing && existing.members.length === 2) return existing;

    return prisma.chat.create({
      data: {
        type: ChatType.PRIVATE,
        members: {
          create: [
            { userId, role: MemberRole.MEMBER },
            { userId: otherUserId, role: MemberRole.MEMBER },
          ],
        },
      },
      include: { members: { include: { user: true } } },
    });
  }

  async createGroup(userId: string, title: string, memberIds: string[]) {
    const uniqueIds = [...new Set([userId, ...memberIds])];
    return prisma.chat.create({
      data: {
        type: ChatType.GROUP,
        title,
        members: {
          create: uniqueIds.map((id) => ({
            userId: id,
            role: id === userId ? MemberRole.OWNER : MemberRole.MEMBER,
          })),
        },
      },
      include: { members: { include: { user: true } } },
    });
  }

  async createChannel(userId: string, title: string, description?: string) {
    return prisma.chat.create({
      data: {
        type: ChatType.CHANNEL,
        title,
        description,
        isPublic: true,
        members: {
          create: { userId, role: MemberRole.OWNER },
        },
      },
    });
  }

  async getChat(chatId: string, userId: string) {
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new AppError(403, 'Not a member of this chat');

    return prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: { include: { user: true } },
        pinned: { include: { message: true } },
      },
    });
  }

  async searchChats(userId: string, query: string) {
    const memberships = await prisma.chatMember.findMany({
      where: {
        userId,
        chat: {
          OR: [
            { title: { contains: query } },
            { messages: { some: { content: { contains: query } } } },
          ],
        },
      },
      include: { chat: true },
      take: 20,
    });
    return memberships.map((m) => m.chat);
  }

  async assertMember(chatId: string, userId: string) {
    const m = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!m) throw new AppError(403, 'Not a member');
    return m;
  }

  async leaveChat(chatId: string, userId: string) {
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (member) {
      await prisma.chatMember.delete({ where: { id: member.id } });
    }
  }

  async addMember(chatId: string, requesterId: string, userId: string) {
    const requester = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId: requesterId } },
    });
    if (!requester || requester.role !== 'OWNER') throw new AppError(403, 'Only owner can add members');

    const existing = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (existing) throw new AppError(409, 'User is already a member');

    return prisma.chatMember.create({
      data: { chatId, userId, role: 'MEMBER' },
    });
  }
}

export const chatsService = new ChatsService();
