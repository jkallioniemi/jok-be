const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../.env'),
  sample: path.join(__dirname, '../.env.example'),
});

const dbconfig = {
  user: process.env.JOK_DATABASE_USER,
  password: process.env.JOK_DATABASE_PASSWORD,
  port: 5432,
  host: 'localhost',
};

process.env.NODE_ENV = 'test';
process.env.JOK_DATABASE_NAME = 'jok-test-db';
process.env.PORT = 8242;

const chai = require('chai');
const chaiHttp = require('chai-http');
const Knex = require('knex');
const knexConfig = require('../knexfile');
const server = require('../src/server');
const mocha = require('mocha');

const should = chai.should();
const knex = Knex(knexConfig.test);

chai.use(chaiHttp);

mocha.describe('API', () => {

  mocha.before((done) => {
    knex.migrate.latest()
      .then(() => knex.seed.run())
      .then(() => done());
  });

  mocha.after((done) => {
    knex.migrate.rollback()
      .then(() => {
        done();
      });
  });

});
