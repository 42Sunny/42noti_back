const axios = require('axios');
const env = require('../config');
const cache = require('./cache');

const END_POINT_42_API = 'https://api.intra.42.fr';

const get42Token = async () => {
  const requestData = {
    grant_type: 'client_credentials',
    client_id: env.fortytwoApi.clientId,
    client_secret: env.fortytwoApi.clientSecret,
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
  }
};
module.exports = {
  get42TokenCache: async () => {
    const token = cache.get('42token');
    if (token) {
      console.log('get42TokenCache: has token');
      return token;
    }
    const data = await get42Token();
    console.log('get42TokenCache');
    console.log(data)
    cache.set('42token', data, data.expires_in);
    return data;
  }
};
