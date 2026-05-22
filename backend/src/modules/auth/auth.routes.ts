import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { authenticate } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Регистрация
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, displayName } = z
      .object({
        username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
        password: z.string().min(6),
        displayName: z.string().min(1).max(64).optional(),
      })
      .parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { username },
    });
    if (existing) throw new AppError(409, 'Username already taken');

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        phone: '', // телефон больше не нужен
        passwordHash: hashed,
        displayName: displayName || username,
        status: 'ONLINE',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
      },
    });

    const accessToken = jwt.sign({ userId: user.id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (e) {
    next(e);
  }
});

// Вход
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = z
      .object({
        username: z.string(),
        password: z.string(),
      })
      .parse(req.body);

    const user = await prisma.user.findFirst({
      where: { username },
    });
    if (!user || !user.passwordHash) throw new AppError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    const accessToken = jwt.sign({ userId: user.id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
      accessToken,
      refreshToken,
    });
  } catch (e) {
    next(e);
  }
});

// Старые маршруты (OTP) можно удалить или оставить, но мы оставим для совместимости
router.get('/otp/dev', async (req, res, next) => { /* ... старый код ... */ });
router.post('/otp/send', async (req, res, next) => { /* ... */ });
router.post('/otp/verify', async (req, res, next) => { /* ... */ });

export default router;
