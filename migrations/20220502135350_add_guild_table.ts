module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('guild', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.float('last_win_modifier').nullable().default(1);
      table.float('box_modifier').nullable().default(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.unique('name');
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('guild');
  },
};
