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
import recordLoot from '@/commands/loot/record';
import { __port__ } from '@/constants';
import { log } from '@/logger';
import cors from 'cors';
import { disconnect, start } from './consumer';
import login, { loginWithToken } from '@/commands/login';
import produce from '@/server/producer';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(expressPino({ logger: log }));
app.use(cors({ origin: '*' }));

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
    const isFinalTick = final_tick ? true : false;
    const tickResult = await recordTick(
      raid_id,
      player_names,
      undefined,
      isFinalTick
    );
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

app.get('/raid/calculate-attendance', async (_, res) => {
  await calculateAttendance();
  res.send({ message: 'Recorded attendance' });
});

// RAFFLE endpoints
app.get('/raffle/tickets', async (req, res) => {
  let player_names = req.query?.player_names;
  if (!player_names) {
    player_names = req.body?.player_names;
  }
  if (!player_names) {
    res.status(400).send('Missing raffle id or player ids');
  } else {
    let names = [];
    if (typeof player_names === 'string') {
      names = player_names.split(',').map((id) => `${id}`);
    } else {
      names = player_names as string[];
    }
    res.status(200).send(await fetchRaffleRolls(names));
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

app.post('/raffle/:raffleId}', (req, res) => {
  const { raffleId } = req.query;
  if (!raffleId) {
    res.status(400).send('Missing raffle id');
  } else {
    // TODO implement setting the winner
    res.status(200).send({ data: { raffle_id: raffleId } });
  }
});

app.post('/raid/:raidId/loot', async (req, res) => {
  const { raidId } = req.params;
  const { lootLines } = req.body as {
    lootLines: {
      playerName: string;
      itemName: string;
      quantity?: number;
      lootedFrom?: string;
      wasAssigned: boolean;
    }[];
  };
  if (typeof raidId !== 'string' || !lootLines) {
    res.status(400).send('Missing raid id or loot lines');
  } else {
    const loot_recorded = await recordLoot(raidId, lootLines);
    res.status(200).send({ data: { loot_recorded } });
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

app.post('/login', async (req, res) => {
  const { username, password, token } = req.body;
  const strategy = token ? 'token' : 'credentials';

  let authToken;
  if (token) {
    authToken = await loginWithToken(token);
  } else {
    authToken = await login(username, password);
  }

  try {
    produce('bot_audit', [
      {
        value: JSON.stringify({
          success: !!authToken,
          action: 'login',
          strategy,
          username,
          ip: req.headers['x-forwarded-for'] ?? req.ip,
          token,
        }),
      },
    ]);
  } catch (e) {
    console.log('cant start producer');
    console.error(e);
  }

  res.send({ success: !!authToken, token: authToken });
});

app.get('/health', async (_, res) => {
  res.send({
    port: __port__,
    message: 'OK',
  });
});

app.listen(__port__, async () => {
  console.log(`Listening on port ${__port__}`);
  console.log('Starting kafka consumer');
  try {
    await start('loot-mango').catch(async (e) => {
      console.error(e);
      await disconnect();
    });
  } catch (e) {
    console.log('cant start consumer');
    console.error(e);
  }
});
