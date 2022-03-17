import { log } from '@/logger';
import { getConnection } from '@/util/db';

export default async (players: Player[]): Promise<Player[]> => {
  const knex = await getConnection();
  const playersToAdd = players.map((player) => {
    if (!player.name) {
      throw new Error('Missing player name');
    }
    return {
      name: player?.name?.toLowerCase(),
      ...player,
    };
  });

  const rows = await knex
    .insert(playersToAdd)
    .into('player')
    .onConflict(['name'])
    .merge({ updated_at: new Date() })
    .returning('*');

  log.info('Inserted players', rows);
  return rows;
};
