require("dotenv").config();

console.log(
  process.env.DB_HOST,
  process.env.DB_USER,
  process.env.DB_PASS,
  process.env.DB_NAME
);

module.exports = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASS || "postgrespassword",
      driver: process.env.DB_DRIVER || "postgresql",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "postgres",
    },
  },
  migrations: {
    directory: "./migrations",
  },
};
