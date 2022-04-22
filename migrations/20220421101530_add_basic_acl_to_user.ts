module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('user', (table) => {
      table.string('role').default('member');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('user', (table) => {
      table.dropColumn('role');
    });
  },
};
