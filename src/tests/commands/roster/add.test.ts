import addPlayer from '@/commands/roster/add';

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
