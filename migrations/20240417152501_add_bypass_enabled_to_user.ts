module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('user', (table) => {
      table.boolean('bypass_enabled').defaultsTo(false);
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('user', (table) => {
      table.dropColumn('bypass_enabled');
    });
  },
};
