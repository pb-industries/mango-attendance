module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('item', (table) => {
      table.dropColumn('info');
      table.string('lucy_url').notNullable();
      table.string('lucy_id').notNullable();
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('item', (table) => {
      table.dropColumn('lucy_id');
      table.dropColumn('lucy_url');
      table.jsonb('info').default({});
    });
  },
};
