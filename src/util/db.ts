import { __db__ } from '@/constants';
import knex, { Knex } from 'knex';

let connection: Knex<any, unknown[]> | null = null;

export const getConnection = async () => {
  if (!connection) {
    connection = knex({
      client: 'pg',
      version: '21.2.4',
      connection: __db__,
      debug: __db__.debug,
      migrations: {
        directory: '@/migrations',
      },
    });
  }

  return connection;
};
