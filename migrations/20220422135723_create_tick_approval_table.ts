module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('request_tick', (table) => {
      table
        .integer('player_id')
        .notNullable()
        .references('id')
        .inTable('player')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
      table
        .integer('raid_id')
        .notNullable()
        .references('id')
        .inTable('raid')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
      table.integer('raid_hour').notNullable();
      table
        .integer('approved_by')
        .references('id')
        .inTable('player')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .defaultTo(null);
      table.timestamp('approved_at').defaultTo(null);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.primary(['player_id', 'raid_id', 'raid_hour']);
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('request_tick');
  },
};
