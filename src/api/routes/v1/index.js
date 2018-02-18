const Sighting = require('../../models/Sighting');
const Species = require('../../models/Species');
const express = require('express');
const _ = require('lodash');
const apiController = require('../../controllers/jokbeControllers');
const _u = require('../../utils/miscUtils');
const { raw } = require('objection');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
* @api {get} /v1/species Retrieve all species
* @apiVersion 1.0.0
* @apiName GetAllSpecies
*
* @apiExample {js} Example usage:
* $http.get(url)
*   .success((res, status) => doSomethingHere())
*   .error((err, status) => doSomethingHere());
*
* @apiSuccess {Number} id The species id
* @apiSuccess {String} name The species name
*
* @apiSuccessExample {json} Success response:
*     HTTP 200 OK
*     [{
*        "id": 1,
*        "name": "mallard"
*      },
*      {
*        "id": 2,
*        "name": "redhead"
*     }]
*
*/
router.get('/species', async (req, res) => {
  const speciesResult = await Species.query();
  res.send(speciesResult);
});

/**
* @api {get} /v1/sightings Retrieve all sightings
* @apiVersion 1.0.0
* @apiName GetAllSightings
*
* @apiExample {js} Example usage:
* $http.get(url)
*   .success((res, status) => doSomethingHere())
*   .error((err, status) => doSomethingHere());
*
* @apiSuccess {Number} id The sighting's id
* @apiSuccess {String} dateTime An ISO 8601 compliant timestamp
* @apiSuccess {String} description An optional description of the sighting, null if not available
* @apiSuccess {Number} count The number of ducks observed in sighting
* @apiSuccess {String} species The species of the observed duck(s)
* @apiSuccess {Number} longitude Longitude coordinate of the sighting, null if not available
* @apiSuccess {Number} latitude Latitude coordinate of the sighting, null if not available
*
* @apiSuccessExample {json} Success response:
*     HTTP 200 OK
*     [ ...,
*      {
*        "id": 7,
*        "dateTime": "2016-12-11T01:01:00.000Z",
*        "description": "KWAAK!!!1",
*        "count": 5,
*        "species": "canvasback",
*        "longitude": null,
*        "latitude": null
*      },
*      {
*        "id": 8,
*        "dateTime": "2016-12-12T12:12:12.000Z",
*        "description": null,
*        "count": 100,
*        "species": "mallard",
*        "longitude": 33.53535,
*        "latitude": 64.13436
*      },
*       ... ]
*
*/
router.get('/sightings', async (req, res) => {
  try {
    const sightingsResult = await Sighting
      .query()
      .select('*', raw('ST_AsGeoJSON(location) AS gjson'))
      .eager('species');

    // Location is stored as a PostGIS geometry in the DB, so omit it from the response and add
    // the lat and lon coordinates from the JSON that ST_AsGeoJSON produces.
    const sightingsResponse = _.map(sightingsResult, (sighting) => {
      const newSighting = _.omit(sighting, ['speciesId', 'location', 'gjson']);

      const geoJSON = JSON.parse(_.get(sighting, 'gjson'));

      newSighting.longitude = _.get(geoJSON, 'coordinates[0]', null);
      newSighting.latitude = _.get(geoJSON, 'coordinates[1]', null);

      newSighting.species = sighting.species.name;
      return newSighting;
    });

    res.send(sightingsResponse);
  } catch (err) {
    _u.sendError(res, err);
  }
});

/**
* @api {post} /v1/sightings Create a sighting
* @apiVersion 1.0.0
* @apiName CreateSighting
*
* @apiExample {js} Example usage:
* $data = {
*   "description": "duck bullies!",
*   "count": 3,
*   "species": "mallard"    // instead of 'species', 'speciesId' (integer) can be provided
*   "longitude": 42.001337,
*   "latitude": 3.141592,
*  }
* $http.post(url, data)
*   .success((res, status) => doSomethingHere())
*   .error((err, status) => doSomethingHere());
*
* @apiSuccess {Number} id The sighting's id
* @apiSuccess {String} dateTime An ISO timestamp of the created sighting, current time if omitted
* @apiSuccess {String} description An optional description of the sighting, null if omitted
* @apiSuccess {Number} count The number of ducks in the created sighting
* @apiSuccess {String} species The species of the created duck
* @apiSuccess {Number} longitude Longitude coordinate of the created sighting, null if omitted
* @apiSuccess {Number} latitude Latitude coordinate of the created sighting, null if omitted
* @apiSuccess {Object} duckbeResult duck-be API's response to also creating the sighting there
*
* @apiSuccessExample {json} Success response:
*     HTTP 200 OK
*     [{
*        "id": 7,
*        "dateTime": "2016-12-11T01:01:00.000Z",
*        "description": "KWAAK!!!1",
*        "count": 5,
*        "species": "canvasback",
*        "longitude": null,
*        "latitude": null,
*        "duckbeResult": {
*           "description": "KWAAK!!!1",
*           "dateTime": "2016-12-11T01:01:00.000Z",
*           "count": 5,
*           "id": 42,
*           "species": "canvasback"
*         }
*      }]
*
*/
router.post('/sightings', (req, res) => {
  // Most of this logic has been externalized to jokbeControllers.js because it is so long.
  apiController.getSpeciesIdFromBody(req.body)
    .then((speciesData) => {
      const sightingToAdd = {
        species: speciesData.name,
        speciesId: speciesData.id,
        description: req.body.description,
        dateTime: req.body.dateTime,
        count: req.body.count,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      };

        // Old DB doesn't support these pieces of data.
      apiController.addSightingToDB(sightingToAdd)
        .then((result) => {
          const fieldsToOmitFromOldDB = ['speciesId', 'location', 'longitude', 'latitude'];
          apiController.addSightingToOldDB(_.omit(result, fieldsToOmitFromOldDB))
            .then((duckResult) => {
              const resultToSend = result;
              resultToSend.duckbeResult = duckResult;
              res.status(201).send(resultToSend);
            })
            .catch((duckResult) => {
              const resultToSend = result;
              resultToSend.duckbeResult = duckResult;
              res.status(201).send(resultToSend);
            });
        })
        .catch(error => _u.sendError(res, error));
    })
    .catch(err => _u.sendError(res, err));
});

module.exports = router;
