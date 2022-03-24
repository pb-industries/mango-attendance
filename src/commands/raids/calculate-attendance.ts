import { Knex } from 'knex';
import { log } from '@/logger';
import { getConnection } from '@/util/db';
import { getSheets } from '@/util/googleApi';

type Attendance =
  | 'attendance_life'
  | 'attendance_30'
  | 'attendance_60'
  | 'attendance_90';

interface AttendanceDatum {
  player_id: number;
  player_name: string;
  attendance: string; // returned from db as string, we parse to float
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
        playerAttendance[player_id][name] = parseFloat(attendance);
      }
    });
  });

  knex.transaction(async (trx) => {
    const sheetRows: (string | number)[][] = [];
    const updates = Object.values(playerAttendance).map((attendance) => {
      const { player_id, player_name } = attendance;
      delete attendance.player_id;
      delete attendance.player_name;

      sheetRows.push([
        player_name,
        attendance.attendance_30,
        attendance.attendance_60,
        attendance.attendance_90,
        attendance.attendance_life,
      ]);

      return trx('player')
        .update(attendance)
        .where({ id: player_id })
        .transacting(trx);
    });

    // In order to emulate replacing the whole sheet, insert a bunch of blank
    // cells incase members are ever removed
    const blankRows = 50;
    for (let j = blankRows; j > 0; j--) {
      sheetRows.push(['', '', '', '', '']);
    }

    try {
      await Promise.all(updates);
      await trx.commit();
      log.info(`Successfully updated attendance of all members.`);
      await updateSheet(sheetRows);
    } catch (e) {
      log.error(e);
      log.error('unexpected error when saving attendance');
      await trx.rollback();
      throw e;
    }
  });
};

const allTime = async (
  knex: Knex<any, unknown[]>
): Promise<AttendanceDatum[]> => {
  console.info('Fetching attendance % for all time');
  return await knex
    .select(
      knex.raw(
        'p.name AS player_name, pr.player_id, round((cast(count(distinct pr.raid_id + pr.raid_hour) as decimal) / cast(count(distinct all_raids.raid_id + all_raids.raid_hour) as decimal) * 100), 2) AS attendance'
      )
    )
    .from(knex.raw('player_raid AS pr'))
    .innerJoin(
      knex.raw('player_raid AS all_raids ON all_raids.raid_id IS NOT NULL')
    )
    .leftJoin(knex.raw('player AS p ON pr.player_id = p.id'))
    .groupBy(knex.raw('pr.player_id, p.name'));
};

const daysInRange = async (
  knex: Knex<any, unknown[]>,
  days: number
): Promise<AttendanceDatum[]> => {
  console.info(`Fetching attendance % for the past ${days} days`);
  return await knex
    .select(
      knex.raw(
        'p.name AS player_name, pr.player_id, round((cast(count(distinct pr.raid_id + pr.raid_hour) as decimal) / cast(count(distinct all_raids.raid_id + all_raids.raid_hour) as decimal) * 100), 2) AS attendance'
      )
    )
    .from(knex.raw('player_raid AS pr'))
    .innerJoin(
      knex.raw(
        `player_raid AS all_raids ON all_raids.raid_id IS NOT NULL AND all_raids.created_at > current_timestamp - interval '${days}' day`
      )
    )
    .leftJoin(knex.raw('player AS p ON pr.player_id = p.id'))
    .where(
      knex.raw(`pr.created_at > current_timestamp - interval '${days}' day`)
    )
    .groupBy(knex.raw('pr.player_id, p.name'));
};

const updateSheet = async (playerAttendance: (string | number)[][]) => {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const range = 'Attendance!A2:E';

  const sheets = await getSheets();
  sheets.spreadsheets.values.update(
    {
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      // @ts-ignore
      resource: {
        values: playerAttendance,
      },
    },
    (err: any) => {
      if (err) {
        log.error(`The API returned an error: ${err}`);
        return;
      } else {
        log.info(`Successfully updated attendance spreadsheet.`);
      }
    }
  );
};
