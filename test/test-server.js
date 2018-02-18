const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../.env'),
  sample: path.join(__dirname, '../.env.example'),
});

process.env.NODE_ENV = 'test';
process.env.JOK_DATABASE_NAME = 'jok-test-db';
process.env.PORT = 8242;

const chai = require('chai');
const chaiHttp = require('chai-http');
const Knex = require('knex');
const knexConfig = require('../knexfile');
const server = require('../src/server');
const mocha = require('mocha');
const _ = require('lodash');

const should = chai.should();
const knex = Knex(knexConfig.test);

chai.use(chaiHttp);

mocha.describe('API', () => {

  mocha.before(() => knex.migrate.latest()
    .then(() => knex.seed.run()));

  mocha.after(() => knex.migrate.rollback());

  describe('GET /species', () => {
    it('should list ALL species on /species GET', () => {
      return chai.request(server)
        .get('/v1/species')
        .then((res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
        })
        .catch((err) => {
          throw err;
        });
    });
  });

  describe('POST /sightings', () => {
    it('should add a SINGLE sighting when all fields are provided', () => {
      const tSpecies = 'mallard';
      const tCount = 2;
      const tDesc = 'scary duck';
      const tDateTime = '2018-02-18T08:25:41.570Z';
      const tLatitude = 42.1337;
      const tLongitude = -3.141592;

      return chai.request(server)
        .post('/v1/sightings')
        .send({
          species: tSpecies,
          count: tCount,
          description: tDesc,
          dateTime: tDateTime,
          latitude: tLatitude,
          longitude: tLongitude,
        })
        .then((res) => {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.should.have.property('duckbeResult');
          res.body.species.should.equal(tSpecies);
          res.body.count.should.equal(tCount);
          res.body.description.should.equal(tDesc);
          res.body.dateTime.should.equal(tDateTime);
          res.body.latitude.should.equal(tLatitude);
          res.body.longitude.should.equal(tLongitude);
        })
        .catch((err) => {
          throw err;
        });
    });

    it('should add a SINGLE sighting with the minimum data provided', () => {
      const tSpecies = 'redhead';
      const tCount = 10;

      return chai.request(server)
        .post('/v1/sightings')
        .send({
          species: tSpecies,
          count: tCount,
        })
        .then((res) => {
          res.should.have.status(201);
          res.should.be.json;
          res.should.be.a('object');
          res.body.should.have.property('id');
          res.body.should.have.property('duckbeResult');
          res.body.species.should.equal(tSpecies);
          res.body.count.should.equal(tCount);
          const dt = res.body.dateTime;
          should.equal(dt, new Date(dt).toISOString());
          should.equal(res.body.description, null);
          should.equal(res.body.latitude, null);
          should.equal(res.body.longitude, null);
        });
    });

    it('should add a SINGLE sighting and replace user provided id with server\'s own id', () => {
      const tId = 31545;

      return chai.request(server)
        .post('/v1/sightings')
        .send({
          id: tId,
          species: 'mallard',
          count: 1,
        })
        .then((res) => {
          res.should.have.status(201);
          should.not.equal(res.body.id, tId);
        });
    });

    it('should add a SINGLE sighting with speciesId provided instead of species', () => {
      const expectedSpecies = 'gadwall';
      const tSpeciesId = 3;
      const tCount = 10;

      return chai.request(server)
        .post('/v1/sightings')
        .send({
          speciesId: tSpeciesId,
          count: tCount,
        })
        .then((res) => {
          res.should.have.status(201);
          res.should.be.json;
          res.should.be.a('object');
          res.body.should.have.property('id');
          res.body.should.have.property('duckbeResult');
          res.body.species.should.equal(expectedSpecies);
          res.body.count.should.equal(tCount);
        });
    });

    it('should FAIL to add sighting if provided species does not exist in DB', () => {
      const tSpecies = 'bogus species';

      return chai.request(server)
        .post('/v1/sightings')
        .send({
          species: tSpecies,
          count: 10,
        })
        .then((res) => {
          res.should.have.status(404);
          res.should.be.a('object');
          res.body.message.should.include('ValidationError');
          res.body.message.should.include(tSpecies);
          res.body.data.should.include('species.length');
        });
    });

    it('should FAIL to add sighting if provided speciesId does not exist in DB', () => {
      return chai.request(server)
        .post('/v1/sightings')
        .send({
          speciesId: 316,
          count: 10,
        })
        .then((res) => {
          res.should.have.status(404);
          res.should.be.a('object');
          res.body.message.should.include('TypeError');
          res.body.message.should.include('speciesId not found');
          res.body.should.have.property('data');
        });
    });

    it('should FAIL to add sighting if provided speciesId is in wrong format', () => {
      return chai.request(server)
        .post('/v1/sightings')
        .send({
          speciesId: 'dyjhksh',
          count: 5,
        })
        .then((res) => {
          res.should.have.status(400);
          res.should.be.a('object');
          res.body.message.should.include('ValidationError');
          res.body.message.should.include('wrong format');
          res.body.data.should.include('speciesId is NaN');
        });
    });

    it('should FAIL to add sighting if no data about species is provided', () => {
      return chai.request(server)
        .post('/v1/sightings')
        .send({
          count: 10,
        })
        .then((res) => {
          res.should.have.status(400);
          res.should.be.a('object');
          res.body.message.should.include('ValidationError');
          res.body.data.should.include('species');
        });
    });

    it('should FAIL to add sighting if data about count is provided', () => {
      return chai.request(server)
        .post('/v1/sightings')
        .send({
          species: 'mallard',
        })
        .then((res) => {
          res.should.have.status(400);
          res.should.be.a('object');
          res.body.message.should.include('ValidationError');
          res.body.data.count[0].message.should.include('required');
        });
    });

    it('should FAIL to add sighting if provided count is less than zero', () => {
      return chai.request(server)
        .post('/v1/sightings')
        .send({
          species: 'mallard',
          count: 0,
        })
        .then((res) => {
          res.should.have.status(400);
          res.should.be.a('object');
          res.body.message.should.include('ValidationError');
          res.body.data.count[0].message.should.include('>= 1');
        });
    });

    it('should FAIL to add sighting if provided count is wrong type', () => {
      return chai.request(server)
        .post('/v1/sightings')
        .send({
          species: 'mallard',
          count: 'tej',
        })
        .then((res) => {
          res.should.have.status(400);
          res.should.be.a('object');
          res.body.message.should.include('ValidationError');
          res.body.data.count[0].message.should.include('integer');
        });
    });

    it('should FAIL to add sighting if provided latitude is wrong type', () => {
      return chai.request(server)
        .post('/v1/sightings')
        .send({
          species: 'mallard',
          count: 1,
          latitude: 'cat',
          longitude: 22.5315,
        })
        .then((res) => {
          res.should.have.status(400);
          res.should.be.a('object');
          res.body.message.should.include('ValidationError');
          res.body.message.should.include('not numbers');
        });
    });

    it('should FAIL to add sighting if provided longitude is wrong type', () => {
      return chai.request(server)
        .post('/v1/sightings')
        .send({
          species: 'mallard',
          count: 1,
          latitude: 63.315,
          longitude: "cat",
        })
        .then((res) => {
          res.should.have.status(400);
          res.should.be.a('object');
          res.body.message.should.include('ValidationError');
          res.body.message.should.include('not numbers');
        });
    });

    it('should FAIL to add sighting if provided latitude is illegal value', () => {
      return chai.request(server)
        .post('/v1/sightings')
        .send({
          species: 'mallard',
          count: 1,
          latitude: 633.315,
          longitude: 21.351,
        })
        .then((res) => {
          res.should.have.status(400);
          res.should.be.a('object');
          res.body.message.should.include('ValidationError');
          res.body.data.should.include('ISO 6709:2008');
        });
    });

    it('should FAIL to add sighting if provided longitude is illegal value', () => {
      return chai.request(server)
        .post('/v1/sightings')
        .send({
          species: 'mallard',
          count: 1,
          latitude: 63.315,
          longitude: 180.000,
        })
        .then((res) => {
          res.should.have.status(400);
          res.should.be.a('object');
          res.body.message.should.include('ValidationError');
          res.body.data.should.include('ISO 6709:2008');
        });
    });
  });

  describe('GET /sightings', () => {
    mocha.before(() => knex('Sighting').del()
      .then(() => knex('Sighting').insert([{
        speciesId: 3,
        description: 'Helsinki duck',
        dateTime: '2016-10-01T01:01:00Z',
        count: 1,
        location: knex.raw("extensions.ST_GeomFromText('POINT(24.9412669 60.1695857)', 4326)"),
      },
      {
        speciesId: 4,
        description: 'Hervanta duck',
        dateTime: '2017-10-01T01:01:00Z',
        count: 1,
        location: knex.raw("extensions.ST_GeomFromText('POINT(23.8541406 61.4482511)', 4326)"),
      },
      {
        speciesId: 1,
        description: 'Hämeenlinna duck',
        dateTime: '2012-10-01T01:01:00Z',
        count: 1,
        location: knex.raw("extensions.ST_GeomFromText('POINT(24.4611430 60.9976933)', 4326)"),
      },
      {
        speciesId: 5,
        description: 'Tampere duck',
        dateTime: '2016-12-13T12:05:00Z',
        count: 1,
        location: knex.raw("extensions.ST_GeomFromText('POINT(23.7638677 61.4976713)', 4326)"),
      }])));

    mocha.after(() => knex('Sighting').del());

    it('should list ALL sightings on /sightings GET', () => {
      return chai.request(server)
        .get('/v1/sightings')
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          const descriptions = _.map(res.body, (sighting) => _.get(sighting, 'description'));
          descriptions.should.include('Tampere duck');
        });
    });

    it('should list ALL sightings WITHIN provided distance of provided coordinates', () => {
      const tLongitude = 23.763776;
      const tLatitude = 61.497405;
      const tDistance = 100;

      return chai.request(server)
        .get('/v1/sightings')
        .query({ longitude: tLongitude, latitude: tLatitude, distance: tDistance })
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          const descriptions = _.map(res.body, sighting => _.get(sighting, 'description'));
          descriptions.should.include('Tampere duck');
          descriptions.should.include('Hervanta duck');
          descriptions.should.include('Hämeenlinna duck');
          descriptions.should.not.include('Helsinki duck');
        });
    });

    it('should fail to list any sightings when latitude is entered incorrectly', () => {
      const tLongitude = 23.763776;
      const tLatitude = 'thisShouldNotWork';
      const tDistance = 100;

      return chai.request(server)
        .get('/v1/sightings')
        .query({ longitude: tLongitude, latitude: tLatitude, distance: tDistance })
        .then((res) => {
          res.should.have.status(400);
          res.body.message.should.include('ValidationError');
          res.body.data.should.include('isNaN');
        });
    });

    it('should fail to list any sightings when longitude is an illegal value', () => {
      const tLongitude = -233.763776;
      const tLatitude = 12.2562;
      const tDistance = 100;

      return chai.request(server)
        .get('/v1/sightings')
        .query({ longitude: tLongitude, latitude: tLatitude, distance: tDistance })
        .then((res) => {
          res.should.have.status(400);
          res.body.message.should.include('ValidationError');
          res.body.data.should.include('ISO 6709:2008');
        });
    });

    it('should fail to list any sightings when distance is an illegal value', () => {
      const tLongitude = -23.763776;
      const tLatitude = 12.2562;
      const tDistance = -50;

      return chai.request(server)
        .get('/v1/sightings')
        .query({ longitude: tLongitude, latitude: tLatitude, distance: tDistance })
        .then((res) => {
          res.should.have.status(400);
          res.body.message.should.include('ValidationError');
          res.body.data.should.include('should be a number and greater than 0');
        });
    });
  });
});
