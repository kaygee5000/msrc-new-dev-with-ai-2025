import redisClient from './redis';

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
      // Try to get data from cache
      const cachedData = await redisClient.get(key);
      
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
      
      // Store in cache (only if data exists and redis is connected)
      if (dataToCache && redisClient.isOpen) {
        await redisClient.set(key, JSON.stringify(dataToCache), { EX: ttl });
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
      if (key.includes('*')) {
        // Handle pattern invalidation
        const keys = await redisClient.keys(key);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } else {
        // Simple key invalidation
        await redisClient.del(key);
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
}

export default CacheService;