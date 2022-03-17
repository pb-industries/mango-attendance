import { log } from '@/logger';
import { getConnection } from '@/util/db';

export default async (
  player_id: string,
  alt_ids: string[]
): Promise<Player[]> => {
  const knex = await getConnection();

  log.info({ main_id: player_id, box_ids: alt_ids });
  try {
    await knex.transaction(async (trx) => {
      const playersToAdd = (
        await trx()
          .select('id')
          .from('player')
          .whereIn(
            'id',
            [player_id, ...alt_ids].map((id: any) => `${id}`)
          )
      ).map((player) => `${player.id}`);

      if (playersToAdd.length < 2) {
        throw new Error(
          `Invalid player count, expected at least 2, received ${playersToAdd.length}`
        );
      }

      const res = await trx()
        .from('player_alt')
        .whereIn('player_id', alt_ids)
        .orWhereIn('alt_id', alt_ids)
        .delete();
      log.debug({ res }, 'deleted player_alt');

      const rows = await trx()
        .insert(
          playersToAdd
            .filter((alt_id) => alt_id !== player_id)
            .map((alt_id) => {
              return { player_id: player_id, alt_id };
            })
        )
        .into('player_alt')
        .returning('*');
      log.debug({ playersToAdd, rows });
      return rows;
    });
  } catch (e) {
    log.error(e);
  }
  return [];
};
