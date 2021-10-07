"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../util/db");
exports.default = (players) => {
    yield (0, db_1.getConnection)().insert({}).into("players");
    const playersToAdd = players.split(",");
};
//# sourceMappingURL=add.js.map