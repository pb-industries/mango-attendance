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
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeRows = exports.getRows = void 0;
const googleapis_1 = require("googleapis");
let client = null;
let auth;
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!auth) {
        auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_SHEET_KEY_FILE,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
    }
    if (!client) {
        client = yield auth.getClient();
    }
});
const getSheets = () => __awaiter(void 0, void 0, void 0, function* () {
    yield init();
    if (!client || !auth) {
        throw new Error("Could not instantiate google client");
    }
    return googleapis_1.google.sheets({ version: "v4", auth: client });
});
const getRows = (sheetName, range) => __awaiter(void 0, void 0, void 0, function* () {
    const sheets = yield getSheets();
    let parsedRange = sheetName + range ? `!${range}` : "";
    const { data } = yield sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: parsedRange,
    });
    return data === null || data === void 0 ? void 0 : data.values;
});
exports.getRows = getRows;
const writeRows = (sheetName) => __awaiter(void 0, void 0, void 0, function* () {
    const sheets = yield getSheets();
    let res = yield sheets.spreadsheets.values.update({
        auth: auth,
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: sheetName,
        valueInputOption: "RAW",
    });
    console.log(res);
});
exports.writeRows = writeRows;
//# sourceMappingURL=googleApi.js.map