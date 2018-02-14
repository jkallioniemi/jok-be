const Sighting = require('../../models/Sighting');
const express = require('express');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

router.get('/sightings', async (req, res) => {
  const sightings = await Sighting.query();
  res.send(sightings);
});

router.post('/sightings', async (req, res) => {
  const newSighting = {
    speciesId: req.body.species,
    description: req.body.description,
    dateTime: req.body.dateTime,
    count: req.body.count,
  };

  await Sighting
    .query()
    .insert(newSighting)
    .then(result => res.send(result))
    .catch(err => res.status(418).send(err));
});

module.exports = router;
