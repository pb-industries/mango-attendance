require("dotenv").config();

module.exports = {
  development: {
    client: "pg",
    version: "21.2.4",
    connection: {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASS || "postgrespassword",
      port: process.env.DB_PORT || 5432,
      database: [process.env.DB_CLUSTER, process.env.DB_NAME || "postgres"].filter(v => v).join('.'),
      ssl: { rejectUnauthorized: true }
    },
  },
  migrations: {
    directory: "./migrations",
  },
};
