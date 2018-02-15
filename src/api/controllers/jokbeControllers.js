const Sighting = require('../models/Sighting');
const Species = require('../models/Species');
const duckbeAPI = require('../utils/duckbeAPI');
const APIError = require('../utils/APIError');
const _u = require('../utils/miscUtils');
const _ = require('lodash');

exports.getSpeciesIdByName = async (speciesName) => {
  const species = await Species
    .query()
    .select('id')
    .where('name', speciesName);
  if (!species.length) {
    throw new APIError({
      errorMessage: `ValidationError: Species ${speciesName} not found in the database.`,
      errorData: 'species.length is falsy',
      statusCode: 400,
    });
  }

  return species;
};

exports.addSightingToDB = async (newSighting) => {
  console.log(newSighting);
  try {
    return await Sighting
      .query()
      .insert(newSighting)
      .returning('*');
  } catch (err) {
    throw new APIError({
      errorMessage: `${_u.getErrorType(err.type)}: One or more fields were incorrectly formatted.`,
      errorData: _u.getErrorData(err),
      statusCode: 400,
    });
  }
};

exports.addSightingToOldDB = async (newSighting) => {
  console.log(newSighting);
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

exports.addSighting = async (newSighting) => {
  const result = await exports.addSightingToDB(_.omit(newSighting, 'species'));
  result.duckbeResult = await exports.addSightingToOldDB(_.omit(result, 'speciesId'));

  return result;
};

exports.getSpeciesId = async (body) => {
  const speciesInfo = { speciesId: parseInt(body.speciesId, 10) };
  const isNaN = Number.isNaN(speciesInfo.speciesId);

  if (!isNaN) {
    try {
      const nameQuery = await Species
        .query()
        .select('name')
        .findById(speciesInfo.speciesId);
      speciesInfo.speciesName = nameQuery.name;
    } catch (error) {
      throw new APIError({
        errorMessage: `${_u.getErrorType(error)}: Provided speciesId not found in database.`,
        errorData: _u.getErrorData(error),
        statusCode: _u.getStatusCode(error),
      });
    }
  } else if (isNaN && body.species) {
    try {
      const species = await exports.getSpeciesIdByName(body.species);
      speciesInfo.speciesId = species[0].id;
      speciesInfo.speciesName = body.species;
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
  return speciesInfo;
};
