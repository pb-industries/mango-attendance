const conf = new (require("conf"))();
const chalk = require("chalk");
const Tail = require("tail-file");
let recording = false;
let currentZone = null;
module.exports = (name) => {
    const localDate = new Date().toLocaleDateString();
    const attendees = getAttendees(localDate);
    let lastTimestamp = 0;
    console.log(chalk.green.bold(`Recording raid ${name}@${localDate}`));
    conf.set(`raid-${localDate}`, { name, attendees });
    new Tail("eqlog.txt", (line) => {
        const { timestamp, shouldParse } = parseTimestamp(line, lastTimestamp);
        if (!shouldParse) {
            return;
        }
        const recordIteration = setRecordState(line);
        if (recordIteration && recording) {
            const { player } = extractAttendanceInfo(line);
            if (player && !attendees.includes(player)) {
                attendees.push(player);
                playersChanged(attendees);
            }
        }
        lastTimestamp = timestamp;
    });
};
const playersChanged = (attendees) => {
    console.log(chalk.green(attendees.join(", ")));
};
const setRecordState = (line) => {
    var _a, _b;
    if (((_a = line.match(/(Players in EverQuest:)/gi)) === null || _a === void 0 ? void 0 : _a.length) === 1) {
        console.log(chalk.yellow.bold("Recording started..."));
        recording = true;
        return false;
    }
    if (((_b = line.match(/(There are ([0-9]+) players in EverQuest.)/gi)) === null || _b === void 0 ? void 0 : _b.length) === 1) {
        console.log(chalk.red.bold("Recording ended..."));
        recording = false;
        return false;
    }
    return true;
};
const extractAttendanceInfo = (line) => {
    var _a;
    const regExp = new RegExp(/\[.+\] ([a-z]+) [\(a-z\)<> ]+: [a-z0-9' ]+ (\([a-z0-9'_]+\))/gi);
    const matches = regExp.exec(line);
    return {
        player: (matches === null || matches === void 0 ? void 0 : matches[1]) || null,
        zone: ((_a = matches === null || matches === void 0 ? void 0 : matches[2]) === null || _a === void 0 ? void 0 : _a.replace("(", "").replace(")", "")) || null,
    };
};
const parseTimestamp = (line, lastParsedTimestamp) => {
    var _a, _b;
    const dateTime = Date.parse(((_b = (_a = line
        .match(/\[[A-Za-z0-9: ]+\]/g)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.replace("[", "").replace("]", "")) || new Date().toLocaleString());
    return { timestamp: dateTime, shouldParse: dateTime >= lastParsedTimestamp };
};
const getAttendees = (raidDate) => {
    const raidConfig = conf.get(`raid-${raidDate}`);
    let attendees = [];
    if ((raidConfig === null || raidConfig === void 0 ? void 0 : raidConfig.attendees) && raidConfig.attendees.length > 0) {
        console.log(chalk.blue.bold(`Recovered ${raidConfig.name} from previous run of the application...`));
        attendees = raidConfig.attendees;
    }
    return attendees;
};
//# sourceMappingURL=record.js.map