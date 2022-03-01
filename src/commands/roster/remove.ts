import { log } from '../../logger';
import { getConnection } from '../../util/db';

export default async (players: string) => {
  const playersToRemove = players
    .split(',')
    .map((player) => player.trim().toLowerCase());

  const rows = await getConnection()
    .delete()
    .from('player')
    .whereIn('name', playersToRemove);

  log.info('Removed players', rows);
};
