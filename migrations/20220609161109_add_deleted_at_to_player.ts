module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('player', (table) => {
      table.timestamp('deleted_at').defaultTo(null);
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('player', (table) => {
      table.dropColumn('deleted_at');
    });
  },
};
