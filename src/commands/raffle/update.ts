import { log } from '@/logger';
import { getConnection } from '@/util/db';

export default async (
  raffleId: number,
  winnerId: number,
  winningRoll: number
): Promise<boolean> => {
  const knex = await getConnection();

  const raffle = await knex('raffle').where('id', raffleId).first();
  if (!raffle) {
    return false;
  }

  try {
    await knex
      .update({
        winner_id: winnerId,
        winning_roll: winningRoll,
      })
      .where('id', raffleId);
    return true;
  } catch (e) {
    log.error(e);
    return false;
  }
};
