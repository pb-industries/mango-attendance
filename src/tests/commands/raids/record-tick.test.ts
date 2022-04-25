import recordTick from '@/commands/raids/record-tick';
import addPlayer from '@/commands/roster/add';
import addRaid from '@/commands/raids/add';
import fetchPlayer from '@/commands/roster/fetch';
import calculateAttendance from '@/commands/raids/calculate-attendance';
import { getConnection } from '@/util/db';
import addAlt from '@/commands/roster/add-alt';

let raid: Raid;
const baseDate = new Date();
const addMinutesToDate = (minutes: number) =>
  new Date(
    new Date(baseDate.getTime()).setMinutes(baseDate.getMinutes() + minutes)
  );

const firstTickTime = addMinutesToDate(30);
const secondTickTime = addMinutesToDate(67);
const thirdTickTime = addMinutesToDate(127);

beforeEach(async () => {
  raid = await addRaid('Mistmoore', 5);
  const knex = await getConnection();
  await knex('player_raid').del();
});

it(`it allows us to record second and third ticks`, async () => {
  const onTimeTick = await recordTick(raid.id, ['karadin']);
  expect(onTimeTick.tick).toEqual(0);
  const firstTick = await recordTick(
    raid.id,
    ['karadin'],
    firstTickTime.getTime()
  );
  expect(firstTick.tick).toEqual(1);
  const secondTick = await recordTick(
    raid.id,
    ['karadin'],
    secondTickTime.getTime()
  );
  expect(secondTick.tick).toEqual(2);
  const thirdTick = await recordTick(
    raid.id,
    ['karadin'],
    thirdTickTime.getTime()
  );
  expect(thirdTick.tick).toEqual(3);
  const fourthFailedTick = await recordTick(
    raid.id,
    ['karadin'],
    addMinutesToDate(141).getTime()
  );
  expect(fourthFailedTick.tick).toEqual(3);
});

it(`allows us to record an early tick`, async () => {
  const onTimeTick = await recordTick(raid.id, ['karadin']);
  expect(onTimeTick.tick).toEqual(0);
  const immediateTick = await recordTick(raid.id, ['karadin']);
  expect(immediateTick.tick).toEqual(0);
  const firstTick = await recordTick(
    raid.id,
    ['karadin'],
    firstTickTime.getTime()
  );
  expect(firstTick.tick).toEqual(1);
});

it(`allows us to record a final tick`, async () => {
  const onTimeTick = await recordTick(raid.id, ['karadin']); // on time tick
  expect(onTimeTick.tick).toBe(0);
  const firstTick = await recordTick(
    raid.id,
    ['karadin'],
    firstTickTime.getTime()
  );
  expect(firstTick.tick).toBe(1);
  const finalTick = await recordTick(
    raid.id,
    ['karadin'],
    firstTickTime.getTime(),
    true
  );
  expect(finalTick.tick).toBe(firstTick.tick + 1);
});

it(`won't allow us to record another tick within the same hour`, async () => {
  const onTimeTick = await recordTick(raid.id, ['karadin']);
  expect(onTimeTick.tick).toEqual(0);
  const firstTick = await recordTick(
    raid.id,
    ['karadin'],
    firstTickTime.getTime()
  );
  expect(firstTick.tick).toEqual(1);
  const additionalTick = await recordTick(
    raid.id,
    ['karadin'],
    firstTickTime.getTime()
  );
  expect(additionalTick.tick).toEqual(firstTick.tick);
});

it(`will calculate the last 30, 60, 90 days of attendance for each player`, async () => {
  const players = await addPlayer([
    { name: 'tankpotato', class: 'warrior', level: 65 },
    { name: 'nerduun', class: 'warrior', level: 65 },
  ]);

  await recordTick(raid.id, ['tankpotato']);
  await recordTick(raid.id, ['tankpotato'], firstTickTime.getTime());
  await recordTick(
    raid.id,
    ['tankpotato', 'nerduun'],
    firstTickTime.getTime(),
    true
  );

  const tankpotato = (await fetchPlayer(players[0].id)).data as Player;
  const nerduun = (await fetchPlayer(players[1].id)).data as Player;

  await calculateAttendance();

  expect(tankpotato.attendance_30).toBe(100);
  expect(Math.floor(nerduun.attendance_30!)).toBe(33);
});

it(`if an alt is present on a raid, their attendance counts towards mains`, async () => {
  const players = await addPlayer([
    { name: 'tankpotato', class: 'warrior', level: 65 },
    { name: 'slowpotato', class: 'warrior', level: 65 },
  ]);

  await addAlt(players[0].id, [players[1]]);

  const raid = await addRaid('Citadel of Anguish', 11);
  await recordTick(raid.id, ['tankpotato']);
  await recordTick(raid.id, ['tankpotato'], firstTickTime.getTime());
  await recordTick(raid.id, ['slowpotato'], firstTickTime.getTime(), true);

  const tankpotato = (await fetchPlayer(players[0].id)).data as Player;
  const slowpotato = (await fetchPlayer(players[1].id)).data as Player;

  await calculateAttendance();

  expect(tankpotato.attendance_30).toBe(100);
  expect(Math.floor(slowpotato.attendance_30!)).toBe(0);
});
