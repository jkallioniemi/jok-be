const path = require('path');

require('dotenv-safe').load({
  path: path.join(__dirname, '../../.env'),
  sample: path.join(__dirname, '../../.env.example'),
});

exports.up = knex => knex.schema
  // PostGIS does not work correctly without setting the search path like so
  .raw('ALTER DATABASE ?? SET search_path TO public, extensions', process.env.JOK_DATABASE_NAME)
  .table('Sighting', (table) => {
    table.specificType('location', 'extensions.geography(POINT, 4326)');
  });

exports.down = knex => knex.schema
  .table('Sighting', (table) => {
    table.dropColumn('location');
  });
