import { cacheConnectionString } from '@/config/sources';
import Redis, { Redis as RedisClient } from 'ioredis';

let client: RedisClient | null = null;

export const getCacheInstance = async (): Promise<RedisClient> => {
  if (client) {
    return client;
  }

  client = new Redis(cacheConnectionString);
  return client;
};
