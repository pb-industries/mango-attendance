module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('user', (table) => {
      table.boolean('approved').defaultTo(false);
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('user', (table) => {
      table.dropColumn('approved');
    });
  },
};
