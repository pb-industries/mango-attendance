import { getConnection } from '../../util/db';

export default async (
  cursor: number,
  direction: 'asc' | 'desc',
  pageSize: number,
  id?: number
): Promise<Page> => {
  let raids = [];
  if (id) {
    raids = await getConnection()
      .select('*')
      .from('raid')
      .where('id', id)
      .first();
  } else {
    raids = await getConnection()
      .select('*')
      .from('raid')
      .where(`id`, `${direction === 'asc' ? '>' : '<'}`, `${cursor}`)
      .limit(pageSize);
  }

  return {
    data: raids,
    totalRows: raids.length,
    cursor,
    direction,
    pageSize,
    id,
  };
};
