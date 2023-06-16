module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('audit', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.integer('from_player_id').nullable();
      table.integer('to_player_id').nullable();
      table.integer('audit_type');

      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table
        .foreign('user_id')
        .references('user.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');

      table
        .foreign('from_player_id')
        .references('player.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');

      table
        .foreign('to_player_id')
        .references('player.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('audit');
  },
};
