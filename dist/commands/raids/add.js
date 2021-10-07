"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../util/db");
exports.default = (raidName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const date = new Date().toLocaleDateString();
    const raids = yield (0, db_1.getConnection)()
        .insert({
        name: raidName.toLowerCase(),
        created_at: date,
        updated_at: date,
    })
        .into("raid")
        .onConflict(["created_at"])
        .merge({ updated_at: new Date(), name: raidName })
        .returning("*");
    return { id: (_a = raids[0]) === null || _a === void 0 ? void 0 : _a.id, name: `${raidName}@${date}`, date };
});
//# sourceMappingURL=add.js.map