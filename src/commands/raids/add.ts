import { getConnection } from '@/util/db';

export default async (raidName: string, split?: number): Promise<Raid> => {
  const rawDate = new Date();
  const date = getFormattedDate(rawDate);
  if (!split) {
    split = 1;
  }

  const knex = await getConnection();

  let raid = await knex
    .select('*')
    .from('raid')
    .where('created_at', date)
    .andWhere('split', split)
    .first();

  // TODO: If we support multi guild, each request should derive a guild ID
  const res = await knex.select('raid_days').from('guild').first();
  const officialRaidDays = (res?.['raid_days'] ?? []) as number[];
  const isOfficial =
    officialRaidDays.length === 0 ||
    officialRaidDays.includes(rawDate.getDay());

  if (raid) {
    const params = {
      updated_at: date,
      name: raidName.toLowerCase().trim(),
      is_official: isOfficial,
    };
    await knex('raid').where('id', raid.id).update(params);
    raid = { ...raid, ...params };
  } else {
    const raids = await knex
      .insert({
        name: raidName.toLowerCase(),
        split: split,
        is_official: isOfficial,
        created_at: date,
        updated_at: date,
      })
      .into('raid')
      .returning('*');

    raid = raids[0];
  }

  return raid;
};

/**
 * Postgres requires a date in mm/dd/yyyy format, the default
 * of date.toLocaleDateString is dd/mm/yyyy
 *
 * @param date
 * @returns
 */
const getFormattedDate = (date: Date) => {
  var year = date.getFullYear();

  var month = (1 + date.getMonth()).toString();
  month = month.length > 1 ? month : '0' + month;

  var day = date.getDate().toString();
  day = day.length > 1 ? day : '0' + day;

  return month + '/' + day + '/' + year;
};
