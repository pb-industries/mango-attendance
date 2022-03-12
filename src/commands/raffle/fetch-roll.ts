// import { getConnection } from '../../util/db';

export default async (raidId: string, playerIds: string[]): Promise<string> => {
  //   const knex = await getConnection();

  // 1) Get 60 day RA for all entries

  // 2)
  return `${raidId} players: ${playerIds.join(', ')}`;
};
