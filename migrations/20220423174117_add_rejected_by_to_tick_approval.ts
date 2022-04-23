module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('request_tick', (table) => {
      table
        .integer('rejected_by')
        .references('id')
        .inTable('player')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .defaultTo(null);
      table.timestamp('rejected_at').defaultTo(null);
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('request_tick', (table) => {
      table.dropColumn('rejected_by');
      table.dropColumn('rejected_at');
    });
  },
};
