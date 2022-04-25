module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('loot_history', (table) => {
      table.increments('id').primary();
      table.integer('item_id').notNullable();
      table.integer('looted_by_id').notNullable();

      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table
        .foreign('item_id')
        .references('item.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');

      table
        .foreign('looted_by_id')
        .references('player.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('loot_history');
  },
};
