export const __prod__ = process.env.NODE_ENV === "production";
export const __db__ = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgrespassword",
  driver: process.env.DB_DRIVER || "postgresql",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "postgres",
  debug: !__prod__,
  // We need these as PG kills the connection if it takes more than 10s
  // 0 will allow the query to run forever.
  idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT_MILLIS || 0,
  connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT_MILLIS || 0,
};
