import { createClient } from 'redis';

// Create a Redis client using environment variables
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// Connect immediately if not already connected
if (!redisClient.isOpen) {
  redisClient.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
  });
}

export default redisClient;