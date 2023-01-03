module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('user', (table) => {
      table.increments('id').primary();
      table.integer('player_id').notNullable();
      table.string('email');
      table.string('bot_token');

      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table
        .foreign('player_id')
        .references('player.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('user');
  },
};
