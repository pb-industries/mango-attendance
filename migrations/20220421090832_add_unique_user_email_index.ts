module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('user', (table) => {
      table.unique('email');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('user', (table) => {
      table.dropUnique('email');
    });
  },
};
