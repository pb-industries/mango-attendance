import 'dotenv/config';

import express from 'express';
import expressPino from 'express-pino-logger';
import fetchRaid from '../commands/raids/fetch';
import addRaid from '../commands/raids/add';
import deleteRaid from '../commands/raids/delete';
import fetchRoster from '../commands/roster/fetch';
import { __port__ } from '../constants';
import { log } from '../logger';

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
    const { id, name: raidName, date } = await addRaid(name, parseInt(split));
    res.status(200).send({ id, name: `${raidName}@${date}`, split });
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

// ROSTER endpoints
app.get('/roster', async (req, res) => {
  const { cursor, direction, pageSize, id } = req.query as any as Page;
  const roster = await fetchRoster(
    cursor ?? 0,
    direction ?? 'asc',
    pageSize ?? 20,
    id
  );
  res.send(roster);
});

app.listen(__port__, async () => {
  console.log(`Listening on port ${__port__}`);
});
