import { log } from '@/logger';
import { getConnection } from '@/util/db';
import bcrypt from 'bcryptjs';

export default async (
  username: string,
  password: string
): Promise<string | null> => {
  const knex = await getConnection();

  const rows = await knex
    .select('*')
    .from(knex.raw('defaultdb.user AS u'))
    .innerJoin(knex.raw('player AS pl ON u.player_id = pl.id'))
    .innerJoin(knex.raw('password AS p ON p.user_id = u.id'))
    .where(
      knex.raw(`LOWER(u.email) = '${username.replace(' ', '').toLowerCase()}'`)
    )
    .orWhere(
      knex.raw(`LOWER(pl.name) = '${username.replace(' ', '').toLowerCase()}'`)
    );

  if (!rows) {
    log.info('Player not found');
    return null;
  }

  const player = rows[0];
  if (await bcrypt.compare(password, player.hash)) {
    const token = Buffer.from(
      JSON.stringify({
        last_active: new Date().getTime(),
        user_id: player.user_id,
        player_id: player.id,
        player_name: player.name,
      })
    ).toString('base64');

    await knex(knex.raw('defaultdb.user'))
      .where('id', player.user_id)
      .update({ bot_token: token });

    return token;
  }

  return null;
};
