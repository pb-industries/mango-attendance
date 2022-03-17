import { getConnection } from '@/util/db';

export default async (raidId: number[]): Promise<{ data: number[] }> => {
  const knex = await getConnection();
  await knex.from('raid').whereIn('id', raidId).del();
  const remainingIds = await (
    await knex('raid').select('id').whereIn('id', raidId)
  ).map((row) => row.id);
  const deletedIds = raidId.filter((id) => !remainingIds.includes(id));
  return { data: deletedIds };
};
