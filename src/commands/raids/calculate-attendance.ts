import { Knex } from 'knex';
import { log } from '@/logger';
import { getConnection } from '@/util/db';

type Attendance =
  | 'attendance_life'
  | 'attendance_30'
  | 'attendance_60'
  | 'attendance_90';

interface AttendanceDatum {
  player_id: number;
  player_name: string;
  attendance: number; // returned from db as string, we parse to float
}

export default async () => {
  try {
    await fixTicks();
  } catch (e) {
    // dont care
  }
  await calculateAttendance();
  await calculateTicksSinceLastWin();
  await calculateTickets();
};

const calculateAttendance = async (): Promise<void> => {
  const knex = await getConnection();
  const playerAttendance: {
    [key: number]: { [key: string]: number | string };
  } = {};
  const attendanceData: { name: Attendance; data: AttendanceDatum[] }[] = [
    { name: 'attendance_life', data: await allTime(knex) },
    { name: 'attendance_30', data: await daysInRange(knex, 30) },
    { name: 'attendance_60', data: await daysInRange(knex, 60) },
    { name: 'attendance_90', data: await daysInRange(knex, 90) },
  ];

  attendanceData.forEach(({ name, data }) => {
    data.forEach(({ player_id, player_name, attendance }) => {
      if (!playerAttendance[player_id]) {
        playerAttendance[player_id] = {
          player_name,
          player_id, // part of the update params - we can use Object.values and omit the player_id key
          attendance_life: 0,
          attendance_30: 0,
          attendance_60: 0,
          attendance_90: 0,
        };
      }

      if (player_id) {
        playerAttendance[player_id][name] = parseFloat(`${attendance}`);
      }
    });
  });

  // await knex.transaction(async (trx) => {
  const updates = Object.values(playerAttendance).map((attendance) => {
    const { player_id } = attendance;
    delete attendance.player_id;
    delete attendance.player_name;

    return knex('player').update(attendance).where({ id: player_id });
    // .transacting(trx);
  });

  try {
    await Promise.all(updates);
    // await trx.commit();
    log.info(`Successfully updated attendance of all members.`);
  } catch (e) {
    log.error(e);
    log.error('unexpected error when saving attendance');
    // await trx.rollback();
    throw e;
  }
  // });
};

const calculateTicksSinceLastWin = async (): Promise<void> => {
  const knex = await getConnection();
  const { rows } = (await knex.raw(`
    select
      ap.id AS player_id,
      if(ap.id = pa.alt_id, pa.player_id, ap.id) AS main_id,
      count(distinct concat(r.id::string, pr.raid_hour::string)) AS ticks_since_last_win,
      if(if(ap.id = pa.alt_id, pa.player_id, ap.id) = ap.id, 1, 0) AS is_main
    from (
      select
      pl.id,
      pl.name,
      COALESCE(MAX(lw.time_last_won), '2022-05-01 00:00:00+00') AS last_won_time
      from player AS pl
      left join (
          select
              if(pl.id = pa.alt_id, pa.player_id, pl.id) AS player_id,
              MAX(GREATEST(lh.created_at)) AS time_last_won
          from player AS pl
          inner join loot_history lh on lh.looted_by_id = pl.id
          inner join item i on lh.item_id = i.id and i.category = 'bis' and i.id <> 756381770069475329
          left join player_alt pa on pa.alt_id = pl.id
          group by pl.id, pa.alt_id, player_id
      ) lw on lw.player_id = pl.id
      left join guild g on pl.guild_id = g.id
      group by pl.id, pl.name
    ) AS ap
    left join raid as r on r.created_at >= ap.last_won_time
    left join player_raid pr on pr.raid_id = r.id and pr.player_id = ap.id
    left join player_alt as pa on pa.alt_id = ap.id
    group by pa.alt_id, pa.player_id, ap.id, ap.name
    order by is_main desc
  `)) as {
    rows: {
      main_id: string;
      player_id: string;
      ticks_since_last_win: number;
    }[];
  };

  if (!rows) {
    console.error('No rows found when calculating tickets');
    return;
  }

  const ticksSinceLastWin = rows.reduce(
    (
      acc: { [playerId: string]: number },
      { player_id, main_id, ticks_since_last_win }
    ) => {
      if (player_id === main_id) {
        acc[player_id] = parseInt(`${ticks_since_last_win}`, 10);
      } else {
        acc[player_id] = acc?.[main_id] ?? 0;
      }
      return acc;
    },
    {}
  );

  // await knex.transaction(async (trx) => {
  const updates: any[] = Object.keys(ticksSinceLastWin)
    .map((playerId) => {
      if (playerId) {
        return knex('player')
          .update({
            ticks_since_last_win: ticksSinceLastWin?.[playerId] ?? 0,
          })
          .where({ id: BigInt(playerId) });
        // .transacting(trx);
      } else {
        return null;
      }
    })
    .filter((u: any) => u !== null);

  try {
    await Promise.all(updates);
    // await trx.commit();
    log.info(`Successfully recorded ticks since last win`);
  } catch (e) {
    log.error(e);
    log.error('Unexpected error saving ticks');
    // await trx.rollback();
    throw e;
  }
  // });
};

