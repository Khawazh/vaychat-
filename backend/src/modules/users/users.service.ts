import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new AppError(404, 'User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      username?: string;
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
    }
  ) {
    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: { username: data.username, NOT: { id: userId } },
      });
      if (existing) throw new AppError(409, 'Username already taken');
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        status: true,
      },
    });
  }

async getAllUsers(requesterId: string) {
  return prisma.user.findMany({
    where: {
      id: { not: requesterId },
      isBanned: false,
    },
    select: {
      id: true,
      phone: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      status: true,
      lastSeenAt: true,
    },
    orderBy: { lastSeenAt: 'desc' },
    take: 50,
  });
}

  async searchUsers(query: string, limit = 20) {
    return prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { displayName: { contains: query } },
          { phone: { contains: query } },
        ],
        isBanned: false,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        lastSeenAt: true,
      },
      take: limit,
    });
  }

  async getUserById(userId: string, _requesterId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        status: true,
        lastSeenAt: true,
      },
    });
    if (!user) throw new AppError(404, 'User not found');
    return user;
  }
}

export const usersService = new UsersService();
