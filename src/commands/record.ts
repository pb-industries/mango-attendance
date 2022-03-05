// @ts-ignore
import Tail from 'tail-file';
import addRaid from './raids/add';
import { log } from '../logger';

let recording = false;
const attendees: string[] = [];

export default async (raidName: string) => {
  let lastTimestamp = 0;
  const { name } = await addRaid(raidName);

  log.info(`Recording raid ${name}`);

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
        // TODO: HTTP TO SERVER TO RECORD TICK
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
    log.info('Recording started...');
    recording = true;
    return false;
  }

  if (
    line.match(/(There are ([0-9]+) players in EverQuest.)/gi)?.length === 1
  ) {
    log.info('Recording ended...');
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
  const regExp = new RegExp(
    /\[.+\] ([a-z]+) [\(a-z\)<> ]+: [a-z0-9' ]+ (\([a-z0-9'_]+\))/gi
  );
  const matches = regExp.exec(line);

  return {
    player: matches?.[1] || null,
    zone: matches?.[2]?.replace('(', '').replace(')', '') || null,
  };
};

const parseTimestamp = (line: string, lastParsedTimestamp: number) => {
  const dateTime = Date.parse(
    line
      .match(/\[[A-Za-z0-9: ]+\]/g)?.[0]
      ?.replace('[', '')
      .replace(']', '') || new Date().toLocaleString()
  );

  // Don't re-parse lines we've already parsed
  return { timestamp: dateTime, shouldParse: dateTime >= lastParsedTimestamp };
};
