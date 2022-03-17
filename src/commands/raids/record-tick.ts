import { getConnection } from '@/util/db';
import { log } from '@/logger';

/**
 * Given a list of players, record their attendance each time the player
 * list updates.
 */
export default async (
  raidId: string,
  playerNames: string[],
  finalTick?: boolean
) => {
  const knex = await getConnection();
  const raid = await knex.from('raid').where('id', raidId).first();
  if (!raid) {
    throw new Error(`Raid ${raidId} not found`);
  }

  const elapsedTicks = await getTotalTicks(raidId);
  const attendeeMetadata = await fetchPlayers(
    playerNames,
    elapsedTicks,
    raidId,
    3600
  );

  const playersToRecord = Object.values(attendeeMetadata)
    .filter(
      ({ nextTickElapsed }) => nextTickElapsed === true || finalTick === true
    )
    .map(({ id }) => {
      return {
        raid_id: raidId,
        player_id: id,
        // Tick 0 is our ontime tick =)
        raid_hour: elapsedTicks + 1,
      };
    });

  if (playersToRecord.length) {
    await knex
      .insert(playersToRecord)
      .into('player_raid')
      .onConflict(['player_id', 'raid_id', 'raid_hour'])
      .merge({ updated_at: new Date() });

    log.info('Recorded attendance for ' + playersToRecord.length + ' players');
  }

  const recordedTicks = playersToRecord.length
    ? elapsedTicks + 1
    : elapsedTicks;
  return { playersRecorded: playersToRecord.length, tick: recordedTicks };
};

const getTotalTicks = async (raidId: string): Promise<number> => {
  const knex = await getConnection();
  const res = await knex
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
  raidId: string,
  tickAllowanceThresholdSeconds: number = 3600
): Promise<AttendeeMetadata> => {
  const knex = await getConnection();
  const players = await knex
    .select([
      'p.id',
      'p.name',
      knex.raw(
        `(pr.raid_id IS NULL OR (${currentTick} < 1 OR EXTRACT(epoch from (now() - COALESCE(last_tick.last_tick_time, pr.created_at))) > ${tickAllowanceThresholdSeconds})) AS next_tick_elapsed`
      ),
    ])
    .from('player AS p')
    .leftJoin(
      knex.raw(
        `player_raid AS pr ON pr.player_id = p.id AND pr.raid_id = ${raidId}`
      )
    )
    .leftJoin(
      knex.raw(
        `(
          SELECT player_id, raid_id, MAX(raid_hour) AS max_raid_hour, MAX(created_at) AS last_tick_time
          FROM player_raid
          WHERE raid_id = ${raidId}
          GROUP BY player_id, raid_id
        ) AS last_tick ON last_tick.player_id = p.id`
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
