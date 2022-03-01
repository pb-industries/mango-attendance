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
