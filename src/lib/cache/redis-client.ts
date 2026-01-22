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
 * Redis cache service with in-memory fallback
 */
export class RedisCache {
  private redis: Redis | null;
  private prefix: string;
  private memoryCache: Map<string, { value: any; expires: number }>;

  constructor(prefix = 'ytw') {
    this.redis = getRedisClient();
    this.prefix = prefix;
    this.memoryCache = new Map();
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
    const fullKey = this.getKey(key, deploymentId);

    if (this.redis) {
      try {
        const value = await this.redis.get<T>(fullKey);
        logCacheOperation(value ? 'hit' : 'miss', fullKey);
        return value;
      } catch (error) {
        logger.error({ error, key: fullKey }, 'Cache get error');
        // Fallback to memory if redis fails
      }
    }

    // Memory fallback
    const cached = this.memoryCache.get(fullKey);
    if (cached) {
      if (Date.now() < cached.expires) {
        logCacheOperation('hit (memory)', fullKey);
        return cached.value;
      }
      this.memoryCache.delete(fullKey);
    }

    logCacheOperation('miss', fullKey);
    return null;
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl = 3600, deploymentId?: string): Promise<void> {
    const fullKey = this.getKey(key, deploymentId);

    if (this.redis) {
      try {
        await this.redis.setex(fullKey, ttl, JSON.stringify(value));
        logCacheOperation('set', fullKey, { ttl });
      } catch (error) {
        logger.error({ error, key: fullKey }, 'Cache set error');
        // Still set in memory even if redis fails
      }
    }

    // Always set in memory as secondary/primary cache
    this.memoryCache.set(fullKey, {
      value,
      expires: Date.now() + ttl * 1000
    });

    // Cleanup memory cache if it gets too large
    if (this.memoryCache.size > 1000) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, deploymentId?: string): Promise<void> {
    const fullKey = this.getKey(key, deploymentId);

    if (this.redis) {
      try {
        await this.redis.del(fullKey);
        logCacheOperation('delete', fullKey);
      } catch (error) {
        logger.error({ error, key: fullKey }, 'Cache delete error');
      }
    }

    this.memoryCache.delete(fullKey);
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string, deploymentId?: string): Promise<void> {
    const fullPattern = this.getKey(pattern, deploymentId);

    if (this.redis) {
      try {
        const keys = await this.redis.keys(fullPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          logCacheOperation('delete (pattern)', fullPattern, { count: keys.length });
        }
      } catch (error) {
        logger.error({ error, pattern: fullPattern }, 'Cache delete pattern error');
      }
    }

    // Memory cleanup for pattern (limited simple implementation)
    const regexPattern = new RegExp('^' + fullPattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryCache.keys()) {
      if (regexPattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, deploymentId?: string): Promise<boolean> {
    const fullKey = this.getKey(key, deploymentId);

    if (this.redis) {
      try {
        const result = await this.redis.exists(fullKey);
        return result === 1;
      } catch (error) {
        logger.error({ error, key: fullKey }, 'Cache exists error');
      }
    }

    const cached = this.memoryCache.get(fullKey);
    return !!(cached && Date.now() < cached.expires);
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
    const fullKey = this.getKey(key, deploymentId);

    if (this.redis) {
      try {
        return await this.redis.incr(fullKey);
      } catch (error) {
        logger.error({ error, key: fullKey }, 'Cache increment error');
      }
    }

    // Simple memory increment
    const cached = this.memoryCache.get(fullKey);
    const newValue = (cached ? Number(cached.value) : 0) + 1;
    this.memoryCache.set(fullKey, {
      value: newValue,
      expires: Date.now() + 3600 * 1000 // Default 1h
    });
    return newValue;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memoryKeys: number }> {
    let redisKeys = 0;
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`${this.prefix}:*`);
        redisKeys = keys.length;
      } catch (error) {
        logger.error({ error }, 'Failed to get cache stats');
      }
    }

    return {
      keys: redisKeys,
      memoryKeys: this.memoryCache.size
    };
  }
}

// Export singleton instance
export const cache = new RedisCache();
