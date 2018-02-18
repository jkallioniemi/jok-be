const axios = require('axios');
const { duckBe } = require('../../config/vars');

exports.getSpecies = async () => {
  try {
    const response = await axios.get(`${duckBe.uri}${duckBe.species}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

exports.getSightings = async () => {
  try {
    const response = await axios.get(`${duckBe.uri}${duckBe.sightings}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

exports.postSightings = async (sighting) => {
  try {
    const response = await axios.post(`${duckBe.uri}${duckBe.sightings}`, sighting);
    return response.data;
  } catch (error) {
    throw error;
  }
};
