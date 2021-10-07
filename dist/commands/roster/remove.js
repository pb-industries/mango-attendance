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
exports.default = (players) => __awaiter(void 0, void 0, void 0, function* () {
    const playersToRemove = players
        .split(",")
        .map((player) => player.trim().toLowerCase());
    const rows = yield (0, db_1.getConnection)()
        .delete()
        .from("player")
        .whereIn("name", playersToRemove);
    console.log(chalk_1.default.green.bold("Removed players", rows));
});
//# sourceMappingURL=remove.js.map