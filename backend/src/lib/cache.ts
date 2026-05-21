import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { MemoryCache } from './memory-cache.js';

export type CacheClient = MemoryCache | Redis;

let cache: CacheClient | null = null;
let mode: 'redis' | 'memory' = 'memory';

export async function initCache(): Promise<CacheClient> {
  if (cache) return cache;

  if (process.env.USE_MEMORY_CACHE === 'true') {
    cache = new MemoryCache();
    mode = 'memory';
    console.log('[Cache] Using in-memory store (USE_MEMORY_CACHE=true)');
    return cache;
  }

  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    await redis.ping();
    cache = redis;
    mode = 'redis';
    console.log('[Cache] Connected to Redis');
    redis.on('error', (err: Error) => console.error('[Redis]', err.message));
    return cache;
  } catch {
    redis.disconnect();
    cache = new MemoryCache();
    mode = 'memory';
    console.warn('[Cache] Redis unavailable — using in-memory store (fine for local dev)');
    return cache;
  }
}

export function getCache(): CacheClient {
  if (!cache) throw new Error('Cache not initialized. Call initCache() first.');
  return cache;
}

export function isRedisMode(): boolean {
  return mode === 'redis';
}

export function getRedisClientsForSocket(): { pub: Redis; sub: Redis } | null {
  if (mode !== 'redis' || !(cache instanceof Redis)) return null;
  return { pub: cache.duplicate(), sub: cache.duplicate() };
}
