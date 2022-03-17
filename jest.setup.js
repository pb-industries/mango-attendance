import 'dotenv/config';
import conn from 'knex';

if (process.env.NODE_ENV !== 'integration') {
  jest.mock('ioredis', () => jest.requireActual('ioredis-mock/jest'));
}

jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`Process.exit ${code}`);
});

const knex = conn({
  client: 'pg',
  version: '21.2.4',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASS || '',
    port: process.env.DB_PORT || 3306,
    database: `${process.env.DB_CLUSTER}.${process.env.DB_NAME || 'default'}`,
    debug: process.env.DB_DEBUG || false,
    ssl: { rejectUnauthorized: true },
  },
  migrations: {
    directory: './migrations',
  },
});
