module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('loot_history', (table) => {
      table.integer('quantity').notNullable().default(1);
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('loot_history', (table) => {
      table.dropColumn('quantity');
    });
  },
};
