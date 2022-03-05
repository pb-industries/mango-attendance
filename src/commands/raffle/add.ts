import { getConnection } from '../../util/db';

export default async (
  raidId: number,
  itemName: string,
  rollSymbol: string
): Promise<number> => {
  const knex = await getConnection();

  const itemRaffle = await knex
    .insert({
      raid_id: raidId,
      item_name: itemName,
      roll_symbol: rollSymbol,
    })
    .into('raffle')
    .returning('*');

  return itemRaffle?.[0].id;
};
