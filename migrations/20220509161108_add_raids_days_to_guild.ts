module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('guild', (table) => {
      table.jsonb('raid_days').defaultTo('[]');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('guild', (table) => {
      table.dropColumn('raid_days');
    });
  },
};
