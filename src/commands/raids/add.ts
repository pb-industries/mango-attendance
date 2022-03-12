import { getConnection } from '../../util/db';

export default async (
  raidName: string,
  split?: number
): Promise<{ id: number; name: string; date: string; split: number }> => {
  const date = new Date().toLocaleDateString();
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
  if (raid) {
    await knex('raid')
      .where('id', raid.id)
      .update({ updated_at: new Date(), name: raidName });
  } else {
    const raids = await knex
      .insert({
        name: raidName.toLowerCase(),
        split: split,
        created_at: date,
        updated_at: date,
      })
      .into('raid')
      .returning('*');

    raid = raids[0];
  }

  return { id: raid?.id, name: `${raidName}@${date}`, date, split };
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
  month = month.length > 1 ? month : "0" + month;

  var day = date.getDate().toString();
  day = day.length > 1 ? day : "0" + day;

  return month + "/" + day + "/" + year;
};
