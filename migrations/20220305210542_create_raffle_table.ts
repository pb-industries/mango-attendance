module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('raffle', (table) => {
      table.increments('id').primary();
      table.integer('raid_id').notNullable();
      table.integer('winner_id');
      table.string('roll_symbol');
      table.string('item_name').notNullable();
      table.integer('winning_roll');

      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.foreign('raid_id').references('raid.id');
      table.foreign('winner_id').references('player.id');
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('raffle');
  },
};
