"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const tail_file_1 = __importDefault(require("tail-file"));
const lodash_1 = require("lodash");
const db_1 = require("../util/db");
const add_1 = __importDefault(require("./raids/add"));
let raid_id = null;
let recording = false;
let attendees = [];
let attendeeMetadata = {};
const fetchPlayers = () => __awaiter(void 0, void 0, void 0, function* () {
    const players = yield (0, db_1.getConnection)()
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
    yield recordAttendance();
});
const fetchPlayersDebounced = (0, lodash_1.debounce)(fetchPlayers, 2000);
exports.default = (raidName) => __awaiter(void 0, void 0, void 0, function* () {
    let lastTimestamp = 0;
    const { id, name } = yield (0, add_1.default)(raidName);
    raid_id = id;
    console.log(chalk_1.default.green.bold(`Recording raid ${name}`));
    new tail_file_1.default("eqlog.txt", (line) => {
        const { timestamp, shouldParse } = parseTimestamp(line, lastTimestamp);
        if (!shouldParse) {
            return;
        }
        const recordIteration = setRecordState(line);
        if (recordIteration && recording) {
            const { player } = extractAttendanceInfo(line);
            if (player && !attendees.includes(player)) {
                attendees.push(player.toLowerCase());
                fetchPlayersDebounced();
            }
        }
        lastTimestamp = timestamp;
    });
});
const setRecordState = (line) => {
    var _a, _b;
    if (((_a = line.match(/(Players in EverQuest:)/gi)) === null || _a === void 0 ? void 0 : _a.length) === 1) {
        console.log(chalk_1.default.yellow.bold("Recording started..."));
        recording = true;
        return false;
    }
    if (((_b = line.match(/(There are ([0-9]+) players in EverQuest.)/gi)) === null || _b === void 0 ? void 0 : _b.length) === 1) {
        console.log(chalk_1.default.red.bold("Recording ended..."));
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
const recordAttendance = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(attendeeMetadata);
    const playersToRecord = Object.values(attendeeMetadata)
        .filter(({ recordedAttendance }) => recordedAttendance === false)
        .map(({ id }) => {
        return { raid_id, player_id: id };
    });
    console.log(playersToRecord);
    if (playersToRecord.length) {
        const rows = yield (0, db_1.getConnection)()
            .insert(playersToRecord)
            .into("player_raid")
            .onConflict(["player_id", "raid_id"])
            .merge({ updated_at: new Date() });
        console.log(rows);
        console.log(chalk_1.default.blue("Recorded attendance for " + rows.length + " players"));
    }
});
//# sourceMappingURL=record.js.map