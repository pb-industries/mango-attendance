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
  console.log('TICK TIME IS: ', tickTime);
  const tickDate = new Date(
    new Date(tickTime ?? new Date().getTime()).toUTCString()
  );
  const knex = await getConnection();
  const raid = await knex.from('raid').where('id', raidId).first();
  if (!raid) {
    throw new Error(`Raid ${raidId} not found`);
  }

  const attendeeMetadata = await fetchPlayers(playerNames);

  let currentTick: number = 0;
  const previousTick = await getPreviousTick(raidId);
  if (previousTick) {
    currentTick = getNextTick(previousTick, tickDate);
  }

  // Only allow a final tick if we have the early tick and a tick
  if (finalTick && currentTick >= 1) {
    currentTick += 1;
  }

  const playersToRecord = Object.values(attendeeMetadata).map((id) => {
    return {
      raid_id: raidId,
      player_id: id,
      // Tick 0 is our ontime tick =)
      raid_hour: currentTick,
      created_at: tickDate.toISOString(),
      updated_at: tickDate.toISOString(),
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

const getNextTick = (tick: Tick, nextTickDate: Date): number => {
  // If this within the first tick window
  const { last_tick: lastTick, previous_tick_time: previousTickTime } = tick;

  const lastTickDate = new Date(previousTickTime * 1000);
  const diffInMs = Math.abs(nextTickDate.getTime() - lastTickDate.getTime());
  const diffInMinutes = Math.floor(diffInMs / 1000 / 60);

  if (lastTick === 0 && diffInMinutes > 10) {
    return lastTick + 1;
  }

  const minutesPastHour = lastTickDate.getMinutes();
  const minutesUntilNextHour = 60 - minutesPastHour;
  if (diffInMinutes > minutesUntilNextHour && diffInMinutes > 35) {
    return lastTick + 1;
  }

  return lastTick;
};

const getPreviousTick = async (raidId: string): Promise<Tick | null> => {
  const knex = await getConnection();
  const prevTick = (
    await knex
      .select([
        knex.raw(`
          raid_hour::int as last_tick,
          min(created_at)::int as previous_tick_time
        `),
      ])
      .from('player_raid')
      .where('raid_id', raidId)
      .orderBy('raid_hour', 'desc')
      .groupBy(['raid_hour'])
      .limit(1)
  )?.[0] as unknown as Tick | null;

  if (!prevTick) {
    return null;
  }

  return {
    previous_tick_time: parseInt(`${prevTick.previous_tick_time}`),
    last_tick: parseInt(`${prevTick.last_tick}`),
  };
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
    .select([
      knex.raw('DISTINCT COALESCE(pm.id, p.id) AS id'),
      knex.raw('COALESCE(pm.name, p.name) AS name'),
    ])
    .from('player AS p')
    .innerJoin(knex.raw('player_alt AS pa ON pa.alt_id = p.id'))
    .innerJoin(knex.raw('player AS pm ON pa.player_id = pm.id'))
    .whereRaw(
      `
      (p.deleted_at IS NULL AND p.name IN ('${attendees.join("','")}'))
      OR
      (pm.deleted_at IS NULL AND pm.name IN ('${attendees.join("','")}'))
      `
    );

  const attendeeMetadata: AttendeeMetadata = {};
  players.forEach((player) => {
    if (!attendeeMetadata[player.name.toLowerCase()]) {
      attendeeMetadata[player.name.toLowerCase()] = player.id;
    }
  });

  return attendeeMetadata;
};
