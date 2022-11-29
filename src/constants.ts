export const __prod__ = process.env.NODE_ENV === 'production';
export const __port__ = process.env.APP_PORT || 3000;
export const __db__ = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASS || '',
  port: process.env.DB_PORT || 3306,
  database: `${process.env.DB_CLUSTER}.${process.env.DB_NAME || 'default'}`,
  debug: process.env.DB_DEBUG || false,
  ssl: { rejectUnauthorized: true },
};
export const __kafka__ = {
  username: process.env.KAFKA_USERNAME ?? '',
  password: process.env.KAFKA_PASSWORD ?? '',
  brokers: process.env.KAFKA_BROKERS ?? '',
};
