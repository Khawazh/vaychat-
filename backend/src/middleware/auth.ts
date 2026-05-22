import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../utils/jwt.js';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    sessionId: string;
    role: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const token = header.slice(7);
    const payload: TokenPayload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isBanned: true },
    });

    if (!user || user.isBanned) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    req.user = {
      id: user.id,
      sessionId: payload.sessionId,
      role: user.role,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MODERATOR') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
