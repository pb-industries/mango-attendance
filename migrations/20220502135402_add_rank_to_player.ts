module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('player', (table) => {
      table.string('rank').default('alt');
      table
        .integer('guild_id')
        .references('id')
        .inTable('guild')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')
        .defaultTo(null);
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('player', (table) => {
      table.dropColumn('rank');
      table.dropColumn('guild_id');
    });
  },
};
