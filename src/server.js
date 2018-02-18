// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { port, env } = require('./config/vars');
const { Model } = require('objection');
const Knex = require('knex');
const knexConfig = require('../knexfile');
const app = require('./config/express');

// initialize knex and objection
const knex = Knex(knexConfig[env]);
Model.knex(knex);

// listen to requests
const server = app.listen(port, () => console.info(`server started on port ${port} (${env})`));

const stop = () => {
  server.close();
};

/**
* Exports express
* @public
*/
module.exports = app;
module.exports.stop = stop;
