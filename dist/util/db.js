"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = void 0;
const constants_1 = require("../constants");
const knex_1 = __importDefault(require("knex"));
let connection = null;
const getConnection = () => {
    if (!connection) {
        console.log("Spawning new connection");
        connection = (0, knex_1.default)({
            client: "pg",
            connection: constants_1.__db__,
            debug: constants_1.__db__.debug,
        });
    }
    return connection;
};
exports.getConnection = getConnection;
//# sourceMappingURL=db.js.map