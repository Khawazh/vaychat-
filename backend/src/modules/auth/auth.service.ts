import { prisma } from '../../lib/prisma.js';
import { getCache } from '../../lib/cache.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateOtpCode, normalizePhone } from '../../utils/otp.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshExpiry,
} from '../../utils/jwt.js';
import bcrypt from 'bcryptjs';

const OTP_RATE_KEY = (phone: string) => `otp:rate:${phone}`;

export class AuthService {
  async sendOtp(phone: string): Promise<{ message: string; expiresIn: number }> {
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) {
      throw new AppError(400, 'Invalid phone number');
    }

    const cache = getCache();
    const rateKey = OTP_RATE_KEY(normalized);
    const attempts = await cache.incr(rateKey);
    if (attempts === 1) await cache.expire(rateKey, 3600);
    if (attempts > 5) {
      throw new AppError(429, 'Too many OTP requests. Try again later.');
    }

    const code = generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + env.OTP_EXPIRES_MINUTES);

    await prisma.otpCode.create({
      data: { phone: normalized, code, expiresAt },
    });

    if (env.NODE_ENV === 'development') {
      console.log(`[OTP] ${normalized} → ${code}`);
    }

    return {
      message: 'OTP sent',
      expiresIn: env.OTP_EXPIRES_MINUTES * 60,
    };
  }

  async verifyOtp(
    phone: string,
    code: string,
    deviceName: string,
    deviceType?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const normalized = normalizePhone(phone);

    const otp = await prisma.otpCode.findFirst({
      where: {
        phone: normalized,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new AppError(400, 'OTP expired or not found');

    if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
      throw new AppError(429, 'Too many attempts');
    }

    if (otp.code !== code) {
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError(400, 'Invalid OTP code');
    }

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    let user = await prisma.user.findUnique({ where: { phone: normalized } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalized, displayName: `User ${normalized.slice(-4)}` },
      });
    }

    if (user.isBanned) throw new AppError(403, 'Account banned');

    const refreshTokenRaw = crypto.randomUUID() + crypto.randomUUID();
    const refreshTokenHash = await bcrypt.hash(refreshTokenRaw, 10);

    const session = await prisma.deviceSession.create({
      data: {
        userId: user.id,
        deviceName,
        deviceType,
        refreshToken: refreshTokenHash,
        ipAddress,
        userAgent,
        expiresAt: getRefreshExpiry(),
      },
    });

    const tokenPayload = { userId: user.id, sessionId: session.id };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ONLINE', lastSeenAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        status: user.status,
      },
      accessToken,
      refreshToken,
      sessionId: session.id,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, 'Invalid refresh token');
    }

    const session = await prisma.deviceSession.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AppError(401, 'Session expired');
    }

    if (session.user.isBanned) throw new AppError(403, 'Account banned');

    const accessToken = signAccessToken({
      userId: payload.userId,
      sessionId: payload.sessionId,
    });

    return { accessToken };
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    await prisma.deviceSession.deleteMany({
      where: { id: sessionId, userId },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'OFFLINE', lastSeenAt: new Date() },
    });
  }

  async getSessions(userId: string) {
    return prisma.deviceSession.findMany({
      where: { userId },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });
  }
}

export const authService = new AuthService();
