import { CacheError } from '@/lib/errors';
import { getLogger, logCacheOperation } from '@/lib/logger';
import { Redis } from '@upstash/redis';

const logger = getLogger('redis-cache');

let redisClient: Redis | null = null;

/**
 * Initialize Redis client
 */
export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logger.warn('Redis credentials not configured, caching will be disabled');
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });

    logger.info('Redis client initialized');
    return redisClient;
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Redis client');
    return null;
  }
}

/**
 * Redis cache service
 */
export class RedisCache {
  private redis: Redis | null;
  private prefix: string;

  constructor(prefix = 'ytw') {
    this.redis = getRedisClient();
    this.prefix = prefix;
  }

  /**
   * Generate cache key with prefix and deployment ID
   */
  private getKey(key: string, deploymentId?: string): string {
    if (deploymentId) {
      return `${this.prefix}:${deploymentId}:${key}`;
    }
    return `${this.prefix}:${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, deploymentId?: string): Promise<T | null> {
    if (!this.redis) return null;

    const fullKey = this.getKey(key, deploymentId);

    try {
      const value = await this.redis.get<T>(fullKey);
      logCacheOperation(value ? 'hit' : 'miss', fullKey);
      return value;
    } catch (error) {
      logger.error({ error, key: fullKey }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl = 3600, deploymentId?: string): Promise<void> {
    if (!this.redis) return;

    const fullKey = this.getKey(key, deploymentId);

    try {
      await this.redis.setex(fullKey, ttl, JSON.stringify(value));
      logCacheOperation('set', fullKey, { ttl });
    } catch (error) {
      logger.error({ error, key: fullKey }, 'Cache set error');
      throw new CacheError('Failed to set cache value', 'set');
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, deploymentId?: string): Promise<void> {
    if (!this.redis) return;

    const fullKey = this.getKey(key, deploymentId);

    try {
      await this.redis.del(fullKey);
      logCacheOperation('delete', fullKey);
    } catch (error) {
      logger.error({ error, key: fullKey }, 'Cache delete error');
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string, deploymentId?: string): Promise<void> {
    if (!this.redis) return;

    const fullPattern = this.getKey(pattern, deploymentId);

    try {
      const keys = await this.redis.keys(fullPattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logCacheOperation('delete', fullPattern, { count: keys.length });
      }
    } catch (error) {
      logger.error({ error, pattern: fullPattern }, 'Cache delete pattern error');
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, deploymentId?: string): Promise<boolean> {
    if (!this.redis) return false;

    const fullKey = this.getKey(key, deploymentId);

    try {
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      logger.error({ error, key: fullKey }, 'Cache exists error');
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 3600,
    deploymentId?: string
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key, deploymentId);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const value = await fetcher();

    // Store in cache
    await this.set(key, value, ttl, deploymentId);

    return value;
  }

  /**
   * Increment counter
   */
  async increment(key: string, deploymentId?: string): Promise<number> {
    if (!this.redis) return 0;

    const fullKey = this.getKey(key, deploymentId);

    try {
      return await this.redis.incr(fullKey);
    } catch (error) {
      logger.error({ error, key: fullKey }, 'Cache increment error');
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number }> {
    if (!this.redis) return { keys: 0 };

    try {
      const keys = await this.redis.keys(`${this.prefix}:*`);
      return { keys: keys.length };
    } catch (error) {
      logger.error({ error }, 'Failed to get cache stats');
      return { keys: 0 };
    }
  }
}

// Export singleton instance
export const cache = new RedisCache();
