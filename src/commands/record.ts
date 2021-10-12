import chalk from "chalk";
// @ts-ignore
import Tail from "tail-file";
import { debounce } from "lodash";
import { getConnection } from "../util/db";
import addRaid from "./raids/add";

let raid_id: number | null = null;
let recording = false;
let attendees: string[] = [];
let attendeeMetadata: {
  [key: string]: { id: number; recordedAttendance: boolean };
} = {};
const fetchPlayers = async () => {
  const players = await getConnection()
    .select(["id", "name"])
    .from("player")
    .whereIn("name", attendees);

  players.forEach((player) => {
    if (!attendeeMetadata[player.name.toLowerCase()]) {
      attendeeMetadata[player.name.toLowerCase()] = {
        id: player.id,
        recordedAttendance: false,
      };
    }
  });

  await recordAttendance();
};
const fetchPlayersDebounced = debounce(fetchPlayers, 2000);

export default async (raidName: string) => {
  let lastTimestamp: number = new Date().getTime();
  const { id, name } = await addRaid(raidName);
  raid_id = id;

  console.log(chalk.green.bold(`Recording raid ${name}`));

  new Tail(process.env.LOG_FILE_PATH, (line: string) => {
    const { timestamp, shouldParse } = parseTimestamp(line, lastTimestamp);
    // We don't want to reparse the same lines
    if (!shouldParse) {
      return;
    }
    // On each line parsed, we need to check if we should set the recording state to true or false
    // lines are always sequential and JS is a single threaded language so we can safely
    // procedurally parse lines in the order we receive them.
    const recordIteration = setRecordState(line);
    if (recordIteration && recording) {
      // Later lets extract zone info so we can check if the player is in the raid
      const { player } = extractAttendanceInfo(line);
      if (player && !attendees.includes(player)) {
        attendees.push(player.toLowerCase());
        fetchPlayersDebounced();
      }
    }

    lastTimestamp = timestamp;
  });
};

/**
 * Sets the global recording state based on whether we are parsing a /who request or not
 * We return true if this was not a line which triggered recording to change
 * or false if recording did change (we don't need to parse player info
 * from a line which caused the recording state to change.)
 *
 * @param line
 * @returns
 */
const setRecordState = (line: string): boolean => {
  if (line.match(/(Players in EverQuest:)/gi)?.length === 1) {
    console.log(chalk.yellow.bold("Recording started..."));
    recording = true;
    return false;
  }

  if (
    line.match(/(There are ([0-9]+) players in EverQuest.)/gi)?.length === 1 ||
    line.match(/There is 1 player in EverQuest./gi)?.length === 1
  ) {
    console.log(chalk.red.bold("Recording ended..."));
    recording = false;
    return false;
  }

  return true;
};

/**
 * Given a line, extract the players name and the zone so that we can
 * check their attendance.
 *
 * @param line
 * @returns
 */
const extractAttendanceInfo = (line: string) => {
  const regExp = new RegExp(/\[.+\] ([a-z]+) [\(a-z\)<> ]+/gi);
  const matches = regExp.exec(line);

  return {
    player: matches?.[1] || null,
  };
};

const parseTimestamp = (line: string, lastParsedTimestamp: number) => {
  const dateTime = Date.parse(
    line
      .match(/\[[A-Za-z0-9: ]+\]/g)?.[0]
      ?.replace("[", "")
      .replace("]", "") || new Date().toLocaleString()
  );

  // Don't re-parse lines we've already parsed
  return { timestamp: dateTime, shouldParse: dateTime >= lastParsedTimestamp };
};

/**
 * Given a list of players, record their attendance each time the player
 * list updates.
 */
const recordAttendance = async () => {
  const playersToRecord = Object.values(attendeeMetadata)
    .filter(({ recordedAttendance }) => recordedAttendance === false)
    .map(({ id }) => {
      return { raid_id, player_id: id };
    });

  console.log(playersToRecord);
  if (playersToRecord.length) {
    await getConnection()
      .insert(playersToRecord)
      .into("player_raid")
      .onConflict(["player_id", "raid_id"])
      .merge({ updated_at: new Date() });

    console.log(chalk.blue("Successfully recorded attendance"));
  }
};
