module.exports = {
  up: async function (knex) {
    return knex.schema.createTable("raid", (table) => {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      table.increments("id").primary();
      table.string("name").notNullable();
      table.timestamp("created_at").defaultTo(null);
      table.timestamp("updated_at").defaultTo(null);

      table.unique(["created_at"]);
    });
  },
  down: async function down(knex) {
    return knex.schema.dropTable("raid");
  },
};
