import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import chatsRoutes from './modules/chats/chats.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.NODE_ENV === 'development') {
          const ok =
            /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(
              origin
            );
          return callback(null, ok);
        }
        const allowed = env.CORS_ORIGIN.split(',').map((s) => s.trim());
        callback(null, allowed.includes(origin));
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  app.use(express.json({ limit: '10mb' }));

  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'vaychat-api', version: '0.1.0' });
  });

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/chats', chatsRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(errorHandler);

  return app;
}
