#! /usr/bin/env node
const { program } = require("commander");
const { google } = require("googleapis");
const record = require("./commands/record");

program
  .command("record <name>")
  .description("records a new raid")
  .action(record);

// const init = async () => {
//   const auth = new google.auth.GoogleAuth({
//     keyFile: "./secrets.json",
//     scopes: ["https://www.googleapis.com/auth/spreadsheets"],
//   });
//   const client = await auth.getClient();
// };

program.parse();
