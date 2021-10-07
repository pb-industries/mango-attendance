import { __db__ } from "../constants";
import knex, { Knex } from "knex";

let connection: Knex<any, unknown[]> | null = null;

export const getConnection = () => {
  if (!connection) {
    console.log("Spawning new connection");
    connection = knex({
      client: "pg",
      connection: __db__,
      debug: __db__.debug,
    });
  }

  return connection;
};
