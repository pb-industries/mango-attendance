module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('player', (table) => {
      table.integer('total_tickets');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('player', (table) => {
      table.dropColumn('total_tickets');
    });
  },
};
