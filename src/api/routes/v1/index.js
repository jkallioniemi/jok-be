const Sighting = require('../../models/Sighting');
const Species = require('../../models/Species');
const express = require('express');
const _ = require('lodash');
const apiController = require('../../controllers/jokbeControllers');
const _u = require('../../utils/miscUtils');
const { raw } = require('objection');
const APIError = require('../../utils/APIError');

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
* @apiParam {Number} [latitude] Latitude of coordinates to use for filtering by distance
* @apiParam {Number} [longitude] Longitude of coordinates to use for filtering by distance
* @apiParam {Number} [distance] Maximum distance from coordinates, for filtering sightings (in km)
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
router.get('/sightings', (req, res) => apiController.getSightingsRoute(req, res));

/**
* @api {post} /v1/sightings Create a sighting
* @apiVersion 1.0.0
* @apiName CreateSighting
*
* @apiParam {String} [dateTime=current time] An ISO timestamp
* @apiParam {String} [description=null] A description of the sighting
* @apiParam {Number} count The number of ducks observed (required, must be > 0)
* @apiParam {String} species The species of the observed duck(s)
* @apiParam {Number} speciesId Alternative to species, only one has to be specified
* @apiParam {Number} [latitude=null] Latitude of observed duck(s)
* @apiParam {Number} [longitude=null] Longitude of observed duck(s)
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
router.post('/sightings', (req, res) => apiController.postSightingsRoute(req, res));

module.exports = router;
