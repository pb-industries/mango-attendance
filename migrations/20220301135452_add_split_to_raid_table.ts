module.exports = {
  up: async function (knex) {
    return knex.schema.table('raid', (table) => {
      table.string('split').notNullable().defaultTo('1');
      table.unique(['created_at', 'split']);
    });
  },
  down: async function (knex) {
    return knex.schema.table('raid', (table) => {
      table.dropColumn('split');
    });
  },
};
