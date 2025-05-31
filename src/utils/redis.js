import { createClient } from 'redis';
import redisConfig from '@/config/redis.config';

let redisClient;
let isRedisConnected = false;

// Function to initialize Redis connection
const initRedis = async () => {
  if (redisClient && isRedisConnected) return redisClient;

  console.log(`Connecting to Redis at ${redisConfig.url}`);
  
  try {
    redisClient = createClient(redisConfig);

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
      isRedisConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
      isRedisConnected = false;
    });

    redisClient.on('ready', () => {
      console.log('Redis is ready to use');
      isRedisConnected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    throw err; // Re-throw to allow handling in the auth adapter
  }
};

// Export a function to get the Redis client
export const getRedisClient = async () => {
  if (!redisClient) {
    return await initRedis();
  }
  return redisClient;
};

// For backward compatibility
export default getRedisClient;