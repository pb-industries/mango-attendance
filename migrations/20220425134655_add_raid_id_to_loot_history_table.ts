module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('loot_history', (table) => {
      table
        .integer('raid_id')
        .references('id')
        .inTable('raid')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .notNullable();
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('loot_history', (table) => {
      table.dropColumn('raid_id');
    });
  },
};
