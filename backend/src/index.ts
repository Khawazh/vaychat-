import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { initCache, getRedisClientsForSocket } from './lib/cache.js';
import { setupSocketHandlers } from './socket/handler.js';

async function bootstrap() {
  await initCache();

  const app = createApp();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(','),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });
  
  app.set('io', io);
  
  const redisPair = getRedisClientsForSocket();
  if (redisPair) {
    const { pub, sub } = redisPair;
    await Promise.all([pub.connect(), sub.connect()]);
    io.adapter(createAdapter(pub, sub));
    console.log('[Socket] Redis adapter enabled');
  } else {
    console.log('[Socket] Single-node mode (no Redis)');
  }

  setupSocketHandlers(io);

  const port = env.API_PORT;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`\n☀️  ВайЧат API running on http://localhost:${port}`);
    console.log(`   LAN:       http://<ваш-IP>:${port}`);
    console.log(`   WebSocket: ws://<ваш-IP>:${port}`);
    console.log(`   Environment: ${env.NODE_ENV}\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
