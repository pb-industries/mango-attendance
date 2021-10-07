import { getConnection } from "../../util/db";
import chalk from "chalk";

export default async (players: string) => {
  const playersToRemove = players
    .split(",")
    .map((player) => player.trim().toLowerCase());

  const rows = await getConnection()
    .delete()
    .from("player")
    .whereIn("name", playersToRemove);

  console.log(chalk.green.bold("Removed players", rows));
};
