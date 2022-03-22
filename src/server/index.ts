// Do not modify this line, this imports dev tooling for compiling
// from typescript to javascript.
import 'module-alias/register';
import 'source-map-support/register';

import 'dotenv/config';

import express from 'express';
import expressPino from 'express-pino-logger';
import fetchRaid from '@/commands/raids/fetch';
import addRaid from '@/commands/raids/add';
import deleteRaid from '@/commands/raids/delete';
import calculateAttendance from '@/commands/raids/calculate-attendance';
import recordTick from '@/commands/raids/record-tick';
import fetchRoster from '@/commands/roster/fetch';
import addAlt from '@/commands/roster/add-alt';
import addPlayer from '@/commands/roster/add';
import addRaffle from '@/commands/raffle/add';
import fetchRaffleRolls from '@/commands/raffle/fetch-roll';
import { __port__ } from '@/constants';
import { log } from '@/logger';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(expressPino({ logger: log }));

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

// RAID endpoints
app.post('/raid', async (req, res) => {
  const { name, split } = req.body;
  if (!name) {
    res.status(400).send('Missing raid name');
  } else {
    const data = await addRaid(name, parseInt(split));
    res.status(200).send({ ...data, split });
  }
});

app.post('/raid/tick', async (req, res) => {
  let { raid_id, player_names, final_tick } = req.body;
  if (!raid_id || !player_names) {
    res.status(400).send('Missing raid id or player names');
  } else {
    if (typeof player_names === 'string') {
      player_names = player_names.split(',');
    }
    const isFinalTick = final_tick ? 1 : 0;
    const tickResult = await recordTick(raid_id, player_names, isFinalTick);
    await calculateAttendance();
    res.status(200).send({ data: { tick_result: tickResult } });
  }
});

app.delete('/raid', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).send('Missing raid id');
  } else {
    res.status(200).send(await deleteRaid(id));
  }
});

app.get('/raid', async (req, res) => {
  const { cursor, direction, pageSize, id } = req.query as any as Page;
  const raids = await fetchRaid(
    cursor ?? 0,
    direction ?? 'asc',
    pageSize ?? 20,
    id
  );
  res.send(raids);
});

// RAFFLE endpoints
app.get('/raffle/tickets', async (req, res) => {
  let { raffle_id, player_ids } = req.body;
  if (!raffle_id || !player_ids) {
    res.status(400).send('Missing raffle id or player ids');
  } else {
    if (typeof player_ids === 'string') {
      player_ids = player_ids.split(',').map((id) => `${id}`);
    }
    res.status(200).send(await fetchRaffleRolls(raffle_id, player_ids));
  }
});

app.post('/raffle', async (req, res) => {
  const { raid_id, item_name, roll_symbol } = req.body;
  if (!raid_id || !item_name || !roll_symbol) {
    res.status(400).send('Missing raid id, item name, or roll symbol');
  } else {
    const raffleId = await addRaffle(raid_id, item_name, roll_symbol);
    res.status(200).send({ data: { raffle_id: raffleId } });
  }
});

app.post('/raffle/{raffleId}', (req, res) => {
  const { raffle_id } = req.query;
  if (!raffle_id) {
    res.status(400).send('Missing raffle id');
  } else {
    // TODO implement setting the winner
    res.status(200).send({ data: { raffle_id: raffle_id } });
  }
});

// ROSTER endpoints
app.get('/roster', async (req, res) => {
  const { id, mains_only } = req.query as any;
  const roster = await fetchRoster(id, mains_only);
  res.send(roster);
});

app.post('/roster', async (req, res) => {
  const { players } = req.body as { players: Player[] };
  if (!players) {
    res.status(400).send('Missing players');
  } else {
    try {
      res.send({ data: await addPlayer(players) });
    } catch (e) {
      log.error(e);
      res.status(500).send(e.message);
    }
  }
});

app.post('/roster/alt', async (req, res) => {
  let { main_id, alt_params } = req.body;
  if (!alt_params) {
    res.status(400).send('Missing alt ids');
  } else if (!main_id) {
    res.status(400).send('Missing main id');
  } else {
    if (typeof alt_params === 'string') {
      alt_params = alt_params.split(',').map((id) => {
        name: id;
      });
    }

    res.send({
      data: await addAlt(`${main_id}`, alt_params),
    });
  }
});

app.get('/health', async (_, res) => {
  res.send({
    port: __port__,
    message: 'OK',
  });
});

app.listen(__port__, async () => {
  console.log(`Listening on port ${__port__}`);
});
