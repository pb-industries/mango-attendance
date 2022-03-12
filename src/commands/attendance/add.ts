import { log } from '../../logger';
import { getConnection } from '../../util/db';

export default async (
  raidId: number,
  players: string[]
): Promise<{ raid_id: number; players: Player[] }> => {
  const knex = await getConnection();
  const playersForTick = await knex('player')
    .select('id, name')
    .whereIn('name', players);
  if (!playersForTick.length) {
    return { raid_id: raidId, players: [] };
  }

  const playersToRecord = playersForTick.map((player) => {
    return {
      raid_id: raidId,
      player_id: player.id,
      raid_hour: new Date().getHours() + 1,
    };
  });

  if (playersToRecord.length) {
    const rows = await getConnection()
      .insert(playersToRecord)
      .into('player_raid')
      .onConflict(['player_id', 'raid_id', 'raid_hour'])
      .merge({ updated_at: new Date() });

    log.debug(rows);
    log.info('Recorded attendance for ' + rows.length + ' players');
  }

  return { raid_id: raidId, players: playersForTick };
};