const calculateTickets = async (): Promise<void> => {
  const knex = await getConnection();
  const rows = await knex
    .select(
      knex.raw(
        `
          pl.id,
          pl.name,
          round(
            -- Attendance
            pl.attendance_60::float *
            -- Box modifier (set on guild default 10%)
            ((max(greatest(0, bi.total_boxes::float)) * max(g.box_modifier)) + 1) *
            -- Loot modifier (set on guild, default 3%)
            ((max(greatest(0, pl.ticks_since_last_win::float)) * max(g.last_win_modifier)) + 1)
          ) AS total_tickets,
          round(
            -- Attendance
            pl.attendance_60::float *
            -- Box modifier (set on guild default 10%)
            ((max(greatest(0, bi.total_boxes::float)) * max(g.box_modifier)) + 1)
          ) AS base_tickets
        `
      )
    )
    .from(`player AS pl`)
    .leftJoin(
      knex.raw(`
      (
        select
          pa.player_id,
          count(*) AS total_boxes
        from player AS pl
        inner join player_alt as pa on pa.alt_id = pl.id
        where pl.rank IN ('raider')
        group by pa.player_id
      ) as bi on bi.player_id = pl.id
    `)
    )
    .leftJoin(knex.raw('guild AS g ON pl.guild_id = g.id'))
    .groupBy(knex.raw('pl.id'));

  // await knex.transaction(async (trx) => {
  const updates: any[] = rows
    .map((row: any) => {
      if (row?.id) {
        return knex('player')
          .update({
            total_tickets: row.total_tickets,
            base_tickets: row.base_tickets,
          })
          .where({ id: row.id });
        // .transacting(trx);
      } else {
        return null;
      }
    })
    .filter((u: any) => u !== null);

  try {
    await Promise.all(updates);
    // await trx.commit();
    log.info(`Successfully updated tickets of all members.`);
  } catch (e) {
    log.error(e);
    log.error('Unexpected error saving tickets');
    // await trx.rollback();
    throw e;
  }
  // });
};

const allTime = async (
  knex: Knex<any, unknown[]>
): Promise<AttendanceDatum[]> => {
  console.info('Fetching attendance % for all time');
  const aggregatedRows: { [playerId: number]: AttendanceDatum } = {};
  const rows = await knex
    .select(
      knex.raw(
        `
        p.name AS player_name,
        p.id AS player_id,
        round((cast(count(distinct pr.raid_id + pr.raid_hour) as decimal) / ${await totalRaidsInRange(
          knex,
          null
        )} * 100), 2) AS attendance
        `
      )
    )
    .from(
      knex.raw(`
        (
          select
            distinct if (pa.alt_id = pr.player_id, pa.player_id, pr.player_id) AS player_id,
            pr.raid_id,
            pr.raid_hour,
            r.created_at
          from raid r
            inner join player_raid pr on pr.raid_id = r.id
            left join player_alt pa on pa.alt_id = pr.player_id
            left join player a on pa.player_id = a.id
          where r.is_official = true
        ) pr
    `)
    )
    .leftJoin(knex.raw('player AS p ON pr.player_id = p.id'))
    .groupBy(knex.raw('pr.player_id, p.name, p.id'));

  console.log('got data');

  rows.forEach((row: AttendanceDatum) => {
    if (aggregatedRows?.[row?.player_id]) {
      aggregatedRows[row.player_id].attendance = parseFloat(
        `${row.attendance}`
      );
    } else {
      row.attendance = parseFloat(`${row.attendance}`);
      aggregatedRows[row.player_id] = row;
    }

    aggregatedRows[row.player_id].attendance = Math.min(100, row.attendance);
  });

  return Object.values(aggregatedRows);
};

