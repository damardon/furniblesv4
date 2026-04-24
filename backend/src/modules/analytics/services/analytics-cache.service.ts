import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const CACHE_TTL = {
  SELLER_DASHBOARD: 300,    // 5 min — high traffic, mildly stale ok
  SELLER_REVENUE: 600,      // 10 min
  PLATFORM_OVERVIEW: 120,   // 2 min — admin view, fresher
  TOP_PERFORMERS: 300,      // 5 min
  HEALTH: 30,               // 30 s — near-realtime
} as const;

@Injectable()
export class AnalyticsCacheService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsCacheService.name);
  private client: Redis | null = null;
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set — analytics cache disabled');
      return;
    }
    try {
      this.client = new Redis(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
      this.client.on('ready', () => {
        this.enabled = true;
        this.logger.log('Analytics cache connected');
      });
      this.client.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}`);
        this.enabled = false;
      });
      this.client.connect().catch(() => {});
    } catch (err) {
      this.logger.warn(`Failed to init Redis: ${err.message}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // cache write failures are non-fatal
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // ignore
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // ignore
    }
  }

  buildKey(...parts: string[]): string {
    return `analytics:${parts.join(':')}`;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }
}
