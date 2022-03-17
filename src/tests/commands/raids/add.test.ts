import addRaid from '@/commands/raids/add';

it(`allows us to add a new raid for a given split`, async () => {
  const raid = await addRaid('Mistmoore', 1);
  expect(raid.name).toContain('mistmoore');
  expect(raid.split).toEqual('1');
});

it(`will rename an existing raid if one is created for the same split on a given day`, async () => {
  const raid = await addRaid('Butcherblock LDoN', 2);
  expect(raid.split).toEqual('2');
  expect(raid.name).toContain('butcherblock ldon');

  const raid2 = await addRaid('Plane of Time', 2);
  expect(raid2.id).toEqual(raid.id);
  expect(raid2.split).toEqual('2');
  expect(raid2.name).toContain('plane of time');
});

it(`will allow multiple raids to be created on the same day if a new split id is used`, async () => {
  const raid = await addRaid('Mistmoore', 3);
  expect(raid.split).toEqual('3');
  expect(raid.name).toContain('mistmoore');

  const raid2 = await addRaid('Mistmoores', 4);
  expect(raid2.split).toEqual('4');
  expect(raid2.name).toContain('mistmoores');
  expect(raid2.id).not.toEqual(raid.id);
});
