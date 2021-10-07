const conf = new (require("conf"))();
const chalk = require("chalk");
const Tail = require("tail-file");

let recording = false;
let currentZone = null;

module.exports = (name: string) => {
  const localDate = new Date().toLocaleDateString();
  const attendees = getAttendees(localDate);
  let lastTimestamp: number = 0;

  console.log(chalk.green.bold(`Recording raid ${name}@${localDate}`));
  conf.set(`raid-${localDate}`, { name, attendees });

  new Tail("eqlog.txt", (line: string) => {
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
        attendees.push(player);
        playersChanged(attendees);
      }
    }

    lastTimestamp = timestamp;
  });
};

const playersChanged = (attendees: string[]) => {
  console.log(chalk.green(attendees.join(", ")));
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
    line.match(/(There are ([0-9]+) players in EverQuest.)/gi)?.length === 1
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
  const regExp = new RegExp(
    /\[.+\] ([a-z]+) [\(a-z\)<> ]+: [a-z0-9' ]+ (\([a-z0-9'_]+\))/gi
  );
  const matches = regExp.exec(line);

  return {
    player: matches?.[1] || null,
    zone: matches?.[2]?.replace("(", "").replace(")", "") || null,
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

const getAttendees = (raidDate: string) => {
  const raidConfig = conf.get(`raid-${raidDate}`);
  let attendees = [];

  if (raidConfig?.attendees && raidConfig.attendees.length > 0) {
    console.log(
      chalk.blue.bold(
        `Recovered ${raidConfig.name} from previous run of the application...`
      )
    );
    attendees = raidConfig.attendees;
  }

  return attendees;
};
