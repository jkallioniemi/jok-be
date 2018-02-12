const express = require('express');
const duckbeAPI = require('../../../utils/duckbeAPI');

const router = express.Router();

router.get('/species', (req, res) => {
  duckbeAPI.getSpecies()
    .then(data => res.send(data))
    .catch(error => res.status(418).send(error));
});

router.get('/sightings', (req, res) => {
  duckbeAPI.getSightings()
    .then(data => res.send(data))
    .catch(error => res.status(418).send(error));
});

router.post('/sightings', (req, res) => {
  duckbeAPI.postSightings(req.body)
    .then(response => res.send(response))
    .catch(error => res.status(418).send(error));
});

module.exports = router;
