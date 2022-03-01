import { log } from '../../logger';
import { getConnection } from '../../util/db';

export default async (
  player_id: string,
  alt_ids: string[]
): Promise<Player[]> => {
  const knex = await getConnection();

  log.info({ main_id: player_id, box_ids: alt_ids });
  try {
    await knex.transaction(async (trx) => {
      const delegatedBoxes = await getDelegatedAlts(player_id);
      const alts_to_apply = new Set([
        ...delegatedBoxes.map((box) => box.id),
        ...alt_ids,
      ]);

      log.debug([player_id, ...alts_to_apply]);
      const playersToAdd = (
        await trx()
          .select('id')
          .from('player')
          .whereIn(
            'id',
            [player_id, ...alts_to_apply].map((id: any) => `${id}`)
          )
      ).map((player) => `${player.id}`);

      if (playersToAdd.length < 2) {
        throw new Error(
          `Invalid player count, expected at least 2, received ${playersToAdd.length}`
        );
      }

      log.info(playersToAdd);
      const res = await trx()
        .from('player_alt')
        .whereIn('player_id', playersToAdd)
        .orWhereIn('alt_id', playersToAdd)
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
        .into('player_alt');
      log.debug({ playersToAdd, rows });

      log.info('Promoted main');
      return rows;
    });
  } catch (e) {
    log.error(e);
  }
  return [];
};

/**
 * Returns a list of player ids that are alts of the given main id
 * we will use this to reallocate as boxes of the new main.
 *
 * @param main_id
 * @returns
 */
const getDelegatedAlts = async (main_id: string): Promise<Player[]> => {
  const knex = await getConnection();
  const delegatedBoxes = await knex()
    .select('player_id AS id')
    .from('player_alt')
    .orWhere('alt_id', main_id);

  return delegatedBoxes;
};
