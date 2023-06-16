module.exports = {
  up: async function (knex) {
    return knex.schema.alterTable('audit', (table) => {
      table.integer('raid_id').nullable();
      table.string('message')
      table.dropColumn('audit_type')

      table
        .foreign('raid_id')
        .references('raid.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
  },
  down: async function (knex) {
    return knex.schema.alterTable('audit', (table) => {
      table.dropColumn('raid_id');
    });
  },
};
