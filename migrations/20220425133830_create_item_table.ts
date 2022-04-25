module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('item', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.jsonb('info').nullable().defaultTo({});
      table.string('category').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('item');
  },
};
