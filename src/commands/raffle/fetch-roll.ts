import { getConnection } from '@/util/db';

export default async (playerNames: string[]): Promise<{}> => {
  const knex = await getConnection();
  const players = await knex
    .select(
      knex.raw(
        `
        p.*
        `
      )
    )
    .from(
      knex.raw(`
        (
            select
              pa.player_id
            from player_alt pa
            left join player p on pa.alt_id = p.id
            where name in ('${playerNames.join("','")}')
            union 
            select
              pa.player_id
            from player_alt pa
            left join player p on pa.player_id = p.id
            where name in ('${playerNames.join("','")}')
        ) pr
    `)
    )
    .innerJoin(knex.raw('player AS p ON pr.player_id = p.id'))
    .groupBy(knex.raw('p.id'))
    .orderBy('p.name', 'ASC');

  let total = 0;
  const debug = players.map((p: any) => {
    const res = {
      player: {
        id: p.id,
        name: p.name,
        tickets: parseInt(`${p.total_tickets ?? p.attendance_60 ?? 0}`, 10),
      },
      lower: total + 1,
      upper:
        total + parseInt(`${p.total_tickets ?? p?.attendance_60 ?? 0}`, 10) + 1,
    };

    total = res.upper;
    return res;
  });

  const rangeString = debug
    .map((t: any) => `${t.player.name} ${t.lower}-${t.upper}`)
    .join(' | ');

  return { tickets: debug, rangeString };
};
