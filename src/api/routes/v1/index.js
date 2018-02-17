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

router.get('/species', async (req, res) => {
  const speciesResult = await Species.query();
  res.send(speciesResult);
});

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

      apiController.addSighting(sightingToAdd)
        .then(result => res.status(201).send(result))
        .catch(err => _u.sendError(res, err));
    })
    .catch(err => _u.sendError(res, err));
});

module.exports = router;
