import { getConnection } from '../../util/db';

export default async (
  cursor: number,
  direction: 'asc' | 'desc',
  pageSize: number,
  id?: number
): Promise<Page> => {
  let players = [];
  if (id) {
    players = await getConnection()
      .select('*')
      .from('player')
      .where('id', id)
      .first();
  } else {
    players = await getConnection()
      .select('*')
      .from('player')
      .where(`id`, `${direction === 'asc' ? '>' : '<'}`, `${cursor}`)
      .limit(pageSize);
  }

  return {
    data: players,
    totalRows: players.length,
    cursor,
    direction,
    pageSize,
    id,
  };
};
