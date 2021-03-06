const Sighting = require('../models/Sighting');
const Species = require('../models/Species');
const duckbeAPI = require('../utils/duckbeAPI');
const APIError = require('../utils/APIError');
const _u = require('../utils/miscUtils');
const _ = require('lodash');
const { raw } = require('objection');

exports.getSpeciesRoute = async (req, res) => {
  try {
    const speciesResult = await Species.query();
    res.send(speciesResult);
  } catch (error) {
    _u.sendError(res, error);
  }
};

exports.getSightingsRoute = async (req, res) => {
  try {
    let sightingsResult;
    if (req.query.longitude && req.query.latitude && req.query.distance) {
      const coordinates = getCoordinatesFromBody(req.query);
      const dist = parseFloat(req.query.distance);
      if (!Number.isFinite(dist) || dist <= 0) {
        _u.sendError(res, new APIError({
          errorMessage: 'ValidationError: provided distance is incorrectly formatted!',
          errorData: 'Distance should be a number and greater than 0.',
          statusCode: 400,
        }));
        return;
      }
      const distInMeters = dist * 1000;

      const geoObject = {
        type: 'Point',
        coordinates: [coordinates.longitude, coordinates.latitude],
        crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      };

      const geoJSON = JSON.stringify(geoObject);

      sightingsResult = await Sighting
        .query()
        .select('*', raw('ST_AsGeoJSON(location) AS gjson'))
        .where(raw('ST_DWithin(location, ST_GeomFromGeoJSON(?), ?)', geoJSON, distInMeters))
        .eager('species');
    } else {
      sightingsResult = await Sighting
        .query()
        .select('*', raw('ST_AsGeoJSON(location) AS gjson'))
        .eager('species');
    }

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
};

exports.postSightingsRoute = (req, res) => {
  getSpeciesIdFromBody(req.body)
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
      addSightingToDB(sightingToAdd)
        .then((result) => {
          const fieldsToOmitFromOldDB = ['speciesId', 'location', 'longitude', 'latitude'];
          addSightingToOldDB(_.omit(result, fieldsToOmitFromOldDB))
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
};

const addSightingToDB = async (newSighting) => {
  let creationResult;
  // Coordinates are stored as a PostGIS geometry on the DB, adding them is handled separately
  // and species is stored as a speciesId that is a relation to the Species table.
  const fieldsToOmitFromDB = ['latitude', 'longitude', 'species'];
  const fieldsToOmitFromResponse = ['speciesId', 'location'];
  try {
    creationResult = await Sighting
      .query()
      .insert(_.omit(newSighting, fieldsToOmitFromDB))
      .returning('*');
  } catch (err) {
    throw new APIError({
      errorMessage: `${_u.getErrorType(err.type)}: One or more fields were incorrectly formatted.`,
      errorData: _u.getErrorData(err),
      statusCode: 400,
    });
  }

  // FIXME: The proper way to do this would be to combine these two queries into one.
  if (newSighting.latitude && newSighting.longitude) {
    const coordinates = getCoordinatesFromBody(newSighting);
    let locationPatchResult;
    try {
      const geoObject = {
        type: 'Point',
        coordinates: [coordinates.longitude, coordinates.latitude],
        crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      };

      locationPatchResult = await Sighting
        .query()
        .patch({ location: raw('ST_GeomFromGeoJSON(?)', JSON.stringify(geoObject)) })
        .where('id', creationResult.id);
    } catch (err) {
      throw new APIError({
        errorMessage: `${_u.getErrorType(err.type)}: Something went wrong with adding coordinates.`,
        errorData: _u.getErrorData(err),
        statusCode: 400,
      });
    }

    if (!locationPatchResult) {
      throw new APIError({
        errorMessage: 'LocationNotAddedError: Something went wrong with adding coordinates.',
        errorData: 'locationPatchResult is falsy, i.e. database indicates 0 records were patched.',
        statusCode: 400,
      });
    }
  }

  // locationPatchResult is just the number of rows that the DB reported as being changed by the
  // query. If everything was successful, we can just respond with the coords the user originally
  // provided in their request.
  creationResult.latitude = _.get(newSighting, 'latitude', null);
  creationResult.longitude = _.get(newSighting, 'longitude', null);
  creationResult.species = newSighting.species;
  return _.omit(creationResult, fieldsToOmitFromResponse);
};

const addSightingToOldDB = async (newSighting) => {
  try {
    return await duckbeAPI.postSightings(newSighting);
  } catch (err) {
    throw new APIError({
      errorMessage: 'DuckBeError: An error occurred while communicating with duck-be API!',
      errorData: _u.getErrorData(err),
      statusCode: 502,
    });
  }
};

const getCoordinatesFromBody = (sighting) => {
  /**
   * Validates coordinates and returns an object with a 'latitude' key and a 'longitude' key.
   * @param {object} - object that has a 'latitude' key and a 'longitude' key
   */
  const lat = parseFloat(sighting.latitude);
  const lon = parseFloat(sighting.longitude);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new APIError({
      errorMessage: 'ValidationError: One or both coordinates are not numbers.',
      errorData: '(Number.isNaN(latitude) || Number.isNaN(longitude)) evaluated to true',
      statusCode: 400,
    });
  }


  // ISO standard 6709:2008 says that longitude should be between -180 and +180,
  // with the negative end being inclusive and positive end exclusive.
  if (!((lat >= -90 && lat <= 90) && (lon >= -180 && lon < 180))) {
    throw new APIError({
      errorMessage: 'ValidationError: One or both coordinates incorrectly formatted.',
      errorData: 'failed check -90 <= latitude <= 90 && -180 <= longitude < 180 (ISO 6709:2008)',
      statusCode: 400,
    });
  }

  return { latitude: lat, longitude: lon };
};

const getSpeciesIdByName = async (speciesName) => {
  const species = await Species
    .query()
    .select('id')
    .where('name', speciesName);
  if (!species.length) {
    throw new APIError({
      errorMessage: `ValidationError: Species ${speciesName} not found in the database.`,
      errorData: 'species.length is falsy',
      statusCode: 404,
    });
  }

  return species;
};

const getSpeciesIdFromBody = async (body) => {
  /**
   * Gets speciesId based on a string with the species name, or simply the speciesId integer
   * provided by user.
   * @param {object} - Object that has either a 'species' or a 'speciesId' key
   */
  const speciesData = { id: parseInt(body.speciesId, 10) };
  const isNaN = Number.isNaN(speciesData.id);

  if (!isNaN) {
    try {
      // If the user provided us with a speciesId integer, we need the name of the species
      // for the response we are going to be sending back.
      const nameQuery = await Species
        .query()
        .select('name')
        .findById(speciesData.id);
      speciesData.name = nameQuery.name;
    } catch (error) {
      throw new APIError({
        errorMessage: `${_u.getErrorType(error)}: Provided speciesId not found in database.`,
        errorData: _u.getErrorData(error),
        statusCode: 404,
      });
    }
  } else if (isNaN && body.species) {
    try {
      // If the user provided us with a species name as a string, we need to check that the
      // species exists and get the ID for adding their sighting to the database.
      const species = await getSpeciesIdByName(body.species);
      speciesData.id = species[0].id;
      speciesData.name = body.species;
    } catch (error) {
      throw error;
    }
  } else if (isNaN && !body.species) {
    throw new APIError({
      errorMessage: 'ValidationError: speciesId is not a number and there is no species in ' +
                    'the body of the request, or it is in the wrong format.',
      errorData: 'speciesId is NaN and body.species is falsy',
      statusCode: 400,
    });
  }
  return speciesData;
};