const totalRaidsInRange = async (
  knex: Knex<any, unknown[]>,
  days: number | null
): Promise<number> => {
  let daysClause = '';
  if (days) {
    daysClause = ` AND r.created_at > current_timestamp - interval '${days}' day`;
  }

  const rows = await knex
    .select(
      knex.raw(`count(distinct pr.raid_id + pr.raid_hour) as total_raids`)
    )
    .from('player_raid AS pr')
    .innerJoin(knex.raw(`raid AS r ON pr.raid_id = r.id`))
    .where(knex.raw(`r.is_official = true${daysClause}`));

  let total = 0;
  rows.forEach((r) => (total += parseInt(r.total_raids ?? 0)));
  return total;
};

const daysInRange = async (
  knex: Knex<any, unknown[]>,
  days: number
): Promise<AttendanceDatum[]> => {
  const aggregatedRows: { [playerId: number]: AttendanceDatum } = {};
  const rows = await knex
    .select(
      knex.raw(
        `
        p.id AS player_id,
        p.name AS player_name,
        round((cast(count(distinct pr.raid_id + pr.raid_hour) as decimal) / ${await totalRaidsInRange(
          knex,
          days
        )} * 100), 2) AS attendance
        `
      )
    )
    .from(
      knex.raw(`
        (
          select
            distinct if (pa.alt_id = pr.player_id, pa.player_id, pr.player_id) AS player_id,
            pr.raid_id,
            pr.raid_hour,
            r.created_at
          from raid r
            left join player_raid pr on pr.raid_id = r.id
            left join player_alt pa on pa.alt_id = pr.player_id
            left join player a on pa.player_id = a.id
          where r.is_official = true
        ) pr
    `)
    )
    .leftJoin(knex.raw('player AS p ON pr.player_id = p.id'))
    .where(
      knex.raw(`pr.created_at > current_timestamp - interval '${days}' day`)
    )
    .groupBy(knex.raw('pr.player_id, p.id'));

  rows.forEach((row: AttendanceDatum) => {
    if (aggregatedRows?.[row?.player_id]) {
      aggregatedRows[row.player_id].attendance += parseFloat(
        `${row.attendance}`
      );
    } else {
      row.attendance = parseFloat(`${row.attendance}`);
      aggregatedRows[row.player_id] = row;
    }

    aggregatedRows[row.player_id].attendance = Math.min(100, row.attendance);
  });

  return Object.values(aggregatedRows);
};

const fixTicks = async (): Promise<void> => {
  const knex = await getConnection();
  const raids = await knex
    .select(`*`)
    .from(
      knex.raw(`
        (
          select
            raid_id,
            count(distinct pr.raid_hour) as total_ticks,
            max(pr.raid_hour) + 1 as max_hour
          from player_raid pr
          group by raid_id
        )
      `)
    )
    .where(knex.raw(`total_ticks <> max_hour`));

  console.log(raids);
  raids.forEach(async ({ raid_id }) => {
    const allTicks = await knex
      .select(`raid_hour`)
      .from(`player_raid`)
      .where(`raid_id`, raid_id)
      .groupBy(`raid_hour`);

    let seq = -1;
    let triggered = false;
    allTicks.map(async ({ raid_hour }) => {
      seq += 1;
      console.log(raid_hour, seq);
      if (seq <= allTicks.length && (raid_hour != seq || triggered)) {
        triggered = true;
        await knex('player_raid')
          .where('raid_id', raid_id)
          .where('raid_hour', raid_hour)
          .update({ raid_hour: seq });
      }
    });
  });
};
