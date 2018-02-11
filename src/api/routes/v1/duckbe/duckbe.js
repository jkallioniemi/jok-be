const express = require('express');
const duckbeAPI = require('../../../utils/duckbeAPI');

const router = express.Router();

router.get('/sightings', (req, res) => {
  duckbeAPI.getSightings()
    .then(data => res.send(data))
    .catch(error => res.status(418).send(error));
});

module.exports = router;
