module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('player_alt', (table) => {
      table.primary(['player_id', 'alt_id']);
      table.integer('player_id').unsigned().notNullable();
      table.foreign('player_id').references('player.id').onDelete('CASCADE');
      table.integer('alt_id').unsigned().notNullable();
      table.foreign('alt_id').references('player.id');
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('player_alt');
  },
};
