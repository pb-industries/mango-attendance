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

  knex.transaction(async (trx) => {
    const updates = Object.values(playerAttendance).map((attendance) => {
      const { player_id } = attendance;
      delete attendance.player_id;
      delete attendance.player_name;

      return trx('player')
        .update(attendance)
        .where({ id: player_id })
        .transacting(trx);
    });

    try {
      await Promise.all(updates);
      await calculateTickets();
      await trx.commit();
      log.info(`Successfully updated attendance of all members.`);
    } catch (e) {
      log.error(e);
      log.error('unexpected error when saving attendance');
      await trx.rollback();
      throw e;
    }
  });
};

const calculateTickets = async (): Promise<void> => {
  const knex = await getConnection();
  // TODO: Commit in transaction
  const rows = await knex
    .select(
      knex.raw(
        `
          pl.id,
          pl.name,
          round(
            -- Attendance
            pl.attendance_30::float *
            -- Box modifier express as 10 + boxes / 10 to get decimal of 1.X
            ((10 + greatest(0, count(pa.player_id))) / 10)::float
            -- Add loot modifier here when we have it!
          ) AS total_tickets
        `
      )
    )
    .from(`player AS pl`)
    .leftJoin(knex.raw('left join player_alt AS pa on pa.player_id = pl.id'))
    .groupBy(knex.raw('pl.id'));

  rows.forEach((row: any) => {
    if (row?.id) {
      knex('player')
        .update({
          total_tickets: row.total_tickets,
        })
        .where({ id: row.id });
    }
  });
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
        round((cast(count(distinct pr.raid_id + pr.raid_hour) as decimal) / cast(count(distinct all_raids.raid_id + all_raids.raid_hour) as decimal) * 100), 2) AS attendance
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
            pr.created_at
          from player_raid pr
            left join player_alt pa on pa.alt_id = pr.player_id
            left join player a on pa.player_id = a.id
        ) pr
    `)
    )
    .innerJoin(
      knex.raw('player_raid AS all_raids ON all_raids.raid_id IS NOT NULL')
    )
    .leftJoin(knex.raw('player AS p ON pr.player_id = p.id'))
    .groupBy(knex.raw('pr.player_id, p.name, p.id'));

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
        round((cast(count(distinct pr.raid_id + pr.raid_hour) as decimal) / cast(count(distinct all_raids.raid_id + all_raids.raid_hour) as decimal) * 100), 2) AS attendance
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
            pr.created_at
          from player_raid pr
            left join player_alt pa on pa.alt_id = pr.player_id
            left join player a on pa.player_id = a.id
        ) pr
    `)
    )
    .innerJoin(
      knex.raw(
        `player_raid AS all_raids ON all_raids.raid_id IS NOT NULL AND all_raids.created_at > current_timestamp - interval '${days}' day`
      )
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
