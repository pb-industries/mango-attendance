import { log } from '@/logger';
import { getConnection } from '@/util/db';
import addPlayer from '@/commands/roster/add';

export default async (
  player_id: string,
  alts: Player[]
): Promise<PlayerAlt[]> => {
  let assignedAlts: PlayerAlt[] = [];
  const knex = await getConnection();

  const altIds = await fetchAltIds(alts);

  log.info({ main_id: player_id, box_ids: altIds });
  try {
    await knex.transaction(async (trx) => {
      const playersToAdd = (
        await trx()
          .select('id')
          .from('player')
          .whereIn(
            'id',
            [player_id, ...altIds].map((id: any) => `${id}`)
          )
      ).map((player) => `${player.id}`);

      if (playersToAdd.length < 2) {
        throw new Error(
          `Invalid player count, expected at least 2, received ${playersToAdd.length}`
        );
      }

      const res = await trx()
        .from('player_alt')
        .whereIn('player_id', altIds)
        .orWhereIn('alt_id', altIds)
        .delete();
      log.debug({ res }, 'deleted player_alt');

      assignedAlts = await trx()
        .insert(
          playersToAdd
            .filter((alt_id) => alt_id !== player_id)
            .map((alt_id) => {
              return { player_id: player_id, alt_id };
            })
        )
        .into('player_alt')
        .returning('*');
      log.debug({ playersToAdd, assignedAlts });
    });
  } catch (e) {
    log.error(e);
  }
  return assignedAlts;
};

const fetchAltIds = async (players: Player[]) => {
  return await (await addPlayer(players)).map((player) => player.id);
};
