const prod = process.env.NODE_ENV === 'production';

const cacheConfig: CacheConfig = {
  host: process.env.CACHE_HOST ?? 'localhost',
  user: process.env.CACHE_USER ?? '',
  password: process.env.CACHE_PASSWORD ?? '',
  driver: process.env.CACHE_DRIVER || 'redis',
  port: (process.env.CACHE_PORT ?? 6379) as number,
  debug: !prod,
};

const getConnectionString = () => {
  if (cacheConfig.password) {
    return `rediss://:${cacheConfig.password}@${cacheConfig.host}:${cacheConfig.port}`;
  } else {
    return `redis://${cacheConfig.host}:${cacheConfig.port}`;
  }
};

export const cacheConnectionString = getConnectionString();
