import { getConnection } from "../../util/db";

export default (players: string): void => {
  await getConnection().insert({}).into("players");
  const playersToAdd = players.split(",");
};
