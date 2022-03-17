import { log } from '@/logger';
import { getConnection } from '@/util/db';

export default async (players: string) => {
  const knex = await getConnection();
  const playersToRemove = players
    .split(',')
    .map((player) => player.trim().toLowerCase());

  await knex.delete().from('player').whereIn('name', playersToRemove);

  log.info('Removed players');
};
