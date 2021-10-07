#! /usr/bin/env node
const { program } = require("commander");
const { google } = require("googleapis");
const record = require("./commands/record");
program
    .command("record <name>")
    .description("records a new raid")
    .action(record);
program.parse();
//# sourceMappingURL=index.js.map