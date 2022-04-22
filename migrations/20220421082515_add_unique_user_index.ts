module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('password', (table) => {
      table.unique('user_id');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('password', (table) => {
      table.dropUnique('user_id');
    });
  },
};
