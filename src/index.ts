#! /usr/bin/env node
require("dotenv").config();

import { program } from "commander";
import record from "./commands/record";
import rosterAdd from "./commands/roster/add";
import rosterDel from "./commands/roster/remove";

program
  .command("record <name>")
  .description("records a new raid")
  .action(record);

program
  .command("roster-add <players>")
  .description("provide a comma separated list of players to add to our roster")
  .action(rosterAdd);

program
  .command("roster-del <players>")
  .description(
    "provide a comma separated list of players to remove from our roster"
  )
  .action(rosterDel);

program.parse();
