import { Router } from 'express';
import { z } from 'zod';
import { authService } from './auth.service.js';
import { authenticate, type AuthRequest } from '../../middleware/auth.js';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { normalizePhone } from '../../utils/otp.js';

const router = Router();

const sendOtpSchema = z.object({
  phone: z.string().min(10).max(20),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().length(6),
  deviceName: z.string().min(1).max(100),
  deviceType: z.string().optional(),
});

/** Dev only: показать последний OTP в UI (без консоли) */
router.get('/otp/dev', async (req, res, next) => {
  try {
    if (env.NODE_ENV !== 'development') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const phone = normalizePhone(z.string().min(10).parse(req.query.phone));
    const otp = await prisma.otpCode.findFirst({
      where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ code: otp?.code ?? null });
  } catch (e) {
    next(e);
  }
});

router.post('/otp/send', async (req, res, next) => {
  try {
    const body = sendOtpSchema.parse(req.body);
    const result = await authService.sendOtp(body.phone);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/otp/verify', async (req, res, next) => {
  try {
    const body = verifyOtpSchema.parse(req.body);
    const result = await authService.verifyOtp(
      body.phone,
      body.code,
      body.deviceName,
      body.deviceType,
      req.ip,
      req.headers['user-agent']
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const result = await authService.refreshTokens(refreshToken);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await authService.logout(req.user!.sessionId, req.user!.id);
    res.json({ message: 'Logged out' });
  } catch (e) {
    next(e);
  }
});

router.get('/sessions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const sessions = await authService.getSessions(req.user!.id);
    res.json({ sessions });
  } catch (e) {
    next(e);
  }
});

export default router;
