const path = require('path');

require('dotenv-safe').load({
  path: path.join(__dirname, './.env'),
  sample: path.join(__dirname, './.env.example'),
});

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      port: process.env.JOK_DATABASE_PORT,
      host: process.env.JOK_DATABASE_HOST,
      database: process.env.JOK_DATABASE_NAME,
      user: process.env.JOK_DATABASE_USER,
      password: process.env.JOK_DATABASE_PASSWORD,
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './db/seeds/dev',
    },
  },

};
