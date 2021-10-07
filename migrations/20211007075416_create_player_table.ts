module.exports = {
  up: async function (knex) {
    return knex.schema.createTable("player", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.float("attendance_30").nullable();
      table.float("attendance_60").nullable();
      table.float("attendance_90").nullable();
      table.float("attendance_life").nullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());

      table.unique("name");
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable("player");
  },
};
