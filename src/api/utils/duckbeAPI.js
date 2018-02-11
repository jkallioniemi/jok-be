const axios = require('axios');
const { duckBe } = require('../../config/vars');

exports.getSightings = async (next) => {
  try {
    const response = await axios.get(`${duckBe.uri}${duckBe.sightings}`);
    const { data } = response;
    return data;
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
