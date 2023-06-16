module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('audit', (table) => {
      table.integer('item_id').nullable();
      table.dropColumn('loot_id');

      table
        .foreign('item_id')
        .references('item.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('audit', (table) => {
      table.dropColumn('item_id');
    });
  },
};
