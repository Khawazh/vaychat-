import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireAdmin, type AuthRequest } from '../../middleware/auth.js';
import { paramId } from '../../utils/params.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/users', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 20;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          username: true,
          displayName: true,
          role: true,
          isBanned: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
    ]);
    res.json({ users, total, page });
  } catch (e) {
    next(e);
  }
});

router.post('/users/:id/ban', async (req: AuthRequest, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: paramId(req.params.id) },
      data: { isBanned: true, bannedAt: new Date(), banReason: reason },
    });
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'BAN_USER',
        targetId: user.id,
        metadata: { reason },
        ipAddress: String(req.ip ?? ''),
      },
    });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

router.post('/users/:id/unban', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: paramId(req.params.id) },
      data: { isBanned: false, bannedAt: null, banReason: null },
    });
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'UNBAN_USER',
        targetId: user.id,
        ipAddress: String(req.ip ?? ''),
      },
    });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

router.get('/logs', async (_req, res, next) => {
  try {
    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ logs });
  } catch (e) {
    next(e);
  }
});

router.get('/analytics', async (_req, res, next) => {
  try {
    const [users, chats, messages, online] = await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.user.count({ where: { status: 'ONLINE' } }),
    ]);
    res.json({
      users,
      chats,
      messages,
      onlineUsers: online,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
