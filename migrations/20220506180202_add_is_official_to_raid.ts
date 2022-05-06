module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('raid', (table) => {
      table.boolean('is_official').defaultTo(true);
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('raid', (table) => {
      table.dropColumn('is_official');
    });
  },
};
