const axios = require('axios');
const env = require('../config');
const cache = require('./cache');
const logger = require('./winston');

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
    logger.error(err);
  }
};

const get42CachedToken= async () => {
  const token = cache.get('42token');
  if (token) {
    console.log('get42CachedToken: has token');
    return token;
  }
  const data = await get42Token();
  console.log('get42CachedToken');
  console.log(data)
  cache.set('42token', data, data.expires_in);
  return data;
};

module.exports = {
  get42CachedToken,
};
