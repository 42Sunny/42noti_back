const axios = require('axios');
const env = require('../config');

const END_POINT_42_API = 'https://api.intra.42.fr';

module.exports = {
  get42Token: async () => {
    const requestData = {
      grant_type: 'client_credentials',
      client_id: env.fortytwoClientId,
      client_secret: env.fortytwoClientSecret,
    };
    try {
      const response = await axios(`${END_POINT_42_API}/oauth/token`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(requestData),
      });
      if (response) {
        return response.data;
      }
    } catch (err) {
      console.error(err);
      // throw err;
    }
  }
};
