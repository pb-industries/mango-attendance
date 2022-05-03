module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('player', (table) => {
      table.integer('total_boxes');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('player', (table) => {
      table.dropColumn('total_boxes');
    });
  },
};
