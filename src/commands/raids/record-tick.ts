import { getConnection } from '../../util/db';
import { log } from '../../logger';

/**
 * Given a list of players, record their attendance each time the player
 * list updates.
 */
export default async (raidId: string, playerNames: string[]) => {
  const raid = await getConnection().from('raid').where('id', raidId).first();
  if (!raid) {
    throw new Error(`Raid ${raidId} not found`);
  }

  const elapsedTicks = await getTotalTicks(raidId);
  const currentTick = elapsedTicks == -1 ? 0 : elapsedTicks + 1;
  const attendeeMetadata = await fetchPlayers(playerNames, currentTick, raidId);

  const playersToRecord = Object.values(attendeeMetadata)
    .filter(({ nextTickElapsed }) => nextTickElapsed === true)
    .map(({ id }) => {
      return {
        raid_id: raidId,
        player_id: id,
        // Tick 0 is our ontime tick =)
        raid_hour: currentTick,
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

  return { playersRecorded: playersToRecord.length, tick: currentTick };
};

const getTotalTicks = async (raidId: string): Promise<number> => {
  const res = await getConnection()
    .countDistinct({ ticks: 'raid_hour' })
    .from('player_raid')
    .where('raid_id', raidId);

  return parseInt(`${res[0].ticks ?? 0}`) - 1;
};

/**
 * Returns a list of players on raid and whether or not we should
 * record the next attendance tick or not (based on if we have already
 * recorded them this hour)
 *
 * @param attendees
 * @param currentTick
 * @returns
 */
const fetchPlayers = async (
  attendees: string[],
  currentTick: number,
  raidId: string
): Promise<AttendeeMetadata> => {
  const knex = await getConnection();
  const players = await knex
    .select([
      'p.id',
      'p.name',
      knex.raw(
        `(pr.raid_id IS NULL OR (${currentTick} = 0 OR EXTRACT(epoch from (now() - pr.created_at)) > 3600)) AS next_tick_elapsed`
      ),
    ])
    .from('player AS p')
    .leftJoin(
      knex.raw(
        `player_raid AS pr ON pr.player_id = p.id AND pr.raid_id = ${raidId}`
      )
    )
    .whereIn('p.name', attendees);

  const attendeeMetadata: AttendeeMetadata = {};
  players.forEach((player) => {
    if (!attendeeMetadata[player.name.toLowerCase()]) {
      attendeeMetadata[player.name.toLowerCase()] = {
        id: player.id,
        nextTickElapsed: player.next_tick_elapsed,
      };
    }
  });

  return attendeeMetadata;
};
