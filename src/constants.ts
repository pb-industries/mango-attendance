export const __prod__ = process.env.NODE_ENV === "production";
export const __db__ = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgrespassword",
  driver: process.env.DB_DRIVER || "postgresql",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "postgres",
  debug: !__prod__,
};
