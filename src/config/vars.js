const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../../.env'),
  sample: path.join(__dirname, '../../.env.example'),
});

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  duckBe: {
    uri: process.env.DUCK_BE_URI,
    sightings: process.env.DUCK_BE_SIGHTINGS,
    species: process.env.DUCK_BE_SPECIES,
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
};
