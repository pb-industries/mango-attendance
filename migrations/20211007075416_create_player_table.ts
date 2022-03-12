module.exports = {
  up: async function (knex) {
    return knex.schema.createTable('player', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.integer('level').nullable().defaultTo(0);
      table.string('class').nullable();
      table.float('attendance_30').nullable();
      table.float('attendance_60').nullable();
      table.float('attendance_90').nullable();
      table.float('attendance_life').nullable();
      table.integer('ticks_since_last_win').nullable().defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.unique('name');
    });
  },
  down: async function (knex) {
    return knex.schema.dropTable('player');
  },
};
