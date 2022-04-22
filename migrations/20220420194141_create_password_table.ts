module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('password', (table) => {
      table.string('hash').notNullable();
      table.integer('user_id').notNullable();

      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table
        .foreign('user_id')
        .references('user.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('password');
  },
};
