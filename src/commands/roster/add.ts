import { log } from '../../logger';
import { getConnection } from '../../util/db';

export default async (players: Player[]) => {
  const playersToAdd = players.map((player) => {
    return {
      name: player?.name?.toLowerCase(),
      ...player,
    };
  });

  const rows = await getConnection()
    .insert(playersToAdd)
    .into('player')
    .onConflict(['name'])
    .merge({ updated_at: new Date() });

  log.info('Inserted players', rows);
};
