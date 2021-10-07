"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__db__ = exports.__prod__ = void 0;
exports.__prod__ = process.env.NODE_ENV === "production";
exports.__db__ = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "postgrespassword",
    driver: process.env.DB_DRIVER || "postgresql",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "postgres",
    debug: !exports.__prod__,
};
//# sourceMappingURL=constants.js.map