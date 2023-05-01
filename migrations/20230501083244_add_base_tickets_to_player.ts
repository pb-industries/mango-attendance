module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('player', (table) => {
      table.integer('base_tickets');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('player', (table) => {
      table.dropColumn('base_tickets');
    });
  },
};
