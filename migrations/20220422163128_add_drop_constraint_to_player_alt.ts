module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('player_alt', (table) => {
      table.dropForeign('alt_id');
      table.foreign('alt_id').references('player.id').onDelete('CASCADE');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('user', (table) => {
      table.dropForeign('alt_id');
      table.foreign('alt_id').references('player.id').onDelete('NO ACTION');
    });
  },
};
