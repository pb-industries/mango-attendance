import { getConnection } from '../../util/db';

export default async (raidId: number): Promise<{ data: string }> => {
  const res = await getConnection().from('raid').where('id', raidId).del();
  console.log(res);

  return { data: `Raid ${raidId} deleted` };
};
