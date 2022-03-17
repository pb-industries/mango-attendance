import { getConnection } from '@/util/db';

export default async (
  id?: number,
  mainsOnly?: boolean
): Promise<{ data: Player | Player[]; totalRows: number; id?: number }> => {
  const knex = await getConnection();
  let players = [];
  if (id) {
    players = await knex.select('*').from('player').where('id', id).first();
  } else {
    if (!mainsOnly) {
      players = await knex.select('*').from('player');
    } else {
      players = await knex
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
