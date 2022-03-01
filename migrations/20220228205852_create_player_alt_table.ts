module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('player_alt', (table) => {
      table.increments('id').primary();
      table.integer('player_id').unsigned().notNullable();
      table.foreign('player_id').references('player.id');
      table.integer('alt_id').unsigned().notNullable();
      table.foreign('alt_id').references('player.id');
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('player_alt');
  },
};
