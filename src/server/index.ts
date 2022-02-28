
import 'dotenv/config'

import express from "express";
import pino from "express-pino-logger";
import add from '../commands/raids/add';
import { __port__ } from '../constants'

const app = express();

app.use(pino);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");
  next();
});

app.post('raid', async (req, res) => {
  console.log('here')
  res.send({ 'message': 'done '})
    const { name } = req.body;
    console.log(name)
    if (!name) {
      res.status(400).send('Missing raid name');
    } else {
      const { id, name: raidName, date } = await add(name);
      res.status(200).send({ id, name: `${raidName}@${date}` });
    }
})

app.get('raids', async (_, res) => {
  console.log('here')
  res.send({ 'message': 'done '})
})

app.listen(__port__, async () => {
    console.log(`Listening on port ${__port__}`);
})

