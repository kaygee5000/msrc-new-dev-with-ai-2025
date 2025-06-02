import { getRedisClient } from './redis';

/**
 * Cache utility for handling Redis caching operations
 */
class CacheService {
  /**
   * Get data from cache or execute the fetcher function and cache the result
   * @param {string} key - The cache key
   * @param {Function} fetcher - Async function to fetch data if not in cache
   * @param {number|Object} options - TTL in seconds or options object
   * @param {number} [options.ttl=3600] - Time to live in seconds (default: 1 hour)
   * @param {Function} [options.transform] - Optional function to transform data before returning
   * @returns {Promise<any>} - The data from cache or fetcher, optionally transformed
   */
  static async getOrSet(key, fetcher, options = {}) {
    // Handle backward compatibility - if options is a number, treat it as ttl
    const { ttl = 3600, transform } = typeof options === 'number' 
      ? { ttl: options } 
      : options;
    
    try {
      // Get Redis client
      const redis = await getRedisClient();
      
      if (!redis) {
        // If Redis is not available, fall back to fetcher
        console.warn('Redis not available, fetching data directly');
        const freshData = await fetcher();
        return transform ? transform(freshData) : freshData;
      }
      
      // Try to get data from cache
      const cachedData = await redis.get(key);
      
      if (cachedData) {
        // Return cached data if available
        const parsedData = JSON.parse(cachedData);
        // Apply transform if provided
        return transform ? transform(parsedData) : parsedData;
      }
      
      // If not in cache, fetch data
      const freshData = await fetcher();
      
      // Get the raw data to cache (if freshData is the result of a transform, we don't want to store that)
      const dataToCache = freshData;
      
      // Store in cache (only if data exists)
      if (dataToCache) {
        await redis.set(key, JSON.stringify(dataToCache), { EX: ttl });
      }
      
      return freshData;
    } catch (error) {
      console.error(`Cache error for key ${key}:`, error);
      // Fall back to fetcher if cache fails
      const freshData = await fetcher();
      return transform ? transform(freshData) : freshData;
    }
  }
  
  /**
   * Invalidate a cache key or pattern
   * @param {string} key - The cache key or pattern (with *)
   * @returns {Promise<boolean>} - Success status
   */
  static async invalidate(key) {
    try {
      const redis = await getRedisClient();
      
      if (!redis) {
        console.warn('Redis not available, cannot invalidate cache');
        return false;
      }
      
      if (key.includes('*')) {
        // Handle pattern invalidation
        const keys = await redis.keys(key);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } else {
        // Simple key invalidation
        await redis.del(key);
      }
      return true;
    } catch (error) {
      console.error(`Cache invalidation error for ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Invalidate multiple cache keys
   * @param {string[]} keys - The cache keys to invalidate
   * @returns {Promise<boolean>} - Success status
   */
  static async invalidateMultiple(keys) {
    try {
      for (const key of keys) {
        await this.invalidate(key);
      }
      return true;
    } catch (error) {
      console.error('Multiple cache invalidation error:', error);
      return false;
    }
  }
  
  /**
   * Set a value in the cache directly
   * @param {string} key - The cache key
   * @param {any} value - The value to store (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  static async set(key, value, ttl = 3600) {
    try {
      const redis = await getRedisClient();
      
      if (!redis) {
        console.warn('Redis not available, cannot set cache');
        return false;
      }
      
      await redis.set(key, typeof value === 'string' ? value : JSON.stringify(value), { EX: ttl });
      return true;
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Get a value from the cache
   * @param {string} key - The cache key
   * @returns {Promise<any>} - The cached value or null if not found
   */
  static async get(key) {
    try {
      const redis = await getRedisClient();
      
      if (!redis) {
        console.warn('Redis not available, cannot get from cache');
        return null;
      }
      
      const cachedData = await redis.get(key);
      if (!cachedData) return null;
      
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        // If not valid JSON, return as is
        return cachedData;
      }
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }
}

export default CacheService;