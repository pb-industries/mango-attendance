module.exports = {
  up: async function (knex) {
    return knex.schema.createTable("player", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.integer("attendance_30").nullable();
      table.integer("attendance_60").nullable();
      table.integer("attendance_90").nullable();
      table.integer("attendnace_life").nullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());

      table.unique("name");
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable("player");
  },
};
