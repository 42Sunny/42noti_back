const axios = require('axios');
const { get42Token } = require('./42auth');

const END_POINT_42_API = 'https://api.intra.42.fr';

const get42Api = async path => {
  try {
    const { access_token, token_type } = await get42Token();
    console.log(`${token_type} ${access_token}`);
    const response = await axios(`${END_POINT_42_API}/${path}`, {
      method: 'GET',
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });
    if (response) {
      // console.log(response.data);
      return response.data;
    }
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  get42Campus: async () => {
    const path = `/v2/campus`;
    try {
      const data = await get42Api(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
  get42User: async id => {
    const path = `/v2/users/${id}`;
    try {
      const data = await get42Api(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
  get42CampusEvents: async campusId => {
    const path = `/v2/campus/${campusId}/events`;
    try {
      const data = await get42Api(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
  get42UserEvents: async userId => {
    const path = `/v2/users/${userId}/events`;
    try {
      const data = await get42Api(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
};
