/**
 * Rate Limiting Middleware
 * Provides rate limiting for API endpoints
 */

// In-memory store for rate limiting (fallback if Redis not available)
const memoryStore = new Map();

/**
 * Rate limiter configuration
 */
const rateLimitConfig = {
  // Payment initiation endpoint
  '/api/initiate-payment': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 requests per window
    message: 'Too many payment requests, please try again later',
  },
  // Payment status endpoint
  '/api/payment-status': {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Max 30 requests per minute
    message: 'Too many status check requests, please try again later',
  },
  // Webhook endpoint
  '/api/payment-webhook': {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Max 100 requests per minute (webhooks can be frequent)
    message: 'Too many webhook requests',
  },
  // Default rate limit
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per window
    message: 'Too many requests, please try again later',
  },
};

/**
 * Get rate limit config for endpoint
 */
function getRateLimitConfig(path) {
  return rateLimitConfig[path] || rateLimitConfig.default;
}

/**
 * Rate limiter middleware using Redis (if available) or memory store
 */
export async function rateLimiter(req, res, next) {
  const path = req.url.split('?')[0]; // Remove query params
  const config = getRateLimitConfig(path);
  const identifier = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.ip || 
                     'unknown';

  try {
    // Try Redis first (non-blocking)
    const { getRedisCache } = await import('./redis-cache.js');
    const cache = getRedisCache();
    await cache.initialize();

    if (cache.isConnected && cache.client) {
      // Use Redis for rate limiting
      const key = `rate_limit:${path}:${identifier}`;
      const current = await cache.client.incr(key);
      
      if (current === 1) {
        // First request, set expiration
        await cache.client.expire(key, Math.ceil(config.windowMs / 1000));
      }

      if (current > config.max) {
        const ttl = await cache.client.ttl(key);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: config.message,
          retryAfter: ttl,
        });
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - current));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString());

      return next();
    }
  } catch (error) {
    // Only log if Redis URL is explicitly set (not localhost fallback)
    if (process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost')) {
      console.error('Redis rate limiting error, falling back to memory:', error.message);
    }
    // Continue with memory-based rate limiting (graceful degradation)
  }

  // Fallback to memory store
  const key = `${path}:${identifier}`;
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now - record.resetTime > config.windowMs) {
    // New window or expired
    memoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', config.max - 1);
    res.setHeader('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());
    return next();
  }

  if (record.count >= config.max) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: config.message,
      retryAfter,
    });
  }

  // Increment count
  record.count++;
  memoryStore.set(key, record);

  res.setHeader('X-RateLimit-Limit', config.max);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - record.count));
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

  // Cleanup old entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    for (const [k, v] of memoryStore.entries()) {
      if (now - v.resetTime > config.windowMs) {
        memoryStore.delete(k);
      }
    }
  }

  return next();
}

