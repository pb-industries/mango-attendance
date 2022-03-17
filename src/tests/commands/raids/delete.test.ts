import addRaid from '@/commands/raids/add';
import deleteRaid from '@/commands/raids/delete';

it(`allows us to delete raids`, async () => {
  const raid = await addRaid('Mistmoore', 9);
  const res = await deleteRaid([raid.id]);
  expect(res.data).toStrictEqual([raid.id]);
});
