module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('audit', (table) => {
      table.integer('loot_id').nullable();

      table
        .foreign('loot_id')
        .references('loot_history.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('audit', (table) => {
      table.dropColumn('loot_id');
    });
  },
};
