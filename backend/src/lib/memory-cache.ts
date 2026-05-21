/** In-memory cache when Redis is unavailable (local dev without Docker). */

interface Entry {
  value: string;
  expiresAt?: number;
}

export class MemoryCache {
  private store = new Map<string, Entry>();
  private sets = new Map<string, Set<string>>();

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    const n = entry ? parseInt(entry.value, 10) + 1 : 1;
    this.store.set(key, { value: String(n), expiresAt: entry?.expiresAt });
    return n;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
      this.store.set(key, entry);
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async sadd(key: string, member: string): Promise<void> {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    this.sets.get(key)!.add(member);
  }

  async srem(key: string, member: string): Promise<void> {
    this.sets.get(key)?.delete(member);
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.sets.get(key)?.has(member) ? 1 : 0;
  }

  duplicate(): MemoryCache {
    return this;
  }
}
