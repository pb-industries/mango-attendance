require("dotenv").config();

import { getConnection } from "../util/db";
import express from "express";
import pino from "express-pino-logger";
import record from "../commands/record";
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

app.post('/raid', async (req, res) => {
    const { name } = req.body;
    const raidInfo = await record(name)

    res.json(raidInfo);
})

app.listen(__port__, async () => {
    console.log(`Listening on port ${__port__}`);
  await getConnection()
    .select(["id", "name"])
    .from("player")
    .whereIn("name", ["karadin"]);
})

