exports.up = knex => knex.schema
  .createTable('Species', (table) => {
    table.increments('id').unsigned().primary();
    table.string('name').notNull();
  })
  .createTable('Sighting', (table) => {
    table.increments('id').unsigned().primary();
    table
      .integer('speciesId')
      .unsigned()
      .references('id')
      .inTable('Species');
    table.timestamp('dateTime').default(knex.fn.now()).notNull();
    table.text('description').nullable();
    table.integer('count').notNull();
  })
  .raw(`CREATE SCHEMA IF NOT EXISTS extensions;
        CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;`);

exports.down = knex => knex.schema
  .dropTableIfExists('Sighting')
  .dropTableIfExists('Species');
