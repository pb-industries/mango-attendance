module.exports = {
  up: async function (knex) {
    return knex.schema.createTable("player_raid", (table) => {
      table
        .integer("player_id")
        .notNullable()
        .references("id")
        .inTable("player");
      table.integer("raid_id").notNullable().references("id").inTable("raid");
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());

      table.primary(["player_id", "raid_id"]);
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable("player_raid");
  },
};
