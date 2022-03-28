import addPlayer from '@/commands/roster/add';
import addAlt from '@/commands/roster/add-alt';

it(`should allow us to create a player`, async () => {
  const player = await addPlayer([
    { name: 'karadin', class: 'warrior', level: 65 },
  ]);
  expect(player[0].name).toEqual('karadin');
});

it(`should not allow us to create the same player more than once`, async () => {
  const player = await addPlayer([
    { name: 'karadin', class: 'warrior', level: 65 },
  ]);
  const player2 = await addPlayer([
    { name: 'karadin', class: 'warrior', level: 65 },
  ]);
  expect(player[0].id).toEqual(player2[0].id);
});

it(`should allow alts to be added to mains`, async () => {
  const karadin = (
    await addPlayer([{ name: 'karadin', class: 'warrior', level: 65 }])
  )?.[0];

  const alts = await addAlt(karadin.id, [
    { name: 'mave', class: 'wizard', level: 65 },
    { name: 'chrym', class: 'bard', level: 65 },
    { name: 'kadalah', class: 'cleric', level: 65 },
  ]);

  expect(alts.length).toBe(3);
  expect(alts[0].player_id).toBe(karadin.id);
  expect(alts[1].player_id).toBe(karadin.id);
  expect(alts[2].player_id).toBe(karadin.id);
});
