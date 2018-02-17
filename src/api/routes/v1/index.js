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
  const species = await Species.query();
  res.send(species);
});

router.get('/sightings', async (req, res) => {
  try {
    const sightings = await Sighting
      .query()
      .select('*', raw('ST_AsGeoJSON(location) AS gjson'))
      .eager('species');

    const sightingsResponse = _.map(sightings, (sighting) => {
      const newSighting = _.omit(sighting, ['speciesId', 'location', 'gjson']);

      const gjson = JSON.parse(sighting.gjson);

      newSighting.longitude = _.get(gjson, 'coordinates[0]', null);
      newSighting.latitude = _.get(gjson, 'coordinates[1]', null);

      newSighting.species = sighting.species.name;
      return newSighting;
    });

    res.send(sightingsResponse);
  } catch (err) {
    _u.sendError(res, err);
  }
});

router.post('/sightings', (req, res) => {
  apiController.getSpeciesId(req.body)
    .then((speciesInfo) => {
      const newSighting = {
        species: speciesInfo.speciesName,
        speciesId: speciesInfo.speciesId,
        description: req.body.description,
        dateTime: req.body.dateTime,
        count: req.body.count,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      };

      apiController.addSighting(newSighting)
        .then(result => res.send(result))
        .catch(err => _u.sendError(res, err));
    })
    .catch(err => _u.sendError(res, err));
});

module.exports = router;
