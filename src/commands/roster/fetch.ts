import { getConnection } from '../../util/db';

export default async (
  id?: number,
  mainsOnly?: boolean
): Promise<{ data: {}; totalRows: number; id?: number }> => {
  let players = [];
  if (id) {
    players = await getConnection()
      .select('*')
      .from('player')
      .where('id', id)
      .first();
  } else {
    if (!mainsOnly) {
      players = await getConnection().select('*').from('player');
    } else {
      players = await getConnection()
        .select('player.*')
        .from('player')
        .leftJoin('player_alt', 'player_alt.alt_id', 'player.id')
        .groupBy('player.id')
        .havingRaw('count(player_alt.player_id) = 0');
    }
  }

  return {
    data: players,
    totalRows: players.length,
    id,
  };
};
