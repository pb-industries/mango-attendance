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
const db_1 = require("../../util/db");
const chalk_1 = __importDefault(require("chalk"));
const googleApi_1 = require("../../util/googleApi");
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getConnection)();
    const playerAttendance = {};
    const attendanceData = [
        { name: "attendance_life", data: yield allTime(conn) },
        { name: "attendance_30", data: yield daysInRange(conn, 30) },
        { name: "attendance_60", data: yield daysInRange(conn, 60) },
        { name: "attendance_90", data: yield daysInRange(conn, 90) },
    ];
    attendanceData.forEach(({ name, data }) => {
        data.forEach(({ player_id, player_name, attendance }) => {
            if (!playerAttendance[player_id]) {
                playerAttendance[player_id] = {
                    player_name,
                    player_id,
                    attendance_life: 0,
                    attendance_30: 0,
                    attendance_60: 0,
                    attendance_90: 0,
                };
            }
            if (player_id) {
                playerAttendance[player_id][name] = parseFloat(attendance);
            }
        });
    });
    conn.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
        const sheetRows = [];
        const updates = Object.values(playerAttendance).map((attendance) => {
            const { player_id, player_name } = attendance;
            delete attendance.player_id;
            delete attendance.player_name;
            sheetRows.push([
                player_name,
                attendance.attendance_30,
                attendance.attendance_60,
                attendance.attendance_90,
                attendance.attendance_life,
            ]);
            return trx("player")
                .update(attendance)
                .where({ id: player_id })
                .transacting(trx);
        });
        try {
            yield Promise.all(updates);
            yield trx.commit();
            console.log(chalk_1.default.green.bold(`Successfully updated attendance of all members.`));
            yield updateSheet(sheetRows);
        }
        catch (e) {
            console.log(e);
            console.log(chalk_1.default.red("unexpected error when saving attendance"));
            yield trx.rollback();
            throw e;
        }
    }));
});
const allTime = (conn) => __awaiter(void 0, void 0, void 0, function* () {
    return yield conn
        .select(conn.raw("p.name AS player_name, pr.player_id, round((cast(count(distinct pr.raid_id) as decimal) / cast(count(distinct all_raids.raid_id) as decimal) * 100), 2) AS attendance"))
        .from(conn.raw("player_raid AS pr"))
        .innerJoin(conn.raw("player_raid AS all_raids ON all_raids.raid_id IS NOT NULL"))
        .leftJoin(conn.raw("player AS p ON pr.player_id = p.id"))
        .groupBy(conn.raw("pr.player_id, p.name"));
});
const daysInRange = (conn, days) => __awaiter(void 0, void 0, void 0, function* () {
    return yield conn
        .select(conn.raw("p.name AS player_name, pr.player_id, round((cast(count(distinct pr.raid_id) as decimal) / cast(count(distinct all_raids.raid_id) as decimal) * 100), 2) AS attendance"))
        .from(conn.raw("player_raid AS pr"))
        .innerJoin(conn.raw(`player_raid AS all_raids ON all_raids.raid_id IS NOT NULL AND all_raids.created_at > current_timestamp - interval '${days}' day`))
        .leftJoin(conn.raw("player AS p ON pr.player_id = p.id"))
        .where(conn.raw(`pr.created_at > current_timestamp - interval '${days}' day`))
        .groupBy(conn.raw("pr.player_id, p.name"));
});
const updateSheet = (playerAttendance) => __awaiter(void 0, void 0, void 0, function* () {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = "Attendance!A2:E";
    const sheets = yield (0, googleApi_1.getSheets)();
    sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        resource: {
            values: playerAttendance,
        },
    }, (err) => {
        if (err) {
            console.log(chalk_1.default.red(`The API returned an error: ${err}`));
            return;
        }
        else {
            console.log(chalk_1.default.green.bold(`Successfully updated attendance spreadsheet.`));
        }
    });
});
//# sourceMappingURL=calculateAttendance.js.map