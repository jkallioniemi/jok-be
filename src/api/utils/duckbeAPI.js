const axios = require('axios');
const { duckBe } = require('../../config/vars');

exports.getSpecies = async (sighting, next) => {
  try {
    const response = await axios.get(`${duckBe.uri}${duckBe.species}`);
    return response.data;
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.getSightings = async (next) => {
  try {
    const response = await axios.get(`${duckBe.uri}${duckBe.sightings}`);
    return response.data;
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.postSightings = async (sighting, next) => {
  try {
    const response = await axios.post(`${duckBe.uri}${duckBe.sightings}`, sighting);
    return response.data;
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
