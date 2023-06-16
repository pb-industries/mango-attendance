module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('audit', (table) => {
      table.integer('type').nullable();
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('audit', (table) => {
      table.dropColumn('type');
    });
  },
};
