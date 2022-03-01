module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('raid', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  },
  down: async function down(knex) {
    return knex.schema.dropTable('raid');
  },
};
