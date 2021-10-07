import { getConnection } from "../../util/db";
import chalk from "chalk";

export default async (players: string) => {
  const playersToAdd = players.split(",").map((player) => {
    return {
      name: player.trim().toLowerCase(),
    };
  });

  const rows = await getConnection()
    .insert(playersToAdd)
    .into("player")
    .onConflict(["name"])
    .merge({ updated_at: new Date() });

  console.log(chalk.green.bold("Inserted players", rows));
};
