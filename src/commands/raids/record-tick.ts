import { getConnection } from '@/util/db';
import { log } from '@/logger';

/**
 * Given a list of players, record their attendance each time the player
 * list updates.
 */
export default async (
  raidId: string,
  playerNames: string[],
  tickTime?: number,
  finalTick?: boolean
) => {
  const tickDate = new Date(
    new Date(tickTime ?? new Date().getTime()).toUTCString()
  ).toISOString();
  const knex = await getConnection();
  const raid = await knex.from('raid').where('id', raidId).first();
  if (!raid) {
    throw new Error(`Raid ${raidId} not found`);
  }

  let currentTick = await getCurrentTick(raidId, tickTime);
  const attendeeMetadata = await fetchPlayers(playerNames);

  if (finalTick) {
    currentTick += 1;
  }

  const playersToRecord = Object.values(attendeeMetadata).map((id) => {
    return {
      raid_id: raidId,
      player_id: id,
      // Tick 0 is our ontime tick =)
      raid_hour: currentTick,
      created_at: tickDate,
      updated_at: tickDate,
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

  return { playersRecorded: playersToRecord.length, tick: currentTick };
};

const getPreviousTickTime = async (raidId: string): Promise<Tick | null> => {
  const knex = await getConnection();
  const res = (await knex
    .select([
      knex.raw('raid_hour as last_tick, created_at as previous_tick_time'),
    ])
    .from('player_raid')
    .where('raid_id', raidId)
    .orderBy('raid_hour', 'desc')
    .groupBy(['raid_id', 'raid_hour', 'created_at'])
    .having('raid_hour', '>', 0)) as unknown as Tick[];

  const prevTick = res.shift();

  if (!prevTick) {
    return null;
  }

  return prevTick;
};

const getCurrentTick = async (
  raidId: string,
  nextTickTime?: number
): Promise<number> => {
  const previousTickMeta = await getPreviousTickTime(raidId);
  const knex = await getConnection();

  const nextTick = new Date(
    new Date(nextTickTime ?? new Date().getTime())
  ).toISOString();
  const prevTick = new Date(
    new Date(previousTickMeta?.previous_tick_time ?? new Date().getTime())
  ).toISOString();
  console.log(nextTick, prevTick);

  const previousTickClause = previousTickMeta
    ? `
    if (
      -- If another 26 minutes have elapsed since the previous tick, then allow us to record it
      extract(epoch from ('${nextTick}'::TIMESTAMP - '${prevTick}'::TIMESTAMP) / 60) >= 26,
      max(raid_hour) + 1,
      max(raid_hour)
    )
  `
    : 'max(raid_hour)';

  const lastTickDelta =
    previousTickMeta === null || previousTickMeta.last_tick === 0
      ? `(now() - max(created_at))`
      : `(max(created_at) -  min(created_at))`;

  const res = await knex
    .select([
      knex.raw(
        `
          ((cast(extract('epoch' from ${lastTickDelta}) as int) + 60) % 60) / 60 AS time_passed,
          ((cast(extract('epoch' from ${lastTickDelta}) as int) + 60) % 60) / 60 > 0.43 AS next_tick_done,
      if(
        coalesce(max(raid_hour), 0) = 0,
        -- If the max minutes elapsed at tick 1 < 10 then count more early tickers
        -- else roll this over to tick 1.
        if (extract(epoch from ('${nextTick}'::TIMESTAMP - min(created_at)) / 60) < 10, 0, 1),
        -- If the amount of minutes elapsed * latest tick > 60
        if (
          -- Work out what proportion of an hour has passed since the last tick, 0.43 = ~26 mins, if
          -- so we use the next tick, otherwise we take the current tick
          (cast(extract(epoch from ${lastTickDelta}) / 60 as int) % 60) / 60 > 0.43,
          ${previousTickClause},
          max(raid_hour)
        )
      ) AS current_tick
    `
      ),
    ])
    .from('player_raid')
    .where('raid_id', raidId)
    .groupBy('raid_id');

  if (!res?.[0]) {
    return 0;
  }

  return parseInt(`${res[0].current_tick ?? 0}`);
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
const fetchPlayers = async (attendees: string[]): Promise<AttendeeMetadata> => {
  const knex = await getConnection();
  const players = await knex
    .select(['p.id', 'p.name'])
    .from('player AS p')
    .whereIn('p.name', attendees);

  const attendeeMetadata: AttendeeMetadata = {};
  players.forEach((player) => {
    if (!attendeeMetadata[player.name.toLowerCase()]) {
      attendeeMetadata[player.name.toLowerCase()] = player.id;
    }
  });

  return attendeeMetadata;
};
