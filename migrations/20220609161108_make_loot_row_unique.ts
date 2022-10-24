module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('loot_history', (table) => {
      table.unique(['looted_by_id', 'created_at', 'item_id', 'raid_id'], {
        indexName: 'loot_composite_idx',
      });
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('loot_history', (table) => {
      table.dropUnique('loot_composite_idx');
    });
  },
};
