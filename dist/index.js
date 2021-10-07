#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const commander_1 = require("commander");
const record_1 = __importDefault(require("./commands/record"));
const add_1 = __importDefault(require("./commands/roster/add"));
const remove_1 = __importDefault(require("./commands/roster/remove"));
commander_1.program
    .command("record <name>")
    .description("records a new raid")
    .action(record_1.default);
commander_1.program
    .command("roster-add <players>")
    .description("provide a comma separated list of players to add to our roster")
    .action(add_1.default);
commander_1.program
    .command("roster-del <players>")
    .description("provide a comma separated list of players to remove from our roster")
    .action(remove_1.default);
commander_1.program.parse();
//# sourceMappingURL=index.js.map