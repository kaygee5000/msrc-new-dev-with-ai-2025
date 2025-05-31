// Redis configuration
// This file can be used to manage Redis configuration in one place

const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000, // 5 seconds
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 50, 2000);
      console.log(`Redis reconnecting attempt ${retries}, next try in ${delay}ms`);
      return delay;
    }
  },
  // Add any other Redis client options here
};

export default redisConfig;
