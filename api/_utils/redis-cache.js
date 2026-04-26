// Suppress DEP0169 deprecation warning from dependencies


import Redis from 'ioredis';

/**
 * Redis Cache Manager
 * Handles caching for templates, static data, and frequently accessed data
 */
class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't retry — fail fast in serverless
        reconnectOnError: () => false, // Don't reconnect in serverless
        connectTimeout: 3000, // 3 second connection timeout
        lazyConnect: true, // Don't connect immediately — connect on first command
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        // Only log if Redis URL is explicitly set (not localhost fallback)
        if (process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost')) {
          console.error('❌ Redis error:', err.message);
        }
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('⚠️ Redis connection closed');
        this.isConnected = false;
      });

      // Test connection with timeout
      try {
        await Promise.race([
          this.client.ping(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis ping timeout')), 2000)
          )
        ]);
        this.isConnected = true;
        return this.client;
      } catch (pingError) {
        // Ping failed, mark as disconnected but don't throw
        this.isConnected = false;
        this.client = null;
        return null;
      }
    } catch (error) {
      // Redis connection failed - graceful degradation
      this.isConnected = false;
      this.client = null;
      // Don't log as error if Redis URL is localhost (expected in dev)
      if (process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost')) {
        console.error('❌ Failed to initialize Redis:', error.message);
      }
      return null;
    }
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      await this.initialize();
      if (!this.isConnected || !this.client) {
        return null; // Redis not available, return null
      }
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
   */
  async set(key, value, ttl = 3600) {
    if (!this.isConnected || !this.client) {
      await this.initialize();
      if (!this.isConnected || !this.client) {
        return false; // Redis not available
      }
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached value
   * @param {string} key - Cache key
   */
  async delete(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear() {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      try {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        console.log('✅ Redis connection closed');
      } catch (error) {
        console.error('Error closing Redis connection:', error);
      }
    }
  }
}

// Singleton instance
let redisCacheInstance = null;

/**
 * Get Redis cache instance (singleton)
 */
export function getRedisCache() {
  if (!redisCacheInstance) {
    redisCacheInstance = new RedisCache();
  }
  return redisCacheInstance;
}

/**
 * Initialize Redis cache (call this on server startup)
 */
export async function initializeRedisCache() {
  const cache = getRedisCache();
  await cache.initialize();
  return cache;
}

/**
 * Close Redis cache (call this on server shutdown)
 */
export async function closeRedisCache() {
  if (redisCacheInstance) {
    await redisCacheInstance.close();
    redisCacheInstance = null;
  }
}
