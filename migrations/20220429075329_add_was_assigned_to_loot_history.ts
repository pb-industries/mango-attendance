module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('loot_history', (table) => {
      table.boolean('was_assigned');
      table.setNullable('raid_id');
      table.dropForeign('raid_id');
      table.foreign('raid_id').references('raid.id').onDelete('SET NULL');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('loot_history', (table) => {
      table.dropColumn('was_assigned');
      table.dropNullable('raid_id');
      table.dropForeign('raid_id');
      table.foreign('raid_id').references('raid.id').onDelete('CASCADE');
    });
  },
};
