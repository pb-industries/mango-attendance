module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('loot_history', (table) => {
      table.string('looted_from');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('loot_history', (table) => {
      table.dropColumn('looted_from');
    });
  },
};
